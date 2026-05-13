import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import type { Queue } from 'bullmq';
import { DATA_QUEUE } from './data-queue.constants';

export type DataJobName = 'sync-stocks' | 'sync-daily-bars' | 'sync-calendar' | 'sync-all' | 'quality-check';

export interface DateRangeJobPayload {
  readonly startDate: string;
  readonly endDate: string;
}

export interface SymbolsDateRangeJobPayload extends DateRangeJobPayload {
  readonly symbols: readonly string[];
}

export interface QualityCheckJobPayload extends DateRangeJobPayload {
  readonly symbol: string;
}

export type DataJobPayload = DateRangeJobPayload | SymbolsDateRangeJobPayload | QualityCheckJobPayload | Record<string, never>;

@Injectable()
export class DataQueueService {
  constructor(@InjectQueue(DATA_QUEUE) private readonly queue: Queue<DataJobPayload, unknown, DataJobName>) {}

  async addJob(name: DataJobName, payload: DataJobPayload): Promise<string> {
    const job = await this.queue.add(name, payload);
    return job.id ?? `${name}-${Date.now()}`;
  }
}
