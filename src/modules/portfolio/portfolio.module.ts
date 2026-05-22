import { Module } from '@nestjs/common';
import { DatabaseModule } from '@/database/database.module';
import { PortfolioContextService } from './application/portfolio-context.service';
import { PORTFOLIO_CONTEXT_REPOSITORY } from './domain/portfolio.repositories';
import { PrismaPortfolioContextRepository } from './infrastructure/prisma-portfolio-context.repository';
import { PortfolioController } from './presentation/portfolio.controller';

@Module({
  imports: [DatabaseModule],
  controllers: [PortfolioController],
  providers: [
    PortfolioContextService,
    { provide: PORTFOLIO_CONTEXT_REPOSITORY, useClass: PrismaPortfolioContextRepository },
  ],
  exports: [PortfolioContextService],
})
export class PortfolioModule {}
