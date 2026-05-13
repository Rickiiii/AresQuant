import { Injectable } from '@nestjs/common';
import { BacktestOrderSide } from '@prisma/client';
import { Decimal } from 'decimal.js';
import type { BacktestConfig, FeeDetail } from '../../types/backtest.types';

@Injectable()
export class FeeCalculatorService {
  calculateBuyFee(amount: Decimal, config?: BacktestConfig): FeeDetail {
    return this.calculateTotalFee(BacktestOrderSide.BUY, amount, config);
  }

  calculateSellFee(amount: Decimal, config?: BacktestConfig): FeeDetail {
    return this.calculateTotalFee(BacktestOrderSide.SELL, amount, config);
  }

  calculateTotalFee(side: BacktestOrderSide, amount: Decimal, config?: BacktestConfig): FeeDetail {
    const commissionRate = config?.commissionRate ?? new Decimal(0.00025);
    const minCommission = config?.minCommission ?? new Decimal(5);
    const stampDutyRate = config?.stampDutyRate ?? new Decimal(0.001);
    const transferFeeRate = config?.transferFeeRate ?? new Decimal(0.00001);
    const commission = Decimal.max(amount.mul(commissionRate), minCommission).toDecimalPlaces(6);
    const stampDuty = side === BacktestOrderSide.SELL ? amount.mul(stampDutyRate).toDecimalPlaces(6) : new Decimal(0);
    const transferFee = amount.mul(transferFeeRate).toDecimalPlaces(6);
    const totalFee = commission.plus(stampDuty).plus(transferFee).toDecimalPlaces(6);
    return { commission, stampDuty, transferFee, totalFee };
  }
}
