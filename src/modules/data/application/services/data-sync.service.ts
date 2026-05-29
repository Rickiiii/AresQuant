import { Inject, Injectable, Logger } from '@nestjs/common';
import { DataSyncLogStatus } from '@prisma/client';
import { DATA_PROVIDER, type DataProvider } from '../../providers/data-provider.interface';
import type { DataSyncResult } from '../../domain/types/market-data.types';
import {
  ADJ_FACTOR_REPOSITORY,
  DATA_SYNC_LOG_REPOSITORY,
  FINANCIAL_FACTOR_REPOSITORY,
  INDEX_DAILY_BAR_REPOSITORY,
  LIMIT_PRICE_REPOSITORY,
  PHASE2_DAILY_BAR_REPOSITORY,
  STOCK_REPOSITORY,
  SUSPENSION_REPOSITORY,
  TRADING_CALENDAR_REPOSITORY,
  type AdjFactorRepository,
  type DataSyncLogRepository,
  type FinancialFactorRepository,
  type IndexDailyBarRepository,
  type LimitPriceRepository,
  type Phase2DailyBarRepository,
  type StockRepository,
  type SuspensionRepository,
  type TradingCalendarRepository,
} from '../../domain/repositories/data-center.repositories';

export interface EastmoneySmokeCheckItem {
  readonly name: 'stocks' | 'dailyBars' | 'indexDailyBars' | 'limitPrices' | 'financialFactors';
  readonly status: 'SUCCESS' | 'FAILED';
  readonly sampleCount: number;
  readonly errorMessage?: string;
}

export interface EastmoneySmokeCheckResult {
  readonly provider: 'eastmoney';
  readonly status: 'SUCCESS' | 'FAILED';
  readonly checks: readonly EastmoneySmokeCheckItem[];
}

export type DataSyncHealthStatus = 'healthy' | 'stale' | 'empty' | 'failed';

export interface DataSyncDatasetHealth {
  readonly dataSet: string;
  readonly label: string;
  readonly status: DataSyncHealthStatus;
  readonly total: number;
  readonly latestDate: string | null;
  readonly errorMessage?: string;
}

export interface DataSyncHealthSummary {
  readonly status: DataSyncHealthStatus;
  readonly summary: string;
  readonly asOfDate: string | null;
  readonly staleDatasetCount: number;
  readonly emptyDatasetCount: number;
  readonly failedDatasetCount: number;
  readonly datasets: readonly DataSyncDatasetHealth[];
}

interface CoverageRepository {
  count(): Promise<number>;
  findLatestDate(): Promise<string | null>;
}

const DEFAULT_CORE_SYNC_SYMBOLS = ['000001', '600519', '000333', '600000'] as const;
const CORE_INDEX_CODES = ['000300.SH', '000905.SH'] as const;

@Injectable()
export class DataSyncService {
  private readonly logger = new Logger(DataSyncService.name);

  constructor(
    @Inject(DATA_PROVIDER) private readonly provider: DataProvider,
    @Inject(STOCK_REPOSITORY) private readonly stockRepository: StockRepository,
    @Inject(TRADING_CALENDAR_REPOSITORY) private readonly tradingCalendarRepository: TradingCalendarRepository,
    @Inject(PHASE2_DAILY_BAR_REPOSITORY) private readonly dailyBarRepository: Phase2DailyBarRepository,
    @Inject(INDEX_DAILY_BAR_REPOSITORY) private readonly indexDailyBarRepository: IndexDailyBarRepository,
    @Inject(LIMIT_PRICE_REPOSITORY) private readonly limitPriceRepository: LimitPriceRepository,
    @Inject(SUSPENSION_REPOSITORY) private readonly suspensionRepository: SuspensionRepository,
    @Inject(ADJ_FACTOR_REPOSITORY) private readonly adjFactorRepository: AdjFactorRepository,
    @Inject(FINANCIAL_FACTOR_REPOSITORY) private readonly financialFactorRepository: FinancialFactorRepository,
    @Inject(DATA_SYNC_LOG_REPOSITORY) private readonly dataSyncLogRepository: DataSyncLogRepository,
  ) {}

  async syncStocks(): Promise<DataSyncResult> {
    return this.runTask('syncStocks', 'stocks', async () => {
      const records = await this.provider.getStocks();
      return { total: records.length, success: await this.stockRepository.upsertMany(records), failed: 0 };
    });
  }

  async syncTradingCalendar(startDate: string, endDate: string): Promise<DataSyncResult> {
    return this.runTask('syncTradingCalendar', 'trading_calendar', async () => {
      const records = await this.provider.getTradingCalendar(startDate, endDate);
      return { total: records.length, success: await this.tradingCalendarRepository.upsertMany(records), failed: 0 };
    });
  }

