import { Injectable, Logger } from '@nestjs/common';
import type { StrategyPlugin } from '../domain/strategy.types';
import { MultiFactorStrategyPlugin, type MultiFactorStrategyParameters } from '../domain/plugins/multi-factor-strategy.plugin';

type RegisteredStrategyPlugin = StrategyPlugin<MultiFactorStrategyParameters>;

@Injectable()
export class StrategyRegistryService {
  private readonly logger = new Logger(StrategyRegistryService.name);
  private readonly plugins = new Map<string, RegisteredStrategyPlugin>();

  constructor(multiFactorStrategyPlugin: MultiFactorStrategyPlugin) {
    this.register(multiFactorStrategyPlugin);
  }

  register(plugin: RegisteredStrategyPlugin): void {
    const existing = this.plugins.get(plugin.code);
    if (existing !== undefined) {
      throw new Error(`Strategy plugin already registered: ${plugin.code}`);
    }
    this.plugins.set(plugin.code, plugin);
    this.logger.log(`Strategy plugin registered: ${plugin.code}@${plugin.version}`);
  }

  get(code: string): RegisteredStrategyPlugin {
    const plugin = this.plugins.get(code);
    if (plugin === undefined) {
      throw new Error(`Strategy plugin not found: ${code}`);
    }
    return plugin;
  }

  list(): readonly RegisteredStrategyPlugin[] {
    return [...this.plugins.values()];
  }
}
