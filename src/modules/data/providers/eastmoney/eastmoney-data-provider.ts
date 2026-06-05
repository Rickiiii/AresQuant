import { Inject, Injectable, Optional } from '@nestjs/common';
import { Exchange } from '@prisma/client';
import type { DataProvider } from '../data-provider.interface';
import type {
  AdjFactorRawData,
  DailyBarRawData,
  FinancialFactorRawData,
  FundQuoteRawData,
  IndexDailyBarRawData,
  LimitPriceRawData,
  MarketSnapshotRawData,
  MarketSnapshotRequest,
  StockRawData,
  StockQuoteRawData,
  SuspensionRawData,
  TradingCalendarRawData,
} from '../../domain/types/market-data.types';

type FetchLike = (input: string, init?: RequestInit) => Promise<Response>;

const EASTMONEY_REQUEST_TIMEOUT_MS = 8000;
const EASTMONEY_MAX_ATTEMPTS = 2;
export const EASTMONEY_FETCHER = Symbol('EASTMONEY_FETCHER');

type EastmoneyStockRow = {
  readonly f12?: string;
  readonly f14?: string;
  readonly f18?: number | string;
};

type EastmoneyQuoteRow = EastmoneyStockRow & {
  readonly f2?: number | string;
  readonly f3?: number | string;
  readonly f4?: number | string;
  readonly f5?: number | string;
  readonly f6?: number | string;
  readonly f15?: number | string;
  readonly f16?: number | string;
  readonly f17?: number | string;
};

class NonRetriableEastmoneyRequestError extends Error {}

type EastmoneyListPayload = {
  readonly rc?: number;
  readonly data?: {
    readonly diff?: readonly EastmoneyStockRow[];
  } | null;
};

