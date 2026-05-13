import { AdjustmentService } from './adjustment.service';

describe('AdjustmentService', () => {
  it('calculates forward adjusted bars without mutating original bars', () => {
    const service = new AdjustmentService(emptyRepository(), emptyRepository());
    const bars = [
      { symbol: '000001', tsCode: '000001.SZ', tradeDate: '20260513', open: 10, high: 11, low: 9, close: 10, preClose: 9.8, change: 0.2, pctChange: 2, volume: 100, amount: 1000 },
      { symbol: '000001', tsCode: '000001.SZ', tradeDate: '20260514', open: 12, high: 13, low: 11, close: 12, preClose: 10, change: 2, pctChange: 20, volume: 100, amount: 1200 },
    ];
    const result = service.calculateAdjustedBars(bars, [
      { symbol: '000001', tradeDate: '20260513', factor: 1 },
      { symbol: '000001', tradeDate: '20260514', factor: 2 },
    ], 'forward');

    expect(result[0]?.close).toBe(5);
    expect(result[1]?.close).toBe(12);
    expect(bars[0]?.close).toBe(10);
  });
});

function emptyRepository<T>(): T {
  return {} as T;
}
