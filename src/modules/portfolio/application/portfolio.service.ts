import { Inject, Injectable, Optional } from '@nestjs/common';
import { DATA_PROVIDER, type DataProvider } from '@/modules/data/providers/data-provider.interface';
import type { MarketSnapshotRawData, MarketSnapshotRequest, StockQuoteRawData } from '@/modules/data/domain/types/market-data.types';
import type {
  PortfolioContextDto as EditablePortfolioContextDto,
  PortfolioFundExposureDto as EditablePortfolioFundExposureDto,
  PortfolioStockPositionDto,
} from '../presentation/dto/portfolio-context.dto';
import type {
  PortfolioContextDto,
  PortfolioFundExposureDto,
  PortfolioMarketSnapshotDto,
  PortfolioPositionDecisionDto,
  PortfolioPositionDto,
  PortfolioTradingDecisionDto,
  PortfolioWatchThemeDto,
} from '../presentation/dto/portfolio.dto';
import { fallbackPortfolioContext } from './fallback-portfolio-context';
import { PortfolioContextService } from './portfolio-context.service';

@Injectable()
export class PortfolioService {
  constructor(
    @Optional() private readonly portfolioContextService?: PortfolioContextService,
    @Optional() @Inject(DATA_PROVIDER) private readonly dataProvider?: Pick<DataProvider, 'getStockQuotes' | 'getMarketSnapshots'>,
  ) {}

  async getContext(): Promise<PortfolioContextDto> {
    const editableContext = await this.loadEditableContext();
    const context = editableContext === null ? fallbackPortfolioContext : mapEditableContext(editableContext);
    return this.enrichWithMarketData(context);
  }

  async listPositions(): Promise<readonly PortfolioPositionDto[]> {
    const context = await this.getContext();
    return context.positions;
  }

  async listFundExposures(): Promise<readonly PortfolioFundExposureDto[]> {
    const context = await this.getContext();
    return context.fundExposures;
  }

  async getTradingDecision(): Promise<PortfolioTradingDecisionDto> {
    const context = await this.getContext();
    const decisions = context.positions.map(buildPositionDecision);
    const totalCostValue = context.positions.reduce((sum, position) => sum + position.quantity * toNumber(position.costPrice), 0);
    const totalMarketValue = decisions.reduce((sum, decision) => sum + toNumber(decision.marketValue), 0);
    const totalUnrealizedPnl = totalMarketValue - totalCostValue;
    const riskLevel = decisions.some((decision) => decision.riskLevel === 'high')
      ? 'high'
      : decisions.some((decision) => decision.riskLevel === 'medium')
        ? 'medium'
        : 'low';

    return {
      generatedAt: new Date().toISOString(),
      marketRegime: {
        code: 'balanced',
        label: '均衡观察',
        score: '50.00',
        reasons: ['当前版本优先使用组合上下文和成本口径，实时行情失败时保持只读观察。'],
      },
      summary: {
        totalCostValue: money(totalCostValue),
        totalMarketValue: money(totalMarketValue),
        totalUnrealizedPnl: money(totalUnrealizedPnl),
        totalUnrealizedPnlPercent: money(percent(totalUnrealizedPnl, totalCostValue)),
        primaryAction: '先完成持仓体检和主题集中度检查，再决定是否分批动作。',
        riskLevel,
      },
      decisions,
      actionBuckets: {
        hold: decisions.filter((item) => item.action === 'hold').map((item) => item.name),
        watch: decisions.filter((item) => item.action === 'watch').map((item) => item.name),
        avoidAdd: decisions.filter((item) => item.action === 'avoid_add').map((item) => item.name),
        addOnStrength: decisions.filter((item) => item.action === 'add_on_strength').map((item) => item.name),
        takeProfit: decisions.filter((item) => item.action === 'take_profit').map((item) => item.name),
        riskControl: decisions.filter((item) => item.action === 'risk_control').map((item) => item.name),
      },
      intradayPlan: {
        doNow: ['先看高风险持仓和最大主题暴露，不追单日急拉。'],
        waitFor: ['等待主题强弱、成交额和个股趋势同时确认。'],
        avoid: ['避免在同一主题已经拥挤时继续叠加仓位。'],
        emergency: ['若个股跌破成本保护线且主题同步走弱，优先进入风控复盘。'],
      },
      marketSnapshots: context.marketSnapshots,
      nextTriggers: context.actionRules,
      disclaimers: ['本模块是投研辅助和组合复盘工具，不构成投资建议，也不接券商自动下单。'],
    };
  }

