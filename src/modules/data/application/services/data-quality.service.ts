import { Inject, Injectable, Logger } from '@nestjs/common';
import {
  ADJ_FACTOR_REPOSITORY,
  PHASE2_DAILY_BAR_REPOSITORY,
  STOCK_REPOSITORY,
  TRADING_CALENDAR_REPOSITORY,
  type AdjFactorRepository,
  type Phase2DailyBarRepository,
  type StockRepository,
  type TradingCalendarRepository,
} from '../../domain/repositories/data-center.repositories';
import { DataQualityIssueType, type DataQualityIssue, type DailyBarRawData } from '../../domain/types/market-data.types';

@Injectable()
export class DataQualityService {
  private readonly logger = new Logger(DataQualityService.name);

  constructor(
    @Inject(PHASE2_DAILY_BAR_REPOSITORY) private readonly dailyBarRepository: Phase2DailyBarRepository,
    @Inject(TRADING_CALENDAR_REPOSITORY) private readonly calendarRepository: TradingCalendarRepository,
    @Inject(STOCK_REPOSITORY) private readonly stockRepository: StockRepository,
    @Inject(ADJ_FACTOR_REPOSITORY) private readonly adjFactorRepository: AdjFactorRepository,
  ) {}

  async checkDailyBars(symbol: string, startDate: string, endDate: string): Promise<readonly DataQualityIssue[]> {
    this.logger.log(`Checking daily bar quality symbol=${symbol}, start=${startDate}, end=${endDate}`);
    const [bars, calendars, stock, factors] = await Promise.all([
      this.dailyBarRepository.findByDateRange(symbol, { startDate, endDate }),
      this.calendarRepository.findByDateRange({ startDate, endDate }),
      this.stockRepository.findBySymbol(symbol),
      this.adjFactorRepository.findByDateRange(symbol, { startDate, endDate }),
    ]);

    const issues: DataQualityIssue[] = [];
    const seen = new Set<string>();
    const factorDates = new Set(factors.map((factor) => factor.tradeDate));
    for (const bar of bars) {
      issues.push(...this.validateBar(bar, stock?.isST ?? false));
      if (seen.has(bar.tradeDate)) {
        issues.push(issue(symbol, bar.tradeDate, DataQualityIssueType.DUPLICATE_RECORD, 'HIGH', 'Duplicate daily bar record'));
      }
      seen.add(bar.tradeDate);
      if (!factorDates.has(bar.tradeDate)) {
        issues.push(issue(symbol, bar.tradeDate, DataQualityIssueType.MISSING_ADJ_FACTOR, 'MEDIUM', 'Missing adjustment factor'));
      }
    }

    const barDates = new Set(bars.map((bar) => bar.tradeDate));
    for (const calendar of calendars) {
      if (calendar.isOpen && !barDates.has(calendar.tradeDate)) {
        issues.push(issue(symbol, calendar.tradeDate, DataQualityIssueType.MISSING_TRADE_DATE, 'HIGH', 'Missing daily bar for open trading date'));
      }
    }
    return issues;
  }

  validateBar(bar: DailyBarRawData, isST: boolean): readonly DataQualityIssue[] {
    const issues: DataQualityIssue[] = [];
    if (bar.high < bar.open || bar.high < bar.close || bar.low > bar.open || bar.low > bar.close || bar.high < bar.low) {
      issues.push(issue(bar.symbol, bar.tradeDate, DataQualityIssueType.INVALID_OHLC, 'HIGH', 'Invalid OHLC relationship'));
    }
    if ([bar.open, bar.high, bar.low, bar.close, bar.preClose].some((value) => value < 0)) {
      issues.push(issue(bar.symbol, bar.tradeDate, DataQualityIssueType.NEGATIVE_PRICE, 'HIGH', 'Price field must not be negative'));
    }
    if (bar.volume < 0 || bar.amount < 0) {
      issues.push(issue(bar.symbol, bar.tradeDate, DataQualityIssueType.NEGATIVE_VOLUME, 'HIGH', 'Volume and amount must not be negative'));
    }
    const threshold = isST ? 6 : 11;
    if (Math.abs(bar.pctChange) > threshold) {
      issues.push(issue(bar.symbol, bar.tradeDate, DataQualityIssueType.ABNORMAL_PCT_CHANGE, 'MEDIUM', `Pct change exceeds ${threshold}% threshold`));
    }
    return issues;
  }
}

function issue(symbol: string, tradeDate: string, type: DataQualityIssueType, severity: 'LOW' | 'MEDIUM' | 'HIGH', message: string): DataQualityIssue {
  return { symbol, tradeDate, type, severity, message };
}
