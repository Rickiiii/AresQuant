import { Inject, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { AppConfig } from '@/config/app.config';
import type { DailyBarRepository } from '../domain/repositories/daily-bar.repository';
import { DAILY_BAR_REPOSITORY } from '../domain/repositories/daily-bar.repository';

export interface DailyBarSyncCommand {
  readonly tsCode?: string;
  readonly fromDate: Date;
  readonly toDate: Date;
}

export interface DailyBarSyncResult {
  readonly source: string;
  readonly syncedRows: number;
}

@Injectable()
export class DailyBarSyncService {
  private readonly logger = new Logger(DailyBarSyncService.name);

  constructor(
    @Inject(DAILY_BAR_REPOSITORY) private readonly dailyBarRepository: DailyBarRepository,
    private readonly configService: ConfigService,
  ) {}

  async syncDailyBars(command: DailyBarSyncCommand): Promise<DailyBarSyncResult> {
    if (command.fromDate > command.toDate) {
      throw new Error('fromDate must be earlier than or equal to toDate');
    }

    const appConfig = this.configService.getOrThrow<AppConfig>('app');
    this.logger.log(`Starting daily bar sync from ${command.fromDate.toISOString()} to ${command.toDate.toISOString()}`);

    try {
      const syncedRows = await this.dailyBarRepository.upsertMany([]);
      this.logger.log(`Daily bar sync completed, rows=${syncedRows}, source=${appConfig.dataSyncSource}`);
      return {
        source: appConfig.dataSyncSource,
        syncedRows,
      };
    } catch (error) {
      this.logger.error('Daily bar sync failed', error instanceof Error ? error.stack : String(error));
      throw error;
    }
  }
}
