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
  unrealizedPnlPercent!: string | null;

  @ApiPropertyOptional({ nullable: true })
  dailyPctChange!: string | null;

  @ApiProperty({ enum: ['hold', 'watch', 'avoid_add', 'add_on_strength', 'take_profit', 'risk_control'] })
  action!: 'hold' | 'watch' | 'avoid_add' | 'add_on_strength' | 'take_profit' | 'risk_control';

  @ApiProperty()
  actionLabel!: string;

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

export class PortfolioTradingDecisionDto {
  @ApiProperty()
  generatedAt!: string;

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
