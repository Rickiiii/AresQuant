import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class PortfolioAccountDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty({ enum: ['STOCK', 'FUND', 'MIXED'] })
  accountType!: string;

  @ApiProperty()
  baseCurrency!: string;

  @ApiPropertyOptional({ nullable: true })
  totalAssetValue!: string | null;

  @ApiPropertyOptional({ nullable: true })
  cashValue!: string | null;

  @ApiPropertyOptional({ nullable: true })
  visibleAssetValue!: string | null;

  @ApiPropertyOptional({ nullable: true })
  description!: string | null;
}

export class PortfolioPositionDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  symbol!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty()
  quantity!: number;

  @ApiProperty()
  costPrice!: string;

  @ApiPropertyOptional({ nullable: true })
  latestPrice!: string | null;

  @ApiPropertyOptional({ nullable: true })
  marketValue!: string | null;

  @ApiPropertyOptional({ nullable: true })
  unrealizedPnl!: string | null;

  @ApiPropertyOptional({ nullable: true })
  buyDate!: string | null;

  @ApiProperty({ enum: ['new', 'holding', 'long_term_core'] })
  holdingStage!: 'new' | 'holding' | 'long_term_core';

  @ApiPropertyOptional({ nullable: true })
  dailyChange?: string | null;

  @ApiPropertyOptional({ nullable: true })
  dailyPctChange?: string | null;

  @ApiPropertyOptional({ nullable: true })
  quoteSource?: string | null;

  @ApiProperty({ type: [String] })
  themeTags!: readonly string[];

  @ApiPropertyOptional({ nullable: true })
  thesisSummary!: string | null;

  @ApiProperty({ enum: ['hold', 'add', 'build', 'watch', 'take_profit', 'risk_control'] })
  actionBias!: string;

  @ApiProperty({ enum: ['low', 'medium', 'high'] })
  riskLevel!: string;

  @ApiPropertyOptional({ nullable: true })
  notes!: string | null;
}

export class PortfolioFundExposureDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  name!: string;

  @ApiPropertyOptional({ nullable: true })
  fundCode!: string | null;

  @ApiProperty()
  theme!: string;

  @ApiProperty()
  amount!: string;

  @ApiPropertyOptional({ nullable: true })
  weightPercent!: string | null;

  @ApiProperty({ enum: ['hold', 'add', 'build', 'watch', 'take_profit', 'risk_control'] })
  actionBias!: string;

  @ApiProperty({ enum: ['low', 'medium', 'high'] })
  riskLevel!: string;

  @ApiPropertyOptional({ nullable: true })
  notes!: string | null;
}

export class PortfolioWatchThemeDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  name!: string;

  @ApiPropertyOptional({ nullable: true })
  category!: string | null;

  @ApiProperty()
  priority!: number;

  @ApiProperty({ enum: ['hold', 'add', 'build', 'watch', 'take_profit', 'risk_control'] })
  actionBias!: string;

  @ApiProperty({ enum: ['low', 'medium', 'high'] })
  riskLevel!: string;

  @ApiPropertyOptional({ nullable: true })
  notes!: string | null;
}

export class PortfolioMarketSnapshotDto {
  @ApiProperty()
  code!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty({ enum: ['index', 'theme'] })
  category!: 'index' | 'theme';

  @ApiProperty()
  latestPrice!: string;

  @ApiProperty()
  dailyChange!: string;

  @ApiProperty()
  dailyPctChange!: string;

  @ApiProperty()
  amount!: string;

  @ApiProperty()
  quoteSource!: string;
}

export class PortfolioStockQuoteDto {
  @ApiProperty()
  symbol!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty()
  latestPrice!: string;

  @ApiProperty()
  dailyChange!: string;

  @ApiProperty()
  dailyPctChange!: string;

  @ApiProperty()
  quoteSource!: string;

  @ApiProperty()
  market!: string;

  @ApiProperty()
  suggestedTheme!: string;
}

export class PortfolioFundQuoteDto {
  @ApiProperty()
  fundCode!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty()
  netValueDate!: string;

  @ApiProperty()
  unitNetValue!: string;