  async syncDailyBars(symbols: readonly string[], startDate: string, endDate: string): Promise<DataSyncResult> {
    return this.runPartitionedTask('syncDailyBars', 'daily_bars', symbols, async (symbol) => {
      const records = await this.provider.getDailyBars(symbol, startDate, endDate);
      return { total: records.length, success: await this.dailyBarRepository.upsertMany(records) };
    });
  }

  async syncIndexDailyBars(indexCodes: readonly string[], startDate: string, endDate: string): Promise<DataSyncResult> {
    return this.runPartitionedTask('syncIndexDailyBars', 'index_daily_bars', indexCodes, async (indexCode) => {
      const records = await this.provider.getIndexDailyBars(indexCode, startDate, endDate);
      return { total: records.length, success: await this.indexDailyBarRepository.upsertMany(records) };
    });
  }

  async syncLimitPrices(startDate: string, endDate: string): Promise<DataSyncResult> {
    return this.runDailyTask('syncLimitPrices', 'limit_prices', startDate, endDate, async (tradeDate) => {
      const records = await this.provider.getLimitPrices(tradeDate);
      return { total: records.length, success: await this.limitPriceRepository.upsertMany(records) };
    });
  }

  async syncSuspensions(startDate: string, endDate: string): Promise<DataSyncResult> {
    return this.runDailyTask('syncSuspensions', 'suspensions', startDate, endDate, async (tradeDate) => {
      const records = await this.provider.getSuspensions(tradeDate);
      return { total: records.length, success: await this.suspensionRepository.upsertMany(records) };
    });
  }

  async syncAdjFactors(symbols: readonly string[], startDate: string, endDate: string): Promise<DataSyncResult> {
    return this.runPartitionedTask('syncAdjFactors', 'adj_factors', symbols, async (symbol) => {
      const records = await this.provider.getAdjFactors(symbol, startDate, endDate);
      return { total: records.length, success: await this.adjFactorRepository.upsertMany(records) };
    });
  }

  async syncFinancialFactors(symbols: readonly string[]): Promise<DataSyncResult> {
    return this.runPartitionedTask('syncFinancialFactors', 'financial_factors', symbols, async (symbol) => {
      const records = await this.provider.getFinancialFactors(symbol);
      return { total: records.length, success: await this.financialFactorRepository.upsertMany(records) };
    });
  }

  async smokeCheckEastmoney(): Promise<EastmoneySmokeCheckResult> {
    const stockSymbol = process.env.EASTMONEY_SMOKE_SYMBOL ?? '000001';
    const tradeDate = normalizeDate(process.env.EASTMONEY_SMOKE_DATE ?? latestPastWeekday(new Date()));
    const checks: EastmoneySmokeCheckItem[] = [];

    checks.push(await this.runSmokeCheck('stocks', async () => this.provider.getStocks()));
    checks.push(await this.runSmokeCheck('dailyBars', async () => this.provider.getDailyBars(stockSymbol, tradeDate, tradeDate)));
    checks.push(await this.runSmokeCheck('indexDailyBars', async () => this.provider.getIndexDailyBars('000300.SH', tradeDate, tradeDate)));
    checks.push(await this.runSmokeCheck('limitPrices', async () => this.provider.getLimitPrices(tradeDate)));
    checks.push(await this.runSmokeCheck('financialFactors', async () => this.provider.getFinancialFactors(stockSymbol)));

    return {
      provider: 'eastmoney',
      status: checks.every((check) => check.status === 'SUCCESS') ? 'SUCCESS' : 'FAILED',
      checks,
    };
  }

  async getSyncHealth(today = new Date()): Promise<DataSyncHealthSummary> {
    const expectedMarketDate = latestPastWeekday(today);
    const datasets = await Promise.all([
      buildDatasetHealth('stocks', '股票池', this.stockRepository, expectedMarketDate, 3650),
      buildDatasetHealth('tradingCalendar', '交易日历', this.tradingCalendarRepository, expectedMarketDate, 30),
      buildDatasetHealth('dailyBars', '日线行情', this.dailyBarRepository, expectedMarketDate, 3),
      buildDatasetHealth('indexDailyBars', '指数日线', this.indexDailyBarRepository, expectedMarketDate, 3),
      buildDatasetHealth('limitPrices', '涨跌停价格', this.limitPriceRepository, expectedMarketDate, 3),
      buildDatasetHealth('suspensions', '停复牌', this.suspensionRepository, expectedMarketDate, 3),
      buildDatasetHealth('adjFactors', '复权因子', this.adjFactorRepository, expectedMarketDate, 7),
      buildDatasetHealth('financialFactors', '财务因子', this.financialFactorRepository, expectedMarketDate, 180),
    ]);
    const failedDatasetCount = datasets.filter((item) => item.status === 'failed').length;
    const emptyDatasetCount = datasets.filter((item) => item.status === 'empty').length;
    const staleDatasetCount = datasets.filter((item) => item.status === 'stale').length;
    const asOfDate = latestCompactDate(datasets.filter(isMarketDatasetHealth).map((item) => item.latestDate));
    const status = resolveSyncHealthStatus({ failedDatasetCount, emptyDatasetCount, staleDatasetCount });

    return {
      status,
      summary: syncHealthSummaryText(status),
      asOfDate,
      staleDatasetCount,
      emptyDatasetCount,
      failedDatasetCount,
      datasets,
    };
  }

