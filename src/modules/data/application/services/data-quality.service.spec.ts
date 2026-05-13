import { DataQualityService } from './data-quality.service';
import { DataQualityIssueType } from '../../domain/types/market-data.types';

describe('DataQualityService', () => {
  it('detects invalid OHLC and abnormal pct change', () => {
    const service = new DataQualityService(
      emptyRepository(),
      emptyRepository(),
      emptyRepository(),
      emptyRepository(),
    );

    const issues = service.validateBar({
      symbol: '000001',
      tsCode: '000001.SZ',
      tradeDate: '20260514',
      open: 10,
      high: 9,
      low: 8,
      close: 12,
      preClose: 10,
      change: 2,
      pctChange: 20,
      volume: 1000,
      amount: 12000,
    }, false);

    expect(issues.map((item) => item.type)).toContain(DataQualityIssueType.INVALID_OHLC);
    expect(issues.map((item) => item.type)).toContain(DataQualityIssueType.ABNORMAL_PCT_CHANGE);
  });
});

function emptyRepository<T>(): T {
  return {} as T;
}
