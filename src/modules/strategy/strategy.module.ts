import { Module } from '@nestjs/common';
import { StrategyRegistryService } from './application/strategy-registry.service';
import { MultiFactorStrategyPlugin } from './domain/plugins/multi-factor-strategy.plugin';

@Module({
  providers: [MultiFactorStrategyPlugin, StrategyRegistryService],
  exports: [StrategyRegistryService],
})
export class StrategyModule {}
