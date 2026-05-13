import { BacktestEngineService } from './backtest-engine.service';
import { MultiFactorStrategyPlugin } from '@/modules/strategy/domain/plugins/multi-factor-strategy.plugin';
import { StrategyRegistryService } from '@/modules/strategy/application/strategy-registry.service';

describe('BacktestEngineService', () => {
  it('rejects invalid date ranges', async () => {
    const registry = new StrategyRegistryService(new MultiFactorStrategyPlugin());
    const service = new BacktestEngineService(registry);

    await expect(
      service.run({
        strategyCode: 'multi_factor',
        startDate: new Date('2026-05-14'),
        endDate: new Date('2026-01-01'),
        initialCash: 1_000_000,
        costModel: {
          commissionRate: 0.0003,
          slippageRate: 0.0005,
        },
        universe: [],
      }),
    ).rejects.toThrow('Backtest startDate must be earlier than or equal to endDate');
  });
});
