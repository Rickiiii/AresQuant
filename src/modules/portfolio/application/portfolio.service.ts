import { Inject, Injectable, Optional } from '@nestjs/common';
import { PHASE2_DAILY_BAR_REPOSITORY, type Phase2DailyBarRepository } from '@/modules/data/domain/repositories/data-center.repositories';
import { DATA_PROVIDER, type DataProvider } from '@/modules/data/providers/data-provider.interface';
import type { DailyBarRawData, FundQuoteRawData, MarketSnapshotRawData, MarketSnapshotRequest, StockQuoteRawData } from '@/modules/data/domain/types/market-data.types';
import type {
  PortfolioContextDto as EditablePortfolioContextDto,
  PortfolioFundExposureDto as EditablePortfolioFundExposureDto,
  PortfolioStockPositionDto,
} from '../presentation/dto/portfolio-context.dto';
import type {
  PortfolioContextDto,
  PortfolioAdviceItemDto,
  PortfolioAdviceBacktestDto,
  PortfolioAdviceBacktestItemDto,
  PortfolioAdviceBacktestSummaryDto,
  PortfolioDailyActionDto,
  PortfolioDecisionDataStatusDto,
  PortfolioFundSignalDto,
  PortfolioFundExposureDto,
  PortfolioFundQuoteDto,
  PortfolioInvestorPreferenceDto,
  PortfolioMarketSnapshotDto,
  PortfolioPositionDecisionDto,
  PortfolioPositionDto,
  PortfolioQuantSignalDto,
  PortfolioStockQuoteDto,
  PortfolioThemeRadarDto,
  PortfolioTradingDecisionDto,
  PortfolioWatchThemeDto,
} from '../presentation/dto/portfolio.dto';
import { fallbackPortfolioContext } from './fallback-portfolio-context';
import { PortfolioContextService } from './portfolio-context.service';

@Injectable()
export class PortfolioService {
  constructor(
    @Optional() private readonly portfolioContextService?: PortfolioContextService,
    @Optional() @Inject(DATA_PROVIDER) private readonly dataProvider?: Pick<DataProvider, 'getStockQuotes' | 'getFundQuotes' | 'getMarketSnapshots' | 'getDailyBars'>,
    @Optional() @Inject(PHASE2_DAILY_BAR_REPOSITORY) private readonly dailyBarRepository?: Pick<Phase2DailyBarRepository, 'findByDateRange' | 'upsertMany'>,
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
    const preference = await this.getInvestorPreference();
    const decisions = context.positions.map((position) => buildPositionDecision(position, preference));
    const totalCostValue = context.positions.reduce((sum, position) => sum + position.quantity * toNumber(position.costPrice), 0);
    const totalMarketValue = decisions.reduce((sum, decision) => sum + toNumber(decision.marketValue), 0);
    const totalUnrealizedPnl = totalMarketValue - totalCostValue;
    const riskLevel = decisions.some((decision) => decision.riskLevel === 'high')
      ? 'high'
      : decisions.some((decision) => decision.riskLevel === 'medium')
        ? 'medium'
        : 'low';
    const dataStatus = buildDataStatus(context);
    const riskNames = decisions.filter((decision) => decision.action === 'risk_control').map((decision) => decision.name);
    const strengthNames = decisions.filter((decision) => decision.action === 'add_on_strength').map((decision) => decision.name);
    const fundSignals = buildFundSignals(context.fundExposures, context.marketSnapshots);
    const themeRadar = buildThemeRadar(context.positions, context.fundExposures, fundSignals, toNumber(context.summary.knownPortfolioValue));
    const quantSignals = await this.buildQuantSignals(context.positions, decisions, preference);

    return {
      generatedAt: dataStatus.updatedAt,
      dataStatus,
      marketRegime: {
        code: dataStatus.status === 'live' && dataStatus.quoteCoverage.updated === dataStatus.quoteCoverage.total && riskNames.length === 0 ? 'balanced' : 'weak_defensive',
        label: dataStatus.status === 'live' ? (dataStatus.quoteCoverage.updated === dataStatus.quoteCoverage.total ? '实时观察' : '部分实时观察') : '保守观察',
        score: dataStatus.status === 'live' ? (dataStatus.quoteCoverage.updated === dataStatus.quoteCoverage.total ? '62.00' : '54.00') : '45.00',
        reasons: [
          dataStatus.label,
          riskNames.length > 0 ? `需要优先复盘：${riskNames.join('、')}` : '暂无必须立即风控的持仓。',
        ],
      },
      summary: {
        totalCostValue: money(totalCostValue),
        totalMarketValue: money(totalMarketValue),
        totalUnrealizedPnl: money(totalUnrealizedPnl),
        totalUnrealizedPnlPercent: money(percent(totalUnrealizedPnl, totalCostValue)),
        primaryAction: buildPrimaryAction(dataStatus, riskNames, strengthNames),
        riskLevel,
      },
      decisions,
      actionBuckets: {
        hold: decisions.filter((item) => item.action === 'hold').map(formatDecisionBucketItem),
        watch: decisions.filter((item) => item.action === 'watch').map(formatDecisionBucketItem),
        avoidAdd: decisions.filter((item) => item.action === 'avoid_add').map(formatDecisionBucketItem),
        addOnStrength: decisions.filter((item) => item.action === 'add_on_strength').map(formatDecisionBucketItem),
        takeProfit: decisions.filter((item) => item.action === 'take_profit').map(formatDecisionBucketItem),
        riskControl: decisions.filter((item) => item.action === 'risk_control').map(formatDecisionBucketItem),
      },
      intradayPlan: {
        doNow: buildDoNowPlan(dataStatus, riskNames),
        waitFor: buildWaitForPlan(strengthNames),
        avoid: ['避免在同一主题已经拥挤时继续叠加仓位。', '没有价格触发和反证条件时，不把“长期持有”理解成无脑加仓。'],
        emergency: riskNames.length > 0
          ? riskNames.map((name) => `${name} 若继续跌破风控线，先复盘持仓逻辑和仓位上限。`)
          : ['若个股跌破成本保护线且主题同步走弱，优先进入风控复盘。'],
      },
      marketSnapshots: context.marketSnapshots,
      fundSignals,
      themeRadar,
      dailyActions: buildDailyActions(dataStatus, decisions, themeRadar, fundSignals),
      investorProfile: buildInvestorProfile(preference),
      investorPreference: preference,
      questionsForInvestor: buildQuestionsForInvestor(context, decisions, themeRadar, preference),
      preferenceAdvice: buildPreferenceAdvice(decisions, themeRadar, preference),
      quantAdvice: buildQuantAdviceFromSignals(quantSignals, dataStatus),
      quantSignals,
      nextTriggers: context.actionRules,
      disclaimers: ['本模块是投研辅助和组合复盘工具，不构成投资建议，也不接券商自动下单。'],
    };
  }

  async getAdviceBacktest(days = 30): Promise<PortfolioAdviceBacktestDto> {
    const context = await this.getContext();
    const preference = await this.getInvestorPreference();
    const decisions = context.positions.map((position) => buildPositionDecision(position, preference));
    const quantSignals = await this.buildQuantSignals(context.positions, decisions, preference);
    const preferenceAdvice = buildPreferenceAdvice(decisions, buildThemeRadar(context.positions, context.fundExposures, [], toNumber(context.summary.knownPortfolioValue)), preference);
    const quantAdvice = buildQuantAdviceFromSignals(quantSignals, buildDataStatus(context));
    const endDate = todayDate();
    const startDate = daysAgoDate(Math.max(7, Math.min(days, 180)));
    const historyBySymbol = await this.loadDailyBarHistory(context.positions.map((position) => position.symbol), startDate, endDate);
    const items = [
      ...preferenceAdvice.filter((item) => item.targetType === 'stock' && item.targetCode !== null).map((item) => buildAdviceBacktestItem('preference', item, historyBySymbol.get(item.targetCode ?? ''), context.positions, endDate)),
      ...quantAdvice.filter((item) => item.targetType === 'stock' && item.targetCode !== null).map((item) => buildAdviceBacktestItem('quant', item, historyBySymbol.get(item.targetCode ?? ''), context.positions, endDate)),
    ];
    const summaries = [
      buildAdviceBacktestSummary('preference', items),
      buildAdviceBacktestSummary('quant', items),
    ];
    const hasHistoricalData = items.some((item) => item.startDate !== '持仓成本');
    const hasQuoteFallback = items.some((item) => item.startDate === '持仓成本');
    return {
      generatedAt: new Date().toISOString(),
      startDate,
      endDate,
      dataStatus: hasHistoricalData
        ? hasQuoteFallback
          ? '部分建议已使用真实日线复盘；缺少日线的标的已用真实现价和持仓成本做即时复盘。'
          : '已使用真实日线做建议复盘。'
        : hasQuoteFallback
          ? '暂未拿到足够历史日线，已用真实现价和持仓成本做即时复盘。'
          : '缺少真实日线和真实现价，暂时只能返回证据不足。',
      summaries,
      items,
    };
  }

  async getInvestorPreference(): Promise<PortfolioInvestorPreferenceDto> {
    if (this.portfolioContextService === undefined) {
      return defaultInvestorPreference();
    }
    try {
      const preference = await this.portfolioContextService.getInvestorPreference('Ricki');
      return preference === null ? defaultInvestorPreference() : normalizeInvestorPreference(preference);
    } catch {
      return defaultInvestorPreference();
    }
  }

