import { Injectable } from '@nestjs/common';
import { type Exchange, type Prisma } from '@prisma/client';
import { PrismaService } from '@/database/prisma.service';
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
import type {
  AdjFactorRepository,
  DataSyncLogCreateInput,
  DataSyncLogRepository,
  DataSyncLogUpdateInput,
  FinancialFactorRepository,
  IndexDailyBarRepository,
  LimitPriceRepository,
  Phase2DailyBarRepository,
  RepositoryDateRange,
  StockRepository,
  SuspensionRepository,
  TradingCalendarRepository,
} from '../../domain/repositories/data-center.repositories';

const DEFAULT_BATCH_SIZE = 1000;

abstract class PrismaRepositoryBase {
  constructor(protected readonly prisma: PrismaService) {}

  protected batchSize(): number {
    return Number(process.env.DATA_SYNC_BATCH_SIZE ?? DEFAULT_BATCH_SIZE);
  }

  protected chunks<T>(records: readonly T[]): readonly (readonly T[])[] {
    const size = this.batchSize();
    const result: (readonly T[])[] = [];
    for (let index = 0; index < records.length; index += size) {
      result.push(records.slice(index, index + size));
    }
    return result;
  }
}

@Injectable()
export class PrismaStockRepository extends PrismaRepositoryBase implements StockRepository {
  constructor(prisma: PrismaService) {
    super(prisma);
  }

  async upsertMany(records: readonly StockRawData[]): Promise<number> {
    let affected = 0;
    for (const chunk of this.chunks(records)) {
      affected += await this.prisma.$transaction(async (tx) => {
        let count = 0;
        for (const record of chunk) {
          await tx.stock.upsert({
            where: { symbol: record.symbol },
            update: stockInput(record),
            create: stockInput(record),
          });
          count += 1;
        }
        return count;
      });
    }
    return affected;
  }

  async findBySymbol(symbol: string): Promise<StockRawData | null> {
    const record = await this.prisma.stock.findUnique({ where: { symbol } });
    return record === null ? null : mapStock(record);
  }

  async findAll(): Promise<readonly StockRawData[]> {
    const records = await this.prisma.stock.findMany({ orderBy: { symbol: 'asc' } });
    return records.map(mapStock);
  }

  async findByDateRange(range: RepositoryDateRange): Promise<readonly StockRawData[]> {
    const records = await this.prisma.stock.findMany({
      where: { listDate: { gte: toDate(range.startDate), lte: toDate(range.endDate) } },
      orderBy: { symbol: 'asc' },
    });
    return records.map(mapStock);
  }

  async findLatestDate(): Promise<string | null> {
    const record = await this.prisma.stock.findFirst({ orderBy: { listDate: 'desc' } });
    return record === null ? null : toCompactDate(record.listDate);
  }

  async count(): Promise<number> {
    return this.prisma.stock.count();
  }

  async deleteByDateRange(range: RepositoryDateRange): Promise<number> {
    const result = await this.prisma.stock.deleteMany({
      where: { listDate: { gte: toDate(range.startDate), lte: toDate(range.endDate) } },
    });
    return result.count;
  }
}

@Injectable()
export class PrismaTradingCalendarRepository extends PrismaRepositoryBase implements TradingCalendarRepository {
  constructor(prisma: PrismaService) {
    super(prisma);
  }

  async upsertMany(records: readonly TradingCalendarRawData[]): Promise<number> {
    let affected = 0;
    for (const chunk of this.chunks(records)) {
      affected += await this.prisma.$transaction(async (tx) => {
        let count = 0;
        for (const record of chunk) {
          await tx.tradingCalendar.upsert({
            where: { exchange_tradeDate: { exchange: record.exchange, tradeDate: toDate(record.tradeDate) } },
            update: tradingCalendarInput(record),
            create: tradingCalendarInput(record),
          });
          count += 1;
        }
        return count;
      });
    }
    return affected;
  }

