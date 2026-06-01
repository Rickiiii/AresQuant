import { DataSyncLogStatus, Exchange } from '@prisma/client';
import { DataSyncService } from './data-sync.service';
import type { DataProvider } from '../../providers/data-provider.interface';
import type {
  AdjFactorRepository,
  DataSyncLogRepository,
  FinancialFactorRepository,
  IndexDailyBarRepository,
  LimitPriceRepository,
  Phase2DailyBarRepository,
  StockRepository,
  SuspensionRepository,
  TradingCalendarRepository,
} from '../../domain/repositories/data-center.repositories';

describe('DataSyncService', () => {
  it('syncs stocks and writes success log', async () => {
    const provider: DataProvider = {
      getStocks: jest.fn().mockResolvedValue([{ symbol: '000001', tsCode: '000001.SZ', name: '平安银行', exchange: Exchange.SZSE, market: '主板', listDate: '19910403', isActive: true, isST: false }]),
      getTradingCalendar: jest.fn(),
      getDailyBars: jest.fn(),
      getIndexDailyBars: jest.fn(),
      getLimitPrices: jest.fn(),
      getSuspensions: jest.fn(),
      getAdjFactors: jest.fn(),
      getFinancialFactors: jest.fn(),
      getStockQuotes: jest.fn(),
      getMarketSnapshots: jest.fn(),
    };
    const stockRepository = { upsertMany: jest.fn().mockResolvedValue(1), findAll: jest.fn(), findBySymbol: jest.fn(), findByDateRange: jest.fn(), findLatestDate: jest.fn(), count: jest.fn(), deleteByDateRange: jest.fn() } as unknown as StockRepository;
    const logRepository = { create: jest.fn().mockResolvedValue('log-1'), update: jest.fn().mockResolvedValue(undefined) } as unknown as DataSyncLogRepository;
    const service = new DataSyncService(
      provider,
      stockRepository,
      emptyRepository<TradingCalendarRepository>(),
      emptyRepository<Phase2DailyBarRepository>(),
      emptyRepository<IndexDailyBarRepository>(),
      emptyRepository<LimitPriceRepository>(),
      emptyRepository<SuspensionRepository>(),
      emptyRepository<AdjFactorRepository>(),
      emptyRepository<FinancialFactorRepository>(),
      logRepository,
    );

    const result = await service.syncStocks();

    expect(result.status).toBe('SUCCESS');
    expect(logRepository.update).toHaveBeenCalledWith('log-1', expect.objectContaining({ status: DataSyncLogStatus.SUCCESS }));
  });

  it('runs an eastmoney smoke check without writing repositories', async () => {
    const provider: DataProvider = {
      getStocks: jest.fn().mockResolvedValue([{ symbol: '000001', tsCode: '000001.SZ', name: '平安银行', exchange: Exchange.SZSE, market: '主板', listDate: '19910403', isActive: true, isST: false }]),
      getTradingCalendar: jest.fn(),
      getDailyBars: jest.fn().mockResolvedValue([{ symbol: '000001', tradeDate: '20240506' }]),
      getIndexDailyBars: jest.fn().mockResolvedValue([{ indexCode: '000300.SH', tradeDate: '20240506' }]),
      getLimitPrices: jest.fn().mockResolvedValue([{ symbol: '000001', tradeDate: '20240506' }]),
      getSuspensions: jest.fn(),
      getAdjFactors: jest.fn(),
      getFinancialFactors: jest.fn().mockResolvedValue([{ symbol: '000001', reportDate: '00000000', annDate: '00000000' }]),
      getStockQuotes: jest.fn(),
      getMarketSnapshots: jest.fn(),
    };
    const stockRepository = { upsertMany: jest.fn(), findAll: jest.fn(), findBySymbol: jest.fn(), findByDateRange: jest.fn(), findLatestDate: jest.fn(), count: jest.fn(), deleteByDateRange: jest.fn() } as unknown as StockRepository;
    const service = new DataSyncService(
      provider,
      stockRepository,
      emptyRepository<TradingCalendarRepository>(),
      emptyRepository<Phase2DailyBarRepository>(),
      emptyRepository<IndexDailyBarRepository>(),
      emptyRepository<LimitPriceRepository>(),
      emptyRepository<SuspensionRepository>(),
      emptyRepository<AdjFactorRepository>(),
      emptyRepository<FinancialFactorRepository>(),
      emptyRepository<DataSyncLogRepository>(),
    );

    await expect(service.smokeCheckEastmoney()).resolves.toEqual({
      provider: 'eastmoney',
      status: 'SUCCESS',
      checks: [
        { name: 'stocks', status: 'SUCCESS', sampleCount: 1 },
        { name: 'dailyBars', status: 'SUCCESS', sampleCount: 1 },
        { name: 'indexDailyBars', status: 'SUCCESS', sampleCount: 1 },
        { name: 'limitPrices', status: 'SUCCESS', sampleCount: 1 },
        { name: 'financialFactors', status: 'SUCCESS', sampleCount: 1 },
      ],
    });
    expect(stockRepository.upsertMany).not.toHaveBeenCalled();
  });

  it('summarizes sync health from core dataset coverage', async () => {
    const service = new DataSyncService(
      emptyProvider(),
      coverageRepository<StockRepository>(5120, '20260528'),
      coverageRepository<TradingCalendarRepository>(5200, '20260528'),
      coverageRepository<Phase2DailyBarRepository>(250000, '20260528'),
      coverageRepository<IndexDailyBarRepository>(3000, '20260528'),
      coverageRepository<LimitPriceRepository>(248000, '20260528'),
      coverageRepository<SuspensionRepository>(1200, '20260528'),
      coverageRepository<AdjFactorRepository>(250000, '20260528'),
      coverageRepository<FinancialFactorRepository>(32000, '20260510'),
      emptyRepository<DataSyncLogRepository>(),
    );

    await expect(service.getSyncHealth(new Date('2026-05-29T00:00:00.000Z'))).resolves.toEqual({
      status: 'healthy',
      summary: '核心行情数据已同步，当前可用于工作台分析。',
      asOfDate: '20260528',
      staleDatasetCount: 0,
      emptyDatasetCount: 0,
      failedDatasetCount: 0,
      datasets: [
        { dataSet: 'stocks', label: '股票池', status: 'healthy', total: 5120, latestDate: '20260528' },
        { dataSet: 'tradingCalendar', label: '交易日历', status: 'healthy', total: 5200, latestDate: '20260528' },
        { dataSet: 'dailyBars', label: '日线行情', status: 'healthy', total: 250000, latestDate: '20260528' },
        { dataSet: 'indexDailyBars', label: '指数日线', status: 'healthy', total: 3000, latestDate: '20260528' },
        { dataSet: 'limitPrices', label: '涨跌停价格', status: 'healthy', total: 248000, latestDate: '20260528' },
        { dataSet: 'suspensions', label: '停复牌', status: 'healthy', total: 1200, latestDate: '20260528' },
        { dataSet: 'adjFactors', label: '复权因子', status: 'healthy', total: 250000, latestDate: '20260528' },
        { dataSet: 'financialFactors', label: '财务因子', status: 'healthy', total: 32000, latestDate: '20260510' },
      ],
    });
  });

  it('marks sync health as stale when core market data lags behind the last trading day', async () => {
    const service = new DataSyncService(
      emptyProvider(),
      coverageRepository<StockRepository>(5120, '20260528'),
      coverageRepository<TradingCalendarRepository>(5200, '20260528'),
      coverageRepository<Phase2DailyBarRepository>(250000, '20260514'),
      coverageRepository<IndexDailyBarRepository>(3000, '20260514'),
      coverageRepository<LimitPriceRepository>(248000, '20260514'),
      coverageRepository<SuspensionRepository>(1200, '20260514'),
      coverageRepository<AdjFactorRepository>(250000, '20260514'),
      coverageRepository<FinancialFactorRepository>(32000, '20260510'),
      emptyRepository<DataSyncLogRepository>(),
    );

    await expect(service.getSyncHealth(new Date('2026-05-29T00:00:00.000Z'))).resolves.toMatchObject({
      status: 'stale',
      asOfDate: '20260514',
      staleDatasetCount: 5,
      emptyDatasetCount: 0,
      failedDatasetCount: 0,
    });
  });

  it('syncs a bounded core data scope for the workbench', async () => {
    const provider: DataProvider = {
      getStocks: jest.fn().mockResolvedValue([{ symbol: '000001', tsCode: '000001.SZ', name: '平安银行', exchange: Exchange.SZSE, market: '主板', listDate: '19910403', isActive: true, isST: false }]),
      getTradingCalendar: jest.fn().mockResolvedValue([{ exchange: Exchange.SSE, tradeDate: '20260528', isOpen: true }]),
      getDailyBars: jest.fn().mockResolvedValue([{ symbol: '000001', tradeDate: '20260528' }]),
      getIndexDailyBars: jest.fn().mockResolvedValue([{ indexCode: '000300.SH', tradeDate: '20260528' }]),
      getLimitPrices: jest.fn().mockResolvedValue([{ symbol: '000001', tradeDate: '20260528' }]),
      getSuspensions: jest.fn().mockResolvedValue([]),
      getAdjFactors: jest.fn().mockResolvedValue([{ symbol: '000001', tradeDate: '20260528' }]),
      getFinancialFactors: jest.fn().mockResolvedValue([{ symbol: '000001', reportDate: '20260331', annDate: '20260430' }]),
    };
    const stockRepository = repositoryWithUpsert<StockRepository>(1);
    const tradingCalendarRepository = repositoryWithUpsert<TradingCalendarRepository>(1);
    const dailyBarRepository = repositoryWithUpsert<Phase2DailyBarRepository>(1);
    const indexDailyBarRepository = repositoryWithUpsert<IndexDailyBarRepository>(1);
    const limitPriceRepository = repositoryWithUpsert<LimitPriceRepository>(1);
    const suspensionRepository = repositoryWithUpsert<SuspensionRepository>(0);
    const adjFactorRepository = repositoryWithUpsert<AdjFactorRepository>(1);
    const financialFactorRepository = repositoryWithUpsert<FinancialFactorRepository>(1);
    const logRepository = { create: jest.fn().mockResolvedValue('log-1'), update: jest.fn().mockResolvedValue(undefined) } as unknown as DataSyncLogRepository;
    const service = new DataSyncService(
      provider,
      stockRepository,
      tradingCalendarRepository,
      dailyBarRepository,
      indexDailyBarRepository,
      limitPriceRepository,
      suspensionRepository,
      adjFactorRepository,
      financialFactorRepository,
      logRepository,
    );

    const result = await service.syncCore('20260527', '20260528', ['000001', '600519']);

    expect(result).toHaveLength(8);
    expect(provider.getDailyBars).toHaveBeenCalledTimes(2);
    expect(provider.getDailyBars).toHaveBeenCalledWith('000001', '20260527', '20260528');
    expect(provider.getDailyBars).toHaveBeenCalledWith('600519', '20260527', '20260528');
    expect(provider.getIndexDailyBars).toHaveBeenCalledWith('000300.SH', '20260527', '20260528');
    expect(provider.getIndexDailyBars).toHaveBeenCalledWith('000905.SH', '20260527', '20260528');
    expect(provider.getFinancialFactors).toHaveBeenCalledTimes(2);
    expect(result.every((item) => item.status === 'SUCCESS')).toBe(true);
  });
});

function emptyProvider(): DataProvider {
  return {
    getStocks: jest.fn(),
    getTradingCalendar: jest.fn(),
    getDailyBars: jest.fn(),
    getIndexDailyBars: jest.fn(),
    getLimitPrices: jest.fn(),
    getSuspensions: jest.fn(),
    getAdjFactors: jest.fn(),
    getFinancialFactors: jest.fn(),
  };
}

function coverageRepository<T>(total: number, latestDate: string | null): T {
  return {
    count: jest.fn().mockResolvedValue(total),
    findLatestDate: jest.fn().mockResolvedValue(latestDate),
  } as T;
}

function repositoryWithUpsert<T>(count: number): T {
  return {
    upsertMany: jest.fn().mockResolvedValue(count),
  } as T;
}

function emptyRepository<T>(): T {
  return {} as T;
}