  @ApiPropertyOptional({ nullable: true })
  estimatedNetValue!: string | null;

  @ApiPropertyOptional({ nullable: true })
  estimatedPctChange!: string | null;

  @ApiPropertyOptional({ nullable: true })
  estimatedAt!: string | null;

  @ApiProperty()
  quoteSource!: string;
}

export class PortfolioSummaryDto {
  @ApiProperty()
  stockCostValue!: string;

  @ApiProperty()
  visibleFundValue!: string;

  @ApiProperty()
  knownPortfolioValue!: string;

  @ApiProperty()
  stockWeightPercent!: string;

  @ApiProperty()
  fundWeightPercent!: string;
}

export class PortfolioDecisionMarketRegimeDto {
  @ApiProperty({ enum: ['risk_on', 'balanced', 'weak_defensive'] })
  code!: 'risk_on' | 'balanced' | 'weak_defensive';

  @ApiProperty()
  label!: string;

  @ApiProperty()
  score!: string;

  @ApiProperty({ type: [String] })
  reasons!: readonly string[];
}

export class PortfolioDecisionSummaryDto {
  @ApiProperty()
  totalCostValue!: string;

  @ApiProperty()
  totalMarketValue!: string;

  @ApiProperty()
  totalUnrealizedPnl!: string;

  @ApiProperty()
  totalUnrealizedPnlPercent!: string;

  @ApiProperty()
  primaryAction!: string;

  @ApiProperty()
  riskLevel!: 'low' | 'medium' | 'high';
}

export class PortfolioDecisionDataStatusDto {
  @ApiProperty({ enum: ['live', 'fallback'] })
  status!: 'live' | 'fallback';

  @ApiProperty()
  label!: string;

  @ApiProperty()
  updatedAt!: string;

  @ApiProperty({ type: [String] })
  sources!: readonly string[];

  @ApiProperty()
  quoteCoverage!: {
    readonly updated: number;
    readonly total: number;
    readonly ratio: string;
  };

  @ApiProperty({ type: [String] })
  stalePositionNames!: readonly string[];
}

export class PortfolioPositionPricePlanDto {
  @ApiPropertyOptional({ nullable: true })
  currentPrice!: string | null;

  @ApiProperty()
  costPrice!: string;

  @ApiPropertyOptional({ nullable: true })
  stopLossPrice!: string | null;

  @ApiPropertyOptional({ nullable: true })
  profitProtectPrice!: string | null;

  @ApiPropertyOptional({ nullable: true })
  addWatchPrice!: string | null;

  @ApiPropertyOptional({ nullable: true })
  strengthConfirmPrice!: string | null;
}

export class PortfolioPositionSystemActionDto {
  @ApiProperty({ enum: ['no_action', 'reduce_risk', 'avoid_add', 'small_add_watch', 'take_profit_watch'] })
  code!: 'no_action' | 'reduce_risk' | 'avoid_add' | 'small_add_watch' | 'take_profit_watch';

  @ApiProperty()
  label!: string;

  @ApiProperty({ enum: ['none', 'watch', 'important', 'urgent'] })
  severity!: 'none' | 'watch' | 'important' | 'urgent';

  @ApiProperty()
  needsAttention!: boolean;

  @ApiProperty()
  instruction!: string;
}

export class PortfolioPositionDecisionDto {
  @ApiProperty()
  symbol!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty()
  quantity!: number;

  @ApiProperty()
  costPrice!: string;

  @ApiPropertyOptional({ nullable: true })
  latestPrice!: string | null;

  @ApiPropertyOptional({ nullable: true })
  marketValue!: string | null;

  @ApiPropertyOptional({ nullable: true })
  unrealizedPnl!: string | null;

  @ApiPropertyOptional({ nullable: true })
  buyDate?: string | null;

  @ApiProperty({ enum: ['new', 'holding', 'long_term_core'] })
  holdingStage!: 'new' | 'holding' | 'long_term_core';

  @ApiPropertyOptional({ nullable: true })
  unrealizedPnlPercent!: string | null;

  @ApiPropertyOptional({ nullable: true })
  dailyPctChange!: string | null;

