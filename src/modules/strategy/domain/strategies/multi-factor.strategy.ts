import { FactorScoreService } from '../../application/factor-score.service';
import type { FactorNormalizeMethod, FactorScoreWeight } from '../../application/factor-score.service';
import { BaseStrategy } from '../base.strategy';
import type { StrategyConfig, StrategyContext, StrategySignal } from '../strategy.types';

export interface MultiFactorStrategyConfig extends StrategyConfig {
  readonly maxPositions: number;
  readonly normalizeMethod: FactorNormalizeMethod;
  readonly factors: readonly FactorScoreWeight[];
}

export class MultiFactorStrategy extends BaseStrategy<MultiFactorStrategyConfig> {
  constructor(private readonly factorScoreService = new FactorScoreService()) {
    super({
      code: 'multi-factor',
      name: 'Multi-Factor Strategy',
      version: '1.0.0',
      description: 'Weighted multi-factor TopN stock selection strategy.',
    });
  }

  validateConfig(config: MultiFactorStrategyConfig): void {
    if (!Number.isInteger(config.maxPositions) || config.maxPositions <= 0) {
      throw new Error('maxPositions must be a positive integer');
    }
    if (!['rank', 'zscore', 'minmax'].includes(config.normalizeMethod)) {
      throw new Error('normalizeMethod must be rank, zscore, or minmax');
    }
    if (config.factors.length === 0) {
      throw new Error('factors are required');
    }
    for (const factor of config.factors) {
      if (factor.factorCode.trim().length === 0) {
        throw new Error('factorCode is required');
      }
      if (!Number.isFinite(factor.weight) || factor.weight < 0) {
        throw new Error(`factor weight must be non-negative: ${factor.factorCode}`);
      }
      if (!['positive', 'negative'].includes(factor.direction)) {
        throw new Error(`factor direction is invalid: ${factor.factorCode}`);
      }
    }
  }

  async generateSignals(
    context: StrategyContext,
    config: MultiFactorStrategyConfig,
  ): Promise<readonly StrategySignal[]> {
    this.validateConfig(config);
    if (context.factorValues === undefined || context.factorValues.length === 0) {
      return [];
    }

    const universe = new Set(context.universe);
    const factorValues = context.factorValues.filter((value) => universe.has(value.securityId));
    if (factorValues.length === 0) {
      return [];
    }

    const scores = this.factorScoreService.calculateScores({
      tradeDate: context.tradeDate,
      values: factorValues,
      weights: config.factors,
      method: config.normalizeMethod,
    });
    const selected = scores.slice(0, config.maxPositions);
    if (selected.length === 0) {
      return [];
    }

    const targetWeight = 1 / selected.length;
    return selected.map((score) => ({
      securityId: score.securityId,
      targetWeight,
      reason: `multi-factor score=${score.score.toFixed(6)}`,
    }));
  }
}