  async findByDateRange(range: RepositoryDateRange): Promise<readonly TradingCalendarRawData[]> {
    const records = await this.prisma.tradingCalendar.findMany({
      where: { tradeDate: { gte: toDate(range.startDate), lte: toDate(range.endDate) } },
      orderBy: { tradeDate: 'asc' },
    });
    return records.map(mapTradingCalendar);
  }

  async findLatestDate(): Promise<string | null> {
    const record = await this.prisma.tradingCalendar.findFirst({ orderBy: { tradeDate: 'desc' } });
    return record === null ? null : toCompactDate(record.tradeDate);
  }

  async count(): Promise<number> {
    return this.prisma.tradingCalendar.count();
  }

  async deleteByDateRange(range: RepositoryDateRange): Promise<number> {
    const result = await this.prisma.tradingCalendar.deleteMany({
      where: { tradeDate: { gte: toDate(range.startDate), lte: toDate(range.endDate) } },
    });
    return result.count;
  }
}

@Injectable()
export class PrismaPhase2DailyBarRepository extends PrismaRepositoryBase implements Phase2DailyBarRepository {
  constructor(prisma: PrismaService) {
    super(prisma);
  }

  async upsertMany(records: readonly DailyBarRawData[]): Promise<number> {
    let affected = 0;
    for (const chunk of this.chunks(records)) {
      affected += await this.prisma.$transaction(async (tx) => {
        let count = 0;
        for (const record of chunk) {
          await tx.dailyBar.upsert({
            where: { symbol_tradeDate: { symbol: record.symbol, tradeDate: toDate(record.tradeDate) } },
            update: dailyBarInput(record),
            create: dailyBarInput(record),
          });
          count += 1;
        }
        return count;
      });
    }
    return affected;
  }

  async findBySymbol(symbol: string): Promise<readonly DailyBarRawData[]> {
    return this.findByDateRange(symbol, { startDate: '19000101', endDate: '29991231' });
  }

  async findByDateRange(symbol: string, range: RepositoryDateRange): Promise<readonly DailyBarRawData[]> {
    const records = await this.prisma.dailyBar.findMany({
      where: { symbol, tradeDate: { gte: toDate(range.startDate), lte: toDate(range.endDate) } },
      orderBy: { tradeDate: 'asc' },
    });
    return records.map(mapDailyBar);
  }

  async findByTradeDate(tradeDate: string): Promise<readonly DailyBarRawData[]> {
    const records = await this.prisma.dailyBar.findMany({ where: { tradeDate: toDate(tradeDate) } });
    return records.map(mapDailyBar);
  }

  async findLatestDate(symbol?: string): Promise<string | null> {
    const record = await this.prisma.dailyBar.findFirst({
      where: symbol === undefined ? {} : { symbol },
      orderBy: { tradeDate: 'desc' },
    });
    return record === null ? null : toCompactDate(record.tradeDate);
  }

  async count(symbol?: string): Promise<number> {
    return this.prisma.dailyBar.count({ where: symbol === undefined ? {} : { symbol } });
  }

  async deleteByDateRange(symbol: string, range: RepositoryDateRange): Promise<number> {
    const result = await this.prisma.dailyBar.deleteMany({
      where: { symbol, tradeDate: { gte: toDate(range.startDate), lte: toDate(range.endDate) } },
    });
    return result.count;
  }
}

@Injectable()
export class PrismaIndexDailyBarRepository extends PrismaRepositoryBase implements IndexDailyBarRepository {
  constructor(prisma: PrismaService) {
    super(prisma);
  }

  async upsertMany(records: readonly IndexDailyBarRawData[]): Promise<number> {
    let affected = 0;
    for (const chunk of this.chunks(records)) {
      affected += await this.prisma.$transaction(async (tx) => {
        let count = 0;
        for (const record of chunk) {
          await tx.indexDailyBar.upsert({
            where: { indexCode_tradeDate: { indexCode: record.indexCode, tradeDate: toDate(record.tradeDate) } },
            update: indexDailyBarInput(record),
            create: indexDailyBarInput(record),
          });
          count += 1;
        }
        return count;
      });
    }
    return affected;
  }

