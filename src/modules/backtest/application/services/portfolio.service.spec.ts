import { BacktestOrderSide } from '@prisma/client';
import { Decimal } from 'decimal.js';
import { PortfolioService } from './portfolio.service';

describe('PortfolioService', () => {
  it('applies buy and sell trades with T+1 availability', () => {
    const service = new PortfolioService();
    service.initializePortfolio(new Decimal(100000));
    service.applyTrade({ taskId: 'task', orderId: 'order', symbol: '000001', tradeDate: '20260514', side: BacktestOrderSide.BUY, price: new Decimal(10), quantity: 100, amount: new Decimal(1000), commission: new Decimal(5), stampDuty: new Decimal(0), transferFee: new Decimal(0.01), totalFee: new Decimal(5.01) });
    expect(service.getCurrentPositions()[0]?.availableQuantity).toBe(0);
    service.releaseT1('20260515');
    expect(service.getCurrentPositions()[0]?.availableQuantity).toBe(100);
    service.applyTrade({ taskId: 'task', orderId: 'order2', symbol: '000001', tradeDate: '20260515', side: BacktestOrderSide.SELL, price: new Decimal(11), quantity: 100, amount: new Decimal(1100), commission: new Decimal(5), stampDuty: new Decimal(1.1), transferFee: new Decimal(0.011), totalFee: new Decimal(6.111) });
    expect(service.getCurrentPositions()).toHaveLength(0);
    expect(service.getAvailableCash().greaterThan(100000)).toBe(true);
  });
});
