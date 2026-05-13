import { Module } from '@nestjs/common';
import { StrategyRegistryService } from './application/strategy-registry.service';
import { EqualWeightMockStrategyPlugin } from './domain/plugins/equal-weight-mock-strategy.plugin';
import { MultiFactorStrategyPlugin } from './domain/plugins/multi-factor-strategy.plugin';

@Module({
  providers: [MultiFactorStrategyPlugin, EqualWeightMockStrategyPlugin, StrategyRegistryService],
  exports: [StrategyRegistryService],
})
export class StrategyModule {}
