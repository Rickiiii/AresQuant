export interface BacktestCostModel {
  readonly commissionRate: number;
  readonly slippageRate: number;
}

export interface BacktestRequest {
  readonly strategyCode: string;
  readonly startDate: Date;
  readonly endDate: Date;
  readonly initialCash: number;
  readonly costModel: BacktestCostModel;
  readonly universe: readonly string[];
}

export interface EquityPoint {
  readonly tradeDate: Date;
  readonly totalEquity: number;
  readonly cash: number;
  readonly marketValue: number;
  readonly dailyReturn: number;
  readonly drawdown: number;
}

export interface BacktestMetrics {
  readonly annualizedReturn: number;
  readonly maxDrawdown: number;
  readonly sharpeRatio: number;
  readonly winRate: number;
}

export interface BacktestResult {
  readonly metrics: BacktestMetrics;
  readonly equityCurve: readonly EquityPoint[];
}
