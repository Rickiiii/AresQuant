import { BacktestTaskStatus } from '@prisma/client';
import { Decimal } from 'decimal.js';
import { BacktestEngineService } from './backtest-engine.service';
import type {
  BacktestAccountSnapshotRepository,
  BacktestMetricRepository,
  BacktestOrderRepository,
  BacktestPositionRepository,
  BacktestTaskRepository,
  BacktestTradeRepository,
} from '../domain/repositories/backtest.repositories';
import type {
  LimitPriceRepository,
  Phase2DailyBarRepository,
  StockRepository,
  SuspensionRepository,
  TradingCalendarRepository,
} from '@/modules/data/domain/repositories/data-center.repositories';
import { BacktestFrequency, BacktestPriceMode, type BacktestConfig, type TargetPosition } from '../types/backtest.types';
import type { PortfolioService } from './services/portfolio.service';
import type { StrategyRegistryService } from '@/modules/strategy/application/strategy-registry.service';
import type { StrategyService } from '@/modules/strategy/application/strategy.service';
import type { RiskService } from '@/modules/risk/application/risk.service';
import type { OrderGeneratorService } from './services/order-generator.service';
import type { MatchingEngineService } from './services/matching-engine.service';
import type { MetricsService } from './services/metrics.service';

describe('BacktestEngineService', () => {
  it('fails invalid config before creating task', async () => {
    const taskRepository = { create: jest.fn(), update: jest.fn(), findById: jest.fn(), findAll: jest.fn(), deleteByTaskId: jest.fn() } as unknown as BacktestTaskRepository;
    const service = createEngine({ taskRepository });

    await expect(service.run({ ...config(), startDate: '20260515', endDate: '20260511' })).rejects.toThrow('startDate must be earlier than endDate');
    expect(taskRepository.create).not.toHaveBeenCalled();
  });

  it('updates task status to failed on runtime errors', async () => {
    const taskRepository = { create: jest.fn().mockResolvedValue({ id: 'task-1' }), update: jest.fn().mockResolvedValue({}), findById: jest.fn(), findAll: jest.fn(), deleteByTaskId: jest.fn() } as unknown as BacktestTaskRepository;
    const calendarRepository = { findByDateRange: jest.fn().mockResolvedValue([]), upsertMany: jest.fn(), findLatestDate: jest.fn(), count: jest.fn(), deleteByDateRange: jest.fn() } as unknown as TradingCalendarRepository;
    const service = createEngine({ taskRepository, calendarRepository });

    await expect(service.run(config())).rejects.toThrow('No trading dates found');
    expect(taskRepository.update).toHaveBeenCalledWith('task-1', expect.objectContaining({ status: BacktestTaskStatus.FAILED }));
  });

  it('uses formal StrategyService strategies before legacy strategy plugins', async () => {
    const capturedTargets: TargetPosition[][] = [];
    const legacyRegistry = {
      get: jest.fn(() => ({
        generateSignals: jest.fn().mockResolvedValue([{ securityId: 'LEGACY', targetWeight: 1, reason: 'legacy' }]),
      })),
    } as unknown as StrategyRegistryService;
    const formalStrategy = {
      code: 'equal-weight',
      name: 'Equal Weight Strategy',
      version: '1.0.0',
      validateConfig: jest.fn(),
      generateSignals: jest.fn().mockResolvedValue([
        { securityId: '000001', targetWeight: 0.5, reason: 'formal equal-weight' },
        { securityId: '600000', targetWeight: 0.5, reason: 'formal equal-weight' },
      ]),
    };
    const strategyService = {
      get: jest.fn().mockReturnValue(formalStrategy),
      list: jest.fn(),
      register: jest.fn(),
    } as unknown as StrategyService;
    const taskRepository = {
      create: jest.fn().mockResolvedValue({ id: 'task-1' }),
      update: jest.fn().mockResolvedValue({}),
      findById: jest.fn(),
      findAll: jest.fn(),
      deleteByTaskId: jest.fn(),
    } as unknown as BacktestTaskRepository;
    const orderGenerator = {
      setReferencePrices: jest.fn(),
      generateRebalanceOrders: jest.fn((_portfolio: unknown, targets: readonly TargetPosition[]) => {
        capturedTargets.push([...targets]);
        return [];
      }),
    } as unknown as OrderGeneratorService;
    const service = createEngine({
      legacyRegistry,
      strategyService,
      taskRepository,
      orderGenerator,
      calendarRepository: calendarRepositoryWithOpenDates(['20260511']),
      stockRepository: stockRepositoryWithSymbols(['000001', '600000']),
      dailyBarRepository: dailyBarRepositoryWithSymbols(['000001', '600000']),
    });

    await expect(service.run({ ...config(), strategyName: 'equal-weight' })).resolves.toEqual(expect.objectContaining({ taskId: 'task-1', status: BacktestTaskStatus.SUCCESS }));

    expect(strategyService.get).toHaveBeenCalledWith('equal-weight');
    expect(formalStrategy.generateSignals).toHaveBeenCalledWith(
      expect.objectContaining({ universe: ['000001', '600000'] }),
      expect.objectContaining({ maxPositions: 2, rebalanceDays: 1 }),
    );
    expect(legacyRegistry.get).not.toHaveBeenCalled();
    expect(capturedTargets).toEqual([[{ symbol: '000001', weight: new Decimal(0.5), reason: 'formal equal-weight' }, { symbol: '600000', weight: new Decimal(0.5), reason: 'formal equal-weight' }]]);
  });
});

