import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/database/prisma.service';
import { EastmoneyDataProvider } from '@/modules/data/providers/eastmoney/eastmoney-data-provider';
import type {
  MarketSnapshotRawData,
  MarketSnapshotRequest,
  StockQuoteRawData,
} from '@/modules/data/domain/types/market-data.types';
import type {
  PortfolioAccountDto,
  PortfolioContextDto,
  PortfolioFundExposureDto,
  PortfolioMarketSnapshotDto,
  PortfolioPositionDecisionDto,
  PortfolioPositionDto,
  PortfolioTradingDecisionDto,
  PortfolioWatchThemeDto,
} from '../presentation/dto/portfolio.dto';
import { fallbackPortfolioContext } from './fallback-portfolio-context';

type DecimalLike = {
  readonly toFixed: (decimalPlaces?: number) => string;
};

type DecimalInput = DecimalLike | number | string | null;

interface RawPortfolioPosition {
  readonly id: string;
  readonly symbol: string;
  readonly name: string;
  readonly quantity: number;
  readonly costPrice: DecimalInput;
  readonly latestPrice: DecimalInput;
  readonly marketValue: DecimalInput;
  readonly unrealizedPnl: DecimalInput;
  readonly themeTags: readonly string[];
  readonly thesisSummary: string | null;
  readonly actionBias: string;
  readonly riskLevel: string;
  readonly notes: string | null;
}

interface RawPortfolioFundExposure {
  readonly id: string;
  readonly name: string;
  readonly fundCode: string | null;
  readonly theme: string;
  readonly amount: DecimalInput;
  readonly weightPercent: DecimalInput;
  readonly actionBias: string;
  readonly riskLevel: string;
  readonly notes: string | null;
}

interface RawPortfolioWatchTheme {
  readonly id: string;
  readonly name: string;
  readonly category: string | null;
  readonly priority: number;
  readonly actionBias: string;
  readonly riskLevel: string;
  readonly notes: string | null;
}

interface RawPortfolioAccount {
  readonly id: string;
  readonly name: string;
  readonly accountType: string;
  readonly baseCurrency: string;
  readonly totalAssetValue: DecimalInput;
  readonly cashValue: DecimalInput;
  readonly visibleAssetValue: DecimalInput;
  readonly description: string | null;
  readonly isDefault: boolean;
  readonly positions: readonly RawPortfolioPosition[];
  readonly fundExposures: readonly RawPortfolioFundExposure[];
  readonly watchThemes: readonly RawPortfolioWatchTheme[];
}