  async findBySymbol(indexCode: string): Promise<readonly IndexDailyBarRawData[]> {
    return this.findByDateRange(indexCode, { startDate: '19000101', endDate: '29991231' });
  }

  async findByDateRange(indexCode: string, range: RepositoryDateRange): Promise<readonly IndexDailyBarRawData[]> {
    const records = await this.prisma.indexDailyBar.findMany({
      where: { indexCode, tradeDate: { gte: toDate(range.startDate), lte: toDate(range.endDate) } },
      orderBy: { tradeDate: 'asc' },
    });
    return records.map(mapIndexDailyBar);
  }

  async findLatestDate(indexCode?: string): Promise<string | null> {
    const record = await this.prisma.indexDailyBar.findFirst({
      where: indexCode === undefined ? {} : { indexCode },
      orderBy: { tradeDate: 'desc' },
    });
    return record === null ? null : toCompactDate(record.tradeDate);
  }

  async count(indexCode?: string): Promise<number> {
    return this.prisma.indexDailyBar.count({ where: indexCode === undefined ? {} : { indexCode } });
  }

  async deleteByDateRange(indexCode: string, range: RepositoryDateRange): Promise<number> {
    const result = await this.prisma.indexDailyBar.deleteMany({
      where: { indexCode, tradeDate: { gte: toDate(range.startDate), lte: toDate(range.endDate) } },
    });
    return result.count;
  }
}

@Injectable()
export class PrismaLimitPriceRepository extends PrismaRepositoryBase implements LimitPriceRepository {
  constructor(prisma: PrismaService) {
    super(prisma);
  }

  async upsertMany(records: readonly LimitPriceRawData[]): Promise<number> {
    let affected = 0;
    for (const chunk of this.chunks(records)) {
      affected += await this.prisma.$transaction(async (tx) => upsertSimple(chunk, (record) => tx.limitPrice.upsert({
        where: { symbol_tradeDate: { symbol: record.symbol, tradeDate: toDate(record.tradeDate) } },
        update: limitPriceInput(record),
        create: limitPriceInput(record),
      })));
    }
    return affected;
  }

  async findBySymbol(symbol: string): Promise<readonly LimitPriceRawData[]> {
    return this.findByDateRange(symbol, { startDate: '19000101', endDate: '29991231' });
  }

  async findByDateRange(symbol: string, range: RepositoryDateRange): Promise<readonly LimitPriceRawData[]> {
    const records = await this.prisma.limitPrice.findMany({
      where: { symbol, tradeDate: { gte: toDate(range.startDate), lte: toDate(range.endDate) } },
      orderBy: { tradeDate: 'asc' },
    });
    return records.map(mapLimitPrice);
  }

  async findByTradeDate(tradeDate: string): Promise<readonly LimitPriceRawData[]> {
    const records = await this.prisma.limitPrice.findMany({ where: { tradeDate: toDate(tradeDate) } });
    return records.map(mapLimitPrice);
  }

  async findLatestDate(symbol?: string): Promise<string | null> {
    const record = await this.prisma.limitPrice.findFirst({ where: symbol === undefined ? {} : { symbol }, orderBy: { tradeDate: 'desc' } });
    return record === null ? null : toCompactDate(record.tradeDate);
  }

  async count(symbol?: string): Promise<number> {
    return this.prisma.limitPrice.count({ where: symbol === undefined ? {} : { symbol } });
  }

  async deleteByDateRange(symbol: string, range: RepositoryDateRange): Promise<number> {
    const result = await this.prisma.limitPrice.deleteMany({ where: { symbol, tradeDate: { gte: toDate(range.startDate), lte: toDate(range.endDate) } } });
    return result.count;
  }
}

@Injectable()
export class PrismaSuspensionRepository extends PrismaRepositoryBase implements SuspensionRepository {
  constructor(prisma: PrismaService) {
    super(prisma);
  }

  async upsertMany(records: readonly SuspensionRawData[]): Promise<number> {
    let affected = 0;
    for (const chunk of this.chunks(records)) {
      affected += await this.prisma.$transaction(async (tx) => upsertSimple(chunk, (record) => tx.suspension.upsert({
        where: { symbol_tradeDate: { symbol: record.symbol, tradeDate: toDate(record.tradeDate) } },
        update: suspensionInput(record),
        create: suspensionInput(record),
      })));
    }
    return affected;
  }