type EastmoneyQuotePayload = {
  readonly rc?: number;
  readonly data?: {
    readonly diff?: readonly EastmoneyQuoteRow[];
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

type EastmoneySnapshotPayload = {
  readonly rc?: number;
  readonly data?: {
    readonly diff?: readonly EastmoneyFinancialRow[];
  } | null;
};

type EastmoneyFinancialRow = {
  readonly f12?: string;
  readonly f57?: string;
  readonly f9?: number | string;
  readonly f23?: number | string;
  readonly f162?: number | string;
  readonly f167?: number | string;
  readonly f115?: number | string;
};

@Injectable()
export class EastmoneyDataProvider implements DataProvider {
  private readonly baseListUrl = 'https://push2.eastmoney.com/api/qt/clist/get';
  private readonly baseKlineUrl = 'https://push2his.eastmoney.com/api/qt/stock/kline/get';
  private readonly baseSnapshotUrl = 'https://push2.eastmoney.com/api/qt/clist/get';
  private readonly baseQuoteUrl = 'https://push2.eastmoney.com/api/qt/ulist.np/get';
  private readonly tencentQuoteUrl = 'https://qt.gtimg.cn/q=';
  private readonly fundQuoteUrl = 'https://fundgz.1234567.com.cn/js/';
  private readonly fetcher: FetchLike;

  constructor(@Optional() @Inject(EASTMONEY_FETCHER) fetcher?: FetchLike) {
    this.fetcher = fetcher ?? fetch;
  }

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

  async getLimitPrices(tradeDate: string): Promise<readonly LimitPriceRawData[]> {
    const payload = await this.getJson<EastmoneyListPayload>(this.buildLimitPriceListUrl());
    if (!Array.isArray(payload.data?.diff)) {
      throw new Error('Invalid Eastmoney limit price response');
    }
    return payload.data.diff
      .map((row) => mapLimitPrice(row, normalizeDate(tradeDate)))
      .filter((row): row is LimitPriceRawData => row !== undefined);
  }

  async getSuspensions(_tradeDate: string): Promise<readonly SuspensionRawData[]> {
    return [];
  }

  async getAdjFactors(_symbol: string, _startDate: string, _endDate: string): Promise<readonly AdjFactorRawData[]> {
    return [];
  }

  async getFinancialFactors(symbol: string): Promise<readonly FinancialFactorRawData[]> {
    const payload = await this.getJson<EastmoneySnapshotPayload>(this.buildSnapshotUrl(symbol));
    const row = payload.data?.diff?.find((item) => item.f12 === symbol || item.f57 === symbol);
    if (row === undefined) {
      throw new Error(`Invalid Eastmoney financial factor response: ${symbol}`);
    }
    const pe = toOptionalNumber(row.f9 ?? row.f162);
    const pb = toOptionalNumber(row.f23 ?? row.f167);
    const ps = toOptionalNumber(row.f115);
    if (pe === undefined && pb === undefined && ps === undefined) {
      return [];
    }
    return [{
      symbol: row.f57 ?? row.f12 ?? symbol,
      reportDate: '00000000',
      annDate: '00000000',
      ...(pe === undefined ? {} : { pe }),
      ...(pb === undefined ? {} : { pb }),
      ...(ps === undefined ? {} : { ps }),
    }];
  }

  async getStockQuotes(symbols: readonly string[]): Promise<readonly StockQuoteRawData[]> {
    const uniqueSymbols = Array.from(new Set(symbols));
    if (uniqueSymbols.length === 0) {
      return [];
    }

    try {
      const payload = await this.getJson<EastmoneyQuotePayload>(this.buildQuoteListUrl(uniqueSymbols));
      if (!Array.isArray(payload.data?.diff)) {
        throw new Error('Invalid Eastmoney quote response');
      }
      const symbolSet = new Set(uniqueSymbols);
      return payload.data.diff
        .filter((row) => row.f12 !== undefined && symbolSet.has(row.f12))
        .map((row) => mapQuote(row))
        .filter((row): row is StockQuoteRawData => row !== undefined);
    } catch {
      return this.getTencentStockQuotes(uniqueSymbols);
    }
  }

  async getFundQuotes(fundCodes: readonly string[]): Promise<readonly FundQuoteRawData[]> {
    const uniqueCodes = Array.from(new Set(fundCodes.map((code) => code.trim()).filter((code) => /^[0-9]{6}$/.test(code))));
    if (uniqueCodes.length === 0) {
      return [];
    }
    const quotes = await Promise.all(uniqueCodes.map((code) => this.getFundQuote(code)));
    return quotes.filter((quote): quote is FundQuoteRawData => quote !== undefined);
  }

  async getMarketSnapshots(items: readonly MarketSnapshotRequest[]): Promise<readonly MarketSnapshotRawData[]> {
    const uniqueItems = uniqueMarketSnapshotItems(items);
    if (uniqueItems.length === 0) {
      return [];
    }

    try {
      const payload = await this.getJson<EastmoneyQuotePayload>(this.buildMarketSnapshotUrl(uniqueItems));
      if (!Array.isArray(payload.data?.diff)) {
        throw new Error('Invalid Eastmoney market snapshot response');
      }
      const itemByCompactCode = new Map(uniqueItems.map((item) => [compactMarketCode(item.code), item]));
      return payload.data.diff
        .map((row) => mapMarketSnapshot(row, itemByCompactCode.get(row.f12 ?? '')))
        .filter((row): row is MarketSnapshotRawData => row !== undefined);
    } catch {
      return this.getTencentMarketSnapshots(uniqueItems);
    }
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

  private async getTencentStockQuotes(symbols: readonly string[]): Promise<readonly StockQuoteRawData[]> {
    const text = await this.getTencentText(symbols.map(toTencentSecId));
    return parseTencentLines(text)
      .map((line) => mapTencentQuote(line))
      .filter((quote): quote is StockQuoteRawData => quote !== undefined);
  }

  private async getTencentMarketSnapshots(items: readonly MarketSnapshotRequest[]): Promise<readonly MarketSnapshotRawData[]> {
    const itemBySymbol = new Map(items.map((item) => [compactMarketCode(item.code), item]));
    const text = await this.getTencentText(items.map((item) => toTencentMarketSecId(item.code)));
    return parseTencentLines(text)
      .map((line) => mapTencentMarketSnapshot(line, itemBySymbol.get(mustGet(line, 2))))
      .filter((snapshot): snapshot is MarketSnapshotRawData => snapshot !== undefined);
  }

  private async getTencentText(secIds: readonly string[]): Promise<string> {
    const response = await this.fetcher(`${this.tencentQuoteUrl}${secIds.join(',')}`, {
      headers: {
        Accept: 'text/plain,*/*',
        'User-Agent': 'Mozilla/5.0 AresQuant/0.1 TencentQuoteFallback',
        Referer: 'https://gu.qq.com/',
      },
    });
    if (!response.ok) {
      throw new Error(`Tencent quote request failed: HTTP ${response.status}`);
    }
    const bytes = await response.arrayBuffer();
    return new TextDecoder('gb18030').decode(bytes);
  }

  private async getFundQuote(fundCode: string): Promise<FundQuoteRawData | undefined> {
    const response = await this.fetcher(`${this.fundQuoteUrl}${fundCode}.js?rt=${Date.now()}`, {
      headers: {
        Accept: 'application/javascript,text/plain,*/*',
        'User-Agent': 'Mozilla/5.0 AresQuant/0.1 FundQuoteLookup',
        Referer: 'https://fund.eastmoney.com/',
      },
    });
    if (!response.ok) {
      return undefined;
    }
    const text = await response.text();
    return mapFundQuote(text);
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

  private buildLimitPriceListUrl(): string {
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
      fields: 'f12,f14,f18',
    });
    return `${this.baseListUrl}?${params.toString()}`;
  }

  private buildQuoteListUrl(symbols: readonly string[]): string {
    const params = new URLSearchParams({
      secids: symbols.map(toSecId).join(','),
      ut: 'bd1d9ddb04089700cf9c27f6f7426281',
      fltt: '2',
      invt: '2',
      fields: 'f12,f14,f2,f3,f4,f5,f6,f15,f16,f17,f18',
    });
    return `${this.baseQuoteUrl}?${params.toString()}`;
  }

  private buildMarketSnapshotUrl(items: readonly MarketSnapshotRequest[]): string {
    const params = new URLSearchParams({
      secids: items.map((item) => toMarketSecId(item.code)).join(','),
      ut: 'bd1d9ddb04089700cf9c27f6f7426281',
      fltt: '2',
      invt: '2',
      fields: 'f12,f14,f2,f3,f4,f6',
    });
    return `${this.baseQuoteUrl}?${params.toString()}`;
  }

  private buildSnapshotUrl(_symbol: string): string {
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
      fields: 'f12,f14,f9,f23,f115,f162,f167',
    });
    return `${this.baseSnapshotUrl}?${params.toString()}`;
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

function mapLimitPrice(row: EastmoneyStockRow, tradeDate: string): LimitPriceRawData | undefined {
  if (row.f12 === undefined || row.f14 === undefined || row.f18 === undefined) {
    return undefined;
  }
  const preClose = toOptionalNumber(row.f18);
  if (preClose === undefined || exchangeForSymbol(row.f12) === undefined) {
    return undefined;
  }
  const ratio = limitRatioForStock(row.f12, row.f14);
  return {
    symbol: row.f12,
    tradeDate,
    upLimit: roundPrice(preClose * (1 + ratio)),
    downLimit: roundPrice(preClose * (1 - ratio)),
  };
}

function mapQuote(row: EastmoneyQuoteRow): StockQuoteRawData | undefined {
  if (row.f12 === undefined || row.f14 === undefined) {
    return undefined;
  }
  const latestPrice = toOptionalNumber(row.f2);
  const change = toOptionalNumber(row.f4);
  const pctChange = toOptionalNumber(row.f3);
  const open = toOptionalNumber(row.f17);
  const high = toOptionalNumber(row.f15);
  const low = toOptionalNumber(row.f16);
  const preClose = toOptionalNumber(row.f18);
  const volume = toOptionalNumber(row.f5);
  const amount = toOptionalNumber(row.f6);
  if (
    latestPrice === undefined
    || change === undefined
    || pctChange === undefined
    || open === undefined
    || high === undefined
    || low === undefined
    || preClose === undefined
    || volume === undefined
    || amount === undefined
  ) {
    return undefined;
  }
  return {
    symbol: row.f12,
    name: row.f14,
    latestPrice,
    change,
    pctChange,
    open,
    high,
    low,
    preClose,
    volume,
    amount,
    source: 'eastmoney',
  };
}

function mapMarketSnapshot(
  row: EastmoneyQuoteRow,
  request: MarketSnapshotRequest | undefined,
): MarketSnapshotRawData | undefined {
  if (row.f12 === undefined || request === undefined) {
    return undefined;
  }
  const latestPrice = toOptionalNumber(row.f2);
  const change = toOptionalNumber(row.f4);
  const pctChange = toOptionalNumber(row.f3);
  const amount = toOptionalNumber(row.f6);
  if (latestPrice === undefined || change === undefined || pctChange === undefined || amount === undefined) {
    return undefined;
  }
  return {
    code: request.code,
    name: request.name || row.f14 || request.code,
    category: request.category,
    latestPrice,
    change,
    pctChange,
    amount,
    source: 'eastmoney',
  };
}

function parseTencentLines(text: string): readonly string[][] {
  return text
    .split(';')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const match = line.match(/="(.*)"$/);
      return match?.[1]?.split('~') ?? [];
    })
    .filter((parts) => parts.length > 34);
}

