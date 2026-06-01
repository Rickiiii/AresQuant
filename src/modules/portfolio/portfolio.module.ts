import { Module } from '@nestjs/common';
import { DatabaseModule } from '@/database/database.module';
import { DataModule } from '@/modules/data/data.module';
import { PortfolioContextService } from './application/portfolio-context.service';
import { PortfolioService } from './application/portfolio.service';
import { PORTFOLIO_CONTEXT_REPOSITORY } from './domain/portfolio.repositories';
import { PrismaPortfolioContextRepository } from './infrastructure/prisma-portfolio-context.repository';
import { PortfolioController } from './presentation/portfolio.controller';

@Module({
  imports: [DatabaseModule, DataModule],
  controllers: [PortfolioController],
  providers: [
    PortfolioContextService,
    PortfolioService,
    { provide: PORTFOLIO_CONTEXT_REPOSITORY, useClass: PrismaPortfolioContextRepository },
  ],
  exports: [PortfolioContextService, PortfolioService],
})
export class PortfolioModule {}