@Injectable()
export class PortfolioService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly quoteProvider: Pick<EastmoneyDataProvider, 'getStockQuotes' | 'getMarketSnapshots'>,
  ) {}

  async getContext(): Promise<PortfolioContextDto> {
    const account = await this.findDefaultAccount();

    const context = account === null ? fallbackPortfolioContext : this.mapAccountToContext(account);
    return this.enrichContextWithLiveQuotes(context);
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
    const marketRegime = evaluateMarketRegime(context.marketSnapshots);
    const decisions = context.positions.map((position) => buildPositionDecision(position, marketRegime.code));
    const totalCostValue = context.positions.reduce((sum, position) => sum + position.quantity * parseMoney(position.costPrice), 0);
    const totalMarketValue = decisions.reduce((sum, decision) => sum + parseMoney(decision.marketValue), 0);
    const totalUnrealizedPnl = totalMarketValue - totalCostValue;
    const riskLevel = decisions.some((decision) => decision.riskLevel === 'high') || marketRegime.code === 'weak_defensive'
      ? 'high'
      : decisions.some((decision) => decision.riskLevel === 'medium')
        ? 'medium'
        : 'low';

    return {
      generatedAt: new Date().toISOString(),
      marketRegime,
      summary: {
        totalCostValue: formatFixed(totalCostValue, 2),
        totalMarketValue: formatFixed(totalMarketValue, 2),
        totalUnrealizedPnl: formatFixed(totalUnrealizedPnl, 2),
        totalUnrealizedPnlPercent: formatFixed(percent(totalUnrealizedPnl, totalCostValue), 2),
        primaryAction: marketRegime.code === 'weak_defensive'
          ? '暂停主动补仓，先做风险识别和仓位保护。'
          : '允许小仓位分批试探，但必须等待个股触发条件。',
        riskLevel,
      },
      decisions,
      actionBuckets: buildActionBuckets(decisions),
      intradayPlan: buildIntradayPlan(decisions, marketRegime.code),
      marketSnapshots: context.marketSnapshots,
      nextTriggers: [
        '指数企稳且机器人/AI/半导体主题放量修复后，才重新评估分批加仓。',
        '盈利票若放量跌破成本保护线，优先保护利润而不是继续摊低。',
        '深亏票只有在板块转强、个股放量反包并重新站回关键价格后，才允许重新评估。',
      ],
      disclaimers: [
        '本报告是基于实时/准实时行情和 Ricki 当前持仓的量化辅助决策，不构成投资建议。',
        '自动交易前必须经过回测、模拟盘和人工确认风控。',
      ],
    };
  }

  private async enrichContextWithLiveQuotes(context: PortfolioContextDto): Promise<PortfolioContextDto> {
    let enrichedContext = context;

    if (context.positions.length > 0) {
      try {
        const quotes = await this.quoteProvider.getStockQuotes(context.positions.map((position) => position.symbol));
        const quoteBySymbol = new Map(quotes.map((quote) => [quote.symbol, quote]));
        enrichedContext = {
          ...enrichedContext,
          positions: enrichedContext.positions.map((position) => enrichPositionWithQuote(position, quoteBySymbol.get(position.symbol))),
        };
      } catch {
        enrichedContext = context;
      }
    }

    try {
      const snapshots = await this.quoteProvider.getMarketSnapshots(MARKET_SNAPSHOT_ITEMS);
      return {
        ...enrichedContext,
        marketSnapshots: snapshots.map(mapMarketSnapshot),
      };
    } catch {
      return enrichedContext;
    }
  }

  private async findDefaultAccount(): Promise<RawPortfolioAccount | null> {
    const account = await this.prisma.portfolioAccount.findFirst({
      where: { isDefault: true },
      include: {
        positions: { orderBy: { symbol: 'asc' } },
        fundExposures: { orderBy: [{ weightPercent: 'desc' }, { amount: 'desc' }] },
        watchThemes: { orderBy: [{ priority: 'desc' }, { name: 'asc' }] },
      },
    });

    return account as RawPortfolioAccount | null;
  }

  private mapAccountToContext(account: RawPortfolioAccount): PortfolioContextDto {
    const positions = account.positions.map((position) => this.mapPosition(position));
    const fundExposures = account.fundExposures.map((exposure) => this.mapFundExposure(exposure));
    const watchThemes = account.watchThemes.map((theme) => this.mapWatchTheme(theme));
    const summary = buildSummary(positions, fundExposures, account.visibleAssetValue);

    return {
      source: 'database',
      owner: 'Ricki',
      accountScope: account.name,
      account: this.mapAccount(account),
      summary,
      positions,
      fundExposures,
      marketSnapshots: [],
      watchThemes,
      riskFlags: fallbackPortfolioContext.riskFlags,
      actionRules: fallbackPortfolioContext.actionRules,
    };
  }

  private mapAccount(account: RawPortfolioAccount): PortfolioAccountDto {
    return {
      id: account.id,
      name: account.name,
      accountType: account.accountType,
      baseCurrency: account.baseCurrency,
      totalAssetValue: toMoneyString(account.totalAssetValue),
      cashValue: toMoneyString(account.cashValue),
      visibleAssetValue: toMoneyString(account.visibleAssetValue),
      description: account.description,
    };
  }

  private mapPosition(position: RawPortfolioPosition): PortfolioPositionDto {
    return {
      id: position.id,
      symbol: position.symbol,
      name: position.name,
      quantity: position.quantity,
      costPrice: toDecimalString(position.costPrice, 6) ?? '0.000000',
      latestPrice: toDecimalString(position.latestPrice, 6),
      marketValue: toMoneyString(position.marketValue),
      unrealizedPnl: toMoneyString(position.unrealizedPnl),
      dailyChange: null,
      dailyPctChange: null,
      quoteSource: null,
      themeTags: position.themeTags,
      thesisSummary: position.thesisSummary,
      actionBias: normalizeEnum(position.actionBias),
      riskLevel: normalizeEnum(position.riskLevel),
      notes: position.notes,
    };
  }

  private mapFundExposure(exposure: RawPortfolioFundExposure): PortfolioFundExposureDto {
    return {
      id: exposure.id,
      name: exposure.name,
      fundCode: exposure.fundCode,
      theme: exposure.theme,
      amount: toMoneyString(exposure.amount) ?? '0.00',
      weightPercent: toDecimalString(exposure.weightPercent, 2),
      actionBias: normalizeEnum(exposure.actionBias),
      riskLevel: normalizeEnum(exposure.riskLevel),
      notes: exposure.notes,
    };
  }

  private mapWatchTheme(theme: RawPortfolioWatchTheme): PortfolioWatchThemeDto {
    return {
      id: theme.id,
      name: theme.name,
      category: theme.category,
      priority: theme.priority,
      actionBias: normalizeEnum(theme.actionBias),
      riskLevel: normalizeEnum(theme.riskLevel),
      notes: theme.notes,
    };
  }
}

