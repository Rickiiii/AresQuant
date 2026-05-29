import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { BacktestTaskStatus } from '@prisma/client';

export class DashboardDataSyncDatasetHealthDto {
  @ApiProperty({ example: 'dailyBars' })
  readonly dataSet!: string;

  @ApiProperty({ example: '日线行情' })
  readonly label!: string;

  @ApiProperty({ enum: ['healthy', 'stale', 'empty', 'failed'], example: 'healthy' })
  readonly status!: 'healthy' | 'stale' | 'empty' | 'failed';

  @ApiProperty({ example: 250000 })
  readonly total!: number;

  @ApiPropertyOptional({ example: '20260528', nullable: true })
  readonly latestDate!: string | null;

  @ApiPropertyOptional({ example: 'database timeout' })
  readonly errorMessage?: string;
}

export class DashboardDataSyncHealthDto {
  @ApiProperty({ enum: ['healthy', 'stale', 'empty', 'failed'], example: 'healthy' })
  readonly status!: 'healthy' | 'stale' | 'empty' | 'failed';

  @ApiProperty({ example: '核心行情数据已同步，当前可用于工作台分析。' })
  readonly summary!: string;

  @ApiPropertyOptional({ example: '20260528', nullable: true })
  readonly asOfDate!: string | null;

  @ApiProperty({ example: 0 })
  readonly staleDatasetCount!: number;

  @ApiProperty({ example: 0 })
  readonly emptyDatasetCount!: number;

  @ApiProperty({ example: 0 })
  readonly failedDatasetCount!: number;

  @ApiProperty({ type: [DashboardDataSyncDatasetHealthDto] })
  readonly datasets!: readonly DashboardDataSyncDatasetHealthDto[];
}

export class DashboardDataCenterDto {
  @ApiProperty({ example: 5120 })
  readonly stockCount!: number;

  @ApiProperty({ example: 250000 })
  readonly dailyBarCount!: number;

  @ApiPropertyOptional({ example: '20260514', nullable: true })
  readonly latestDailyBarDate!: string | null;

  @ApiProperty({ example: 32000 })
  readonly financialFactorCount!: number;

  @ApiPropertyOptional({ example: '20260510', nullable: true })
  readonly latestFinancialFactorDate!: string | null;

  @ApiProperty({ type: DashboardDataSyncHealthDto })
  readonly syncHealth!: DashboardDataSyncHealthDto;
}

export class DashboardStrategiesDto {
  @ApiProperty({ example: 3 })
  readonly total!: number;

  @ApiProperty({ example: ['equal-weight', 'momentum-top-n', 'multi-factor'], type: [String] })
  readonly codes!: readonly string[];
}

export class DashboardBacktestStatusDto {
  @ApiProperty({ example: 0 })
  readonly PENDING!: number;

  @ApiProperty({ example: 0 })
  readonly RUNNING!: number;

  @ApiProperty({ example: 2 })
  readonly SUCCESS!: number;

  @ApiProperty({ example: 1 })
  readonly FAILED!: number;

  @ApiProperty({ example: 0 })
  readonly CANCELED!: number;
}

export class DashboardLatestBacktestTaskDto {
  @ApiProperty({ example: 'task-1' })
  readonly id!: string;

  @ApiProperty({ example: 'Phase 3 Mock Backtest' })
  readonly name!: string;

  @ApiProperty({ example: 'equal_weight_mock' })
  readonly strategyName!: string;

  @ApiProperty({ enum: BacktestTaskStatus, example: BacktestTaskStatus.SUCCESS })
  readonly status!: BacktestTaskStatus;

  @ApiProperty({ example: '20260501' })
  readonly startDate!: string;

  @ApiProperty({ example: '20260514' })
  readonly endDate!: string;
}

export class DashboardBacktestsDto {
  @ApiProperty({ example: 3 })
  readonly total!: number;

  @ApiProperty({ type: DashboardBacktestStatusDto })
  readonly byStatus!: DashboardBacktestStatusDto;

  @ApiPropertyOptional({ type: DashboardLatestBacktestTaskDto, nullable: true })
  readonly latestTask!: DashboardLatestBacktestTaskDto | null;
}

export class DashboardOverviewDto {
  @ApiProperty({ type: DashboardDataCenterDto })
  readonly dataCenter!: DashboardDataCenterDto;

  @ApiProperty({ type: DashboardStrategiesDto })
  readonly strategies!: DashboardStrategiesDto;

  @ApiProperty({ type: DashboardBacktestsDto })
  readonly backtests!: DashboardBacktestsDto;
}
