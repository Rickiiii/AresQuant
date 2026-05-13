import { Decimal } from 'decimal.js';
import { DailyBarEntity } from './daily-bar.entity';

describe('DailyBarEntity', () => {
  const validProps = {
    securityId: '00000000-0000-0000-0000-000000000001',
    tradeDate: new Date('2026-05-14'),
    open: new Decimal(10),
    high: new Decimal(11),
    low: new Decimal(9),
    close: new Decimal(10.5),
    previousClose: new Decimal(10),
    change: new Decimal(0.5),
    pctChange: new Decimal(0.05),
    volume: new Decimal(1000),
    amount: new Decimal(10000),
    isLimitUp: false,
    isLimitDown: false,
    isSuspended: false,
    source: 'mock',
  };

  it('creates a valid daily bar', () => {
    const entity = DailyBarEntity.create(validProps);
    expect(entity.toProperties().close.toNumber()).toBe(10.5);
  });

  it('rejects invalid price ranges', () => {
    expect(() =>
      DailyBarEntity.create({
        ...validProps,
        high: new Decimal(8),
      }),
    ).toThrow('Daily bar high price must be greater than or equal to low price');
  });
});
