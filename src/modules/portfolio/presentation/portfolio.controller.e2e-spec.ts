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

  it('looks up stock quotes for holding editor autofill', async () => {
    const lookupStockQuotes = jest.fn().mockResolvedValue([{ symbol: '002050', name: '三花智控' }]);
    const moduleRef = await Test.createTestingModule({
      controllers: [PortfolioController],
      providers: [
        { provide: PortfolioContextService, useValue: {} },
        { provide: PortfolioService, useValue: { getContext: jest.fn(), listPositions: jest.fn(), listFundExposures: jest.fn(), getTradingDecision: jest.fn(), lookupStockQuotes } },
      ],
    }).compile();
    const controller = moduleRef.get(PortfolioController);

    await expect(controller.quotes('002050,600366')).resolves.toMatchObject({
      success: true,
      data: [{ symbol: '002050', name: '三花智控' }],
    });
    expect(lookupStockQuotes).toHaveBeenCalledWith(['002050', '600366']);
  });

  it('looks up fund quotes for fund editor autofill', async () => {
    const lookupFundQuotes = jest.fn().mockResolvedValue([{ fundCode: '161725', name: '招商中证白酒指数(LOF)A' }]);
    const moduleRef = await Test.createTestingModule({
      controllers: [PortfolioController],
      providers: [
        { provide: PortfolioContextService, useValue: {} },
        { provide: PortfolioService, useValue: { getContext: jest.fn(), listPositions: jest.fn(), listFundExposures: jest.fn(), getTradingDecision: jest.fn(), lookupStockQuotes: jest.fn(), lookupFundQuotes } },
      ],
    }).compile();
    const controller = moduleRef.get(PortfolioController);

    await expect(controller.fundQuotes('161725')).resolves.toMatchObject({
      success: true,
      data: [{ fundCode: '161725', name: '招商中证白酒指数(LOF)A' }],
    });
    expect(lookupFundQuotes).toHaveBeenCalledWith(['161725']);
  });

  it('returns advice backtest replay', async () => {
    const getAdviceBacktest = jest.fn().mockResolvedValue({
      generatedAt: '2026-06-05T00:00:00.000Z',
      startDate: '20260506',
      endDate: '20260605',
      dataStatus: '已使用真实日线做建议复盘。',
      summaries: [],
      items: [],
    });
    const moduleRef = await Test.createTestingModule({
      controllers: [PortfolioController],
      providers: [
        { provide: PortfolioContextService, useValue: {} },
        { provide: PortfolioService, useValue: { getContext: jest.fn(), listPositions: jest.fn(), listFundExposures: jest.fn(), getTradingDecision: jest.fn(), getAdviceBacktest, lookupStockQuotes: jest.fn(), lookupFundQuotes: jest.fn() } },
      ],
    }).compile();
    const controller = moduleRef.get(PortfolioController);

    await expect(controller.adviceBacktest('45')).resolves.toMatchObject({
      success: true,
      data: { dataStatus: expect.stringContaining('真实日线') },
    });
    expect(getAdviceBacktest).toHaveBeenCalledWith(45);
  });

  it('gets and updates investor preference config', async () => {
    const preference = {
      horizon: '1-3 年长线持有',
      coreView: '长期看好机器人',
      roboticsMaxWeightPercent: 35,
      singleStockMaxDrawdownPercent: 18,
      portfolioMaxDrawdownPercent: 10,
      coreHoldings: ['拓普集团'],
      satelliteHoldings: ['巨轮智能'],
      rebalanceCadence: '每月复盘',
      cashPlan: '大跌补',
      trimOrder: ['绿电'],
    };
    const getInvestorPreference = jest.fn().mockReturnValue(preference);
    const updateInvestorPreference = jest.fn().mockReturnValue({ ...preference, roboticsMaxWeightPercent: 40 });
    const moduleRef = await Test.createTestingModule({
      controllers: [PortfolioController],
      providers: [
        { provide: PortfolioContextService, useValue: {} },
        { provide: PortfolioService, useValue: { getContext: jest.fn(), listPositions: jest.fn(), listFundExposures: jest.fn(), getTradingDecision: jest.fn(), lookupStockQuotes: jest.fn(), lookupFundQuotes: jest.fn(), getInvestorPreference, updateInvestorPreference } },
      ],
    }).compile();
    const controller = moduleRef.get(PortfolioController);

    await expect(controller.investorPreference()).resolves.toMatchObject({ success: true, data: preference });
    await expect(controller.updateInvestorPreference({ ...preference, roboticsMaxWeightPercent: 40 })).resolves.toMatchObject({
      success: true,
      data: { roboticsMaxWeightPercent: 40 },
    });
    expect(updateInvestorPreference).toHaveBeenCalledWith(expect.objectContaining({ roboticsMaxWeightPercent: 40 }));
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
