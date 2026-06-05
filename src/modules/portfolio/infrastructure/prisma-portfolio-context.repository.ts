import { Injectable } from '@nestjs/common';
import type { Prisma, PortfolioActionBias, PortfolioExposureSource, PortfolioRiskLevel } from '@prisma/client';
import { PrismaService } from '@/database/prisma.service';
import type { PortfolioContextRepository } from '../domain/portfolio.repositories';
import type {
  PortfolioAction,
  PortfolioAccountRecord,
  PortfolioContextRecord,
  PortfolioExposureSource as PortfolioExposureSourceValue,
  PortfolioFundHoldingRecord,
  PortfolioInvestorPreferenceRecord,
  PortfolioRiskLevel as PortfolioRiskLevelValue,
  PortfolioStockHoldingRecord,
  PortfolioThemeExposureRecord,
  PortfolioWatchlistItemRecord,
} from '../domain/portfolio.types';

type InvestorPreferenceRow = {
  owner: string;
  horizon: string;
  core_view: string;
  robotics_max_weight_percent: { toNumber(): number } | number;
  single_stock_max_drawdown_percent: { toNumber(): number } | number;
  portfolio_max_drawdown_percent: { toNumber(): number } | number;
  core_holdings: unknown;
  satellite_holdings: unknown;
  rebalance_cadence: string;
  cash_plan: string;
  trim_order: unknown;
};

@Injectable()
export class PrismaPortfolioContextRepository implements PortfolioContextRepository {
  constructor(private readonly prisma: PrismaService) {}

  async upsertPrimaryContext(input: PortfolioContextRecord): Promise<PortfolioContextRecord> {
    const account = await this.prisma.$transaction(async (tx) => {
      const accountRecord = await tx.portfolioAccount.upsert({
        where: { owner_name: { owner: input.account.owner, name: input.account.name } },
        create: {
          owner: input.account.owner,
          name: input.account.name,
          accountType: mapAccountTypeToPrisma(input.account.accountType),
          totalAssetValue: input.account.totalAssetValue,
          visibleAssetValue: input.account.visibleAssetValue,
          cashAmount: input.account.cashAmount,
          positionLevel: input.account.positionLevel,
          isPrimary: input.account.isPrimary ?? true,
        },
        update: {
          accountType: mapAccountTypeToPrisma(input.account.accountType),
          totalAssetValue: input.account.totalAssetValue,
          visibleAssetValue: input.account.visibleAssetValue,
          cashAmount: input.account.cashAmount,
          positionLevel: input.account.positionLevel,
          isPrimary: input.account.isPrimary ?? true,
        },
      });

      await tx.portfolioAccount.updateMany({
        where: { owner: input.account.owner, id: { not: accountRecord.id } },
        data: { isPrimary: false },
      });

      await tx.portfolioHolding.deleteMany({
        where: {
          accountId: accountRecord.id,
          ...(input.stockHoldings.length === 0 ? {} : { symbol: { notIn: input.stockHoldings.map((holding) => holding.symbol) } }),
        },
      });
      for (const holding of input.stockHoldings) {
        await tx.portfolioHolding.upsert({
          where: { accountId_symbol: { accountId: accountRecord.id, symbol: holding.symbol } },
          create: stockHoldingInput(accountRecord.id, holding),
          update: stockHoldingInput(accountRecord.id, holding),
        });
      }

      await tx.fundHolding.deleteMany({
        where: {
          accountId: accountRecord.id,
          ...(input.fundHoldings.length === 0 ? {} : { NOT: input.fundHoldings.map((holding) => ({ name: holding.name, theme: holding.theme })) }),
        },
      });
      for (const holding of input.fundHoldings) {
        await tx.fundHolding.upsert({
          where: { accountId_name_theme: { accountId: accountRecord.id, name: holding.name, theme: holding.theme } },
          create: fundHoldingInput(accountRecord.id, holding),
          update: fundHoldingInput(accountRecord.id, holding),
        });
      }

      await tx.themeExposure.deleteMany({
        where: {
          accountId: accountRecord.id,
          ...(input.themeExposures.length === 0 ? {} : {
            NOT: input.themeExposures.map((exposure) => ({
              theme: exposure.theme,
              source: mapExposureSourceToPrisma(exposure.source),
            })),
          }),
        },
      });
      for (const exposure of input.themeExposures) {
        await tx.themeExposure.upsert({
          where: { accountId_theme_source: { accountId: accountRecord.id, theme: exposure.theme, source: mapExposureSourceToPrisma(exposure.source) } },
          create: themeExposureInput(accountRecord.id, exposure),
          update: themeExposureInput(accountRecord.id, exposure),
        });
      }

      await tx.watchlistItem.deleteMany({ where: { accountId: accountRecord.id } });
      if (input.watchlistItems.length > 0) {
        await tx.watchlistItem.createMany({
          data: input.watchlistItems.map((item) => ({
            accountId: accountRecord.id,
            symbol: item.symbol,
            name: item.name,
            theme: item.theme,
            reason: item.reason,
            actionBias: mapActionBiasToPrisma(item.actionBias),
          })),
        });
      }

      return accountRecord;
    });

    const context = await this.findPrimaryContext(account.owner);
    if (context === null) {
      throw new Error(`Portfolio context not found after upsert owner=${account.owner}`);
    }
    return context;
  }