  async findBySymbol(symbol: string): Promise<readonly SuspensionRawData[]> {
    return this.findByDateRange(symbol, { startDate: '19000101', endDate: '29991231' });
  }

  async findByDateRange(symbol: string, range: RepositoryDateRange): Promise<readonly SuspensionRawData[]> {
    const records = await this.prisma.suspension.findMany({ where: { symbol, tradeDate: { gte: toDate(range.startDate), lte: toDate(range.endDate) } }, orderBy: { tradeDate: 'asc' } });
    return records.map(mapSuspension);
  }

  async findByTradeDate(tradeDate: string): Promise<readonly SuspensionRawData[]> {
    const records = await this.prisma.suspension.findMany({ where: { tradeDate: toDate(tradeDate) } });
    return records.map(mapSuspension);
  }

  async findLatestDate(symbol?: string): Promise<string | null> {
    const record = await this.prisma.suspension.findFirst({ where: symbol === undefined ? {} : { symbol }, orderBy: { tradeDate: 'desc' } });
    return record === null ? null : toCompactDate(record.tradeDate);
  }

  async count(symbol?: string): Promise<number> {
    return this.prisma.suspension.count({ where: symbol === undefined ? {} : { symbol } });
  }

  async deleteByDateRange(symbol: string, range: RepositoryDateRange): Promise<number> {
    const result = await this.prisma.suspension.deleteMany({ where: { symbol, tradeDate: { gte: toDate(range.startDate), lte: toDate(range.endDate) } } });
    return result.count;
  }
}

@Injectable()
export class PrismaAdjFactorRepository extends PrismaRepositoryBase implements AdjFactorRepository {
  constructor(prisma: PrismaService) {
    super(prisma);
  }

  async upsertMany(records: readonly AdjFactorRawData[]): Promise<number> {
    let affected = 0;
    for (const chunk of this.chunks(records)) {
      affected += await this.prisma.$transaction(async (tx) => upsertSimple(chunk, (record) => tx.adjFactor.upsert({
        where: { symbol_tradeDate: { symbol: record.symbol, tradeDate: toDate(record.tradeDate) } },
        update: adjFactorInput(record),
        create: adjFactorInput(record),
      })));
    }
    return affected;
  }

  async findBySymbol(symbol: string): Promise<readonly AdjFactorRawData[]> {
    return this.findByDateRange(symbol, { startDate: '19000101', endDate: '29991231' });
  }

  async findByDateRange(symbol: string, range: RepositoryDateRange): Promise<readonly AdjFactorRawData[]> {
    const records = await this.prisma.adjFactor.findMany({ where: { symbol, tradeDate: { gte: toDate(range.startDate), lte: toDate(range.endDate) } }, orderBy: { tradeDate: 'asc' } });
    return records.map(mapAdjFactor);
  }

  async findLatestDate(symbol?: string): Promise<string | null> {
    const record = await this.prisma.adjFactor.findFirst({ where: symbol === undefined ? {} : { symbol }, orderBy: { tradeDate: 'desc' } });
    return record === null ? null : toCompactDate(record.tradeDate);
  }

  async count(symbol?: string): Promise<number> {
    return this.prisma.adjFactor.count({ where: symbol === undefined ? {} : { symbol } });
  }

  async deleteByDateRange(symbol: string, range: RepositoryDateRange): Promise<number> {
    const result = await this.prisma.adjFactor.deleteMany({ where: { symbol, tradeDate: { gte: toDate(range.startDate), lte: toDate(range.endDate) } } });
    return result.count;
  }
}

@Injectable()
export class PrismaFinancialFactorRepository extends PrismaRepositoryBase implements FinancialFactorRepository {
  constructor(prisma: PrismaService) {
    super(prisma);
  }

