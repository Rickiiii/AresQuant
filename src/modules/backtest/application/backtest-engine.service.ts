import { Inject, Injectable, Logger } from '@nestjs/common';
import { BacktestOrderStatus, BacktestTaskStatus } from '@prisma/client';
import { Decimal } from 'decimal.js';
import { StrategyRegistryService } from '@/modules/strategy/application/strategy-registry.service';
import { RiskService } from '@/modules/risk/application/risk.service';
import {
  LIMIT_PRICE_REPOSITORY,
  PHASE2_DAILY_BAR_REPOSITORY,
  STOCK_REPOSITORY,
  SUSPENSION_REPOSITORY,
  TRADING_CALENDAR_REPOSITORY,
  type LimitPriceRepository,
  type Phase2DailyBarRepository,
  type StockRepository,
  type SuspensionRepository,
  type TradingCalendarRepository,
} from '@/modules/data/domain/repositories/data-center.repositories';
import type { DailyBarRawData, LimitPriceRawData, SuspensionRawData } from '@/modules/data/domain/types/market-data.types';
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
} from '../domain/repositories/backtest.repositories';
import { BacktestFrequency, type BacktestConfig, type BacktestResult, type MarketBar, type TargetPosition } from '../types/backtest.types';
import { MatchingEngineService } from './services/matching-engine.service';
import { MetricsService } from './services/metrics.service';
import { OrderGeneratorService } from './services/order-generator.service';
import { PortfolioService } from './services/portfolio.service';

@Injectable()
export class BacktestEngineService {
  private readonly logger = new Logger(BacktestEngineService.name);

  constructor(
    private readonly strategyRegistry: StrategyRegistryService,
    private readonly riskService: RiskService,
    private readonly portfolioService: PortfolioService,
    private readonly orderGenerator: OrderGeneratorService,
    private readonly matchingEngine: MatchingEngineService,
    private readonly metricsService: MetricsService,
    @Inject(BACKTEST_TASK_REPOSITORY) private readonly taskRepository: BacktestTaskRepository,
    @Inject(BACKTEST_SNAPSHOT_REPOSITORY) private readonly snapshotRepository: BacktestAccountSnapshotRepository,
    @Inject(BACKTEST_POSITION_REPOSITORY) private readonly positionRepository: BacktestPositionRepository,
    @Inject(BACKTEST_ORDER_REPOSITORY) private readonly orderRepository: BacktestOrderRepository,
    @Inject(BACKTEST_TRADE_REPOSITORY) private readonly tradeRepository: BacktestTradeRepository,
    @Inject(BACKTEST_METRIC_REPOSITORY) private readonly metricRepository: BacktestMetricRepository,
    @Inject(TRADING_CALENDAR_REPOSITORY) private readonly calendarRepository: TradingCalendarRepository,
    @Inject(STOCK_REPOSITORY) private readonly stockRepository: StockRepository,
    @Inject(PHASE2_DAILY_BAR_REPOSITORY) private readonly dailyBarRepository: Phase2DailyBarRepository,
    @Inject(LIMIT_PRICE_REPOSITORY) private readonly limitPriceRepository: LimitPriceRepository,
    @Inject(SUSPENSION_REPOSITORY) private readonly suspensionRepository: SuspensionRepository,
  ) {}

  async run(config: BacktestConfig): Promise<BacktestResult> {
    this.validateConfig(config);
    const task = await this.taskRepository.create({ config });
    this.logger.log(`Backtest task started id=${task.id}, strategy=${config.strategyName}`);
    try {
      const result = await this.executeTask(task.id, config);
      await this.taskRepository.update(task.id, { status: BacktestTaskStatus.SUCCESS, finishedAt: new Date() });
      return result;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(`Backtest task failed id=${task.id}`, error instanceof Error ? error.stack : message);
      await this.taskRepository.update(task.id, { status: BacktestTaskStatus.FAILED, errorMessage: message, finishedAt: new Date() });
      throw error;
    }
  }

