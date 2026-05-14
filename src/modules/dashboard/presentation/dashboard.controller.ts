import { Controller, Get, NotFoundException, Param } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { ok, type ApiResponse } from '@/common/types/api-response';
import { DashboardService } from '../application/dashboard.service';
import { DashboardBacktestListItemDto, DashboardBacktestSummaryDto } from './dto/dashboard-backtest.dto';
import { DashboardDataCenterSummaryDto, DashboardDataSetCoverageDto, DashboardStockItemDto } from './dto/dashboard-data-center.dto';
import { DashboardOverviewDto } from './dto/dashboard-overview.dto';
import {
  DashboardStrategyDetailDto,
  DashboardStrategyListItemDto,
  DashboardStrategySignalSampleDto,
} from './dto/dashboard-strategy.dto';

@ApiTags('dashboard')
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('overview')
  @ApiOperation({ summary: 'Get dashboard overview metrics' })
  @ApiOkResponse({ type: DashboardOverviewDto })
  async overview(): Promise<ApiResponse<DashboardOverviewDto>> {
    return ok(await this.dashboardService.getOverview());
  }

  @Get('data-center')
  @ApiOperation({ summary: 'Get dashboard data center summary' })
  @ApiOkResponse({ type: DashboardDataCenterSummaryDto })
  async dataCenter(): Promise<ApiResponse<DashboardDataCenterSummaryDto>> {
    return ok(await this.dashboardService.getDataCenterSummary());
  }

  @Get('data-center/stocks')
  @ApiOperation({ summary: 'List stocks for dashboard data center pages' })
  @ApiOkResponse({ type: [DashboardStockItemDto] })
  async stocks(): Promise<ApiResponse<readonly DashboardStockItemDto[]>> {
    return ok(await this.dashboardService.listStocks());
  }

  @Get('data-center/daily-bars/coverage')
  @ApiOperation({ summary: 'Get daily bar data coverage' })
  @ApiOkResponse({ type: DashboardDataSetCoverageDto })
  async dailyBarCoverage(): Promise<ApiResponse<DashboardDataSetCoverageDto>> {
    return ok((await this.dashboardService.getDataCenterSummary()).dailyBars);
  }

  @Get('data-center/financial-factors/coverage')
  @ApiOperation({ summary: 'Get financial factor data coverage' })
  @ApiOkResponse({ type: DashboardDataSetCoverageDto })
  async financialFactorCoverage(): Promise<ApiResponse<DashboardDataSetCoverageDto>> {
    return ok((await this.dashboardService.getDataCenterSummary()).financialFactors);
  }

  @Get('backtests')
  @ApiOperation({ summary: 'List backtests for dashboard pages' })
  @ApiOkResponse({ type: [DashboardBacktestListItemDto] })
  async backtests(): Promise<ApiResponse<readonly DashboardBacktestListItemDto[]>> {
    return ok(await this.dashboardService.listBacktests());
  }

  @Get('strategies')
  @ApiOperation({ summary: 'List strategies for dashboard pages' })
  @ApiOkResponse({ type: [DashboardStrategyListItemDto] })
  strategies(): ApiResponse<readonly DashboardStrategyListItemDto[]> {
    return ok(this.dashboardService.listStrategies());
  }

  @Get('strategies/:code')
  @ApiOperation({ summary: 'Get dashboard strategy detail' })
  @ApiParam({ name: 'code', example: 'multi-factor' })
  @ApiOkResponse({ type: DashboardStrategyDetailDto })
  async strategy(@Param('code') code: string): Promise<ApiResponse<DashboardStrategyDetailDto>> {
    const detail = await this.dashboardService.getStrategyDetail(code);
    if (detail === null) {
      throw new NotFoundException(`Strategy not found: ${code}`);
    }
    return ok(detail);
  }

  @Get('strategies/:code/sample-signals')
  @ApiOperation({ summary: 'Get dashboard strategy sample signals' })
  @ApiParam({ name: 'code', example: 'multi-factor' })
  @ApiOkResponse({ type: [DashboardStrategySignalSampleDto] })
  async strategySampleSignals(@Param('code') code: string): Promise<ApiResponse<readonly DashboardStrategySignalSampleDto[]>> {
    const signals = await this.dashboardService.getStrategySampleSignals(code);
    if (signals === null) {
      throw new NotFoundException(`Strategy not found: ${code}`);
    }
    return ok(signals);
  }

  @Get('backtests/:id/summary')
  @ApiOperation({ summary: 'Get dashboard backtest summary' })
  @ApiParam({ name: 'id', example: 'task-1' })
  @ApiOkResponse({ type: DashboardBacktestSummaryDto })
  async backtestSummary(@Param('id') id: string): Promise<ApiResponse<DashboardBacktestSummaryDto>> {
    const summary = await this.dashboardService.getBacktestSummary(id);
    if (summary === null) {
      throw new NotFoundException(`Backtest task not found: ${id}`);
    }
    return ok(summary);
  }
}
