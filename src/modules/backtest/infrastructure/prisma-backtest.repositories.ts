import { Injectable } from '@nestjs/common';
import { BacktestOrderStatus, BacktestTaskStatus, type Prisma } from '@prisma/client';
import { Decimal } from 'decimal.js';
import { PrismaService } from '@/database/prisma.service';
import type {
  BacktestAccountSnapshotRecord,
  BacktestConfig,
  BacktestMetrics,
  BacktestOrderRecord,
  BacktestPositionState,
  BacktestTaskRecord,
  BacktestTradeRecord,
} from '../types/backtest.types';
import {
  type BacktestAccountSnapshotRepository,
  type BacktestMetricRepository,
  type BacktestOrderRepository,
  type BacktestPositionRepository,
  type BacktestTaskCreateInput,
  type BacktestTaskRepository,
  type BacktestTaskUpdateInput,
  type BacktestTradeRepository,
} from '../domain/repositories/backtest.repositories';

@Injectable()
export class PrismaBacktestTaskRepository implements BacktestTaskRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(input: BacktestTaskCreateInput): Promise<BacktestTaskRecord> {
    const config = serializeConfig(input.config);
    const record = await this.prisma.backtestTask.create({
      data: {
        name: input.config.name,
        strategyName: input.config.strategyName,
        status: BacktestTaskStatus.RUNNING,
        startDate: toDate(input.config.startDate),
        endDate: toDate(input.config.endDate),
        initialCapital: input.config.initialCapital.toString(),
        ...(input.config.benchmark === undefined ? {} : { benchmark: input.config.benchmark }),
        config,
        startedAt: new Date(),
      },
    });
    return mapTask(record);
  }

  async update(id: string, input: BacktestTaskUpdateInput): Promise<BacktestTaskRecord> {
    const record = await this.prisma.backtestTask.update({
      where: { id },
      data: {
        ...(input.status === undefined ? {} : { status: input.status }),
        ...(input.errorMessage === undefined ? {} : { errorMessage: input.errorMessage }),
        ...(input.startedAt === undefined ? {} : { startedAt: input.startedAt }),
        ...(input.finishedAt === undefined ? {} : { finishedAt: input.finishedAt }),
      },
    });
    return mapTask(record);
  }

  async findById(id: string): Promise<BacktestTaskRecord | null> {
    const record = await this.prisma.backtestTask.findUnique({ where: { id } });
    return record === null ? null : mapTask(record);
  }

  async findAll(): Promise<readonly BacktestTaskRecord[]> {
    const records = await this.prisma.backtestTask.findMany({ orderBy: { createdAt: 'desc' } });
    return records.map(mapTask);
  }

  async deleteByTaskId(taskId: string): Promise<void> {
    await this.prisma.backtestTask.delete({ where: { id: taskId } });
  }
}

@Injectable()
export class PrismaBacktestAccountSnapshotRepository implements BacktestAccountSnapshotRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(record: BacktestAccountSnapshotRecord): Promise<void> {
    await this.createMany([record]);
  }

  async createMany(records: readonly BacktestAccountSnapshotRecord[]): Promise<number> {
    const result = await this.prisma.backtestAccountSnapshot.createMany({
      data: records.map((record) => ({
        taskId: record.taskId,
        tradeDate: toDate(record.tradeDate),
        cash: record.cash.toString(),
        marketValue: record.marketValue.toString(),
        totalAsset: record.totalAsset.toString(),
        dailyReturn: record.dailyReturn.toString(),
        cumulativeReturn: record.cumulativeReturn.toString(),
        drawdown: record.drawdown.toString(),
      })),
      skipDuplicates: true,
    });
    return result.count;
  }

  async findByTaskId(taskId: string): Promise<readonly BacktestAccountSnapshotRecord[]> {
    const records = await this.prisma.backtestAccountSnapshot.findMany({ where: { taskId }, orderBy: { tradeDate: 'asc' } });
    return records.map((record) => ({
      taskId: record.taskId,
      tradeDate: toCompactDate(record.tradeDate),
      cash: toDecimal(record.cash),
      marketValue: toDecimal(record.marketValue),
      totalAsset: toDecimal(record.totalAsset),
      dailyReturn: toDecimal(record.dailyReturn),
      cumulativeReturn: toDecimal(record.cumulativeReturn),
      drawdown: toDecimal(record.drawdown),
    }));
  }

  async deleteByTaskId(taskId: string): Promise<number> {
    return (await this.prisma.backtestAccountSnapshot.deleteMany({ where: { taskId } })).count;
  }
}

