import { PortfolioService } from './portfolio.service';

describe('PortfolioService', () => {
  it('returns fallback Ricki portfolio context when editable context is unavailable', async () => {
    const service = new PortfolioService();

    const context = await service.getContext();

    expect(context.source).toBe('fallback');
    expect(context.owner).toBe('Ricki');
    expect(context.summary.stockCostValue).toBe('69608.69');
    expect(context.summary.visibleFundValue).toBe('135386.00');
    expect(context.positions.map((position) => position.symbol)).toEqual(['600366', '601689', '002031', '002714', '603005', '560710', '002050']);
    expect(context.fundExposures).toHaveLength(11);
  });

  it('maps editable portfolio context into frontend portfolio DTOs', async () => {
    const portfolioContextService = {
      getContext: jest.fn().mockResolvedValue({
        owner: 'Ricki',
        accountScope: 'A 股账户 + 可见基金持仓',
        stockAccount: {
          positionLevel: '半仓不到',
          positions: [{
            symbol: '600366',
            name: '宁波韵升',
            quantity: 800,
            costPrice: 13.47,
            latestPrice: 14.25,
            marketValue: 11400,
            unrealizedPnl: 624,
            theme: '机器人 / 新材料',
            themeTags: ['机器人', '新材料'],
            thesis: '机器人链条观察仓',
            actionBias: 'hold',
          }],
        },
        fundAccount: {
          totalAssetValue: 150000,
          visibleAssetValue: 120000,
          exposures: [{ fundCode: null, name: '纳指100', theme: '海外科技', amount: 33910, weightPercent: 23.93, actionBias: 'hold' }],
        },
        themeExposures: [],
        allocation: {
          stockCostValue: 10776,
          stockMarketValue: 11400,
          fundVisibleValue: 120000,
          estimatedTotalValue: 131400,
          cashAmount: 0,
          topThemeWeightPercent: 23.93,
        },
        watchThemes: ['机器人'],
        riskFlags: ['科技成长集中'],
        actionPolicy: {
          allowedActions: ['hold', 'add', 'build', 'watch', 'take_profit', 'risk_control'],
          defaultBias: 'watch',
          rules: ['不追高'],
        },
      }),
    };
    const service = new PortfolioService(portfolioContextService as never);

    const context = await service.getContext();

    expect(context.source).toBe('database');
    expect(context.positions[0]).toMatchObject({
      symbol: '600366',
      latestPrice: '14.250000',
      marketValue: '11400.00',
      unrealizedPnl: '624.00',
    });
    expect(context.fundExposures[0]).toMatchObject({ name: '纳指100', amount: '33910.00' });
    expect(context.actionRules).toEqual(['不追高']);
  });

  it('builds a trading decision report from portfolio context', async () => {
    const service = new PortfolioService();

    const report = await service.getTradingDecision();

    expect(report.summary.riskLevel).toMatch(/low|medium|high/);
    expect(report.decisions.length).toBeGreaterThan(0);
    expect(report.actionBuckets).toHaveProperty('hold');
    expect(report.disclaimers[0]).toContain('不构成投资建议');
  });

  it('builds actionable daily decisions from live quotes with stock names and data freshness', async () => {
    const dataProvider = {
      getStockQuotes: jest.fn().mockResolvedValue([
        { symbol: '600366', name: '宁波韵升', latestPrice: 14.82, change: 0.38, pctChange: 2.63, open: 14.2, high: 15.01, low: 14.1, preClose: 14.44, volume: 1200000, amount: 178000000, source: 'eastmoney' },
        { symbol: '601689', name: '拓普集团', latestPrice: 66.1, change: -2.41, pctChange: -3.52, open: 68.4, high: 69, low: 65.8, preClose: 68.51, volume: 900000, amount: 612000000, source: 'eastmoney' },
        { symbol: '002031', name: '巨轮智能', latestPrice: 7.21, change: -0.41, pctChange: -5.38, open: 7.66, high: 7.7, low: 7.18, preClose: 7.62, volume: 1800000, amount: 132000000, source: 'eastmoney' },
        { symbol: '002714', name: '牧原股份', latestPrice: 45.02, change: 0.31, pctChange: 0.69, open: 44.8, high: 45.3, low: 44.2, preClose: 44.71, volume: 600000, amount: 270000000, source: 'eastmoney' },
        { symbol: '603005', name: '晶方科技', latestPrice: 40.8, change: 1.28, pctChange: 3.24, open: 39.8, high: 41.2, low: 39.5, preClose: 39.52, volume: 500000, amount: 202000000, source: 'eastmoney' },
        { symbol: '560710', name: '船舶ETF', latestPrice: 1.08, change: 0.02, pctChange: 1.89, open: 1.06, high: 1.09, low: 1.05, preClose: 1.06, volume: 5000000, amount: 5400000, source: 'eastmoney' },
        { symbol: '002050', name: '三花智控', latestPrice: 46.11, change: 0.94, pctChange: 2.08, open: 44.54, high: 46.5, low: 44.24, preClose: 45.17, volume: 671057, amount: 3079475379, source: 'eastmoney' },
      ]),
      getMarketSnapshots: jest.fn().mockResolvedValue([
        { code: '000001.SH', name: '上证指数', category: 'index', latestPrice: 3100.12, change: 18.21, pctChange: 0.59, amount: 420000000000, source: 'eastmoney' },
        { code: '518880.SH', name: '黄金 ETF', category: 'theme', latestPrice: 5.46, change: -0.03, pctChange: -0.55, amount: 1800000000, source: 'eastmoney' },
        { code: '159941.SZ', name: '纳指 ETF', category: 'theme', latestPrice: 1.42, change: 0.04, pctChange: 2.18, amount: 520000000, source: 'eastmoney' },
      ]),
      getDailyBars: jest.fn((symbol: string) => Promise.resolve(makeDailyBars(symbol, symbol === '002031' ? 8.6 : 12, symbol === '002031' ? 7.2 : 14.5))),
    };
    const service = new PortfolioService(undefined, dataProvider as never);

    const report = await service.getTradingDecision();

    expect(report.dataStatus.status).toBe('live');
    expect(report.dataStatus.label).toContain('实时行情已更新');
    expect(report.dataStatus.sources).toEqual(['eastmoney']);
    expect(report.summary.primaryAction).toContain('宁波韵升');
    expect(report.actionBuckets.avoidAdd.some((item) => item.includes('巨轮智能'))).toBe(true);
    expect([...report.actionBuckets.hold, ...report.actionBuckets.addOnStrength].some((item) => item.includes('宁波韵升'))).toBe(true);
    expect(report.decisions.find((item) => item.name === '巨轮智能')).toMatchObject({
      symbol: '002031',
      latestPrice: '7.210000',
      action: 'avoid_add',
      systemAction: {
        code: 'avoid_add',
        label: '禁止加仓',
        needsAttention: true,
        severity: 'important',
      },
    });
    expect(report.decisions.find((item) => item.name === '牧原股份')?.systemAction).toMatchObject({
      code: 'no_action',
      label: '不操作',
      needsAttention: false,
    });
    expect(report.decisions.find((item) => item.name === '巨轮智能')?.reasons.join(' ')).toContain('当日下跌');
    expect(report.decisions.find((item) => item.name === '晶方科技')?.triggers.join(' ')).toContain('强势确认');
    expect(report.fundSignals.find((item) => item.fundName === '纳指100')).toMatchObject({
      proxyCode: '159941.SZ',
      proxyName: '纳指 ETF',
      proxyPctChange: '2.18',
      signalLabel: '主题偏强',
    });
    expect(report.themeRadar[0]).toMatchObject({
      theme: 'AI / 机器人',
      riskLevel: 'high',
    });
    expect(report.themeRadar.find((item) => item.theme === '海外科技')).toMatchObject({
      theme: '海外科技',
      riskLevel: 'medium',
      heatLabel: '主题偏强',
    });
    expect(report.themeRadar.find((item) => item.theme === 'AI / 机器人')?.members.join(' ')).toContain('宁波韵升');
    expect(report.themeRadar.find((item) => item.theme === 'AI / 机器人')?.members.join(' ')).toContain('人工智能');
    expect(report.dailyActions.some((item) => item.title.includes('禁止加仓'))).toBe(true);
    expect(report.dailyActions.some((item) => item.detail.includes('建议不加仓'))).toBe(true);
    expect(report.dailyActions.some((item) => item.title.includes('无需操作'))).toBe(true);
    expect(report.themeRadar.some((item) => item.theme === 'AI / 机器人' && item.actionLabel.includes('控制'))).toBe(true);
    expect(report.investorProfile.horizon).toContain('长线');
    expect(report.investorProfile.coreView).toContain('机器人');
    expect(report.questionsForInvestor.map((item) => item.id)).toEqual(expect.arrayContaining([
      'robotics_max_weight',
      'drawdown_tolerance',
      'core_robotics_names',
    ]));
    expect(report.preferenceAdvice.some((item) => item.source === 'preference' && item.targetName === 'AI / 机器人')).toBe(true);
    expect(report.quantAdvice.some((item) => item.source === 'quant' && item.action === 'risk_reduce')).toBe(true);
    expect(report.quantSignals.find((item) => item.symbol === '002031')).toMatchObject({
      name: '巨轮智能',
      action: 'risk_reduce',
      actionLabel: '量化减仓信号',
      trend: 'downtrend',
    });
  });

  it('reports quote coverage and missing holding names when only part of positions have live quotes', async () => {
    const dataProvider = {
      getStockQuotes: jest.fn().mockResolvedValue([
        { symbol: '600366', name: '宁波韵升', latestPrice: 14.82, change: 0.38, pctChange: 2.63, open: 14.2, high: 15.01, low: 14.1, preClose: 14.44, volume: 1200000, amount: 178000000, source: 'eastmoney' },
        { symbol: '002031', name: '巨轮智能', latestPrice: 7.21, change: -0.41, pctChange: -5.38, open: 7.66, high: 7.7, low: 7.18, preClose: 7.62, volume: 1800000, amount: 132000000, source: 'eastmoney' },
      ]),
      getMarketSnapshots: jest.fn().mockResolvedValue([]),
    };
    const service = new PortfolioService(undefined, dataProvider as never);

    const report = await service.getTradingDecision();

    expect(report.dataStatus.status).toBe('live');
    expect(report.dataStatus.quoteCoverage).toMatchObject({ updated: 2, total: 7, ratio: '28.57' });
    expect(report.dataStatus.stalePositionNames).toEqual(['拓普集团', '牧原股份', '晶方科技', '船舶ETF', '三花智控']);
    expect(report.dataStatus.label).toContain('2/7');
    expect(report.summary.primaryAction).toContain('未更新行情');
    expect(report.summary.primaryAction).toContain('不做买卖');
    expect(report.intradayPlan.doNow[0]).toContain('不操作');
  });

  it('does not recommend reducing risk for a new holding with tiny loss and a large intraday drop above risk line', async () => {
    const portfolioContextService = {
      getContext: jest.fn().mockResolvedValue({
        owner: 'Ricki',
        accountScope: 'A 股账户 + 可见基金持仓',
        stockAccount: {
          positionLevel: '新买入观察',
          positions: [{
            symbol: '002837',
            name: '英维克',
            quantity: 100,
            costPrice: 66.06,
            latestPrice: null,
            marketValue: 6606,
            unrealizedPnl: null,
            theme: '液冷 / AI算力',
            themeTags: ['液冷', 'AI算力'],
            thesis: 'AI 算力液冷方向新买入观察仓',
            actionBias: 'watch',
          }],
        },
        fundAccount: { totalAssetValue: 0, visibleAssetValue: 0, exposures: [] },
        themeExposures: [],
        allocation: {
          stockCostValue: 6606,
          stockMarketValue: 6606,
          fundVisibleValue: 0,
          estimatedTotalValue: 6606,
          cashAmount: 0,
          topThemeWeightPercent: null,
        },
        watchThemes: ['液冷'],
        riskFlags: [],
        actionPolicy: {
          allowedActions: ['hold', 'add', 'build', 'watch', 'take_profit', 'risk_control'],
          defaultBias: 'watch',
          rules: ['新买入小亏不因单日波动直接减仓'],
        },
      }),
      getInvestorPreference: jest.fn().mockResolvedValue(null),
      seedRickiContext: jest.fn(),
    };
    const dataProvider = {
      getStockQuotes: jest.fn().mockResolvedValue([
        { symbol: '002837', name: '英维克', latestPrice: 65.9, change: -3.31, pctChange: -4.8, open: 68.2, high: 68.8, low: 65.5, preClose: 69.21, volume: 1000000, amount: 65900000, source: 'eastmoney' },
      ]),
      getMarketSnapshots: jest.fn().mockResolvedValue([]),
      getDailyBars: jest.fn().mockResolvedValue(makeDailyBars('002837', 66.2, 65.9)),
    };
    const service = new PortfolioService(portfolioContextService as never, dataProvider as never);

    const report = await service.getTradingDecision();
    const decision = report.decisions.find((item) => item.symbol === '002837');
    const signal = report.quantSignals.find((item) => item.symbol === '002837');

    expect(decision).toMatchObject({
      name: '英维克',
      action: 'avoid_add',
      systemAction: {
        code: 'avoid_add',
        label: '禁止加仓',
      },
    });
    expect(decision?.systemAction.instruction).not.toContain('降低风险');
    expect(signal).toMatchObject({
      action: 'avoid_add',
      actionLabel: '量化禁止加仓',
    });
    expect(report.quantAdvice.find((item) => item.targetName === '英维克')?.action).toBe('avoid_add');
  });

  it('keeps decisions conservative and explicit when live quotes are unavailable', async () => {
    const dataProvider = {
      getStockQuotes: jest.fn().mockRejectedValue(new Error('network unavailable')),
      getMarketSnapshots: jest.fn().mockRejectedValue(new Error('network unavailable')),
    };
    const service = new PortfolioService(undefined, dataProvider as never);

    const report = await service.getTradingDecision();

    expect(report.dataStatus.status).toBe('fallback');
    expect(report.dataStatus.label).toContain('实时行情未更新');
    expect(report.summary.primaryAction).toContain('长线策略');
    expect(report.summary.primaryAction).toContain('不做买卖');
    expect(report.intradayPlan.doNow[0]).toContain('不操作');
    expect(report.decisions.every((item) => item.name.length > 0 && item.symbol.length > 0)).toBe(true);
  });

  it('looks up stock quotes by normalized symbol for holding editor autofill', async () => {
    const dataProvider = {
      getStockQuotes: jest.fn().mockResolvedValue([
        { symbol: '002050', name: '三花智控', latestPrice: 46.88, change: 0.88, pctChange: 1.91, open: 46, high: 47.2, low: 45.8, preClose: 46, volume: 1000000, amount: 46880000, source: 'eastmoney' },
        { symbol: '300750', name: '宁德时代', latestPrice: 188.6, change: 2.4, pctChange: 1.29, open: 186, high: 190, low: 185.2, preClose: 186.2, volume: 1200000, amount: 226320000, source: 'eastmoney' },
      ]),
      getMarketSnapshots: jest.fn(),
    };
    const service = new PortfolioService(undefined, dataProvider as never);

    const quotes = await service.lookupStockQuotes(['002050', '300750.SZ', 'sz300750']);

    expect(dataProvider.getStockQuotes).toHaveBeenCalledWith(['002050', '300750']);
    expect(quotes).toEqual([
      expect.objectContaining({
        symbol: '002050',
        name: '三花智控',
        latestPrice: '46.880000',
        dailyPctChange: '1.91',
        quoteSource: 'eastmoney',
        market: '中小板',
        suggestedTheme: '新能源车热管理 / 物理AI机器人',
      }),
      expect.objectContaining({
        symbol: '300750',
        name: '宁德时代',
        latestPrice: '188.600000',
        quoteSource: 'eastmoney',
        market: '创业板',
      }),
    ]);
  });

  it('looks up fund quotes by fund code for fund editor autofill', async () => {
    const dataProvider = {
      getStockQuotes: jest.fn(),
      getFundQuotes: jest.fn().mockResolvedValue([
        { fundCode: '161725', name: '招商中证白酒指数(LOF)A', netValueDate: '2026-06-02', unitNetValue: 0.5742, estimatedNetValue: 0.5675, estimatedPctChange: -1.16, estimatedAt: '2026-06-03 15:00', source: 'eastmoney' },
      ]),
      getMarketSnapshots: jest.fn(),
    };
    const service = new PortfolioService(undefined, dataProvider as never);

    const quotes = await service.lookupFundQuotes(['161725']);

    expect(dataProvider.getFundQuotes).toHaveBeenCalledWith(['161725']);
    expect(quotes).toEqual([
      {
        fundCode: '161725',
        name: '招商中证白酒指数(LOF)A',
        netValueDate: '2026-06-02',
        unitNetValue: '0.5742',
        estimatedNetValue: '0.5675',
        estimatedPctChange: '-1.16',
        estimatedAt: '2026-06-03 15:00',
        quoteSource: 'eastmoney',
      },
    ]);
  });

  it('replays preference and quant advice against recent real daily bars', async () => {
    const dataProvider = {
      getStockQuotes: jest.fn().mockResolvedValue([
        { symbol: '002031', name: '巨轮智能', latestPrice: 7.21, change: -0.41, pctChange: -5.38, open: 7.66, high: 7.7, low: 7.18, preClose: 7.62, volume: 1800000, amount: 132000000, source: 'eastmoney' },
      ]),
      getMarketSnapshots: jest.fn().mockResolvedValue([]),
      getDailyBars: jest.fn((symbol: string) => Promise.resolve(makeDailyBars(symbol, symbol === '002031' ? 8.6 : 10, symbol === '002031' ? 7.2 : 11))),
    };
    const service = new PortfolioService(undefined, dataProvider as never);

    const result = await service.getAdviceBacktest(30);

    expect(result.dataStatus).toContain('真实日线');
    expect(result.summaries).toHaveLength(2);
    expect(result.items.some((item) => item.track === 'quant' && item.name === '巨轮智能' && item.verdict === '有效')).toBe(true);
    expect(dataProvider.getDailyBars).toHaveBeenCalled();
  });

  it('caches fetched daily bars for advice backtest reuse', async () => {
    const bars = makeDailyBars('002031', 8.6, 7.2);
    const dataProvider = {
      getStockQuotes: jest.fn().mockResolvedValue([
        { symbol: '002031', name: '巨轮智能', latestPrice: 7.21, change: -0.41, pctChange: -5.38, open: 7.66, high: 7.7, low: 7.18, preClose: 7.62, volume: 1800000, amount: 132000000, source: 'eastmoney' },
      ]),
      getMarketSnapshots: jest.fn().mockResolvedValue([]),
      getDailyBars: jest.fn((symbol: string) => Promise.resolve(symbol === '002031' ? bars : [])),
    };
    const dailyBarRepository = {
      findByDateRange: jest.fn().mockResolvedValue([]),
      upsertMany: jest.fn().mockResolvedValue(bars.length),
    };
    const service = new PortfolioService(undefined, dataProvider as never, dailyBarRepository);

    await service.getAdviceBacktest(30);

    expect(dailyBarRepository.findByDateRange).toHaveBeenCalledWith('002031', expect.objectContaining({ startDate: expect.any(String), endDate: expect.any(String) }));
    expect(dailyBarRepository.upsertMany).toHaveBeenCalledWith(expect.arrayContaining([
      expect.objectContaining({ symbol: '002031', tradeDate: '20260501' }),
      expect.objectContaining({ symbol: '002031', tradeDate: '20260524' }),
    ]));
  });

  it('falls back to live quote and cost basis when advice backtest daily bars are unavailable', async () => {
    const dataProvider = {
      getStockQuotes: jest.fn().mockResolvedValue([
        { symbol: '002031', name: '巨轮智能', latestPrice: 7.21, change: -0.41, pctChange: -5.38, open: 7.66, high: 7.7, low: 7.18, preClose: 7.62, volume: 1800000, amount: 132000000, source: 'eastmoney' },
      ]),
      getMarketSnapshots: jest.fn().mockResolvedValue([]),
      getDailyBars: jest.fn().mockRejectedValue(new Error('daily bars unavailable')),
    };
    const service = new PortfolioService(undefined, dataProvider as never);

    const result = await service.getAdviceBacktest(30);
    const item = result.items.find((candidate) => candidate.symbol === '002031');

    expect(result.dataStatus).toContain('真实现价和持仓成本');
    expect(item).toBeDefined();
    expect(item?.startDate).toBe('持仓成本');
    expect(item?.endPrice).toBe('7.21');
    expect(item?.verdict).not.toBe('证据不足');
    expect(item?.explanation).toContain('持仓成本');
    expect(item?.explanation).toContain('eastmoney 真实现价');
  });
});

function makeDailyBars(symbol: string, startClose: number, endClose: number): readonly {
  readonly symbol: string;
  readonly tsCode: string;
  readonly tradeDate: string;
  readonly open: number;
  readonly high: number;
  readonly low: number;
  readonly close: number;
  readonly preClose: number;
  readonly change: number;
  readonly pctChange: number;
  readonly volume: number;
  readonly amount: number;
}[] {
  return Array.from({ length: 24 }, (_, index) => {
    const ratio = index / 23;
    const close = startClose + (endClose - startClose) * ratio;
    const preClose = index === 0 ? startClose : startClose + (endClose - startClose) * ((index - 1) / 23);
    return {
      symbol,
      tsCode: `${symbol}.SZ`,
      tradeDate: `202605${String(index + 1).padStart(2, '0')}`,
      open: close,
      high: close * 1.02,
      low: close * 0.98,
      close,
      preClose,
      change: close - preClose,
      pctChange: preClose === 0 ? 0 : ((close - preClose) / preClose) * 100,
      volume: 1000000,
      amount: close * 1000000,
    };
  });
}
