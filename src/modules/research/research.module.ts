import { Module } from '@nestjs/common';
import { ResearchService } from './application/research.service';
import { ResearchController } from './presentation/research.controller';

@Module({
  controllers: [ResearchController],
  providers: [ResearchService],
  exports: [ResearchService],
})
export class ResearchModule {}
