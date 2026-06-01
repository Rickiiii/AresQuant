<<<<<<< HEAD
import type { DashboardService } from '@/modules/dashboard/application/dashboard.service';
import type { PortfolioContextService } from '@/modules/portfolio/application/portfolio-context.service';
import type { PrismaService } from '@/database/prisma.service';
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

  it('saves and lists research journal entries through Prisma raw queries', async () => {
    const prisma = createPrismaService();
    const service = new ResearchService(undefined, undefined, prisma as unknown as PrismaService);

    await expect(service.saveJournalEntry({
      noteDate: '2026-05-29',
      title: '盘中复盘',
      topConclusion: '继续观察 AI 和机器人方向。',
      actionItems: ['不追高', '等待回踩'],
      disconfirmingEvidence: ['数据同步滞后'],
      nextFocus: ['检查主题强弱'],
    })).resolves.toMatchObject({
      owner: 'Ricki',
      noteDate: '2026-05-29',
      title: '盘中复盘',
      actionItems: ['不追高', '等待回踩'],
    });

    await expect(service.listJournalEntries()).resolves.toEqual([
      expect.objectContaining({
        id: 'journal-1',
        title: '盘中复盘',
        nextFocus: ['检查主题强弱'],
      }),
    ]);
    expect(prisma.$queryRaw).toHaveBeenCalledTimes(2);
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

function createPrismaService(): { $queryRaw: jest.Mock } {
  return {
    $queryRaw: jest.fn().mockResolvedValue([
      {
        id: 'journal-1',
        owner: 'Ricki',
        note_date: new Date('2026-05-29T00:00:00.000Z'),
        title: '盘中复盘',
        top_conclusion: '继续观察 AI 和机器人方向。',
        action_items: ['不追高', '等待回踩'],
        disconfirming_evidence: ['数据同步滞后'],
        next_focus: ['检查主题强弱'],
        created_at: new Date('2026-05-29T08:00:00.000Z'),
        updated_at: new Date('2026-05-29T08:30:00.000Z'),
      },
    ]),
  };
}
=======
import type { PortfolioContextDto } from '@/modules/portfolio/presentation/dto/portfolio.dto';
import { ResearchService } from './research.service';

function createPortfolioContext(overrides: Partial<PortfolioContextDto> = {}): PortfolioContextDto {
  return {
    source: 'database',
    owner: 'Ricki',
    accountScope: 'Ricki 测试账户',
    account: {
      id: 'account-1',
      name: 'Ricki 测试账户',
      accountType: 'MIXED',
      baseCurrency: 'CNY',
      totalAssetValue: '100000.00',
      cashValue: '10000.00',
      visibleAssetValue: '30000.00',
      description: null,
    },
    summary: {
      stockCostValue: '20000.00',
      visibleFundValue: '30000.00',
      knownPortfolioValue: '50000.00',
      stockWeightPercent: '40.00',
      fundWeightPercent: '60.00',
    },
    positions: [
      {
        id: 'position-1',
        symbol: 'TEST01',
        name: '测试机器人股',
        quantity: 1000,
        costPrice: '20.000000',
        latestPrice: null,
        marketValue: null,
        unrealizedPnl: null,
        themeTags: ['机器人 / 物理 AI', '测试主题'],
        thesisSummary: '数据库中的测试 thesis',
        actionBias: 'watch',
        riskLevel: 'high',
        notes: null,
      },
    ],
    fundExposures: [
      {
        id: 'fund-1',
        name: '测试AI基金',
        fundCode: null,
        theme: 'AI / 人工智能',
        amount: '30000.00',
        weightPercent: '60.00',
        actionBias: 'build',
        riskLevel: 'medium',
        notes: null,
      },
    ],
    marketSnapshots: [],
    watchThemes: [
      {
        id: 'theme-1',
        name: '测试主题',
        category: 'AI',
        priority: 10,
        actionBias: 'watch',
        riskLevel: 'medium',
        notes: null,
      },
    ],
    riskFlags: ['数据库风险提示'],
    actionRules: ['数据库操作规则'],
    ...overrides,
  };
}

describe('ResearchService portfolio integration', () => {
  it('builds daily note calibration from PortfolioService context instead of local constants', async () => {
    const portfolioService = {
      getContext: jest.fn().mockResolvedValue(createPortfolioContext()),
    };
    const service = new ResearchService(portfolioService as never);

    const dailyNote = await service.getDailyNote();

    expect(portfolioService.getContext).toHaveBeenCalledTimes(1);
    expect(dailyNote.portfolioCalibration).toMatchObject({
      stockCostValue: 20000,
      visibleFundValue: 30000,
      knownPortfolioValue: 50000,
      stockWeightPercent: 40,
      fundWeightPercent: 60,
      highestFundTheme: 'AI / 人工智能',
      highestFundWeightPercent: 60,
    });
    expect(dailyNote.topConclusion).toContain('个股约40.0%');
    expect(dailyNote.sections.find((section) => section.code === 'portfolio-check')?.bullets).toEqual(expect.arrayContaining([
      expect.stringContaining('股票成本约20,000元'),
      expect.stringContaining('最大基金主题为AI / 人工智能'),
    ]));
  });

  it('uses live quote state in daily note when portfolio positions include Eastmoney quotes', async () => {
    const basePosition = createPortfolioContext().positions[0];
    if (basePosition === undefined) {
      throw new Error('Missing test position');
    }
    const liveContext = createPortfolioContext({
      positions: [{
        ...basePosition,
        latestPrice: '21.000000',
        marketValue: '21000.00',
        unrealizedPnl: '1000.00',
        dailyChange: '1.00',
        dailyPctChange: '5.00',
        quoteSource: 'eastmoney',
      }],
    });
    const service = new ResearchService({ getContext: jest.fn().mockResolvedValue(liveContext) } as never);

    const dailyNote = await service.getDailyNote();

    expect(dailyNote.marketState).toBe('live');
    expect(dailyNote.topConclusion).toContain('已接入 Eastmoney 实时行情');
    expect(dailyNote.sections.find((section) => section.code === 'market-temperature')?.bullets).toEqual(expect.arrayContaining([
      expect.stringContaining('已读取 1 只持仓实时价'),
      expect.stringContaining('测试机器人股+5.00%'),
    ]));
    expect(dailyNote.nextFocus[0]).toBe('继续接入指数涨跌与成交额');
  });

  it('uses live index and theme snapshots to upgrade daily note market temperature and theme strength', async () => {
    const context = createPortfolioContext({
      marketSnapshots: [
        { code: '000300.SH', name: '沪深300', category: 'index', latestPrice: '3980.120000', dailyChange: '48.20', dailyPctChange: '1.23', amount: '250000000000.00', quoteSource: 'eastmoney' },
        { code: '562500.SH', name: '机器人ETF', category: 'theme', latestPrice: '0.880000', dailyChange: '0.02', dailyPctChange: '2.50', amount: '360000000.00', quoteSource: 'eastmoney' },
        { code: '515790.SH', name: '光伏ETF', category: 'theme', latestPrice: '0.520000', dailyChange: '-0.01', dailyPctChange: '-1.20', amount: '180000000.00', quoteSource: 'eastmoney' },
      ],
    });
    const service = new ResearchService({ getContext: jest.fn().mockResolvedValue(context) } as never);

    const dailyNote = await service.getDailyNote();

    expect(dailyNote.marketState).toBe('live');
    expect(dailyNote.sections.find((section) => section.code === 'market-temperature')?.bullets).toEqual(expect.arrayContaining([
      expect.stringContaining('沪深300+1.23%'),
    ]));
    expect(dailyNote.sections.find((section) => section.code === 'theme-strength')?.bullets).toEqual(expect.arrayContaining([
      expect.stringContaining('机器人ETF+2.50%'),
      expect.stringContaining('光伏ETF-1.20%'),
    ]));
    expect(dailyNote.nextFocus).not.toContain('继续接入指数涨跌与成交额');
  });

  it('maps PortfolioService context to research portfolio context shape', async () => {
    const service = new ResearchService({ getContext: jest.fn().mockResolvedValue(createPortfolioContext()) } as never);

    const context = await service.getPortfolioContext();

    expect(context).toMatchObject({
      owner: 'Ricki',
      accountScope: 'Ricki 测试账户',
      stockAccount: {
        positions: [expect.objectContaining({ symbol: 'TEST01', costPrice: 20, theme: '机器人 / 物理 AI / 测试主题' })],
      },
      fundAccount: {
        totalAssetValue: 100000,
        visibleAssetValue: 30000,
        exposures: [expect.objectContaining({ name: '测试AI基金', amount: 30000, actionBias: 'build' })],
      },
      watchThemes: ['测试主题'],
      riskFlags: ['数据库风险提示'],
      actionPolicy: {
        defaultBias: 'watch',
        rules: ['数据库操作规则'],
      },
    });
  });

  it('derives theme exposures from PortfolioService fund exposures and stock theme tags', async () => {
    const service = new ResearchService({ getContext: jest.fn().mockResolvedValue(createPortfolioContext()) } as never);

    const exposures = await service.listThemeExposures();

    expect(exposures).toEqual(expect.arrayContaining([
      expect.objectContaining({ theme: 'AI / 人工智能', source: 'fund', amount: 30000, weightPercent: 60, actionBias: 'build' }),
      expect.objectContaining({ theme: '机器人 / 物理 AI', source: 'stock', amount: 20000, weightPercent: 40, actionBias: 'watch' }),
      expect.objectContaining({ theme: '测试主题', source: 'stock', amount: 20000, weightPercent: 40, actionBias: 'watch' }),
    ]));
  });
});
>>>>>>> a1109d3 (feat(portfolio): add personal portfolio context)