  async upsertMany(records: readonly FinancialFactorRawData[]): Promise<number> {
    let affected = 0;
    for (const chunk of this.chunks(records)) {
      affected += await this.prisma.$transaction(async (tx) => upsertSimple(chunk, (record) => tx.financialFactor.upsert({
        where: { symbol_reportDate: { symbol: record.symbol, reportDate: toDate(record.reportDate) } },
        update: financialFactorInput(record),
        create: financialFactorInput(record),
      })));
    }
    return affected;
  }

  async findBySymbol(symbol: string): Promise<readonly FinancialFactorRawData[]> {
    const records = await this.prisma.financialFactor.findMany({ where: { symbol }, orderBy: { reportDate: 'asc' } });
    return records.map(mapFinancialFactor);
  }

  async findByDateRange(symbol: string, range: RepositoryDateRange): Promise<readonly FinancialFactorRawData[]> {
    const records = await this.prisma.financialFactor.findMany({ where: { symbol, reportDate: { gte: toDate(range.startDate), lte: toDate(range.endDate) } }, orderBy: { reportDate: 'asc' } });
    return records.map(mapFinancialFactor);
  }

  async findLatestDate(symbol?: string): Promise<string | null> {
    const record = await this.prisma.financialFactor.findFirst({ where: symbol === undefined ? {} : { symbol }, orderBy: { reportDate: 'desc' } });
    return record === null ? null : toCompactDate(record.reportDate);
  }

  async count(symbol?: string): Promise<number> {
    return this.prisma.financialFactor.count({ where: symbol === undefined ? {} : { symbol } });
  }

  async deleteByDateRange(symbol: string, range: RepositoryDateRange): Promise<number> {
    const result = await this.prisma.financialFactor.deleteMany({ where: { symbol, reportDate: { gte: toDate(range.startDate), lte: toDate(range.endDate) } } });
    return result.count;
  }
}

@Injectable()
export class PrismaDataSyncLogRepository implements DataSyncLogRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(input: DataSyncLogCreateInput): Promise<string> {
    const record = await this.prisma.dataSyncLog.create({
      data: {
        taskName: input.taskName,
        dataType: input.dataType,
        status: input.status,
        totalCount: input.totalCount ?? 0,
        successCount: input.successCount ?? 0,
        failedCount: input.failedCount ?? 0,
        ...(input.startTime === undefined ? {} : { startTime: input.startTime }),
        ...(input.endTime === undefined ? {} : { endTime: input.endTime }),
        ...(input.errorMessage === undefined ? {} : { errorMessage: input.errorMessage }),
      },
    });
    return record.id;
  }

  async update(id: string, input: DataSyncLogUpdateInput): Promise<void> {
    await this.prisma.dataSyncLog.update({
      where: { id },
      data: {
        status: input.status,
        totalCount: input.totalCount,
        successCount: input.successCount,
        failedCount: input.failedCount,
        ...(input.endTime === undefined ? {} : { endTime: input.endTime }),
        ...(input.errorMessage === undefined ? {} : { errorMessage: input.errorMessage }),
      },
    });
  }
}

async function upsertSimple<T>(records: readonly T[], upsert: (record: T) => Promise<unknown>): Promise<number> {
  let count = 0;
  for (const record of records) {
    await upsert(record);
    count += 1;
  }
  return count;
}

function stockInput(record: StockRawData): Prisma.StockUncheckedCreateInput {
  return {
    symbol: record.symbol,
    tsCode: record.tsCode,
    name: record.name,
    exchange: record.exchange,
    market: record.market,
    industry: record.industry ?? null,
    area: record.area ?? null,
    listDate: toDate(record.listDate),
    delistDate: record.delistDate === undefined ? null : toDate(record.delistDate),
    isActive: record.isActive,
    isST: record.isST,
  };
}

function tradingCalendarInput(record: TradingCalendarRawData): Prisma.TradingCalendarUncheckedCreateInput {
  return {
    exchange: record.exchange,
    tradeDate: toDate(record.tradeDate),
    isOpen: record.isOpen,
    preTradeDate: record.preTradeDate === undefined ? null : toDate(record.preTradeDate),
    prevDate: record.preTradeDate === undefined ? null : toDate(record.preTradeDate),
  };
}

