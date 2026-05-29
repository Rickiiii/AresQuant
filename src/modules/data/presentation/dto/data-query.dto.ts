import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsDateString, IsIn, IsOptional, IsString, Matches } from 'class-validator';

export class DateRangeQueryDto {
  @ApiProperty({ example: '2026-01-01' })
  @IsDateString()
  readonly startDate!: string;

  @ApiProperty({ example: '2026-05-14' })
  @IsDateString()
  readonly endDate!: string;
}

export class DailyBarsQueryDto extends DateRangeQueryDto {
  @ApiProperty({ example: '000001' })
  @IsString()
  @Matches(/^[0-9]{6}$/)
  readonly symbol!: string;

  @ApiPropertyOptional({ enum: ['none', 'forward', 'backward'], default: 'none' })
  @IsOptional()
  @IsIn(['none', 'forward', 'backward'])
  readonly adjustment?: 'none' | 'forward' | 'backward';
}

export class IndexBarsQueryDto extends DateRangeQueryDto {
  @ApiProperty({ example: '000300.SH' })
  @IsString()
  readonly indexCode!: string;
}

export class TradeDateQueryDto {
  @ApiProperty({ example: '2026-05-14' })
  @IsDateString()
  readonly tradeDate!: string;
}

export class SymbolQueryDto {
  @ApiProperty({ example: '000001' })
  @IsString()
  @Matches(/^[0-9]{6}$/)
  readonly symbol!: string;
}

export class SyncDailyBarsRequestDto extends DateRangeQueryDto {
  @ApiProperty({ example: ['000001', '600000'], type: [String] })
  @IsArray()
  @IsString({ each: true })
  readonly symbols!: readonly string[];
}

export class SyncAllRequestDto extends DateRangeQueryDto {}

export class SyncCoreRequestDto extends DateRangeQueryDto {
  @ApiPropertyOptional({ example: ['000001', '600519', '000333'], type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  readonly symbols?: readonly string[];
}

export class QualityCheckRequestDto extends DateRangeQueryDto {
  @ApiProperty({ example: '000001' })
  @IsString()
  @Matches(/^[0-9]{6}$/)
  readonly symbol!: string;
}
