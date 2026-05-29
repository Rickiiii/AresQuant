import { IsIn, IsNumber, IsOptional, IsString, Matches, Min } from 'class-validator';
import type { PortfolioAction } from '../../domain/portfolio.types';

const PORTFOLIO_ACTIONS = ['hold', 'add', 'build', 'watch', 'take_profit', 'risk_control'] as const;

export class PortfolioStockPositionDto {
  readonly symbol!: string;
  readonly name!: string;
  readonly quantity!: number;
  readonly costPrice!: number;
  readonly latestPrice!: number | null;
  readonly marketValue!: number | null;
  readonly unrealizedPnl!: number | null;
  readonly theme!: string;
  readonly themeTags!: readonly string[];
  readonly thesis!: string;
  readonly actionBias!: PortfolioAction;
}

export class UpsertPortfolioStockHoldingDto {
  @IsString()
  @Matches(/^[0-9]{6}$/)
  readonly symbol!: string;

  @IsString()
  readonly name!: string;

  @IsNumber()
  @Min(0)
  readonly quantity!: number;

  @IsNumber()
  @Min(0)
  readonly costPrice!: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  readonly latestPrice?: number | null;

  @IsString()
  readonly theme!: string;

  @IsOptional()
  @IsString({ each: true })
  readonly themeTags?: readonly string[];

  @IsOptional()
  @IsString()
  readonly thesis?: string;

  @IsOptional()
  @IsIn(PORTFOLIO_ACTIONS)
  readonly actionBias?: PortfolioAction;
}

export class UpsertPortfolioFundHoldingDto {
  @IsOptional()
  @IsString()
  readonly fundCode?: string | null;

  @IsString()
  readonly name!: string;

  @IsString()
  readonly theme!: string;

  @IsNumber()
  @Min(0)
  readonly amount!: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  readonly weightPercent?: number;

  @IsOptional()
  @IsIn(PORTFOLIO_ACTIONS)
  readonly actionBias?: PortfolioAction;
}

export class PortfolioFundExposureDto {
  readonly fundCode!: string | null;
  readonly name!: string;
  readonly theme!: string;
  readonly amount!: number;
  readonly weightPercent!: number;
  readonly actionBias!: PortfolioAction;
}

export class PortfolioThemeExposureSummaryDto {
  readonly theme!: string;
  readonly source!: 'stock' | 'fund' | 'mixed';
  readonly amount!: number | null;
  readonly weightPercent!: number | null;
  readonly actionBias!: PortfolioAction;
  readonly riskNote!: string;
  readonly nextStep!: string;
}

export class PortfolioAllocationSummaryDto {
  readonly stockCostValue!: number;
  readonly stockMarketValue!: number;
  readonly fundVisibleValue!: number;
  readonly estimatedTotalValue!: number;
  readonly cashAmount!: number;
  readonly topThemeWeightPercent!: number | null;
}

export class PortfolioContextDto {
  readonly owner!: string;
  readonly accountScope!: string;
  readonly stockAccount!: {
    readonly positionLevel: string;
    readonly positions: readonly PortfolioStockPositionDto[];
  };
  readonly fundAccount!: {
    readonly totalAssetValue: number;
    readonly visibleAssetValue: number;
    readonly exposures: readonly PortfolioFundExposureDto[];
  };
  readonly themeExposures!: readonly PortfolioThemeExposureSummaryDto[];
  readonly allocation!: PortfolioAllocationSummaryDto;
  readonly watchThemes!: readonly string[];
  readonly riskFlags!: readonly string[];
  readonly actionPolicy!: {
    readonly allowedActions: readonly PortfolioAction[];
    readonly defaultBias: PortfolioAction;
    readonly rules: readonly string[];
  };
}