function config(): BacktestConfig {
  return { name: 'test', strategyName: 'equal_weight_mock', startDate: '20260511', endDate: '20260515', initialCapital: new Decimal(1000000), frequency: BacktestFrequency.DAILY, rebalanceFrequency: 1, maxPositions: 2, maxPositionWeight: new Decimal(0.5), commissionRate: new Decimal(0.00025), minCommission: new Decimal(5), stampDutyRate: new Decimal(0.001), transferFeeRate: new Decimal(0.00001), slippageRate: new Decimal(0), allowBuyLimitUp: false, allowSellLimitDown: false, enableT1Rule: true, priceMode: BacktestPriceMode.CLOSE, blacklist: [] };
}

function createEngine(overrides: Partial<EngineDependencies> = {}): BacktestEngineService {
  const dependencies = { ...defaultDependencies(), ...overrides };
  return new BacktestEngineService(
    dependencies.legacyRegistry,
    dependencies.strategyService,
    dependencies.riskService,
    dependencies.portfolioService,
    dependencies.orderGenerator,
    dependencies.matchingEngine,
    dependencies.metricsService,
    dependencies.taskRepository,
    dependencies.snapshotRepository,
    dependencies.positionRepository,
    dependencies.orderRepository,
    dependencies.tradeRepository,
    dependencies.metricRepository,
    dependencies.calendarRepository,
    dependencies.stockRepository,
    dependencies.dailyBarRepository,
    dependencies.limitPriceRepository,
    dependencies.suspensionRepository,
  );
}

interface EngineDependencies {
  readonly legacyRegistry: StrategyRegistryService;
  readonly strategyService: StrategyService;
  readonly riskService: RiskService;
  readonly portfolioService: PortfolioService;
  readonly orderGenerator: OrderGeneratorService;
  readonly matchingEngine: MatchingEngineService;
  readonly metricsService: MetricsService;
  readonly taskRepository: BacktestTaskRepository;
  readonly snapshotRepository: BacktestAccountSnapshotRepository;
  readonly positionRepository: BacktestPositionRepository;
  readonly orderRepository: BacktestOrderRepository;
  readonly tradeRepository: BacktestTradeRepository;
  readonly metricRepository: BacktestMetricRepository;
  readonly calendarRepository: TradingCalendarRepository;
  readonly stockRepository: StockRepository;
  readonly dailyBarRepository: Phase2DailyBarRepository;
  readonly limitPriceRepository: LimitPriceRepository;
  readonly suspensionRepository: SuspensionRepository;
}

