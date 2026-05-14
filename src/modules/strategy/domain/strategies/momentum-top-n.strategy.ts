import { BaseStrategy } from '../base.strategy';
import type { StrategyConfig, StrategyContext, StrategySignal } from '../strategy.types';

export interface MomentumTopNStrategyConfig extends StrategyConfig {
  readonly maxPositions: number;
}

export class MomentumTopNStrategy extends BaseStrategy<MomentumTopNStrategyConfig> {
  constructor() {
    super({
      code: 'momentum-top-n',
      name: 'Momentum Top N Strategy',
      version: '1.0.0',
      description: 'Select top N securities by momentum score and allocate equal weights.',
    });
  }

  validateConfig(config: MomentumTopNStrategyConfig): void {
    if (!Number.isInteger(config.maxPositions) || config.maxPositions <= 0) {
      throw new Error('maxPositions must be a positive integer');
    }
  }

  async generateSignals(
    context: StrategyContext,
    config: MomentumTopNStrategyConfig,
  ): Promise<readonly StrategySignal[]> {
    this.validateConfig(config);

    if (context.momentumScores === undefined || context.momentumScores.length === 0) {
      return [];
    }

    const universe = new Set(context.universe);
    const selected = context.momentumScores
      .filter((score) => universe.has(score.securityId))
      .toSorted((left, right) => right.score - left.score)
      .slice(0, config.maxPositions);

    if (selected.length === 0) {
      return [];
    }

    const targetWeight = 1 / selected.length;
    return selected.map((score) => ({
      securityId: score.securityId,
      targetWeight,
      reason: 'momentum top-n allocation',
    }));
  }
}
