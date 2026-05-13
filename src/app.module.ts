import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { BacktestModule } from './modules/backtest/backtest.module';
import { DataModule } from './modules/data/data.module';
import { StrategyModule } from './modules/strategy/strategy.module';
import { appConfig } from './config/app.config';
import { validateEnvironment } from './config/env.validation';
import { DatabaseModule } from './database/database.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig],
      validate: validateEnvironment,
    }),
    DatabaseModule,
    DataModule,
    BacktestModule,
    StrategyModule,
  ],
})
export class AppModule {}
