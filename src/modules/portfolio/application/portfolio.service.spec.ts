import { Decimal } from 'decimal.js';
import type { PrismaService } from '@/database/prisma.service';
import { PortfolioService } from './portfolio.service';

function createPrismaMock(overrides: Partial<PrismaMock> = {}): PrismaMock {
  return {
    portfolioAccount: {
      findFirst: jest.fn().mockResolvedValue(null),
    },
    ...overrides,
  };
}

interface PrismaMock {
  readonly portfolioAccount: {
    readonly findFirst: jest.Mock;
  };
}

function createQuoteProviderMock(
  quotes: readonly unknown[] = [],
  marketSnapshots: readonly unknown[] = [],
): { readonly getStockQuotes: jest.Mock; readonly getMarketSnapshots: jest.Mock } {
  return {
    getStockQuotes: jest.fn().mockResolvedValue(quotes),
    getMarketSnapshots: jest.fn().mockResolvedValue(marketSnapshots),
  };
}

describe('PortfolioService', () => {
  it('returns fallback Ricki portfolio context when database has no default account', async () => {
    const prisma = createPrismaMock();
    const service = new PortfolioService(prisma as unknown as PrismaService, createQuoteProviderMock() as never);

    const context = await service.getContext();

    expect(prisma.portfolioAccount.findFirst).toHaveBeenCalledWith({
      where: { isDefault: true },
      include: {
        positions: { orderBy: { symbol: 'asc' } },
        fundExposures: { orderBy: [{ weightPercent: 'desc' }, { amount: 'desc' }] },
        watchThemes: { orderBy: [{ priority: 'desc' }, { name: 'asc' }] },
      },
    });
    expect(context.source).toBe('fallback');
    expect(context.owner).toBe('Ricki');
    expect(context.summary.stockCostValue).toBe('57765.19');
    expect(context.summary.visibleFundValue).toBe('135386.00');
    expect(context.summary.stockWeightPercent).toBe('29.91');
    expect(context.positions.map((position) => position.symbol)).toEqual(['600366', '601689', '002031', '002714', '603005']);
    expect(context.fundExposures).toHaveLength(11);
  });

  it('maps the default database account to context with decimal values serialized as strings', async () => {
    const prisma = createPrismaMock({
      portfolioAccount: {
        findFirst: jest.fn().mockResolvedValue({
          id: 'account-1',
          name: 'Ricki Portfolio',
          accountType: 'MIXED',
          baseCurrency: 'CNY',
          totalAssetValue: new Decimal('200000'),
          cashValue: new Decimal('20000'),
          visibleAssetValue: new Decimal('150000'),
          description: 'manual portfolio',
          isDefault: true,
          positions: [
            {
              id: 'position-1',
              symbol: '600366',
              name: '宁波韵升',
              quantity: 800,
              costPrice: new Decimal('13.47'),
              latestPrice: new Decimal('14.25'),
              marketValue: new Decimal('11400'),
              unrealizedPnl: new Decimal('624'),
              themeTags: ['机器人 / 物理 AI'],
              thesisSummary: '机器人链条观察仓',
              actionBias: 'HOLD',
              riskLevel: 'MEDIUM',
              notes: null,
            },
          ],
          fundExposures: [
            {
              id: 'fund-1',
              name: '纳指100',
              fundCode: null,
              theme: '海外科技',
              amount: new Decimal('33910'),
              weightPercent: new Decimal('23.93'),
              actionBias: 'HOLD',
              riskLevel: 'MEDIUM',
              notes: 'largest fund exposure',
            },
          ],
          watchThemes: [
            {
              id: 'theme-1',
              name: '机器人 / 物理 AI',
              category: 'AI',
              priority: 10,
              actionBias: 'WATCH',
              riskLevel: 'HIGH',
              notes: '重点观察',
            },
          ],
        }),
      },
    });
    const service = new PortfolioService(prisma as unknown as PrismaService, createQuoteProviderMock() as never);

    const context = await service.getContext();

    expect(context).toMatchObject({
      source: 'database',
      owner: 'Ricki',
      account: {
        id: 'account-1',
        name: 'Ricki Portfolio',
        accountType: 'MIXED',
        totalAssetValue: '200000.00',
        cashValue: '20000.00',
        visibleAssetValue: '150000.00',
      },
      positions: [
        expect.objectContaining({
          symbol: '600366',
          costPrice: '13.470000',
          latestPrice: '14.250000',
          marketValue: '11400.00',
          actionBias: 'hold',
          riskLevel: 'medium',
        }),
      ],
      fundExposures: [
        expect.objectContaining({
          name: '纳指100',
          amount: '33910.00',
          weightPercent: '23.93',
          actionBias: 'hold',
        }),
      ],
      watchThemes: [
        expect.objectContaining({
          name: '机器人 / 物理 AI',
          priority: 10,
          actionBias: 'watch',
        }),
      ],
    });
    expect(context.summary.stockCostValue).toBe('10776.00');
    expect(context.summary.knownPortfolioValue).toBe('160776.00');
  });

  it('enriches portfolio positions with live quote price, market value and daily change', async () => {
    const prisma = createPrismaMock({
      portfolioAccount: {
        findFirst: jest.fn().mockResolvedValue({
          id: 'account-1',
          name: 'Ricki Portfolio',
          accountType: 'MIXED',
          baseCurrency: 'CNY',
          totalAssetValue: new Decimal('200000'),
          cashValue: new Decimal('20000'),
          visibleAssetValue: new Decimal('150000'),
          description: 'manual portfolio',
          isDefault: true,
          positions: [
            {
              id: 'position-1',
              symbol: '600366',
              name: '宁波韵升',
              quantity: 800,
              costPrice: new Decimal('13.47'),
              latestPrice: null,
              marketValue: null,
              unrealizedPnl: null,
              themeTags: ['机器人 / 物理 AI'],
              thesisSummary: '机器人链条观察仓',
              actionBias: 'HOLD',
              riskLevel: 'MEDIUM',
              notes: null,
            },
          ],
          fundExposures: [],
          watchThemes: [],
        }),
      },
    });
    const quoteProvider = createQuoteProviderMock([{
      symbol: '600366',
      name: '宁波韵升',
      latestPrice: 15.25,
      change: 0.3,
      pctChange: 2.01,
      open: 14.9,
      high: 15.4,
      low: 14.7,
      preClose: 14.95,
      volume: 123456,
      amount: 18827160,
      source: 'eastmoney',
    }]);
    const service = new PortfolioService(prisma as unknown as PrismaService, quoteProvider as never);

    const context = await service.getContext();

    expect(quoteProvider.getStockQuotes).toHaveBeenCalledWith(['600366']);
    expect(context.positions[0]).toMatchObject({
      symbol: '600366',
      latestPrice: '15.250000',
      marketValue: '12200.00',
      unrealizedPnl: '1424.00',
      dailyChange: '0.30',
      dailyPctChange: '2.01',
      quoteSource: 'eastmoney',
    });
  });

  it('adds live market snapshots for index and theme strength to context', async () => {
    const marketProvider = createQuoteProviderMock([], [
      { code: '000300.SH', name: '沪深300', category: 'index', latestPrice: 3980.12, change: 48.2, pctChange: 1.23, amount: 250000000000, source: 'eastmoney' },
      { code: '562500.SH', name: '机器人ETF', category: 'theme', latestPrice: 0.88, change: 0.02, pctChange: 2.5, amount: 360000000, source: 'eastmoney' },
    ]);
    const service = new PortfolioService(createPrismaMock() as unknown as PrismaService, marketProvider as never);

    const context = await service.getContext();

    expect(marketProvider.getMarketSnapshots).toHaveBeenCalledWith(expect.arrayContaining([
      expect.objectContaining({ code: '000300.SH', category: 'index' }),
      expect.objectContaining({ name: '机器人ETF', category: 'theme' }),
    ]));
    expect(context.marketSnapshots).toEqual([
      { code: '000300.SH', name: '沪深300', category: 'index', latestPrice: '3980.120000', dailyChange: '48.20', dailyPctChange: '1.23', amount: '250000000000.00', quoteSource: 'eastmoney' },
      { code: '562500.SH', name: '机器人ETF', category: 'theme', latestPrice: '0.880000', dailyChange: '0.02', dailyPctChange: '2.50', amount: '360000000.00', quoteSource: 'eastmoney' },
    ]);
  });

  it('returns positions and fund exposures from the same context source', async () => {
    const service = new PortfolioService(createPrismaMock() as unknown as PrismaService, createQuoteProviderMock() as never);

    await expect(service.listPositions()).resolves.toHaveLength(5);
    await expect(service.listFundExposures()).resolves.toHaveLength(11);
  });

  it('builds an intraday trading decision report from live positions and market snapshots', async () => {
    const quoteProvider = createQuoteProviderMock([
      { symbol: '603005', name: '晶方科技', latestPrice: 41.04, change: -4.56, pctChange: -10, open: 45.03, high: 45.1, low: 41.04, preClose: 45.6, volume: 1139620, amount: 4853880455, source: 'eastmoney' },
      { symbol: '002031', name: '巨轮智能', latestPrice: 6.24, change: -0.33, pctChange: -5.02, open: 6.48, high: 6.6, low: 6.2, preClose: 6.57, volume: 1488232, amount: 944626826.94, source: 'eastmoney' },
      { symbol: '002714', name: '牧原股份', latestPrice: 38.07, change: 1.02, pctChange: 2.75, open: 37.06, high: 38.58, low: 36.75, preClose: 37.05, volume: 555510, amount: 2101920832.93, source: 'eastmoney' },
    ], [
      { code: '000300.SH', name: '沪深300', category: 'index', latestPrice: 4892.12, change: -22.09, pctChange: -0.45, amount: 942236490058.1, source: 'eastmoney' },
      { code: '399006.SZ', name: '创业板指', category: 'index', latestPrice: 4037.95, change: -87.12, pctChange: -2.11, amount: 855661852309.05, source: 'eastmoney' },
      { code: '562500.SH', name: '机器人ETF', category: 'theme', latestPrice: 0.82, change: -0.03, pctChange: -3.2, amount: 360000000, source: 'eastmoney' },
    ]);
    const service = new PortfolioService(createPrismaMock() as unknown as PrismaService, quoteProvider as never);

    const report = await service.getTradingDecision();

    expect(report.marketRegime).toMatchObject({
      code: 'weak_defensive',
      label: '弱势防守',
    });
    expect(report.summary).toMatchObject({
      totalCostValue: '57765.19',
      totalMarketValue: expect.any(String),
      totalUnrealizedPnl: expect.any(String),
      primaryAction: '暂停主动补仓，先做风险识别和仓位保护。',
    });
    expect(report.decisions).toEqual(expect.arrayContaining([
      expect.objectContaining({
        symbol: '603005',
        action: 'risk_control',
        actionLabel: '风控观察',
        riskLevel: 'high',
      }),
      expect.objectContaining({
        symbol: '002031',
        action: 'avoid_add',
        actionLabel: '禁止补仓',
        riskLevel: 'high',
      }),
      expect.objectContaining({
        symbol: '002714',
        action: 'hold',
        actionLabel: '继续持有',
        riskLevel: 'medium',
      }),
    ]));
    expect(report.actionBuckets.riskControl).toEqual(expect.arrayContaining(['603005 晶方科技']));
    expect(report.actionBuckets.avoidAdd).toEqual(expect.arrayContaining(['002031 巨轮智能']));
    expect(report.decisions).toEqual(expect.arrayContaining([
      expect.objectContaining({
        symbol: '603005',
        pricePlan: expect.objectContaining({
          currentPrice: '41.040000',
          costPrice: '38.397000',
          profitProtectPrice: '39.16',
          addWatchPrice: null,
          strengthConfirmPrice: '42.68',
        }),
      }),
      expect.objectContaining({
        symbol: '002031',
        pricePlan: expect.objectContaining({
          currentPrice: '6.240000',
          costPrice: '8.132900',
          stopLossPrice: '5.93',
          addWatchPrice: null,
          strengthConfirmPrice: '7.32',
        }),
      }),
      expect.objectContaining({
        symbol: '002714',
        pricePlan: expect.objectContaining({
          currentPrice: '38.070000',
          costPrice: '44.670000',
          addWatchPrice: '37.69',
          strengthConfirmPrice: '38.83',
        }),
      }),
    ]));
    expect(report.intradayPlan).toMatchObject({
      doNow: expect.arrayContaining(['暂停主动补仓，先做风险识别和仓位保护。', '603005 晶方科技：进入风控观察，盯住利润保护线。']),
      waitFor: expect.arrayContaining(['等待指数企稳，并确认机器人/AI/半导体 ETF 至少同步修复。']),
      avoid: expect.arrayContaining(['002031 巨轮智能：深亏/弱势票禁止摊低成本。']),
      emergency: expect.arrayContaining(['603005 晶方科技：若继续低开且无法收回 39.16，优先保护利润。']),
    });
    expect(report.nextTriggers).toEqual(expect.arrayContaining([
      '指数企稳且机器人/AI/半导体主题放量修复后，才重新评估分批加仓。',
    ]));
  });
});
