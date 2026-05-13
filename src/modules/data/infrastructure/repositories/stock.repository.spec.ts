import { Exchange } from '@prisma/client';
import { PrismaStockRepository } from './prisma-data-center.repositories';
import type { PrismaService } from '@/database/prisma.service';

describe('PrismaStockRepository', () => {
  it('upserts stocks in a transaction', async () => {
    const upsert = jest.fn().mockResolvedValue({});
    const prisma = {
      $transaction: async <T>(callback: (tx: { stock: { upsert: typeof upsert } }) => Promise<T>): Promise<T> =>
        callback({ stock: { upsert } }),
      stock: {
        findUnique: jest.fn(),
        findMany: jest.fn(),
        findFirst: jest.fn(),
        count: jest.fn(),
        deleteMany: jest.fn(),
      },
    } as unknown as PrismaService;
    const repository = new PrismaStockRepository(prisma);

    const count = await repository.upsertMany([
      {
        symbol: '000001',
        tsCode: '000001.SZ',
        name: '平安银行',
        exchange: Exchange.SZSE,
        market: '主板',
        listDate: '19910403',
        isActive: true,
        isST: false,
      },
    ]);

    expect(count).toBe(1);
    expect(upsert).toHaveBeenCalledTimes(1);
  });
});
