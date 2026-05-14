import type { Strategy } from '../domain/strategy.types';

export class StrategyService {
  private readonly strategies = new Map<string, Strategy>();

  constructor(initialStrategies: readonly Strategy[] = []) {
    for (const strategy of initialStrategies) {
      this.register(strategy);
    }
  }

  register(strategy: Strategy): void {
    if (this.strategies.has(strategy.code)) {
      throw new Error(`Strategy already registered: ${strategy.code}`);
    }

    this.strategies.set(strategy.code, strategy);
  }

  get(code: string): Strategy {
    const strategy = this.strategies.get(code);
    if (strategy === undefined) {
      throw new Error(`Strategy not found: ${code}`);
    }

    return strategy;
  }

  list(): readonly Strategy[] {
    return [...this.strategies.values()];
  }
}
