import { Logger } from '@nestjs/common';
import { Processor, WorkerHost } from '@nestjs/bullmq';
import type { Job } from 'bullmq';
import { DataQualityService } from '../application/services/data-quality.service';
import { DataSyncService } from '../application/services/data-sync.service';
import { DATA_QUEUE } from './data-queue.constants';
import type { DataJobName, DataJobPayload, QualityCheckJobPayload, SymbolsDateRangeJobPayload, DateRangeJobPayload } from './data-queue.service';

@Processor(DATA_QUEUE)
export class DataQueueProcessor extends WorkerHost {
  private readonly logger = new Logger(DataQueueProcessor.name);

  constructor(
    private readonly dataSyncService: DataSyncService,
    private readonly dataQualityService: DataQualityService,
  ) {
    super();
  }

  async process(job: Job<DataJobPayload, unknown, DataJobName>): Promise<unknown> {
    this.logger.log(`Processing data job name=${job.name}, id=${job.id ?? 'unknown'}`);
    switch (job.name) {
      case 'sync-stocks':
        return this.dataSyncService.syncStocks();
      case 'sync-calendar': {
        const payload = job.data as DateRangeJobPayload;
        return this.dataSyncService.syncTradingCalendar(payload.startDate, payload.endDate);
      }
      case 'sync-daily-bars': {
        const payload = job.data as SymbolsDateRangeJobPayload;
        return this.dataSyncService.syncDailyBars(payload.symbols, payload.startDate, payload.endDate);
      }
      case 'sync-all': {
        const payload = job.data as DateRangeJobPayload;
        return this.dataSyncService.syncAll(payload.startDate, payload.endDate);
      }
      case 'quality-check': {
        const payload = job.data as QualityCheckJobPayload;
        return this.dataQualityService.checkDailyBars(payload.symbol, payload.startDate, payload.endDate);
      }
    }
  }
}
