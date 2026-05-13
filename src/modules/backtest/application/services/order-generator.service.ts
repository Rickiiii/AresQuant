import { Injectable } from '@nestjs/common';
import { BacktestOrderSide, BacktestOrderStatus, BacktestOrderType } from '@prisma/client';
import { Decimal } from 'decimal.js';
import type { BacktestOrderRecord, PortfolioState, TargetPosition } from '../../types/backtest.types';

@Injectable()
export class OrderGeneratorService {
  private referencePrices = new Map<string, Decimal>();

  setReferencePrices(prices: ReadonlyMap<string, Decimal>): void {
    this.referencePrices = new Map(prices);
  }

  generateRebalanceOrders(currentPortfolio: PortfolioState, targetPositions: readonly TargetPosition[], date: string, taskId = 'pending'): readonly BacktestOrderRecord[] {
    const targets = new Map(targetPositions.map((target) => [target.symbol, target.weight]));
    const orders: BacktestOrderRecord[] = [];
    const positionMap = new Map(currentPortfolio.positions.map((position) => [position.symbol, position]));

    for (const position of currentPortfolio.positions) {
      const targetWeight = targets.get(position.symbol) ?? new Decimal(0);
      const targetValue = currentPortfolio.totalAsset.mul(targetWeight);
      const currentValue = position.marketValue;
      if (targetValue.greaterThanOrEqualTo(currentValue)) {
        continue;
      }
      const sellValue = currentValue.minus(targetValue);
      const quantity = Math.min(position.availableQuantity, floorToLot(sellValue.div(position.lastPrice).floor().toNumber()));
      if (quantity > 0) {
        orders.push(this.order(taskId, position.symbol, date, BacktestOrderSide.SELL, position.lastPrice, quantity));
      }
    }

    for (const target of targetPositions) {
      const price = this.referencePrices.get(target.symbol) ?? positionMap.get(target.symbol)?.lastPrice;
      if (price === undefined || price.lte(0)) {
        continue;
      }
      const currentValue = positionMap.get(target.symbol)?.marketValue ?? new Decimal(0);
      const targetValue = currentPortfolio.totalAsset.mul(target.weight);
      if (targetValue.lessThanOrEqualTo(currentValue)) {
        continue;
      }
      const quantity = floorToLot(targetValue.minus(currentValue).div(price).floor().toNumber());
      if (quantity >= 100) {
        orders.push(this.order(taskId, target.symbol, date, BacktestOrderSide.BUY, price, quantity));
      }
    }
    return orders;
  }

  private order(taskId: string, symbol: string, tradeDate: string, side: BacktestOrderSide, price: Decimal, quantity: number): BacktestOrderRecord {
    return { id: `${symbol}-${tradeDate}-${side}-${quantity}`, taskId, symbol, tradeDate, side, orderType: BacktestOrderType.MARKET, price, quantity, filledQuantity: 0, status: BacktestOrderStatus.PENDING };
  }
}

function floorToLot(quantity: number): number {
  return Math.floor(quantity / 100) * 100;
}