  async updateInvestorPreference(preference: PortfolioInvestorPreferenceDto): Promise<PortfolioInvestorPreferenceDto> {
    const normalized = normalizeInvestorPreference(preference);
    if (this.portfolioContextService === undefined) {
      return normalized;
    }
    try {
      const saved = await this.portfolioContextService.upsertInvestorPreference({
        owner: 'Ricki',
        ...normalized,
      });
      return normalizeInvestorPreference(saved);
    } catch {
      return normalized;
    }
  }

  async lookupStockQuotes(symbols: readonly string[]): Promise<readonly PortfolioStockQuoteDto[]> {
    if (this.dataProvider === undefined) {
      return [];
    }
    const normalizedSymbols = Array.from(new Set(symbols.map(normalizeLookupSymbol).filter((symbol): symbol is string => symbol !== null)));
    if (normalizedSymbols.length === 0) {
      return [];
    }
    const quotes = await this.dataProvider.getStockQuotes(normalizedSymbols);
    return quotes.map(mapStockQuote);
  }

  async lookupFundQuotes(fundCodes: readonly string[]): Promise<readonly PortfolioFundQuoteDto[]> {
    if (this.dataProvider === undefined) {
      return [];
    }
    const normalizedCodes = Array.from(new Set(fundCodes.map((code) => code.trim()).filter((code) => /^[0-9]{6}$/.test(code))));
    if (normalizedCodes.length === 0) {
      return [];
    }
    const quotes = await this.dataProvider.getFundQuotes(normalizedCodes);
    return quotes.map(mapFundQuote);
  }

