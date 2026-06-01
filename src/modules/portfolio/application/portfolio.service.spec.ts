import { PortfolioService } from './portfolio.service';

describe('PortfolioService', () => {
  it('returns fallback Ricki portfolio context when editable context is unavailable', async () => {
    const service = new PortfolioService();

    const context = await service.getContext();

    expect(context.source).toBe('fallback');
    expect(context.owner).toBe('Ricki');
    expect(context.summary.stockCostValue).toBe('57765.19');
    expect(context.summary.visibleFundValue).toBe('135386.00');
    expect(context.positions.map((position) => position.symbol)).toEqual(['600366', '601689', '002031', '002714', '603005']);
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
});
