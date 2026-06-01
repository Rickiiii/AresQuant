import { Exchange } from '@prisma/client';
import { EastmoneyDataProvider } from './eastmoney-data-provider';

describe('EastmoneyDataProvider', () => {
  it('maps Eastmoney stock list rows to stock raw data', async () => {
    const provider = new EastmoneyDataProvider(fakeFetch({
      rc: 0,
      data: {
        diff: [
          { f12: '000001', f14: '平安银行' },
          { f12: '600000', f14: '浦发银行' },
          { f12: '300750', f14: '宁德时代' },
        ],
      },
    }));

    const records = await provider.getStocks();

    expect(records).toEqual([
      expect.objectContaining({ symbol: '000001', tsCode: '000001.SZ', name: '平安银行', exchange: Exchange.SZSE, market: '主板', isActive: true, isST: false }),
      expect.objectContaining({ symbol: '600000', tsCode: '600000.SH', name: '浦发银行', exchange: Exchange.SSE, market: '主板', isActive: true, isST: false }),
      expect.objectContaining({ symbol: '300750', tsCode: '300750.SZ', name: '宁德时代', exchange: Exchange.SZSE, market: '创业板', isActive: true, isST: false }),
    ]);
  });

  it('maps Eastmoney stock kline rows to daily bars', async () => {
    const provider = new EastmoneyDataProvider(fakeFetch({
      rc: 0,
      data: {
        code: '000001',
        name: '平安银行',
        klines: [
          '2024-05-06,10.00,10.50,10.80,9.90,123400,129570000.00,9.00,5.00,0.50,1.20',
          '2024-05-07,10.50,10.40,10.70,10.20,100000,104000000.00,4.76,-0.95,-0.10,0.95',
        ],
      },
    }));

    const records = await provider.getDailyBars('000001', '20240506', '20240507');

    expect(records).toEqual([
      {
        symbol: '000001',
        tsCode: '000001.SZ',
        tradeDate: '20240506',
        open: 10,
        close: 10.5,
        high: 10.8,
        low: 9.9,
        preClose: 10,
        change: 0.5,
        pctChange: 5,
        volume: 123400,
        amount: 129570000,
      },
      expect.objectContaining({ tradeDate: '20240507', preClose: 10.5, close: 10.4, change: -0.1, pctChange: -0.95 }),
    ]);
  });

  it('maps index klines and derives an open trading calendar from them', async () => {
    const provider = new EastmoneyDataProvider(fakeFetch({
      rc: 0,
      data: {
        code: '000300',
        klines: [
          '2024-05-06,3600.00,3610.00,3620.00,3590.00,1200000,4320000000.00,0.83,0.28,10.00,0.00',
          '2024-05-07,3610.00,3600.00,3630.00,3580.00,1000000,3600000000.00,1.39,-0.28,-10.00,0.00',
        ],
      },
    }));

    await expect(provider.getIndexDailyBars('000300.SH', '20240506', '20240507')).resolves.toEqual([
      expect.objectContaining({ indexCode: '000300.SH', tradeDate: '20240506', preClose: 3600, close: 3610 }),
      expect.objectContaining({ indexCode: '000300.SH', tradeDate: '20240507', preClose: 3610, close: 3600 }),
    ]);

    await expect(provider.getTradingCalendar('20240506', '20240507')).resolves.toEqual([
      { exchange: Exchange.SSE, tradeDate: '20240506', isOpen: true },
      { exchange: Exchange.SSE, tradeDate: '20240507', isOpen: true, preTradeDate: '20240506' },
    ]);
  });

  it('retries a transient Eastmoney request failure before mapping stock rows', async () => {
    const fetcher = jest
      .fn()
      .mockRejectedValueOnce(new Error('socket hang up'))
      .mockResolvedValueOnce(fakeResponse({
        rc: 0,
        data: {
          diff: [{ f12: '000001', f14: '平安银行' }],
        },
      }));
    const provider = new EastmoneyDataProvider(fetcher as unknown as typeof fetch);

    await expect(provider.getStocks()).resolves.toEqual([
      expect.objectContaining({ symbol: '000001', name: '平安银行' }),
    ]);
    expect(fetcher).toHaveBeenCalledTimes(2);
  });

  it('does not retry non-transient Eastmoney HTTP failures', async () => {
    const fetcher = jest.fn().mockResolvedValue({
      ok: false,
      status: 400,
      json: async () => ({}),
    } satisfies FakeResponse);
    const provider = new EastmoneyDataProvider(fetcher as unknown as typeof fetch);

    await expect(provider.getStocks()).rejects.toThrow('Eastmoney request failed: HTTP 400');
    expect(fetcher).toHaveBeenCalledTimes(1);
  });

  it('computes limit prices from Eastmoney pre-close rows', async () => {
    const provider = new EastmoneyDataProvider(fakeFetch({
      rc: 0,
      data: {
        diff: [
          { f12: '000001', f14: '平安银行', f18: 10 },
          { f12: '300750', f14: '宁德时代', f18: 200 },
          { f12: '600000', f14: 'ST浦发', f18: 7.33 },
        ],
      },
    }));

    await expect(provider.getLimitPrices('20240506')).resolves.toEqual([
      { symbol: '000001', tradeDate: '20240506', upLimit: 11, downLimit: 9 },
      { symbol: '300750', tradeDate: '20240506', upLimit: 240, downLimit: 160 },
      { symbol: '600000', tradeDate: '20240506', upLimit: 7.7, downLimit: 6.96 },
    ]);
  });

  it('maps Eastmoney valuation snapshot to financial factors', async () => {
    const provider = new EastmoneyDataProvider(fakeFetch({
      rc: 0,
      data: {
        diff: [{
          f12: '000001',
          f9: 5.8,
          f23: 0.62,
          f115: 1.9,
        }],
      },
    }));

    await expect(provider.getFinancialFactors('000001')).resolves.toEqual([
      {
        symbol: '000001',
        reportDate: '00000000',
        annDate: '00000000',
        pe: 5.8,
        pb: 0.62,
        ps: 1.9,
      },
    ]);
  });

  it('adds an abort signal to Eastmoney requests so slow public endpoints can timeout', async () => {
    const fetcher = jest.fn().mockResolvedValue(fakeResponse({
      rc: 0,
      data: {
        diff: [{ f12: '000001', f14: '平安银行' }],
      },
    }));
    const provider = new EastmoneyDataProvider(fetcher as unknown as typeof fetch);

    await provider.getStocks();

    expect(fetcher).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({ signal: expect.any(AbortSignal) }),
    );
  });

  it('maps Eastmoney quote rows for selected portfolio symbols', async () => {
    const fetcher = fakeFetch({
      rc: 0,
      data: {
        diff: [
          { f12: '600366', f14: '宁波韵升', f2: 15.25, f3: 2.01, f4: 0.3, f5: 123456, f6: 18827160, f17: 14.9, f15: 15.4, f16: 14.7, f18: 14.95 },
          { f12: '000001', f14: '平安银行', f2: 10.01, f3: -0.1, f4: -0.01, f5: 1000, f6: 10010, f17: 10.02, f15: 10.08, f16: 9.99, f18: 10.02 },
        ],
      },
    });
    const provider = new EastmoneyDataProvider(fetcher);

    await expect(provider.getStockQuotes(['600366'])).resolves.toEqual([
      {
        symbol: '600366',
        name: '宁波韵升',
        latestPrice: 15.25,
        change: 0.3,
        pctChange: 2.01,
        open: 14.9,
        high: 15.4,
        low: 14.7,
        preClose: 14.95,
        volume: 123456,
        amount: 18827160,
        source: 'eastmoney',
      },
    ]);
    expect(fetcher).toHaveBeenCalledWith(
      expect.stringContaining('secids=1.600366'),
      expect.any(Object),
    );
  });

  it('maps Eastmoney market snapshots for index and theme watch items', async () => {
    const fetcher = fakeFetch({
      rc: 0,
      data: {
        diff: [
          { f12: '000300', f14: '沪深300', f2: 3980.12, f3: 1.23, f4: 48.2, f6: 250000000000 },
          { f12: '399006', f14: '创业板指', f2: 1900.66, f3: -0.8, f4: -15.3, f6: 180000000000 },
          { f12: '562500', f14: '机器人ETF', f2: 0.88, f3: 2.5, f4: 0.02, f6: 360000000 },
        ],
      },
    });
    const provider = new EastmoneyDataProvider(fetcher);

    await expect(provider.getMarketSnapshots([
      { code: '000300.SH', name: '沪深300', category: 'index' },
      { code: '399006.SZ', name: '创业板指', category: 'index' },
      { code: '562500.SH', name: '机器人ETF', category: 'theme' },
    ])).resolves.toEqual([
      { code: '000300.SH', name: '沪深300', category: 'index', latestPrice: 3980.12, change: 48.2, pctChange: 1.23, amount: 250000000000, source: 'eastmoney' },
      { code: '399006.SZ', name: '创业板指', category: 'index', latestPrice: 1900.66, change: -15.3, pctChange: -0.8, amount: 180000000000, source: 'eastmoney' },
      { code: '562500.SH', name: '机器人ETF', category: 'theme', latestPrice: 0.88, change: 0.02, pctChange: 2.5, amount: 360000000, source: 'eastmoney' },
    ]);
    expect(fetcher).toHaveBeenCalledWith(
      expect.stringContaining('secids=1.000300%2C0.399006%2C1.562500'),
      expect.any(Object),
    );
  });

  it('fails fast when Eastmoney returns an invalid payload', async () => {
    const provider = new EastmoneyDataProvider(fakeFetch({ rc: 0, data: null }));

    await expect(provider.getStocks()).rejects.toThrow('Invalid Eastmoney stock list response');
  });
});

type FakeResponse = {
  readonly ok: boolean;
  readonly status: number;
  json(): Promise<unknown>;
};

function fakeFetch(payload: unknown): typeof fetch {
  return jest.fn().mockResolvedValue(fakeResponse(payload)) as unknown as typeof fetch;
}

function fakeResponse(payload: unknown): FakeResponse {
  return {
    ok: true,
    status: 200,
    json: async () => payload,
  } satisfies FakeResponse;
}
