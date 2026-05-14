import { BaseFactor } from './base-factor';
import type { BuiltInFactorInput, BuiltInFactorResult } from './built-in-factor.types';
import { groupMarketDataBySecurity, isFiniteNumber, requireMarketData, toFactorValue } from './built-in-factor.utils';

export class MomentumFactor extends BaseFactor<BuiltInFactorInput, BuiltInFactorResult> {
  constructor() {
    super({
      code: 'momentum',
      name: 'Momentum Factor',
      version: '1.0.0',
      description: 'Price momentum calculated from first and last close in the input window.',
    });
  }

  validateInput(input: BuiltInFactorInput): void {
    requireMarketData(input, this.code);
  }

  async calculate(input: BuiltInFactorInput): Promise<BuiltInFactorResult> {
    this.validateInput(input);
    const grouped = groupMarketDataBySecurity(input.marketData);
    const values = [...grouped.entries()].flatMap(([securityId, bars]) => {
      const first = bars[0];
      const last = bars[bars.length - 1];
      if (first === undefined || last === undefined || !isFiniteNumber(first.close) || !isFiniteNumber(last.close) || first.close <= 0) {
        return [];
      }

      return [
        toFactorValue({
          securityId,
          factorCode: this.code,
          value: last.close / first.close - 1,
          tradeDate: input.tradeDate,
        }),
      ];
    });

    return values;
  }
}
