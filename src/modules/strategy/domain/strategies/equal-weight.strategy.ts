import { BaseStrategy } from '../base.strategy';
import type { StrategyConfig, StrategyContext, StrategySignal } from '../strategy.types';

export interface EqualWeightStrategyConfig extends StrategyConfig {
  readonly maxPositions: number;
}

export class EqualWeightStrategy extends BaseStrategy<EqualWeightStrategyConfig> {
  constructor() {
    super({
      code: 'equal-weight',
      name: 'Equal Weight Strategy',
      version: '1.0.0',
      description: 'Allocate equal weights across selected securities.',
    });
  }

  validateConfig(config: EqualWeightStrategyConfig): void {
    if (!Number.isInteger(config.maxPositions) || config.maxPositions <= 0) {
      throw new Error('maxPositions must be a positive integer');
    }
  }

  async generateSignals(
    context: StrategyContext,
    config: EqualWeightStrategyConfig,
  ): Promise<readonly StrategySignal[]> {
    this.validateConfig(config);

    const selected = context.universe.slice(0, config.maxPositions);
    if (selected.length === 0) {
      return [];
    }

    const targetWeight = 1 / selected.length;
    return selected.map((securityId) => ({
      securityId,
      targetWeight,
      reason: 'equal-weight allocation',
    }));
  }
}
