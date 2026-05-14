import { Test } from '@nestjs/testing';
import { EqualWeightStrategy } from '../domain/strategies/equal-weight.strategy';
import { MultiFactorStrategy } from '../domain/strategies/multi-factor.strategy';
import { StrategyService } from '../application/strategy.service';
import { StrategyController } from './strategy.controller';

const tradeDate = '2026-05-14';

describe('StrategyController', () => {
  async function createController(): Promise<StrategyController> {
    const moduleRef = await Test.createTestingModule({
      controllers: [StrategyController],
      providers: [
        {
          provide: StrategyService,
          useValue: new StrategyService([new EqualWeightStrategy(), new MultiFactorStrategy()]),
        },
      ],
    }).compile();

    return moduleRef.get(StrategyController);
  }

  it('lists registered strategies', async () => {
    const controller = await createController();

    expect(controller.list()).toMatchObject({
      success: true,
      data: [
        { code: 'equal-weight', name: 'Equal Weight Strategy' },
        { code: 'multi-factor', name: 'Multi-Factor Strategy' },
      ],
    });
  });

  it('gets a strategy by name', async () => {
    const controller = await createController();

    expect(controller.get('multi-factor')).toMatchObject({
      success: true,
      data: { code: 'multi-factor', version: '1.0.0' },
    });
  });

  it('validates strategy config', async () => {
    const controller = await createController();

    expect(
      controller.validateConfig('multi-factor', {
        maxPositions: 2,
        normalizeMethod: 'rank',
        factors: [{ factorCode: 'momentum', weight: 1, direction: 'positive' }],
      }),
    ).toMatchObject({ success: true, data: { valid: true } });
  });

  it('generates strategy signals', async () => {
    const controller = await createController();

    await expect(
      controller.signals('multi-factor', {
        tradeDate,
        rebalanceFrom: '2026-05-01',
        rebalanceTo: tradeDate,
        universe: ['000001', '000002'],
        maxPositions: 1,
        normalizeMethod: 'rank',
        factors: [{ factorCode: 'momentum', weight: 1, direction: 'positive' }],
        factorValues: [
          { securityId: '000001', factorCode: 'momentum', value: 0.2, tradeDate },
          { securityId: '000002', factorCode: 'momentum', value: 0.1, tradeDate },
        ],
      }),
    ).resolves.toMatchObject({
      success: true,
      data: [{ securityId: '000001', targetWeight: 1 }],
    });
  });
});
