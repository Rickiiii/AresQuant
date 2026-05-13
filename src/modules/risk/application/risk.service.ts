import { Injectable, Logger } from '@nestjs/common';
import { Decimal } from 'decimal.js';
import type { TargetPosition } from '@/modules/backtest/types/backtest.types';
import type { StockRawData, SuspensionRawData, DailyBarRawData } from '@/modules/data/domain/types/market-data.types';

export interface RiskFilterInput {
  readonly targets: readonly TargetPosition[];
  readonly stocks: readonly StockRawData[];
  readonly suspensions: readonly SuspensionRawData[];
  readonly latestBars: readonly DailyBarRawData[];
  readonly maxPositions: number;
  readonly maxPositionWeight: Decimal;
  readonly blacklist: readonly string[];
}

@Injectable()
export class RiskService {
  private readonly logger = new Logger(RiskService.name);

  filterTargets(input: RiskFilterInput): readonly TargetPosition[] {
    const stockBySymbol = new Map(input.stocks.map((stock) => [stock.symbol, stock]));
    const suspended = new Set(input.suspensions.map((item) => item.symbol));
    const liquid = new Set(input.latestBars.filter((bar) => bar.volume > 0 && bar.amount > 0).map((bar) => bar.symbol));
    const blacklist = new Set(input.blacklist);
    const filtered = input.targets
      .filter((target) => !blacklist.has(target.symbol))
      .filter((target) => stockBySymbol.get(target.symbol)?.isST !== true)
      .filter((target) => !suspended.has(target.symbol))
      .filter((target) => liquid.has(target.symbol))
      .slice(0, input.maxPositions)
      .map((target) => ({
        ...target,
        weight: Decimal.min(target.weight, input.maxPositionWeight),
      }));
    this.logger.log(`Risk filtered targets ${input.targets.length} -> ${filtered.length}`);
    return filtered;
  }
}
