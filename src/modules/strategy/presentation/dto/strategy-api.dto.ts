import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsDateString,
  IsIn,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';

export class StrategyFactorWeightDto {
  @ApiProperty({ example: 'momentum' })
  @IsString()
  readonly factorCode!: string;

  @ApiProperty({ example: 0.5, minimum: 0 })
  @IsNumber()
  @Min(0)
  readonly weight!: number;

  @ApiProperty({ enum: ['positive', 'negative'], example: 'positive' })
  @IsIn(['positive', 'negative'])
  readonly direction!: 'positive' | 'negative';
}

export class StrategyConfigDto {
  @ApiPropertyOptional({ example: 10, minimum: 1 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  readonly maxPositions?: number;

  @ApiPropertyOptional({ enum: ['rank', 'zscore', 'minmax'], example: 'rank' })
  @IsOptional()
  @IsIn(['rank', 'zscore', 'minmax'])
  readonly normalizeMethod?: 'rank' | 'zscore' | 'minmax';

  @ApiPropertyOptional({ type: [StrategyFactorWeightDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => StrategyFactorWeightDto)
  readonly factors?: readonly StrategyFactorWeightDto[];

  @ApiPropertyOptional({ example: { note: 'optional strategy metadata' } })
  @IsOptional()
  @IsObject()
  readonly metadata?: Readonly<Record<string, unknown>>;
}

export class StrategyFactorValueDto {
  @ApiProperty({ example: '000001' })
  @IsString()
  readonly securityId!: string;

  @ApiProperty({ example: 'momentum' })
  @IsString()
  readonly factorCode!: string;

  @ApiProperty({ example: 0.18 })
  @IsNumber()
  readonly value!: number;

  @ApiProperty({ example: '2026-05-14' })
  @IsDateString()
  readonly tradeDate!: string;
}

export class StrategyScoreDto {
  @ApiProperty({ example: '000001' })
  @IsString()
  readonly securityId!: string;

  @ApiProperty({ example: 0.18 })
  @IsNumber()
  readonly score!: number;

  @ApiProperty({ example: '2026-05-14' })
  @IsDateString()
  readonly tradeDate!: string;

  @ApiProperty({ example: 'momentum' })
  @IsString()
  readonly source!: string;
}

export class StrategySignalsRequestDto extends StrategyConfigDto {
  @ApiProperty({ example: '2026-05-14' })
  @IsDateString()
  readonly tradeDate!: string;

  @ApiPropertyOptional({ example: '2026-05-13' })
  @IsOptional()
  @IsDateString()
  readonly previousTradeDate?: string;

  @ApiProperty({ example: '2026-05-01' })
  @IsDateString()
  readonly rebalanceFrom!: string;

  @ApiProperty({ example: '2026-05-14' })
  @IsDateString()
  readonly rebalanceTo!: string;

  @ApiProperty({ example: ['000001', '000002'], type: [String] })
  @IsArray()
  @IsString({ each: true })
  readonly universe!: readonly string[];

  @ApiPropertyOptional({ type: [StrategyFactorValueDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => StrategyFactorValueDto)
  readonly factorValues?: readonly StrategyFactorValueDto[];

  @ApiPropertyOptional({ type: [StrategyScoreDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => StrategyScoreDto)
  readonly momentumScores?: readonly StrategyScoreDto[];
}