@Injectable()
export class PrismaBacktestPositionRepository implements BacktestPositionRepository {
  constructor(private readonly prisma: PrismaService) {}

  async createMany(taskId: string, tradeDate: string, records: readonly BacktestPositionState[]): Promise<number> {
    const result = await this.prisma.backtestPosition.createMany({
      data: records.map((record) => ({
        taskId,
        symbol: record.symbol,
        tradeDate: toDate(tradeDate),
        quantity: record.quantity,
        availableQuantity: record.availableQuantity,
        avgCost: record.avgCost.toString(),
        lastPrice: record.lastPrice.toString(),
        marketValue: record.marketValue.toString(),
        unrealizedPnl: record.unrealizedPnl.toString(),
        realizedPnl: record.realizedPnl.toString(),
      })),
    });
    return result.count;
  }

  async findByTaskId(taskId: string): Promise<readonly BacktestPositionState[]> {
    const records = await this.prisma.backtestPosition.findMany({ where: { taskId }, orderBy: { tradeDate: 'asc' } });
    return records.map((record) => ({
      symbol: record.symbol,
      quantity: record.quantity,
      availableQuantity: record.availableQuantity,
      avgCost: toDecimal(record.avgCost),
      lastPrice: toDecimal(record.lastPrice),
      marketValue: toDecimal(record.marketValue),
      unrealizedPnl: toDecimal(record.unrealizedPnl),
      realizedPnl: toDecimal(record.realizedPnl),
    }));
  }

  async deleteByTaskId(taskId: string): Promise<number> {
    return (await this.prisma.backtestPosition.deleteMany({ where: { taskId } })).count;
  }
}

@Injectable()
export class PrismaBacktestOrderRepository implements BacktestOrderRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(record: Omit<BacktestOrderRecord, 'id'>): Promise<BacktestOrderRecord> {
    const created = await this.prisma.backtestOrder.create({
      data: {
        taskId: record.taskId,
        symbol: record.symbol,
        tradeDate: toDate(record.tradeDate),
        side: record.side,
        orderType: record.orderType,
        price: record.price.toString(),
        quantity: record.quantity,
        filledQuantity: record.filledQuantity,
        status: record.status,
        ...(record.avgFilledPrice === undefined ? {} : { avgFilledPrice: record.avgFilledPrice.toString() }),
        ...(record.reason === undefined ? {} : { reason: record.reason }),
      },
    });
    return mapOrder(created);
  }

  async update(id: string, input: { readonly status: BacktestOrderStatus; readonly filledQuantity: number; readonly avgFilledPrice?: string; readonly reason?: string }): Promise<BacktestOrderRecord> {
    const updated = await this.prisma.backtestOrder.update({
      where: { id },
      data: {
        status: input.status,
        filledQuantity: input.filledQuantity,
        ...(input.avgFilledPrice === undefined ? {} : { avgFilledPrice: input.avgFilledPrice }),
        ...(input.reason === undefined ? {} : { reason: input.reason }),
      },
    });
    return mapOrder(updated);
  }

  async findById(id: string): Promise<BacktestOrderRecord | null> {
    const record = await this.prisma.backtestOrder.findUnique({ where: { id } });
    return record === null ? null : mapOrder(record);
  }

  async findByTaskId(taskId: string): Promise<readonly BacktestOrderRecord[]> {
    const records = await this.prisma.backtestOrder.findMany({ where: { taskId }, orderBy: { createdAt: 'asc' } });
    return records.map(mapOrder);
  }

  async deleteByTaskId(taskId: string): Promise<number> {
    return (await this.prisma.backtestOrder.deleteMany({ where: { taskId } })).count;
  }
}