function enrichPositionWithQuote(
  position: PortfolioPositionDto,
  quote: StockQuoteRawData | undefined,
): PortfolioPositionDto {
  if (quote === undefined) {
    return position;
  }
  const costPrice = Number.parseFloat(position.costPrice);
  const marketValue = position.quantity * quote.latestPrice;
  const unrealizedPnl = marketValue - position.quantity * costPrice;
  return {
    ...position,
    latestPrice: formatFixed(quote.latestPrice, 6),
    marketValue: formatFixed(marketValue, 2),
    unrealizedPnl: formatFixed(unrealizedPnl, 2),
    dailyChange: formatFixed(quote.change, 2),
    dailyPctChange: formatFixed(quote.pctChange, 2),
    quoteSource: quote.source,
  };
}

function mapMarketSnapshot(snapshot: MarketSnapshotRawData): PortfolioMarketSnapshotDto {
  return {
    code: snapshot.code,
    name: snapshot.name,
    category: snapshot.category,
    latestPrice: formatFixed(snapshot.latestPrice, 6),
    dailyChange: formatFixed(snapshot.change, 2),
    dailyPctChange: formatFixed(snapshot.pctChange, 2),
    amount: formatFixed(snapshot.amount, 2),
    quoteSource: snapshot.source,
  };
}

const MARKET_SNAPSHOT_ITEMS: readonly MarketSnapshotRequest[] = [
  { code: '000300.SH', name: '沪深300', category: 'index' },
  { code: '000852.SH', name: '中证1000', category: 'index' },
  { code: '399006.SZ', name: '创业板指', category: 'index' },
  { code: '000688.SH', name: '科创50', category: 'index' },
  { code: '513130.SH', name: '恒生科技ETF', category: 'theme' },
  { code: '159819.SZ', name: '人工智能ETF', category: 'theme' },
  { code: '562500.SH', name: '机器人ETF', category: 'theme' },
  { code: '515880.SH', name: '通信ETF', category: 'theme' },
  { code: '512480.SH', name: '半导体ETF', category: 'theme' },
  { code: '518880.SH', name: '黄金ETF', category: 'theme' },
  { code: '515790.SH', name: '光伏ETF', category: 'theme' },
];

function buildSummary(
  positions: readonly PortfolioPositionDto[],
  fundExposures: readonly PortfolioFundExposureDto[],
  accountVisibleAssetValue: DecimalInput,
): PortfolioContextDto['summary'] {
  const stockCostValue = positions.reduce(
    (sum, position) => sum + position.quantity * Number.parseFloat(position.costPrice),
    0,
  );
  const fallbackFundValue = fundExposures.reduce((sum, exposure) => sum + Number.parseFloat(exposure.amount), 0);
  const visibleFundValue = accountVisibleAssetValue === null ? fallbackFundValue : toNumber(accountVisibleAssetValue);
  const knownPortfolioValue = stockCostValue + visibleFundValue;

  return {
    stockCostValue: formatFixed(stockCostValue, 2),
    visibleFundValue: formatFixed(visibleFundValue, 2),
    knownPortfolioValue: formatFixed(knownPortfolioValue, 2),
    stockWeightPercent: formatFixed(percent(stockCostValue, knownPortfolioValue), 2),
    fundWeightPercent: formatFixed(percent(visibleFundValue, knownPortfolioValue), 2),
  };
}

