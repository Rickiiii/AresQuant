export type PortfolioAction = 'hold' | 'add' | 'build' | 'watch' | 'take_profit' | 'risk_control';
export type PortfolioRiskLevel = 'low' | 'medium' | 'high';
export type PortfolioExposureSource = 'stock' | 'fund' | 'mixed';
export type PortfolioHoldingStage = 'new' | 'holding' | 'long_term_core';

export interface PortfolioAccountRecord {
  readonly id: string;
  readonly owner: string;
  readonly name: string;
  readonly accountType: 'stock' | 'fund' | 'mixed';
  readonly totalAssetValue: number | null;
  readonly visibleAssetValue: number | null;
  readonly cashAmount: number | null;
  readonly positionLevel: string | null;
  readonly isPrimary?: boolean;
}

export interface PortfolioStockHoldingRecord {
  readonly accountId: string;
  readonly symbol: string;
  readonly name: string;
  readonly quantity: number;
  readonly costPrice: number;
  readonly latestPrice: number | null;
  readonly marketValue: number | null;
  readonly unrealizedPnl: number | null;
  readonly buyDate: string | null;
  readonly holdingStage: PortfolioHoldingStage;
  readonly themeTags: readonly string[];
  readonly riskLevel: PortfolioRiskLevel;
  readonly actionBias: PortfolioAction;
  readonly thesis: string;
}

export interface PortfolioFundHoldingRecord {
  readonly accountId: string;
  readonly fundCode: string | null;
  readonly name: string;
  readonly theme: string;
  readonly amount: number;
  readonly weightPercent: number;
  readonly riskLevel: PortfolioRiskLevel;
  readonly actionBias: PortfolioAction;
}

export interface PortfolioThemeExposureRecord {
  readonly accountId: string;
  readonly theme: string;
  readonly source: PortfolioExposureSource;
  readonly amount: number | null;
  readonly weightPercent: number | null;
  readonly actionBias: PortfolioAction;
  readonly riskNote: string;
  readonly nextStep: string;
}

export interface PortfolioWatchlistItemRecord {
  readonly accountId: string;
  readonly symbol: string | null;
  readonly name: string;
  readonly theme: string;
  readonly reason: string;
  readonly actionBias: PortfolioAction;
}

export interface PortfolioInvestorPreferenceRecord {
  readonly owner: string;
  readonly horizon: string;
  readonly coreView: string;
  readonly roboticsMaxWeightPercent: number;
  readonly singleStockMaxDrawdownPercent: number;
  readonly portfolioMaxDrawdownPercent: number;
  readonly coreHoldings: readonly string[];
  readonly satelliteHoldings: readonly string[];
  readonly rebalanceCadence: string;
  readonly cashPlan: string;
  readonly trimOrder: readonly string[];
}

export interface PortfolioContextRecord {
  readonly account: PortfolioAccountRecord;
  readonly stockHoldings: readonly PortfolioStockHoldingRecord[];
  readonly fundHoldings: readonly PortfolioFundHoldingRecord[];
  readonly themeExposures: readonly PortfolioThemeExposureRecord[];
  readonly watchlistItems: readonly PortfolioWatchlistItemRecord[];
}
