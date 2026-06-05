import type {
  AdjFactorRawData,
  DailyBarRawData,
  FinancialFactorRawData,
  FundQuoteRawData,
  IndexDailyBarRawData,
  LimitPriceRawData,
  MarketSnapshotRawData,
  MarketSnapshotRequest,
  StockQuoteRawData,
  StockRawData,
  SuspensionRawData,
  TradingCalendarRawData,
} from '../domain/types/market-data.types';

export const DATA_PROVIDER = Symbol('DATA_PROVIDER');

export interface DataProvider {
  getStocks(): Promise<readonly StockRawData[]>;
  getTradingCalendar(startDate: string, endDate: string): Promise<readonly TradingCalendarRawData[]>;
  getDailyBars(symbol: string, startDate: string, endDate: string): Promise<readonly DailyBarRawData[]>;
  getIndexDailyBars(indexCode: string, startDate: string, endDate: string): Promise<readonly IndexDailyBarRawData[]>;
  getLimitPrices(tradeDate: string): Promise<readonly LimitPriceRawData[]>;
  getSuspensions(tradeDate: string): Promise<readonly SuspensionRawData[]>;
  getAdjFactors(symbol: string, startDate: string, endDate: string): Promise<readonly AdjFactorRawData[]>;
  getFinancialFactors(symbol: string): Promise<readonly FinancialFactorRawData[]>;
  getStockQuotes(symbols: readonly string[]): Promise<readonly StockQuoteRawData[]>;
  getFundQuotes(fundCodes: readonly string[]): Promise<readonly FundQuoteRawData[]>;
  getMarketSnapshots(items: readonly MarketSnapshotRequest[]): Promise<readonly MarketSnapshotRawData[]>;
}