type MarketRegimeCode = PortfolioTradingDecisionDto['marketRegime']['code'];
type PositionAction = PortfolioPositionDecisionDto['action'];
type PositionRiskLevel = PortfolioPositionDecisionDto['riskLevel'];

function evaluateMarketRegime(
  snapshots: readonly PortfolioMarketSnapshotDto[],
): PortfolioTradingDecisionDto['marketRegime'] {
  const indexSnapshots = snapshots.filter((snapshot) => snapshot.category === 'index');
  const themeSnapshots = snapshots.filter((snapshot) => snapshot.category === 'theme');
  const indexPctChanges = indexSnapshots.map((snapshot) => parseMoney(snapshot.dailyPctChange));
  const themePctChanges = themeSnapshots.map((snapshot) => parseMoney(snapshot.dailyPctChange));
  const negativeIndexCount = indexPctChanges.filter((pctChange) => pctChange < 0).length;
  const averageIndexPct = average(indexPctChanges);
  const averageThemePct = average(themePctChanges);
  const reasons: string[] = [];

  if (indexSnapshots.length === 0) {
    reasons.push('暂无实时指数快照，默认用防守框架处理持仓。');
  }
  if (averageIndexPct <= -0.8 || negativeIndexCount >= 2) {
    reasons.push('主要指数多数走弱，盘面风险偏好下降。');
  }
  if (indexPctChanges.some((pctChange) => pctChange <= -2)) {
    reasons.push('创业板/成长风格存在明显回撤压力。');
  }
  if (averageThemePct <= -2) {
    reasons.push('机器人/AI/半导体等主题快照偏弱，不适合主动扩大风险暴露。');
  }

  if (reasons.length > 0) {
    return {
      code: 'weak_defensive',
      label: '弱势防守',
      score: formatFixed(Math.min(0, averageIndexPct + averageThemePct / 2), 2),
      reasons,
    };
  }

  if (averageIndexPct >= 0.8 && averageThemePct >= 0.5) {
    return {
      code: 'risk_on',
      label: '进攻窗口',
      score: formatFixed(averageIndexPct + averageThemePct / 2, 2),
      reasons: ['指数和主题同步转强，可考虑在触发条件内小仓位分批。'],
    };
  }

  return {
    code: 'balanced',
    label: '震荡观察',
    score: formatFixed(averageIndexPct + averageThemePct / 2, 2),
    reasons: ['指数和主题未形成明确共振，维持观察和低频操作。'],
  };
}

