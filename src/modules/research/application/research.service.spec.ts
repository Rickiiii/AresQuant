import type { DashboardService } from '@/modules/dashboard/application/dashboard.service';
import type { PortfolioContextService } from '@/modules/portfolio/application/portfolio-context.service';
import { ResearchService } from './research.service';

describe('ResearchService', () => {
  it('composes daily note from live dashboard coverage, strategies and backtests', async () => {
    const service = new ResearchService(createDashboardService());

    const note = await service.getDailyNote();

    expect(note.marketState).toBe('live');
    expect(note.title).toContain('20260514');
    expect(note.topConclusion).toContain('5120');
    expect(note.sections).toEqual(expect.arrayContaining([
      expect.objectContaining({
        code: 'market-temperature',
        bullets: expect.arrayContaining([
          expect.stringContaining('日线 250000 条'),
          expect.stringContaining('财务因子 32000 条'),
        ]),
      }),
      expect.objectContaining({
        code: 'factor-signals',
        bullets: expect.arrayContaining([
          expect.stringContaining('multi-factor'),
          expect.stringContaining('2/3'),
        ]),
      }),
    ]));
    expect(note.nextFocus).toEqual(expect.arrayContaining([
      '把 Research ideas 接入 multi-factor sample signals',
      '用最新回测结果校准建议置信度',
    ]));
  });

  it('composes portfolio review and ideas from live strategy and dashboard data', async () => {
    const service = new ResearchService(createDashboardService());

    await expect(service.getPortfolioReview()).resolves.toMatchObject({
      positioning: {
        stockExposure: expect.stringContaining('5120'),
        fundExposure: expect.stringContaining('multi-factor'),
        overallRisk: 'medium',
      },
      priorities: expect.arrayContaining([
        expect.stringContaining('20260514'),
      ]),
    });

    const ideas = await service.listIdeas();

    expect(ideas).toEqual([
      expect.objectContaining({
        symbol: '000001',
        name: '平安银行',
        suggestedAction: 'watch',
        oneLineThesis: expect.stringContaining('multi-factor'),
        factorBreakdown: expect.arrayContaining([
          expect.objectContaining({ factor: 'Strategy Signal', signal: '30.00%' }),
          expect.objectContaining({ factor: 'Data Coverage', signal: '20260514' }),
        ]),
      }),
      expect.objectContaining({
        symbol: '600000',
        name: '浦发银行',
        factorBreakdown: expect.arrayContaining([
          expect.objectContaining({ factor: 'Strategy Signal', signal: '20.00%' }),
        ]),
      }),
    ]);
  });

  it('uses persisted portfolio context and theme exposures when PortfolioService has data', async () => {
    const service = new ResearchService(createDashboardService(), createPortfolioService());

    await expect(service.getPortfolioContext()).resolves.toMatchObject({
      owner: 'Ricki',
      stockAccount: {
        positions: [
          expect.objectContaining({ symbol: '600366', latestPrice: 14.1 }),
        ],
      },
      fundAccount: {
        visibleAssetValue: 135386,
      },
    });
    await expect(service.listThemeExposures()).resolves.toEqual([
      expect.objectContaining({ theme: '海外科技', source: 'fund', weightPercent: 23.93 }),
    ]);
  });
});