  @ApiProperty({ enum: ['hold', 'watch', 'avoid_add', 'add_on_strength', 'take_profit', 'risk_control'] })
  action!: 'hold' | 'watch' | 'avoid_add' | 'add_on_strength' | 'take_profit' | 'risk_control';

  @ApiProperty()
  actionLabel!: string;

  @ApiProperty({ type: PortfolioPositionSystemActionDto })
  systemAction!: PortfolioPositionSystemActionDto;

  @ApiProperty({ enum: ['low', 'medium', 'high'] })
  riskLevel!: 'low' | 'medium' | 'high';

  @ApiProperty({ type: [String] })
  reasons!: readonly string[];

  @ApiProperty({ type: [String] })
  triggers!: readonly string[];

  @ApiProperty({ type: PortfolioPositionPricePlanDto })
  pricePlan!: PortfolioPositionPricePlanDto;
}

export class PortfolioDecisionActionBucketsDto {
  @ApiProperty({ type: [String] })
  hold!: readonly string[];

  @ApiProperty({ type: [String] })
  watch!: readonly string[];

  @ApiProperty({ type: [String] })
  avoidAdd!: readonly string[];

  @ApiProperty({ type: [String] })
  addOnStrength!: readonly string[];

  @ApiProperty({ type: [String] })
  takeProfit!: readonly string[];

  @ApiProperty({ type: [String] })
  riskControl!: readonly string[];
}

export class PortfolioDecisionIntradayPlanDto {
  @ApiProperty({ type: [String] })
  doNow!: readonly string[];

  @ApiProperty({ type: [String] })
  waitFor!: readonly string[];

  @ApiProperty({ type: [String] })
  avoid!: readonly string[];

  @ApiProperty({ type: [String] })
  emergency!: readonly string[];
}

export class PortfolioFundSignalDto {
  @ApiProperty()
  fundName!: string;

  @ApiProperty()
  theme!: string;

  @ApiProperty()
  amount!: string;

  @ApiPropertyOptional({ nullable: true })
  weightPercent!: string | null;

  @ApiProperty()
  proxyCode!: string;

  @ApiProperty()
  proxyName!: string;

  @ApiPropertyOptional({ nullable: true })
  proxyPctChange!: string | null;

  @ApiPropertyOptional({ nullable: true })
  quoteSource!: string | null;

  @ApiProperty()
  signalLabel!: string;

  @ApiProperty()
  actionLabel!: string;

  @ApiProperty()
  reason!: string;
}

export class PortfolioThemeRadarDto {
  @ApiProperty()
  theme!: string;

  @ApiProperty()
  stockValue!: string;

  @ApiProperty()
  fundValue!: string;

  @ApiProperty()
  totalValue!: string;

  @ApiProperty()
  weightPercent!: string;

  @ApiPropertyOptional({ nullable: true })
  heatPctChange!: string | null;

  @ApiProperty()
  sourceCount!: number;

  @ApiProperty({ enum: ['low', 'medium', 'high'] })
  riskLevel!: 'low' | 'medium' | 'high';

  @ApiProperty()
  heatLabel!: string;

  @ApiProperty()
  actionLabel!: string;

  @ApiProperty()
  reason!: string;

  @ApiProperty({ type: [String] })
  members!: readonly string[];
}

export class PortfolioDailyActionDto {
  @ApiProperty()
  priority!: number;

  @ApiProperty({ enum: ['开盘前', '盘中', '收盘后'] })
  phase!: '开盘前' | '盘中' | '收盘后';

  @ApiProperty()
  title!: string;

  @ApiProperty()
  detail!: string;

  @ApiProperty()
  evidence!: string;

  @ApiProperty({ enum: ['ready', 'wait', 'danger'] })
  tone!: 'ready' | 'wait' | 'danger';
}

export class PortfolioInvestorProfileDto {
  @ApiProperty()
  horizon!: string;

  @ApiProperty()
  style!: string;

  @ApiProperty()
  coreView!: string;

  @ApiProperty({ type: [String] })
  principles!: readonly string[];
}

export class PortfolioInvestorPreferenceDto {
  @ApiProperty()
  horizon!: string;

  @ApiProperty()
  coreView!: string;

