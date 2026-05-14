import { MultiFactorStrategy } from './multi-factor.strategy';
import type { MultiFactorStrategyConfig } from './multi-factor.strategy';
import type { StrategyContext } from '../strategy.types';

const tradeDate = new Date('2026-05-14T00:00:00.000Z');
const rebalanceRange = {
  from: new Date('2026-05-01T00:00:00.000Z'),
  to: tradeDate,
};

const config: MultiFactorStrategyConfig = {
  maxPositions: 2,
  normalizeMethod: 'rank',
  factors: [
    { factorCode: 'momentum', weight: 0.7, direction: 'positive' },
    { factorCode: 'pe', weight: 0.3, direction: 'negative' },
  ],
};

const context: StrategyContext = {
  tradeDate,
  rebalanceRange,
  universe: ['000001', '000002', '000003'],
  factorValues: [
    { securityId: '000001', factorCode: 'momentum', value: 0.2, tradeDate },
    { securityId: '000002', factorCode: 'momentum', value: 0.1, tradeDate },
    { securityId: '000003', factorCode: 'momentum', value: -0.1, tradeDate },
    { securityId: '000001', factorCode: 'pe', value: 20, tradeDate },
    { securityId: '000002', factorCode: 'pe', value: 10, tradeDate },
    { securityId: '000003', factorCode: 'pe', value: 30, tradeDate },
  ],
};

describe('MultiFactorStrategy', () => {
  it('generates equal-weight TopN target positions from weighted factor scores', async () => {
    const strategy = new MultiFactorStrategy();

    await expect(strategy.generateSignals(context, config)).resolves.toEqual([
      { securityId: '000001', targetWeight: 0.5, reason: 'multi-factor score=0.850000' },
      { securityId: '000002', targetWeight: 0.5, reason: 'multi-factor score=0.650000' },
    ]);
  });

  it('returns empty signals when factor values are missing', async () => {
    const strategy = new MultiFactorStrategy();

    await expect(strategy.generateSignals({ ...context, factorValues: [] }, config)).resolves.toEqual([]);
  });

  it('filters factor values by universe before scoring', async () => {
    const strategy = new MultiFactorStrategy();

    const signals = await strategy.generateSignals({ ...context, universe: ['000002', '000003'] }, config);

    expect(signals.map((signal) => signal.securityId)).toEqual(['000002', '000003']);
  });

  it('validates config', () => {
    const strategy = new MultiFactorStrategy();

    expect(() => strategy.validateConfig({ ...config, maxPositions: 0 })).toThrow('maxPositions must be a positive integer');
    expect(() => strategy.validateConfig({ ...config, factors: [] })).toThrow('factors are required');
    expect(() =>
      strategy.validateConfig({
        ...config,
        factors: [{ factorCode: 'momentum', weight: -1, direction: 'positive' }],
      }),
    ).toThrow('factor weight must be non-negative: momentum');
  });
});
