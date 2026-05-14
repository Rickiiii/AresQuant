import { BadRequestException, Body, Controller, Get, NotFoundException, Param, Post } from '@nestjs/common';
import { ApiBody, ApiOkResponse, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { ok, type ApiResponse } from '@/common/types/api-response';
import { StrategyService } from '../application/strategy.service';
import type { Strategy, StrategyConfig, StrategyContext, StrategyScore, StrategySignal } from '../domain/strategy.types';
import { StrategyConfigDto, StrategySignalsRequestDto } from './dto/strategy-api.dto';

interface StrategySummaryResponse {
  readonly code: string;
  readonly name: string;
  readonly version: string;
  readonly description?: string;
}

interface StrategyValidationResponse {
  readonly valid: true;
}

@ApiTags('strategies')
@Controller('strategies')
export class StrategyController {
  constructor(private readonly strategyService: StrategyService) {}

  @Get()
  @ApiOperation({ summary: 'List registered strategies' })
  @ApiOkResponse({ description: 'Registered strategy list' })
  list(): ApiResponse<readonly StrategySummaryResponse[]> {
    return ok(this.strategyService.list().map(toSummary));
  }

  @Get(':name')
  @ApiOperation({ summary: 'Get strategy metadata by code' })
  @ApiParam({ name: 'name', example: 'multi-factor' })
  @ApiOkResponse({ description: 'Strategy metadata' })
  get(@Param('name') name: string): ApiResponse<StrategySummaryResponse> {
    return ok(toSummary(this.getStrategy(name)));
  }

  @Post(':name/validate-config')
  @ApiOperation({ summary: 'Validate a strategy configuration' })
  @ApiParam({ name: 'name', example: 'multi-factor' })
  @ApiBody({ type: StrategyConfigDto })
  @ApiOkResponse({ description: 'Validation result' })
  validateConfig(
    @Param('name') name: string,
    @Body() dto: StrategyConfigDto,
  ): ApiResponse<StrategyValidationResponse> {
    const strategy = this.getStrategy(name);
    try {
      strategy.validateConfig(toConfig(dto));
    } catch (error) {
      throw new BadRequestException(error instanceof Error ? error.message : 'Invalid strategy config');
    }

    return ok({ valid: true });
  }

  @Post(':name/signals')
  @ApiOperation({ summary: 'Generate strategy target position signals' })
  @ApiParam({ name: 'name', example: 'multi-factor' })
  @ApiBody({ type: StrategySignalsRequestDto })
  @ApiOkResponse({ description: 'Generated target position signals' })
  async signals(
    @Param('name') name: string,
    @Body() dto: StrategySignalsRequestDto,
  ): Promise<ApiResponse<readonly StrategySignal[]>> {
    const strategy = this.getStrategy(name);
    try {
      return ok(await strategy.generateSignals(toContext(dto), toConfig(dto)));
    } catch (error) {
      throw new BadRequestException(error instanceof Error ? error.message : 'Invalid strategy signal request');
    }
  }

  private getStrategy(name: string): Strategy {
    try {
      return this.strategyService.get(name);
    } catch {
      throw new NotFoundException(`Strategy not found: ${name}`);
    }
  }
}

function toSummary(strategy: Strategy): StrategySummaryResponse {
  return {
    code: strategy.code,
    name: strategy.name,
    version: strategy.version,
    ...(strategy.description === undefined ? {} : { description: strategy.description }),
  };
}

function toConfig(dto: StrategyConfigDto): StrategyConfig {
  return {
    ...(dto.maxPositions === undefined ? {} : { maxPositions: dto.maxPositions }),
    ...(dto.normalizeMethod === undefined ? {} : { normalizeMethod: dto.normalizeMethod }),
    ...(dto.factors === undefined ? {} : { factors: dto.factors }),
    ...(dto.metadata === undefined ? {} : { metadata: dto.metadata }),
  };
}

function toContext(dto: StrategySignalsRequestDto): StrategyContext {
  return {
    tradeDate: new Date(dto.tradeDate),
    ...(dto.previousTradeDate === undefined ? {} : { previousTradeDate: new Date(dto.previousTradeDate) }),
    rebalanceRange: {
      from: new Date(dto.rebalanceFrom),
      to: new Date(dto.rebalanceTo),
    },
    universe: dto.universe,
    ...(dto.factorValues === undefined
      ? {}
      : {
          factorValues: dto.factorValues.map((value) => ({
            securityId: value.securityId,
            factorCode: value.factorCode,
            value: value.value,
            tradeDate: new Date(value.tradeDate),
          })),
        }),
    ...(dto.momentumScores === undefined ? {} : { momentumScores: dto.momentumScores.map(toStrategyScore) }),
  };
}

function toStrategyScore(dto: {
  readonly securityId: string;
  readonly score: number;
  readonly tradeDate: string;
  readonly source: string;
}): StrategyScore {
  return {
    securityId: dto.securityId,
    score: dto.score,
    tradeDate: new Date(dto.tradeDate),
    source: dto.source,
  };
}
