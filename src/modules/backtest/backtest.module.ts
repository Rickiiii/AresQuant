import { Module } from '@nestjs/common';
import { DataModule } from '../data/data.module';
import { RiskModule } from '../risk/risk.module';
import { StrategyModule } from '../strategy/strategy.module';
import { BacktestEngineService } from './application/backtest-engine.service';
import { FeeCalculatorService } from './application/services/fee-calculator.service';
import { MatchingEngineService } from './application/services/matching-engine.service';
import { MetricsService } from './application/services/metrics.service';
import { OrderGeneratorService } from './application/services/order-generator.service';
import { PortfolioService } from './application/services/portfolio.service';
import { SlippageService } from './application/services/slippage.service';
import {
  BACKTEST_METRIC_REPOSITORY,
  BACKTEST_ORDER_REPOSITORY,
  BACKTEST_POSITION_REPOSITORY,
  BACKTEST_SNAPSHOT_REPOSITORY,
  BACKTEST_TASK_REPOSITORY,
  BACKTEST_TRADE_REPOSITORY,
} from './domain/repositories/backtest.repositories';
import {
  PrismaBacktestAccountSnapshotRepository,
  PrismaBacktestMetricRepository,
  PrismaBacktestOrderRepository,
  PrismaBacktestPositionRepository,
  PrismaBacktestTaskRepository,
  PrismaBacktestTradeRepository,
} from './infrastructure/prisma-backtest.repositories';
import { BacktestController } from './presentation/backtest.controller';

@Module({
  imports: [StrategyModule, DataModule, RiskModule],
  controllers: [BacktestController],
  providers: [
    BacktestEngineService,
    FeeCalculatorService,
    SlippageService,
    MatchingEngineService,
    PortfolioService,
    OrderGeneratorService,
    MetricsService,
    { provide: BACKTEST_TASK_REPOSITORY, useClass: PrismaBacktestTaskRepository },
    { provide: BACKTEST_SNAPSHOT_REPOSITORY, useClass: PrismaBacktestAccountSnapshotRepository },
    { provide: BACKTEST_POSITION_REPOSITORY, useClass: PrismaBacktestPositionRepository },
    { provide: BACKTEST_ORDER_REPOSITORY, useClass: PrismaBacktestOrderRepository },
    { provide: BACKTEST_TRADE_REPOSITORY, useClass: PrismaBacktestTradeRepository },
    { provide: BACKTEST_METRIC_REPOSITORY, useClass: PrismaBacktestMetricRepository },
  ],
  exports: [BacktestEngineService],
})
export class BacktestModule {}
