import { Module } from '@nestjs/common';
import { RiskService } from './application/risk.service';

@Module({
  providers: [RiskService],
  exports: [RiskService],
})
export class RiskModule {}
