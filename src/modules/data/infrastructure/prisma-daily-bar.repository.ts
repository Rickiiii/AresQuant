import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { Decimal } from 'decimal.js';
import type { DateRange } from '@/common/types/date-range';
import { PrismaService } from '@/database/prisma.service';
import { DailyBarEntity } from '../domain/entities/daily-bar.entity';
import type { DailyBarRepository } from '../domain/repositories/daily-bar.repository';

@Injectable()
export class PrismaDailyBarRepository implements DailyBarRepository {
  constructor(private readonly prisma: PrismaService) {}

  async upsertMany(bars: readonly DailyBarEntity[]): Promise<number> {
    return this.prisma.$transaction(async (tx: Prisma.TransactionClient): Promise<number> => {
      let affectedRows = 0;
      for (const bar of bars) {
        const props = bar.toProperties();
        const optionalRates = {
          ...(props.turnoverRate === undefined ? {} : { turnoverRate: props.turnoverRate.toString() }),
          ...(props.volumeRatio === undefined ? {} : { volumeRatio: props.volumeRatio.toString() }),
        };
        const barValues = {
          open: props.open.toString(),
          high: props.high.toString(),
          low: props.low.toString(),
          close: props.close.toString(),
          previousClose: props.previousClose.toString(),
          change: props.change.toString(),
          pctChange: props.pctChange.toString(),
          volume: props.volume.toString(),
          amount: props.amount.toString(),
          isLimitUp: props.isLimitUp,
          isLimitDown: props.isLimitDown,
          isSuspended: props.isSuspended,
          source: props.source,
          ...optionalRates,
        };
        await tx.dailyBar.upsert({
          where: {
            securityId_tradeDate: {
              securityId: props.securityId,
              tradeDate: props.tradeDate,
            },
          },
          update: barValues,
          create: {
            securityId: props.securityId,
            tradeDate: props.tradeDate,
            ...barValues,
          },
        });
        affectedRows += 1;
      }
      return affectedRows;
    });
  }

  async findBySecurity(securityId: string, range: DateRange): Promise<readonly DailyBarEntity[]> {
    const records = await this.prisma.dailyBar.findMany({
      where: {
        securityId,
        tradeDate: {
          gte: range.from,
          lte: range.to,
        },
      },
      orderBy: {
        tradeDate: 'asc',
      },
    });

    return records.map((record) => {
      const optionalRates = {
        ...(record.turnoverRate === null ? {} : { turnoverRate: toDecimal(record.turnoverRate) }),
        ...(record.volumeRatio === null ? {} : { volumeRatio: toDecimal(record.volumeRatio) }),
      };
      return DailyBarEntity.create({
        securityId: record.securityId,
        tradeDate: record.tradeDate,
        open: toDecimal(record.open),
        high: toDecimal(record.high),
        low: toDecimal(record.low),
        close: toDecimal(record.close),
        previousClose: toDecimal(record.previousClose),
        change: toDecimal(record.change),
        pctChange: toDecimal(record.pctChange),
        volume: toDecimal(record.volume),
        amount: toDecimal(record.amount),
        isLimitUp: record.isLimitUp,
        isLimitDown: record.isLimitDown,
        isSuspended: record.isSuspended,
        source: record.source,
        ...optionalRates,
      });
    });
  }
}

function toDecimal(value: Prisma.Decimal): Decimal {
  return new Decimal(value.toString());
}
