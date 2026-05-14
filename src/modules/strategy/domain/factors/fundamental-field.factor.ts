import { BaseFactor } from './base-factor';
import type { BuiltInFactorInput, BuiltInFactorResult, FundamentalFactorSnapshot } from './built-in-factor.types';
import { isFiniteNumber, latestFundamentalsBySecurity, toFactorValue } from './built-in-factor.utils';

export type FundamentalField = 'pe' | 'pb' | 'roe' | 'turnoverRate';

export abstract class FundamentalFieldFactor extends BaseFactor<BuiltInFactorInput, BuiltInFactorResult> {
  protected constructor(
    private readonly field: FundamentalField,
    params: {
      readonly code: string;
      readonly name: string;
      readonly version: string;
      readonly description: string;
    },
  ) {
    super(params);
  }

  validateInput(input: BuiltInFactorInput): void {
    if (input.fundamentals === undefined || input.fundamentals.length === 0) {
      throw new Error(`${this.code} requires fundamentals`);
    }
  }

  async calculate(input: BuiltInFactorInput): Promise<BuiltInFactorResult> {
    this.validateInput(input);
    const latest = latestFundamentalsBySecurity(input.fundamentals);

    return [...latest.entries()].flatMap(([securityId, snapshot]) => {
      const value = this.getFieldValue(snapshot);
      if (!isFiniteNumber(value)) {
        return [];
      }

      return [
        toFactorValue({
          securityId,
          factorCode: this.code,
          value,
          tradeDate: input.tradeDate,
        }),
      ];
    });
  }

  private getFieldValue(snapshot: FundamentalFactorSnapshot): number | undefined {
    switch (this.field) {
      case 'pe':
        return snapshot.pe;
      case 'pb':
        return snapshot.pb;
      case 'roe':
        return snapshot.roe;
      case 'turnoverRate':
        return snapshot.turnoverRate;
    }
  }
}
