import { Test } from '@nestjs/testing';
import { PortfolioContextService } from '../application/portfolio-context.service';
import { PortfolioService } from '../application/portfolio.service';
import { PORTFOLIO_CONTEXT_REPOSITORY } from '../domain/portfolio.repositories';
import { PortfolioController } from './portfolio.controller';

describe('PortfolioController', () => {
  it('returns Ricki persisted portfolio context', async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [PortfolioController],
      providers: [
        PortfolioContextService,
        PortfolioService,
        {
          provide: PORTFOLIO_CONTEXT_REPOSITORY,
          useValue: {
            findPrimaryContext: jest.fn().mockResolvedValue({
              account: {
                id: 'account-1',
                owner: 'Ricki',
                name: 'A 股账户 + 可见基金持仓',
                accountType: 'mixed',
                totalAssetValue: 100000,
                visibleAssetValue: 80000,
                cashAmount: 20000,
                positionLevel: '半仓不到',
              },
              stockHoldings: [],
              fundHoldings: [],
              themeExposures: [],
              watchlistItems: [],
            }),
            upsertPrimaryContext: jest.fn(async (input) => input),
          },
        },
      ],
    }).compile();
    const controller = moduleRef.get(PortfolioController);

    await expect(controller.editableContext()).resolves.toMatchObject({
      success: true,
      data: {
        owner: 'Ricki',
        accountScope: 'A 股账户 + 可见基金持仓',
        allocation: {
          fundVisibleValue: 80000,
          cashAmount: 20000,
        },
      },
    });
  });

  it('seeds Ricki portfolio context', async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [PortfolioController],
      providers: [
        PortfolioContextService,
        PortfolioService,
        {
          provide: PORTFOLIO_CONTEXT_REPOSITORY,
          useValue: {
            findPrimaryContext: jest.fn(),
            upsertPrimaryContext: jest.fn(async (input) => input),
          },
        },
      ],
    }).compile();
    const controller = moduleRef.get(PortfolioController);

    await expect(controller.seedRickiContext()).resolves.toMatchObject({
      success: true,
      data: {
        owner: 'Ricki',
        stockAccount: {
          positions: expect.arrayContaining([
            expect.objectContaining({ symbol: '600366', name: '宁波韵升' }),
            expect.objectContaining({ symbol: '002031', name: '巨轮智能', quantity: 2100 }),
            expect.objectContaining({ symbol: '603005', name: '晶方科技' }),
            expect.objectContaining({ symbol: '560710', name: '船舶ETF' }),
            expect.objectContaining({ symbol: '002050', name: '三花智控' }),
          ]),
        },
        themeExposures: expect.arrayContaining([
          expect.objectContaining({ theme: '美股科技/QDII' }),
          expect.objectContaining({ theme: '机器人/物理AI', amount: 40203.09 }),
        ]),
      },
    });
  });

  it('upserts Ricki stock holdings', async () => {
    const upsertStockHolding = jest.fn().mockResolvedValue({ owner: 'Ricki', stockAccount: { positions: [{ symbol: '300750' }] } });
    const moduleRef = await Test.createTestingModule({
      controllers: [PortfolioController],
      providers: [
        {
          provide: PortfolioContextService,
          useValue: {
            upsertStockHolding,
          },
        },
        { provide: PortfolioService, useValue: { getContext: jest.fn(), listPositions: jest.fn(), listFundExposures: jest.fn(), getTradingDecision: jest.fn() } },
      ],
    }).compile();
    const controller = moduleRef.get(PortfolioController);

    await expect(controller.upsertStockHolding({
      symbol: '300750',
      name: '宁德时代',
      quantity: 100,
      costPrice: 180,
      theme: '新能源 / 电池',
    })).resolves.toMatchObject({
      success: true,
      data: { owner: 'Ricki' },
    });
    expect(upsertStockHolding).toHaveBeenCalledWith(expect.objectContaining({ symbol: '300750' }), 'Ricki');
  });

  it('upserts Ricki fund holdings', async () => {
    const upsertFundHolding = jest.fn().mockResolvedValue({ owner: 'Ricki', fundAccount: { exposures: [{ name: '半导体 ETF' }] } });
    const moduleRef = await Test.createTestingModule({
      controllers: [PortfolioController],
      providers: [
        {
          provide: PortfolioContextService,
          useValue: {
            upsertFundHolding,
          },
        },
        { provide: PortfolioService, useValue: { getContext: jest.fn(), listPositions: jest.fn(), listFundExposures: jest.fn(), getTradingDecision: jest.fn() } },
      ],
    }).compile();
    const controller = moduleRef.get(PortfolioController);

    await expect(controller.upsertFundHolding({
      name: '半导体 ETF',
      theme: '半导体',
      amount: 12000,
    })).resolves.toMatchObject({
      success: true,
      data: { owner: 'Ricki' },
    });
    expect(upsertFundHolding).toHaveBeenCalledWith(expect.objectContaining({ name: '半导体 ETF' }), 'Ricki');
  });
});