function buildPositionDecision(
  position: PortfolioPositionDto,
  marketRegimeCode: MarketRegimeCode,
): PortfolioPositionDecisionDto {
  const costPrice = parseMoney(position.costPrice);
  const latestPrice = parseMoney(position.latestPrice) || costPrice;
  const marketValue = position.quantity * latestPrice;
  const unrealizedPnl = marketValue - position.quantity * costPrice;
  const unrealizedPnlPercent = percent(latestPrice - costPrice, costPrice);
  const dailyPctChange = position.dailyPctChange === undefined ? null : position.dailyPctChange;
  const dailyPct = parseMoney(dailyPctChange);
  const positionLabel = `${position.symbol} ${position.name}`;
  const reasons: string[] = [];
  const triggers: string[] = [];
  let action: PositionAction = 'hold';
  let actionLabel = '继续持有';
  let riskLevel: PositionRiskLevel = position.riskLevel === 'high' ? 'high' : 'medium';

  if (dailyPct <= -9 && unrealizedPnlPercent > 0) {
    action = 'risk_control';
    actionLabel = '风控观察';
    riskLevel = 'high';
    reasons.push('已有浮盈但出现跌停级别回撤，优先保护利润。');
    triggers.push('若下一交易日继续低开且无法快速收回跌幅，考虑先减一部分。');
  } else if (unrealizedPnlPercent <= -20) {
    action = 'avoid_add';
    actionLabel = '禁止补仓';
    riskLevel = 'high';
    reasons.push('浮亏超过 20%，继续摊低成本会放大单票风险。');
    triggers.push('只有板块转强、个股放量反包并站回关键价格后，才重新评估。');
  } else if (marketRegimeCode === 'weak_defensive' && dailyPct <= -4) {
    action = 'avoid_add';
    actionLabel = '禁止补仓';
    riskLevel = 'high';
    reasons.push('弱势盘面中个股单日跌幅较大，不适合主动补仓。');
    triggers.push('等待指数企稳且主题 ETF 同步修复。');
  } else if (unrealizedPnlPercent >= 8 && dailyPct < -3) {
    action = 'take_profit';
    actionLabel = '止盈观察';
    riskLevel = 'medium';
    reasons.push('浮盈较高但短线转弱，适合观察是否需要锁定利润。');
    triggers.push('若跌破短线支撑且无法修复，考虑分批止盈。');
  } else if (position.themeTags.some((tag) => tag.includes('消费') || tag.includes('农牧')) && dailyPct > 0) {
    action = 'hold';
    actionLabel = '继续持有';
    riskLevel = 'medium';
    reasons.push('逆势走强且具备防御/周期平衡属性，可作为组合稳定器。');
    triggers.push('若猪周期/农业线持续走强，再评估是否小额增强防御仓。');
  } else if (marketRegimeCode === 'risk_on' && dailyPct > 1 && unrealizedPnlPercent > -10) {
    action = 'add_on_strength';
    actionLabel = '强势再评估';
    riskLevel = 'medium';
    reasons.push('市场和个股同步转强，可进入小额分批观察。');
    triggers.push('回踩不破且成交额继续放大时，才允许小仓位试探。');
  } else if (marketRegimeCode === 'weak_defensive') {
    action = 'watch';
    actionLabel = '持有观察';
    reasons.push('弱势市场下默认降低交易频率，不主动扩大仓位。');
    triggers.push('等待指数企稳和主题强弱确认。');
  } else {
    reasons.push('当前没有触发补仓、止盈或风控条件。');
    triggers.push('继续跟踪价格、主题强弱和量能变化。');
  }

  return {
    symbol: position.symbol,
    name: position.name,
    quantity: position.quantity,
    costPrice: position.costPrice,
    latestPrice: position.latestPrice,
    marketValue: formatFixed(marketValue, 2),
    unrealizedPnl: formatFixed(unrealizedPnl, 2),
    unrealizedPnlPercent: formatFixed(unrealizedPnlPercent, 2),
    dailyPctChange: dailyPctChange ?? null,
    action,
    actionLabel,
    riskLevel,
    reasons: [`${positionLabel}：${reasons[0] ?? '维持观察。'}`],
    triggers,
    pricePlan: buildPricePlan(position, action, unrealizedPnlPercent),
  };
}

function buildPricePlan(
  position: PortfolioPositionDto,
  action: PositionAction,
  unrealizedPnlPercent: number,
): PortfolioPositionDecisionDto['pricePlan'] {
  const costPrice = parseMoney(position.costPrice);
  const currentPrice = position.latestPrice === null ? null : parseMoney(position.latestPrice);
  const hasLivePrice = currentPrice !== null && currentPrice > 0;
  const referencePrice = hasLivePrice ? currentPrice : costPrice;
  const isDefensiveHolding = action === 'hold' && position.themeTags.some((tag) => tag.includes('消费') || tag.includes('农牧'));

  return {
    currentPrice: position.latestPrice,
    costPrice: formatFixed(costPrice, 6),
    stopLossPrice: action === 'avoid_add'
      ? formatFixed(referencePrice * 0.95, 2)
      : null,
    profitProtectPrice: unrealizedPnlPercent > 0
      ? formatFixed(Math.max(costPrice * 1.02, referencePrice * 0.95), 2)
      : null,
    addWatchPrice: action === 'add_on_strength' || isDefensiveHolding
      ? formatFixed(referencePrice * 0.99, 2)
      : null,
    strengthConfirmPrice: action === 'avoid_add'
      ? formatFixed(costPrice * 0.9, 2)
      : formatFixed(referencePrice * (isDefensiveHolding ? 1.02 : 1.04), 2),
  };
}