  private async loadEditableContext(): Promise<EditablePortfolioContextDto | null> {
    if (this.portfolioContextService === undefined) {
      return null;
    }
    try {
      return await this.portfolioContextService.getContext('Ricki');
    } catch {
      return null;
    }
  }

  private async enrichWithMarketData(context: PortfolioContextDto): Promise<PortfolioContextDto> {
    if (this.dataProvider === undefined) {
      return context;
    }

    let nextContext = context;
    if (context.positions.length > 0) {
      try {
        const quotes = await this.dataProvider.getStockQuotes(context.positions.map((position) => position.symbol));
        const quoteBySymbol = new Map(quotes.map((quote) => [quote.symbol, quote]));
        nextContext = {
          ...nextContext,
          positions: nextContext.positions.map((position) => enrichPosition(position, quoteBySymbol.get(position.symbol))),
        };
      } catch {
        nextContext = context;
      }
    }

    try {
      const snapshots = await this.dataProvider.getMarketSnapshots(MARKET_SNAPSHOT_ITEMS);
      return {
        ...nextContext,
        marketSnapshots: snapshots.map(mapMarketSnapshot),
      };
    } catch {
      return nextContext;
    }
  }
}

const MARKET_SNAPSHOT_ITEMS: readonly MarketSnapshotRequest[] = [
  { code: '000001.SH', name: '上证指数', category: 'index' },
  { code: '399001.SZ', name: '深证成指', category: 'index' },
  { code: '399006.SZ', name: '创业板指', category: 'index' },
  { code: '512480.SH', name: '半导体 ETF', category: 'theme' },
  { code: '515050.SH', name: '5G 通信 ETF', category: 'theme' },
  { code: '159819.SZ', name: '人工智能 ETF', category: 'theme' },
  { code: '518880.SH', name: '黄金 ETF', category: 'theme' },
];

function mapEditableContext(context: EditablePortfolioContextDto): PortfolioContextDto {
  const positions = context.stockAccount.positions.map(mapPosition);
  const fundExposures = context.fundAccount.exposures.map(mapFundExposure);
  return {
    source: 'database',
    owner: context.owner,
    accountScope: context.accountScope,
    account: {
      id: 'ricki-primary',
      name: context.accountScope,
      accountType: 'MIXED',
      baseCurrency: 'CNY',
      totalAssetValue: money(context.fundAccount.totalAssetValue),
      cashValue: money(context.allocation.cashAmount),
      visibleAssetValue: money(context.fundAccount.visibleAssetValue),
      description: 'Portfolio context stored by AresQuant editable holdings.',
    },
    summary: {
      stockCostValue: money(context.allocation.stockCostValue),
      visibleFundValue: money(context.allocation.fundVisibleValue),
      knownPortfolioValue: money(context.allocation.estimatedTotalValue),
      stockWeightPercent: money(percent(context.allocation.stockMarketValue, context.allocation.estimatedTotalValue)),
      fundWeightPercent: money(percent(context.allocation.fundVisibleValue, context.allocation.estimatedTotalValue)),
    },
    positions,
    fundExposures,
    marketSnapshots: [],
    watchThemes: context.watchThemes.map(mapWatchTheme),
    riskFlags: context.riskFlags,
    actionRules: context.actionPolicy.rules,
  };
}

function mapPosition(position: PortfolioStockPositionDto): PortfolioPositionDto {
  const marketValue = position.marketValue ?? position.quantity * (position.latestPrice ?? position.costPrice);
  const unrealizedPnl = position.unrealizedPnl ?? marketValue - position.quantity * position.costPrice;
  return {
    id: `position-${position.symbol}`,
    symbol: position.symbol,
    name: position.name,
    quantity: position.quantity,
    costPrice: decimal(position.costPrice, 6),
    latestPrice: position.latestPrice === null ? null : decimal(position.latestPrice, 6),
    marketValue: money(marketValue),
    unrealizedPnl: money(unrealizedPnl),
    dailyChange: null,
    dailyPctChange: null,
    quoteSource: null,
    themeTags: position.themeTags.length > 0 ? position.themeTags : [position.theme],
    thesisSummary: position.thesis,
    actionBias: position.actionBias,
    riskLevel: 'medium',
    notes: null,
  };
}