  async syncAll(startDate: string, endDate: string): Promise<readonly DataSyncResult[]> {
    const stockResult = await this.syncStocks();
    const stocks = await this.stockRepository.findAll();
    const symbols = stocks.map((stock) => stock.symbol);
    const results: DataSyncResult[] = [stockResult];
    results.push(await this.syncTradingCalendar(startDate, endDate));
    results.push(await this.syncDailyBars(symbols, startDate, endDate));
    results.push(await this.syncIndexDailyBars(['000300.SH', '000905.SH'], startDate, endDate));
    results.push(await this.syncLimitPrices(startDate, endDate));
    results.push(await this.syncSuspensions(startDate, endDate));
    results.push(await this.syncAdjFactors(symbols, startDate, endDate));
    results.push(await this.syncFinancialFactors(symbols));
    return results;
  }

  async syncCore(startDate: string, endDate: string, symbols: readonly string[] = DEFAULT_CORE_SYNC_SYMBOLS): Promise<readonly DataSyncResult[]> {
    const scopedSymbols = symbols.length > 0 ? symbols : DEFAULT_CORE_SYNC_SYMBOLS;
    const results: DataSyncResult[] = [];
    results.push(await this.syncStocks());
    results.push(await this.syncTradingCalendar(startDate, endDate));
    results.push(await this.syncDailyBars(scopedSymbols, startDate, endDate));
    results.push(await this.syncIndexDailyBars(CORE_INDEX_CODES, startDate, endDate));
    results.push(await this.syncLimitPrices(startDate, endDate));
    results.push(await this.syncSuspensions(startDate, endDate));
    results.push(await this.syncAdjFactors(scopedSymbols, startDate, endDate));
    results.push(await this.syncFinancialFactors(scopedSymbols));
    return results;
  }

  private async runDailyTask(
    taskName: string,
    dataType: string,
    startDate: string,
    endDate: string,
    handler: (tradeDate: string) => Promise<{ readonly total: number; readonly success: number }>,
  ): Promise<DataSyncResult> {
    return this.runPartitionedTask(taskName, dataType, compactDateRange(startDate, endDate), handler);
  }

  private async runPartitionedTask(
    taskName: string,
    dataType: string,
    partitions: readonly string[],
    handler: (partition: string) => Promise<{ readonly total: number; readonly success: number }>,
  ): Promise<DataSyncResult> {
    return this.runTask(taskName, dataType, async () => {
      let total = 0;
      let success = 0;
      let failed = 0;
      const errors: string[] = [];
      for (const partition of partitions) {
        try {
          const result = await handler(partition);
          total += result.total;
          success += result.success;
          failed += result.total - result.success;
        } catch (error) {
          failed += 1;
          const message = error instanceof Error ? error.message : String(error);
          errors.push(`${partition}: ${message}`);
          this.logger.error(`Data sync partition failed: ${partition}`, error instanceof Error ? error.stack : message);
        }
      }
      return { total, success, failed, errorMessage: errors.join('; ') };
    });
  }

  private async runSmokeCheck(
    name: EastmoneySmokeCheckItem['name'],
    handler: () => Promise<readonly unknown[]>,
  ): Promise<EastmoneySmokeCheckItem> {
    try {
      const records = await handler();
      return { name, status: 'SUCCESS', sampleCount: records.length };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.warn(`Eastmoney smoke check failed: ${name} ${message}`);
      return { name, status: 'FAILED', sampleCount: 0, errorMessage: message };
    }
  }