  async findPrimaryContext(owner: string): Promise<PortfolioContextRecord | null> {
    const account = await this.prisma.portfolioAccount.findFirst({
      where: { owner },
      orderBy: [{ isPrimary: 'desc' }, { createdAt: 'asc' }],
      include: {
        stockHoldings: { orderBy: { symbol: 'asc' } },
        fundHoldings: { orderBy: { weightPercent: 'desc' } },
        themeExposures: { orderBy: [{ weightPercent: 'desc' }, { theme: 'asc' }] },
        watchlistItems: { orderBy: { createdAt: 'asc' } },
      },
    });

    if (account === null) {
      return null;
    }

    return {
      account: {
        id: account.id,
        owner: account.owner,
        name: account.name,
        accountType: account.accountType.toLowerCase() as PortfolioAccountRecord['accountType'],
        totalAssetValue: decimalToNumber(account.totalAssetValue),
        visibleAssetValue: decimalToNumber(account.visibleAssetValue),
        cashAmount: decimalToNumber(account.cashAmount),
        positionLevel: account.positionLevel,
      },
      stockHoldings: account.stockHoldings.map((holding): PortfolioStockHoldingRecord => ({
        accountId: holding.accountId,
        symbol: holding.symbol,
        name: holding.name,
        quantity: holding.quantity,
        costPrice: holding.costPrice.toNumber(),
        latestPrice: decimalToNumber(holding.latestPrice),
        marketValue: decimalToNumber(holding.marketValue),
        unrealizedPnl: decimalToNumber(holding.unrealizedPnl),
        buyDate: holding.buyDate === null ? null : toDateString(holding.buyDate),
        holdingStage: mapHoldingStage(holding.holdingStage),
        themeTags: holding.themeTags,
        riskLevel: mapRiskLevel(holding.riskLevel),
        actionBias: mapActionBias(holding.actionBias),
        thesis: holding.thesis,
      })),
      fundHoldings: account.fundHoldings.map((holding): PortfolioFundHoldingRecord => ({
        accountId: holding.accountId,
        fundCode: holding.fundCode,
        name: holding.name,
        theme: holding.theme,
        amount: holding.amount.toNumber(),
        weightPercent: holding.weightPercent.toNumber(),
        riskLevel: mapRiskLevel(holding.riskLevel),
        actionBias: mapActionBias(holding.actionBias),
      })),
      themeExposures: account.themeExposures.map((exposure): PortfolioThemeExposureRecord => ({
        accountId: exposure.accountId,
        theme: exposure.theme,
        source: mapExposureSource(exposure.source),
        amount: decimalToNumber(exposure.amount),
        weightPercent: decimalToNumber(exposure.weightPercent),
        actionBias: mapActionBias(exposure.actionBias),
        riskNote: exposure.riskNote,
        nextStep: exposure.nextStep,
      })),
      watchlistItems: account.watchlistItems.map((item): PortfolioWatchlistItemRecord => ({
        accountId: item.accountId,
        symbol: item.symbol,
        name: item.name,
        theme: item.theme,
        reason: item.reason,
        actionBias: mapActionBias(item.actionBias),
      })),
    };
  }