function mapFundExposure(exposure: EditablePortfolioFundExposureDto): PortfolioFundExposureDto {
  return {
    id: `fund-${exposure.name}-${exposure.theme}`,
    name: exposure.name,
    fundCode: exposure.fundCode,
    theme: exposure.theme,
    amount: money(exposure.amount),
    weightPercent: decimal(exposure.weightPercent, 2),
    actionBias: exposure.actionBias,
    riskLevel: exposure.actionBias === 'risk_control' ? 'high' : 'medium',
    notes: null,
  };
}

function mapWatchTheme(name: string, index: number): PortfolioWatchThemeDto {
  return {
    id: `watch-${index}-${name}`,
    name,
    category: null,
    priority: Math.max(0, 100 - index),
    actionBias: 'watch',
    riskLevel: 'medium',
    notes: null,
  };
}

function enrichPosition(position: PortfolioPositionDto, quote: StockQuoteRawData | undefined): PortfolioPositionDto {
  if (quote === undefined) {
    return position;
  }
  const marketValue = quote.latestPrice * position.quantity;
  const costValue = toNumber(position.costPrice) * position.quantity;
  return {
    ...position,
    name: quote.name || position.name,
    latestPrice: decimal(quote.latestPrice, 6),
    marketValue: money(marketValue),
    unrealizedPnl: money(marketValue - costValue),
    dailyChange: money(quote.change),
    dailyPctChange: decimal(quote.pctChange, 2),
    quoteSource: quote.source,
  };
}

function mapMarketSnapshot(snapshot: MarketSnapshotRawData): PortfolioMarketSnapshotDto {
  return {
    code: snapshot.code,
    name: snapshot.name,
    category: snapshot.category,
    latestPrice: decimal(snapshot.latestPrice, 2),
    dailyChange: money(snapshot.change),
    dailyPctChange: decimal(snapshot.pctChange, 2),
    amount: money(snapshot.amount),
    quoteSource: snapshot.source,
  };
}

function buildPositionDecision(position: PortfolioPositionDto): PortfolioPositionDecisionDto {
  const costPrice = toNumber(position.costPrice);
  const currentPrice = toNumber(position.latestPrice ?? position.costPrice);
  const marketValue = toNumber(position.marketValue) || position.quantity * currentPrice;
  const unrealizedPnl = marketValue - position.quantity * costPrice;
  const pnlPercent = percent(unrealizedPnl, position.quantity * costPrice);
  const action = position.actionBias === 'risk_control' || position.riskLevel === 'high'
    ? 'risk_control'
    : position.actionBias === 'take_profit'
      ? 'take_profit'
      : position.actionBias === 'add' || position.actionBias === 'build'
        ? 'add_on_strength'
        : position.actionBias === 'hold'
          ? 'hold'
          : 'watch';

  return {
    symbol: position.symbol,
    name: position.name,
    quantity: position.quantity,
    costPrice: position.costPrice,
    latestPrice: position.latestPrice,
    marketValue: money(marketValue),
    unrealizedPnl: money(unrealizedPnl),
    unrealizedPnlPercent: money(pnlPercent),
    dailyPctChange: position.dailyPctChange ?? null,
    action,
    actionLabel: actionLabel(action),
    riskLevel: position.riskLevel as 'low' | 'medium' | 'high',
    reasons: [`主题：${position.themeTags.join(' / ') || '待补充'}`, position.thesisSummary ?? '等待补充持仓逻辑。'],
    triggers: ['主题强弱、趋势质量和组合集中度同时确认后再行动。'],
    pricePlan: {
      currentPrice: position.latestPrice,
      costPrice: position.costPrice,
      stopLossPrice: money(costPrice * 0.92),
      profitProtectPrice: money(costPrice * 1.12),
      addWatchPrice: money(costPrice * 0.97),
      strengthConfirmPrice: money(costPrice * 1.04),
    },
  };
}

function actionLabel(action: PortfolioPositionDecisionDto['action']): string {
  const labels: Record<PortfolioPositionDecisionDto['action'], string> = {
    hold: '继续持有',
    watch: '持有观察',
    avoid_add: '避免加仓',
    add_on_strength: '强势确认后分批',
    take_profit: '止盈观察',
    risk_control: '风控优先',
  };
  return labels[action];
}

function toNumber(value: string | number | null | undefined): number {
  if (value === null || value === undefined) {
    return 0;
  }
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function percent(numerator: number, denominator: number): number {
  return denominator === 0 ? 0 : (numerator / denominator) * 100;
}

function money(value: number | null | undefined): string {
  return decimal(value ?? 0, 2);
}

function decimal(value: number, places: number): string {
  return value.toFixed(places);
}
