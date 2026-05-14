import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { StrategyConfigDto, StrategySignalsRequestDto } from './strategy-api.dto';

describe('Strategy API DTO validation', () => {
  it('validates nested factor weights in config DTO', async () => {
    const dto = plainToInstance(StrategyConfigDto, {
      maxPositions: 2,
      normalizeMethod: 'rank',
      factors: [{ factorCode: 'momentum', weight: -1, direction: 'sideways' }],
    });

    const errors = await validate(dto);

    expect(errors).toHaveLength(1);
    expect(errors[0]?.property).toBe('factors');
  });

  it('accepts a valid strategy signals request DTO', async () => {
    const dto = plainToInstance(StrategySignalsRequestDto, {
      tradeDate: '2026-05-14',
      rebalanceFrom: '2026-05-01',
      rebalanceTo: '2026-05-14',
      universe: ['000001'],
      maxPositions: 1,
      normalizeMethod: 'rank',
      factors: [{ factorCode: 'momentum', weight: 1, direction: 'positive' }],
      factorValues: [{ securityId: '000001', factorCode: 'momentum', value: 0.2, tradeDate: '2026-05-14' }],
    });

    await expect(validate(dto)).resolves.toEqual([]);
  });

  it('rejects invalid strategy signals request DTO', async () => {
    const dto = plainToInstance(StrategySignalsRequestDto, {
      tradeDate: 'not-a-date',
      rebalanceFrom: '2026-05-01',
      rebalanceTo: '2026-05-14',
      universe: [123],
      maxPositions: 0,
    });

    const errors = await validate(dto);

    expect(errors.map((error) => error.property)).toEqual(expect.arrayContaining(['tradeDate', 'universe', 'maxPositions']));
  });
});
