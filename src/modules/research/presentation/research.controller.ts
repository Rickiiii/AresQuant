import { Body, Controller, Get, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ok, type ApiResponse } from '@/common/types/api-response';
import { ResearchService } from '../application/research.service';
import {
  ResearchCatalystDto,
  ResearchDailyNoteDto,
  ResearchIdeaDto,
  ResearchJournalEntryDto,
  ResearchPlaybookDto,
  ResearchPortfolioContextDto,
  ResearchPortfolioReviewDto,
  ResearchThemeExposureSummaryDto,
  ResearchThesisDto,
  SaveResearchJournalEntryDto,
} from './dto/research.dto';

@ApiTags('research')
@Controller('research')
export class ResearchController {
  constructor(private readonly researchService: ResearchService) {}

  @Get('playbooks')
  @ApiOperation({ summary: 'List A-share research playbooks available in AresQuant' })
  @ApiOkResponse({ type: [ResearchPlaybookDto] })
  playbooks(): ApiResponse<readonly ResearchPlaybookDto[]> {
    return ok(this.researchService.listPlaybooks());
  }

  @Get('daily-note')
  @ApiOperation({ summary: 'Get structured fallback daily/intraday research note' })
  @ApiOkResponse({ type: ResearchDailyNoteDto })
  async dailyNote(): Promise<ApiResponse<ResearchDailyNoteDto>> {
    return ok(await this.researchService.getDailyNote());
  }

  @Get('portfolio-review')
  @ApiOperation({ summary: 'Get structured fallback portfolio review' })
  @ApiOkResponse({ type: ResearchPortfolioReviewDto })
  async portfolioReview(): Promise<ApiResponse<ResearchPortfolioReviewDto>> {
    return ok(await this.researchService.getPortfolioReview());
  }

  @Get('portfolio-context')
  @ApiOperation({ summary: 'Get Ricki portfolio context for research workflows' })
  @ApiOkResponse({ type: ResearchPortfolioContextDto })
  async portfolioContext(): Promise<ApiResponse<ResearchPortfolioContextDto>> {
    return ok(await this.researchService.getPortfolioContext());
  }

  @Get('theme-exposures')
  @ApiOperation({ summary: 'List portfolio theme exposure summary with action bias' })
  @ApiOkResponse({ type: [ResearchThemeExposureSummaryDto] })
  async themeExposures(): Promise<ApiResponse<readonly ResearchThemeExposureSummaryDto[]>> {
    return ok(await this.researchService.listThemeExposures());
  }

  @Get('ideas')
  @ApiOperation({ summary: 'List fallback research idea candidates' })
  @ApiOkResponse({ type: [ResearchIdeaDto] })
  async ideas(): Promise<ApiResponse<readonly ResearchIdeaDto[]>> {
    return ok(await this.researchService.listIdeas());
  }

  @Get('theses')
  @ApiOperation({ summary: 'List fallback investment theses' })
  @ApiOkResponse({ type: [ResearchThesisDto] })
  theses(): ApiResponse<readonly ResearchThesisDto[]> {
    return ok(this.researchService.listTheses());
  }

  @Get('catalysts')
  @ApiOperation({ summary: 'List fallback catalyst events for the research center' })
  @ApiOkResponse({ type: [ResearchCatalystDto] })
  catalysts(): ApiResponse<readonly ResearchCatalystDto[]> {
    return ok(this.researchService.listCatalysts());
  }

  @Get('journal')
  @ApiOperation({ summary: 'List saved research journal entries' })
  @ApiOkResponse({ type: [ResearchJournalEntryDto] })
  async journal(): Promise<ApiResponse<readonly ResearchJournalEntryDto[]>> {
    return ok(await this.researchService.listJournalEntries('Ricki'));
  }

  @Post('journal')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Save or update a research journal entry' })
  @ApiOkResponse({ type: ResearchJournalEntryDto })
  async saveJournal(@Body() dto: SaveResearchJournalEntryDto): Promise<ApiResponse<ResearchJournalEntryDto>> {
    return ok(await this.researchService.saveJournalEntry(dto, 'Ricki'));
  }
}
