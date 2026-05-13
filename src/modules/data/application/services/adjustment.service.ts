import { Inject, Injectable, Logger } from '@nestjs/common';
import {
  ADJ_FACTOR_REPOSITORY,
  PHASE2_DAILY_BAR_REPOSITORY,
  type AdjFactorRepository,
  type Phase2DailyBarRepository,
} from '../../domain/repositories/data-center.repositories';
import type { AdjustedDailyBar, AdjustmentType, AdjFactorRawData, DailyBarRawData } from '../../domain/types/market-data.types';

@Injectable()
export class AdjustmentService {
  private readonly logger = new Logger(AdjustmentService.name);

  constructor(
    @Inject(PHASE2_DAILY_BAR_REPOSITORY) private readonly dailyBarRepository: Phase2DailyBarRepository,
    @Inject(ADJ_FACTOR_REPOSITORY) private readonly adjFactorRepository: AdjFactorRepository,
  ) {}

  async getForwardAdjustedBars(symbol: string, startDate: string, endDate: string): Promise<readonly AdjustedDailyBar[]> {
    const [bars, factors] = await this.loadInputs(symbol, startDate, endDate);
    return this.calculateAdjustedBars(bars, factors, 'forward');
  }

  async getBackwardAdjustedBars(symbol: string, startDate: string, endDate: string): Promise<readonly AdjustedDailyBar[]> {
    const [bars, factors] = await this.loadInputs(symbol, startDate, endDate);
    return this.calculateAdjustedBars(bars, factors, 'backward');
  }

  calculateAdjustedPrice(price: number, factor: number, baseFactor: number): number {
    if (factor <= 0 || baseFactor <= 0) {
      throw new Error('Adjustment factors must be positive');
    }
    return round((price * factor) / baseFactor);
  }

  calculateAdjustedBars(
    bars: readonly DailyBarRawData[],
    factors: readonly AdjFactorRawData[],
    type: Exclude<AdjustmentType, 'none'>,
  ): readonly AdjustedDailyBar[] {
    if (bars.length === 0) {
      return [];
    }
    const factorByDate = new Map(factors.map((factor) => [factor.tradeDate, factor.factor]));
    const availableFactors = bars.map((bar) => factorByDate.get(bar.tradeDate)).filter((factor): factor is number => factor !== undefined);
    if (availableFactors.length === 0) {
      throw new Error('No adjustment factors found for daily bars');
    }
    const baseFactor = type === 'forward' ? availableFactors[availableFactors.length - 1] : availableFactors[0];
    if (baseFactor === undefined) {
      throw new Error('Base adjustment factor not found');
    }

    return bars.map((bar) => {
      const factor = factorByDate.get(bar.tradeDate);
      if (factor === undefined) {
        throw new Error(`Missing adjustment factor for ${bar.symbol} ${bar.tradeDate}`);
      }
      this.logger.debug(`Adjusting ${bar.symbol} ${bar.tradeDate} type=${type}`);
      return {
        ...bar,
        adjustment: type,
        factor,
        open: this.calculateAdjustedPrice(bar.open, factor, baseFactor),
        high: this.calculateAdjustedPrice(bar.high, factor, baseFactor),
        low: this.calculateAdjustedPrice(bar.low, factor, baseFactor),
        close: this.calculateAdjustedPrice(bar.close, factor, baseFactor),
        preClose: this.calculateAdjustedPrice(bar.preClose, factor, baseFactor),
      };
    });
  }

  private async loadInputs(symbol: string, startDate: string, endDate: string): Promise<readonly [readonly DailyBarRawData[], readonly AdjFactorRawData[]]> {
    return Promise.all([
      this.dailyBarRepository.findByDateRange(symbol, { startDate, endDate }),
      this.adjFactorRepository.findByDateRange(symbol, { startDate, endDate }),
    ]);
  }
}

function round(value: number): number {
  return Math.round(value * 1_000_000) / 1_000_000;
}
