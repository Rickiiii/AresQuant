import type { StrategyContext } from '../strategy.types';
import { EqualWeightStrategy } from './equal-weight.strategy';

function createContext(universe: readonly string[]): StrategyContext {
  return {
    tradeDate: new Date('2026-05-14T00:00:00.000Z'),
    rebalanceRange: {
      from: new Date('2026-05-01T00:00:00.000Z'),
      to: new Date('2026-05-31T00:00:00.000Z'),
    },
    universe,
  };
}

describe('EqualWeightStrategy', () => {
  it('returns empty signals when universe is empty', async () => {
    const strategy = new EqualWeightStrategy();

    const signals = await strategy.generateSignals(createContext([]), { maxPositions: 3 });

    expect(signals).toEqual([]);
  });

  it.each([0, -1, 1.5])('rejects invalid maxPositions: %s', (maxPositions) => {
    const strategy = new EqualWeightStrategy();

    expect(() => strategy.validateConfig({ maxPositions })).toThrow('maxPositions must be a positive integer');
  });

  it('selects only the first N securities', async () => {
    const strategy = new EqualWeightStrategy();

    const signals = await strategy.generateSignals(createContext(['000001', '000002', '000003']), { maxPositions: 2 });

    expect(signals.map((signal) => signal.securityId)).toEqual(['000001', '000002']);
  });

  it('allocates equal target weights to selected securities', async () => {
    const strategy = new EqualWeightStrategy();

    const signals = await strategy.generateSignals(createContext(['000001', '000002', '000003']), { maxPositions: 2 });

    expect(signals).toEqual([
      {
        securityId: '000001',
        targetWeight: 0.5,
        reason: 'equal-weight allocation',
      },
      {
        securityId: '000002',
        targetWeight: 0.5,
        reason: 'equal-weight allocation',
      },
    ]);
  });

  it('keeps total target weight approximately equal to 1', async () => {
    const strategy = new EqualWeightStrategy();

    const signals = await strategy.generateSignals(createContext(['000001', '000002', '000003']), { maxPositions: 3 });
    const totalWeight = signals.reduce((total, signal) => total + signal.targetWeight, 0);

    expect(totalWeight).toBeCloseTo(1, 10);
  });
});
