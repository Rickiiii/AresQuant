import { registerAs } from '@nestjs/config';

export interface AppConfig {
  readonly name: string;
  readonly port: number;
  readonly logLevel: string;
  readonly dataSyncBatchSize: number;
  readonly dataSyncSource: string;
  readonly backtestDefaultInitialCash: number;
  readonly backtestDefaultCommissionRate: number;
  readonly backtestDefaultSlippageRate: number;
}

export const appConfig = registerAs('app', (): AppConfig => {
  return {
    name: process.env.APP_NAME ?? 'AresQuant',
    port: Number(process.env.APP_PORT ?? 3000),
    logLevel: process.env.LOG_LEVEL ?? 'info',
    dataSyncBatchSize: Number(process.env.DATA_SYNC_BATCH_SIZE ?? 1000),
    dataSyncSource: process.env.DATA_SYNC_SOURCE ?? 'mock',
    backtestDefaultInitialCash: Number(process.env.BACKTEST_DEFAULT_INITIAL_CASH ?? 1_000_000),
    backtestDefaultCommissionRate: Number(process.env.BACKTEST_DEFAULT_COMMISSION_RATE ?? 0.0003),
    backtestDefaultSlippageRate: Number(process.env.BACKTEST_DEFAULT_SLIPPAGE_RATE ?? 0.0005),
  };
});
