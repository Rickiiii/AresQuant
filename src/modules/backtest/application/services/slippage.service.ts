import { Injectable } from '@nestjs/common';
import { BacktestOrderSide } from '@prisma/client';
import { Decimal } from 'decimal.js';
import type { SlippageParams } from '../../types/backtest.types';

@Injectable()
export class SlippageService {
  calculateExecutionPrice(params: SlippageParams): Decimal {
    const multiplier = params.side === BacktestOrderSide.BUY
      ? params.slippageRate.plus(1)
      : new Decimal(1).minus(params.slippageRate);
    return params.basePrice.mul(multiplier).toDecimalPlaces(6);
  }
}