function mapTencentQuote(parts: readonly string[]): StockQuoteRawData | undefined {
  const symbol = parts[2];
  const name = parts[1];
  if (symbol === undefined || name === undefined || symbol.length === 0 || name.length === 0) {
    return undefined;
  }
  const latestPrice = toOptionalNumber(parts[3]);
  const preClose = toOptionalNumber(parts[4]);
  const open = toOptionalNumber(parts[5]);
  const change = toOptionalNumber(parts[31]);
  const pctChange = toOptionalNumber(parts[32]);
  const high = toOptionalNumber(parts[33]);
  const low = toOptionalNumber(parts[34]);
  const volume = toOptionalNumber(parts[36]);
  const amountWan = toOptionalNumber(parts[37]);
  if (
    latestPrice === undefined
    || preClose === undefined
    || open === undefined
    || change === undefined
    || pctChange === undefined
    || high === undefined
    || low === undefined
    || volume === undefined
    || amountWan === undefined
  ) {
    return undefined;
  }
  return {
    symbol,
    name,
    latestPrice,
    change,
    pctChange,
    open,
    high,
    low,
    preClose,
    volume,
    amount: amountWan * 10000,
    source: 'tencent',
  };
}

function mapTencentMarketSnapshot(parts: readonly string[], request: MarketSnapshotRequest | undefined): MarketSnapshotRawData | undefined {
  const quote = mapTencentQuote(parts);
  if (quote === undefined || request === undefined) {
    return undefined;
  }
  return {
    code: request.code,
    name: request.name || quote.name,
    category: request.category,
    latestPrice: quote.latestPrice,
    change: quote.change,
    pctChange: quote.pctChange,
    amount: quote.amount,
    source: quote.source,
  };
}

