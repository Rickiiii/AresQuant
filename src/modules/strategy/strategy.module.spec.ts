import { Test } from '@nestjs/testing';
import { StrategyRegistryService } from './application/strategy-registry.service';
import { StrategyService } from './application/strategy.service';
import { StrategyModule } from './strategy.module';

describe('StrategyModule', () => {
  it('compiles and provides both strategy services', async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [StrategyModule],
    }).compile();

    expect(moduleRef.get(StrategyService)).toBeInstanceOf(StrategyService);
    expect(moduleRef.get(StrategyRegistryService)).toBeInstanceOf(StrategyRegistryService);
  });

  it('provides equal-weight strategy through StrategyService', async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [StrategyModule],
    }).compile();

    const strategyService = moduleRef.get(StrategyService);

    expect(strategyService.get('equal-weight').code).toBe('equal-weight');
  });

  it('provides momentum-top-n strategy through StrategyService', async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [StrategyModule],
    }).compile();

    const strategyService = moduleRef.get(StrategyService);

    expect(strategyService.get('momentum-top-n').code).toBe('momentum-top-n');
  });

  it('provides multi-factor strategy through StrategyService', async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [StrategyModule],
    }).compile();

    const strategyService = moduleRef.get(StrategyService);

    expect(strategyService.get('multi-factor').code).toBe('multi-factor');
  });
});