  @ApiProperty()
  roboticsMaxWeightPercent!: number;

  @ApiProperty()
  singleStockMaxDrawdownPercent!: number;

  @ApiProperty()
  portfolioMaxDrawdownPercent!: number;

  @ApiProperty({ type: [String] })
  coreHoldings!: readonly string[];

  @ApiProperty({ type: [String] })
  satelliteHoldings!: readonly string[];

  @ApiProperty()
  rebalanceCadence!: string;

  @ApiProperty()
  cashPlan!: string;

  @ApiProperty({ type: [String] })
  trimOrder!: readonly string[];
}

export class PortfolioDecisionQuestionDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  question!: string;

  @ApiProperty()
  reason!: string;
}

export class PortfolioAdviceItemDto {
  @ApiProperty({ enum: ['preference', 'quant'] })
  source!: 'preference' | 'quant';

  @ApiProperty({ enum: ['stock', 'fund', 'theme', 'portfolio'] })
  targetType!: 'stock' | 'fund' | 'theme' | 'portfolio';

  @ApiProperty()
  targetName!: string;

  @ApiPropertyOptional({ nullable: true })
  targetCode!: string | null;

  @ApiProperty()
  action!: string;

  @ApiProperty()
  actionLabel!: string;

  @ApiProperty({ enum: ['none', 'watch', 'important', 'urgent'] })
  severity!: 'none' | 'watch' | 'important' | 'urgent';

  @ApiProperty()
  confidence!: string;

  @ApiProperty()
  reason!: string;

  @ApiProperty()
  evidence!: string;
}

export class PortfolioQuantSignalDto {
  @ApiProperty()
  symbol!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty({ enum: ['live', 'historical', 'quote_only', 'unavailable'] })
  dataStatus!: 'live' | 'historical' | 'quote_only' | 'unavailable';

  @ApiPropertyOptional({ nullable: true })
  latestPrice!: string | null;

  @ApiPropertyOptional({ nullable: true })
  ma5!: string | null;

  @ApiPropertyOptional({ nullable: true })
  ma20!: string | null;

  @ApiPropertyOptional({ nullable: true })
  drawdownFrom20HighPercent!: string | null;

  @ApiProperty({ enum: ['uptrend', 'downtrend', 'sideways', 'unknown'] })
  trend!: 'uptrend' | 'downtrend' | 'sideways' | 'unknown';

  @ApiProperty()
  riskLine!: string;

  @ApiProperty()
  action!: string;

  @ApiProperty()
  actionLabel!: string;

  @ApiProperty({ enum: ['低', '中', '高'] })
  confidence!: '低' | '中' | '高';

  @ApiProperty({ type: [String] })
  reasons!: readonly string[];

  @ApiProperty()
  evidence!: string;
}

export class PortfolioAdviceBacktestItemDto {
  @ApiProperty({ enum: ['preference', 'quant'] })
  track!: 'preference' | 'quant';

  @ApiProperty()
  symbol!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty()
  action!: string;

  @ApiProperty()
  actionLabel!: string;

  @ApiProperty()
  startDate!: string;

  @ApiProperty()
  endDate!: string;

  @ApiProperty()
  startPrice!: string;

  @ApiProperty()
  endPrice!: string;

  @ApiProperty()
  returnPercent!: string;

  @ApiProperty({ enum: ['有效', '无效', '中性', '证据不足'] })
  verdict!: '有效' | '无效' | '中性' | '证据不足';

  @ApiProperty()
  explanation!: string;
}

export class PortfolioAdviceBacktestSummaryDto {
  @ApiProperty({ enum: ['preference', 'quant'] })
  track!: 'preference' | 'quant';

  @ApiProperty()
  total!: number;

  @ApiProperty()
  effective!: number;

  @ApiProperty()
  ineffective!: number;

  @ApiProperty()
  inconclusive!: number;

  @ApiProperty()
  effectiveRate!: string;

  @ApiProperty()
  conclusion!: string;
}

export class PortfolioAdviceBacktestDto {
  @ApiProperty()
  generatedAt!: string;

  @ApiProperty()
  startDate!: string;

