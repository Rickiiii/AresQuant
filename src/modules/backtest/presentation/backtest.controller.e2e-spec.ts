import { Test } from '@nestjs/testing';
import type { InjectionToken, Provider } from '@nestjs/common';
import { BacktestController } from './backtest.controller';
import { BacktestEngineService } from '../application/backtest-engine.service';
import {
  BACKTEST_METRIC_REPOSITORY,
  BACKTEST_ORDER_REPOSITORY,
  BACKTEST_POSITION_REPOSITORY,
  BACKTEST_SNAPSHOT_REPOSITORY,
  BACKTEST_TASK_REPOSITORY,
  BACKTEST_TRADE_REPOSITORY,
} from '../domain/repositories/backtest.repositories';

describe('BacktestController', () => {
  it('lists backtest tasks using unified response', async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [BacktestController],
      providers: [
        provider(BacktestEngineService, { run: jest.fn() }),
        provider(BACKTEST_TASK_REPOSITORY, { findAll: jest.fn().mockResolvedValue([{ id: 'task-1' }]), findById: jest.fn(), deleteByTaskId: jest.fn() }),
        provider(BACKTEST_ORDER_REPOSITORY, { findByTaskId: jest.fn() }),
        provider(BACKTEST_TRADE_REPOSITORY, { findByTaskId: jest.fn() }),
        provider(BACKTEST_POSITION_REPOSITORY, { findByTaskId: jest.fn() }),
        provider(BACKTEST_SNAPSHOT_REPOSITORY, { findByTaskId: jest.fn() }),
        provider(BACKTEST_METRIC_REPOSITORY, { findByTaskId: jest.fn() }),
      ],
    }).compile();
    await expect(moduleRef.get(BacktestController).list()).resolves.toMatchObject({ success: true, data: [{ id: 'task-1' }] });
  });
});

function provider(token: InjectionToken, useValue: object): Provider {
  return { provide: token, useValue };
}
