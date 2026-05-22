import { Test } from '@nestjs/testing';
import { PortfolioContextService } from '../application/portfolio-context.service';
import { PORTFOLIO_CONTEXT_REPOSITORY } from '../domain/portfolio.repositories';
import { PortfolioController } from './portfolio.controller';

describe('PortfolioController', () => {
  it('returns Ricki persisted portfolio context', async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [PortfolioController],
      providers: [
        PortfolioContextService,
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
          },
        },
      ],
    }).compile();
    const controller = moduleRef.get(PortfolioController);

    await expect(controller.context()).resolves.toMatchObject({
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
});
