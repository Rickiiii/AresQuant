import { BacktestTaskStatus } from '@prisma/client';
import { Decimal } from 'decimal.js';
import { BacktestEngineService } from './backtest-engine.service';
import type { BacktestTaskRepository } from '../domain/repositories/backtest.repositories';
import type { TradingCalendarRepository } from '@/modules/data/domain/repositories/data-center.repositories';
import { BacktestFrequency, BacktestPriceMode, type BacktestConfig } from '../types/backtest.types';
import type { PortfolioService } from './services/portfolio.service';

describe('BacktestEngineService', () => {
  it('fails invalid config before creating task', async () => {
    const service = new BacktestEngineService(
      emptyService(),
      emptyService(),
      emptyService(),
      emptyService(),
      emptyService(),
      emptyService(),
      { create: jest.fn(), update: jest.fn(), findById: jest.fn(), findAll: jest.fn(), deleteByTaskId: jest.fn() } as unknown as BacktestTaskRepository,
      emptyService(),
      emptyService(),
      emptyService(),
      emptyService(),
      emptyService(),
      emptyService(),
      emptyService(),
      emptyService(),
      emptyService(),
      emptyService(),
    );
    await expect(service.run({ ...config(), startDate: '20260515', endDate: '20260511' })).rejects.toThrow('startDate must be earlier than endDate');
  });

  it('updates task status to failed on runtime errors', async () => {
    const taskRepository = { create: jest.fn().mockResolvedValue({ id: 'task-1' }), update: jest.fn().mockResolvedValue({}), findById: jest.fn(), findAll: jest.fn(), deleteByTaskId: jest.fn() } as unknown as BacktestTaskRepository;
    const service = new BacktestEngineService(
      emptyService(),
      emptyService(),
      { initializePortfolio: jest.fn() } as unknown as PortfolioService,
      emptyService(),
      emptyService(),
      emptyService(),
      taskRepository,
      emptyService(),
      emptyService(),
      emptyService(),
      emptyService(),
      emptyService(),
      { findByDateRange: jest.fn().mockResolvedValue([]), upsertMany: jest.fn(), findLatestDate: jest.fn(), count: jest.fn(), deleteByDateRange: jest.fn() } as unknown as TradingCalendarRepository,
      emptyService(),
      emptyService(),
      emptyService(),
      emptyService(),
    );
    await expect(service.run(config())).rejects.toThrow('No trading dates found');
    expect(taskRepository.update).toHaveBeenCalledWith('task-1', expect.objectContaining({ status: BacktestTaskStatus.FAILED }));
  });
});

function config(): BacktestConfig {
  return { name: 'test', strategyName: 'equal_weight_mock', startDate: '20260511', endDate: '20260515', initialCapital: new Decimal(1000000), frequency: BacktestFrequency.DAILY, rebalanceFrequency: 1, maxPositions: 2, maxPositionWeight: new Decimal(0.5), commissionRate: new Decimal(0.00025), minCommission: new Decimal(5), stampDutyRate: new Decimal(0.001), transferFeeRate: new Decimal(0.00001), slippageRate: new Decimal(0), allowBuyLimitUp: false, allowSellLimitDown: false, enableT1Rule: true, priceMode: BacktestPriceMode.CLOSE, blacklist: [] };
}

function emptyService<T>(): T {
  return {} as T;
}