  async findInvestorPreference(owner: string): Promise<PortfolioInvestorPreferenceRecord | null> {
    const rows = await this.prisma.$queryRaw<InvestorPreferenceRow[]>`
      SELECT
        owner,
        horizon,
        core_view,
        robotics_max_weight_percent,
        single_stock_max_drawdown_percent,
        portfolio_max_drawdown_percent,
        core_holdings,
        satellite_holdings,
        rebalance_cadence,
        cash_plan,
        trim_order
      FROM investor_preferences
      WHERE owner = ${owner}
      LIMIT 1
    `;
    const row = rows[0];
    return row === undefined ? null : preferenceRowToRecord(row);
  }

  async upsertInvestorPreference(input: PortfolioInvestorPreferenceRecord): Promise<PortfolioInvestorPreferenceRecord> {
    const rows = await this.prisma.$queryRaw<InvestorPreferenceRow[]>`
      INSERT INTO investor_preferences (
        owner,
        horizon,
        core_view,
        robotics_max_weight_percent,
        single_stock_max_drawdown_percent,
        portfolio_max_drawdown_percent,
        core_holdings,
        satellite_holdings,
        rebalance_cadence,
        cash_plan,
        trim_order
      )
      VALUES (
        ${input.owner},
        ${input.horizon},
        ${input.coreView},
        ${input.roboticsMaxWeightPercent},
        ${input.singleStockMaxDrawdownPercent},
        ${input.portfolioMaxDrawdownPercent},
        CAST(${JSON.stringify(input.coreHoldings)} AS jsonb),
        CAST(${JSON.stringify(input.satelliteHoldings)} AS jsonb),
        ${input.rebalanceCadence},
        ${input.cashPlan},
        CAST(${JSON.stringify(input.trimOrder)} AS jsonb)
      )
      ON CONFLICT (owner) DO UPDATE SET
        horizon = EXCLUDED.horizon,
        core_view = EXCLUDED.core_view,
        robotics_max_weight_percent = EXCLUDED.robotics_max_weight_percent,
        single_stock_max_drawdown_percent = EXCLUDED.single_stock_max_drawdown_percent,
        portfolio_max_drawdown_percent = EXCLUDED.portfolio_max_drawdown_percent,
        core_holdings = EXCLUDED.core_holdings,
        satellite_holdings = EXCLUDED.satellite_holdings,
        rebalance_cadence = EXCLUDED.rebalance_cadence,
        cash_plan = EXCLUDED.cash_plan,
        trim_order = EXCLUDED.trim_order,
        updated_at = now()
      RETURNING
        owner,
        horizon,
        core_view,
        robotics_max_weight_percent,
        single_stock_max_drawdown_percent,
        portfolio_max_drawdown_percent,
        core_holdings,
        satellite_holdings,
        rebalance_cadence,
        cash_plan,
        trim_order
    `;
    return preferenceRowToRecord(rows[0]);
  }
}

function stockHoldingInput(accountId: string, holding: PortfolioStockHoldingRecord): Prisma.PortfolioHoldingUncheckedCreateInput {
  return {
    accountId,
    symbol: holding.symbol,
    name: holding.name,
    quantity: holding.quantity,
    costPrice: holding.costPrice,
    latestPrice: holding.latestPrice,
    marketValue: holding.marketValue,
    unrealizedPnl: holding.unrealizedPnl,
    buyDate: holding.buyDate === null ? null : new Date(`${holding.buyDate}T00:00:00.000Z`),
    holdingStage: holding.holdingStage,
    themeTags: [...holding.themeTags],
    riskLevel: mapRiskLevelToPrisma(holding.riskLevel),
    actionBias: mapActionBiasToPrisma(holding.actionBias),
    thesis: holding.thesis,
  };
}