  @ApiProperty()
  endDate!: string;

  @ApiProperty()
  dataStatus!: string;

  @ApiProperty({ type: [PortfolioAdviceBacktestSummaryDto] })
  summaries!: readonly PortfolioAdviceBacktestSummaryDto[];

  @ApiProperty({ type: [PortfolioAdviceBacktestItemDto] })
  items!: readonly PortfolioAdviceBacktestItemDto[];
}

export class PortfolioTradingDecisionDto {
  @ApiProperty()
  generatedAt!: string;

  @ApiProperty({ type: PortfolioDecisionDataStatusDto })
  dataStatus!: PortfolioDecisionDataStatusDto;

  @ApiProperty({ type: PortfolioDecisionMarketRegimeDto })
  marketRegime!: PortfolioDecisionMarketRegimeDto;

  @ApiProperty({ type: PortfolioDecisionSummaryDto })
  summary!: PortfolioDecisionSummaryDto;

  @ApiProperty({ type: [PortfolioPositionDecisionDto] })
  decisions!: readonly PortfolioPositionDecisionDto[];

  @ApiProperty({ type: PortfolioDecisionActionBucketsDto })
  actionBuckets!: PortfolioDecisionActionBucketsDto;

  @ApiProperty({ type: PortfolioDecisionIntradayPlanDto })
  intradayPlan!: PortfolioDecisionIntradayPlanDto;

  @ApiProperty({ type: [PortfolioMarketSnapshotDto] })
  marketSnapshots!: readonly PortfolioMarketSnapshotDto[];

  @ApiProperty({ type: [PortfolioFundSignalDto] })
  fundSignals!: readonly PortfolioFundSignalDto[];

  @ApiProperty({ type: [PortfolioThemeRadarDto] })
  themeRadar!: readonly PortfolioThemeRadarDto[];

  @ApiProperty({ type: [PortfolioDailyActionDto] })
  dailyActions!: readonly PortfolioDailyActionDto[];

  @ApiProperty({ type: PortfolioInvestorProfileDto })
  investorProfile!: PortfolioInvestorProfileDto;

  @ApiProperty({ type: PortfolioInvestorPreferenceDto })
  investorPreference!: PortfolioInvestorPreferenceDto;

  @ApiProperty({ type: [PortfolioDecisionQuestionDto] })
  questionsForInvestor!: readonly PortfolioDecisionQuestionDto[];

  @ApiProperty({ type: [PortfolioAdviceItemDto] })
  preferenceAdvice!: readonly PortfolioAdviceItemDto[];

  @ApiProperty({ type: [PortfolioAdviceItemDto] })
  quantAdvice!: readonly PortfolioAdviceItemDto[];

  @ApiProperty({ type: [PortfolioQuantSignalDto] })
  quantSignals!: readonly PortfolioQuantSignalDto[];

  @ApiProperty({ type: [String] })
  nextTriggers!: readonly string[];

  @ApiProperty({ type: [String] })
  disclaimers!: readonly string[];
}

export class PortfolioContextDto {
  @ApiProperty({ enum: ['database', 'fallback'] })
  source!: 'database' | 'fallback';

  @ApiProperty()
  owner!: string;

  @ApiProperty()
  accountScope!: string;

  @ApiProperty({ type: PortfolioAccountDto })
  account!: PortfolioAccountDto;

  @ApiProperty({ type: PortfolioSummaryDto })
  summary!: PortfolioSummaryDto;

  @ApiProperty({ type: [PortfolioPositionDto] })
  positions!: readonly PortfolioPositionDto[];

  @ApiProperty({ type: [PortfolioFundExposureDto] })
  fundExposures!: readonly PortfolioFundExposureDto[];

  @ApiProperty({ type: [PortfolioMarketSnapshotDto] })
  marketSnapshots!: readonly PortfolioMarketSnapshotDto[];

  @ApiProperty({ type: [PortfolioWatchThemeDto] })
  watchThemes!: readonly PortfolioWatchThemeDto[];

  @ApiProperty({ type: [String] })
  riskFlags!: readonly string[];

  @ApiProperty({ type: [String] })
  actionRules!: readonly string[];
}