  private async runTask(
    taskName: string,
    dataType: string,
    handler: () => Promise<{ readonly total: number; readonly success: number; readonly failed: number; readonly errorMessage?: string }>,
  ): Promise<DataSyncResult> {
    const logId = await this.dataSyncLogRepository.create({
      taskName,
      dataType,
      status: DataSyncLogStatus.RUNNING,
      startTime: new Date(),
    });
    this.logger.log(`Data sync started task=${taskName}, dataType=${dataType}`);

    try {
      const result = await handler();
      const status = result.failed > 0 ? DataSyncLogStatus.FAILED : DataSyncLogStatus.SUCCESS;
      await this.dataSyncLogRepository.update(logId, {
        status,
        endTime: new Date(),
        totalCount: result.total,
        successCount: result.success,
        failedCount: result.failed,
        ...(result.errorMessage === undefined || result.errorMessage.length === 0 ? {} : { errorMessage: result.errorMessage }),
      });
      return {
        taskName,
        dataType,
        status: status === DataSyncLogStatus.SUCCESS ? 'SUCCESS' : 'FAILED',
        totalCount: result.total,
        successCount: result.success,
        failedCount: result.failed,
        ...(result.errorMessage === undefined || result.errorMessage.length === 0 ? {} : { errorMessage: result.errorMessage }),
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      await this.dataSyncLogRepository.update(logId, {
        status: DataSyncLogStatus.FAILED,
        endTime: new Date(),
        totalCount: 0,
        successCount: 0,
        failedCount: 1,
        errorMessage: message,
      });
      this.logger.error(`Data sync failed task=${taskName}`, error instanceof Error ? error.stack : message);
      return { taskName, dataType, status: 'FAILED', totalCount: 0, successCount: 0, failedCount: 1, errorMessage: message };
    }
  }
}

async function buildDatasetHealth(
  dataSet: string,
  label: string,
  repository: CoverageRepository,
  expectedMarketDate: string,
  staleAfterDays: number,
): Promise<DataSyncDatasetHealth> {
  try {
    const [total, latestDate] = await Promise.all([
      repository.count(),
      repository.findLatestDate(),
    ]);
    if (total <= 0 || latestDate === null) {
      return { dataSet, label, status: 'empty', total, latestDate };
    }
    return {
      dataSet,
      label,
      status: daysBetweenCompactDates(latestDate, expectedMarketDate) > staleAfterDays ? 'stale' : 'healthy',
      total,
      latestDate,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return { dataSet, label, status: 'failed', total: 0, latestDate: null, errorMessage: message };
  }
}

function resolveSyncHealthStatus(input: {
  readonly failedDatasetCount: number;
  readonly emptyDatasetCount: number;
  readonly staleDatasetCount: number;
}): DataSyncHealthStatus {
  if (input.failedDatasetCount > 0) {
    return 'failed';
  }
  if (input.emptyDatasetCount > 0) {
    return 'empty';
  }
  if (input.staleDatasetCount > 0) {
    return 'stale';
  }
  return 'healthy';
}

function syncHealthSummaryText(status: DataSyncHealthStatus): string {
  switch (status) {
    case 'healthy':
      return '核心行情数据已同步，当前可用于工作台分析。';
    case 'stale':
      return '部分核心数据已经过期，建议先同步数据再做投研判断。';
    case 'empty':
      return '核心数据仍为空，请先执行数据同步。';
    case 'failed':
      return '读取数据同步状态失败，请检查数据库或同步任务。';
  }
}

function latestCompactDate(dates: readonly (string | null)[]): string | null {
  const validDates = dates.filter((date): date is string => date !== null);
  if (validDates.length === 0) {
    return null;
  }
  return validDates.toSorted().at(-1) ?? null;
}

function isMarketDatasetHealth(dataset: DataSyncDatasetHealth): boolean {
  return ['dailyBars', 'indexDailyBars', 'limitPrices', 'suspensions', 'adjFactors'].includes(dataset.dataSet);
}

function daysBetweenCompactDates(left: string, right: string): number {
  return Math.floor((parseCompactDate(right).getTime() - parseCompactDate(left).getTime()) / 86_400_000);
}

function parseCompactDate(value: string): Date {
  return new Date(Date.UTC(Number(value.slice(0, 4)), Number(value.slice(4, 6)) - 1, Number(value.slice(6, 8))));
}

function normalizeDate(value: string): string {
  return value.includes('-') ? value.replaceAll('-', '') : value;
}

function latestPastWeekday(today: Date): string {
  const current = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()));
  current.setUTCDate(current.getUTCDate() - 1);
  while (current.getUTCDay() === 0 || current.getUTCDay() === 6) {
    current.setUTCDate(current.getUTCDate() - 1);
  }
  return toCompactDate(current);
}

function compactDateRange(startDate: string, endDate: string): readonly string[] {
  const dates: string[] = [];
  const current = toDate(startDate);
  const end = toDate(endDate);
  while (current <= end) {
    dates.push(toCompactDate(current));
    current.setUTCDate(current.getUTCDate() + 1);
  }
  return dates;
}

function toDate(value: string): Date {
  const normalized = value.includes('-') ? value.replaceAll('-', '') : value;
  return new Date(Date.UTC(Number(normalized.slice(0, 4)), Number(normalized.slice(4, 6)) - 1, Number(normalized.slice(6, 8))));
}

function toCompactDate(value: Date): string {
  return `${value.getUTCFullYear().toString().padStart(4, '0')}${(value.getUTCMonth() + 1).toString().padStart(2, '0')}${value.getUTCDate().toString().padStart(2, '0')}`;
}