function createDashboardService(): DashboardService {
  return {
    getOverview: jest.fn().mockResolvedValue({
      dataCenter: {
        stockCount: 5120,
        dailyBarCount: 250000,
        latestDailyBarDate: '20260514',
        financialFactorCount: 32000,
        latestFinancialFactorDate: '20260510',
      },
      strategies: { total: 3, codes: ['equal-weight', 'momentum-top-n', 'multi-factor'] },
      backtests: {
        total: 3,
        byStatus: { SUCCESS: 2, FAILED: 1, PENDING: 0, RUNNING: 0, CANCELED: 0 },
        latestTask: {
          id: 'bt-1',
          name: '多因子验证',
          strategyName: 'multi-factor',
          status: 'SUCCESS',
          startDate: '20260501',
          endDate: '20260514',
        },
      },
    }),
    getDataCenterSummary: jest.fn().mockResolvedValue({
      stocks: { dataSet: 'stocks', total: 5120, latestDate: '20260514' },
      dailyBars: { dataSet: 'dailyBars', total: 250000, latestDate: '20260514' },
      financialFactors: { dataSet: 'financialFactors', total: 32000, latestDate: '20260510' },
    }),
    listStrategies: jest.fn().mockReturnValue([
      { code: 'equal-weight', name: 'Equal Weight Strategy', version: '1.0.0', configSchema: [] },
      { code: 'momentum-top-n', name: 'Momentum TopN', version: '1.0.0', configSchema: [] },
      { code: 'multi-factor', name: 'Multi Factor', version: '1.0.0', configSchema: [] },
    ]),
    listBacktests: jest.fn().mockResolvedValue([
      {
        id: 'bt-1',
        name: '多因子验证',
        strategyName: 'multi-factor',
        status: 'SUCCESS',
        startDate: '20260501',
        endDate: '20260514',
        initialCapital: '1000000',
      },
      {
        id: 'bt-2',
        name: '动量对照',
        strategyName: 'momentum-top-n',
        status: 'FAILED',
        startDate: '20260501',
        endDate: '20260514',
        initialCapital: '1000000',
      },
      {
        id: 'bt-3',
        name: '等权基准',
        strategyName: 'equal-weight',
        status: 'SUCCESS',
        startDate: '20260501',
        endDate: '20260514',
        initialCapital: '1000000',
      },
    ]),
    getStrategySampleSignals: jest.fn().mockResolvedValue([
      { securityId: '000001', targetWeight: 0.3, reason: 'multi-factor sample signal' },
      { securityId: '600000', targetWeight: 0.2, reason: 'multi-factor sample signal' },
    ]),
    listStocks: jest.fn().mockResolvedValue([
      { symbol: '000001', name: '平安银行', industry: '银行', market: '主板' },
      { symbol: '600000', name: '浦发银行', industry: '银行', market: '主板' },
    ]),
  } as unknown as DashboardService;
}

function createPortfolioService(): PortfolioContextService {
  return {
    getContext: jest.fn().mockResolvedValue({
      owner: 'Ricki',
      accountScope: 'A 股账户 + 可见基金持仓',
      stockAccount: {
        positionLevel: '半仓不到',
        positions: [
          {
            symbol: '600366',
            name: '宁波韵升',
            quantity: 800,
            costPrice: 13.47,
            latestPrice: 14.1,
            marketValue: 11280,
            unrealizedPnl: 504,
            theme: '机器人 / 新材料 / 磁材',
            themeTags: ['机器人', '新材料', '磁材'],
            thesis: '物理 AI 与机器人链条观察标的。',
            actionBias: 'hold',
          },
        ],
      },
      fundAccount: {
        totalAssetValue: 141737,
        visibleAssetValue: 135386,
        exposures: [],
      },
      themeExposures: [
        {
          theme: '海外科技',
          source: 'fund',
          amount: 33910,
          weightPercent: 23.93,
          actionBias: 'hold',
          riskNote: '纳指100为最大单一基金暴露。',
          nextStep: '继续跟踪海外科技波动。',
        },
      ],
      allocation: {
        stockCostValue: 10776,
        stockMarketValue: 11280,
        fundVisibleValue: 135386,
        estimatedTotalValue: 146666,
        cashAmount: 6351,
        topThemeWeightPercent: 23.93,
      },
      watchThemes: ['海外科技', '机器人 / 物理 AI'],
      riskFlags: ['海外科技: 纳指100为最大单一基金暴露。'],
      actionPolicy: {
        allowedActions: ['hold', 'add', 'build', 'watch', 'take_profit', 'risk_control'],
        defaultBias: 'watch',
        rules: ['没有真实行情和主题强弱确认前，默认观察，不主动追高。'],
      },
    }),
  } as unknown as PortfolioContextService;
}
