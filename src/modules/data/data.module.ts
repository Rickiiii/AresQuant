import { Module } from '@nestjs/common';
import { DailyBarSyncService } from './application/daily-bar-sync.service';
import { AdjustmentService } from './application/services/adjustment.service';
import { DataQualityService } from './application/services/data-quality.service';
import { DataSyncService } from './application/services/data-sync.service';
import {
  ADJ_FACTOR_REPOSITORY,
  DATA_SYNC_LOG_REPOSITORY,
  FINANCIAL_FACTOR_REPOSITORY,
  INDEX_DAILY_BAR_REPOSITORY,
  LIMIT_PRICE_REPOSITORY,
  PHASE2_DAILY_BAR_REPOSITORY,
  STOCK_REPOSITORY,
  SUSPENSION_REPOSITORY,
  TRADING_CALENDAR_REPOSITORY,
} from './domain/repositories/data-center.repositories';
import { DAILY_BAR_REPOSITORY } from './domain/repositories/daily-bar.repository';
import { PrismaDailyBarRepository } from './infrastructure/prisma-daily-bar.repository';
import {
  PrismaAdjFactorRepository,
  PrismaDataSyncLogRepository,
  PrismaFinancialFactorRepository,
  PrismaIndexDailyBarRepository,
  PrismaLimitPriceRepository,
  PrismaPhase2DailyBarRepository,
  PrismaStockRepository,
  PrismaSuspensionRepository,
  PrismaTradingCalendarRepository,
} from './infrastructure/repositories/prisma-data-center.repositories';
import { DATA_PROVIDER } from './providers/data-provider.interface';
import { MockDataProvider } from './providers/mock/mock-data-provider';
import { DataQueueProcessor } from './queue/data-queue.processor';
import { DataQueueModule } from './queue/data-queue.module';
import { DataController } from './presentation/data.controller';

@Module({
  imports: [DataQueueModule],
  controllers: [DataController],
  providers: [
    DailyBarSyncService,
    DataSyncService,
    DataQualityService,
    AdjustmentService,
    DataQueueProcessor,
    MockDataProvider,
    {
      provide: DATA_PROVIDER,
      useClass: MockDataProvider,
    },
    {
      provide: DAILY_BAR_REPOSITORY,
      useClass: PrismaDailyBarRepository,
    },
    { provide: STOCK_REPOSITORY, useClass: PrismaStockRepository },
    { provide: TRADING_CALENDAR_REPOSITORY, useClass: PrismaTradingCalendarRepository },
    { provide: PHASE2_DAILY_BAR_REPOSITORY, useClass: PrismaPhase2DailyBarRepository },
    { provide: INDEX_DAILY_BAR_REPOSITORY, useClass: PrismaIndexDailyBarRepository },
    { provide: LIMIT_PRICE_REPOSITORY, useClass: PrismaLimitPriceRepository },
    { provide: SUSPENSION_REPOSITORY, useClass: PrismaSuspensionRepository },
    { provide: ADJ_FACTOR_REPOSITORY, useClass: PrismaAdjFactorRepository },
    { provide: FINANCIAL_FACTOR_REPOSITORY, useClass: PrismaFinancialFactorRepository },
    { provide: DATA_SYNC_LOG_REPOSITORY, useClass: PrismaDataSyncLogRepository },
  ],
  exports: [
    DailyBarSyncService,
    DataSyncService,
    DataQualityService,
    AdjustmentService,
    DAILY_BAR_REPOSITORY,
    STOCK_REPOSITORY,
    TRADING_CALENDAR_REPOSITORY,
    PHASE2_DAILY_BAR_REPOSITORY,
    INDEX_DAILY_BAR_REPOSITORY,
    LIMIT_PRICE_REPOSITORY,
    SUSPENSION_REPOSITORY,
    ADJ_FACTOR_REPOSITORY,
    FINANCIAL_FACTOR_REPOSITORY,
  ],
})
export class DataModule {}