function dailyBarInput(record: DailyBarRawData): Prisma.DailyBarUncheckedCreateInput {
  return {
    symbol: record.symbol,
    tsCode: record.tsCode,
    tradeDate: toDate(record.tradeDate),
    open: record.open,
    high: record.high,
    low: record.low,
    close: record.close,
    previousClose: record.preClose,
    preClose: record.preClose,
    change: record.change,
    pctChange: record.pctChange,
    volume: record.volume,
    amount: record.amount,
    source: 'mock',
  };
}

function indexDailyBarInput(record: IndexDailyBarRawData): Prisma.IndexDailyBarUncheckedCreateInput {
  return { ...record, tradeDate: toDate(record.tradeDate) };
}

function limitPriceInput(record: LimitPriceRawData): Prisma.LimitPriceUncheckedCreateInput {
  return { ...record, tradeDate: toDate(record.tradeDate) };
}

function suspensionInput(record: SuspensionRawData): Prisma.SuspensionUncheckedCreateInput {
  return {
    symbol: record.symbol,
    tradeDate: toDate(record.tradeDate),
    suspendType: record.suspendType,
    reason: record.reason ?? null,
  };
}

function adjFactorInput(record: AdjFactorRawData): Prisma.AdjFactorUncheckedCreateInput {
  return { ...record, tradeDate: toDate(record.tradeDate) };
}

function financialFactorInput(record: FinancialFactorRawData): Prisma.FinancialFactorUncheckedCreateInput {
  return {
    ...record,
    reportDate: toDate(record.reportDate),
    annDate: toDate(record.annDate),
  };
}

function mapStock(record: { symbol: string; tsCode: string; name: string; exchange: Exchange; market: string; industry: string | null; area: string | null; listDate: Date; delistDate: Date | null; isActive: boolean; isST: boolean }): StockRawData {
  return {
    symbol: record.symbol,
    tsCode: record.tsCode,
    name: record.name,
    exchange: record.exchange,
    market: record.market,
    ...(record.industry === null ? {} : { industry: record.industry }),
    ...(record.area === null ? {} : { area: record.area }),
    listDate: toCompactDate(record.listDate),
    ...(record.delistDate === null ? {} : { delistDate: toCompactDate(record.delistDate) }),
    isActive: record.isActive,
    isST: record.isST,
  };
}

function mapTradingCalendar(record: { exchange: Exchange; tradeDate: Date; isOpen: boolean; preTradeDate: Date | null; prevDate: Date | null }): TradingCalendarRawData {
  const previous = record.preTradeDate ?? record.prevDate;
  return {
    exchange: record.exchange,
    tradeDate: toCompactDate(record.tradeDate),
    isOpen: record.isOpen,
    ...(previous === null ? {} : { preTradeDate: toCompactDate(previous) }),
  };
}

function mapDailyBar(record: { symbol: string | null; tsCode: string | null; tradeDate: Date; open: Prisma.Decimal; high: Prisma.Decimal; low: Prisma.Decimal; close: Prisma.Decimal; previousClose: Prisma.Decimal; preClose: Prisma.Decimal | null; change: Prisma.Decimal; pctChange: Prisma.Decimal; volume: Prisma.Decimal; amount: Prisma.Decimal }): DailyBarRawData {
  return {
    symbol: record.symbol ?? '',
    tsCode: record.tsCode ?? '',
    tradeDate: toCompactDate(record.tradeDate),
    open: decimalToNumber(record.open),
    high: decimalToNumber(record.high),
    low: decimalToNumber(record.low),
    close: decimalToNumber(record.close),
    preClose: decimalToNumber(record.preClose ?? record.previousClose),
    change: decimalToNumber(record.change),
    pctChange: decimalToNumber(record.pctChange),
    volume: decimalToNumber(record.volume),
    amount: decimalToNumber(record.amount),
  };
}