  private async executeTask(taskId: string, config: BacktestConfig): Promise<BacktestResult> {
    const calendar = await this.loadTradingDates(config);
    const stocks = await this.stockRepository.findAll();
    const universe = stocks.map((stock) => stock.symbol);
    this.portfolioService.initializePortfolio(config.initialCapital);
    const snapshots = [];

    for (let index = 0; index < calendar.length; index += 1) {
      const tradeDate = calendar[index];
      if (tradeDate === undefined) {
        continue;
      }
      const previousDate = index > 0 ? calendar[index - 1] : undefined;
      const bars = await this.loadMarketBars(universe, tradeDate);
      this.portfolioService.releaseT1(tradeDate);
      this.portfolioService.updateMarketValue(tradeDate, bars);

      if (this.isRebalanceDay(index, config)) {
        const targets = await this.generateTargets(config, tradeDate, previousDate, universe);
        const filteredTargets = await this.applyRisk(config, targets, stocks, bars, tradeDate);
        await this.rebalance(taskId, config, tradeDate, bars, filteredTargets);
      }

      const snapshot = this.portfolioService.createSnapshot(taskId, tradeDate);
      await this.snapshotRepository.create(snapshot);
      await this.positionRepository.createMany(taskId, tradeDate, this.portfolioService.getCurrentPositions());
      snapshots.push(snapshot);
    }

    const metrics = this.metricsService.calculateFromSnapshots(snapshots, (await this.tradeRepository.findByTaskId(taskId)).length);
    await this.metricRepository.create(taskId, metrics);
    return { taskId, status: BacktestTaskStatus.SUCCESS, metrics, snapshots };
  }

  private async loadTradingDates(config: BacktestConfig): Promise<readonly string[]> {
    const calendars = await this.calendarRepository.findByDateRange({ startDate: config.startDate, endDate: config.endDate });
    const dates = calendars.filter((item) => item.isOpen).map((item) => item.tradeDate);
    if (dates.length === 0) {
      throw new Error('No trading dates found for backtest range');
    }
    return dates;
  }

  private async generateTargets(config: BacktestConfig, tradeDate: string, previousDate: string | undefined, universe: readonly string[]): Promise<readonly TargetPosition[]> {
    const plugin = this.strategyRegistry.get(config.strategyName);
    const signals = await plugin.generateSignals(
      { tradeDate: toDate(tradeDate), rebalanceRange: { from: toDate(config.startDate), to: toDate(config.endDate) }, universe },
      { factors: [{ factorCode: 'equal_weight', weight: 1 }], maxPositions: config.maxPositions, rebalanceDays: config.rebalanceFrequency },
    );
    return signals.slice(0, config.maxPositions).map((signal) => ({
      symbol: signal.securityId,
      weight: new Decimal(signal.targetWeight),
      reason: signal.reason,
    }));
  }

  private async applyRisk(config: BacktestConfig, targets: readonly TargetPosition[], stocks: Awaited<ReturnType<StockRepository['findAll']>>, bars: readonly MarketBar[], tradeDate: string): Promise<readonly TargetPosition[]> {
    const suspensions = await this.suspensionRepository.findByTradeDate(tradeDate);
    const latestBars = bars.map((bar) => ({
      symbol: bar.symbol,
      tsCode: `${bar.symbol}.SZ`,
      tradeDate: bar.tradeDate,
      open: bar.open.toNumber(),
      high: bar.high.toNumber(),
      low: bar.low.toNumber(),
      close: bar.close.toNumber(),
      preClose: bar.close.toNumber(),
      change: 0,
      pctChange: 0,
      volume: bar.volume.toNumber(),
      amount: bar.amount.toNumber(),
    }));
    return this.riskService.filterTargets({ targets, stocks, suspensions, latestBars, maxPositions: config.maxPositions, maxPositionWeight: config.maxPositionWeight, blacklist: config.blacklist });
  }