function fundHoldingInput(accountId: string, holding: PortfolioFundHoldingRecord): Prisma.FundHoldingUncheckedCreateInput {
  return {
    accountId,
    fundCode: holding.fundCode,
    name: holding.name,
    theme: holding.theme,
    amount: holding.amount,
    weightPercent: holding.weightPercent,
    riskLevel: mapRiskLevelToPrisma(holding.riskLevel),
    actionBias: mapActionBiasToPrisma(holding.actionBias),
  };
}

function themeExposureInput(accountId: string, exposure: PortfolioThemeExposureRecord): Prisma.ThemeExposureUncheckedCreateInput {
  return {
    accountId,
    theme: exposure.theme,
    source: mapExposureSourceToPrisma(exposure.source),
    amount: exposure.amount,
    weightPercent: exposure.weightPercent,
    actionBias: mapActionBiasToPrisma(exposure.actionBias),
    riskNote: exposure.riskNote,
    nextStep: exposure.nextStep,
  };
}

function decimalToNumber(value: { toNumber(): number } | null): number | null {
  return value === null ? null : value.toNumber();
}

function toDateString(value: Date): string {
  return value.toISOString().slice(0, 10);
}

function mapHoldingStage(value: string | null): 'new' | 'holding' | 'long_term_core' {
  return value === 'new' || value === 'long_term_core' ? value : 'holding';
}

function preferenceRowToRecord(row: InvestorPreferenceRow | undefined): PortfolioInvestorPreferenceRecord {
  if (row === undefined) {
    throw new Error('Investor preference row is empty after upsert');
  }
  return {
    owner: row.owner,
    horizon: row.horizon,
    coreView: row.core_view,
    roboticsMaxWeightPercent: numberFromDecimal(row.robotics_max_weight_percent),
    singleStockMaxDrawdownPercent: numberFromDecimal(row.single_stock_max_drawdown_percent),
    portfolioMaxDrawdownPercent: numberFromDecimal(row.portfolio_max_drawdown_percent),
    coreHoldings: stringArrayFromJson(row.core_holdings),
    satelliteHoldings: stringArrayFromJson(row.satellite_holdings),
    rebalanceCadence: row.rebalance_cadence,
    cashPlan: row.cash_plan,
    trimOrder: stringArrayFromJson(row.trim_order),
  };
}

function numberFromDecimal(value: { toNumber(): number } | number): number {
  return typeof value === 'number' ? value : value.toNumber();
}

function stringArrayFromJson(value: unknown): readonly string[] {
  if (!Array.isArray(value)) {
    return [];
  }
  return value.filter((item): item is string => typeof item === 'string' && item.trim().length > 0);
}

function mapRiskLevel(value: PortfolioRiskLevel): PortfolioRiskLevelValue {
  return value.toLowerCase() as PortfolioRiskLevelValue;
}

function mapActionBias(value: PortfolioActionBias): PortfolioAction {
  switch (value) {
    case 'TAKE_PROFIT':
      return 'take_profit';
    case 'RISK_CONTROL':
      return 'risk_control';
    default:
      return value.toLowerCase() as PortfolioAction;
  }
}

function mapExposureSource(value: PortfolioExposureSource): PortfolioExposureSourceValue {
  return value.toLowerCase() as PortfolioExposureSourceValue;
}

function mapAccountTypeToPrisma(value: PortfolioAccountRecord['accountType']): 'STOCK' | 'FUND' | 'MIXED' {
  return value.toUpperCase() as 'STOCK' | 'FUND' | 'MIXED';
}

function mapRiskLevelToPrisma(value: PortfolioRiskLevelValue): PortfolioRiskLevel {
  return value.toUpperCase() as PortfolioRiskLevel;
}

function mapActionBiasToPrisma(value: PortfolioAction): PortfolioActionBias {
  switch (value) {
    case 'take_profit':
      return 'TAKE_PROFIT';
    case 'risk_control':
      return 'RISK_CONTROL';
    default:
      return value.toUpperCase() as PortfolioActionBias;
  }
}

function mapExposureSourceToPrisma(value: PortfolioExposureSourceValue): PortfolioExposureSource {
  return value.toUpperCase() as PortfolioExposureSource;
}
