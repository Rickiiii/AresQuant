import { Module } from '@nestjs/common';
import { BacktestModule } from '../backtest/backtest.module';
import { DataModule } from '../data/data.module';
import { StrategyModule } from '../strategy/strategy.module';
import { DashboardService } from './application/dashboard.service';
import { DashboardController } from './presentation/dashboard.controller';

@Module({
  imports: [DataModule, BacktestModule, StrategyModule],
  controllers: [DashboardController],
  providers: [DashboardService],
  exports: [DashboardService],
})
export class DashboardModule {}
