import type { StrategyContext } from '../strategy.types';
import { mockMomentumScores, mockStrategyContext } from '../strategy.fixtures';
import { MomentumTopNStrategy } from './momentum-top-n.strategy';

function contextWith(overrides: Partial<StrategyContext>): StrategyContext {
  return {
    ...mockStrategyContext,
    ...overrides,
  };
}

describe('MomentumTopNStrategy', () => {
  it('returns empty signals when momentumScores is missing', async () => {
    const strategy = new MomentumTopNStrategy();
    const context = Object.fromEntries(
      Object.entries(mockStrategyContext).filter(([key]) => key !== 'momentumScores'),
    ) as unknown as StrategyContext;

    const signals = await strategy.generateSignals(context, { maxPositions: 2 });

    expect(signals).toEqual([]);
  });

  it('returns empty signals when there are no valid candidates in universe', async () => {
    const strategy = new MomentumTopNStrategy();
    const context = contextWith({ universe: ['999999'] });

    const signals = await strategy.generateSignals(context, { maxPositions: 2 });

    expect(signals).toEqual([]);
  });

  it('sorts valid candidates by score descending', async () => {
    const strategy = new MomentumTopNStrategy();

    const signals = await strategy.generateSignals(mockStrategyContext, { maxPositions: 4 });

    expect(signals.map((signal) => signal.securityId)).toEqual(['000002', '000004', '000001', '000003']);
  });

  it('selects only top N candidates', async () => {
    const strategy = new MomentumTopNStrategy();

    const signals = await strategy.generateSignals(mockStrategyContext, { maxPositions: 2 });

    expect(signals.map((signal) => signal.securityId)).toEqual(['000002', '000004']);
  });

  it('allocates equal target weights to selected securities', async () => {
    const strategy = new MomentumTopNStrategy();

    const signals = await strategy.generateSignals(mockStrategyContext, { maxPositions: 2 });

    expect(signals).toEqual([
      {
        securityId: '000002',
        targetWeight: 0.5,
        reason: 'momentum top-n allocation',
      },
      {
        securityId: '000004',
        targetWeight: 0.5,
        reason: 'momentum top-n allocation',
      },
    ]);
  });

  it('keeps total target weight approximately equal to 1', async () => {
    const strategy = new MomentumTopNStrategy();

    const signals = await strategy.generateSignals(mockStrategyContext, { maxPositions: 3 });
    const totalWeight = signals.reduce((total, signal) => total + signal.targetWeight, 0);

    expect(totalWeight).toBeCloseTo(1, 10);
  });

  it.each([0, -1, 1.5])('rejects invalid maxPositions: %s', (maxPositions: number) => {
    const strategy = new MomentumTopNStrategy();

    expect(() => strategy.validateConfig({ maxPositions })).toThrow('maxPositions must be a positive integer');
  });

  it('ignores momentum scores outside the universe', async () => {
    const strategy = new MomentumTopNStrategy();
    const context = contextWith({
      universe: ['000001', '000002'],
      momentumScores: [
        ...mockMomentumScores,
        {
          securityId: '999999',
          score: 100,
          tradeDate: new Date('2026-05-14T00:00:00.000Z'),
          source: 'momentum-20d',
        },
      ],
    });

    const signals = await strategy.generateSignals(context, { maxPositions: 3 });

    expect(signals.map((signal) => signal.securityId)).toEqual(['000002', '000001']);
  });
});
