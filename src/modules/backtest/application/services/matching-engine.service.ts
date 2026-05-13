import { Injectable, Logger } from '@nestjs/common';
import { BacktestOrderSide, BacktestOrderStatus } from '@prisma/client';
import { Decimal } from 'decimal.js';
import type { BacktestConfig, BacktestOrderRecord, BacktestTradeRecord, MarketBar, MatchResult, PortfolioState, RejectionReason } from '../../types/backtest.types';
import { FeeCalculatorService } from './fee-calculator.service';
import { SlippageService } from './slippage.service';

export interface MatchOrderContext {
  readonly config: BacktestConfig;
  readonly portfolio: PortfolioState;
  readonly bar: MarketBar | null;
}

@Injectable()
export class MatchingEngineService {
  private readonly logger = new Logger(MatchingEngineService.name);

  constructor(
    private readonly feeCalculator: FeeCalculatorService,
    private readonly slippageService: SlippageService,
  ) {}

  async matchOrder(order: BacktestOrderRecord, context: MatchOrderContext): Promise<MatchResult> {
    const rejection = this.validate(order, context);
    if (rejection !== null) {
      this.logger.warn(`Order rejected ${order.symbol} ${order.side}: ${rejection}`);
      return { order: { ...order, status: BacktestOrderStatus.REJECTED, reason: rejection }, rejectedReason: rejection };
    }
    const bar = context.bar;
    if (bar === null) {
      return { order: { ...order, status: BacktestOrderStatus.REJECTED, reason: 'PRICE_NOT_AVAILABLE' }, rejectedReason: 'PRICE_NOT_AVAILABLE' };
    }
    const basePrice = this.resolveBasePrice(bar, context.config);
    if (basePrice.lte(0)) {
      return { order: { ...order, status: BacktestOrderStatus.REJECTED, reason: 'PRICE_NOT_AVAILABLE' }, rejectedReason: 'PRICE_NOT_AVAILABLE' };
    }
    const price = this.slippageService.calculateExecutionPrice({
      side: order.side,
      basePrice,
      slippageRate: context.config.slippageRate,
      priceMode: context.config.priceMode,
    });
    const amount = price.mul(order.quantity).toDecimalPlaces(6);
    const fee = this.feeCalculator.calculateTotalFee(order.side, amount, context.config);
    const trade: BacktestTradeRecord = {
      taskId: order.taskId,
      orderId: order.id,
      symbol: order.symbol,
      tradeDate: order.tradeDate,
      side: order.side,
      price,
      quantity: order.quantity,
      amount,
      commission: fee.commission,
      stampDuty: fee.stampDuty,
      transferFee: fee.transferFee,
      totalFee: fee.totalFee,
    };
    return { order: { ...order, status: BacktestOrderStatus.FILLED, filledQuantity: order.quantity, avgFilledPrice: price }, trade };
  }

  private validate(order: BacktestOrderRecord, context: MatchOrderContext): RejectionReason | null {
    if (order.quantity <= 0 || order.quantity % 100 !== 0) {
      return 'INVALID_LOT_SIZE';
    }
    if (context.bar === null) {
      return 'PRICE_NOT_AVAILABLE';
    }
    if (context.bar.isSuspended) {
      return 'SUSPENDED';
    }
    if (order.side === BacktestOrderSide.BUY && context.bar.isLimitUp && !context.config.allowBuyLimitUp) {
      return 'LIMIT_UP';
    }
    if (order.side === BacktestOrderSide.SELL && context.bar.isLimitDown && !context.config.allowSellLimitDown) {
      return 'LIMIT_DOWN';
    }
    if (order.side === BacktestOrderSide.BUY) {
      const price = this.resolveBasePrice(context.bar, context.config);
      const amount = price.mul(order.quantity);
      const fee = this.feeCalculator.calculateBuyFee(amount, context.config);
      if (context.portfolio.cash.lessThan(amount.plus(fee.totalFee))) {
        return 'INSUFFICIENT_CASH';
      }
      return null;
    }
    const position = context.portfolio.positions.find((item) => item.symbol === order.symbol);
    if (position === undefined || position.quantity < order.quantity) {
      return 'INSUFFICIENT_POSITION';
    }
    if (context.config.enableT1Rule && position.availableQuantity < order.quantity) {
      return 'T1_RESTRICTED';
    }
    return null;
  }

  private resolveBasePrice(bar: MarketBar, config: BacktestConfig): Decimal {
    if (config.priceMode === 'OPEN' || config.priceMode === 'NEXT_OPEN') {
      return bar.open;
    }
    if (config.priceMode === 'CLOSE') {
      return bar.close;
    }
    return bar.volume.lte(0) ? new Decimal(0) : bar.amount.div(bar.volume);
  }
}
