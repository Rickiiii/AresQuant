import type { DataSyncLogStatus } from '@prisma/client';
import type {
  AdjFactorRawData,
  DailyBarRawData,
  FinancialFactorRawData,
  IndexDailyBarRawData,
  LimitPriceRawData,
  StockRawData,
  SuspensionRawData,
  TradingCalendarRawData,
} from '../types/market-data.types';

export const STOCK_REPOSITORY = Symbol('STOCK_REPOSITORY');
export const TRADING_CALENDAR_REPOSITORY = Symbol('TRADING_CALENDAR_REPOSITORY');
export const PHASE2_DAILY_BAR_REPOSITORY = Symbol('PHASE2_DAILY_BAR_REPOSITORY');
export const INDEX_DAILY_BAR_REPOSITORY = Symbol('INDEX_DAILY_BAR_REPOSITORY');
export const LIMIT_PRICE_REPOSITORY = Symbol('LIMIT_PRICE_REPOSITORY');
export const SUSPENSION_REPOSITORY = Symbol('SUSPENSION_REPOSITORY');
export const ADJ_FACTOR_REPOSITORY = Symbol('ADJ_FACTOR_REPOSITORY');
export const FINANCIAL_FACTOR_REPOSITORY = Symbol('FINANCIAL_FACTOR_REPOSITORY');
export const DATA_SYNC_LOG_REPOSITORY = Symbol('DATA_SYNC_LOG_REPOSITORY');

export interface RepositoryDateRange {
  readonly startDate: string;
  readonly endDate: string;
}

export interface StockRepository {
  upsertMany(records: readonly StockRawData[]): Promise<number>;
  findBySymbol(symbol: string): Promise<StockRawData | null>;
  findByDateRange(range: RepositoryDateRange): Promise<readonly StockRawData[]>;
  findLatestDate(): Promise<string | null>;
  count(): Promise<number>;
  deleteByDateRange(range: RepositoryDateRange): Promise<number>;
  findAll(): Promise<readonly StockRawData[]>;
}

export interface TradingCalendarRepository {
  upsertMany(records: readonly TradingCalendarRawData[]): Promise<number>;
  findByDateRange(range: RepositoryDateRange): Promise<readonly TradingCalendarRawData[]>;
  findLatestDate(): Promise<string | null>;
  count(): Promise<number>;
  deleteByDateRange(range: RepositoryDateRange): Promise<number>;
}

export interface Phase2DailyBarRepository {
  upsertMany(records: readonly DailyBarRawData[]): Promise<number>;
  findBySymbol(symbol: string): Promise<readonly DailyBarRawData[]>;
  findByDateRange(symbol: string, range: RepositoryDateRange): Promise<readonly DailyBarRawData[]>;
  findLatestDate(symbol?: string): Promise<string | null>;
  count(symbol?: string): Promise<number>;
  deleteByDateRange(symbol: string, range: RepositoryDateRange): Promise<number>;
  findByTradeDate(tradeDate: string): Promise<readonly DailyBarRawData[]>;
}

export interface IndexDailyBarRepository {
  upsertMany(records: readonly IndexDailyBarRawData[]): Promise<number>;
  findBySymbol(indexCode: string): Promise<readonly IndexDailyBarRawData[]>;
  findByDateRange(indexCode: string, range: RepositoryDateRange): Promise<readonly IndexDailyBarRawData[]>;
  findLatestDate(indexCode?: string): Promise<string | null>;
  count(indexCode?: string): Promise<number>;
  deleteByDateRange(indexCode: string, range: RepositoryDateRange): Promise<number>;
}

export interface LimitPriceRepository {
  upsertMany(records: readonly LimitPriceRawData[]): Promise<number>;
  findBySymbol(symbol: string): Promise<readonly LimitPriceRawData[]>;
  findByDateRange(symbol: string, range: RepositoryDateRange): Promise<readonly LimitPriceRawData[]>;
  findLatestDate(symbol?: string): Promise<string | null>;
  count(symbol?: string): Promise<number>;
  deleteByDateRange(symbol: string, range: RepositoryDateRange): Promise<number>;
  findByTradeDate(tradeDate: string): Promise<readonly LimitPriceRawData[]>;
}

export interface SuspensionRepository {
  upsertMany(records: readonly SuspensionRawData[]): Promise<number>;
  findBySymbol(symbol: string): Promise<readonly SuspensionRawData[]>;
  findByDateRange(symbol: string, range: RepositoryDateRange): Promise<readonly SuspensionRawData[]>;
  findLatestDate(symbol?: string): Promise<string | null>;
  count(symbol?: string): Promise<number>;
  deleteByDateRange(symbol: string, range: RepositoryDateRange): Promise<number>;
  findByTradeDate(tradeDate: string): Promise<readonly SuspensionRawData[]>;
}

export interface AdjFactorRepository {
  upsertMany(records: readonly AdjFactorRawData[]): Promise<number>;
  findBySymbol(symbol: string): Promise<readonly AdjFactorRawData[]>;
  findByDateRange(symbol: string, range: RepositoryDateRange): Promise<readonly AdjFactorRawData[]>;
  findLatestDate(symbol?: string): Promise<string | null>;
  count(symbol?: string): Promise<number>;
  deleteByDateRange(symbol: string, range: RepositoryDateRange): Promise<number>;
}

export interface FinancialFactorRepository {
  upsertMany(records: readonly FinancialFactorRawData[]): Promise<number>;
  findBySymbol(symbol: string): Promise<readonly FinancialFactorRawData[]>;
  findByDateRange(symbol: string, range: RepositoryDateRange): Promise<readonly FinancialFactorRawData[]>;
  findLatestDate(symbol?: string): Promise<string | null>;
  count(symbol?: string): Promise<number>;
  deleteByDateRange(symbol: string, range: RepositoryDateRange): Promise<number>;
}

export interface DataSyncLogCreateInput {
  readonly taskName: string;
  readonly dataType: string;
  readonly status: DataSyncLogStatus;
  readonly startTime?: Date;
  readonly endTime?: Date;
  readonly totalCount?: number;
  readonly successCount?: number;
  readonly failedCount?: number;
  readonly errorMessage?: string;
}

export interface DataSyncLogUpdateInput {
  readonly status: DataSyncLogStatus;
  readonly endTime?: Date;
  readonly totalCount: number;
  readonly successCount: number;
  readonly failedCount: number;
  readonly errorMessage?: string;
}

export interface DataSyncLogRepository {
  create(input: DataSyncLogCreateInput): Promise<string>;
  update(id: string, input: DataSyncLogUpdateInput): Promise<void>;
}
