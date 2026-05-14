import type { Strategy, StrategyConfig, StrategyContext, StrategySignal } from './strategy.types';

export abstract class BaseStrategy<TConfig extends StrategyConfig = StrategyConfig> implements Strategy<TConfig> {
  readonly code: string;
  readonly name: string;
  readonly version: string;
  readonly description?: string;

  protected constructor(params: {
    readonly code: string;
    readonly name: string;
    readonly version: string;
    readonly description?: string;
  }) {
    this.code = params.code;
    this.name = params.name;
    this.version = params.version;
    if (params.description !== undefined) {
      this.description = params.description;
    }
  }

  abstract validateConfig(config: TConfig): void;

  abstract generateSignals(context: StrategyContext, config: TConfig): Promise<readonly StrategySignal[]>;
}