function mapFundQuote(text: string): FundQuoteRawData | undefined {
  const match = text.match(/jsonpgz\((.*)\);?/);
  if (match?.[1] === undefined) {
    return undefined;
  }
  const payload = JSON.parse(match[1]) as {
    readonly fundcode?: string;
    readonly name?: string;
    readonly jzrq?: string;
    readonly dwjz?: string;
    readonly gsz?: string;
    readonly gszzl?: string;
    readonly gztime?: string;
  };
  if (payload.fundcode === undefined || payload.name === undefined || payload.jzrq === undefined || payload.dwjz === undefined) {
    return undefined;
  }
  const unitNetValue = toOptionalNumber(payload.dwjz);
  if (unitNetValue === undefined) {
    return undefined;
  }
  return {
    fundCode: payload.fundcode,
    name: payload.name,
    netValueDate: payload.jzrq,
    unitNetValue,
    estimatedNetValue: toOptionalNumber(payload.gsz) ?? null,
    estimatedPctChange: toOptionalNumber(payload.gszzl) ?? null,
    estimatedAt: payload.gztime ?? null,
    source: 'eastmoney',
  };
}

function limitRatioForStock(symbol: string, name: string): number {
  if (name.includes('ST')) {
    return 0.05;
  }
  if (symbol.startsWith('300') || symbol.startsWith('301') || symbol.startsWith('688') || symbol.startsWith('689')) {
    return 0.2;
  }
  if (symbol.startsWith('8') || symbol.startsWith('4')) {
    return 0.3;
  }
  return 0.1;
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
  if (symbol.startsWith('5') || symbol.startsWith('6')) {
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

function toTencentSecId(symbol: string): string {
  return `${exchangeForSymbol(symbol) === Exchange.SSE ? 'sh' : 'sz'}${symbol}`;
}

function toIndexSecId(indexCode: string): string {
  const compact = indexCode.split('.')[0];
  return `${indexCode.endsWith('.SZ') ? '0' : '1'}.${compact}`;
}

function toMarketSecId(code: string): string {
  const compact = compactMarketCode(code);
  if (code.endsWith('.SZ')) {
    return `0.${compact}`;
  }
  if (code.endsWith('.SH')) {
    return `1.${compact}`;
  }
  if (compact.startsWith('6') || compact.startsWith('5') || compact.startsWith('9')) {
    return `1.${compact}`;
  }
  return `0.${compact}`;
}

function toTencentMarketSecId(code: string): string {
  const compact = compactMarketCode(code);
  if (code.endsWith('.SH') || compact.startsWith('5') || compact.startsWith('6') || compact.startsWith('9')) {
    return `sh${compact}`;
  }
  return `sz${compact}`;
}

function compactMarketCode(code: string): string {
  return code.split('.')[0] ?? code;
}

function uniqueMarketSnapshotItems(items: readonly MarketSnapshotRequest[]): readonly MarketSnapshotRequest[] {
  const itemByCode = new Map<string, MarketSnapshotRequest>();
  for (const item of items) {
    if (!itemByCode.has(item.code)) {
      itemByCode.set(item.code, item);
    }
  }
  return [...itemByCode.values()];
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

function toOptionalNumber(value: number | string | undefined): number | undefined {
  if (value === undefined || value === '-' || value === '') {
    return undefined;
  }
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function roundPrice(value: number): number {
  return Math.round(value * 100) / 100;
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
