import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ok, type ApiResponse } from '@/common/types/api-response';
import { PortfolioContextService } from '../application/portfolio-context.service';
import { PortfolioContextDto } from './dto/portfolio-context.dto';

@ApiTags('portfolio')
@Controller('portfolio')
export class PortfolioController {
  constructor(private readonly portfolioContextService: PortfolioContextService) {}

  @Get('context')
  @ApiOperation({ summary: 'Get Ricki portfolio context from persisted holdings and exposures' })
  @ApiOkResponse({ type: PortfolioContextDto })
  async context(): Promise<ApiResponse<PortfolioContextDto | null>> {
    return ok(await this.portfolioContextService.getContext('Ricki'));
  }
}
