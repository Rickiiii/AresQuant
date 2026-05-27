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
  PortfolioRiskLevel as PortfolioRiskLevelValue,
  PortfolioStockHoldingRecord,
  PortfolioThemeExposureRecord,
  PortfolioWatchlistItemRecord,
} from '../domain/portfolio.types';

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

      for (const holding of input.stockHoldings) {
        await tx.portfolioHolding.upsert({
          where: { accountId_symbol: { accountId: accountRecord.id, symbol: holding.symbol } },
          create: stockHoldingInput(accountRecord.id, holding),
          update: stockHoldingInput(accountRecord.id, holding),
        });
      }

      for (const holding of input.fundHoldings) {
        await tx.fundHolding.upsert({
          where: { accountId_name_theme: { accountId: accountRecord.id, name: holding.name, theme: holding.theme } },
          create: fundHoldingInput(accountRecord.id, holding),
          update: fundHoldingInput(accountRecord.id, holding),
        });
      }

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
