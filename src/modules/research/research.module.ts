import { Module } from '@nestjs/common';
<<<<<<< HEAD
import { DashboardModule } from '../dashboard/dashboard.module';
=======
>>>>>>> a1109d3 (feat(portfolio): add personal portfolio context)
import { PortfolioModule } from '../portfolio/portfolio.module';
import { ResearchService } from './application/research.service';
import { ResearchController } from './presentation/research.controller';

@Module({
<<<<<<< HEAD
  imports: [DashboardModule, PortfolioModule],
=======
  imports: [PortfolioModule],
>>>>>>> a1109d3 (feat(portfolio): add personal portfolio context)
  controllers: [ResearchController],
  providers: [ResearchService],
  exports: [ResearchService],
})
export class ResearchModule {}