  private async loadEditableContext(): Promise<EditablePortfolioContextDto | null> {
    if (this.portfolioContextService === undefined) {
      return null;
    }
    try {
      const context = await this.portfolioContextService.getContext('Ricki');
      return context ?? await this.portfolioContextService.seedRickiContext();
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
        nextContext = recomputePortfolioSummary(nextContext);
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

  private async buildQuantSignals(
    positions: readonly PortfolioPositionDto[],
    decisions: readonly PortfolioPositionDecisionDto[],
    preference: PortfolioInvestorPreferenceDto,
  ): Promise<readonly PortfolioQuantSignalDto[]> {
    const historyBySymbol = await this.loadDailyBarHistory(positions.map((position) => position.symbol), daysAgoDate(45), todayDate());
    const decisionBySymbol = new Map(decisions.map((decision) => [decision.symbol, decision]));
    return positions.map((position) => buildQuantSignal(position, decisionBySymbol.get(position.symbol), historyBySymbol.get(position.symbol) ?? [], preference));
  }

  private async loadDailyBarHistory(symbols: readonly string[], startDate: string, endDate: string): Promise<ReadonlyMap<string, readonly DailyBarRawData[]>> {
    const result = new Map<string, readonly DailyBarRawData[]>();
    const uniqueSymbols = Array.from(new Set(symbols));
    await Promise.all(uniqueSymbols.map(async (symbol) => {
      const cachedBars = await this.loadCachedDailyBars(symbol, startDate, endDate);
      try {
        if (this.dataProvider === undefined) {
          result.set(symbol, cachedBars);
          return;
        }
        const bars = await this.dataProvider?.getDailyBars(symbol, startDate, endDate);
        const sortedBars = sortDailyBars(bars ?? []);
        if (sortedBars.length > 0) {
          await this.dailyBarRepository?.upsertMany(sortedBars);
          result.set(symbol, sortedBars);
          return;
        }
        result.set(symbol, cachedBars);
      } catch {
        result.set(symbol, cachedBars);
      }
    }));
    return result;
  }

  private async loadCachedDailyBars(symbol: string, startDate: string, endDate: string): Promise<readonly DailyBarRawData[]> {
    if (this.dailyBarRepository === undefined) {
      return [];
    }
    try {
      return sortDailyBars(await this.dailyBarRepository.findByDateRange(symbol, { startDate, endDate }));
    } catch {
      return [];
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
  { code: '159941.SZ', name: '纳指 ETF', category: 'theme' },
  { code: '513500.SH', name: '标普500 ETF', category: 'theme' },
  { code: '513180.SH', name: '恒生科技 ETF', category: 'theme' },
  { code: '512100.SH', name: '中证1000 ETF', category: 'theme' },
  { code: '560800.SH', name: '数字经济 ETF', category: 'theme' },
  { code: '562960.SH', name: '绿色电力 ETF', category: 'theme' },
  { code: '159928.SZ', name: '消费 ETF', category: 'theme' },
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
    buyDate: position.buyDate,
    holdingStage: position.holdingStage,
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

function recomputePortfolioSummary(context: PortfolioContextDto): PortfolioContextDto {
  const stockCostValue = context.positions.reduce((sum, position) => sum + position.quantity * toNumber(position.costPrice), 0);
  const stockMarketValue = context.positions.reduce((sum, position) => sum + toNumber(position.marketValue), 0);
  const visibleFundValue = toNumber(context.summary.visibleFundValue);
  const knownPortfolioValue = stockMarketValue + visibleFundValue;
  return {
    ...context,
    account: {
      ...context.account,
      visibleAssetValue: money(knownPortfolioValue),
    },
    summary: {
      stockCostValue: money(stockCostValue),
      visibleFundValue: money(visibleFundValue),
      knownPortfolioValue: money(knownPortfolioValue),
      stockWeightPercent: money(percent(stockMarketValue, knownPortfolioValue)),
      fundWeightPercent: money(percent(visibleFundValue, knownPortfolioValue)),
    },
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

function normalizeLookupSymbol(value: string): string | null {
  const normalized = value.trim().toUpperCase();
  const compact = normalized
    .replace(/^(SH|SZ|BJ)/, '')
    .replace(/\.(SH|SZ|BJ)$/, '')
    .replace(/[^0-9]/g, '');
  return /^[0-9]{6}$/.test(compact) ? compact : null;
}

function mapStockQuote(quote: StockQuoteRawData): PortfolioStockQuoteDto {
  return {
    symbol: quote.symbol,
    name: quote.name,
    latestPrice: decimal(quote.latestPrice, 6),
    dailyChange: money(quote.change),
    dailyPctChange: decimal(quote.pctChange, 2),
    quoteSource: quote.source,
    market: marketForSymbol(quote.symbol),
    suggestedTheme: suggestedThemeForSymbol(quote.symbol, quote.name),
  };
}

function mapFundQuote(quote: FundQuoteRawData): PortfolioFundQuoteDto {
  return {
    fundCode: quote.fundCode,
    name: quote.name,
    netValueDate: quote.netValueDate,
    unitNetValue: decimal(quote.unitNetValue, 4),
    estimatedNetValue: quote.estimatedNetValue === null ? null : decimal(quote.estimatedNetValue, 4),
    estimatedPctChange: quote.estimatedPctChange === null ? null : decimal(quote.estimatedPctChange, 2),
    estimatedAt: quote.estimatedAt,
    quoteSource: quote.source,
  };
}

function suggestedThemeForSymbol(symbol: string, name: string): string {
  const knownThemes: Readonly<Record<string, string>> = {
    '600366': '稀土永磁 / 电机材料',
    '601689': '物理AI / 机器人执行器 / 智能车',
    '002031': '机器人 / 工业母机高弹性',
    '002714': '生猪养殖 / 农业',
    '603005': '半导体封测 / CIS封装',
    '560710': '船舶军工 / 高端装备',
    '002050': '新能源车热管理 / 物理AI机器人',
  };
  if (knownThemes[symbol] !== undefined) {
    return knownThemes[symbol];
  }
  if (name.includes('ETF')) {
    return 'ETF / 主题基金';
  }
  return `${marketForSymbol(symbol)} / 待补充主题`;
}

function marketForSymbol(symbol: string): string {
  if (symbol.startsWith('688') || symbol.startsWith('689')) {
    return '科创板';
  }
  if (symbol.startsWith('300') || symbol.startsWith('301')) {
    return '创业板';
  }
  if (symbol.startsWith('002') || symbol.startsWith('003')) {
    return '中小板';
  }
  if (symbol.startsWith('5')) {
    return '场内基金';
  }
  if (symbol.startsWith('6')) {
    return '沪市主板';
  }
  return '深市主板';
}

function buildDataStatus(context: PortfolioContextDto): PortfolioDecisionDataStatusDto {
  const updatedAt = new Date().toISOString();
  const sources = Array.from(new Set([
    ...context.positions.map((position) => position.quoteSource).filter((source): source is string => typeof source === 'string' && source.length > 0),
    ...context.marketSnapshots.map((snapshot) => snapshot.quoteSource).filter((source) => source.length > 0),
  ]));
  const updated = context.positions.filter(hasLivePositionQuote).length;
  const total = context.positions.length;
  const live = sources.length > 0 && updated > 0;
  const stalePositionNames = context.positions.filter((position) => !hasLivePositionQuote(position)).map((position) => position.name);
  const coverageText = total === 0 ? '0/0' : `${updated}/${total}`;

  return {
    status: live ? 'live' : 'fallback',
    label: live ? `实时行情已更新 ${coverageText}，建议基于最新价格和持仓成本生成。` : '实时行情未更新，当前只基于持仓成本和既有逻辑做保守观察。',
    updatedAt,
    sources,
    quoteCoverage: {
      updated,
      total,
      ratio: money(percent(updated, total)),
    },
    stalePositionNames,
  };
}

function hasLivePositionQuote(position: PortfolioPositionDto): boolean {
  return position.latestPrice !== null && typeof position.quoteSource === 'string' && position.quoteSource.length > 0;
}

function buildPrimaryAction(dataStatus: PortfolioDecisionDataStatusDto, riskNames: readonly string[], strengthNames: readonly string[]): string {
  if (dataStatus.status !== 'live') {
    return '长线策略下，实时行情未更新时不做买卖动作：先维护持仓数据，再确认机器人核心仓、仓位上限和回撤容忍。';
  }
  if (dataStatus.quoteCoverage.updated < dataStatus.quoteCoverage.total) {
    const staleNames = dataStatus.stalePositionNames.slice(0, 4).join('、');
    return staleNames.length > 0
      ? `长线策略下，未更新行情的 ${staleNames} 不做买卖；只处理已覆盖标的里明确跌破风控线或被证伪的项目。`
      : '真实行情只覆盖部分持仓：未覆盖标的不操作，避免用不完整数据做长期调仓。';
  }
  if (riskNames.length > 0) {
    return `${riskNames.join('、')} 已触发长线风控复核：不是因为普通波动卖出，而是需要确认是否跌破预设底线、仓位是否过重、持仓逻辑是否被证伪。`;
  }
  if (strengthNames.length > 0) {
    return `${strengthNames.join('、')} 偏强但不追高：机器人方向长期看好，仍只在回踩不破且仓位上限允许时小额分批。`;
  }
  return '当前没有必须操作的持仓：长线策略建议不买、不卖，继续持有，并等待更清晰的加仓位置。';
}

function buildDoNowPlan(dataStatus: PortfolioDecisionDataStatusDto, riskNames: readonly string[]): readonly string[] {
  if (dataStatus.status !== 'live') {
    return ['系统建议：不操作。原因是实时行情未更新，任何买入或卖出判断都不够可靠。'];
  }
  if (dataStatus.quoteCoverage.updated < dataStatus.quoteCoverage.total) {
    const staleNames = dataStatus.stalePositionNames.slice(0, 4).join('、');
    return [
      staleNames.length > 0 ? `${staleNames}：行情未更新，系统建议今天不操作。` : '未覆盖持仓：系统建议今天不操作。',
      riskNames.length > 0 ? `${riskNames.join('、')}：已触发风控条件，建议优先降低风险，不要补仓。` : '已覆盖持仓：暂无必须立即处理的标的，系统建议不操作。',
    ];
  }
  if (riskNames.length > 0) {
    return [`${riskNames.join('、')}：已触发长线风控复核，不加仓；先确认是否跌破风控线、仓位是否超过上限、长期逻辑是否被证伪。`];
  }
  return ['系统建议：当前不操作。没有持仓触发风控、止盈或低风险加仓条件。'];
}

function buildWaitForPlan(strengthNames: readonly string[]): readonly string[] {
  if (strengthNames.length === 0) {
    return ['等待主题强弱、成交额和个股趋势同时确认。'];
  }
  return [
    `${strengthNames.join('、')} 已进入强势观察，但需要回踩不破成本保护线或继续放量确认。`,
    '只有价格触发、主题强度和组合集中度都通过时，才考虑小额分批。',
  ];
}

function buildFundSignals(
  fundExposures: readonly PortfolioFundExposureDto[],
  marketSnapshots: readonly PortfolioMarketSnapshotDto[],
): readonly PortfolioFundSignalDto[] {
  const snapshotByCode = new Map(marketSnapshots.map((snapshot) => [snapshot.code, snapshot]));
  return fundExposures.map((fund) => {
    const proxy = proxyForFund(fund);
    const snapshot = snapshotByCode.get(proxy.code);
    const pctChange = snapshot === undefined ? null : toNumber(snapshot.dailyPctChange);
    const signal = buildFundSignalText(fund, pctChange);
    return {
      fundName: fund.name,
      theme: fund.theme,
      amount: fund.amount,
      weightPercent: fund.weightPercent,
      proxyCode: proxy.code,
      proxyName: proxy.name,
      proxyPctChange: snapshot?.dailyPctChange ?? null,
      quoteSource: snapshot?.quoteSource ?? null,
      signalLabel: signal.label,
      actionLabel: signal.action,
      reason: signal.reason,
    };
  });
}

function proxyForFund(fund: PortfolioFundExposureDto): { readonly code: string; readonly name: string } {
  const key = `${fund.fundCode ?? ''} ${fund.name} ${fund.theme}`.toUpperCase();
  if (key.includes('NASDAQ') || key.includes('纳指')) {
    return { code: '159941.SZ', name: '纳指 ETF' };
  }
  if (key.includes('SP500') || key.includes('标普')) {
    return { code: '513500.SH', name: '标普500 ETF' };
  }
  if (key.includes('HSTECH') || key.includes('恒生科技') || key.includes('港股科技')) {
    return { code: '513180.SH', name: '恒生科技 ETF' };
  }
  if (key.includes('GOLD') || key.includes('黄金')) {
    return { code: '518880.SH', name: '黄金 ETF' };
  }
  if (key.includes('CSI1000') || key.includes('中证1000') || key.includes('小盘')) {
    return { code: '512100.SH', name: '中证1000 ETF' };
  }
  if (key.includes('COMMUNICATION') || key.includes('通信') || key.includes('光模块') || key.includes('CPO')) {
    return { code: '515050.SH', name: '5G 通信 ETF' };
  }
  if (key.includes('DIGITAL') || key.includes('数字经济') || key.includes('大科技')) {
    return { code: '560800.SH', name: '数字经济 ETF' };
  }
  if (key.includes('AI') || key.includes('人工智能')) {
    return { code: '159819.SZ', name: '人工智能 ETF' };
  }
  if (key.includes('GREEN') || key.includes('绿电') || key.includes('新能源')) {
    return { code: '562960.SH', name: '绿色电力 ETF' };
  }
  if (key.includes('CONSUMPTION') || key.includes('消费')) {
    return { code: '159928.SZ', name: '消费 ETF' };
  }
  return { code: '000001.SH', name: '上证指数' };
}

function buildFundSignalText(
  fund: PortfolioFundExposureDto,
  proxyPctChange: number | null,
): { readonly label: string; readonly action: string; readonly reason: string } {
  const weight = toNumber(fund.weightPercent);
  if (proxyPctChange === null) {
    return {
      label: '代理行情待更新',
      action: '先复核',
      reason: `${fund.name} 暂无可用代理涨跌，先只看持仓权重和主题集中度。`,
    };
  }
  if (proxyPctChange <= -2) {
    return {
      label: '主题转弱',
      action: weight >= 10 ? '优先风控复盘' : '暂停加仓',
      reason: `代理标的下跌 ${money(Math.abs(proxyPctChange))}%，${weight >= 10 ? '且基金权重较高，先看是否需要降低同主题暴露。' : '先等待主题企稳。'}`,
    };
  }
  if (proxyPctChange >= 2) {
    return {
      label: '主题偏强',
      action: weight >= 15 ? '不追高，查集中度' : '小额观察',
      reason: `代理标的上涨 ${money(proxyPctChange)}%，可以观察强度延续，但先检查组合里同主题股票和基金是否已拥挤。`,
    };
  }
  return {
    label: '主题中性',
    action: '持有观察',
    reason: `代理标的涨跌 ${money(proxyPctChange)}%，暂未给出强动作信号，继续按原持有逻辑复盘。`,
  };
}

function buildThemeRadar(
  positions: readonly PortfolioPositionDto[],
  fundExposures: readonly PortfolioFundExposureDto[],
  fundSignals: readonly PortfolioFundSignalDto[],
  knownPortfolioValue: number,
): readonly PortfolioThemeRadarDto[] {
  const radarByTheme = new Map<string, {
    stockValue: number;
    fundValue: number;
    heatWeightedSum: number;
    heatWeight: number;
    members: Set<string>;
    sourceCount: number;
  }>();
  const fundSignalByName = new Map(fundSignals.map((signal) => [signal.fundName, signal]));

  for (const position of positions) {
    const theme = canonicalTheme([...position.themeTags, position.name].join(' / '));
    const marketValue = toNumber(position.marketValue) || position.quantity * toNumber(position.costPrice);
    const bucket = ensureThemeBucket(radarByTheme, theme);
    bucket.stockValue += marketValue;
    bucket.members.add(`${position.name} ${position.symbol}`);
    bucket.sourceCount += 1;
    const pctChange = position.dailyPctChange === null || position.dailyPctChange === undefined ? null : toNumber(position.dailyPctChange);
    if (pctChange !== null) {
      bucket.heatWeightedSum += pctChange * marketValue;
      bucket.heatWeight += marketValue;
    }
  }

  for (const fund of fundExposures) {
    const theme = canonicalTheme(`${fund.name} / ${fund.theme}`);
    const fundValue = toNumber(fund.amount);
    const bucket = ensureThemeBucket(radarByTheme, theme);
    bucket.fundValue += fundValue;
    bucket.members.add(fund.name);
    bucket.sourceCount += 1;
    const signal = fundSignalByName.get(fund.name);
    const pctChange = signal?.proxyPctChange === null || signal?.proxyPctChange === undefined ? null : toNumber(signal.proxyPctChange);
    if (pctChange !== null) {
      bucket.heatWeightedSum += pctChange * fundValue;
      bucket.heatWeight += fundValue;
    }
  }

  const denominator = knownPortfolioValue > 0
    ? knownPortfolioValue
    : Array.from(radarByTheme.values()).reduce((sum, bucket) => sum + bucket.stockValue + bucket.fundValue, 0);

  return Array.from(radarByTheme.entries())
    .map(([theme, bucket]) => {
      const totalValue = bucket.stockValue + bucket.fundValue;
      const weightPercent = percent(totalValue, denominator);
      const heatPctChange = bucket.heatWeight > 0 ? bucket.heatWeightedSum / bucket.heatWeight : null;
      const advice = buildThemeRadarAdvice(theme, weightPercent, heatPctChange, bucket.sourceCount);
      return {
        theme,
        stockValue: money(bucket.stockValue),
        fundValue: money(bucket.fundValue),
        totalValue: money(totalValue),
        weightPercent: money(weightPercent),
        heatPctChange: heatPctChange === null ? null : money(heatPctChange),
        sourceCount: bucket.sourceCount,
        riskLevel: advice.riskLevel,
        heatLabel: advice.heatLabel,
        actionLabel: advice.actionLabel,
        reason: advice.reason,
        members: Array.from(bucket.members).slice(0, 6),
      };
    })
    .sort((left, right) => toNumber(right.weightPercent) - toNumber(left.weightPercent))
    .slice(0, 8);
}

function ensureThemeBucket(
  radarByTheme: Map<string, { stockValue: number; fundValue: number; heatWeightedSum: number; heatWeight: number; members: Set<string>; sourceCount: number }>,
  theme: string,
): { stockValue: number; fundValue: number; heatWeightedSum: number; heatWeight: number; members: Set<string>; sourceCount: number } {
  const existing = radarByTheme.get(theme);
  if (existing !== undefined) {
    return existing;
  }
  const bucket = { stockValue: 0, fundValue: 0, heatWeightedSum: 0, heatWeight: 0, members: new Set<string>(), sourceCount: 0 };
  radarByTheme.set(theme, bucket);
  return bucket;
}

function canonicalTheme(raw: string): string {
  const text = raw.toUpperCase();
  if (text.includes('通信') || text.includes('CPO') || text.includes('光模块')) {
    return '通信 / AI算力';
  }
  if (text.includes('机器人') || text.includes('物理AI') || text.includes('物理 AI')) {
    return 'AI / 机器人';
  }
  if (text.includes('人工智能') || text.includes(' AI') || text.includes('/AI') || text.includes('AI/')) {
    return 'AI / 机器人';
  }
  if (text.includes('半导体') || text.includes('数字经济') || text.includes('大科技')) {
    return '大科技 / 半导体';
  }
  if (text.includes('NASDAQ') || text.includes('纳指') || text.includes('美股科技') || text.includes('标普') || text.includes('SP500') || text.includes('海外')) {
    return '海外科技';
  }
  if (text.includes('黄金')) {
    return '黄金 / 避险';
  }
  if (text.includes('中证1000') || text.includes('小盘')) {
    return '小盘宽基';
  }
  if (text.includes('恒生') || text.includes('港股')) {
    return '港股科技';
  }
  if (text.includes('绿电') || text.includes('新能源')) {
    return '新能源 / 绿电';
  }
  if (text.includes('船舶') || text.includes('军工') || text.includes('高端装备')) {
    return '高端装备 / 军工';
  }
  if (text.includes('消费')) {
    return '消费';
  }
  if (text.includes('农业') || text.includes('生猪') || text.includes('农牧')) {
    return '农牧周期';
  }
  return raw.split(/[\/,，、]+/)[0]?.trim() || '其他主题';
}

function buildThemeRadarAdvice(
  theme: string,
  weightPercent: number,
  heatPctChange: number | null,
  sourceCount: number,
): { readonly riskLevel: 'low' | 'medium' | 'high'; readonly heatLabel: string; readonly actionLabel: string; readonly reason: string } {
  const riskLevel = weightPercent >= 25 || sourceCount >= 5 ? 'high' : weightPercent >= 12 || sourceCount >= 3 ? 'medium' : 'low';
  const heatLabel = heatPctChange === null
    ? '热度待更新'
    : heatPctChange <= -2
      ? '主题转弱'
      : heatPctChange >= 2
        ? '主题偏强'
        : '主题中性';
  if (riskLevel === 'high' && heatPctChange !== null && heatPctChange <= -2) {
    return {
      riskLevel,
      heatLabel,
      actionLabel: '优先风控',
      reason: `${theme} 权重 ${money(weightPercent)}%，且热度下跌 ${money(Math.abs(heatPctChange))}%，先检查是否需要降低同主题暴露。`,
    };
  }
  if (riskLevel === 'high') {
    return {
      riskLevel,
      heatLabel,
      actionLabel: '控制集中度',
      reason: `${theme} 已是组合核心主线，继续加仓前先确认已有股票和基金是否重复暴露。`,
    };
  }
  if (heatPctChange !== null && heatPctChange >= 2) {
    return {
      riskLevel,
      heatLabel,
      actionLabel: '强势观察',
      reason: `${theme} 热度偏强，但只适合等待回踩或确认，不追单日急拉。`,
    };
  }
  if (heatPctChange !== null && heatPctChange <= -2) {
    return {
      riskLevel,
      heatLabel,
      actionLabel: '暂停加仓',
      reason: `${theme} 热度转弱，先等主题企稳，再判断是否继续持有或降低仓位。`,
    };
  }
  return {
    riskLevel,
    heatLabel,
    actionLabel: '持有观察',
    reason: `${theme} 暂无强动作信号，按权重、主题逻辑和价格触发线继续复盘。`,
  };
}

function buildDailyActions(
  dataStatus: PortfolioDecisionDataStatusDto,
  decisions: readonly PortfolioPositionDecisionDto[],
  themeRadar: readonly PortfolioThemeRadarDto[],
  fundSignals: readonly PortfolioFundSignalDto[],
): readonly PortfolioDailyActionDto[] {
  const actions: PortfolioDailyActionDto[] = [];
  const attentionDecisions = decisions
    .filter((decision) => decision.systemAction.needsAttention)
    .sort(compareSystemActionSeverity);
  const reduceRiskDecisions = attentionDecisions.filter((decision) => decision.systemAction.code === 'reduce_risk');
  const avoidAddDecisions = attentionDecisions.filter((decision) => decision.systemAction.code === 'avoid_add');
  const smallAddDecisions = attentionDecisions.filter((decision) => decision.systemAction.code === 'small_add_watch');
  const takeProfitDecisions = attentionDecisions.filter((decision) => decision.systemAction.code === 'take_profit_watch');
  const noActionDecisions = decisions.filter((decision) => !decision.systemAction.needsAttention);
  const crowdedThemes = themeRadar.filter((theme) => theme.riskLevel === 'high');
  const weakFundSignals = fundSignals.filter((signal) => signal.signalLabel === '主题转弱');

  if (dataStatus.quoteCoverage.updated < dataStatus.quoteCoverage.total) {
    actions.push({
      priority: 1,
      phase: '开盘前',
      title: '未覆盖行情标的不操作',
      detail: dataStatus.stalePositionNames.length > 0
        ? `${dataStatus.stalePositionNames.slice(0, 4).join('、')} 今天不买、不卖、不补仓，等行情恢复后再重新生成建议。`
        : '部分持仓行情未覆盖，系统建议这些标的今天不操作。',
      evidence: `真实行情覆盖 ${dataStatus.quoteCoverage.updated}/${dataStatus.quoteCoverage.total}`,
      tone: 'danger',
    });
  }

  if (reduceRiskDecisions.length > 0) {
    actions.push({
      priority: actions.length + 1,
      phase: '盘中',
      title: `需要处理 ${reduceRiskDecisions.length} 只：减仓复核`,
      detail: reduceRiskDecisions.slice(0, 3).map(formatSystemActionDecision).join('；'),
      evidence: reduceRiskDecisions.slice(0, 2).map(formatDecisionEvidence).join(' / ') || '存在明确风控触发',
      tone: 'danger',
    });
  }

  if (avoidAddDecisions.length > 0) {
    actions.push({
      priority: actions.length + 1,
      phase: '盘中',
      title: `禁止加仓 ${avoidAddDecisions.length} 只`,
      detail: avoidAddDecisions.slice(0, 4).map(formatSystemActionDecision).join('；'),
      evidence: '这些标的没有触发卖出，但风险等级或组合拥挤度不支持继续加仓。',
      tone: 'danger',
    });
  }

  if (takeProfitDecisions.length > 0) {
    actions.push({
      priority: actions.length + 1,
      phase: '盘中',
      title: `止盈观察 ${takeProfitDecisions.length} 只`,
      detail: takeProfitDecisions.slice(0, 3).map(formatSystemActionDecision).join('；'),
      evidence: takeProfitDecisions.slice(0, 2).map(formatDecisionEvidence).join(' / '),
      tone: 'wait',
    });
  }

  if (smallAddDecisions.length > 0) {
    actions.push({
      priority: actions.length + 1,
      phase: '盘中',
      title: `可小额分批 ${smallAddDecisions.length} 只`,
      detail: smallAddDecisions.slice(0, 3).map(formatSystemActionDecision).join('；'),
      evidence: '偏强标的只允许小额、分批、等回踩，不追高。',
      tone: 'ready',
    });
  }

  if (crowdedThemes.length > 0 && avoidAddDecisions.length === 0) {
    const topTheme = crowdedThemes[0];
    if (topTheme !== undefined) {
      actions.push({
        priority: actions.length + 1,
        phase: '盘中',
        title: `${topTheme.theme} 不再加仓`,
        detail: `${topTheme.theme} 权重 ${topTheme.weightPercent}%，系统建议今天不增加这个主题仓位，已有仓位继续按个股触发线处理。`,
        evidence: `${topTheme.sourceCount} 个来源：${topTheme.members.slice(0, 4).join('、')}`,
        tone: topTheme.actionLabel.includes('风控') ? 'danger' : 'wait',
      });
    }
  }

  if (weakFundSignals.length > 0) {
    const signal = weakFundSignals[0];
    if (signal !== undefined) {
      actions.push({
        priority: actions.length + 1,
        phase: '盘中',
        title: `暂停追 ${signal.theme}`,
        detail: `${signal.fundName}：系统建议今天不加仓。代理标的 ${signal.proxyName} 转弱，等下一次实时建议再判断。`,
        evidence: signal.proxyPctChange === null ? signal.reason : `${signal.proxyName} ${signal.proxyPctChange}%`,
        tone: 'danger',
      });
    }
  }

  if (attentionDecisions.length === 0) {
    actions.push({
      priority: 1,
      phase: '盘中',
      title: '今天不需要操作',
      detail: noActionDecisions.length > 0
        ? `${noActionDecisions.slice(0, 5).map((decision) => decision.name).join('、')} 等 ${noActionDecisions.length} 只持仓均为“不操作”。系统建议：不买、不卖，继续持有。`
        : '没有持仓触发风控、止盈或低风险加仓条件。系统建议：不买、不卖，继续持有。',
      evidence: dataStatus.label,
      tone: 'ready',
    });
  } else if (noActionDecisions.length > 0) {
    actions.push({
      priority: actions.length + 1,
      phase: '盘中',
      title: `${noActionDecisions.length} 只无需操作`,
      detail: `${noActionDecisions.slice(0, 5).map((decision) => decision.name).join('、')} 当前没有触发买卖条件，保持持有，不需要你处理。`,
      evidence: `需要处理 ${attentionDecisions.length} 只，无需操作 ${noActionDecisions.length} 只。`,
      tone: 'ready',
    });
  }

  actions.push({
    priority: actions.length + 1,
    phase: '收盘后',
    title: '保存今日建议快照',
    detail: '收盘后保存一次建议快照，明天打开时对比风险队列、强势观察和主线变化。',
    evidence: '用于追踪建议变化，不替代交易记录。',
    tone: 'wait',
  });

  return actions.slice(0, 6).map((action, index) => ({ ...action, priority: index + 1 }));
}

function compareSystemActionSeverity(left: PortfolioPositionDecisionDto, right: PortfolioPositionDecisionDto): number {
  const order: Readonly<Record<PortfolioPositionDecisionDto['systemAction']['severity'], number>> = {
    urgent: 0,
    important: 1,
    watch: 2,
    none: 3,
  };
  return order[left.systemAction.severity] - order[right.systemAction.severity];
}

function formatSystemActionDecision(decision: PortfolioPositionDecisionDto): string {
  return `${decision.name}：${decision.systemAction.label}，${decision.systemAction.instruction}`;
}

function formatDecisionEvidence(decision: PortfolioPositionDecisionDto): string {
  const latest = decision.latestPrice === null ? '现价未更新' : `现价 ${decision.latestPrice}`;
  const stop = decision.pricePlan.stopLossPrice === null ? '风控线未生成' : `风控线 ${decision.pricePlan.stopLossPrice}`;
  const pctChange = decision.dailyPctChange === null ? '今日涨跌未更新' : `今日涨跌 ${decision.dailyPctChange}%`;
  return `${decision.name}：${latest}，${stop}，${pctChange}`;
}

function formatDecisionBucketItem(decision: PortfolioPositionDecisionDto): string {
  const theme = decision.reasons.find((reason) => reason.startsWith('主题：'))?.replace('主题：', '').split(' / ')[0]?.trim();
  return theme === undefined || theme.length === 0 || theme === '待补充' ? decision.name : `${decision.name} · ${theme}`;
}

function buildPositionDecision(position: PortfolioPositionDto, preference: PortfolioInvestorPreferenceDto): PortfolioPositionDecisionDto {
  const costPrice = toNumber(position.costPrice);
  const currentPrice = toNumber(position.latestPrice ?? position.costPrice);
  const marketValue = toNumber(position.marketValue) || position.quantity * currentPrice;
  const unrealizedPnl = marketValue - position.quantity * costPrice;
  const pnlPercent = percent(unrealizedPnl, position.quantity * costPrice);
  const dailyPctChange = toNumber(position.dailyPctChange);
  const stopLossPrice = costPrice * (1 - preference.singleStockMaxDrawdownPercent / 100);
  const profitProtectPrice = costPrice * 1.12;
  const addWatchPrice = costPrice * 0.97;
  const strengthConfirmPrice = costPrice * 1.04;
  const hasLivePrice = hasLivePositionQuote(position);
  const coreRobotics = isCoreRoboticsPosition(position) || preference.coreHoldings.includes(position.name) || preference.satelliteHoldings.includes(position.name);
  const coreHolding = preference.coreHoldings.includes(position.name);
  const newHolding = position.holdingStage === 'new';
  const hitStopLoss = hasLivePrice && currentPrice <= stopLossPrice;
  const hitSharpDrop = hasLivePrice && dailyPctChange <= -4;
  const hitStrength = hasLivePrice && currentPrice >= strengthConfirmPrice && dailyPctChange >= 2;
  const action = (position.actionBias === 'risk_control' && !newHolding) || hitStopLoss
    ? 'risk_control'
    : position.actionBias === 'take_profit'
      ? 'take_profit'
      : (position.riskLevel === 'high' || hitSharpDrop) && !hitStrength
        ? 'avoid_add'
        : position.actionBias === 'add' || position.actionBias === 'build' || hitStrength
        ? 'add_on_strength'
        : position.actionBias === 'hold'
          ? 'hold'
          : 'watch';
  const reasons = buildDecisionReasons(position, pnlPercent, dailyPctChange, hasLivePrice, coreRobotics, preference, coreHolding);
  const triggers = buildDecisionTriggers(action, position.name, {
    stopLossPrice,
    profitProtectPrice,
    addWatchPrice,
    strengthConfirmPrice,
  });

  return {
    symbol: position.symbol,
    name: position.name,
    quantity: position.quantity,
    costPrice: position.costPrice,
    latestPrice: position.latestPrice,
    marketValue: money(marketValue),
    unrealizedPnl: money(unrealizedPnl),
    buyDate: position.buyDate,
    holdingStage: position.holdingStage,
    unrealizedPnlPercent: money(pnlPercent),
    dailyPctChange: position.dailyPctChange ?? null,
    action,
    actionLabel: actionLabel(action),
    systemAction: buildSystemAction(action, position.name, coreRobotics),
    riskLevel: position.riskLevel as 'low' | 'medium' | 'high',
    reasons,
    triggers,
    pricePlan: {
      currentPrice: position.latestPrice,
      costPrice: position.costPrice,
      stopLossPrice: money(stopLossPrice),
      profitProtectPrice: money(profitProtectPrice),
      addWatchPrice: money(addWatchPrice),
      strengthConfirmPrice: money(strengthConfirmPrice),
    },
  };
}

function buildDecisionReasons(
  position: PortfolioPositionDto,
  pnlPercent: number,
  dailyPctChange: number,
  hasLivePrice: boolean,
  coreRobotics: boolean,
  preference: PortfolioInvestorPreferenceDto,
  coreHolding: boolean,
): readonly string[] {
  const reasons = [`主题：${position.themeTags.join(' / ') || '待补充'}`];
  if (coreRobotics) {
    reasons.push('长期画像：机器人/物理 AI 是你的核心看好方向，系统对单日波动更宽容，优先控制加仓节奏而不是轻易卖出。');
  }
  if (coreHolding) {
    reasons.push(`持仓分层：${position.name} 是你的核心仓，风控线按单股最大回撤 ${preference.singleStockMaxDrawdownPercent}% 管理。`);
  } else if (position.holdingStage === 'new') {
    reasons.push(`持仓分层：${position.name} 是新买入/观察仓，短期小亏不直接触发减仓，先看是否跌破风控线和买入逻辑。`);
  } else if (position.holdingStage === 'long_term_core') {
    reasons.push(`持仓分层：${position.name} 是长期核心仓，普通波动优先复核逻辑和仓位，不轻易做卖出动作。`);
  } else if (preference.satelliteHoldings.includes(position.name)) {
    reasons.push(`持仓分层：${position.name} 是弹性仓，允许观察但不允许在风险变大时补仓。`);
  }
  if (hasLivePrice) {
    reasons.push(`现价 ${position.latestPrice}，相对成本 ${pnlPercent >= 0 ? '浮盈' : '浮亏'} ${money(pnlPercent)}%。`);
    if (dailyPctChange <= -4) {
      reasons.push(`当日下跌 ${money(Math.abs(dailyPctChange))}%，但相对成本和风控线仍需一起判断；单日下跌只触发禁止加仓，不单独触发减仓。`);
    } else if (dailyPctChange >= 2) {
      reasons.push(`当日上涨 ${money(dailyPctChange)}%，偏强但不追高。`);
    } else {
      reasons.push('当日波动不极端，系统建议当前不操作。');
    }
  } else {
    reasons.push('实时行情未更新，系统建议当前不操作。');
  }
  reasons.push(position.thesisSummary ?? '等待补充持仓逻辑。');
  return reasons;
}

function buildDecisionTriggers(
  action: PortfolioPositionDecisionDto['action'],
  name: string,
  prices: { readonly stopLossPrice: number; readonly profitProtectPrice: number; readonly addWatchPrice: number; readonly strengthConfirmPrice: number },
): readonly string[] {
  if (action === 'risk_control') {
    return [
      `${name} 当前已进入风控动作：不要补仓，优先降低风险或等待反抽减仓确认。`,
      `系统风控参考线 ${money(prices.stopLossPrice)}。`,
    ];
  }
  if (action === 'add_on_strength') {
    return [
      `${name} 当前不追高；只有回踩 ${money(prices.addWatchPrice)} 附近不破，才考虑小额分批。`,
      `若跌回强势确认线 ${money(prices.strengthConfirmPrice)} 下方，取消加仓观察。`,
    ];
  }
  if (action === 'take_profit') {
    return [`系统建议进入止盈观察：若不能站稳 ${money(prices.profitProtectPrice)}，优先保护利润。`];
  }
  if (action === 'avoid_add') {
    return [`系统建议：当前不加仓。等风险等级下降或价格重新站稳 ${money(prices.strengthConfirmPrice)} 后再生成新建议。`];
  }
  return ['系统建议：当前不操作，继续持有。'];
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

function buildSystemAction(
  action: PortfolioPositionDecisionDto['action'],
  name: string,
  coreRobotics = false,
): PortfolioPositionDecisionDto['systemAction'] {
  if (action === 'risk_control') {
    return {
      code: 'reduce_risk',
      label: '减仓复核',
      severity: 'urgent',
      needsAttention: true,
      instruction: `${name} 已触发风控条件，今天建议不加仓、不补仓，优先考虑降低风险或等待反抽减仓确认。`,
    };
  }
  if (action === 'avoid_add') {
    return {
      code: 'avoid_add',
      label: '禁止加仓',
      severity: 'important',
      needsAttention: true,
      instruction: coreRobotics
        ? `${name} 属于你长期看好的机器人方向，但当前波动或风险等级偏高，系统建议不加仓、不补仓，保留底仓等待更好的加仓位置。`
        : `${name} 当前风险较高，系统建议不加仓、不补仓。`,
    };
  }
  if (action === 'add_on_strength') {
    return {
      code: 'small_add_watch',
      label: '可小额分批',
      severity: 'watch',
      needsAttention: true,
      instruction: `${name} 偏强但不追高，只在回踩不破且主题继续强时考虑小额分批。`,
    };
  }
  if (action === 'take_profit') {
    return {
      code: 'take_profit_watch',
      label: '止盈观察',
      severity: 'important',
      needsAttention: true,
      instruction: `${name} 进入止盈观察，不能站稳保护线时优先保护利润。`,
    };
  }
  return {
    code: 'no_action',
    label: '不操作',
    severity: 'none',
    needsAttention: false,
    instruction: `${name} 当前没有触发买卖条件，系统建议继续持有，不需要操作。`,
  };
}

function defaultInvestorPreference(): PortfolioInvestorPreferenceDto {
  return {
    horizon: '1-3 年长线持有',
    coreView: '长期看好机器人 / 物理 AI 方向',
    roboticsMaxWeightPercent: 35,
    singleStockMaxDrawdownPercent: 18,
    portfolioMaxDrawdownPercent: 10,
    coreHoldings: ['拓普集团', '三花智控'],
    satelliteHoldings: ['巨轮智能', '宁波韵升'],
    rebalanceCadence: '每月复盘，重大风险才临时调整',
    cashPlan: '暂未配置新增资金计划',
    trimOrder: ['绿电', '消费', '港股科技', '海外科技', '黄金'],
  };
}

function normalizeInvestorPreference(preference: PortfolioInvestorPreferenceDto): PortfolioInvestorPreferenceDto {
  const fallback = defaultInvestorPreference();
  return {
    horizon: preference.horizon?.trim() || fallback.horizon,
    coreView: preference.coreView?.trim() || fallback.coreView,
    roboticsMaxWeightPercent: clampNumber(preference.roboticsMaxWeightPercent, 0, 100, fallback.roboticsMaxWeightPercent),
    singleStockMaxDrawdownPercent: clampNumber(preference.singleStockMaxDrawdownPercent, 0, 80, fallback.singleStockMaxDrawdownPercent),
    portfolioMaxDrawdownPercent: clampNumber(preference.portfolioMaxDrawdownPercent, 0, 60, fallback.portfolioMaxDrawdownPercent),
    coreHoldings: normalizeStringList(preference.coreHoldings, fallback.coreHoldings),
    satelliteHoldings: normalizeStringList(preference.satelliteHoldings, fallback.satelliteHoldings),
    rebalanceCadence: preference.rebalanceCadence?.trim() || fallback.rebalanceCadence,
    cashPlan: preference.cashPlan?.trim() || fallback.cashPlan,
    trimOrder: normalizeStringList(preference.trimOrder, fallback.trimOrder),
  };
}

function normalizeStringList(value: readonly string[] | undefined, fallback: readonly string[]): readonly string[] {
  const items = (value ?? []).map((item) => item.trim()).filter(Boolean);
  return items.length > 0 ? items : fallback;
}

function clampNumber(value: number, min: number, max: number, fallback: number): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.min(Math.max(parsed, min), max) : fallback;
}

function buildInvestorProfile(preference: PortfolioInvestorPreferenceDto): PortfolioTradingDecisionDto['investorProfile'] {
  return {
    horizon: preference.horizon,
    style: '成长方向配置 + 主题产业趋势跟踪 + 分批调整。',
    coreView: `${preference.coreView}，机器人方向上限暂按 ${preference.roboticsMaxWeightPercent}% 管理。`,
    principles: [
      '核心方向优先看产业逻辑、仓位上限、回撤容忍和基本面反证，不因单日波动轻易清仓。',
      `单股最大回撤容忍 ${preference.singleStockMaxDrawdownPercent}%，组合最大回撤容忍 ${preference.portfolioMaxDrawdownPercent}%。`,
      `核心仓：${preference.coreHoldings.join('、')}；弹性仓：${preference.satelliteHoldings.join('、')}。`,
      '只有跌破风控线、持仓逻辑被证伪、仓位超过上限或出现更好替代标的时，才进入减仓复核。',
      `若需要给机器人方向腾仓，优先考虑：${preference.trimOrder.join('、')}。`,
    ],
  };
}

function buildQuestionsForInvestor(
  context: PortfolioContextDto,
  decisions: readonly PortfolioPositionDecisionDto[],
  themeRadar: readonly PortfolioThemeRadarDto[],
  preference: PortfolioInvestorPreferenceDto,
): PortfolioTradingDecisionDto['questionsForInvestor'] {
  const roboticsTheme = themeRadar.find((theme) => theme.theme === 'AI / 机器人');
  const roboticsNames = decisions.filter((decision) => isRoboticsText(`${decision.name} ${decision.reasons.join(' ')}`)).map((decision) => decision.name);
  return [
    {
      id: 'robotics_max_weight',
      question: `机器人/物理 AI 方向当前上限配置为 ${preference.roboticsMaxWeightPercent}%。这个上限是否符合你的真实想法？当前系统识别到相关持仓：${roboticsNames.join('、') || '待确认'}${roboticsTheme === undefined ? '' : `，主题权重约 ${roboticsTheme.weightPercent}%`}。`,
      reason: '没有主题仓位上限，系统只能提醒拥挤，不能判断该加仓还是停止加仓。',
    },
    {
      id: 'drawdown_tolerance',
      question: '单只股票和整个组合分别能接受多大回撤？例如单股 -15%、组合 -8% 是否还能继续持有？',
      reason: '长线策略最重要的是提前定义“能忍受的波动”和“必须处理的风险”。',
    },
    {
      id: 'core_robotics_names',
      question: '在宁波韵升、拓普集团、巨轮智能、三花智控里，哪些是你愿意长期持有 1-3 年的核心仓，哪些只是机器人主题弹性仓？',
      reason: '核心仓和弹性仓的风控规则不同，不能用同一套卖出标准。',
    },
    {
      id: 'cash_plan',
      question: `未来 3-6 个月是否还有新增资金？如果有，是定投、一次性加仓，还是只在大跌时补？当前已知组合规模约 ${context.summary.knownPortfolioValue} 元。`,
      reason: '是否有后续现金流，会直接影响系统给出“等待回踩”还是“调仓腾挪”的建议。',
    },
    {
      id: 'non_core_trim_order',
      question: '如果需要给机器人方向腾仓，你更愿意先减哪类非核心资产：海外科技、黄金、绿电、消费、港股科技，还是完全不想减？',
      reason: '长线组合不是只看买什么，也要知道资金从哪里来。',
    },
  ];
}

function buildPreferenceAdvice(
  decisions: readonly PortfolioPositionDecisionDto[],
  themeRadar: readonly PortfolioThemeRadarDto[],
  preference: PortfolioInvestorPreferenceDto,
): readonly PortfolioAdviceItemDto[] {
  const advice = decisions.map<PortfolioAdviceItemDto>((decision) => {
    const coreRobotics = isRoboticsText(`${decision.name} ${decision.reasons.join(' ')}`);
    const reason = coreRobotics
      ? '该标的属于你长期看好的机器人/物理 AI 方向，偏好建议更重视长期逻辑、仓位上限和回撤容忍。'
      : '该标的不属于当前最核心机器人假设，偏好建议更重视组合平衡和资金效率。';
    return {
      source: 'preference',
      targetType: 'stock',
      targetName: decision.name,
      targetCode: decision.symbol,
      action: decision.systemAction.code,
      actionLabel: decision.systemAction.label,
      severity: decision.systemAction.severity,
      confidence: preference.coreHoldings.includes(decision.name) ? '高' : coreRobotics ? '中高' : '中',
      reason,
      evidence: decision.systemAction.instruction,
    };
  });

  const roboticsTheme = themeRadar.find((theme) => theme.theme === 'AI / 机器人');
  if (roboticsTheme !== undefined) {
    const overLimit = toNumber(roboticsTheme.weightPercent) >= preference.roboticsMaxWeightPercent;
    advice.unshift({
      source: 'preference',
      targetType: 'theme',
      targetName: roboticsTheme.theme,
      targetCode: null,
      action: overLimit ? 'cap_theme_weight' : 'hold_core_theme',
      actionLabel: overLimit ? '控制主题仓位' : '核心方向持有',
      severity: overLimit ? 'important' : 'watch',
      confidence: '中高',
      reason: `${preference.coreView}。系统按你配置的 ${preference.roboticsMaxWeightPercent}% 主题上限判断是否继续加仓。`,
      evidence: `${roboticsTheme.theme} 当前权重 ${roboticsTheme.weightPercent}%，上限 ${preference.roboticsMaxWeightPercent}%，来源 ${roboticsTheme.sourceCount} 个：${roboticsTheme.members.slice(0, 5).join('、')}`,
    });
  }

  return advice.slice(0, 8);
}

function buildQuantAdvice(
  decisions: readonly PortfolioPositionDecisionDto[],
  dataStatus: PortfolioDecisionDataStatusDto,
): readonly PortfolioAdviceItemDto[] {
  if (dataStatus.status !== 'live') {
    return [{
      source: 'quant',
      targetType: 'portfolio',
      targetName: '组合',
      targetCode: null,
      action: 'no_signal',
      actionLabel: '无量化信号',
      severity: 'none',
      confidence: '低',
      reason: '量化建议依赖实时行情；当前行情未更新，不生成买卖信号。',
      evidence: dataStatus.label,
    }];
  }

  return decisions.map<PortfolioAdviceItemDto>((decision) => {
    const latestPrice = toNumber(decision.latestPrice);
    const stopLossPrice = toNumber(decision.pricePlan.stopLossPrice);
    const addWatchPrice = toNumber(decision.pricePlan.addWatchPrice);
    const strengthConfirmPrice = toNumber(decision.pricePlan.strengthConfirmPrice);
    const dailyPctChange = toNumber(decision.dailyPctChange);
    const hasQuote = decision.latestPrice !== null;
    if (!hasQuote) {
      return {
        source: 'quant',
        targetType: 'stock',
        targetName: decision.name,
        targetCode: decision.symbol,
        action: 'no_signal',
        actionLabel: '无信号',
        severity: 'none',
        confidence: '低',
        reason: '没有实时价格，量化模型不输出交易建议。',
        evidence: '行情未覆盖',
      };
    }
    if (latestPrice <= stopLossPrice) {
      return {
        source: 'quant',
        targetType: 'stock',
        targetName: decision.name,
        targetCode: decision.symbol,
        action: 'risk_reduce',
        actionLabel: '量化减仓信号',
        severity: 'urgent',
        confidence: latestPrice <= stopLossPrice ? '高' : '中',
        reason: '量化规则只看价格和波动，不考虑长期偏好；当前价格已经跌破风控线。',
        evidence: `现价 ${decision.latestPrice}，风控线 ${decision.pricePlan.stopLossPrice}，今日涨跌 ${decision.dailyPctChange ?? '--'}%。`,
      };
    }
    if (latestPrice >= strengthConfirmPrice && dailyPctChange >= 2) {
      return {
        source: 'quant',
        targetType: 'stock',
        targetName: decision.name,
        targetCode: decision.symbol,
        action: 'momentum_watch',
        actionLabel: '量化强势观察',
        severity: 'watch',
        confidence: '中',
        reason: '价格站上强势确认线且日内强度较高，量化侧进入强势观察，但仍不代表追高买入。',
        evidence: `现价 ${decision.latestPrice}，强势确认线 ${decision.pricePlan.strengthConfirmPrice}，今日涨跌 ${decision.dailyPctChange ?? '--'}%。`,
      };
    }
    if (latestPrice <= addWatchPrice && dailyPctChange > -4) {
      return {
        source: 'quant',
        targetType: 'stock',
        targetName: decision.name,
        targetCode: decision.symbol,
        action: 'pullback_watch',
        actionLabel: '回踩观察',
        severity: 'watch',
        confidence: '中',
        reason: '价格接近回踩观察区但未触发风控，量化侧只提示观察，不直接建议买入。',
        evidence: `现价 ${decision.latestPrice}，回踩观察线 ${decision.pricePlan.addWatchPrice}。`,
      };
    }
    return {
      source: 'quant',
      targetType: 'stock',
      targetName: decision.name,
      targetCode: decision.symbol,
      action: 'no_trade',
      actionLabel: '量化不交易',
      severity: 'none',
      confidence: '中',
      reason: '没有触发风控、强势确认或回踩观察条件。',
      evidence: `现价 ${decision.latestPrice}，今日涨跌 ${decision.dailyPctChange ?? '--'}%。`,
    };
  }).sort(compareAdviceSeverity).slice(0, 8);
}

function buildQuantAdviceFromSignals(
  signals: readonly PortfolioQuantSignalDto[],
  dataStatus: PortfolioDecisionDataStatusDto,
): readonly PortfolioAdviceItemDto[] {
  if (dataStatus.status !== 'live' && signals.every((signal) => signal.dataStatus === 'unavailable')) {
    return [{
      source: 'quant',
      targetType: 'portfolio',
      targetName: '组合',
      targetCode: null,
      action: 'no_signal',
      actionLabel: '无量化信号',
      severity: 'none',
      confidence: '低',
      reason: '量化建议依赖实时行情或真实日线；当前数据不可用。',
      evidence: dataStatus.label,
    }];
  }

  return signals.map<PortfolioAdviceItemDto>((signal) => ({
    source: 'quant',
    targetType: 'stock',
    targetName: signal.name,
    targetCode: signal.symbol,
    action: signal.action,
    actionLabel: signal.actionLabel,
    severity: signal.action === 'risk_reduce' ? 'urgent' : signal.action === 'avoid_add' ? 'important' : signal.action.includes('watch') ? 'watch' : 'none',
    confidence: signal.confidence,
    reason: signal.reasons.join(' '),
    evidence: signal.evidence,
  })).sort(compareAdviceSeverity).slice(0, 10);
}

function buildQuantSignal(
  position: PortfolioPositionDto,
  decision: PortfolioPositionDecisionDto | undefined,
  bars: readonly DailyBarRawData[],
  preference: PortfolioInvestorPreferenceDto,
): PortfolioQuantSignalDto {
  const latestPrice = position.latestPrice;
  const closes = bars.map((bar) => bar.close).filter((value) => Number.isFinite(value));
  const latestClose = closes.at(-1) ?? toNumber(latestPrice);
  const ma5 = movingAverage(closes, 5);
  const ma20 = movingAverage(closes, 20);
  const high20 = closes.slice(-20).reduce((max, value) => Math.max(max, value), 0);
  const drawdown = high20 > 0 ? percent(latestClose - high20, high20) : null;
  const trend = ma5 === null || ma20 === null
    ? 'unknown'
    : ma5 > ma20 * 1.01
      ? 'uptrend'
      : ma5 < ma20 * 0.99
        ? 'downtrend'
        : 'sideways';
  const riskLineNumber = toNumber(position.costPrice) * (1 - preference.singleStockMaxDrawdownPercent / 100);
  const riskLine = money(riskLineNumber);
  const dailyPctChange = toNumber(position.dailyPctChange);
  const hasHistory = bars.length >= 5;
  const hasQuote = hasLivePositionQuote(position);
  const newHolding = position.holdingStage === 'new';
  const dataStatus: PortfolioQuantSignalDto['dataStatus'] = hasHistory ? 'historical' : hasQuote ? 'quote_only' : 'unavailable';
  const latest = hasHistory ? latestClose : toNumber(latestPrice);
  const reasons: string[] = [];
  let action = 'no_trade';
  let actionLabel = '量化不交易';
  let confidence: PortfolioQuantSignalDto['confidence'] = hasHistory ? '中' : hasQuote ? '低' : '低';

  if (!hasHistory && !hasQuote) {
    reasons.push('没有实时行情，也没有可用日线，量化侧不输出交易动作。');
    action = 'no_signal';
    actionLabel = '无量化信号';
  } else if (latest <= riskLineNumber || (!newHolding && drawdown !== null && drawdown <= -12 && trend === 'downtrend' && toNumber(position.unrealizedPnl) < 0)) {
    action = 'risk_reduce';
    actionLabel = '量化减仓信号';
    confidence = latest <= riskLineNumber || (hasHistory && trend === 'downtrend') ? '高' : '中';
    reasons.push('价格触发风控条件，量化侧优先控制风险。');
  } else if (dailyPctChange <= -4) {
    action = 'avoid_add';
    actionLabel = '量化禁止加仓';
    confidence = '中';
    reasons.push('当日跌幅较大，但没有跌破风控线；量化侧只禁止补仓，不建议减仓。');
  } else if (trend === 'downtrend') {
    action = 'avoid_add';
    actionLabel = '量化禁止加仓';
    confidence = '中';
    reasons.push(newHolding ? '新买入持仓短期趋势偏弱，未跌破风控线前不建议减仓，但趋势修复前禁止补仓。' : '短期均线弱于中期均线，趋势没有修复前不加仓。');
  } else if (trend === 'uptrend' && dailyPctChange >= 2) {
    action = 'momentum_watch';
    actionLabel = '量化强势观察';
    confidence = '中';
    reasons.push('短期均线强于中期均线，且日内强度偏高，只进入强势观察，不追高。');
  } else if (decision?.action === 'add_on_strength') {
    action = 'pullback_watch';
    actionLabel = '回踩观察';
    confidence = '中';
    reasons.push('持仓处于偏强观察，但需要等待回踩不破再考虑小额分批。');
  } else {
    reasons.push('没有触发风控、趋势转弱、强势确认或回踩观察条件。');
  }

  if (ma5 !== null && ma20 !== null) {
    reasons.push(`5 日均线 ${money(ma5)}，20 日均线 ${money(ma20)}。`);
  }
  if (drawdown !== null) {
    reasons.push(`距离近 20 日高点回撤 ${money(Math.abs(drawdown))}%。`);
  }

  return {
    symbol: position.symbol,
    name: position.name,
    dataStatus,
    latestPrice: latest > 0 ? decimal(latest, 6) : latestPrice,
    ma5: ma5 === null ? null : money(ma5),
    ma20: ma20 === null ? null : money(ma20),
    drawdownFrom20HighPercent: drawdown === null ? null : money(drawdown),
    trend,
    riskLine,
    action,
    actionLabel,
    confidence,
    reasons,
    evidence: hasHistory
      ? `日线 ${bars[0]?.tradeDate ?? '--'} 至 ${bars.at(-1)?.tradeDate ?? '--'}，${reasons.join(' ')}`
      : hasQuote
        ? `实时行情 ${position.quoteSource ?? '--'}，现价 ${position.latestPrice}，今日涨跌 ${position.dailyPctChange ?? '--'}%。`
        : '行情与日线均不可用。',
  };
}

function buildAdviceBacktestItem(
  track: 'preference' | 'quant',
  advice: PortfolioAdviceItemDto,
  bars: readonly DailyBarRawData[] | undefined,
  positions: readonly PortfolioPositionDto[],
  endDate: string,
): PortfolioAdviceBacktestItemDto {
  const position = positions.find((item) => item.symbol === advice.targetCode);
  const history = [...(bars ?? [])].sort((left, right) => left.tradeDate.localeCompare(right.tradeDate));
  const start = history[0];
  const end = history.at(-1);
  if (start === undefined || end === undefined || history.length < 2) {
    if (position !== undefined && position.latestPrice !== null) {
      const startPrice = toNumber(position.costPrice);
      const endPrice = toNumber(position.latestPrice);
      const returnPercent = percent(endPrice - startPrice, startPrice);
      const verdict = judgeAdviceVerdict(advice.action, returnPercent);
      return {
        track,
        symbol: advice.targetCode ?? '',
        name: advice.targetName,
        action: advice.action,
        actionLabel: advice.actionLabel,
        startDate: '持仓成本',
        endDate,
        startPrice: money(startPrice),
        endPrice: money(endPrice),
        returnPercent: money(returnPercent),
        verdict,
        explanation: explainAdviceBacktestWithQuoteFallback(track, advice, returnPercent, verdict, position.quoteSource),
      };
    }
    return {
      track,
      symbol: advice.targetCode ?? '',
      name: advice.targetName,
      action: advice.action,
      actionLabel: advice.actionLabel,
      startDate: '--',
      endDate: '--',
      startPrice: '--',
      endPrice: position?.latestPrice ?? '--',
      returnPercent: '--',
      verdict: '证据不足',
      explanation: '缺少执行日至今的真实日线，也没有拿到该标的真实现价，不能判断这条建议有效还是无效。',
    };
  }
  const returnPercent = percent(end.close - start.close, start.close);
  const verdict = judgeAdviceVerdict(advice.action, returnPercent);
  return {
    track,
    symbol: advice.targetCode ?? '',
    name: advice.targetName,
    action: advice.action,
    actionLabel: advice.actionLabel,
    startDate: start.tradeDate,
    endDate: end.tradeDate,
    startPrice: money(start.close),
    endPrice: money(end.close),
    returnPercent: money(returnPercent),
    verdict,
    explanation: explainAdviceBacktest(track, advice, returnPercent, verdict),
  };
}

function explainAdviceBacktestWithQuoteFallback(
  track: 'preference' | 'quant',
  advice: PortfolioAdviceItemDto,
  returnPercent: number,
  verdict: PortfolioAdviceBacktestItemDto['verdict'],
  quoteSource: string | null | undefined,
): string {
  const trackLabel = track === 'preference' ? '投资偏好建议' : '量化建议';
  const sourceText = quoteSource === null || quoteSource === undefined ? '真实现价' : `${quoteSource} 真实现价`;
  if (verdict === '有效') {
    return `${trackLabel}「${advice.actionLabel}」目前看有效：暂缺历史日线，系统用持仓成本和${sourceText}做即时复盘，当前收益 ${money(returnPercent)}%，与该动作方向一致。`;
  }
  if (verdict === '无效') {
    return `${trackLabel}「${advice.actionLabel}」目前看无效：暂缺历史日线，系统用持仓成本和${sourceText}做即时复盘，当前收益 ${money(returnPercent)}%，与该动作方向相反，需要降低置信度。`;
  }
  return `${trackLabel}「${advice.actionLabel}」目前看中性：暂缺历史日线，系统用持仓成本和${sourceText}做即时复盘，当前收益 ${money(returnPercent)}%，没有形成明显好坏。`;
}

function judgeAdviceVerdict(action: string, returnPercent: number): PortfolioAdviceBacktestItemDto['verdict'] {
  const defensive = action.includes('risk') || action.includes('reduce') || action.includes('avoid') || action.includes('cap');
  const constructive = action.includes('add') || action.includes('watch') || action.includes('hold') || action.includes('momentum') || action.includes('pullback');
  if (Math.abs(returnPercent) < 1) {
    return '中性';
  }
  if (defensive) {
    return returnPercent < 0 ? '有效' : returnPercent > 3 ? '无效' : '中性';
  }
  if (constructive) {
    return returnPercent > 0 ? '有效' : returnPercent < -3 ? '无效' : '中性';
  }
  return '中性';
}

function explainAdviceBacktest(
  track: 'preference' | 'quant',
  advice: PortfolioAdviceItemDto,
  returnPercent: number,
  verdict: PortfolioAdviceBacktestItemDto['verdict'],
): string {
  const trackLabel = track === 'preference' ? '投资偏好建议' : '量化建议';
  if (verdict === '证据不足') {
    return `${trackLabel}缺少历史价格证据，不能复盘。`;
  }
  if (verdict === '有效') {
    return `${trackLabel}「${advice.actionLabel}」目前看有效：复盘区间收益 ${money(returnPercent)}%，与该动作方向一致。`;
  }
  if (verdict === '无效') {
    return `${trackLabel}「${advice.actionLabel}」目前看无效：复盘区间收益 ${money(returnPercent)}%，与该动作方向相反，需要降低置信度。`;
  }
  return `${trackLabel}「${advice.actionLabel}」目前看中性：复盘区间收益 ${money(returnPercent)}%，没有形成明显好坏。`;
}

function buildAdviceBacktestSummary(
  track: 'preference' | 'quant',
  items: readonly PortfolioAdviceBacktestItemDto[],
): PortfolioAdviceBacktestSummaryDto {
  const scoped = items.filter((item) => item.track === track);
  const effective = scoped.filter((item) => item.verdict === '有效').length;
  const ineffective = scoped.filter((item) => item.verdict === '无效').length;
  const inconclusive = scoped.length - effective - ineffective;
  const decisive = effective + ineffective;
  const effectiveRate = decisive === 0 ? 0 : percent(effective, decisive);
  const label = track === 'preference' ? '投资偏好建议' : '量化建议';
  return {
    track,
    total: scoped.length,
    effective,
    ineffective,
    inconclusive,
    effectiveRate: money(effectiveRate),
    conclusion: decisive === 0
      ? `${label}暂无足够历史证据。`
      : `${label}本次可判定 ${decisive} 条，有效 ${effective} 条，无效 ${ineffective} 条，有效率 ${money(effectiveRate)}%。`,
  };
}

function movingAverage(values: readonly number[], window: number): number | null {
  if (values.length < window) {
    return null;
  }
  const slice = values.slice(-window);
  return slice.reduce((sum, value) => sum + value, 0) / window;
}

function sortDailyBars(bars: readonly DailyBarRawData[]): readonly DailyBarRawData[] {
  return [...bars].sort((left, right) => left.tradeDate.localeCompare(right.tradeDate));
}

function compareAdviceSeverity(left: PortfolioAdviceItemDto, right: PortfolioAdviceItemDto): number {
  const order: Readonly<Record<PortfolioAdviceItemDto['severity'], number>> = {
    urgent: 0,
    important: 1,
    watch: 2,
    none: 3,
  };
  return order[left.severity] - order[right.severity];
}

function isCoreRoboticsPosition(position: PortfolioPositionDto): boolean {
  return isRoboticsText(`${position.name} ${position.themeTags.join(' ')} ${position.thesisSummary ?? ''}`);
}

function isRoboticsText(text: string): boolean {
  return text.includes('机器人') || text.includes('物理AI') || text.includes('物理 AI') || text.includes('执行器');
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

function todayDate(): string {
  return new Date().toISOString().slice(0, 10).replaceAll('-', '');
}

function daysAgoDate(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date.toISOString().slice(0, 10).replaceAll('-', '');
}