  private async rebalance(taskId: string, config: BacktestConfig, tradeDate: string, bars: readonly MarketBar[], targets: readonly TargetPosition[]): Promise<void> {
    const priceMap = new Map(bars.map((bar) => [bar.symbol, bar.close]));
    const barMap = new Map(bars.map((bar) => [bar.symbol, bar]));
    this.orderGenerator.setReferencePrices(priceMap);
    const orders = this.orderGenerator.generateRebalanceOrders(this.portfolioService.currentState(), targets, tradeDate, taskId);
    for (const draft of orders) {
      const persisted = await this.orderRepository.create({
        taskId: draft.taskId,
        symbol: draft.symbol,
        tradeDate: draft.tradeDate,
        side: draft.side,
        orderType: draft.orderType,
        price: draft.price,
        quantity: draft.quantity,
        filledQuantity: 0,
        status: BacktestOrderStatus.PENDING,
      });
      const result = await this.matchingEngine.matchOrder(persisted, { config, portfolio: this.portfolioService.currentState(), bar: barMap.get(persisted.symbol) ?? null });
      const updated = await this.orderRepository.update(persisted.id, {
        status: result.order.status,
        filledQuantity: result.order.filledQuantity,
        ...(result.order.avgFilledPrice === undefined ? {} : { avgFilledPrice: result.order.avgFilledPrice.toString() }),
        ...(result.order.reason === undefined ? {} : { reason: result.order.reason }),
      });
      if (result.trade !== undefined) {
        const trade = await this.tradeRepository.create({ ...result.trade, orderId: updated.id });
        this.portfolioService.applyTrade(trade);
      }
    }
  }

  private async loadMarketBars(symbols: readonly string[], tradeDate: string): Promise<readonly MarketBar[]> {
    const [dailyBars, limitPrices, suspensions] = await Promise.all([
      this.dailyBarRepository.findByTradeDate(tradeDate),
      this.limitPriceRepository.findByTradeDate(tradeDate),
      this.suspensionRepository.findByTradeDate(tradeDate),
    ]);
    const limitMap = new Map(limitPrices.map((item) => [item.symbol, item]));
    const suspended = new Set(suspensions.map((item: SuspensionRawData) => item.symbol));
    return dailyBars
      .filter((bar) => symbols.includes(bar.symbol))
      .map((bar) => this.toMarketBar(bar, limitMap.get(bar.symbol), suspended.has(bar.symbol)));
  }

  private toMarketBar(bar: DailyBarRawData, limit: LimitPriceRawData | undefined, isSuspended: boolean): MarketBar {
    return {
      symbol: bar.symbol,
      tradeDate: bar.tradeDate,
      open: new Decimal(bar.open),
      high: new Decimal(bar.high),
      low: new Decimal(bar.low),
      close: new Decimal(bar.close),
      volume: new Decimal(bar.volume),
      amount: new Decimal(bar.amount),
      isSuspended,
      isLimitUp: limit === undefined ? false : new Decimal(bar.close).greaterThanOrEqualTo(limit.upLimit),
      isLimitDown: limit === undefined ? false : new Decimal(bar.close).lessThanOrEqualTo(limit.downLimit),
    };
  }

  private isRebalanceDay(index: number, config: BacktestConfig): boolean {
    if (config.frequency !== BacktestFrequency.DAILY) {
      return index % config.rebalanceFrequency === 0;
    }
    return index % config.rebalanceFrequency === 0;
  }

  private validateConfig(config: BacktestConfig): void {
    if (config.initialCapital.lte(0)) {
      throw new Error('initialCapital must be positive');
    }
    if (toDate(config.startDate) > toDate(config.endDate)) {
      throw new Error('startDate must be earlier than endDate');
    }
    if (config.maxPositions <= 0) {
      throw new Error('maxPositions must be positive');
    }
  }
}

function toDate(value: string): Date {
  const normalized = value.includes('-') ? value.replaceAll('-', '') : value;
  return new Date(Date.UTC(Number(normalized.slice(0, 4)), Number(normalized.slice(4, 6)) - 1, Number(normalized.slice(6, 8))));
}
