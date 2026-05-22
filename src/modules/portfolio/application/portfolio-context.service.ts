import { Inject, Injectable } from '@nestjs/common';
import {
  PORTFOLIO_CONTEXT_REPOSITORY,
  type PortfolioContextRepository,
} from '../domain/portfolio.repositories';
import type { PortfolioContextRecord, PortfolioThemeExposureRecord } from '../domain/portfolio.types';
import type { PortfolioContextDto } from '../presentation/dto/portfolio-context.dto';

const ALLOWED_ACTIONS = ['hold', 'add', 'build', 'watch', 'take_profit', 'risk_control'] as const;

@Injectable()
export class PortfolioContextService {
  constructor(
    @Inject(PORTFOLIO_CONTEXT_REPOSITORY)
    private readonly repository: PortfolioContextRepository,
  ) {}

  async getContext(owner = 'Ricki'): Promise<PortfolioContextDto | null> {
    const record = await this.repository.findPrimaryContext(owner);
    if (record === null) {
      return null;
    }

    return toPortfolioContext(record);
  }
}

function toPortfolioContext(record: PortfolioContextRecord): PortfolioContextDto {
  const stockCostValue = roundMoney(record.stockHoldings.reduce((sum, holding) => sum + holding.quantity * holding.costPrice, 0));
  const stockMarketValue = roundMoney(record.stockHoldings.reduce((sum, holding) => sum + (holding.marketValue ?? holding.quantity * (holding.latestPrice ?? holding.costPrice)), 0));
  const fundVisibleValue = record.account.visibleAssetValue ?? roundMoney(record.fundHoldings.reduce((sum, holding) => sum + holding.amount, 0));
  const cashAmount = record.account.cashAmount ?? 0;
  const topThemeWeightPercent = maxThemeWeight(record.themeExposures);

  return {
    owner: record.account.owner,
    accountScope: record.account.name,
    stockAccount: {
      positionLevel: record.account.positionLevel ?? '待确认',
      positions: record.stockHoldings.map((holding) => ({
        symbol: holding.symbol,
        name: holding.name,
        quantity: holding.quantity,
        costPrice: holding.costPrice,
        latestPrice: holding.latestPrice,
        marketValue: holding.marketValue,
        unrealizedPnl: holding.unrealizedPnl,
        theme: holding.themeTags.join(' / '),
        themeTags: holding.themeTags,
        thesis: holding.thesis,
        actionBias: holding.actionBias,
      })),
    },
    fundAccount: {
      totalAssetValue: record.account.totalAssetValue ?? fundVisibleValue + cashAmount,
      visibleAssetValue: fundVisibleValue,
      exposures: record.fundHoldings.map((holding) => ({
        fundCode: holding.fundCode,
        name: holding.name,
        theme: holding.theme,
        amount: holding.amount,
        weightPercent: holding.weightPercent,
        actionBias: holding.actionBias,
      })),
    },
    themeExposures: record.themeExposures.map((exposure) => ({
      theme: exposure.theme,
      source: exposure.source,
      amount: exposure.amount,
      weightPercent: exposure.weightPercent,
      actionBias: exposure.actionBias,
      riskNote: exposure.riskNote,
      nextStep: exposure.nextStep,
    })),
    allocation: {
      stockCostValue,
      stockMarketValue,
      fundVisibleValue,
      estimatedTotalValue: roundMoney(stockMarketValue + fundVisibleValue),
      cashAmount,
      topThemeWeightPercent,
    },
    watchThemes: unique([
      ...record.fundHoldings.map((item) => item.theme),
      ...record.themeExposures.map((item) => item.theme),
      ...record.watchlistItems.map((item) => item.theme),
    ]),
    riskFlags: buildRiskFlags(record.themeExposures),
    actionPolicy: {
      allowedActions: ALLOWED_ACTIONS,
      defaultBias: 'watch',
      rules: [
        '没有真实行情和主题强弱确认前，默认观察，不主动追高。',
        '加仓动作必须同时检查主题集中度、现金缓冲和反证条件。',
        '高风险主题连续走弱时优先进入 risk_control。',
      ],
    },
  };
}

function maxThemeWeight(exposures: readonly PortfolioThemeExposureRecord[]): number | null {
  const weights = exposures
    .map((exposure) => exposure.weightPercent)
    .filter((value): value is number => value !== null);
  return weights.length === 0 ? null : Math.max(...weights);
}

function buildRiskFlags(exposures: readonly PortfolioThemeExposureRecord[]): readonly string[] {
  return exposures
    .filter((exposure) => exposure.riskNote.length > 0)
    .map((exposure) => `${exposure.theme}: ${exposure.riskNote}`);
}

function unique(values: readonly string[]): readonly string[] {
  return [...new Set(values)];
}

function roundMoney(value: number): number {
  return Math.round(value * 100) / 100;
}