function mapIndexDailyBar(record: { indexCode: string; tradeDate: Date; open: Prisma.Decimal; high: Prisma.Decimal; low: Prisma.Decimal; close: Prisma.Decimal; preClose: Prisma.Decimal; change: Prisma.Decimal; pctChange: Prisma.Decimal; volume: Prisma.Decimal; amount: Prisma.Decimal }): IndexDailyBarRawData {
  return { indexCode: record.indexCode, tradeDate: toCompactDate(record.tradeDate), open: decimalToNumber(record.open), high: decimalToNumber(record.high), low: decimalToNumber(record.low), close: decimalToNumber(record.close), preClose: decimalToNumber(record.preClose), change: decimalToNumber(record.change), pctChange: decimalToNumber(record.pctChange), volume: decimalToNumber(record.volume), amount: decimalToNumber(record.amount) };
}

function mapLimitPrice(record: { symbol: string; tradeDate: Date; upLimit: Prisma.Decimal; downLimit: Prisma.Decimal }): LimitPriceRawData {
  return { symbol: record.symbol, tradeDate: toCompactDate(record.tradeDate), upLimit: decimalToNumber(record.upLimit), downLimit: decimalToNumber(record.downLimit) };
}

function mapSuspension(record: { symbol: string; tradeDate: Date; suspendType: string; reason: string | null }): SuspensionRawData {
  return { symbol: record.symbol, tradeDate: toCompactDate(record.tradeDate), suspendType: record.suspendType, ...(record.reason === null ? {} : { reason: record.reason }) };
}

function mapAdjFactor(record: { symbol: string; tradeDate: Date; factor: Prisma.Decimal }): AdjFactorRawData {
  return { symbol: record.symbol, tradeDate: toCompactDate(record.tradeDate), factor: decimalToNumber(record.factor) };
}

function mapFinancialFactor(record: { symbol: string; reportDate: Date; annDate: Date; pe: Prisma.Decimal | null; pb: Prisma.Decimal | null; ps: Prisma.Decimal | null; roe: Prisma.Decimal | null; roa: Prisma.Decimal | null; grossMargin: Prisma.Decimal | null; netProfitMargin: Prisma.Decimal | null; debtToAsset: Prisma.Decimal | null; revenueGrowth: Prisma.Decimal | null; profitGrowth: Prisma.Decimal | null }): FinancialFactorRawData {
  return {
    symbol: record.symbol,
    reportDate: toCompactDate(record.reportDate),
    annDate: toCompactDate(record.annDate),
    ...(record.pe === null ? {} : { pe: decimalToNumber(record.pe) }),
    ...(record.pb === null ? {} : { pb: decimalToNumber(record.pb) }),
    ...(record.ps === null ? {} : { ps: decimalToNumber(record.ps) }),
    ...(record.roe === null ? {} : { roe: decimalToNumber(record.roe) }),
    ...(record.roa === null ? {} : { roa: decimalToNumber(record.roa) }),
    ...(record.grossMargin === null ? {} : { grossMargin: decimalToNumber(record.grossMargin) }),
    ...(record.netProfitMargin === null ? {} : { netProfitMargin: decimalToNumber(record.netProfitMargin) }),
    ...(record.debtToAsset === null ? {} : { debtToAsset: decimalToNumber(record.debtToAsset) }),
    ...(record.revenueGrowth === null ? {} : { revenueGrowth: decimalToNumber(record.revenueGrowth) }),
    ...(record.profitGrowth === null ? {} : { profitGrowth: decimalToNumber(record.profitGrowth) }),
  };
}

function toDate(value: string): Date {
  const normalized = value.includes('-') ? value.replaceAll('-', '') : value;
  return new Date(Date.UTC(Number(normalized.slice(0, 4)), Number(normalized.slice(4, 6)) - 1, Number(normalized.slice(6, 8))));
}

function toCompactDate(value: Date): string {
  return `${value.getUTCFullYear().toString().padStart(4, '0')}${(value.getUTCMonth() + 1).toString().padStart(2, '0')}${value.getUTCDate().toString().padStart(2, '0')}`;
}

function decimalToNumber(value: Prisma.Decimal): number {
  return Number(value.toString());
}
