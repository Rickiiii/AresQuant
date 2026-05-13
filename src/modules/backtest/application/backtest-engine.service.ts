import { Injectable, Logger } from '@nestjs/common';
import { StrategyRegistryService } from '@/modules/strategy/application/strategy-registry.service';
import type { BacktestRequest, BacktestResult } from '../domain/backtest.types';

@Injectable()
export class BacktestEngineService {
  private readonly logger = new Logger(BacktestEngineService.name);

  constructor(private readonly strategyRegistry: StrategyRegistryService) {}

  async run(request: BacktestRequest): Promise<BacktestResult> {
    this.validateRequest(request);
    const plugin = this.strategyRegistry.get(request.strategyCode);
    this.logger.log(`Starting backtest for strategy=${plugin.code}, start=${request.startDate.toISOString()}, end=${request.endDate.toISOString()}`);

    try {
      await plugin.generateSignals(
        {
          tradeDate: request.startDate,
          rebalanceRange: { from: request.startDate, to: request.endDate },
          universe: request.universe,
        },
        { factors: [{ factorCode: 'momentum_20d', weight: 1 }], maxPositions: 10, rebalanceDays: 20 },
      );

      return {
        metrics: {
          annualizedReturn: 0,
          maxDrawdown: 0,
          sharpeRatio: 0,
          winRate: 0,
        },
        equityCurve: [],
      };
    } catch (error) {
      this.logger.error('Backtest failed', error instanceof Error ? error.stack : String(error));
      throw error;
    }
  }

  private validateRequest(request: BacktestRequest): void {
    if (request.startDate > request.endDate) {
      throw new Error('Backtest startDate must be earlier than or equal to endDate');
    }
    if (request.initialCash <= 0) {
      throw new Error('Backtest initialCash must be positive');
    }
    if (request.costModel.commissionRate < 0 || request.costModel.slippageRate < 0) {
      throw new Error('Backtest cost rates must be non-negative');
    }
  }
}
