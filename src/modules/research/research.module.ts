import { Module } from '@nestjs/common';
import { DashboardModule } from '../dashboard/dashboard.module';
import { PortfolioModule } from '../portfolio/portfolio.module';
import { ResearchService } from './application/research.service';
import { ResearchController } from './presentation/research.controller';

@Module({
  imports: [DashboardModule, PortfolioModule],
  controllers: [ResearchController],
  providers: [ResearchService],
  exports: [ResearchService],
})
export class ResearchModule {}
