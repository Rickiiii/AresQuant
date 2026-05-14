import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { BacktestOrderStatus, BacktestTaskStatus } from '@prisma/client';

export class DashboardBacktestListItemDto {
  @ApiProperty({ example: 'task-1' })
  readonly id!: string;

  @ApiProperty({ example: 'Multi Factor Backtest' })
  readonly name!: string;

  @ApiProperty({ example: 'multi_factor' })
  readonly strategyName!: string;

  @ApiProperty({ enum: BacktestTaskStatus, example: BacktestTaskStatus.SUCCESS })
  readonly status!: BacktestTaskStatus;

  @ApiProperty({ example: '20260501' })
  readonly startDate!: string;

  @ApiProperty({ example: '20260514' })
  readonly endDate!: string;

  @ApiProperty({ example: '1000000' })
  readonly initialCapital!: string;

  @ApiPropertyOptional({ example: '000300' })
  readonly benchmark?: string;

  @ApiPropertyOptional({ example: 'No trading dates found for backtest range' })
  readonly errorMessage?: string;
}

export class DashboardBacktestMetricsDto {
  @ApiProperty({ example: '0.12' })
  readonly totalReturn!: string;

  @ApiProperty({ example: '0.24' })
  readonly annualizedReturn!: string;

  @ApiProperty({ example: '0.05' })
  readonly maxDrawdown!: string;

  @ApiProperty({ example: '1.6' })
  readonly sharpeRatio!: string;

  @ApiProperty({ example: '2.1' })
  readonly sortinoRatio!: string;

  @ApiProperty({ example: '4.8' })
  readonly calmarRatio!: string;

  @ApiProperty({ example: '0.55' })
  readonly winRate!: string;

  @ApiProperty({ example: '1.3' })
  readonly profitLossRatio!: string;

  @ApiProperty({ example: '0.18' })
  readonly volatility!: string;

  @ApiPropertyOptional({ example: '1.0', nullable: true })
  readonly beta!: string | null;

  @ApiPropertyOptional({ example: '0.03', nullable: true })
  readonly alpha!: string | null;

  @ApiProperty({ example: '0.8' })
  readonly turnoverRate!: string;

  @ApiProperty({ example: 21 })
  readonly tradeCount!: number;
}

export class DashboardEquityPointDto {
  @ApiProperty({ example: '20260514' })
  readonly tradeDate!: string;

  @ApiProperty({ example: '480000' })
  readonly cash!: string;

  @ApiProperty({ example: '640000' })
  readonly marketValue!: string;

  @ApiProperty({ example: '1120000' })
  readonly totalAsset!: string;

  @ApiProperty({ example: '0.12' })
  readonly dailyReturn!: string;

  @ApiProperty({ example: '0.12' })
  readonly cumulativeReturn!: string;

  @ApiProperty({ example: '0' })
  readonly drawdown!: string;
}

export class DashboardPositionDto {
  @ApiProperty({ example: '000001' })
  readonly symbol!: string;

  @ApiProperty({ example: 1000 })
  readonly quantity!: number;

  @ApiProperty({ example: 1000 })
  readonly availableQuantity!: number;

  @ApiProperty({ example: '10' })
  readonly avgCost!: string;

  @ApiProperty({ example: '12' })
  readonly lastPrice!: string;

  @ApiProperty({ example: '12000' })
  readonly marketValue!: string;

  @ApiProperty({ example: '2000' })
  readonly unrealizedPnl!: string;

  @ApiProperty({ example: '0' })
  readonly realizedPnl!: string;

  @ApiPropertyOptional({ example: '20260513' })
  readonly lastBuyDate?: string;

  @ApiPropertyOptional({ example: '20260514', description: 'Position snapshot date when loaded from persisted backtest history' })
  readonly tradeDate?: string;
}

export class DashboardOrderStatsDto {
  @ApiProperty({ example: 10 })
  readonly total!: number;

  @ApiProperty({ example: 8 })
  readonly filled!: number;

  @ApiProperty({ example: 2 })
  readonly rejected!: number;
}

export class DashboardTradeStatsDto {
  @ApiProperty({ example: 21 })
  readonly total!: number;

  @ApiProperty({ example: '120000' })
  readonly amount!: string;

  @ApiProperty({ example: '88' })
  readonly totalFee!: string;
}

export class DashboardBacktestSummaryDto {
  @ApiProperty({ type: DashboardBacktestListItemDto })
  readonly task!: DashboardBacktestListItemDto;

  @ApiPropertyOptional({ type: DashboardBacktestMetricsDto, nullable: true })
  readonly metrics!: DashboardBacktestMetricsDto | null;

  @ApiProperty({ type: [DashboardEquityPointDto] })
  readonly equityCurve!: readonly DashboardEquityPointDto[];

  @ApiProperty({ type: [DashboardPositionDto] })
  readonly positions!: readonly DashboardPositionDto[];

  @ApiProperty({ type: DashboardOrderStatsDto })
  readonly orders!: DashboardOrderStatsDto;

  @ApiProperty({ type: DashboardTradeStatsDto })
  readonly trades!: DashboardTradeStatsDto;
}

export function isFilledOrderStatus(status: BacktestOrderStatus): boolean {
  return status === BacktestOrderStatus.FILLED;
}

export function isRejectedOrderStatus(status: BacktestOrderStatus): boolean {
  return status === BacktestOrderStatus.REJECTED;
}
