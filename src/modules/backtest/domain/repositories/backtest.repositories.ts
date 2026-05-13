import type { BacktestOrderStatus, BacktestTaskStatus } from '@prisma/client';
import type {
  BacktestAccountSnapshotRecord,
  BacktestConfig,
  BacktestMetrics,
  BacktestOrderRecord,
  BacktestPositionState,
  BacktestTaskRecord,
  BacktestTradeRecord,
} from '../../types/backtest.types';

export const BACKTEST_TASK_REPOSITORY = Symbol('BACKTEST_TASK_REPOSITORY');
export const BACKTEST_SNAPSHOT_REPOSITORY = Symbol('BACKTEST_SNAPSHOT_REPOSITORY');
export const BACKTEST_POSITION_REPOSITORY = Symbol('BACKTEST_POSITION_REPOSITORY');
export const BACKTEST_ORDER_REPOSITORY = Symbol('BACKTEST_ORDER_REPOSITORY');
export const BACKTEST_TRADE_REPOSITORY = Symbol('BACKTEST_TRADE_REPOSITORY');
export const BACKTEST_METRIC_REPOSITORY = Symbol('BACKTEST_METRIC_REPOSITORY');

export interface BacktestTaskCreateInput {
  readonly config: BacktestConfig;
}

export interface BacktestTaskUpdateInput {
  readonly status?: BacktestTaskStatus;
  readonly errorMessage?: string | null;
  readonly startedAt?: Date;
  readonly finishedAt?: Date;
}

export interface BacktestTaskRepository {
  create(input: BacktestTaskCreateInput): Promise<BacktestTaskRecord>;
  update(id: string, input: BacktestTaskUpdateInput): Promise<BacktestTaskRecord>;
  findById(id: string): Promise<BacktestTaskRecord | null>;
  findAll(): Promise<readonly BacktestTaskRecord[]>;
  deleteByTaskId(taskId: string): Promise<void>;
}

export interface BacktestAccountSnapshotRepository {
  create(record: BacktestAccountSnapshotRecord): Promise<void>;
  createMany(records: readonly BacktestAccountSnapshotRecord[]): Promise<number>;
  findByTaskId(taskId: string): Promise<readonly BacktestAccountSnapshotRecord[]>;
  deleteByTaskId(taskId: string): Promise<number>;
}

export interface BacktestPositionRepository {
  createMany(taskId: string, tradeDate: string, records: readonly BacktestPositionState[]): Promise<number>;
  findByTaskId(taskId: string): Promise<readonly BacktestPositionState[]>;
  deleteByTaskId(taskId: string): Promise<number>;
}

export interface BacktestOrderRepository {
  create(record: Omit<BacktestOrderRecord, 'id'>): Promise<BacktestOrderRecord>;
  update(id: string, input: { readonly status: BacktestOrderStatus; readonly filledQuantity: number; readonly avgFilledPrice?: string; readonly reason?: string }): Promise<BacktestOrderRecord>;
  findById(id: string): Promise<BacktestOrderRecord | null>;
  findByTaskId(taskId: string): Promise<readonly BacktestOrderRecord[]>;
  deleteByTaskId(taskId: string): Promise<number>;
}

export interface BacktestTradeRepository {
  create(record: BacktestTradeRecord): Promise<BacktestTradeRecord>;
  createMany(records: readonly BacktestTradeRecord[]): Promise<number>;
  findByTaskId(taskId: string): Promise<readonly BacktestTradeRecord[]>;
  deleteByTaskId(taskId: string): Promise<number>;
}

export interface BacktestMetricRepository {
  create(taskId: string, metrics: BacktestMetrics): Promise<void>;
  findByTaskId(taskId: string): Promise<BacktestMetrics | null>;
  deleteByTaskId(taskId: string): Promise<number>;
}
