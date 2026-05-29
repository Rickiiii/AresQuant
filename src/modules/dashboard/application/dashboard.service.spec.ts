import { BacktestOrderSide, BacktestOrderStatus, BacktestOrderType, BacktestTaskStatus, Exchange } from '@prisma/client';
import { Decimal } from 'decimal.js';
import { DashboardService } from './dashboard.service';
import type {
  BacktestAccountSnapshotRepository,
  BacktestMetricRepository,
  BacktestOrderRepository,
  BacktestPositionRepository,
  BacktestTaskRepository,
  BacktestTradeRepository,
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
import type {
  AdjFactorRepository,
  FinancialFactorRepository,
  IndexDailyBarRepository,
  LimitPriceRepository,
  Phase2DailyBarRepository,
  StockRepository,
  SuspensionRepository,
  TradingCalendarRepository,
} from '../../data/domain/repositories/data-center.repositories';
import type { DataSyncHealthSummary } from '../../data/application/services/data-sync.service';
import { DataSyncService } from '../../data/application/services/data-sync.service';
import type { StockRawData } from '../../data/domain/types/market-data.types';
import { StrategyService } from '../../strategy/application/strategy.service';
import { EqualWeightStrategy } from '../../strategy/domain/strategies/equal-weight.strategy';

const backtestTask = createBacktestTask('task-1', BacktestTaskStatus.SUCCESS);

interface DashboardServiceFixture {
  readonly service: DashboardService;
  readonly taskRepository: Pick<BacktestTaskRepository, 'findAll' | 'findById'>;
}

function createService(): DashboardServiceFixture {
  const stockRepository: Pick<StockRepository, 'count' | 'findLatestDate' | 'findAll'> = {
    count: jest.fn().mockResolvedValue(5120),
    findLatestDate: jest.fn().mockResolvedValue('20260514'),
    findAll: jest.fn().mockResolvedValue(createStocks()),
  };
  const tradingCalendarRepository: Pick<TradingCalendarRepository, 'count' | 'findLatestDate'> = {
    count: jest.fn().mockResolvedValue(5200),
    findLatestDate: jest.fn().mockResolvedValue('20260514'),
  };
  const dailyBarRepository: Pick<Phase2DailyBarRepository, 'count' | 'findLatestDate'> = {
    count: jest.fn().mockResolvedValue(250000),
    findLatestDate: jest.fn().mockResolvedValue('20260514'),
  };
  const indexDailyBarRepository: Pick<IndexDailyBarRepository, 'count' | 'findLatestDate'> = {
    count: jest.fn().mockResolvedValue(3000),
    findLatestDate: jest.fn().mockResolvedValue('20260514'),
  };
  const limitPriceRepository: Pick<LimitPriceRepository, 'count' | 'findLatestDate'> = {
    count: jest.fn().mockResolvedValue(248000),
    findLatestDate: jest.fn().mockResolvedValue('20260514'),
  };
  const suspensionRepository: Pick<SuspensionRepository, 'count' | 'findLatestDate'> = {
    count: jest.fn().mockResolvedValue(1200),
    findLatestDate: jest.fn().mockResolvedValue('20260513'),
  };
  const adjFactorRepository: Pick<AdjFactorRepository, 'count' | 'findLatestDate'> = {
    count: jest.fn().mockResolvedValue(250000),
    findLatestDate: jest.fn().mockResolvedValue('20260514'),
  };
  const financialFactorRepository: Pick<FinancialFactorRepository, 'count' | 'findLatestDate'> = {
    count: jest.fn().mockResolvedValue(32000),
    findLatestDate: jest.fn().mockResolvedValue('20260510'),
  };
  const taskRepository: Pick<BacktestTaskRepository, 'findAll' | 'findById'> = {
    findAll: jest.fn().mockResolvedValue([
      backtestTask,
      createBacktestTask('task-2', BacktestTaskStatus.FAILED),
      createBacktestTask('task-3', BacktestTaskStatus.SUCCESS),
    ]),
    findById: jest.fn().mockResolvedValue(backtestTask),
  };
  const snapshotRepository: Pick<BacktestAccountSnapshotRepository, 'findByTaskId'> = {
    findByTaskId: jest.fn().mockResolvedValue(createSnapshots()),
  };
  const positionRepository: Pick<BacktestPositionRepository, 'findByTaskId'> = {
    findByTaskId: jest.fn().mockResolvedValue(createPositions()),
  };
  const orderRepository: Pick<BacktestOrderRepository, 'findByTaskId'> = {
    findByTaskId: jest.fn().mockResolvedValue(createOrders()),
  };
  const tradeRepository: Pick<BacktestTradeRepository, 'findByTaskId'> = {
    findByTaskId: jest.fn().mockResolvedValue(createTrades()),
  };
  const metricRepository: Pick<BacktestMetricRepository, 'findByTaskId'> = {
    findByTaskId: jest.fn().mockResolvedValue(createMetrics()),
  };
  const dataSyncService = {
    getSyncHealth: jest.fn().mockResolvedValue(createSyncHealth()),
  } as unknown as DataSyncService;

  return {
    taskRepository,
    service: new DashboardService(
      stockRepository,
      tradingCalendarRepository,
      dailyBarRepository,
      indexDailyBarRepository,
      limitPriceRepository,
      suspensionRepository,
      adjFactorRepository,
      financialFactorRepository,
      taskRepository,
      snapshotRepository,
      positionRepository,
      orderRepository,
      tradeRepository,
      metricRepository,
      new StrategyService([new EqualWeightStrategy()]),
      dataSyncService,
    ),
  };
}

describe('DashboardService', () => {
  it('builds dashboard overview from data, strategy, and backtest sources', async () => {
    const { service } = createService();

    const overview = await service.getOverview();

    expect(overview.dataCenter).toEqual({
      stockCount: 5120,
      dailyBarCount: 250000,
      latestDailyBarDate: '20260514',
      financialFactorCount: 32000,
      latestFinancialFactorDate: '20260510',
      syncHealth: createSyncHealth(),
    });
    expect(overview.strategies).toEqual({
      total: 1,
      codes: ['equal-weight'],
    });
    expect(overview.backtests.total).toBe(3);
    expect(overview.backtests.byStatus).toEqual({
      SUCCESS: 2,
      FAILED: 1,
      PENDING: 0,
      RUNNING: 0,
      CANCELED: 0,
    });
    expect(overview.backtests.latestTask).toEqual({
      id: 'task-1',
      name: 'task-1 name',
      strategyName: 'equal_weight_mock',
      status: BacktestTaskStatus.SUCCESS,
      startDate: '20260501',
      endDate: '20260514',
    });
  });

  it('builds dashboard data center summary from repository counts and latest dates', async () => {
    const { service } = createService();

    await expect(service.getDataCenterSummary()).resolves.toEqual({
      stocks: { dataSet: 'stocks', total: 5120, latestDate: '20260514' },
      tradingCalendar: { dataSet: 'tradingCalendar', total: 5200, latestDate: '20260514' },
      dailyBars: { dataSet: 'dailyBars', total: 250000, latestDate: '20260514' },
      indexDailyBars: { dataSet: 'indexDailyBars', total: 3000, latestDate: '20260514' },
      limitPrices: { dataSet: 'limitPrices', total: 248000, latestDate: '20260514' },
      suspensions: { dataSet: 'suspensions', total: 1200, latestDate: '20260513' },
      adjFactors: { dataSet: 'adjFactors', total: 250000, latestDate: '20260514' },
      financialFactors: { dataSet: 'financialFactors', total: 32000, latestDate: '20260510' },
    });
  });

  it('lists dashboard stocks with compact display fields', async () => {
    const { service } = createService();

    await expect(service.listStocks()).resolves.toEqual([
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
        listDate: '19991110',
        isActive: true,
        isST: false,
      },
    ]);
  });

  it('lists dashboard strategies with config schema', () => {
    const { service } = createService();

    expect(service.listStrategies()).toEqual([
      expect.objectContaining({
        code: 'equal-weight',
        name: 'Equal Weight Strategy',
        version: '1.0.0',
        configSchema: [
          expect.objectContaining({ name: 'maxPositions', type: 'number', required: true }),
        ],
      }),
    ]);
  });

  it('builds dashboard strategy detail with sample signals', async () => {
    const { service } = createService();

    await expect(service.getStrategyDetail('equal-weight')).resolves.toMatchObject({
      code: 'equal-weight',
      defaultConfig: { maxPositions: 3 },
      sampleSignals: [
        { securityId: '000001', targetWeight: 1 / 3, reason: 'equal-weight allocation' },
        { securityId: '600000', targetWeight: 1 / 3, reason: 'equal-weight allocation' },
        { securityId: '000333', targetWeight: 1 / 3, reason: 'equal-weight allocation' },
      ],
    });
    await expect(service.getStrategySampleSignals('missing')).resolves.toBeNull();
  });

  it('lists dashboard backtests with compact task information', async () => {
    const { service } = createService();

    await expect(service.listBacktests()).resolves.toEqual([
      {
        id: 'task-1',
        name: 'task-1 name',
        strategyName: 'equal_weight_mock',
        status: BacktestTaskStatus.SUCCESS,
        startDate: '20260501',
        endDate: '20260514',
        initialCapital: '1000000',
      },
      {
        id: 'task-2',
        name: 'task-2 name',
        strategyName: 'equal_weight_mock',
        status: BacktestTaskStatus.FAILED,
        startDate: '20260501',
        endDate: '20260514',
        initialCapital: '1000000',
      },
      {
        id: 'task-3',
        name: 'task-3 name',
        strategyName: 'equal_weight_mock',
        status: BacktestTaskStatus.SUCCESS,
        startDate: '20260501',
        endDate: '20260514',
        initialCapital: '1000000',
      },
    ]);
  });

  it('builds dashboard backtest summary from task, metrics, equity curve, positions, orders, and trades', async () => {
    const { service } = createService();

    await expect(service.getBacktestSummary('task-1')).resolves.toEqual({
      task: {
        id: 'task-1',
        name: 'task-1 name',
        strategyName: 'equal_weight_mock',
        status: BacktestTaskStatus.SUCCESS,
        startDate: '20260501',
        endDate: '20260514',
        initialCapital: '1000000',
      },
      metrics: {
        totalReturn: '0.12',
        annualizedReturn: '0.24',
        maxDrawdown: '0.05',
        sharpeRatio: '1.6',
        sortinoRatio: '2.1',
        calmarRatio: '4.8',
        winRate: '0.55',
        profitLossRatio: '1.3',
        volatility: '0.18',
        beta: null,
        alpha: '0.03',
        turnoverRate: '0.8',
        tradeCount: 1,
      },
      equityCurve: [
        {
          tradeDate: '20260513',
          cash: '500000',
          marketValue: '500000',
          totalAsset: '1000000',
          dailyReturn: '0',
          cumulativeReturn: '0',
          drawdown: '0',
        },
        {
          tradeDate: '20260514',
          cash: '480000',
          marketValue: '640000',
          totalAsset: '1120000',
          dailyReturn: '0.12',
          cumulativeReturn: '0.12',
          drawdown: '0',
        },
      ],
      positions: [
        {
          symbol: '000001',
          quantity: 1000,
          availableQuantity: 1000,
          avgCost: '10',
          lastPrice: '12',
          marketValue: '12000',
          unrealizedPnl: '2000',
          realizedPnl: '0',
          tradeDate: '20260514',
        },
      ],
      orders: {
        total: 1,
        filled: 1,
        rejected: 0,
      },
      trades: {
        total: 1,
        amount: '10000',
        totalFee: '8',
      },
    });
  });

  it('returns null when backtest summary task does not exist', async () => {
    const { service, taskRepository } = createService();
    jest.mocked(taskRepository.findById).mockResolvedValue(null);

    await expect(service.getBacktestSummary('missing')).resolves.toBeNull();
  });
});

