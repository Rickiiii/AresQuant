import { FactorScoreService } from './factor-score.service';
import type { FactorScoreWeight } from './factor-score.service';
import type { FactorValue } from '../domain/strategy.types';

const tradeDate = new Date('2026-05-14T00:00:00.000Z');

const values: readonly FactorValue[] = [
  { securityId: '000001', factorCode: 'momentum', value: 0.2, tradeDate },
  { securityId: '000002', factorCode: 'momentum', value: 0.1, tradeDate },
  { securityId: '000003', factorCode: 'momentum', value: -0.1, tradeDate },
  { securityId: '000001', factorCode: 'pe', value: 20, tradeDate },
  { securityId: '000002', factorCode: 'pe', value: 10, tradeDate },
  { securityId: '000003', factorCode: 'pe', value: 30, tradeDate },
];

const weights: readonly FactorScoreWeight[] = [
  { factorCode: 'momentum', weight: 0.7, direction: 'positive' },
  { factorCode: 'pe', weight: 0.3, direction: 'negative' },
];

describe('FactorScoreService', () => {
  it('calculates weighted rank scores with positive and negative factor directions', () => {
    const service = new FactorScoreService();

    const scores = service.calculateScores({ tradeDate, values, weights, method: 'rank' });

    expect(scores.map((score) => score.securityId)).toEqual(['000001', '000002', '000003']);
    expect(scores[0]?.score).toBeCloseTo(0.85, 6);
    expect(scores[1]?.score).toBeCloseTo(0.65, 6);
    expect(scores[2]?.score).toBeCloseTo(0, 6);
  });

  it('calculates minmax scores', () => {
    const service = new FactorScoreService();

    const scores = service.calculateScores({ tradeDate, values, weights, method: 'minmax' });

    expect(scores.map((score) => score.securityId)).toEqual(['000001', '000002', '000003']);
    expect(scores[0]?.score).toBeCloseTo(0.85, 6);
    expect(scores[1]?.score).toBeCloseTo(0.766667, 6);
    expect(scores[2]?.score).toBeCloseTo(0, 6);
  });

  it('calculates zscore scores', () => {
    const service = new FactorScoreService();

    const scores = service.calculateScores({ tradeDate, values, weights, method: 'zscore' });

    expect(scores).toHaveLength(3);
    expect(scores[0]?.securityId).toBe('000001');
    expect(scores[0]?.score).toBeGreaterThan(scores[1]?.score ?? Number.NEGATIVE_INFINITY);
  });

  it('validates factor score requests', () => {
    const service = new FactorScoreService();

    expect(() => service.calculateScores({ tradeDate, values, weights: [], method: 'rank' })).toThrow('factor weights are required');
    expect(() =>
      service.calculateScores({
        tradeDate,
        values,
        weights: [{ factorCode: 'missing', weight: 1, direction: 'positive' }],
        method: 'rank',
      }),
    ).toThrow('factor values not found: missing');
    expect(() =>
      service.calculateScores({
        tradeDate,
        values,
        weights: [{ factorCode: 'momentum', weight: -1, direction: 'positive' }],
        method: 'rank',
      }),
    ).toThrow('total factor weight must be positive');
  });
});
