import type { FactorValue, StrategyScore } from '../domain/strategy.types';

export type FactorNormalizeMethod = 'rank' | 'zscore' | 'minmax';
export type FactorDirection = 'positive' | 'negative';

export interface FactorScoreWeight {
  readonly factorCode: string;
  readonly weight: number;
  readonly direction: FactorDirection;
}

export interface FactorScoreRequest {
  readonly tradeDate: Date;
  readonly values: readonly FactorValue[];
  readonly weights: readonly FactorScoreWeight[];
  readonly method: FactorNormalizeMethod;
}

interface NormalizedFactorValue {
  readonly securityId: string;
  readonly factorCode: string;
  readonly value: number;
}

export class FactorScoreService {
  calculateScores(request: FactorScoreRequest): readonly StrategyScore[] {
    this.validateRequest(request);
    const normalizedByFactor = new Map<string, readonly NormalizedFactorValue[]>();

    for (const weight of request.weights) {
      const factorValues = request.values.filter((value) => value.factorCode === weight.factorCode);
      normalizedByFactor.set(weight.factorCode, this.normalize(factorValues, request.method, weight.direction));
    }

    const scores = new Map<string, number>();
    for (const weight of request.weights) {
      const normalizedValues = normalizedByFactor.get(weight.factorCode) ?? [];
      for (const normalized of normalizedValues) {
        scores.set(normalized.securityId, (scores.get(normalized.securityId) ?? 0) + normalized.value * weight.weight);
      }
    }

    return Array.from(scores.entries())
      .map(([securityId, score]) => ({
        securityId,
        score,
        tradeDate: request.tradeDate,
        source: 'factor-score',
      }))
      .sort((left, right) => right.score - left.score || left.securityId.localeCompare(right.securityId));
  }

  private validateRequest(request: FactorScoreRequest): void {
    if (request.weights.length === 0) {
      throw new Error('factor weights are required');
    }

    const totalWeight = request.weights.reduce((sum, item) => sum + item.weight, 0);
    if (totalWeight <= 0) {
      throw new Error('total factor weight must be positive');
    }

    for (const item of request.weights) {
      if (!Number.isFinite(item.weight) || item.weight < 0) {
        throw new Error(`factor weight must be non-negative: ${item.factorCode}`);
      }
      if (!request.values.some((value) => value.factorCode === item.factorCode)) {
        throw new Error(`factor values not found: ${item.factorCode}`);
      }
    }
  }

  private normalize(
    values: readonly FactorValue[],
    method: FactorNormalizeMethod,
    direction: FactorDirection,
  ): readonly NormalizedFactorValue[] {
    const finiteValues = values.filter((value) => Number.isFinite(value.value));
    const directed = direction === 'positive' ? finiteValues : finiteValues.map((value) => ({ ...value, value: -value.value }));

    switch (method) {
      case 'rank':
        return this.rankNormalize(directed);
      case 'zscore':
        return this.zscoreNormalize(directed);
      case 'minmax':
        return this.minmaxNormalize(directed);
    }
  }

  private rankNormalize(values: readonly FactorValue[]): readonly NormalizedFactorValue[] {
    if (values.length === 1) {
      const only = values[0];
      if (only === undefined) {
        return [];
      }
      return [{ securityId: only.securityId, factorCode: only.factorCode, value: 1 }];
    }

    return [...values]
      .sort((left, right) => left.value - right.value || left.securityId.localeCompare(right.securityId))
      .map((value, index) => ({
        securityId: value.securityId,
        factorCode: value.factorCode,
        value: index / (values.length - 1),
      }));
  }

  private zscoreNormalize(values: readonly FactorValue[]): readonly NormalizedFactorValue[] {
    if (values.length === 0) {
      return [];
    }

    const mean = values.reduce((sum, item) => sum + item.value, 0) / values.length;
    const variance = values.reduce((sum, item) => sum + (item.value - mean) ** 2, 0) / values.length;
    const standardDeviation = Math.sqrt(variance);

    return values.map((item) => ({
      securityId: item.securityId,
      factorCode: item.factorCode,
      value: standardDeviation === 0 ? 0 : (item.value - mean) / standardDeviation,
    }));
  }

  private minmaxNormalize(values: readonly FactorValue[]): readonly NormalizedFactorValue[] {
    if (values.length === 0) {
      return [];
    }

    const rawValues = values.map((item) => item.value);
    const minimum = Math.min(...rawValues);
    const maximum = Math.max(...rawValues);
    const range = maximum - minimum;

    return values.map((item) => ({
      securityId: item.securityId,
      factorCode: item.factorCode,
      value: range === 0 ? 0 : (item.value - minimum) / range,
    }));
  }
}
