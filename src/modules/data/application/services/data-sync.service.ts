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
