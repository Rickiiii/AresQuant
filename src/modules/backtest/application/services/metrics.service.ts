import { Inject, Injectable } from '@nestjs/common';
import { Decimal } from 'decimal.js';
import {
  BACKTEST_SNAPSHOT_REPOSITORY,
  BACKTEST_TRADE_REPOSITORY,
  type BacktestAccountSnapshotRepository,
  type BacktestTradeRepository,
} from '../../domain/repositories/backtest.repositories';
import type { BacktestMetrics, BacktestAccountSnapshotRecord } from '../../types/backtest.types';

@Injectable()
export class MetricsService {
  constructor(
    @Inject(BACKTEST_SNAPSHOT_REPOSITORY) private readonly snapshotRepository: BacktestAccountSnapshotRepository,
    @Inject(BACKTEST_TRADE_REPOSITORY) private readonly tradeRepository: BacktestTradeRepository,
  ) {}

  async calculateMetrics(taskId: string): Promise<BacktestMetrics> {
    const [snapshots, trades] = await Promise.all([
      this.snapshotRepository.findByTaskId(taskId),
      this.tradeRepository.findByTaskId(taskId),
    ]);
    return this.calculateFromSnapshots(snapshots, trades.length);
  }

  calculateFromSnapshots(snapshots: readonly BacktestAccountSnapshotRecord[], tradeCount: number): BacktestMetrics {
    if (snapshots.length < 2) {
      return zeroMetrics(tradeCount);
    }
    const first = snapshots[0];
    const last = snapshots[snapshots.length - 1];
    if (first === undefined || last === undefined || first.totalAsset.eq(0)) {
      return zeroMetrics(tradeCount);
    }
    const returns = snapshots.slice(1).map((snapshot) => snapshot.dailyReturn);
    const totalReturn = last.totalAsset.minus(first.totalAsset).div(first.totalAsset);
    const annualizedReturn = new Decimal(1).plus(totalReturn).pow(new Decimal(252).div(snapshots.length)).minus(1);
    const maxDrawdown = Decimal.min(...snapshots.map((snapshot) => snapshot.drawdown));
    const volatility = standardDeviation(returns).mul(new Decimal(252).sqrt());
    const averageReturn = average(returns);
    const sharpeRatio = volatility.eq(0) ? new Decimal(0) : averageReturn.mul(252).div(volatility);
    const downside = returns.filter((value) => value.lt(0));
    const downsideVolatility = standardDeviation(downside).mul(new Decimal(252).sqrt());
    const sortinoRatio = downsideVolatility.eq(0) ? new Decimal(0) : averageReturn.mul(252).div(downsideVolatility);
    const calmarRatio = maxDrawdown.eq(0) ? new Decimal(0) : annualizedReturn.div(maxDrawdown.abs());
    const wins = returns.filter((value) => value.gt(0));
    const losses = returns.filter((value) => value.lt(0));
    const winRate = returns.length === 0 ? new Decimal(0) : new Decimal(wins.length).div(returns.length);
    const profitLossRatio = losses.length === 0 ? new Decimal(0) : average(wins).div(average(losses).abs());
    return {
      totalReturn,
      annualizedReturn,
      maxDrawdown,
      sharpeRatio,
      sortinoRatio,
      calmarRatio,
      winRate,
      profitLossRatio,
      volatility,
      beta: null,
      alpha: null,
      turnoverRate: new Decimal(tradeCount).div(snapshots.length),
      tradeCount,
    };
  }
}

function zeroMetrics(tradeCount: number): BacktestMetrics {
  return {
    totalReturn: new Decimal(0),
    annualizedReturn: new Decimal(0),
    maxDrawdown: new Decimal(0),
    sharpeRatio: new Decimal(0),
    sortinoRatio: new Decimal(0),
    calmarRatio: new Decimal(0),
    winRate: new Decimal(0),
    profitLossRatio: new Decimal(0),
    volatility: new Decimal(0),
    beta: null,
    alpha: null,
    turnoverRate: new Decimal(0),
    tradeCount,
  };
}

function average(values: readonly Decimal[]): Decimal {
  if (values.length === 0) {
    return new Decimal(0);
  }
  return values.reduce((sum, value) => sum.plus(value), new Decimal(0)).div(values.length);
}

function standardDeviation(values: readonly Decimal[]): Decimal {
  if (values.length === 0) {
    return new Decimal(0);
  }
  const mean = average(values);
  const variance = values.reduce((sum, value) => sum.plus(value.minus(mean).pow(2)), new Decimal(0)).div(values.length);
  return variance.sqrt();
}
