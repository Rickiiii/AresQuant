import type { Factor } from './factor.types';

export class FactorRegistryService<TFactor extends Factor<never, unknown> = Factor<never, unknown>> {
  private readonly factors = new Map<string, TFactor>();

  register(factor: TFactor): void {
    if (this.factors.has(factor.code)) {
      throw new Error(`Factor already registered: ${factor.code}`);
    }

    this.factors.set(factor.code, factor);
  }

  get(code: string): TFactor {
    const factor = this.factors.get(code);
    if (factor === undefined) {
      throw new Error(`Factor not found: ${code}`);
    }

    return factor;
  }

  list(): readonly TFactor[] {
    return [...this.factors.values()];
  }

  exists(code: string): boolean {
    return this.factors.has(code);
  }
}
