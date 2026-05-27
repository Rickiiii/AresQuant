import { PortfolioContextService } from './portfolio-context.service';
import type { PortfolioContextRepository } from '../domain/portfolio.repositories';

describe('PortfolioContextService', () => {
  it('builds Ricki portfolio context from persisted holdings and exposures', async () => {
    const service = new PortfolioContextService(createRepository());

    const context = await service.getContext('Ricki');

    expect(context).not.toBeNull();
    if (context === null) {
      throw new Error('Expected portfolio context');
    }
    expect(context).toMatchObject({
      owner: 'Ricki',
      accountScope: 'A 股账户 + 可见基金持仓',
      stockAccount: {
        positionLevel: '半仓不到',
        positions: [
          expect.objectContaining({
            symbol: '600366',
            name: '宁波韵升',
            quantity: 800,
            costPrice: 13.47,
            latestPrice: 14.1,
            marketValue: 11280,
            theme: '机器人 / 新材料 / 磁材',
            actionBias: 'hold',
          }),
        ],
      },
      fundAccount: {
        totalAssetValue: 141737,
        visibleAssetValue: 135386,
        exposures: [
          expect.objectContaining({ name: '纳指100', theme: '海外科技', amount: 33910, weightPercent: 23.93 }),
          expect.objectContaining({ name: '通信设备', theme: '通信设备 / CPO', amount: 21137, weightPercent: 14.91 }),
        ],
      },
      allocation: {
        stockCostValue: 10776,
        stockMarketValue: 11280,
        fundVisibleValue: 135386,
        estimatedTotalValue: 146666,
        cashAmount: 6351,
        topThemeWeightPercent: 23.93,
      },
    });
    expect(context.watchThemes).toEqual(['海外科技', '通信设备 / CPO', '机器人 / 物理 AI']);
    expect(context.riskFlags).toEqual(expect.arrayContaining([
      expect.stringContaining('海外科技'),
      expect.stringContaining('机器人 / 物理 AI'),
    ]));
  });

  it('returns null when no persisted portfolio context exists', async () => {
    const repository: PortfolioContextRepository = {
      findPrimaryContext: jest.fn().mockResolvedValue(null),
      upsertPrimaryContext: jest.fn(),
    };
    const service = new PortfolioContextService(repository);

    await expect(service.getContext('Ricki')).resolves.toBeNull();
  });

  it('seeds Ricki portfolio context through repository upsert', async () => {
    const repository = createRepository();
    const service = new PortfolioContextService(repository);

    const context = await service.seedRickiContext();

    expect(repository.upsertPrimaryContext).toHaveBeenCalledWith(expect.objectContaining({
      account: expect.objectContaining({
        owner: 'Ricki',
        name: 'A 股账户 + 可见基金持仓',
        accountType: 'mixed',
        isPrimary: true,
      }),
      stockHoldings: expect.arrayContaining([
        expect.objectContaining({ symbol: '600366', name: '宁波韵升', quantity: 800 }),
        expect.objectContaining({ symbol: '601689', name: '拓普集团', quantity: 200 }),
        expect.objectContaining({ symbol: '002031', name: '巨轮智能', quantity: 1500 }),
        expect.objectContaining({ symbol: '002714', name: '牧原股份', quantity: 100 }),
      ]),
      fundHoldings: expect.arrayContaining([
        expect.objectContaining({ name: '纳指100', theme: '海外科技', amount: 33910 }),
        expect.objectContaining({ name: '通信设备', theme: '通信设备 / CPO', amount: 21137 }),
      ]),
      themeExposures: expect.arrayContaining([
        expect.objectContaining({ theme: '海外科技', source: 'fund' }),
        expect.objectContaining({ theme: '机器人 / 物理 AI', source: 'stock' }),
      ]),
    }));
    expect(context).toMatchObject({
      owner: 'Ricki',
      stockAccount: {
        positions: expect.arrayContaining([
          expect.objectContaining({ symbol: '600366' }),
        ]),
      },
    });
  });
});

function createRepository(): PortfolioContextRepository {
  return {
    findPrimaryContext: jest.fn().mockResolvedValue({
      account: {
        id: 'account-1',
        owner: 'Ricki',
        name: 'A 股账户 + 可见基金持仓',
        accountType: 'mixed',
        totalAssetValue: 141737,
        visibleAssetValue: 135386,
        cashAmount: 6351,
        positionLevel: '半仓不到',
      },
      stockHoldings: [
        {
          accountId: 'account-1',
          symbol: '600366',
          name: '宁波韵升',
          quantity: 800,
          costPrice: 13.47,
          latestPrice: 14.1,
          marketValue: 11280,
          unrealizedPnl: 504,
          themeTags: ['机器人', '新材料', '磁材'],
          riskLevel: 'medium',
          actionBias: 'hold',
          thesis: '物理 AI 与机器人链条观察标的。',
        },
      ],
      fundHoldings: [
        {
          accountId: 'account-1',
          fundCode: null,
          name: '纳指100',
          theme: '海外科技',
          amount: 33910,
          weightPercent: 23.93,
          riskLevel: 'medium',
          actionBias: 'hold',
        },
        {
          accountId: 'account-1',
          fundCode: null,
          name: '通信设备',
          theme: '通信设备 / CPO',
          amount: 21137,
          weightPercent: 14.91,
          riskLevel: 'medium',
          actionBias: 'watch',
        },
      ],
      themeExposures: [
        {
          accountId: 'account-1',
          theme: '海外科技',
          source: 'fund',
          amount: 33910,
          weightPercent: 23.93,
          actionBias: 'hold',
          riskNote: '纳指100为最大单一基金暴露。',
          nextStep: '继续跟踪海外科技波动。',
        },
        {
          accountId: 'account-1',
          theme: '机器人 / 物理 AI',
          source: 'stock',
          amount: 11280,
          weightPercent: null,
          actionBias: 'watch',
          riskNote: '股票侧机器人方向弹性和波动同步放大。',
          nextStep: '结合实时价格计算实际权重。',
        },
      ],
      watchlistItems: [
        {
          accountId: 'account-1',
          symbol: null,
          name: '机器人观察池',
          theme: '机器人 / 物理 AI',
          reason: '物理 AI 主线观察。',
          actionBias: 'watch',
        },
      ],
    }),
    upsertPrimaryContext: jest.fn(async (input) => input),
  };
}
