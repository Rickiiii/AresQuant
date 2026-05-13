import { MultiFactorStrategyPlugin } from '../domain/plugins/multi-factor-strategy.plugin';
import { EqualWeightMockStrategyPlugin } from '../domain/plugins/equal-weight-mock-strategy.plugin';
import { StrategyRegistryService } from './strategy-registry.service';

describe('StrategyRegistryService', () => {
  it('registers and resolves multi-factor strategy plugin', () => {
    const plugin = new MultiFactorStrategyPlugin();
    const registry = new StrategyRegistryService(plugin, new EqualWeightMockStrategyPlugin());

    expect(registry.get('multi_factor')).toBe(plugin);
    expect(registry.list()).toHaveLength(2);
  });
});
