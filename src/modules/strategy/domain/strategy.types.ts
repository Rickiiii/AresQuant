import type { DateRange } from '@/common/types/date-range';

export interface FactorValue {
  readonly securityId: string;
  readonly factorCode: string;
  readonly value: number;
  readonly tradeDate: Date;
}

export interface StrategyContext {
  readonly tradeDate: Date;
  readonly rebalanceRange: DateRange;
  readonly universe: readonly string[];
}

export interface StrategySignal {
  readonly securityId: string;
  readonly targetWeight: number;
  readonly reason: string;
}

export interface StrategyPlugin<TParameters extends object> {
  readonly code: string;
  readonly version: string;
  validateParameters(parameters: TParameters): void;
  generateSignals(context: StrategyContext, parameters: TParameters): Promise<readonly StrategySignal[]>;
}
