import { Body, Controller, Get, HttpCode, HttpStatus, Inject, Param, Post, Query } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { ok, type ApiResponse } from '@/common/types/api-response';
import { AdjustmentService } from '../application/services/adjustment.service';
import { DataQualityService } from '../application/services/data-quality.service';
import { DataSyncService, type DataSyncHealthSummary, type EastmoneySmokeCheckResult } from '../application/services/data-sync.service';
import {
  ADJ_FACTOR_REPOSITORY,
  FINANCIAL_FACTOR_REPOSITORY,
  INDEX_DAILY_BAR_REPOSITORY,
  LIMIT_PRICE_REPOSITORY,
  PHASE2_DAILY_BAR_REPOSITORY,
  STOCK_REPOSITORY,
  SUSPENSION_REPOSITORY,
  TRADING_CALENDAR_REPOSITORY,
  type AdjFactorRepository,
  type FinancialFactorRepository,
  type IndexDailyBarRepository,
  type LimitPriceRepository,
  type Phase2DailyBarRepository,
  type StockRepository,
  type SuspensionRepository,
  type TradingCalendarRepository,
} from '../domain/repositories/data-center.repositories';
import type {
  AdjustedDailyBar,
  DataQualityIssue,
  DataSyncResult,
  DailyBarRawData,
  FinancialFactorRawData,
  IndexDailyBarRawData,
  LimitPriceRawData,
  StockRawData,
  SuspensionRawData,
  TradingCalendarRawData,
} from '../domain/types/market-data.types';
import {
  DailyBarsQueryDto,
  DateRangeQueryDto,
  IndexBarsQueryDto,
  QualityCheckRequestDto,
  SyncAllRequestDto,
  SyncCoreRequestDto,
  SyncDailyBarsRequestDto,
  TradeDateQueryDto,
} from './dto/data-query.dto';

@ApiTags('data')
@Controller('data')
export class DataController {
  constructor(
    private readonly dataSyncService: DataSyncService,
    private readonly dataQualityService: DataQualityService,
    private readonly adjustmentService: AdjustmentService,
    @Inject(STOCK_REPOSITORY) private readonly stockRepository: StockRepository,
    @Inject(TRADING_CALENDAR_REPOSITORY) private readonly tradingCalendarRepository: TradingCalendarRepository,
    @Inject(PHASE2_DAILY_BAR_REPOSITORY) private readonly dailyBarRepository: Phase2DailyBarRepository,
    @Inject(INDEX_DAILY_BAR_REPOSITORY) private readonly indexDailyBarRepository: IndexDailyBarRepository,
    @Inject(LIMIT_PRICE_REPOSITORY) private readonly limitPriceRepository: LimitPriceRepository,
    @Inject(SUSPENSION_REPOSITORY) private readonly suspensionRepository: SuspensionRepository,
    @Inject(ADJ_FACTOR_REPOSITORY) private readonly adjFactorRepository: AdjFactorRepository,
    @Inject(FINANCIAL_FACTOR_REPOSITORY) private readonly financialFactorRepository: FinancialFactorRepository,
  ) {}

  @Get('stocks')
  @ApiOkResponse({ description: 'Stock list' })
  async getStocks(): Promise<ApiResponse<readonly StockRawData[]>> {
    return ok(await this.stockRepository.findAll());
  }

  @Get('stocks/:symbol')
  @ApiOkResponse({ description: 'Stock by symbol' })
  async getStock(@Param('symbol') symbol: string): Promise<ApiResponse<StockRawData | null>> {
    return ok(await this.stockRepository.findBySymbol(symbol));
  }

  @Get('calendar')
  async getCalendar(@Query() query: DateRangeQueryDto): Promise<ApiResponse<readonly TradingCalendarRawData[]>> {
    return ok(await this.tradingCalendarRepository.findByDateRange({ startDate: normalizeDate(query.startDate), endDate: normalizeDate(query.endDate) }));
  }

