import { Module } from '@nestjs/common';
import { FactorScoreService } from './application/factor-score.service';
import { StrategyRegistryService } from './application/strategy-registry.service';
import { StrategyService } from './application/strategy.service';
import { EqualWeightMockStrategyPlugin } from './domain/plugins/equal-weight-mock-strategy.plugin';
import { MultiFactorStrategyPlugin } from './domain/plugins/multi-factor-strategy.plugin';
import { EqualWeightStrategy } from './domain/strategies/equal-weight.strategy';
import { MomentumTopNStrategy } from './domain/strategies/momentum-top-n.strategy';
import { MultiFactorStrategy } from './domain/strategies/multi-factor.strategy';
import { StrategyController } from './presentation/strategy.controller';

@Module({
  controllers: [StrategyController],
  providers: [
    MultiFactorStrategyPlugin,
    EqualWeightMockStrategyPlugin,
    StrategyRegistryService,
    EqualWeightStrategy,
    MomentumTopNStrategy,
    FactorScoreService,
    {
      provide: MultiFactorStrategy,
      useFactory: (factorScoreService: FactorScoreService) => new MultiFactorStrategy(factorScoreService),
      inject: [FactorScoreService],
    },
    {
      provide: StrategyService,
      useFactory: (
        equalWeightStrategy: EqualWeightStrategy,
        momentumTopNStrategy: MomentumTopNStrategy,
        multiFactorStrategy: MultiFactorStrategy,
      ) => new StrategyService([equalWeightStrategy, momentumTopNStrategy, multiFactorStrategy]),
      inject: [EqualWeightStrategy, MomentumTopNStrategy, MultiFactorStrategy],
    },
  ],
  exports: [StrategyRegistryService, StrategyService],
})
export class StrategyModule {}
