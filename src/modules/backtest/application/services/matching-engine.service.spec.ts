import { BacktestOrderSide, BacktestOrderStatus, BacktestOrderType } from '@prisma/client';
import { Decimal } from 'decimal.js';
import { BacktestFrequency, BacktestPriceMode, type BacktestConfig, type BacktestOrderRecord, type MarketBar, type PortfolioState } from '../../types/backtest.types';
import { FeeCalculatorService } from './fee-calculator.service';
import { MatchingEngineService } from './matching-engine.service';
import { SlippageService } from './slippage.service';

describe('MatchingEngineService', () => {
  const service = new MatchingEngineService(new FeeCalculatorService(), new SlippageService());
  const config = makeConfig();
  const bar = makeBar();

  it('matches a normal buy order', async () => {
    const result = await service.matchOrder(makeOrder(BacktestOrderSide.BUY, 100), { config, portfolio: makePortfolio(new Decimal(100000)), bar });
    expect(result.order.status).toBe(BacktestOrderStatus.FILLED);
    expect(result.trade?.quantity).toBe(100);
  });

  it('rejects limit-up buys, limit-down sells, suspension, insufficient cash and lot errors', async () => {
    await expect(service.matchOrder(makeOrder(BacktestOrderSide.BUY, 100), { config, portfolio: makePortfolio(new Decimal(100000)), bar: { ...bar, isLimitUp: true } })).resolves.toMatchObject({ rejectedReason: 'LIMIT_UP' });
    await expect(service.matchOrder(makeOrder(BacktestOrderSide.SELL, 100), { config, portfolio: makePortfolio(new Decimal(100000), 100), bar: { ...bar, isLimitDown: true } })).resolves.toMatchObject({ rejectedReason: 'LIMIT_DOWN' });
    await expect(service.matchOrder(makeOrder(BacktestOrderSide.BUY, 100), { config, portfolio: makePortfolio(new Decimal(100000)), bar: { ...bar, isSuspended: true } })).resolves.toMatchObject({ rejectedReason: 'SUSPENDED' });
    await expect(service.matchOrder(makeOrder(BacktestOrderSide.BUY, 100), { config, portfolio: makePortfolio(new Decimal(1)), bar })).resolves.toMatchObject({ rejectedReason: 'INSUFFICIENT_CASH' });
    await expect(service.matchOrder(makeOrder(BacktestOrderSide.BUY, 99), { config, portfolio: makePortfolio(new Decimal(100000)), bar })).resolves.toMatchObject({ rejectedReason: 'INVALID_LOT_SIZE' });
  });

  it('rejects T+1 and insufficient position sells', async () => {
    await expect(service.matchOrder(makeOrder(BacktestOrderSide.SELL, 100), { config, portfolio: makePortfolio(new Decimal(0), 100, 0), bar })).resolves.toMatchObject({ rejectedReason: 'T1_RESTRICTED' });
    await expect(service.matchOrder(makeOrder(BacktestOrderSide.SELL, 100), { config, portfolio: makePortfolio(new Decimal(0), 0, 0), bar })).resolves.toMatchObject({ rejectedReason: 'INSUFFICIENT_POSITION' });
  });
});

function makeOrder(side: BacktestOrderSide, quantity: number): BacktestOrderRecord {
  return { id: 'order-1', taskId: 'task-1', symbol: '000001', tradeDate: '20260514', side, orderType: BacktestOrderType.MARKET, price: new Decimal(10), quantity, filledQuantity: 0, status: BacktestOrderStatus.PENDING };
}

function makePortfolio(cash: Decimal, quantity = 0, availableQuantity = quantity): PortfolioState {
  return { cash, marketValue: new Decimal(quantity * 10), totalAsset: cash.plus(quantity * 10), positions: quantity === 0 ? [] : [{ symbol: '000001', quantity, availableQuantity, avgCost: new Decimal(10), lastPrice: new Decimal(10), marketValue: new Decimal(quantity * 10), unrealizedPnl: new Decimal(0), realizedPnl: new Decimal(0) }] };
}

function makeBar(): MarketBar {
  return { symbol: '000001', tradeDate: '20260514', open: new Decimal(10), high: new Decimal(11), low: new Decimal(9), close: new Decimal(10), volume: new Decimal(100000), amount: new Decimal(1000000), isSuspended: false, isLimitUp: false, isLimitDown: false };
}

function makeConfig(): BacktestConfig {
  return { name: 't', strategyName: 'equal_weight_mock', startDate: '20260511', endDate: '20260515', initialCapital: new Decimal(1000000), frequency: BacktestFrequency.DAILY, rebalanceFrequency: 1, maxPositions: 2, maxPositionWeight: new Decimal(0.5), commissionRate: new Decimal(0.00025), minCommission: new Decimal(5), stampDutyRate: new Decimal(0.001), transferFeeRate: new Decimal(0.00001), slippageRate: new Decimal(0), allowBuyLimitUp: false, allowSellLimitDown: false, enableT1Rule: true, priceMode: BacktestPriceMode.CLOSE, blacklist: [] };
}
