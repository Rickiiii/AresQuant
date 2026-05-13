import { Module } from '@nestjs/common';
import { DailyBarSyncService } from './application/daily-bar-sync.service';
import { DAILY_BAR_REPOSITORY } from './domain/repositories/daily-bar.repository';
import { PrismaDailyBarRepository } from './infrastructure/prisma-daily-bar.repository';
import { DataController } from './presentation/data.controller';

@Module({
  controllers: [DataController],
  providers: [
    DailyBarSyncService,
    {
      provide: DAILY_BAR_REPOSITORY,
      useClass: PrismaDailyBarRepository,
    },
  ],
  exports: [DailyBarSyncService, DAILY_BAR_REPOSITORY],
})
export class DataModule {}