function defaultDependencies(): EngineDependencies {
  return {
    legacyRegistry: { get: jest.fn(() => ({ generateSignals: jest.fn().mockResolvedValue([]) })) } as unknown as StrategyRegistryService,
    strategyService: { get: jest.fn(() => { throw new Error('Strategy not found: equal_weight_mock'); }), list: jest.fn(), register: jest.fn() } as unknown as StrategyService,
    riskService: { filterTargets: jest.fn((input: { readonly targets: readonly TargetPosition[] }) => input.targets) } as unknown as RiskService,
    portfolioService: {
      initializePortfolio: jest.fn(),
      releaseT1: jest.fn(),
      updateMarketValue: jest.fn(),
      createSnapshot: jest.fn((_taskId: string, tradeDate: string) => ({ taskId: 'task-1', tradeDate, cash: new Decimal(1000000), marketValue: new Decimal(0), totalAsset: new Decimal(1000000), dailyReturn: new Decimal(0), cumulativeReturn: new Decimal(0), drawdown: new Decimal(0) })),
      getCurrentPositions: jest.fn(() => []),
      currentState: jest.fn(() => ({ cash: new Decimal(1000000), positions: [], totalAsset: new Decimal(1000000), marketValue: new Decimal(0) })),
      applyTrade: jest.fn(),
    } as unknown as PortfolioService,
    orderGenerator: { setReferencePrices: jest.fn(), generateRebalanceOrders: jest.fn(() => []) } as unknown as OrderGeneratorService,
    matchingEngine: { matchOrder: jest.fn() } as unknown as MatchingEngineService,
    metricsService: { calculateFromSnapshots: jest.fn(() => ({ totalReturn: new Decimal(0), annualizedReturn: new Decimal(0), maxDrawdown: new Decimal(0), sharpeRatio: new Decimal(0), sortinoRatio: new Decimal(0), calmarRatio: new Decimal(0), winRate: new Decimal(0), profitLossRatio: new Decimal(0), volatility: new Decimal(0), beta: null, alpha: null, turnoverRate: new Decimal(0), tradeCount: 0 })) } as unknown as MetricsService,
    taskRepository: { create: jest.fn().mockResolvedValue({ id: 'task-1' }), update: jest.fn().mockResolvedValue({}), findById: jest.fn(), findAll: jest.fn(), deleteByTaskId: jest.fn() } as unknown as BacktestTaskRepository,
    snapshotRepository: { create: jest.fn(), createMany: jest.fn(), findByTaskId: jest.fn(), deleteByTaskId: jest.fn() } as unknown as BacktestAccountSnapshotRepository,
    positionRepository: { createMany: jest.fn(), findByTaskId: jest.fn(), deleteByTaskId: jest.fn() } as unknown as BacktestPositionRepository,
    orderRepository: { create: jest.fn(), update: jest.fn(), findById: jest.fn(), findByTaskId: jest.fn(), deleteByTaskId: jest.fn() } as unknown as BacktestOrderRepository,
    tradeRepository: { create: jest.fn(), createMany: jest.fn(), findByTaskId: jest.fn().mockResolvedValue([]), deleteByTaskId: jest.fn() } as unknown as BacktestTradeRepository,
    metricRepository: { create: jest.fn(), findByTaskId: jest.fn(), deleteByTaskId: jest.fn() } as unknown as BacktestMetricRepository,
    calendarRepository: calendarRepositoryWithOpenDates(['20260511']),
    stockRepository: stockRepositoryWithSymbols(['000001']),
    dailyBarRepository: dailyBarRepositoryWithSymbols(['000001']),
    limitPriceRepository: { findByTradeDate: jest.fn().mockResolvedValue([]), upsertMany: jest.fn(), findLatestDate: jest.fn(), count: jest.fn(), deleteByDateRange: jest.fn() } as unknown as LimitPriceRepository,
    suspensionRepository: { findByTradeDate: jest.fn().mockResolvedValue([]), upsertMany: jest.fn(), findLatestDate: jest.fn(), count: jest.fn(), deleteByDateRange: jest.fn() } as unknown as SuspensionRepository,
  };
}

function calendarRepositoryWithOpenDates(dates: readonly string[]): TradingCalendarRepository {
  return { findByDateRange: jest.fn().mockResolvedValue(dates.map((tradeDate) => ({ tradeDate, isOpen: true }))), upsertMany: jest.fn(), findLatestDate: jest.fn(), count: jest.fn(), deleteByDateRange: jest.fn() } as unknown as TradingCalendarRepository;
}

function stockRepositoryWithSymbols(symbols: readonly string[]): StockRepository {
  return { findAll: jest.fn().mockResolvedValue(symbols.map((symbol) => ({ symbol }))), upsertMany: jest.fn(), findBySymbol: jest.fn(), findLatestDate: jest.fn(), count: jest.fn(), deleteAll: jest.fn() } as unknown as StockRepository;
}

function dailyBarRepositoryWithSymbols(symbols: readonly string[]): Phase2DailyBarRepository {
  return { findByTradeDate: jest.fn().mockResolvedValue(symbols.map((symbol, index) => ({ symbol, tradeDate: '20260511', open: 10 + index, high: 11 + index, low: 9 + index, close: 10 + index, volume: 1000, amount: 10000 }))), findBySymbolAndDateRange: jest.fn(), upsertMany: jest.fn(), findLatestDate: jest.fn(), count: jest.fn(), deleteByDateRange: jest.fn() } as unknown as Phase2DailyBarRepository;
}