function buildIntradayPlan(
  decisions: readonly PortfolioPositionDecisionDto[],
  marketRegimeCode: MarketRegimeCode,
): PortfolioTradingDecisionDto['intradayPlan'] {
  const riskControls = decisions.filter((decision) => decision.action === 'risk_control' || decision.action === 'take_profit');
  const avoidAdds = decisions.filter((decision) => decision.action === 'avoid_add');
  const addCandidates = decisions.filter((decision) => decision.action === 'add_on_strength');
  const doNow = marketRegimeCode === 'weak_defensive'
    ? ['暂停主动补仓，先做风险识别和仓位保护。']
    : ['维持低频操作，只处理已经触发的价格计划。'];

  return {
    doNow: [
      ...doNow,
      ...riskControls.map((decision) => `${decision.symbol} ${decision.name}：进入风控观察，盯住利润保护线。`),
    ],
    waitFor: [
      '等待指数企稳，并确认机器人/AI/半导体 ETF 至少同步修复。',
      ...decisions.map((decision) => `${decision.symbol} ${decision.name}：站回 ${decision.pricePlan.strengthConfirmPrice} 后再重新评估。`),
      ...addCandidates.map((decision) => `${decision.symbol} ${decision.name}：回踩 ${decision.pricePlan.addWatchPrice} 不破且放量时，才允许小仓位试探。`),
    ],
    avoid: [
      '不追单日急拉，不在弱势盘面扩大高弹性主题仓位。',
      ...avoidAdds.map((decision) => `${decision.symbol} ${decision.name}：深亏/弱势票禁止摊低成本。`),
    ],
    emergency: riskControls.length === 0
      ? ['若指数或主题 ETF 放量破位，先降低交易频率，不新增风险暴露。']
      : riskControls.map((decision) => {
        const protectPrice = decision.pricePlan.profitProtectPrice ?? decision.pricePlan.stopLossPrice ?? decision.pricePlan.costPrice;
        return `${decision.symbol} ${decision.name}：若继续低开且无法收回 ${protectPrice}，优先保护利润。`;
      }),
  };
}

function buildActionBuckets(
  decisions: readonly PortfolioPositionDecisionDto[],
): PortfolioTradingDecisionDto['actionBuckets'] {
  return {
    hold: bucketSymbols(decisions, 'hold'),
    watch: bucketSymbols(decisions, 'watch'),
    avoidAdd: bucketSymbols(decisions, 'avoid_add'),
    addOnStrength: bucketSymbols(decisions, 'add_on_strength'),
    takeProfit: bucketSymbols(decisions, 'take_profit'),
    riskControl: bucketSymbols(decisions, 'risk_control'),
  };
}

function bucketSymbols(
  decisions: readonly PortfolioPositionDecisionDto[],
  action: PositionAction,
): readonly string[] {
  return decisions
    .filter((decision) => decision.action === action)
    .map((decision) => `${decision.symbol} ${decision.name}`);
}

function average(values: readonly number[]): number {
  if (values.length === 0) {
    return 0;
  }

  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function parseMoney(value: string | null | undefined): number {
  if (value === null || value === undefined) {
    return 0;
  }

  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function toMoneyString(value: DecimalInput): string | null {
  return toDecimalString(value, 2);
}

function toDecimalString(value: DecimalInput, decimalPlaces: number): string | null {
  if (value === null) {
    return null;
  }

  if (typeof value === 'number') {
    return value.toFixed(decimalPlaces);
  }

  if (typeof value === 'string') {
    return Number.parseFloat(value).toFixed(decimalPlaces);
  }

  return value.toFixed(decimalPlaces);
}

function toNumber(value: Exclude<DecimalInput, null>): number {
  if (typeof value === 'number') {
    return value;
  }

  if (typeof value === 'string') {
    return Number.parseFloat(value);
  }

  return Number.parseFloat(value.toFixed(6));
}

function formatFixed(value: number, decimalPlaces: number): string {
  return value.toFixed(decimalPlaces);
}

function percent(part: number, total: number): number {
  if (total === 0) {
    return 0;
  }

  return (part / total) * 100;
}

function normalizeEnum(value: string): string {
  return value.toLowerCase();
}
