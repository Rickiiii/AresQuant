import { Body, Controller, Get, HttpCode, HttpStatus, Post, Query } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ok, type ApiResponse } from '@/common/types/api-response';
import { PortfolioContextService } from '../application/portfolio-context.service';
import { PortfolioService } from '../application/portfolio.service';
import { PortfolioContextDto as EditablePortfolioContextDto, UpsertPortfolioFundHoldingDto, UpsertPortfolioStockHoldingDto } from './dto/portfolio-context.dto';
import { PortfolioAdviceBacktestDto, PortfolioContextDto, PortfolioFundExposureDto, PortfolioFundQuoteDto, PortfolioInvestorPreferenceDto, PortfolioPositionDto, PortfolioStockQuoteDto, PortfolioTradingDecisionDto } from './dto/portfolio.dto';

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

  @Get('advice-backtest')
  @ApiOperation({ summary: 'Replay current preference and quant advice against recent real daily bars' })
  @ApiOkResponse({ type: PortfolioAdviceBacktestDto })
  async adviceBacktest(@Query('days') days?: string): Promise<ApiResponse<PortfolioAdviceBacktestDto>> {
    return ok(await this.portfolioService.getAdviceBacktest(parsePositiveInt(days, 30)));
  }

  @Get('investor-preference')
  @ApiOperation({ summary: 'Get Ricki investor preference config for long-term advice' })
  @ApiOkResponse({ type: PortfolioInvestorPreferenceDto })
  async investorPreference(): Promise<ApiResponse<PortfolioInvestorPreferenceDto>> {
    return ok(await this.portfolioService.getInvestorPreference());
  }

  @Post('investor-preference')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update Ricki investor preference config for long-term advice' })
  @ApiOkResponse({ type: PortfolioInvestorPreferenceDto })
  async updateInvestorPreference(@Body() dto: PortfolioInvestorPreferenceDto): Promise<ApiResponse<PortfolioInvestorPreferenceDto>> {
    return ok(await this.portfolioService.updateInvestorPreference(dto));
  }

  @Get('quotes')
  @ApiOperation({ summary: 'Lookup live stock quotes for portfolio holding editor autofill' })
  @ApiOkResponse({ type: [PortfolioStockQuoteDto] })
  async quotes(@Query('symbols') symbols: string): Promise<ApiResponse<readonly PortfolioStockQuoteDto[]>> {
    return ok(await this.portfolioService.lookupStockQuotes(parseSymbols(symbols)));
  }

  @Get('fund-quotes')
  @ApiOperation({ summary: 'Lookup fund net values for portfolio fund editor autofill' })
  @ApiOkResponse({ type: [PortfolioFundQuoteDto] })
  async fundQuotes(@Query('codes') codes: string): Promise<ApiResponse<readonly PortfolioFundQuoteDto[]>> {
    return ok(await this.portfolioService.lookupFundQuotes(parseSymbols(codes)));
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

function parseSymbols(value: string | undefined): readonly string[] {
  return (value ?? '')
    .split(/[\s,，、]+/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function parsePositiveInt(value: string | undefined, fallback: number): number {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}
