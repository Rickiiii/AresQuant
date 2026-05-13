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
});

function emptyRepository<T>(): T {
  return {} as T;
}
