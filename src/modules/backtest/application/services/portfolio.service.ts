import { Injectable } from '@nestjs/common';
import { BacktestOrderSide } from '@prisma/client';
import { Decimal } from 'decimal.js';
import type { BacktestAccountSnapshotRecord, BacktestPositionState, BacktestTradeRecord, MarketBar, PortfolioState } from '../../types/backtest.types';

@Injectable()
export class PortfolioService {
  private cash = new Decimal(0);
  private positions = new Map<string, BacktestPositionState>();
  private initialCapital = new Decimal(0);
  private previousTotalAsset = new Decimal(0);
  private peakTotalAsset = new Decimal(0);

  initializePortfolio(initialCapital: Decimal): PortfolioState {
    this.cash = initialCapital;
    this.initialCapital = initialCapital;
    this.previousTotalAsset = initialCapital;
    this.peakTotalAsset = initialCapital;
    this.positions = new Map();
    return this.currentState();
  }

  updateMarketValue(_date: string, bars: readonly MarketBar[]): void {
    for (const bar of bars) {
      const position = this.positions.get(bar.symbol);
      if (position === undefined) {
        continue;
      }
      const marketValue = bar.close.mul(position.quantity);
      this.positions.set(bar.symbol, {
        ...position,
        lastPrice: bar.close,
        marketValue,
        unrealizedPnl: marketValue.minus(position.avgCost.mul(position.quantity)),
      });
    }
  }

  applyTrade(trade: BacktestTradeRecord): void {
    if (trade.side === BacktestOrderSide.BUY) {
      this.applyBuy(trade);
      return;
    }
    this.applySell(trade);
  }

  getCurrentPositions(): readonly BacktestPositionState[] {
    return [...this.positions.values()].filter((position) => position.quantity > 0);
  }

  getAvailableCash(): Decimal {
    return this.cash;
  }

  calculateTotalAsset(): Decimal {
    return this.cash.plus(this.calculateMarketValue());
  }

  createSnapshot(taskId: string, date: string): BacktestAccountSnapshotRecord {
    const marketValue = this.calculateMarketValue();
    const totalAsset = this.cash.plus(marketValue);
    this.peakTotalAsset = Decimal.max(this.peakTotalAsset, totalAsset);
    const dailyReturn = this.previousTotalAsset.eq(0) ? new Decimal(0) : totalAsset.minus(this.previousTotalAsset).div(this.previousTotalAsset);
    const cumulativeReturn = this.initialCapital.eq(0) ? new Decimal(0) : totalAsset.minus(this.initialCapital).div(this.initialCapital);
    const drawdown = this.peakTotalAsset.eq(0) ? new Decimal(0) : totalAsset.minus(this.peakTotalAsset).div(this.peakTotalAsset);
    this.previousTotalAsset = totalAsset;
    return { taskId, tradeDate: date, cash: this.cash, marketValue, totalAsset, dailyReturn, cumulativeReturn, drawdown };
  }

  releaseT1(date: string): void {
    for (const [symbol, position] of this.positions.entries()) {
      if (position.lastBuyDate !== date) {
        this.positions.set(symbol, { ...position, availableQuantity: position.quantity });
      }
    }
  }

  currentState(): PortfolioState {
    const positions = this.getCurrentPositions();
    const marketValue = this.calculateMarketValue();
    return { cash: this.cash, positions, marketValue, totalAsset: this.cash.plus(marketValue) };
  }

  private applyBuy(trade: BacktestTradeRecord): void {
    const totalCost = trade.amount.plus(trade.totalFee);
    this.cash = this.cash.minus(totalCost);
    const existing = this.positions.get(trade.symbol);
    const quantity = (existing?.quantity ?? 0) + trade.quantity;
    const previousCost = existing?.avgCost.mul(existing.quantity) ?? new Decimal(0);
    const avgCost = previousCost.plus(trade.amount).div(quantity).toDecimalPlaces(6);
    this.positions.set(trade.symbol, {
      symbol: trade.symbol,
      quantity,
      availableQuantity: existing?.availableQuantity ?? 0,
      avgCost,
      lastPrice: trade.price,
      marketValue: trade.price.mul(quantity),
      unrealizedPnl: trade.price.minus(avgCost).mul(quantity),
      realizedPnl: existing?.realizedPnl ?? new Decimal(0),
      lastBuyDate: trade.tradeDate,
    });
  }

  private applySell(trade: BacktestTradeRecord): void {
    const existing = this.positions.get(trade.symbol);
    if (existing === undefined) {
      throw new Error(`Cannot sell missing position: ${trade.symbol}`);
    }
    this.cash = this.cash.plus(trade.amount.minus(trade.totalFee));
    const quantity = existing.quantity - trade.quantity;
    const realizedPnl = existing.realizedPnl.plus(trade.price.minus(existing.avgCost).mul(trade.quantity).minus(trade.totalFee));
    if (quantity <= 0) {
      this.positions.delete(trade.symbol);
      return;
    }
    this.positions.set(trade.symbol, {
      ...existing,
      quantity,
      availableQuantity: Math.min(existing.availableQuantity - trade.quantity, quantity),
      marketValue: existing.lastPrice.mul(quantity),
      unrealizedPnl: existing.lastPrice.minus(existing.avgCost).mul(quantity),
      realizedPnl,
    });
  }

  private calculateMarketValue(): Decimal {
    return [...this.positions.values()].reduce((sum, position) => sum.plus(position.marketValue), new Decimal(0));
  }
}
