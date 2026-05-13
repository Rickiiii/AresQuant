import { Test } from '@nestjs/testing';
import type { InjectionToken, Provider } from '@nestjs/common';
import { DataController } from './data.controller';
import { DataSyncService } from '../application/services/data-sync.service';
import { DataQualityService } from '../application/services/data-quality.service';
import { AdjustmentService } from '../application/services/adjustment.service';
import {
  ADJ_FACTOR_REPOSITORY,
  FINANCIAL_FACTOR_REPOSITORY,
  INDEX_DAILY_BAR_REPOSITORY,
  LIMIT_PRICE_REPOSITORY,
  PHASE2_DAILY_BAR_REPOSITORY,
  STOCK_REPOSITORY,
  SUSPENSION_REPOSITORY,
  TRADING_CALENDAR_REPOSITORY,
} from '../domain/repositories/data-center.repositories';

describe('DataController', () => {
  it('returns stocks in unified response shape', async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [DataController],
      providers: [
        provider(DataSyncService, { syncStocks: jest.fn() }),
        provider(DataQualityService, { checkDailyBars: jest.fn() }),
        provider(AdjustmentService, { getForwardAdjustedBars: jest.fn(), getBackwardAdjustedBars: jest.fn() }),
        provider(STOCK_REPOSITORY, { findAll: jest.fn().mockResolvedValue([{ symbol: '000001' }]), findBySymbol: jest.fn() }),
        provider(TRADING_CALENDAR_REPOSITORY, { findByDateRange: jest.fn() }),
        provider(PHASE2_DAILY_BAR_REPOSITORY, { findByDateRange: jest.fn() }),
        provider(INDEX_DAILY_BAR_REPOSITORY, { findByDateRange: jest.fn() }),
        provider(LIMIT_PRICE_REPOSITORY, { findByTradeDate: jest.fn() }),
        provider(SUSPENSION_REPOSITORY, { findByTradeDate: jest.fn() }),
        provider(ADJ_FACTOR_REPOSITORY, { findBySymbol: jest.fn() }),
        provider(FINANCIAL_FACTOR_REPOSITORY, { findBySymbol: jest.fn() }),
      ],
    }).compile();

    const controller = moduleRef.get(DataController);
    await expect(controller.getStocks()).resolves.toMatchObject({ success: true, data: [{ symbol: '000001' }] });
  });
});

function provider(token: InjectionToken, useValue: object): Provider {
  return { provide: token, useValue };
}
