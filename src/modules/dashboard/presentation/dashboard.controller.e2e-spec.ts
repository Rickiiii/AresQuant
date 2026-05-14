import { NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { BacktestOrderSide, BacktestOrderStatus, BacktestOrderType, BacktestTaskStatus, Exchange } from '@prisma/client';
import { Decimal } from 'decimal.js';
import {
  BACKTEST_METRIC_REPOSITORY,
  BACKTEST_ORDER_REPOSITORY,
  BACKTEST_POSITION_REPOSITORY,
  BACKTEST_SNAPSHOT_REPOSITORY,
  BACKTEST_TASK_REPOSITORY,
  BACKTEST_TRADE_REPOSITORY,
  type BacktestAccountSnapshotRepository,
  type BacktestMetricRepository,
  type BacktestOrderRepository,
  type BacktestPositionRepository,
  type BacktestTaskRepository,
  type BacktestTradeRepository,
} from '../../backtest/domain/repositories/backtest.repositories';
import {
  BacktestFrequency,
  BacktestPriceMode,
  type BacktestAccountSnapshotRecord,
  type BacktestMetrics,
  type BacktestOrderRecord,
  type BacktestPositionState,
  type BacktestTaskRecord,
  type BacktestTradeRecord,
} from '../../backtest/types/backtest.types';
import {
  ADJ_FACTOR_REPOSITORY,
  FINANCIAL_FACTOR_REPOSITORY,
  INDEX_DAILY_BAR_REPOSITORY,
  LIMIT_PRICE_REPOSITORY,
  PHASE2_DAILY_BAR_REPOSITORY,
  STOCK_REPOSITORY,
  SUSPENSION_REPOSITORY,
  TRADING_CALENDAR_REPOSITORY,
  type AdjFactorRepository,
  type FinancialFactorRepository,
  type IndexDailyBarRepository,
  type LimitPriceRepository,
  type Phase2DailyBarRepository,
  type StockRepository,
  type SuspensionRepository,
  type TradingCalendarRepository,
} from '../../data/domain/repositories/data-center.repositories';
import type { StockRawData } from '../../data/domain/types/market-data.types';
import { StrategyService } from '../../strategy/application/strategy.service';
import { EqualWeightStrategy } from '../../strategy/domain/strategies/equal-weight.strategy';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from '../application/dashboard.service';

async function createController(): Promise<DashboardController> {
  const moduleRef = await Test.createTestingModule({
    controllers: [DashboardController],
    providers: [
      DashboardService,
      {
        provide: STOCK_REPOSITORY,
        useValue: {
          count: jest.fn().mockResolvedValue(2),
          findLatestDate: jest.fn().mockResolvedValue('20260514'),
          findAll: jest.fn().mockResolvedValue(createStocks()),
        } satisfies Pick<StockRepository, 'count' | 'findLatestDate' | 'findAll'>,
      },
      {
        provide: TRADING_CALENDAR_REPOSITORY,
        useValue: { count: jest.fn().mockResolvedValue(20), findLatestDate: jest.fn().mockResolvedValue('20260514') } satisfies Pick<TradingCalendarRepository, 'count' | 'findLatestDate'>,
      },
      {
        provide: PHASE2_DAILY_BAR_REPOSITORY,
        useValue: { count: jest.fn().mockResolvedValue(20), findLatestDate: jest.fn().mockResolvedValue('20260514') } satisfies Pick<Phase2DailyBarRepository, 'count' | 'findLatestDate'>,
      },
      {
        provide: INDEX_DAILY_BAR_REPOSITORY,
        useValue: { count: jest.fn().mockResolvedValue(3), findLatestDate: jest.fn().mockResolvedValue('20260514') } satisfies Pick<IndexDailyBarRepository, 'count' | 'findLatestDate'>,
      },
      {
        provide: LIMIT_PRICE_REPOSITORY,
        useValue: { count: jest.fn().mockResolvedValue(19), findLatestDate: jest.fn().mockResolvedValue('20260514') } satisfies Pick<LimitPriceRepository, 'count' | 'findLatestDate'>,
      },
      {
        provide: SUSPENSION_REPOSITORY,
        useValue: { count: jest.fn().mockResolvedValue(1), findLatestDate: jest.fn().mockResolvedValue('20260513') } satisfies Pick<SuspensionRepository, 'count' | 'findLatestDate'>,
      },
      {
        provide: ADJ_FACTOR_REPOSITORY,
        useValue: { count: jest.fn().mockResolvedValue(20), findLatestDate: jest.fn().mockResolvedValue('20260514') } satisfies Pick<AdjFactorRepository, 'count' | 'findLatestDate'>,
      },
      {
        provide: FINANCIAL_FACTOR_REPOSITORY,
        useValue: { count: jest.fn().mockResolvedValue(8), findLatestDate: jest.fn().mockResolvedValue('20260510') } satisfies Pick<FinancialFactorRepository, 'count' | 'findLatestDate'>,
      },
      {
        provide: BACKTEST_TASK_REPOSITORY,
        useValue: {
          findAll: jest.fn().mockResolvedValue([createBacktestTask()]),
          findById: jest.fn().mockImplementation((id: string) => Promise.resolve(id === 'task-1' ? createBacktestTask() : null)),
        } satisfies Pick<BacktestTaskRepository, 'findAll' | 'findById'>,
      },
      {
        provide: BACKTEST_SNAPSHOT_REPOSITORY,
        useValue: { findByTaskId: jest.fn().mockResolvedValue(createSnapshots()) } satisfies Pick<BacktestAccountSnapshotRepository, 'findByTaskId'>,
      },
      {
        provide: BACKTEST_POSITION_REPOSITORY,
        useValue: { findByTaskId: jest.fn().mockResolvedValue(createPositions()) } satisfies Pick<BacktestPositionRepository, 'findByTaskId'>,
      },
      {
        provide: BACKTEST_ORDER_REPOSITORY,
        useValue: { findByTaskId: jest.fn().mockResolvedValue(createOrders()) } satisfies Pick<BacktestOrderRepository, 'findByTaskId'>,
      },
      {
        provide: BACKTEST_TRADE_REPOSITORY,
        useValue: { findByTaskId: jest.fn().mockResolvedValue(createTrades()) } satisfies Pick<BacktestTradeRepository, 'findByTaskId'>,
      },
      {
        provide: BACKTEST_METRIC_REPOSITORY,
        useValue: { findByTaskId: jest.fn().mockResolvedValue(createMetrics()) } satisfies Pick<BacktestMetricRepository, 'findByTaskId'>,
      },
      {
        provide: StrategyService,
        useValue: new StrategyService([new EqualWeightStrategy()]),
      },
    ],
  }).compile();

  return moduleRef.get(DashboardController);
}

describe('DashboardController', () => {
  it('returns dashboard overview response', async () => {
    const controller = await createController();

    const response = await controller.overview();

    expect(response.success).toBe(true);
    expect(typeof response.timestamp).toBe('string');
    expect(response.data.dataCenter).toEqual({
      stockCount: 2,
      dailyBarCount: 20,
      latestDailyBarDate: '20260514',
      financialFactorCount: 8,
      latestFinancialFactorDate: '20260510',
    });
  });

  it('returns dashboard data center summary response', async () => {
    const controller = await createController();

    const response = await controller.dataCenter();

    expect(response.success).toBe(true);
    expect(response.data.dailyBars).toEqual({ dataSet: 'dailyBars', total: 20, latestDate: '20260514' });
    expect(response.data.financialFactors).toEqual({ dataSet: 'financialFactors', total: 8, latestDate: '20260510' });
  });

  it('returns dashboard stock list response', async () => {
    const controller = await createController();

    const response = await controller.stocks();

    expect(response.success).toBe(true);
    expect(response.data).toEqual(createStocks());
  });

  it('returns data coverage convenience responses', async () => {
    const controller = await createController();

    await expect(controller.dailyBarCoverage()).resolves.toMatchObject({
      success: true,
      data: { dataSet: 'dailyBars', total: 20, latestDate: '20260514' },
    });
    await expect(controller.financialFactorCoverage()).resolves.toMatchObject({
      success: true,
      data: { dataSet: 'financialFactors', total: 8, latestDate: '20260510' },
    });
  });

  it('returns dashboard strategy responses', async () => {
    const controller = await createController();

    const listResponse = controller.strategies();
    expect(listResponse.success).toBe(true);
    expect(listResponse.data).toEqual([
      expect.objectContaining({ code: 'equal-weight', name: 'Equal Weight Strategy' }),
    ]);

    const detailResponse = await controller.strategy('equal-weight');
    expect(detailResponse.success).toBe(true);
    expect(detailResponse.data.defaultConfig).toEqual({ maxPositions: 3 });
    expect(detailResponse.data.sampleSignals).toHaveLength(3);

    const signalsResponse = await controller.strategySampleSignals('equal-weight');
    expect(signalsResponse.success).toBe(true);
    expect(signalsResponse.data[0]?.securityId).toBe('000001');
  });

  it('throws 404 when dashboard strategy does not exist', async () => {
    const controller = await createController();

    await expect(controller.strategy('missing')).rejects.toBeInstanceOf(NotFoundException);
    await expect(controller.strategySampleSignals('missing')).rejects.toBeInstanceOf(NotFoundException);
  });

  it('returns dashboard backtest list response', async () => {
    const controller = await createController();

    const response = await controller.backtests();

    expect(response.success).toBe(true);
    expect(response.data).toEqual([
      {
        id: 'task-1',
        name: 'Dashboard Backtest',
        strategyName: 'equal_weight_mock',
        status: BacktestTaskStatus.SUCCESS,
        startDate: '20260501',
        endDate: '20260514',
        initialCapital: '1000000',
      },
    ]);
  });

  it('returns dashboard backtest summary response', async () => {
    const controller = await createController();

    const response = await controller.backtestSummary('task-1');

    expect(response.success).toBe(true);
    expect(response.data.task.id).toBe('task-1');
    expect(response.data.metrics?.totalReturn).toBe('0.12');
    expect(response.data.equityCurve).toHaveLength(1);
    expect(response.data.positions).toHaveLength(1);
    expect(response.data.orders).toEqual({ total: 1, filled: 1, rejected: 0 });
    expect(response.data.trades).toEqual({ total: 1, amount: '10000', totalFee: '8' });
  });

  it('throws 404 when dashboard backtest summary task does not exist', async () => {
    const controller = await createController();

    await expect(controller.backtestSummary('missing')).rejects.toBeInstanceOf(NotFoundException);
  });
});

function createStocks(): readonly StockRawData[] {
  return [
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
  ];
}

function createBacktestTask(): BacktestTaskRecord {
  return {
    id: 'task-1',
    name: 'Dashboard Backtest',
    strategyName: 'equal_weight_mock',
    status: BacktestTaskStatus.SUCCESS,
    startDate: '20260501',
    endDate: '20260514',
    initialCapital: new Decimal(1000000),
    config: {
      name: 'Dashboard Backtest',
      strategyName: 'equal_weight_mock',
      startDate: '20260501',
      endDate: '20260514',
      initialCapital: new Decimal(1000000),
      frequency: BacktestFrequency.DAILY,
      rebalanceFrequency: 1,
      maxPositions: 2,
      maxPositionWeight: new Decimal(0.5),
      commissionRate: new Decimal(0.00025),
      minCommission: new Decimal(5),
      stampDutyRate: new Decimal(0.001),
      transferFeeRate: new Decimal(0.00001),
      slippageRate: new Decimal(0.0005),
      allowBuyLimitUp: false,
      allowSellLimitDown: false,
      enableT1Rule: true,
      priceMode: BacktestPriceMode.CLOSE,
      blacklist: [],
    },
  };
}

function createSnapshots(): readonly BacktestAccountSnapshotRecord[] {
  return [
    {
      taskId: 'task-1',
      tradeDate: '20260514',
      cash: new Decimal(480000),
      marketValue: new Decimal(640000),
      totalAsset: new Decimal(1120000),
      dailyReturn: new Decimal(0.12),
      cumulativeReturn: new Decimal(0.12),
      drawdown: new Decimal(0),
    },
  ];
}

function createPositions(): readonly BacktestPositionState[] {
  return [
    {
      symbol: '000001',
      quantity: 1000,
      availableQuantity: 1000,
      avgCost: new Decimal(10),
      lastPrice: new Decimal(12),
      marketValue: new Decimal(12000),
      unrealizedPnl: new Decimal(2000),
      realizedPnl: new Decimal(0),
    },
  ];
}

function createOrders(): readonly BacktestOrderRecord[] {
  return [
    {
      id: 'order-1',
      taskId: 'task-1',
      symbol: '000001',
      tradeDate: '20260513',
      side: BacktestOrderSide.BUY,
      orderType: BacktestOrderType.MARKET,
      price: new Decimal(10),
      quantity: 1000,
      filledQuantity: 1000,
      status: BacktestOrderStatus.FILLED,
      avgFilledPrice: new Decimal(10),
    },
  ];
}

function createTrades(): readonly BacktestTradeRecord[] {
  return [
    {
      id: 'trade-1',
      taskId: 'task-1',
      orderId: 'order-1',
      symbol: '000001',
      tradeDate: '20260513',
      side: BacktestOrderSide.BUY,
      price: new Decimal(10),
      quantity: 1000,
      amount: new Decimal(10000),
      commission: new Decimal(5),
      stampDuty: new Decimal(0),
      transferFee: new Decimal(3),
      totalFee: new Decimal(8),
    },
  ];
}

function createMetrics(): BacktestMetrics {
  return {
    totalReturn: new Decimal(0.12),
    annualizedReturn: new Decimal(0.24),
    maxDrawdown: new Decimal(0.05),
    sharpeRatio: new Decimal(1.6),
    sortinoRatio: new Decimal(2.1),
    calmarRatio: new Decimal(4.8),
    winRate: new Decimal(0.55),
    profitLossRatio: new Decimal(1.3),
    volatility: new Decimal(0.18),
    beta: null,
    alpha: new Decimal(0.03),
    turnoverRate: new Decimal(0.8),
    tradeCount: 1,
  };
}
