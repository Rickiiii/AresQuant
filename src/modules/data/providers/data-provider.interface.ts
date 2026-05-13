import type {
  AdjFactorRawData,
  DailyBarRawData,
  FinancialFactorRawData,
  IndexDailyBarRawData,
  LimitPriceRawData,
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
}
