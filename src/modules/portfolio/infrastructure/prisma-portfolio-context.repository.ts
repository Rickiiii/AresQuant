import { Injectable } from '@nestjs/common';
import type { PortfolioActionBias, PortfolioExposureSource, PortfolioRiskLevel } from '@prisma/client';
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
