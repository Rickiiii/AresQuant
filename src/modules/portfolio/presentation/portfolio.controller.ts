<<<<<<< HEAD
import { Body, Controller, Get, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ok, type ApiResponse } from '@/common/types/api-response';
import { PortfolioContextService } from '../application/portfolio-context.service';
import { PortfolioContextDto, UpsertPortfolioFundHoldingDto, UpsertPortfolioStockHoldingDto } from './dto/portfolio-context.dto';
=======
import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ok, type ApiResponse } from '@/common/types/api-response';
import { PortfolioService } from '../application/portfolio.service';
import { PortfolioContextDto, PortfolioFundExposureDto, PortfolioPositionDto, PortfolioTradingDecisionDto } from './dto/portfolio.dto';
>>>>>>> a1109d3 (feat(portfolio): add personal portfolio context)

@ApiTags('portfolio')
@Controller('portfolio')
export class PortfolioController {
<<<<<<< HEAD
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
=======
  constructor(private readonly portfolioService: PortfolioService) {}

  @Get('context')
  @ApiOperation({ summary: 'Get Ricki portfolio context from database or fallback data' })
  @ApiOkResponse({ type: PortfolioContextDto })
  async context(): Promise<ApiResponse<PortfolioContextDto>> {
    return ok(await this.portfolioService.getContext());
  }

  @Get('positions')
  @ApiOperation({ summary: 'List Ricki portfolio stock positions' })
  @ApiOkResponse({ type: [PortfolioPositionDto] })
  async positions(): Promise<ApiResponse<readonly PortfolioPositionDto[]>> {
    return ok(await this.portfolioService.listPositions());
  }

  @Get('fund-exposures')
  @ApiOperation({ summary: 'List Ricki portfolio fund and theme exposures' })
  @ApiOkResponse({ type: [PortfolioFundExposureDto] })
  async fundExposures(): Promise<ApiResponse<readonly PortfolioFundExposureDto[]>> {
    return ok(await this.portfolioService.listFundExposures());
  }

  @Get('trading-decision')
  @ApiOperation({ summary: 'Get realtime portfolio-aware trading decision report' })
  @ApiOkResponse({ type: PortfolioTradingDecisionDto })
  async tradingDecision(): Promise<ApiResponse<PortfolioTradingDecisionDto>> {
    return ok(await this.portfolioService.getTradingDecision());
>>>>>>> a1109d3 (feat(portfolio): add personal portfolio context)
  }
}
