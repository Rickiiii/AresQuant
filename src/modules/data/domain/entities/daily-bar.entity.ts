import type { Decimal } from 'decimal.js';
import { DomainError } from '@/common/errors/domain.error';

export interface DailyBarProperties {
  readonly securityId: string;
  readonly tradeDate: Date;
  readonly open: Decimal;
  readonly high: Decimal;
  readonly low: Decimal;
  readonly close: Decimal;
  readonly previousClose: Decimal;
  readonly change: Decimal;
  readonly pctChange: Decimal;
  readonly volume: Decimal;
  readonly amount: Decimal;
  readonly turnoverRate?: Decimal;
  readonly volumeRatio?: Decimal;
  readonly isLimitUp: boolean;
  readonly isLimitDown: boolean;
  readonly isSuspended: boolean;
  readonly source: string;
}

export class DailyBarEntity {
  private constructor(private readonly props: DailyBarProperties) {}

  static create(props: DailyBarProperties): DailyBarEntity {
    if (props.high.lessThan(props.low)) {
      throw new DomainError('Daily bar high price must be greater than or equal to low price', 'DAILY_BAR_INVALID_PRICE_RANGE');
    }
    if (props.open.lessThan(props.low) || props.open.greaterThan(props.high)) {
      throw new DomainError('Daily bar open price is outside high-low range', 'DAILY_BAR_INVALID_OPEN_PRICE');
    }
    if (props.close.lessThan(props.low) || props.close.greaterThan(props.high)) {
      throw new DomainError('Daily bar close price is outside high-low range', 'DAILY_BAR_INVALID_CLOSE_PRICE');
    }
    if (props.volume.isNegative() || props.amount.isNegative()) {
      throw new DomainError('Daily bar volume and amount must be non-negative', 'DAILY_BAR_INVALID_LIQUIDITY');
    }
    return new DailyBarEntity(props);
  }

  toProperties(): DailyBarProperties {
    return this.props;
  }
}
