import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Exchange } from '@prisma/client';

export class DashboardDataSetCoverageDto {
  @ApiProperty({ example: 'dailyBars' })
  readonly dataSet!: string;

  @ApiProperty({ example: 250000 })
  readonly total!: number;

  @ApiPropertyOptional({ example: '20260514', nullable: true })
  readonly latestDate!: string | null;
}

export class DashboardDataCenterSummaryDto {
  @ApiProperty({ type: DashboardDataSetCoverageDto })
  readonly stocks!: DashboardDataSetCoverageDto;

  @ApiProperty({ type: DashboardDataSetCoverageDto })
  readonly tradingCalendar!: DashboardDataSetCoverageDto;

  @ApiProperty({ type: DashboardDataSetCoverageDto })
  readonly dailyBars!: DashboardDataSetCoverageDto;

  @ApiProperty({ type: DashboardDataSetCoverageDto })
  readonly indexDailyBars!: DashboardDataSetCoverageDto;

  @ApiProperty({ type: DashboardDataSetCoverageDto })
  readonly limitPrices!: DashboardDataSetCoverageDto;

  @ApiProperty({ type: DashboardDataSetCoverageDto })
  readonly suspensions!: DashboardDataSetCoverageDto;

  @ApiProperty({ type: DashboardDataSetCoverageDto })
  readonly adjFactors!: DashboardDataSetCoverageDto;

  @ApiProperty({ type: DashboardDataSetCoverageDto })
  readonly financialFactors!: DashboardDataSetCoverageDto;
}

export class DashboardStockItemDto {
  @ApiProperty({ example: '000001' })
  readonly symbol!: string;

  @ApiProperty({ example: '000001.SZ' })
  readonly tsCode!: string;

  @ApiProperty({ example: '平安银行' })
  readonly name!: string;

  @ApiProperty({ enum: Exchange, example: Exchange.SZSE })
  readonly exchange!: Exchange;

  @ApiProperty({ example: '主板' })
  readonly market!: string;

  @ApiPropertyOptional({ example: '银行' })
  readonly industry?: string;

  @ApiPropertyOptional({ example: '深圳' })
  readonly area?: string;

  @ApiProperty({ example: '19910403' })
  readonly listDate!: string;

  @ApiPropertyOptional({ example: '20260514' })
  readonly delistDate?: string;

  @ApiProperty({ example: true })
  readonly isActive!: boolean;

  @ApiProperty({ example: false })
  readonly isST!: boolean;
}
