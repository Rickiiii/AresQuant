import type { PortfolioAction } from '../../domain/portfolio.types';

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
