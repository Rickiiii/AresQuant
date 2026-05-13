import { BacktestOrderSide } from '@prisma/client';
import { Decimal } from 'decimal.js';
import { FeeCalculatorService } from './fee-calculator.service';

describe('FeeCalculatorService', () => {
  const service = new FeeCalculatorService();

  it('uses minimum commission for small buy orders', () => {
    const fee = service.calculateBuyFee(new Decimal(1000));
    expect(fee.commission.toNumber()).toBe(5);
    expect(fee.stampDuty.toNumber()).toBe(0);
  });

  it('charges stamp duty only for sell orders', () => {
    const buy = service.calculateTotalFee(BacktestOrderSide.BUY, new Decimal(100000));
    const sell = service.calculateTotalFee(BacktestOrderSide.SELL, new Decimal(100000));
    expect(sell.totalFee.greaterThan(buy.totalFee)).toBe(true);
  });
});
