import { Injectable } from '@nestjs/common';
import { Exchange } from '@prisma/client';
import type { DataProvider } from '../data-provider.interface';
import type {
  AdjFactorRawData,
  DailyBarRawData,
  FinancialFactorRawData,
  IndexDailyBarRawData,
  LimitPriceRawData,
  StockRawData,
  SuspensionRawData,
  TradingCalendarRawData,
} from '../../domain/types/market-data.types';

type FetchLike = (input: string, init?: RequestInit) => Promise<Response>;

const EASTMONEY_REQUEST_TIMEOUT_MS = 8000;
const EASTMONEY_MAX_ATTEMPTS = 2;

type EastmoneyStockRow = {
  readonly f12?: string;
  readonly f14?: string;
};

class NonRetriableEastmoneyRequestError extends Error {}

type EastmoneyListPayload = {
  readonly rc?: number;
  readonly data?: {
    readonly diff?: readonly EastmoneyStockRow[];
  } | null;
};

type EastmoneyKlinePayload = {
  readonly rc?: number;
  readonly data?: {
    readonly code?: string;
    readonly name?: string;
    readonly klines?: readonly string[];
  } | null;
};

@Injectable()
export class EastmoneyDataProvider implements DataProvider {
  private readonly baseListUrl = 'https://push2.eastmoney.com/api/qt/clist/get';
  private readonly baseKlineUrl = 'https://push2his.eastmoney.com/api/qt/stock/kline/get';

  constructor(private readonly fetcher: FetchLike = fetch) {}

  async getStocks(): Promise<readonly StockRawData[]> {
    const payload = await this.getJson<EastmoneyListPayload>(this.buildStockListUrl());
    if (!Array.isArray(payload.data?.diff)) {
      throw new Error('Invalid Eastmoney stock list response');
    }
    return payload.data.diff
      .map((row) => this.mapStock(row))
      .filter((row): row is StockRawData => row !== undefined);
  }

  async getTradingCalendar(startDate: string, endDate: string): Promise<readonly TradingCalendarRawData[]> {
    const bars = await this.getIndexDailyBars('000300.SH', startDate, endDate);
    return bars.map((bar, index) => ({
      exchange: Exchange.SSE,
      tradeDate: bar.tradeDate,
      isOpen: true,
      ...(index === 0 ? {} : { preTradeDate: mustGet(bars, index - 1).tradeDate }),
    }));
  }

  async getDailyBars(symbol: string, startDate: string, endDate: string): Promise<readonly DailyBarRawData[]> {
    const payload = await this.getJson<EastmoneyKlinePayload>(this.buildKlineUrl(toSecId(symbol), startDate, endDate));
    if (!Array.isArray(payload.data?.klines)) {
      throw new Error(`Invalid Eastmoney daily kline response: ${symbol}`);
    }
    return payload.data.klines.map((line, index, lines) => mapDailyKline(symbol, line, index, lines));
  }

  async getIndexDailyBars(indexCode: string, startDate: string, endDate: string): Promise<readonly IndexDailyBarRawData[]> {
    const payload = await this.getJson<EastmoneyKlinePayload>(this.buildKlineUrl(toIndexSecId(indexCode), startDate, endDate));
    if (!Array.isArray(payload.data?.klines)) {
      throw new Error(`Invalid Eastmoney index kline response: ${indexCode}`);
    }
    return payload.data.klines.map((line, index, lines) => mapIndexKline(indexCode, line, index, lines));
  }

  async getLimitPrices(_tradeDate: string): Promise<readonly LimitPriceRawData[]> {
    return [];
  }

  async getSuspensions(_tradeDate: string): Promise<readonly SuspensionRawData[]> {
    return [];
  }

  async getAdjFactors(_symbol: string, _startDate: string, _endDate: string): Promise<readonly AdjFactorRawData[]> {
    return [];
  }

  async getFinancialFactors(_symbol: string): Promise<readonly FinancialFactorRawData[]> {
    return [];
  }

  private async getJson<T>(url: string): Promise<T> {
    let lastError: unknown;

    for (let attempt = 1; attempt <= EASTMONEY_MAX_ATTEMPTS; attempt += 1) {
      const abortController = new AbortController();
      const timeout = setTimeout(() => abortController.abort(), EASTMONEY_REQUEST_TIMEOUT_MS);

      try {
        const response = await this.fetcher(url, {
          headers: {
            Accept: 'application/json,text/plain,*/*',
            'User-Agent': 'Mozilla/5.0 AresQuant/0.1 EastmoneyDataProvider',
            Referer: 'https://quote.eastmoney.com/',
          },
          signal: abortController.signal,
        });
        if (!response.ok) {
          const error = new Error(`Eastmoney request failed: HTTP ${response.status}`);
          if (!shouldRetryHttpStatus(response.status) || attempt === EASTMONEY_MAX_ATTEMPTS) {
            throw new NonRetriableEastmoneyRequestError(error.message);
          }
          lastError = error;
          continue;
        }
        return response.json() as Promise<T>;
      } catch (error) {
        lastError = error;
        if (error instanceof NonRetriableEastmoneyRequestError || attempt === EASTMONEY_MAX_ATTEMPTS) {
          throw error;
        }
      } finally {
        clearTimeout(timeout);
      }
    }

    throw lastError instanceof Error ? lastError : new Error('Eastmoney request failed');
  }

