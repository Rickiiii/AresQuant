import type { DateRange } from '@/common/types/date-range';
import type { DailyBarEntity } from '../entities/daily-bar.entity';

export const DAILY_BAR_REPOSITORY = Symbol('DAILY_BAR_REPOSITORY');

export interface DailyBarRepository {
  upsertMany(bars: readonly DailyBarEntity[]): Promise<number>;
  findBySecurity(securityId: string, range: DateRange): Promise<readonly DailyBarEntity[]>;
}