@Injectable()
export class PrismaBacktestTradeRepository implements BacktestTradeRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(record: BacktestTradeRecord): Promise<BacktestTradeRecord> {
    const created = await this.prisma.backtestTrade.create({ data: tradeInput(record) });
    return mapTrade(created);
  }

  async createMany(records: readonly BacktestTradeRecord[]): Promise<number> {
    const result = await this.prisma.backtestTrade.createMany({ data: records.map(tradeInput) });
    return result.count;
  }

  async findByTaskId(taskId: string): Promise<readonly BacktestTradeRecord[]> {
    const records = await this.prisma.backtestTrade.findMany({ where: { taskId }, orderBy: { createdAt: 'asc' } });
    return records.map(mapTrade);
  }

  async deleteByTaskId(taskId: string): Promise<number> {
    return (await this.prisma.backtestTrade.deleteMany({ where: { taskId } })).count;
  }
}

@Injectable()
export class PrismaBacktestMetricRepository implements BacktestMetricRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(taskId: string, metrics: BacktestMetrics): Promise<void> {
    await this.prisma.backtestMetric.upsert({
      where: { taskId },
      update: metricInput(metrics),
      create: { taskId, ...metricInput(metrics) },
    });
  }

  async findByTaskId(taskId: string): Promise<BacktestMetrics | null> {
    const record = await this.prisma.backtestMetric.findUnique({ where: { taskId } });
    return record === null ? null : {
      totalReturn: toDecimal(record.totalReturn),
      annualizedReturn: toDecimal(record.annualizedReturn),
      maxDrawdown: toDecimal(record.maxDrawdown),
      sharpeRatio: toDecimal(record.sharpeRatio),
      sortinoRatio: toDecimal(record.sortinoRatio),
      calmarRatio: toDecimal(record.calmarRatio),
      winRate: toDecimal(record.winRate),
      profitLossRatio: toDecimal(record.profitLossRatio),
      volatility: toDecimal(record.volatility),
      beta: record.beta === null ? null : toDecimal(record.beta),
      alpha: record.alpha === null ? null : toDecimal(record.alpha),
      turnoverRate: toDecimal(record.turnoverRate),
      tradeCount: record.tradeCount,
    };
  }

  async deleteByTaskId(taskId: string): Promise<number> {
    return (await this.prisma.backtestMetric.deleteMany({ where: { taskId } })).count;
  }
}

function serializeConfig(config: BacktestConfig): Prisma.InputJsonObject {
  return {
    ...config,
    initialCapital: config.initialCapital.toString(),
    maxPositionWeight: config.maxPositionWeight.toString(),
    commissionRate: config.commissionRate.toString(),
    minCommission: config.minCommission.toString(),
    stampDutyRate: config.stampDutyRate.toString(),
    transferFeeRate: config.transferFeeRate.toString(),
    slippageRate: config.slippageRate.toString(),
    blacklist: [...config.blacklist],
  };
}

function mapTask(record: { id: string; name: string; strategyName: string; status: BacktestTaskStatus; startDate: Date; endDate: Date; initialCapital: Prisma.Decimal; benchmark: string | null; config: Prisma.JsonValue; errorMessage: string | null }): BacktestTaskRecord {
  const rawConfig = record.config as Record<string, unknown>;
  return {
    id: record.id,
    name: record.name,
    strategyName: record.strategyName,
    status: record.status,
    startDate: toCompactDate(record.startDate),
    endDate: toCompactDate(record.endDate),
    initialCapital: toDecimal(record.initialCapital),
    ...(record.benchmark === null ? {} : { benchmark: record.benchmark }),
    config: deserializeConfig(rawConfig),
    ...(record.errorMessage === null ? {} : { errorMessage: record.errorMessage }),
  };
}

function deserializeConfig(raw: Record<string, unknown>): BacktestConfig {
  return {
    name: String(raw.name),
    strategyName: String(raw.strategyName),
    startDate: String(raw.startDate),
    endDate: String(raw.endDate),
    initialCapital: new Decimal(String(raw.initialCapital)),
    frequency: raw.frequency as BacktestConfig['frequency'],
    rebalanceFrequency: Number(raw.rebalanceFrequency),
    maxPositions: Number(raw.maxPositions),
    maxPositionWeight: new Decimal(String(raw.maxPositionWeight)),
    commissionRate: new Decimal(String(raw.commissionRate)),
    minCommission: new Decimal(String(raw.minCommission)),
    stampDutyRate: new Decimal(String(raw.stampDutyRate)),
    transferFeeRate: new Decimal(String(raw.transferFeeRate)),
    slippageRate: new Decimal(String(raw.slippageRate)),
    allowBuyLimitUp: Boolean(raw.allowBuyLimitUp),
    allowSellLimitDown: Boolean(raw.allowSellLimitDown),
    enableT1Rule: Boolean(raw.enableT1Rule),
    priceMode: raw.priceMode as BacktestConfig['priceMode'],
    blacklist: Array.isArray(raw.blacklist) ? raw.blacklist.map(String) : [],
    ...(typeof raw.benchmark === 'string' ? { benchmark: raw.benchmark } : {}),
  };
}

