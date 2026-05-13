import { BacktestOrderSide } from '@prisma/client';
import { Decimal } from 'decimal.js';
import { OrderGeneratorService } from './order-generator.service';

describe('OrderGeneratorService', () => {
  it('generates sells before buys and rounds buys to 100-share lots', () => {
    const service = new OrderGeneratorService();
    service.setReferencePrices(new Map([['000002', new Decimal(10)]]));
    const orders = service.generateRebalanceOrders({
      cash: new Decimal(5000),
      marketValue: new Decimal(10000),
      totalAsset: new Decimal(15000),
      positions: [{ symbol: '000001', quantity: 1000, availableQuantity: 1000, avgCost: new Decimal(10), lastPrice: new Decimal(10), marketValue: new Decimal(10000), unrealizedPnl: new Decimal(0), realizedPnl: new Decimal(0) }],
    }, [
      { symbol: '000001', weight: new Decimal(0), reason: 'clear' },
      { symbol: '000002', weight: new Decimal(0.5), reason: 'buy' },
    ], '20260514', 'task');

    expect(orders[0]?.side).toBe(BacktestOrderSide.SELL);
    expect(orders[1]?.quantity).toBe(700);
  });
});
