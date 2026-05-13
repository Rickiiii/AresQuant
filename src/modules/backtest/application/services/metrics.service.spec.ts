import { Decimal } from 'decimal.js';
import { MetricsService } from './metrics.service';

describe('MetricsService', () => {
  it('calculates max drawdown from snapshots', () => {
    const service = new MetricsService(emptyRepository(), emptyRepository());
    const metrics = service.calculateFromSnapshots([
      snapshot('20260511', 100),
      snapshot('20260512', 120),
      snapshot('20260513', 90),
    ], 2);
    expect(metrics.maxDrawdown.toNumber()).toBeCloseTo(-0.25);
    expect(metrics.tradeCount).toBe(2);
  });
});

function snapshot(date: string, total: number) {
  return { taskId: 'task', tradeDate: date, cash: new Decimal(total), marketValue: new Decimal(0), totalAsset: new Decimal(total), dailyReturn: new Decimal(0), cumulativeReturn: new Decimal(0), drawdown: date === '20260513' ? new Decimal(-0.25) : new Decimal(0) };
}

function emptyRepository<T>(): T {
  return {} as T;
}
