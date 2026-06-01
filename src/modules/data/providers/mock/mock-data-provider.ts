import { Injectable, Logger } from '@nestjs/common';
import { Exchange } from '@prisma/client';
import type { DataProvider } from '../data-provider.interface';
import type {
  AdjFactorRawData,
  DailyBarRawData,
  FinancialFactorRawData,
  IndexDailyBarRawData,
  LimitPriceRawData,
  MarketSnapshotRawData,
  MarketSnapshotRequest,
  StockQuoteRawData,
  StockRawData,
  SuspensionRawData,
  TradingCalendarRawData,
} from '../../domain/types/market-data.types';

@Injectable()
export class MockDataProvider implements DataProvider {
  private readonly logger = new Logger(MockDataProvider.name);
  private readonly stocks: readonly StockRawData[] = [
    {
      symbol: '000001',
      tsCode: '000001.SZ',
      name: '平安银行',
      exchange: Exchange.SZSE,
      market: '主板',
      industry: '银行',
      area: '深圳',
      listDate: '19910403',
      isActive: true,
      isST: false,
    },
    {
      symbol: '600000',
      tsCode: '600000.SH',
      name: '浦发银行',
      exchange: Exchange.SSE,
      market: '主板',
      industry: '银行',
      area: '上海',
      listDate: '19991110',
      isActive: true,
      isST: false,
    },
  ];

  async getStocks(): Promise<readonly StockRawData[]> {
    this.logger.log('Mock provider loading stocks');
    return this.stocks;
  }

  async getTradingCalendar(startDate: string, endDate: string): Promise<readonly TradingCalendarRawData[]> {
    return buildDateRange(startDate, endDate).map((tradeDate, index, dates) => ({
      exchange: Exchange.SZSE,
      tradeDate,
      isOpen: isWeekday(tradeDate),
      ...(index === 0 ? {} : { preTradeDate: dates[index - 1] }),
    }));
  }

  async getDailyBars(symbol: string, startDate: string, endDate: string): Promise<readonly DailyBarRawData[]> {
    const stock = this.stocks.find((item) => item.symbol === symbol);
    const tsCode = stock?.tsCode ?? `${symbol}.SZ`;
    return buildDateRange(startDate, endDate)
      .filter(isWeekday)
      .map((tradeDate, index) => {
        const base = symbol === '000001' ? 10 : 7;
        const close = round(base + index * 0.08);
        const preClose = round(index === 0 ? base : base + (index - 1) * 0.08);
        return {
          symbol,
          tsCode,
          tradeDate,
          open: round(preClose * 1.002),
          high: round(close * 1.015),
          low: round(preClose * 0.985),
          close,
          preClose,
          change: round(close - preClose),
          pctChange: round(((close - preClose) / preClose) * 100),
          volume: 1_000_000 + index * 10_000,
          amount: round((1_000_000 + index * 10_000) * close),
        };
      });
  }

  async getIndexDailyBars(indexCode: string, startDate: string, endDate: string): Promise<readonly IndexDailyBarRawData[]> {
    return buildDateRange(startDate, endDate)
      .filter(isWeekday)
      .map((tradeDate, index) => {
        const preClose = 3000 + index * 3;
        const close = preClose + 2;
        return {
          indexCode,
          tradeDate,
          open: preClose,
          high: close + 10,
          low: preClose - 10,
          close,
          preClose,
          change: 2,
          pctChange: round((2 / preClose) * 100),
          volume: 10_000_000,
          amount: 30_000_000_000,
        };
      });
  }

  async getLimitPrices(tradeDate: string): Promise<readonly LimitPriceRawData[]> {
    return this.stocks.map((stock) => ({
      symbol: stock.symbol,
      tradeDate,
      upLimit: 11,
      downLimit: 9,
    }));
  }

  async getSuspensions(tradeDate: string): Promise<readonly SuspensionRawData[]> {
    return tradeDate.endsWith('03')
      ? [{ symbol: '600000', tradeDate, suspendType: 'TEMPORARY', reason: 'mock temporary suspension' }]
      : [];
  }

  async getAdjFactors(symbol: string, startDate: string, endDate: string): Promise<readonly AdjFactorRawData[]> {
    return buildDateRange(startDate, endDate)
      .filter(isWeekday)
      .map((tradeDate, index) => ({
        symbol,
        tradeDate,
        factor: round(1 + index * 0.001),
      }));
  }

  async getFinancialFactors(symbol: string): Promise<readonly FinancialFactorRawData[]> {
    return [
      {
        symbol,
        reportDate: '20251231',
        annDate: '20260330',
        pe: 8.5,
        pb: 0.7,
        ps: 2.1,
        roe: 11.2,
        roa: 0.9,
        grossMargin: 45.1,
        netProfitMargin: 28.4,
        debtToAsset: 91.2,
        revenueGrowth: 5.6,
        profitGrowth: 7.2,
      },
    ];
  }

  async getMarketSnapshots(items: readonly MarketSnapshotRequest[]): Promise<readonly MarketSnapshotRawData[]> {
    return items.map((item, index) => {
      const latestPrice = item.category === 'index' ? 3000 + index * 100 : 1 + index * 0.05;
      const change = item.category === 'index' ? 12 + index : 0.01 + index * 0.01;
      const pctChange = round((change / latestPrice) * 100);
      return {
        code: item.code,
        name: item.name,
        category: item.category,
        latestPrice: round(latestPrice),
        change: round(change),
        pctChange,
        amount: item.category === 'index' ? 120_000_000_000 : 300_000_000,
        source: 'mock',
      };
    });
  }

  async getStockQuotes(symbols: readonly string[]): Promise<readonly StockQuoteRawData[]> {
    return symbols.map((symbol, index) => {
      const base = symbol.startsWith('6') ? 12 : 8;
      const latestPrice = round(base + index * 0.5);
      const preClose = round(latestPrice - 0.1);
      return {
        symbol,
        name: this.stocks.find((stock) => stock.symbol === symbol)?.name ?? symbol,
        latestPrice,
        change: round(latestPrice - preClose),
        pctChange: round(((latestPrice - preClose) / preClose) * 100),
        open: preClose,
        high: round(latestPrice * 1.02),
        low: round(latestPrice * 0.98),
        preClose,
        volume: 1_000_000,
        amount: round(1_000_000 * latestPrice),
        source: 'mock',
      };
    });
  }
}

function buildDateRange(startDate: string, endDate: string): readonly string[] {
  const dates: string[] = [];
  const current = parseCompactDate(startDate);
  const end = parseCompactDate(endDate);
  while (current <= end) {
    dates.push(formatCompactDate(current));
    current.setUTCDate(current.getUTCDate() + 1);
  }
  return dates;
}

function isWeekday(compactDate: string): boolean {
  const day = parseCompactDate(compactDate).getUTCDay();
  return day >= 1 && day <= 5;
}

function parseCompactDate(value: string): Date {
  const year = Number(value.slice(0, 4));
  const month = Number(value.slice(4, 6));
  const day = Number(value.slice(6, 8));
  return new Date(Date.UTC(year, month - 1, day));
}

function formatCompactDate(value: Date): string {
  const year = value.getUTCFullYear().toString().padStart(4, '0');
  const month = (value.getUTCMonth() + 1).toString().padStart(2, '0');
  const day = value.getUTCDate().toString().padStart(2, '0');
  return `${year}${month}${day}`;
}

function round(value: number): number {
  return Math.round(value * 10_000) / 10_000;
}
