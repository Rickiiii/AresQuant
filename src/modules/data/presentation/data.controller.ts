import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { DailyBarSyncService, type DailyBarSyncResult } from '../application/daily-bar-sync.service';
import { SyncDailyBarsDto } from './dto/sync-daily-bars.dto';

@ApiTags('data')
@Controller('data')
export class DataController {
  constructor(private readonly dailyBarSyncService: DailyBarSyncService) {}

  @Post('daily-bars/sync')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ description: 'Daily bar synchronization result' })
  async syncDailyBars(@Body() dto: SyncDailyBarsDto): Promise<DailyBarSyncResult> {
    const command = {
      fromDate: new Date(dto.fromDate),
      toDate: new Date(dto.toDate),
      ...(dto.tsCode === undefined ? {} : { tsCode: dto.tsCode }),
    };
    return this.dailyBarSyncService.syncDailyBars(command);
  }
}
