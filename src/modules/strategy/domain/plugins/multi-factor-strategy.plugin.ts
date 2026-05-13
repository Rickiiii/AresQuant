import { Injectable, Logger } from '@nestjs/common';
import type { StrategyContext, StrategyPlugin, StrategySignal } from '../strategy.types';

export interface FactorWeight {
  readonly factorCode: string;
  readonly weight: number;
}

export interface MultiFactorStrategyParameters {
  readonly factors: readonly FactorWeight[];
  readonly maxPositions: number;
  readonly rebalanceDays: number;
}

@Injectable()
export class MultiFactorStrategyPlugin implements StrategyPlugin<MultiFactorStrategyParameters> {
  readonly code = 'multi_factor';
  readonly version = '0.1.0';
  private readonly logger = new Logger(MultiFactorStrategyPlugin.name);

  validateParameters(parameters: MultiFactorStrategyParameters): void {
    if (parameters.factors.length === 0) {
      throw new Error('Multi-factor strategy requires at least one factor');
    }
    if (!Number.isInteger(parameters.maxPositions) || parameters.maxPositions <= 0) {
      throw new Error('maxPositions must be a positive integer');
    }
    if (!Number.isInteger(parameters.rebalanceDays) || parameters.rebalanceDays <= 0) {
      throw new Error('rebalanceDays must be a positive integer');
    }
  }

  async generateSignals(
    context: StrategyContext,
    parameters: MultiFactorStrategyParameters,
  ): Promise<readonly StrategySignal[]> {
    this.validateParameters(parameters);
    this.logger.log(`Generating multi-factor signals for ${context.tradeDate.toISOString()}`);

    const selected = context.universe.slice(0, parameters.maxPositions);
    if (selected.length === 0) {
      return [];
    }

    const targetWeight = 1 / selected.length;
    return selected.map((securityId) => ({
      securityId,
      targetWeight,
      reason: `selected_by_${this.code}_${this.version}`,
    }));
  }
}
