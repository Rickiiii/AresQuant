import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsOptional, IsString, Matches } from 'class-validator';

export class SyncDailyBarsDto {
  @ApiProperty({ example: '000001.SZ', required: false })
  @IsOptional()
  @IsString()
  @Matches(/^[0-9]{6}\.(SZ|SH|BJ)$/)
  readonly tsCode?: string;

  @ApiProperty({ example: '2026-01-01' })
  @IsDateString()
  readonly fromDate!: string;

  @ApiProperty({ example: '2026-05-14' })
  @IsDateString()
  readonly toDate!: string;
}
