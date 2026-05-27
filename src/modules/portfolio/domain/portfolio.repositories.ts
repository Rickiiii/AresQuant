import type { PortfolioContextRecord } from './portfolio.types';

export const PORTFOLIO_CONTEXT_REPOSITORY = Symbol('PORTFOLIO_CONTEXT_REPOSITORY');

export interface PortfolioContextRepository {
  findPrimaryContext(owner: string): Promise<PortfolioContextRecord | null>;
  upsertPrimaryContext(input: PortfolioContextRecord): Promise<PortfolioContextRecord>;
}
