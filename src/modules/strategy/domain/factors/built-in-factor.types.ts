import type { FactorValue, StrategyMarketData } from '../strategy.types';

export interface FundamentalFactorSnapshot {
  readonly securityId: string;
  readonly tradeDate: Date;
  readonly pe?: number;
  readonly pb?: number;
  readonly roe?: number;
  readonly turnoverRate?: number;
}

export interface BuiltInFactorInput {
  readonly tradeDate: Date;
  readonly marketData: readonly StrategyMarketData[];
  readonly fundamentals?: readonly FundamentalFactorSnapshot[];
}

export type BuiltInFactorResult = readonly FactorValue[];
