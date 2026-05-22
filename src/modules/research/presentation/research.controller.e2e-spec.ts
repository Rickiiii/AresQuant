import { Test } from '@nestjs/testing';
import { ResearchService } from '../application/research.service';
import { ResearchController } from './research.controller';

describe('ResearchController', () => {
  async function createController(): Promise<ResearchController> {
    const moduleRef = await Test.createTestingModule({
      controllers: [ResearchController],
      providers: [ResearchService],
    }).compile();

    return moduleRef.get(ResearchController);
  }

  it('returns available A-share research playbooks', async () => {
    const controller = await createController();

    const response = controller.playbooks();

    expect(response.success).toBe(true);
    expect(response.data).toEqual(expect.arrayContaining([
      expect.objectContaining({ code: 'daily-note', name: 'Daily / Intraday Note' }),
      expect.objectContaining({ code: 'idea-generation', name: 'Idea Generation' }),
      expect.objectContaining({ code: 'portfolio-review', name: 'Portfolio Review' }),
      expect.objectContaining({ code: 'thesis-tracker', name: 'Thesis Tracker' }),
      expect.objectContaining({ code: 'catalyst-calendar', name: 'Catalyst Calendar' }),
    ]));
  });

  it('returns a structured daily note fallback for the research center', async () => {
    const controller = await createController();

    const response = await controller.dailyNote();

    expect(response.success).toBe(true);
    expect(response.data).toMatchObject({
      title: expect.stringContaining('AresQuant'),
      marketState: 'fallback',
      topConclusion: expect.stringContaining('观望'),
      actionBuckets: {
        add: expect.any(Array),
        build: expect.any(Array),
        watch: expect.any(Array),
        takeProfit: expect.any(Array),
        riskControl: expect.any(Array),
      },
    });
    expect(response.data.sections.map((section) => section.code)).toEqual([
      'market-temperature',
      'theme-strength',
      'portfolio-check',
      'factor-signals',
      'action-plan',
      'disconfirming-evidence',
    ]);
  });

  it('returns Ricki portfolio context with stock positions, fund exposures and action policy', async () => {
    const controller = await createController();

    const response = await controller.portfolioContext();

    expect(response.success).toBe(true);
    expect(response.data).toMatchObject({
      owner: 'Ricki',
      accountScope: 'A 股账户 + 可见基金持仓',
      stockAccount: {
        positionLevel: '半仓不到',
        positions: expect.arrayContaining([
          expect.objectContaining({ symbol: '600366', quantity: 800, costPrice: 13.47 }),
          expect.objectContaining({ symbol: '601689', quantity: 200, costPrice: 69.62 }),
          expect.objectContaining({ symbol: '002031', quantity: 1500, costPrice: 8.37 }),
          expect.objectContaining({ symbol: '002714', quantity: 100, costPrice: 44.67 }),
        ]),
      },
      fundAccount: {
        visibleAssetValue: 135386,
        exposures: expect.arrayContaining([
          expect.objectContaining({ name: '纳指100', theme: '海外科技', amount: 33910 }),
          expect.objectContaining({ name: '通信设备', theme: '通信设备 / CPO', amount: 21137 }),
          expect.objectContaining({ name: '黄金', theme: '黄金 / 避险', amount: 16017 }),
          expect.objectContaining({ name: '人工智能', theme: 'AI / 人工智能', amount: 13301 }),
        ]),
      },
      actionPolicy: {
        allowedActions: ['hold', 'add', 'build', 'watch', 'take_profit', 'risk_control'],
        defaultBias: 'watch',
      },
    });
    expect(response.data.watchThemes).toEqual(expect.arrayContaining(['物理 AI', '机器人', 'AI ETF']));
    expect(response.data.riskFlags.length).toBeGreaterThanOrEqual(2);
  });

  it('returns theme exposure summary with concentration and actions', async () => {
    const controller = await createController();

    const response = await controller.themeExposures();

    expect(response.success).toBe(true);
    expect(response.data).toEqual(expect.arrayContaining([
      expect.objectContaining({ theme: '海外科技', source: 'fund', amount: 33910, weightPercent: 23.93, actionBias: 'hold' }),
      expect.objectContaining({ theme: '通信设备 / CPO', source: 'fund', amount: 21137, weightPercent: 14.91, actionBias: 'watch' }),
      expect.objectContaining({ theme: 'AI / 人工智能', source: 'fund', amount: 13301, weightPercent: 9.38, actionBias: 'watch' }),
      expect.objectContaining({ theme: '机器人 / 物理 AI', source: 'stock', actionBias: 'watch' }),
    ]));
    expect(response.data[0]).toHaveProperty('riskNote');
    expect(response.data[0]).toHaveProperty('nextStep');
  });

  it('returns portfolio review, ideas, theses and catalysts fallback responses', async () => {
    const controller = await createController();

    await expect(controller.portfolioReview()).resolves.toMatchObject({
      success: true,
      data: {
        positioning: expect.objectContaining({ overallRisk: 'medium' }),
        themeExposures: expect.arrayContaining([
          expect.objectContaining({ theme: 'AI / 机器人 / 物理 AI' }),
        ]),
      },
    });

    expect((await controller.ideas()).data[0]).toMatchObject({
      symbol: 'WATCHLIST-AI-ROBOTICS',
      suggestedAction: 'watch',
      factorBreakdown: expect.any(Array),
    });

    expect(controller.theses().data[0]).toMatchObject({
      target: '核心持仓组合',
      status: 'active',
      currentAction: 'hold',
    });

    expect(controller.catalysts().data[0]).toMatchObject({
      category: 'policy',
      impactLevel: 'high',
    });
  });
});
