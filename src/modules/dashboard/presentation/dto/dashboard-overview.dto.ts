import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { BacktestTaskStatus } from '@prisma/client';

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
