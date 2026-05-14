import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsDateString, IsEnum, IsNumber, IsObject, IsOptional, IsString, Max, Min } from 'class-validator';
import type { StrategyConfig } from '@/modules/strategy/domain/strategy.types';
import { BacktestFrequency, BacktestPriceMode } from '../../types/backtest.types';

export class CreateBacktestDto {
  @ApiProperty({ example: 'Mock equal weight backtest' })
  @IsString()
  readonly name!: string;

  @ApiProperty({ example: 'equal_weight_mock' })
  @IsString()
  readonly strategyName!: string;

  @ApiProperty({ example: '2026-05-11' })
  @IsDateString()
  readonly startDate!: string;

  @ApiProperty({ example: '2026-05-15' })
  @IsDateString()
  readonly endDate!: string;

  @ApiProperty({ example: 1000000 })
  @IsNumber()
  @Min(1)
  readonly initialCapital!: number;

  @ApiPropertyOptional({ example: '000300.SH' })
  @IsOptional()
  @IsString()
  readonly benchmark?: string;

  @ApiPropertyOptional({ enum: BacktestFrequency, default: BacktestFrequency.DAILY })
  @IsOptional()
  @IsEnum(BacktestFrequency)
  readonly frequency?: BacktestFrequency;

  @ApiProperty({ example: 1 })
  @IsNumber()
  @Min(1)
  readonly rebalanceFrequency!: number;

  @ApiProperty({ example: 2 })
  @IsNumber()
  @Min(1)
  readonly maxPositions!: number;

  @ApiProperty({ example: 0.5 })
  @IsNumber()
  @Min(0)
  @Max(1)
  readonly maxPositionWeight!: number;

  @ApiProperty({ example: 0.00025 })
  @IsNumber()
  @Min(0)
  readonly commissionRate!: number;

  @ApiPropertyOptional({ example: 5 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  readonly minCommission?: number;

  @ApiPropertyOptional({ example: 0.001 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  readonly stampDutyRate?: number;

  @ApiPropertyOptional({ example: 0.00001 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  readonly transferFeeRate?: number;

  @ApiProperty({ example: 0.0005 })
  @IsNumber()
  @Min(0)
  readonly slippageRate!: number;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  readonly allowBuyLimitUp?: boolean;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  readonly allowSellLimitDown?: boolean;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  readonly enableT1Rule?: boolean;

  @ApiProperty({ enum: BacktestPriceMode, example: BacktestPriceMode.CLOSE })
  @IsEnum(BacktestPriceMode)
  readonly priceMode!: BacktestPriceMode;

  @ApiPropertyOptional({
    example: {
      normalizeMethod: 'rank',
      factors: [{ factorCode: 'momentum', weight: 1, direction: 'positive' }],
    },
    description: 'Optional formal StrategyService config. Backtest defaults still provide maxPositions and rebalanceDays.',
  })
  @IsOptional()
  @IsObject()
  readonly strategyConfig?: StrategyConfig;
}
