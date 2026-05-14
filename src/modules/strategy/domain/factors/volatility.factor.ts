import { BaseFactor } from './base-factor';
import type { BuiltInFactorInput, BuiltInFactorResult } from './built-in-factor.types';
import { groupMarketDataBySecurity, isFiniteNumber, requireMarketData, toFactorValue } from './built-in-factor.utils';

export class VolatilityFactor extends BaseFactor<BuiltInFactorInput, BuiltInFactorResult> {
  constructor() {
    super({
      code: 'volatility',
      name: 'Volatility Factor',
      version: '1.0.0',
      description: 'Standard deviation of close-to-close returns in the input window.',
    });
  }

  validateInput(input: BuiltInFactorInput): void {
    requireMarketData(input, this.code);
  }

  async calculate(input: BuiltInFactorInput): Promise<BuiltInFactorResult> {
    this.validateInput(input);
    const grouped = groupMarketDataBySecurity(input.marketData);
    const values = [...grouped.entries()].flatMap(([securityId, bars]) => {
      const closes = bars.map((bar) => bar.close).filter(isFiniteNumber);
      if (closes.length < 2) {
        return [];
      }

      const returns: number[] = [];
      for (let index = 1; index < closes.length; index += 1) {
        const previous = closes[index - 1];
        const current = closes[index];
        if (previous !== undefined && current !== undefined && previous > 0) {
          returns.push(current / previous - 1);
        }
      }

      if (returns.length === 0) {
        return [];
      }

      const mean = returns.reduce((sum, value) => sum + value, 0) / returns.length;
      const variance = returns.reduce((sum, value) => sum + (value - mean) ** 2, 0) / returns.length;
      return [
        toFactorValue({
          securityId,
          factorCode: this.code,
          value: Math.sqrt(variance),
          tradeDate: input.tradeDate,
        }),
      ];
    });

    return values;
  }
}
