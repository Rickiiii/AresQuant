import { Injectable } from '@nestjs/common';
import type { StrategyContext, StrategyPlugin, StrategySignal } from '../strategy.types';
import type { MultiFactorStrategyParameters } from './multi-factor-strategy.plugin';

@Injectable()
export class EqualWeightMockStrategyPlugin implements StrategyPlugin<MultiFactorStrategyParameters> {
  readonly code = 'equal_weight_mock';
  readonly version = '0.1.0';

  validateParameters(parameters: MultiFactorStrategyParameters): void {
    if (!Number.isInteger(parameters.maxPositions) || parameters.maxPositions <= 0) {
      throw new Error('maxPositions must be a positive integer');
    }
  }

  async generateSignals(context: StrategyContext, parameters: MultiFactorStrategyParameters): Promise<readonly StrategySignal[]> {
    this.validateParameters(parameters);
    const selected = context.universe.slice(0, parameters.maxPositions);
    if (selected.length === 0) {
      return [];
    }
    const targetWeight = 1 / selected.length;
    return selected.map((symbol) => ({ securityId: symbol, targetWeight, reason: 'equal_weight_mock' }));
  }
}
