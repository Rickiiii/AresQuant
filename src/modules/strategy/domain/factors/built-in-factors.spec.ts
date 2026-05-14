import { MomentumFactor } from './momentum.factor';
import { PbFactor } from './pb.factor';
import { PeFactor } from './pe.factor';
import { RoeFactor } from './roe.factor';
import { TurnoverFactor } from './turnover.factor';
import { VolatilityFactor } from './volatility.factor';
import type { BuiltInFactorInput, FundamentalFactorSnapshot } from './built-in-factor.types';
import type { StrategyMarketData } from '../strategy.types';

const tradeDate = new Date('2026-05-14T00:00:00.000Z');

const marketData: readonly StrategyMarketData[] = [
  { securityId: '000001', tradeDate: new Date('2026-05-12T00:00:00.000Z'), close: 10 },
  { securityId: '000001', tradeDate: new Date('2026-05-13T00:00:00.000Z'), close: 11 },
  { securityId: '000001', tradeDate: new Date('2026-05-14T00:00:00.000Z'), close: 12 },
  { securityId: '000002', tradeDate: new Date('2026-05-12T00:00:00.000Z'), close: 20 },
  { securityId: '000002', tradeDate: new Date('2026-05-13T00:00:00.000Z'), close: 18 },
  { securityId: '000002', tradeDate: new Date('2026-05-14T00:00:00.000Z'), close: 16 },
];

const fundamentals: readonly FundamentalFactorSnapshot[] = [
  { securityId: '000001', tradeDate, pe: 12, pb: 1.2, roe: 0.18, turnoverRate: 0.03 },
  { securityId: '000002', tradeDate, pe: 20, pb: 2.1, roe: 0.1, turnoverRate: 0.06 },
];

const input: BuiltInFactorInput = {
  tradeDate,
  marketData,
  fundamentals,
};

describe('built-in factors', () => {
  it('calculates momentum by security', async () => {
    const values = await new MomentumFactor().calculate(input);

    expect(values).toEqual([
      { securityId: '000001', factorCode: 'momentum', value: 0.19999999999999996, tradeDate },
      { securityId: '000002', factorCode: 'momentum', value: -0.19999999999999996, tradeDate },
    ]);
  });

  it('calculates volatility by security', async () => {
    const values = await new VolatilityFactor().calculate(input);

    expect(values).toHaveLength(2);
    expect(values[0]).toMatchObject({ securityId: '000001', factorCode: 'volatility', tradeDate });
    expect(values[0]?.value).toBeCloseTo(0.004545, 6);
  });

  it('calculates valuation, quality, and liquidity factors from fundamentals', async () => {
    await expect(new PeFactor().calculate(input)).resolves.toEqual([
      { securityId: '000001', factorCode: 'pe', value: 12, tradeDate },
      { securityId: '000002', factorCode: 'pe', value: 20, tradeDate },
    ]);
    await expect(new PbFactor().calculate(input)).resolves.toEqual([
      { securityId: '000001', factorCode: 'pb', value: 1.2, tradeDate },
      { securityId: '000002', factorCode: 'pb', value: 2.1, tradeDate },
    ]);
    await expect(new RoeFactor().calculate(input)).resolves.toEqual([
      { securityId: '000001', factorCode: 'roe', value: 0.18, tradeDate },
      { securityId: '000002', factorCode: 'roe', value: 0.1, tradeDate },
    ]);
    await expect(new TurnoverFactor().calculate(input)).resolves.toEqual([
      { securityId: '000001', factorCode: 'turnover', value: 0.03, tradeDate },
      { securityId: '000002', factorCode: 'turnover', value: 0.06, tradeDate },
    ]);
  });

  it('validates required inputs', async () => {
    await expect(new MomentumFactor().calculate({ tradeDate, marketData: [] })).rejects.toThrow('momentum requires marketData');
    await expect(new PeFactor().calculate({ tradeDate, marketData })).rejects.toThrow('pe requires fundamentals');
  });
});
