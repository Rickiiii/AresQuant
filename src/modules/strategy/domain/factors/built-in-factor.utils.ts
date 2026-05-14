import type { FactorValue, StrategyMarketData } from '../strategy.types';
import type { BuiltInFactorInput, FundamentalFactorSnapshot } from './built-in-factor.types';

export function groupMarketDataBySecurity(
  marketData: readonly StrategyMarketData[],
): ReadonlyMap<string, readonly StrategyMarketData[]> {
  const grouped = new Map<string, StrategyMarketData[]>();
  for (const item of marketData) {
    const existing = grouped.get(item.securityId) ?? [];
    existing.push(item);
    grouped.set(item.securityId, existing);
  }

  for (const [securityId, items] of grouped.entries()) {
    grouped.set(
      securityId,
      [...items].sort((left, right) => left.tradeDate.getTime() - right.tradeDate.getTime()),
    );
  }

  return grouped;
}

export function latestFundamentalsBySecurity(
  fundamentals: readonly FundamentalFactorSnapshot[] = [],
): ReadonlyMap<string, FundamentalFactorSnapshot> {
  const latest = new Map<string, FundamentalFactorSnapshot>();
  for (const item of fundamentals) {
    const existing = latest.get(item.securityId);
    if (existing === undefined || item.tradeDate.getTime() >= existing.tradeDate.getTime()) {
      latest.set(item.securityId, item);
    }
  }

  return latest;
}

export function requireMarketData(input: BuiltInFactorInput, factorCode: string): void {
  if (input.marketData.length === 0) {
    throw new Error(`${factorCode} requires marketData`);
  }
}

export function toFactorValue(params: {
  readonly securityId: string;
  readonly factorCode: string;
  readonly value: number;
  readonly tradeDate: Date;
}): FactorValue {
  return {
    securityId: params.securityId,
    factorCode: params.factorCode,
    value: params.value,
    tradeDate: params.tradeDate,
  };
}

export function isFiniteNumber(value: number | undefined): value is number {
  return value !== undefined && Number.isFinite(value);
}
