import { Body, Controller, Get, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ok, type ApiResponse } from '@/common/types/api-response';
import { PortfolioContextService } from '../application/portfolio-context.service';
import { PortfolioService } from '../application/portfolio.service';
import { PortfolioContextDto as EditablePortfolioContextDto, UpsertPortfolioFundHoldingDto, UpsertPortfolioStockHoldingDto } from './dto/portfolio-context.dto';
import { PortfolioContextDto, PortfolioFundExposureDto, PortfolioPositionDto, PortfolioTradingDecisionDto } from './dto/portfolio.dto';

@ApiTags('portfolio')
@Controller('portfolio')
export class PortfolioController {
  constructor(
    private readonly portfolioContextService: PortfolioContextService,
    private readonly portfolioService: PortfolioService,
  ) {}

  @Get('context')
  @ApiOperation({ summary: 'Get Ricki portfolio context for frontend portfolio workbench' })
  @ApiOkResponse({ type: PortfolioContextDto })
  async context(): Promise<ApiResponse<PortfolioContextDto>> {
    return ok(await this.portfolioService.getContext());
  }

  @Get('context/editable')
  @ApiOperation({ summary: 'Get Ricki editable portfolio context from persisted holdings and exposures' })
  @ApiOkResponse({ type: EditablePortfolioContextDto })
  async editableContext(): Promise<ApiResponse<EditablePortfolioContextDto | null>> {
    return ok(await this.portfolioContextService.getContext('Ricki'));
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
  @ApiOperation({ summary: 'Get portfolio-aware trading decision report' })
  @ApiOkResponse({ type: PortfolioTradingDecisionDto })
  async tradingDecision(): Promise<ApiResponse<PortfolioTradingDecisionDto>> {
    return ok(await this.portfolioService.getTradingDecision());
  }

  @Post('context/seed-ricki')
  @ApiOperation({ summary: 'Seed Ricki portfolio context with the current fallback holdings and exposures' })
  @ApiOkResponse({ type: EditablePortfolioContextDto })
  async seedRickiContext(): Promise<ApiResponse<EditablePortfolioContextDto>> {
    return ok(await this.portfolioContextService.seedRickiContext());
  }

  @Post('holdings/stocks')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Add or update Ricki stock holding for research workflows' })
  @ApiOkResponse({ type: EditablePortfolioContextDto })
  async upsertStockHolding(@Body() dto: UpsertPortfolioStockHoldingDto): Promise<ApiResponse<EditablePortfolioContextDto>> {
    return ok(await this.portfolioContextService.upsertStockHolding(dto, 'Ricki'));
  }

  @Post('holdings/funds')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Add or update Ricki fund exposure for research workflows' })
  @ApiOkResponse({ type: EditablePortfolioContextDto })
  async upsertFundHolding(@Body() dto: UpsertPortfolioFundHoldingDto): Promise<ApiResponse<EditablePortfolioContextDto>> {
    return ok(await this.portfolioContextService.upsertFundHolding(dto, 'Ricki'));
  }
}
