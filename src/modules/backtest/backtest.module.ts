import { Module } from '@nestjs/common';
import { StrategyModule } from '../strategy/strategy.module';
import { BacktestEngineService } from './application/backtest-engine.service';

@Module({
  imports: [StrategyModule],
  providers: [BacktestEngineService],
  exports: [BacktestEngineService],
})
export class BacktestModule {}
