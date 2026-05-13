import { BacktestOrderSide } from '@prisma/client';
import { Decimal } from 'decimal.js';
import { BacktestPriceMode } from '../../types/backtest.types';
import { SlippageService } from './slippage.service';

describe('SlippageService', () => {
  const service = new SlippageService();

  it('raises buy execution price and lowers sell execution price', () => {
    const buy = service.calculateExecutionPrice({ side: BacktestOrderSide.BUY, basePrice: new Decimal(10), slippageRate: new Decimal(0.01), priceMode: BacktestPriceMode.CLOSE });
    const sell = service.calculateExecutionPrice({ side: BacktestOrderSide.SELL, basePrice: new Decimal(10), slippageRate: new Decimal(0.01), priceMode: BacktestPriceMode.CLOSE });
    expect(buy.toNumber()).toBe(10.1);
    expect(sell.toNumber()).toBe(9.9);
  });
});
