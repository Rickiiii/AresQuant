import type { StrategyContext, StrategyScore } from './strategy.types';

export const mockUniverse = ['000001', '000002', '000003', '000004'] as const;

export const mockMomentumScores: readonly StrategyScore[] = [
  {
    securityId: '000001',
    score: 0.12,
    tradeDate: new Date('2026-05-14T00:00:00.000Z'),
    source: 'momentum-20d',
  },
  {
    securityId: '000002',
    score: 0.35,
    tradeDate: new Date('2026-05-14T00:00:00.000Z'),
    source: 'momentum-20d',
  },
  {
    securityId: '000003',
    score: -0.05,
    tradeDate: new Date('2026-05-14T00:00:00.000Z'),
    source: 'momentum-20d',
  },
  {
    securityId: '000004',
    score: 0.21,
    tradeDate: new Date('2026-05-14T00:00:00.000Z'),
    source: 'momentum-20d',
  },
];

export const mockStrategyContext: StrategyContext = {
  tradeDate: new Date('2026-05-14T00:00:00.000Z'),
  rebalanceRange: {
    from: new Date('2026-05-01T00:00:00.000Z'),
    to: new Date('2026-05-31T00:00:00.000Z'),
  },
  universe: mockUniverse,
  momentumScores: mockMomentumScores,
};
