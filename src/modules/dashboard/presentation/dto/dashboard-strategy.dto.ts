import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class DashboardStrategyConfigFieldDto {
  @ApiProperty({ example: 'maxPositions' })
  readonly name!: string;

  @ApiProperty({ example: 'number' })
  readonly type!: 'number' | 'string' | 'array' | 'object';

  @ApiProperty({ example: true })
  readonly required!: boolean;

  @ApiPropertyOptional({ example: 5 })
  readonly defaultValue?: number | string | readonly unknown[] | Readonly<Record<string, unknown>>;

  @ApiProperty({ example: 'Maximum number of securities to hold.' })
  readonly description!: string;
}

export class DashboardStrategyListItemDto {
  @ApiProperty({ example: 'multi-factor' })
  readonly code!: string;

  @ApiProperty({ example: 'Multi-Factor Strategy' })
  readonly name!: string;

  @ApiProperty({ example: '1.0.0' })
  readonly version!: string;

  @ApiPropertyOptional({ example: 'Weighted multi-factor TopN stock selection strategy.' })
  readonly description?: string;

  @ApiProperty({ type: [DashboardStrategyConfigFieldDto] })
  readonly configSchema!: readonly DashboardStrategyConfigFieldDto[];
}

export class DashboardStrategySignalSampleDto {
  @ApiProperty({ example: '000001' })
  readonly securityId!: string;

  @ApiProperty({ example: 0.333333 })
  readonly targetWeight!: number;

  @ApiProperty({ example: 'multi-factor score=1.000000' })
  readonly reason!: string;
}

export class DashboardStrategyDetailDto extends DashboardStrategyListItemDto {
  @ApiProperty({ example: { maxPositions: 3 } })
  readonly defaultConfig!: Readonly<Record<string, unknown>>;

  @ApiProperty({ type: [DashboardStrategySignalSampleDto] })
  readonly sampleSignals!: readonly DashboardStrategySignalSampleDto[];
}
