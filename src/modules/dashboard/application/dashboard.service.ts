import { Inject, Injectable } from '@nestjs/common';
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
import type {
  BacktestAccountSnapshotRecord,
  BacktestMetrics,
  BacktestOrderRecord,
  BacktestPositionState,
  BacktestTaskRecord,
  BacktestTradeRecord,
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
import { DataSyncService } from '../../data/application/services/data-sync.service';
import { StrategyService } from '../../strategy/application/strategy.service';
import type { Strategy, StrategyConfig, StrategyContext } from '../../strategy/domain/strategy.types';
import type {
  DashboardBacktestListItemDto,
  DashboardBacktestMetricsDto,
  DashboardBacktestSummaryDto,
  DashboardEquityPointDto,
  DashboardOrderStatsDto,
  DashboardPositionDto,
  DashboardTradeStatsDto,
} from '../presentation/dto/dashboard-backtest.dto';
import { isFilledOrderStatus, isRejectedOrderStatus } from '../presentation/dto/dashboard-backtest.dto';
import type { DashboardDataCenterSummaryDto, DashboardDataSetCoverageDto, DashboardStockItemDto } from '../presentation/dto/dashboard-data-center.dto';
import type {
  DashboardBacktestStatusDto,
  DashboardLatestBacktestTaskDto,
  DashboardOverviewDto,
} from '../presentation/dto/dashboard-overview.dto';
import type {
  DashboardStrategyConfigFieldDto,
  DashboardStrategyDetailDto,
  DashboardStrategyListItemDto,
  DashboardStrategySignalSampleDto,
} from '../presentation/dto/dashboard-strategy.dto';

@Injectable()
export class DashboardService {
  constructor(
    @Inject(STOCK_REPOSITORY) private readonly stockRepository: Pick<StockRepository, 'count' | 'findLatestDate' | 'findAll'>,
    @Inject(TRADING_CALENDAR_REPOSITORY) private readonly tradingCalendarRepository: Pick<TradingCalendarRepository, 'count' | 'findLatestDate'>,
    @Inject(PHASE2_DAILY_BAR_REPOSITORY) private readonly dailyBarRepository: Pick<Phase2DailyBarRepository, 'count' | 'findLatestDate'>,
    @Inject(INDEX_DAILY_BAR_REPOSITORY) private readonly indexDailyBarRepository: Pick<IndexDailyBarRepository, 'count' | 'findLatestDate'>,
    @Inject(LIMIT_PRICE_REPOSITORY) private readonly limitPriceRepository: Pick<LimitPriceRepository, 'count' | 'findLatestDate'>,
    @Inject(SUSPENSION_REPOSITORY) private readonly suspensionRepository: Pick<SuspensionRepository, 'count' | 'findLatestDate'>,
    @Inject(ADJ_FACTOR_REPOSITORY) private readonly adjFactorRepository: Pick<AdjFactorRepository, 'count' | 'findLatestDate'>,
    @Inject(FINANCIAL_FACTOR_REPOSITORY) private readonly financialFactorRepository: Pick<FinancialFactorRepository, 'count' | 'findLatestDate'>,
    @Inject(BACKTEST_TASK_REPOSITORY) private readonly taskRepository: Pick<BacktestTaskRepository, 'findAll' | 'findById'>,
    @Inject(BACKTEST_SNAPSHOT_REPOSITORY) private readonly snapshotRepository: Pick<BacktestAccountSnapshotRepository, 'findByTaskId'>,
    @Inject(BACKTEST_POSITION_REPOSITORY) private readonly positionRepository: Pick<BacktestPositionRepository, 'findByTaskId'>,
    @Inject(BACKTEST_ORDER_REPOSITORY) private readonly orderRepository: Pick<BacktestOrderRepository, 'findByTaskId'>,
    @Inject(BACKTEST_TRADE_REPOSITORY) private readonly tradeRepository: Pick<BacktestTradeRepository, 'findByTaskId'>,
    @Inject(BACKTEST_METRIC_REPOSITORY) private readonly metricRepository: Pick<BacktestMetricRepository, 'findByTaskId'>,
    private readonly strategyService: StrategyService,
    private readonly dataSyncService: DataSyncService,
  ) {}

  async getOverview(): Promise<DashboardOverviewDto> {
    const [stockCount, dailyBarCount, latestDailyBarDate, financialFactorCount, latestFinancialFactorDate, tasks, syncHealth] = await Promise.all([
      this.stockRepository.count(),
      this.dailyBarRepository.count(),
      this.dailyBarRepository.findLatestDate(),
      this.financialFactorRepository.count(),
      this.financialFactorRepository.findLatestDate(),
      this.taskRepository.findAll(),
      this.dataSyncService.getSyncHealth(),
    ]);
    const strategies = this.strategyService.list();

    return {
      dataCenter: {
        stockCount,
        dailyBarCount,
        latestDailyBarDate,
        financialFactorCount,
        latestFinancialFactorDate,
        syncHealth,
      },
      strategies: {
        total: strategies.length,
        codes: strategies.map((strategy) => strategy.code),
      },
      backtests: {
        total: tasks.length,
        byStatus: countBacktestsByStatus(tasks),
        latestTask: toLatestBacktestTask(tasks[0]),
      },
    };
  }

  async getDataCenterSummary(): Promise<DashboardDataCenterSummaryDto> {
    const [
      stocks,
      tradingCalendar,
      dailyBars,
      indexDailyBars,
      limitPrices,
      suspensions,
      adjFactors,
      financialFactors,
    ] = await Promise.all([
      buildCoverage('stocks', this.stockRepository),
      buildCoverage('tradingCalendar', this.tradingCalendarRepository),
      buildCoverage('dailyBars', this.dailyBarRepository),
      buildCoverage('indexDailyBars', this.indexDailyBarRepository),
      buildCoverage('limitPrices', this.limitPriceRepository),
      buildCoverage('suspensions', this.suspensionRepository),
      buildCoverage('adjFactors', this.adjFactorRepository),
      buildCoverage('financialFactors', this.financialFactorRepository),
    ]);

    return {
      stocks,
      tradingCalendar,
      dailyBars,
      indexDailyBars,
      limitPrices,
      suspensions,
      adjFactors,
      financialFactors,
    };
  }

  async listStocks(): Promise<readonly DashboardStockItemDto[]> {
    const stocks = await this.stockRepository.findAll();
    return stocks.map(toStockItem);
  }

  async listBacktests(): Promise<readonly DashboardBacktestListItemDto[]> {
    const tasks = await this.taskRepository.findAll();
    return tasks.map(toBacktestListItem);
  }

  listStrategies(): readonly DashboardStrategyListItemDto[] {
    return this.strategyService.list().map(toStrategyListItem);
  }

  async getStrategyDetail(code: string): Promise<DashboardStrategyDetailDto | null> {
    const strategy = getStrategyOrNull(this.strategyService, code);
    if (strategy === null) {
      return null;
    }
    return {
      ...toStrategyListItem(strategy),
      defaultConfig: getDefaultStrategyConfig(strategy.code),
      sampleSignals: await generateSampleSignals(strategy),
    };
  }

  async getStrategySampleSignals(code: string): Promise<readonly DashboardStrategySignalSampleDto[] | null> {
    const strategy = getStrategyOrNull(this.strategyService, code);
    if (strategy === null) {
      return null;
    }
    return generateSampleSignals(strategy);
  }

  async getBacktestSummary(taskId: string): Promise<DashboardBacktestSummaryDto | null> {
    const task = await this.taskRepository.findById(taskId);
    if (task === null) {
      return null;
    }

    const [metrics, snapshots, positions, orders, trades] = await Promise.all([
      this.metricRepository.findByTaskId(taskId),
      this.snapshotRepository.findByTaskId(taskId),
      this.positionRepository.findByTaskId(taskId),
      this.orderRepository.findByTaskId(taskId),
      this.tradeRepository.findByTaskId(taskId),
    ]);

    return {
      task: toBacktestListItem(task),
      metrics: metrics === null ? null : toMetrics(metrics),
      equityCurve: snapshots.map(toEquityPoint),
      positions: positions.map(toPosition),
      orders: toOrderStats(orders),
      trades: toTradeStats(trades),
    };
  }
}

interface CountAndLatestDateRepository {
  count(): Promise<number>;
  findLatestDate(): Promise<string | null>;
}

async function buildCoverage(dataSet: string, repository: CountAndLatestDateRepository): Promise<DashboardDataSetCoverageDto> {
  const [total, latestDate] = await Promise.all([
    repository.count(),
    repository.findLatestDate(),
  ]);
  return { dataSet, total, latestDate };
}

function countBacktestsByStatus(tasks: readonly BacktestTaskRecord[]): DashboardBacktestStatusDto {
  let pending = 0;
  let running = 0;
  let success = 0;
  let failed = 0;
  let canceled = 0;

  for (const task of tasks) {
    switch (task.status) {
      case 'PENDING':
        pending += 1;
        break;
      case 'RUNNING':
        running += 1;
        break;
      case 'SUCCESS':
        success += 1;
        break;
      case 'FAILED':
        failed += 1;
        break;
      case 'CANCELED':
        canceled += 1;
        break;
    }
  }

  return {
    PENDING: pending,
    RUNNING: running,
    SUCCESS: success,
    FAILED: failed,
    CANCELED: canceled,
  };
}

function toLatestBacktestTask(task: BacktestTaskRecord | undefined): DashboardLatestBacktestTaskDto | null {
  if (task === undefined) {
    return null;
  }

  return {
    id: task.id,
    name: task.name,
    strategyName: task.strategyName,
    status: task.status,
    startDate: task.startDate,
    endDate: task.endDate,
  };
}

function toStockItem(stock: StockRawData): DashboardStockItemDto {
  return {
    symbol: stock.symbol,
    tsCode: stock.tsCode,
    name: stock.name,
    exchange: stock.exchange,
    market: stock.market,
    ...(stock.industry === undefined ? {} : { industry: stock.industry }),
    ...(stock.area === undefined ? {} : { area: stock.area }),
    listDate: stock.listDate,
    ...(stock.delistDate === undefined ? {} : { delistDate: stock.delistDate }),
    isActive: stock.isActive,
    isST: stock.isST,
  };
}

function toBacktestListItem(task: BacktestTaskRecord): DashboardBacktestListItemDto {
  return {
    id: task.id,
    name: task.name,
    strategyName: task.strategyName,
    status: task.status,
    startDate: task.startDate,
    endDate: task.endDate,
    initialCapital: toDecimalString(task.initialCapital),
    ...(task.benchmark === undefined ? {} : { benchmark: task.benchmark }),
    ...(task.errorMessage === undefined ? {} : { errorMessage: task.errorMessage }),
  };
}

function getStrategyOrNull(strategyService: StrategyService, code: string): Strategy | null {
  try {
    return strategyService.get(code);
  } catch {
    return null;
  }
}

function toStrategyListItem(strategy: Strategy): DashboardStrategyListItemDto {
  return {
    code: strategy.code,
    name: strategy.name,
    version: strategy.version,
    ...(strategy.description === undefined ? {} : { description: strategy.description }),
    configSchema: getStrategyConfigSchema(strategy.code),
  };
}

function getStrategyConfigSchema(code: string): readonly DashboardStrategyConfigFieldDto[] {
  if (code === 'multi-factor') {
    return [
      { name: 'maxPositions', type: 'number', required: true, defaultValue: 3, description: 'Maximum number of selected securities.' },
      { name: 'normalizeMethod', type: 'string', required: true, defaultValue: 'rank', description: 'Factor normalization method: rank, zscore, or minmax.' },
      { name: 'factors', type: 'array', required: true, defaultValue: getDefaultFactorWeights(), description: 'Weighted factor definitions.' },
    ];
  }
  return [
    { name: 'maxPositions', type: 'number', required: true, defaultValue: 3, description: 'Maximum number of selected securities.' },
  ];
}

function getDefaultStrategyConfig(code: string): Readonly<Record<string, unknown>> {
  if (code === 'multi-factor') {
    return {
      maxPositions: 3,
      normalizeMethod: 'rank',
      factors: getDefaultFactorWeights(),
    };
  }
  return { maxPositions: 3 };
}

function getDefaultFactorWeights(): readonly Readonly<Record<string, unknown>>[] {
  return [
    { factorCode: 'momentum', weight: 0.45, direction: 'positive' },
    { factorCode: 'roe', weight: 0.35, direction: 'positive' },
    { factorCode: 'pe', weight: 0.2, direction: 'negative' },
  ];
}

async function generateSampleSignals(strategy: Strategy): Promise<readonly DashboardStrategySignalSampleDto[]> {
  return strategy.generateSignals(getSampleContext(strategy.code), getDefaultStrategyConfig(strategy.code) as StrategyConfig);
}

function getSampleContext(code: string): StrategyContext {
  const tradeDate = new Date('2026-05-14T00:00:00.000Z');
  const universe = ['000001', '600000', '000333', '600519'];
  const base = {
    tradeDate,
    previousTradeDate: new Date('2026-05-13T00:00:00.000Z'),
    rebalanceRange: { from: new Date('2026-05-01T00:00:00.000Z'), to: tradeDate },
    universe,
  } satisfies StrategyContext;

  if (code === 'momentum-top-n') {
    return {
      ...base,
      momentumScores: universe.map((securityId, index) => ({
        securityId,
        score: 10 - index,
        tradeDate,
        source: 'dashboard-sample',
      })),
    };
  }
  if (code === 'multi-factor') {
    return {
      ...base,
      factorValues: universe.flatMap((securityId, index) => [
        { securityId, factorCode: 'momentum', value: 0.12 - index * 0.01, tradeDate },
        { securityId, factorCode: 'roe', value: 0.18 - index * 0.02, tradeDate },
        { securityId, factorCode: 'pe', value: 8 + index * 3, tradeDate },
      ]),
    };
  }
  return base;
}

function toMetrics(metrics: BacktestMetrics): DashboardBacktestMetricsDto {
  return {
    totalReturn: toDecimalString(metrics.totalReturn),
    annualizedReturn: toDecimalString(metrics.annualizedReturn),
    maxDrawdown: toDecimalString(metrics.maxDrawdown),
    sharpeRatio: toDecimalString(metrics.sharpeRatio),
    sortinoRatio: toDecimalString(metrics.sortinoRatio),
    calmarRatio: toDecimalString(metrics.calmarRatio),
    winRate: toDecimalString(metrics.winRate),
    profitLossRatio: toDecimalString(metrics.profitLossRatio),
    volatility: toDecimalString(metrics.volatility),
    beta: metrics.beta === null ? null : toDecimalString(metrics.beta),
    alpha: metrics.alpha === null ? null : toDecimalString(metrics.alpha),
    turnoverRate: toDecimalString(metrics.turnoverRate),
    tradeCount: metrics.tradeCount,
  };
}

function toEquityPoint(snapshot: BacktestAccountSnapshotRecord): DashboardEquityPointDto {
  return {
    tradeDate: snapshot.tradeDate,
    cash: toDecimalString(snapshot.cash),
    marketValue: toDecimalString(snapshot.marketValue),
    totalAsset: toDecimalString(snapshot.totalAsset),
    dailyReturn: toDecimalString(snapshot.dailyReturn),
    cumulativeReturn: toDecimalString(snapshot.cumulativeReturn),
    drawdown: toDecimalString(snapshot.drawdown),
  };
}

function toPosition(position: BacktestPositionState): DashboardPositionDto {
  return {
    symbol: position.symbol,
    quantity: position.quantity,
    availableQuantity: position.availableQuantity,
    avgCost: toDecimalString(position.avgCost),
    lastPrice: toDecimalString(position.lastPrice),
    marketValue: toDecimalString(position.marketValue),
    unrealizedPnl: toDecimalString(position.unrealizedPnl),
    realizedPnl: toDecimalString(position.realizedPnl),
    ...(position.lastBuyDate === undefined ? {} : { lastBuyDate: position.lastBuyDate }),
    ...(position.tradeDate === undefined ? {} : { tradeDate: position.tradeDate }),
  };
}

function toOrderStats(orders: readonly BacktestOrderRecord[]): DashboardOrderStatsDto {
  return {
    total: orders.length,
    filled: orders.filter((order) => isFilledOrderStatus(order.status)).length,
    rejected: orders.filter((order) => isRejectedOrderStatus(order.status)).length,
  };
}

function toTradeStats(trades: readonly BacktestTradeRecord[]): DashboardTradeStatsDto {
  return {
    total: trades.length,
    amount: toDecimalString(sumDecimals(trades.map((trade) => trade.amount))),
    totalFee: toDecimalString(sumDecimals(trades.map((trade) => trade.totalFee))),
  };
}

function sumDecimals(values: readonly Decimal[]): Decimal {
  return values.reduce((sum, value) => sum.plus(value), new Decimal(0));
}

function toDecimalString(value: Decimal): string {
  return value.toString();
}
