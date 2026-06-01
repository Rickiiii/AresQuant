import { Module } from '@nestjs/common';
<<<<<<< HEAD
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
=======
import { DataModule } from '@/modules/data/data.module';
import { PortfolioService } from './application/portfolio.service';
import { PortfolioController } from './presentation/portfolio.controller';

@Module({
  imports: [DataModule],
  controllers: [PortfolioController],
  providers: [PortfolioService],
  exports: [PortfolioService],
>>>>>>> a1109d3 (feat(portfolio): add personal portfolio context)
})
export class PortfolioModule {}
