import { Body, Controller, Get, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ok, type ApiResponse } from '@/common/types/api-response';
import { PortfolioContextService } from '../application/portfolio-context.service';
import { PortfolioContextDto, UpsertPortfolioFundHoldingDto, UpsertPortfolioStockHoldingDto } from './dto/portfolio-context.dto';

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

  @Post('context/seed-ricki')
  @ApiOperation({ summary: 'Seed Ricki portfolio context with the current fallback holdings and exposures' })
  @ApiOkResponse({ type: PortfolioContextDto })
  async seedRickiContext(): Promise<ApiResponse<PortfolioContextDto>> {
    return ok(await this.portfolioContextService.seedRickiContext());
  }

  @Post('holdings/stocks')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Add or update Ricki stock holding for research workflows' })
  @ApiOkResponse({ type: PortfolioContextDto })
  async upsertStockHolding(@Body() dto: UpsertPortfolioStockHoldingDto): Promise<ApiResponse<PortfolioContextDto>> {
    return ok(await this.portfolioContextService.upsertStockHolding(dto, 'Ricki'));
  }

  @Post('holdings/funds')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Add or update Ricki fund exposure for research workflows' })
  @ApiOkResponse({ type: PortfolioContextDto })
  async upsertFundHolding(@Body() dto: UpsertPortfolioFundHoldingDto): Promise<ApiResponse<PortfolioContextDto>> {
    return ok(await this.portfolioContextService.upsertFundHolding(dto, 'Ricki'));
  }
}
