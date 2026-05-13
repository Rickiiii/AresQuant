import { Body, Controller, Delete, Get, Inject, Param, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Decimal } from 'decimal.js';
import { ok, type ApiResponse } from '@/common/types/api-response';
import { BacktestEngineService } from '../application/backtest-engine.service';
import {
  BACKTEST_METRIC_REPOSITORY,
  BACKTEST_ORDER_REPOSITORY,
  BACKTEST_POSITION_REPOSITORY,
  BACKTEST_SNAPSHOT_REPOSITORY,
  BACKTEST_TASK_REPOSITORY,
  BACKTEST_TRADE_REPOSITORY,
  type BacktestAccountSnapshotRepository,
  type BacktestMetricRepository,
  type BacktestOrderRepository,
  type BacktestPositionRepository,
  type BacktestTaskRepository,
  type BacktestTradeRepository,
} from '../domain/repositories/backtest.repositories';
import { BacktestFrequency, type BacktestConfig, type BacktestResult } from '../types/backtest.types';
import { CreateBacktestDto } from './dto/create-backtest.dto';

@ApiTags('backtests')
@Controller('backtests')
export class BacktestController {
  constructor(
    private readonly backtestEngine: BacktestEngineService,
    @Inject(BACKTEST_TASK_REPOSITORY) private readonly taskRepository: BacktestTaskRepository,
    @Inject(BACKTEST_ORDER_REPOSITORY) private readonly orderRepository: BacktestOrderRepository,
    @Inject(BACKTEST_TRADE_REPOSITORY) private readonly tradeRepository: BacktestTradeRepository,
    @Inject(BACKTEST_POSITION_REPOSITORY) private readonly positionRepository: BacktestPositionRepository,
    @Inject(BACKTEST_SNAPSHOT_REPOSITORY) private readonly snapshotRepository: BacktestAccountSnapshotRepository,
    @Inject(BACKTEST_METRIC_REPOSITORY) private readonly metricRepository: BacktestMetricRepository,
  ) {}

  @Post()
  async create(@Body() dto: CreateBacktestDto): Promise<ApiResponse<BacktestResult>> {
    return ok(await this.backtestEngine.run(toConfig(dto)));
  }

  @Get()
  async list(): Promise<ApiResponse<readonly unknown[]>> {
    return ok(await this.taskRepository.findAll());
  }

  @Get(':id')
  async get(@Param('id') id: string): Promise<ApiResponse<unknown>> {
    return ok(await this.taskRepository.findById(id));
  }

  @Get(':id/orders')
  async orders(@Param('id') id: string): Promise<ApiResponse<readonly unknown[]>> {
    return ok(await this.orderRepository.findByTaskId(id));
  }

  @Get(':id/trades')
  async trades(@Param('id') id: string): Promise<ApiResponse<readonly unknown[]>> {
    return ok(await this.tradeRepository.findByTaskId(id));
  }

  @Get(':id/positions')
  async positions(@Param('id') id: string): Promise<ApiResponse<readonly unknown[]>> {
    return ok(await this.positionRepository.findByTaskId(id));
  }

  @Get(':id/snapshots')
  async snapshots(@Param('id') id: string): Promise<ApiResponse<readonly unknown[]>> {
    return ok(await this.snapshotRepository.findByTaskId(id));
  }

  @Get(':id/metrics')
  async metrics(@Param('id') id: string): Promise<ApiResponse<unknown>> {
    return ok(await this.metricRepository.findByTaskId(id));
  }

  @Delete(':id')
  async delete(@Param('id') id: string): Promise<ApiResponse<{ readonly deleted: true }>> {
    await this.taskRepository.deleteByTaskId(id);
    return ok({ deleted: true });
  }
}

function toConfig(dto: CreateBacktestDto): BacktestConfig {
  return {
    name: dto.name,
    strategyName: dto.strategyName,
    startDate: normalizeDate(dto.startDate),
    endDate: normalizeDate(dto.endDate),
    initialCapital: new Decimal(dto.initialCapital),
    ...(dto.benchmark === undefined ? {} : { benchmark: dto.benchmark }),
    frequency: dto.frequency ?? BacktestFrequency.DAILY,
    rebalanceFrequency: dto.rebalanceFrequency,
    maxPositions: dto.maxPositions,
    maxPositionWeight: new Decimal(dto.maxPositionWeight),
    commissionRate: new Decimal(dto.commissionRate),
    minCommission: new Decimal(dto.minCommission ?? 5),
    stampDutyRate: new Decimal(dto.stampDutyRate ?? 0.001),
    transferFeeRate: new Decimal(dto.transferFeeRate ?? 0.00001),
    slippageRate: new Decimal(dto.slippageRate),
    allowBuyLimitUp: dto.allowBuyLimitUp ?? false,
    allowSellLimitDown: dto.allowSellLimitDown ?? false,
    enableT1Rule: dto.enableT1Rule ?? true,
    priceMode: dto.priceMode,
    blacklist: [],
  };
}

function normalizeDate(value: string): string {
  return value.replaceAll('-', '');
}
