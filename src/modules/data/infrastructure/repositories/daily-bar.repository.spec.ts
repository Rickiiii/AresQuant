import { PrismaPhase2DailyBarRepository } from './prisma-data-center.repositories';
import type { PrismaService } from '@/database/prisma.service';

describe('PrismaPhase2DailyBarRepository', () => {
  it('upserts daily bars by symbol and trade date', async () => {
    const upsert = jest.fn().mockResolvedValue({});
    const prisma = {
      $transaction: async <T>(callback: (tx: { dailyBar: { upsert: typeof upsert } }) => Promise<T>): Promise<T> =>
        callback({ dailyBar: { upsert } }),
      dailyBar: {
        findMany: jest.fn(),
        findFirst: jest.fn(),
        count: jest.fn(),
        deleteMany: jest.fn(),
      },
    } as unknown as PrismaService;
    const repository = new PrismaPhase2DailyBarRepository(prisma);

    const count = await repository.upsertMany([
      {
        symbol: '000001',
        tsCode: '000001.SZ',
        tradeDate: '20260514',
        open: 10,
        high: 11,
        low: 9,
        close: 10.5,
        preClose: 10,
        change: 0.5,
        pctChange: 5,
        volume: 1000,
        amount: 10500,
      },
    ]);

    expect(count).toBe(1);
    expect(upsert).toHaveBeenCalledTimes(1);
  });
});
