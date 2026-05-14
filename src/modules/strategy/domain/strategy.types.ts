import type { DateRange } from '@/common/types/date-range';

export interface FactorValue {
  readonly securityId: string;
  readonly factorCode: string;
  readonly value: number;
  readonly tradeDate: Date;
}

export interface StrategyConfig {
  readonly maxPositions?: number;
  readonly rebalanceDays?: number;
  readonly metadata?: Readonly<Record<string, unknown>>;
  readonly [key: string]: unknown;
}

export interface StrategyMarketData {
  readonly securityId: string;
  readonly tradeDate: Date;
  readonly open?: number;
  readonly high?: number;
  readonly low?: number;
  readonly close?: number;
  readonly volume?: number;
  readonly amount?: number;
}

export interface StrategyScore {
  readonly securityId: string;
  readonly score: number;
  readonly tradeDate: Date;
  readonly source: string;
}

export interface StrategyPositionSnapshot {
  readonly securityId: string;
  readonly quantity: number;
  readonly weight: number;
  readonly marketValue: number;
}

export interface StrategyContext {
  readonly tradeDate: Date;
  readonly previousTradeDate?: Date;
  readonly rebalanceRange: DateRange;
  readonly universe: readonly string[];
  readonly marketData?: readonly StrategyMarketData[];
  readonly factorValues?: readonly FactorValue[];
  readonly momentumScores?: readonly StrategyScore[];
  readonly positions?: readonly StrategyPositionSnapshot[];
  readonly metadata?: Readonly<Record<string, unknown>>;
}

export interface StrategySignal {
  readonly securityId: string;
  readonly targetWeight: number;
  readonly reason: string;
}

export interface Strategy<TConfig extends StrategyConfig = StrategyConfig> {
  readonly code: string;
  readonly name: string;
  readonly version: string;
  readonly description?: string;
  validateConfig(config: TConfig): void;
  generateSignals(context: StrategyContext, config: TConfig): Promise<readonly StrategySignal[]>;
}

export interface StrategyPlugin<TParameters extends object> {
  readonly code: string;
  readonly version: string;
  validateParameters(parameters: TParameters): void;
  generateSignals(context: StrategyContext, parameters: TParameters): Promise<readonly StrategySignal[]>;
}