  @Get('bars/daily')
  async getDailyBars(@Query() query: DailyBarsQueryDto): Promise<ApiResponse<readonly DailyBarRawData[] | readonly AdjustedDailyBar[]>> {
    const startDate = normalizeDate(query.startDate);
    const endDate = normalizeDate(query.endDate);
    if (query.adjustment === 'forward') {
      return ok(await this.adjustmentService.getForwardAdjustedBars(query.symbol, startDate, endDate));
    }
    if (query.adjustment === 'backward') {
      return ok(await this.adjustmentService.getBackwardAdjustedBars(query.symbol, startDate, endDate));
    }
    return ok(await this.dailyBarRepository.findByDateRange(query.symbol, { startDate, endDate }));
  }

  @Get('bars/index')
  async getIndexBars(@Query() query: IndexBarsQueryDto): Promise<ApiResponse<readonly IndexDailyBarRawData[]>> {
    return ok(await this.indexDailyBarRepository.findByDateRange(query.indexCode, { startDate: normalizeDate(query.startDate), endDate: normalizeDate(query.endDate) }));
  }

  @Get('limit-prices')
  async getLimitPrices(@Query() query: TradeDateQueryDto): Promise<ApiResponse<readonly LimitPriceRawData[]>> {
    return ok(await this.limitPriceRepository.findByTradeDate(normalizeDate(query.tradeDate)));
  }

  @Get('suspensions')
  async getSuspensions(@Query() query: TradeDateQueryDto): Promise<ApiResponse<readonly SuspensionRawData[]>> {
    return ok(await this.suspensionRepository.findByTradeDate(normalizeDate(query.tradeDate)));
  }

  @Get('financial-factors')
  async getFinancialFactors(@Query('symbol') symbol: string): Promise<ApiResponse<readonly FinancialFactorRawData[]>> {
    return ok(await this.financialFactorRepository.findBySymbol(symbol));
  }

  @Get('adj-factors')
  async getAdjFactors(@Query('symbol') symbol: string): Promise<ApiResponse<readonly unknown[]>> {
    return ok(await this.adjFactorRepository.findBySymbol(symbol));
  }

  @Post('sync/stocks')
  @HttpCode(HttpStatus.OK)
  async syncStocks(): Promise<ApiResponse<DataSyncResult>> {
    return ok(await this.dataSyncService.syncStocks());
  }

  @Get('sync/health')
  async getSyncHealth(): Promise<ApiResponse<DataSyncHealthSummary>> {
    return ok(await this.dataSyncService.getSyncHealth());
  }

  @Post('sync/daily-bars')
  @HttpCode(HttpStatus.OK)
  async syncDailyBars(@Body() dto: SyncDailyBarsRequestDto): Promise<ApiResponse<DataSyncResult>> {
    return ok(await this.dataSyncService.syncDailyBars(dto.symbols, normalizeDate(dto.startDate), normalizeDate(dto.endDate)));
  }

  @Post('sync/all')
  @HttpCode(HttpStatus.OK)
  async syncAll(@Body() dto: SyncAllRequestDto): Promise<ApiResponse<readonly DataSyncResult[]>> {
    return ok(await this.dataSyncService.syncAll(normalizeDate(dto.startDate), normalizeDate(dto.endDate)));
  }

  @Post('sync/core')
  @HttpCode(HttpStatus.OK)
  async syncCore(@Body() dto: SyncCoreRequestDto): Promise<ApiResponse<readonly DataSyncResult[]>> {
    return ok(await this.dataSyncService.syncCore(normalizeDate(dto.startDate), normalizeDate(dto.endDate), dto.symbols));
  }

  @Post('sync/eastmoney/smoke-check')
  @HttpCode(HttpStatus.OK)
  async smokeCheckEastmoney(): Promise<ApiResponse<EastmoneySmokeCheckResult>> {
    return ok(await this.dataSyncService.smokeCheckEastmoney());
  }

  @Post('quality/check')
  @HttpCode(HttpStatus.OK)
  async checkQuality(@Body() dto: QualityCheckRequestDto): Promise<ApiResponse<readonly DataQualityIssue[]>> {
    return ok(await this.dataQualityService.checkDailyBars(dto.symbol, normalizeDate(dto.startDate), normalizeDate(dto.endDate)));
  }
}

function normalizeDate(value: string): string {
  return value.replaceAll('-', '');
}