function mapOrder(record: { id: string; taskId: string; symbol: string; tradeDate: Date; side: BacktestOrderRecord['side']; orderType: BacktestOrderRecord['orderType']; price: Prisma.Decimal; quantity: number; filledQuantity: number; avgFilledPrice: Prisma.Decimal | null; status: BacktestOrderStatus; reason: string | null }): BacktestOrderRecord {
  return {
    id: record.id,
    taskId: record.taskId,
    symbol: record.symbol,
    tradeDate: toCompactDate(record.tradeDate),
    side: record.side,
    orderType: record.orderType,
    price: toDecimal(record.price),
    quantity: record.quantity,
    filledQuantity: record.filledQuantity,
    ...(record.avgFilledPrice === null ? {} : { avgFilledPrice: toDecimal(record.avgFilledPrice) }),
    status: record.status,
    ...(record.reason === null ? {} : { reason: record.reason }),
  };
}

function tradeInput(record: BacktestTradeRecord): Prisma.BacktestTradeUncheckedCreateInput {
  return {
    taskId: record.taskId,
    orderId: record.orderId,
    symbol: record.symbol,
    tradeDate: toDate(record.tradeDate),
    side: record.side,
    price: record.price.toString(),
    quantity: record.quantity,
    amount: record.amount.toString(),
    commission: record.commission.toString(),
    stampDuty: record.stampDuty.toString(),
    transferFee: record.transferFee.toString(),
    totalFee: record.totalFee.toString(),
  };
}

function mapTrade(record: { id: string; taskId: string; orderId: string; symbol: string; tradeDate: Date; side: BacktestTradeRecord['side']; price: Prisma.Decimal; quantity: number; amount: Prisma.Decimal; commission: Prisma.Decimal; stampDuty: Prisma.Decimal; transferFee: Prisma.Decimal; totalFee: Prisma.Decimal }): BacktestTradeRecord {
  return {
    id: record.id,
    taskId: record.taskId,
    orderId: record.orderId,
    symbol: record.symbol,
    tradeDate: toCompactDate(record.tradeDate),
    side: record.side,
    price: toDecimal(record.price),
    quantity: record.quantity,
    amount: toDecimal(record.amount),
    commission: toDecimal(record.commission),
    stampDuty: toDecimal(record.stampDuty),
    transferFee: toDecimal(record.transferFee),
    totalFee: toDecimal(record.totalFee),
  };
}

function metricInput(metrics: BacktestMetrics): Omit<Prisma.BacktestMetricUncheckedCreateInput, 'taskId'> {
  return {
    totalReturn: metrics.totalReturn.toString(),
    annualizedReturn: metrics.annualizedReturn.toString(),
    maxDrawdown: metrics.maxDrawdown.toString(),
    sharpeRatio: metrics.sharpeRatio.toString(),
    sortinoRatio: metrics.sortinoRatio.toString(),
    calmarRatio: metrics.calmarRatio.toString(),
    winRate: metrics.winRate.toString(),
    profitLossRatio: metrics.profitLossRatio.toString(),
    volatility: metrics.volatility.toString(),
    beta: metrics.beta?.toString() ?? null,
    alpha: metrics.alpha?.toString() ?? null,
    turnoverRate: metrics.turnoverRate.toString(),
    tradeCount: metrics.tradeCount,
  };
}

function toDate(value: string): Date {
  const normalized = value.includes('-') ? value.replaceAll('-', '') : value;
  return new Date(Date.UTC(Number(normalized.slice(0, 4)), Number(normalized.slice(4, 6)) - 1, Number(normalized.slice(6, 8))));
}

function toCompactDate(value: Date): string {
  return `${value.getUTCFullYear().toString().padStart(4, '0')}${(value.getUTCMonth() + 1).toString().padStart(2, '0')}${value.getUTCDate().toString().padStart(2, '0')}`;
}

function toDecimal(value: Prisma.Decimal): Decimal {
  return new Decimal(value.toString());
}