  private buildStockListUrl(): string {
    const params = new URLSearchParams({
      pn: '1',
      pz: '5000',
      po: '1',
      np: '1',
      ut: 'bd1d9ddb04089700cf9c27f6f7426281',
      fltt: '2',
      invt: '2',
      fid: 'f3',
      fs: 'm:0+t:6,m:0+t:80,m:1+t:2,m:1+t:23',
      fields: 'f12,f14',
    });
    return `${this.baseListUrl}?${params.toString()}`;
  }

  private buildKlineUrl(secId: string, startDate: string, endDate: string): string {
    const params = new URLSearchParams({
      secid: secId,
      klt: '101',
      fqt: '1',
      beg: normalizeDate(startDate),
      end: normalizeDate(endDate),
      fields1: 'f1,f2,f3,f4,f5,f6',
      fields2: 'f51,f52,f53,f54,f55,f56,f57,f58,f59,f60,f61',
    });
    return `${this.baseKlineUrl}?${params.toString()}`;
  }

  private mapStock(row: EastmoneyStockRow): StockRawData | undefined {
    if (row.f12 === undefined || row.f14 === undefined) {
      return undefined;
    }
    const exchange = exchangeForSymbol(row.f12);
    if (exchange === undefined) {
      return undefined;
    }
    return {
      symbol: row.f12,
      tsCode: `${row.f12}.${exchange === Exchange.SSE ? 'SH' : 'SZ'}`,
      name: row.f14,
      exchange,
      market: marketForSymbol(row.f12),
      listDate: '19000101',
      isActive: true,
      isST: row.f14.includes('ST'),
    };
  }
}

function mapDailyKline(symbol: string, line: string, index: number, lines: readonly string[]): DailyBarRawData {
  const parsed = parseKline(line);
  const previous = index === 0 ? undefined : parseKline(mustGet(lines, index - 1));
  const preClose = previous?.close ?? parsed.open;
  return {
    symbol,
    tsCode: `${symbol}.${exchangeForSymbol(symbol) === Exchange.SSE ? 'SH' : 'SZ'}`,
    tradeDate: compactDate(parsed.tradeDate),
    open: parsed.open,
    high: parsed.high,
    low: parsed.low,
    close: parsed.close,
    preClose,
    change: parsed.change,
    pctChange: parsed.pctChange,
    volume: parsed.volume,
    amount: parsed.amount,
  };
}

function mapIndexKline(indexCode: string, line: string, index: number, lines: readonly string[]): IndexDailyBarRawData {
  const parsed = parseKline(line);
  const previous = index === 0 ? undefined : parseKline(mustGet(lines, index - 1));
  return {
    indexCode,
    tradeDate: compactDate(parsed.tradeDate),
    open: parsed.open,
    high: parsed.high,
    low: parsed.low,
    close: parsed.close,
    preClose: previous?.close ?? parsed.open,
    change: parsed.change,
    pctChange: parsed.pctChange,
    volume: parsed.volume,
    amount: parsed.amount,
  };
}

function parseKline(line: string): {
  readonly tradeDate: string;
  readonly open: number;
  readonly close: number;
  readonly high: number;
  readonly low: number;
  readonly volume: number;
  readonly amount: number;
  readonly pctChange: number;
  readonly change: number;
} {
  const parts = line.split(',');
  if (parts.length < 10) {
    throw new Error(`Invalid Eastmoney kline row: ${line}`);
  }
  const tradeDate = mustGet(parts, 0);
  const open = mustGet(parts, 1);
  const close = mustGet(parts, 2);
  const high = mustGet(parts, 3);
  const low = mustGet(parts, 4);
  const volume = mustGet(parts, 5);
  const amount = mustGet(parts, 6);
  const pctChange = mustGet(parts, 8);
  const change = mustGet(parts, 9);
  return {
    tradeDate,
    open: toNumber(open),
    close: toNumber(close),
    high: toNumber(high),
    low: toNumber(low),
    volume: toNumber(volume),
    amount: toNumber(amount),
    pctChange: toNumber(pctChange),
    change: toNumber(change),
  };
}

function exchangeForSymbol(symbol: string): Exchange | undefined {
  if (symbol.startsWith('6')) {
    return Exchange.SSE;
  }
  if (symbol.startsWith('0') || symbol.startsWith('3')) {
    return Exchange.SZSE;
  }
  return undefined;
}

function marketForSymbol(symbol: string): string {
  if (symbol.startsWith('300') || symbol.startsWith('301')) {
    return '创业板';
  }
  if (symbol.startsWith('688') || symbol.startsWith('689')) {
    return '科创板';
  }
  if (symbol.startsWith('8') || symbol.startsWith('4')) {
    return '北交所';
  }
  return '主板';
}

function toSecId(symbol: string): string {
  const exchange = exchangeForSymbol(symbol);
  return `${exchange === Exchange.SSE ? '1' : '0'}.${symbol}`;
}

function toIndexSecId(indexCode: string): string {
  const compact = indexCode.split('.')[0];
  return `${indexCode.endsWith('.SZ') ? '0' : '1'}.${compact}`;
}

function normalizeDate(value: string): string {
  return value.includes('-') ? value.replaceAll('-', '') : value;
}

function compactDate(value: string): string {
  return normalizeDate(value);
}

function toNumber(value: string): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    throw new Error(`Invalid Eastmoney numeric value: ${value}`);
  }
  return parsed;
}

function shouldRetryHttpStatus(status: number): boolean {
  return status === 429 || status >= 500;
}

function mustGet<T>(items: readonly T[], index: number): T {
  const item = items[index];
  if (item === undefined) {
    throw new Error(`Missing Eastmoney item at index ${index}`);
  }
  return item;
}
