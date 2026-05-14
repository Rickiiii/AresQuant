import type { Decimal } from 'decimal.js';
import type { BacktestOrderSide, BacktestOrderStatus, BacktestOrderType, BacktestTaskStatus } from '@prisma/client';
import type { StrategyConfig } from '@/modules/strategy/domain/strategy.types';

export enum BacktestFrequency {
  DAILY = 'DAILY',
  WEEKLY = 'WEEKLY',
  MONTHLY = 'MONTHLY',
}

export enum BacktestPriceMode {
  OPEN = 'OPEN',
  CLOSE = 'CLOSE',
  VWAP = 'VWAP',
  NEXT_OPEN = 'NEXT_OPEN',
}

export type RejectionReason =
  | 'SUSPENDED'
  | 'LIMIT_UP'
  | 'LIMIT_DOWN'
  | 'T1_RESTRICTED'
  | 'INSUFFICIENT_CASH'
  | 'INSUFFICIENT_POSITION'
  | 'INVALID_LOT_SIZE'
  | 'PRICE_NOT_AVAILABLE';

export interface BacktestConfig {
  readonly name: string;
  readonly strategyName: string;
  readonly startDate: string;
  readonly endDate: string;
  readonly initialCapital: Decimal;
  readonly benchmark?: string;
  readonly frequency: BacktestFrequency;
  readonly rebalanceFrequency: number;
  readonly maxPositions: number;
  readonly maxPositionWeight: Decimal;
  readonly commissionRate: Decimal;
  readonly minCommission: Decimal;
  readonly stampDutyRate: Decimal;
  readonly transferFeeRate: Decimal;
  readonly slippageRate: Decimal;
  readonly allowBuyLimitUp: boolean;
  readonly allowSellLimitDown: boolean;
  readonly enableT1Rule: boolean;
  readonly priceMode: BacktestPriceMode;
  readonly blacklist: readonly string[];
  readonly strategyConfig?: StrategyConfig;
}

export interface TargetPosition {
  readonly symbol: string;
  readonly weight: Decimal;
  readonly reason: string;
}

export interface BacktestPositionState {
  readonly symbol: string;
  readonly quantity: number;
  readonly availableQuantity: number;
  readonly avgCost: Decimal;
  readonly lastPrice: Decimal;
  readonly marketValue: Decimal;
  readonly unrealizedPnl: Decimal;
  readonly realizedPnl: Decimal;
  readonly lastBuyDate?: string;
  /** Optional snapshot date when the position is read from persisted backtest history. */
  readonly tradeDate?: string;
}

export interface PortfolioState {
  readonly cash: Decimal;
  readonly positions: readonly BacktestPositionState[];
  readonly totalAsset: Decimal;
  readonly marketValue: Decimal;
}

export interface BacktestOrderDraft {
  readonly taskId: string;
  readonly symbol: string;
  readonly tradeDate: string;
  readonly side: BacktestOrderSide;
  readonly orderType: BacktestOrderType;
  readonly price: Decimal;
  readonly quantity: number;
}

export interface BacktestOrderRecord extends BacktestOrderDraft {
  readonly id: string;
  readonly filledQuantity: number;
  readonly avgFilledPrice?: Decimal;
  readonly status: BacktestOrderStatus;
  readonly reason?: string;
}

export interface FeeDetail {
  readonly commission: Decimal;
  readonly stampDuty: Decimal;
  readonly transferFee: Decimal;
  readonly totalFee: Decimal;
}

export interface BacktestTradeRecord {
  readonly id?: string;
  readonly taskId: string;
  readonly orderId: string;
  readonly symbol: string;
  readonly tradeDate: string;
  readonly side: BacktestOrderSide;
  readonly price: Decimal;
  readonly quantity: number;
  readonly amount: Decimal;
  readonly commission: Decimal;
  readonly stampDuty: Decimal;
  readonly transferFee: Decimal;
  readonly totalFee: Decimal;
}

export interface MatchResult {
  readonly order: BacktestOrderRecord;
  readonly trade?: BacktestTradeRecord;
  readonly rejectedReason?: RejectionReason;
}

export interface BacktestAccountSnapshotRecord {
  readonly taskId: string;
  readonly tradeDate: string;
  readonly cash: Decimal;
  readonly marketValue: Decimal;
  readonly totalAsset: Decimal;
  readonly dailyReturn: Decimal;
  readonly cumulativeReturn: Decimal;
  readonly drawdown: Decimal;
}

export interface BacktestMetrics {
  readonly totalReturn: Decimal;
  readonly annualizedReturn: Decimal;
  readonly maxDrawdown: Decimal;
  readonly sharpeRatio: Decimal;
  readonly sortinoRatio: Decimal;
  readonly calmarRatio: Decimal;
  readonly winRate: Decimal;
  readonly profitLossRatio: Decimal;
  readonly volatility: Decimal;
  readonly beta: Decimal | null;
  readonly alpha: Decimal | null;
  readonly turnoverRate: Decimal;
  readonly tradeCount: number;
}

export interface BacktestTaskRecord {
  readonly id: string;
  readonly name: string;
  readonly strategyName: string;
  readonly status: BacktestTaskStatus;
  readonly startDate: string;
  readonly endDate: string;
  readonly initialCapital: Decimal;
  readonly benchmark?: string;
  readonly config: BacktestConfig;
  readonly errorMessage?: string;
}

export interface BacktestResult {
  readonly taskId: string;
  readonly status: BacktestTaskStatus;
  readonly metrics: BacktestMetrics;
  readonly snapshots: readonly BacktestAccountSnapshotRecord[];
}

export interface BacktestContext {
  readonly taskId: string;
  readonly currentDate: string;
  readonly previousDate?: string;
  readonly config: BacktestConfig;
  readonly account: PortfolioState;
  readonly positions: readonly BacktestPositionState[];
  readonly pendingOrders: readonly BacktestOrderRecord[];
}

export interface SlippageParams {
  readonly side: BacktestOrderSide;
  readonly basePrice: Decimal;
  readonly slippageRate: Decimal;
  readonly priceMode: BacktestPriceMode;
}

export interface MarketBar {
  readonly symbol: string;
  readonly tradeDate: string;
  readonly open: Decimal;
  readonly high: Decimal;
  readonly low: Decimal;
  readonly close: Decimal;
  readonly volume: Decimal;
  readonly amount: Decimal;
  readonly isSuspended: boolean;
  readonly isLimitUp: boolean;
  readonly isLimitDown: boolean;
}
