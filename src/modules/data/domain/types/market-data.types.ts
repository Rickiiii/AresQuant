import type { Exchange } from '@prisma/client';

export interface StockRawData {
  readonly symbol: string;
  readonly tsCode: string;
  readonly name: string;
  readonly exchange: Exchange;
  readonly market: string;
  readonly industry?: string;
  readonly area?: string;
  readonly listDate: string;
  readonly delistDate?: string;
  readonly isActive: boolean;
  readonly isST: boolean;
}

export interface TradingCalendarRawData {
  readonly exchange: Exchange;
  readonly tradeDate: string;
  readonly isOpen: boolean;
  readonly preTradeDate?: string;
}

export interface DailyBarRawData {
  readonly symbol: string;
  readonly tsCode: string;
  readonly tradeDate: string;
  readonly open: number;
  readonly high: number;
  readonly low: number;
  readonly close: number;
  readonly preClose: number;
  readonly change: number;
  readonly pctChange: number;
  readonly volume: number;
  readonly amount: number;
}

export interface IndexDailyBarRawData {
  readonly indexCode: string;
  readonly tradeDate: string;
  readonly open: number;
  readonly high: number;
  readonly low: number;
  readonly close: number;
  readonly preClose: number;
  readonly change: number;
  readonly pctChange: number;
  readonly volume: number;
  readonly amount: number;
}

export interface LimitPriceRawData {
  readonly symbol: string;
  readonly tradeDate: string;
  readonly upLimit: number;
  readonly downLimit: number;
}

export interface SuspensionRawData {
  readonly symbol: string;
  readonly tradeDate: string;
  readonly suspendType: string;
  readonly reason?: string;
}

export interface AdjFactorRawData {
  readonly symbol: string;
  readonly tradeDate: string;
  readonly factor: number;
}

export interface FinancialFactorRawData {
  readonly symbol: string;
  readonly reportDate: string;
  readonly annDate: string;
  readonly pe?: number;
  readonly pb?: number;
  readonly ps?: number;
  readonly roe?: number;
  readonly roa?: number;
  readonly grossMargin?: number;
  readonly netProfitMargin?: number;
  readonly debtToAsset?: number;
  readonly revenueGrowth?: number;
  readonly profitGrowth?: number;
}

export interface DataSyncResult {
  readonly taskName: string;
  readonly dataType: string;
  readonly status: 'SUCCESS' | 'FAILED';
  readonly totalCount: number;
  readonly successCount: number;
  readonly failedCount: number;
  readonly errorMessage?: string;
}

export type AdjustmentType = 'none' | 'forward' | 'backward';

export interface AdjustedDailyBar extends DailyBarRawData {
  readonly adjustment: Exclude<AdjustmentType, 'none'>;
  readonly factor: number;
}

export enum DataQualityIssueType {
  INVALID_OHLC = 'INVALID_OHLC',
  NEGATIVE_PRICE = 'NEGATIVE_PRICE',
  NEGATIVE_VOLUME = 'NEGATIVE_VOLUME',
  MISSING_TRADE_DATE = 'MISSING_TRADE_DATE',
  ABNORMAL_PCT_CHANGE = 'ABNORMAL_PCT_CHANGE',
  DUPLICATE_RECORD = 'DUPLICATE_RECORD',
  MISSING_ADJ_FACTOR = 'MISSING_ADJ_FACTOR',
}

export interface DataQualityIssue {
  readonly symbol: string;
  readonly tradeDate?: string;
  readonly type: DataQualityIssueType;
  readonly severity: 'LOW' | 'MEDIUM' | 'HIGH';
  readonly message: string;
}