function createBacktestTask(id: string, status: BacktestTaskStatus): BacktestTaskRecord {
  return {
    id,
    name: `${id} name`,
    strategyName: 'equal_weight_mock',
    status,
    startDate: '20260501',
    endDate: '20260514',
    initialCapital: new Decimal(1000000),
    config: {
      name: `${id} name`,
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

function createSyncHealth(): DataSyncHealthSummary {
  return {
    status: 'healthy',
    summary: '核心行情数据已同步，当前可用于工作台分析。',
    asOfDate: '20260514',
    staleDatasetCount: 0,
    emptyDatasetCount: 0,
    failedDatasetCount: 0,
    datasets: [],
  };
}

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
    {
      symbol: '600000',
      tsCode: '600000.SH',
      name: '浦发银行',
      exchange: Exchange.SSE,
      market: '主板',
      listDate: '19991110',
      isActive: true,
      isST: false,
    },
  ];
}

function createSnapshots(): readonly BacktestAccountSnapshotRecord[] {
  return [
    {
      taskId: 'task-1',
      tradeDate: '20260513',
      cash: new Decimal(500000),
      marketValue: new Decimal(500000),
      totalAsset: new Decimal(1000000),
      dailyReturn: new Decimal(0),
      cumulativeReturn: new Decimal(0),
      drawdown: new Decimal(0),
    },
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
      tradeDate: '20260514',
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
