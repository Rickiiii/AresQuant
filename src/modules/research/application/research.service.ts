<<<<<<< HEAD
import { Injectable, Optional } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { DashboardService } from '@/modules/dashboard/application/dashboard.service';
import { PortfolioContextService } from '@/modules/portfolio/application/portfolio-context.service';
import { PrismaService } from '@/database/prisma.service';
import type { PortfolioContextDto, PortfolioThemeExposureSummaryDto } from '@/modules/portfolio/presentation/dto/portfolio-context.dto';
import type { DashboardBacktestListItemDto } from '@/modules/dashboard/presentation/dto/dashboard-backtest.dto';
import type { DashboardDataCenterSummaryDto } from '@/modules/dashboard/presentation/dto/dashboard-data-center.dto';
import type { DashboardOverviewDto } from '@/modules/dashboard/presentation/dto/dashboard-overview.dto';
import type { DashboardStrategySignalSampleDto } from '@/modules/dashboard/presentation/dto/dashboard-strategy.dto';
=======
import { Injectable } from '@nestjs/common';
import { PortfolioService } from '@/modules/portfolio/application/portfolio.service';
>>>>>>> a1109d3 (feat(portfolio): add personal portfolio context)
import type {
  PortfolioContextDto,
  PortfolioFundExposureDto,
  PortfolioMarketSnapshotDto,
  PortfolioPositionDto,
} from '@/modules/portfolio/presentation/dto/portfolio.dto';
import type {
  ResearchAction,
  ResearchCatalystDto,
  ResearchDailyNoteDto,
  ResearchFundExposureDto,
  ResearchIdeaDto,
<<<<<<< HEAD
  ResearchJournalEntryDto,
=======
  ResearchMarketSnapshotDto,
>>>>>>> a1109d3 (feat(portfolio): add personal portfolio context)
  ResearchPlaybookDto,
  ResearchPortfolioContextDto,
  ResearchPortfolioReviewDto,
  ResearchStockPositionDto,
  ResearchThemeExposureSummaryDto,
  ResearchThesisDto,
  SaveResearchJournalEntryDto,
} from '../presentation/dto/research.dto';

@Injectable()
export class ResearchService {
<<<<<<< HEAD
  constructor(
    @Optional() private readonly dashboardService?: DashboardService,
    @Optional() private readonly portfolioContextService?: PortfolioContextService,
    @Optional() private readonly prisma?: PrismaService,
  ) {}
=======
  constructor(private readonly portfolioService: PortfolioService) {}
>>>>>>> a1109d3 (feat(portfolio): add personal portfolio context)

  listPlaybooks(): readonly ResearchPlaybookDto[] {
    return RESEARCH_PLAYBOOKS;
  }

  async getDailyNote(): Promise<ResearchDailyNoteDto> {
<<<<<<< HEAD
    const liveContext = await this.loadLiveContext();
    if (liveContext === null) {
      return DAILY_NOTE;
    }
    return buildLiveDailyNote(liveContext);
  }

  async getPortfolioReview(): Promise<ResearchPortfolioReviewDto> {
    const liveContext = await this.loadLiveContext();
    if (liveContext === null) {
      return PORTFOLIO_REVIEW;
    }
    return buildLivePortfolioReview(liveContext);
  }

  async getPortfolioContext(): Promise<ResearchPortfolioContextDto> {
    const context = await this.loadPortfolioContext();
    if (context === null) {
      return PORTFOLIO_CONTEXT;
    }
    return toResearchPortfolioContext(context);
  }

  async listThemeExposures(): Promise<readonly ResearchThemeExposureSummaryDto[]> {
    const context = await this.loadPortfolioContext();
    if (context === null) {
      return THEME_EXPOSURES;
    }
    return context.themeExposures.map(toResearchThemeExposure);
=======
    const context = await this.portfolioService.getContext();
    return buildPortfolioAwareDailyNote(context);
  }

  async getPortfolioReview(): Promise<ResearchPortfolioReviewDto> {
    const context = await this.portfolioService.getContext();
    const stockCostValue = toNumber(context.summary.stockCostValue);
    const visibleFundValue = toNumber(context.summary.visibleFundValue);
    const topFundThemes = context.fundExposures.slice(0, 5).map((exposure) => exposure.name).join('、');

    return {
      positioning: {
        stockExposure: `A 股股票成本约 ${formatWan(stockCostValue)} 万，个股权重约 ${context.summary.stockWeightPercent}%，机器人/物理 AI 与 AI 硬件方向需要一起看集中度。`,
        fundExposure: `${topFundThemes}等暴露已结构化，基金可见资产约 ${formatWan(visibleFundValue)} 万。`,
        cashLevel: context.account.cashValue === null ? '仍保留继续分批加仓空间' : `现金约 ${formatCurrency(toNumber(context.account.cashValue))} 元`,
        overallRisk: context.riskFlags.some((flag) => flag.includes('集中') || flag.includes('高波动')) ? 'medium' : 'low',
      },
      themeExposures: buildReviewThemeExposures(context),
      priorities: ['先控制高拥挤主题追高风险。', '再寻找强主题回踩后的分批建仓点。', '保留现金应对风格切换。'],
      riskNotes: ['第一版为 Portfolio Context 驱动的静态分析，不构成买卖建议。', '真实建议必须继续接入行情、持仓成本和主题强弱后生成。'],
    };
  }

  async getPortfolioContext(): Promise<ResearchPortfolioContextDto> {
    const context = await this.portfolioService.getContext();
    return mapPortfolioContextToResearchContext(context);
  }

  async listThemeExposures(): Promise<readonly ResearchThemeExposureSummaryDto[]> {
    const context = await this.portfolioService.getContext();
    return buildThemeExposureSummaries(context);
>>>>>>> a1109d3 (feat(portfolio): add personal portfolio context)
  }

  async listIdeas(): Promise<readonly ResearchIdeaDto[]> {
    const liveContext = await this.loadLiveContext();
    if (liveContext === null) {
      return IDEAS;
    }
    return buildLiveIdeas(liveContext);
  }

  listTheses(): readonly ResearchThesisDto[] {
    return THESES;
  }

  listCatalysts(): readonly ResearchCatalystDto[] {
    return CATALYSTS;
  }

  async listJournalEntries(owner = 'Ricki'): Promise<readonly ResearchJournalEntryDto[]> {
    if (this.prisma === undefined) {
      return [];
    }
    const rows = await this.prisma.$queryRaw<ResearchJournalEntryRow[]>(Prisma.sql`
      SELECT id::text, owner, note_date, title, top_conclusion, action_items, disconfirming_evidence, next_focus, created_at, updated_at
      FROM research_journal_entries
      WHERE owner = ${owner}
      ORDER BY note_date DESC, updated_at DESC
      LIMIT 20
    `);
    return rows.map(toResearchJournalEntryDto);
  }

  async saveJournalEntry(input: SaveResearchJournalEntryDto, owner = 'Ricki'): Promise<ResearchJournalEntryDto> {
    if (this.prisma === undefined) {
      return {
        id: 'preview-entry',
        owner,
        noteDate: input.noteDate ?? new Date().toISOString().slice(0, 10),
        title: input.title,
        topConclusion: input.topConclusion,
        actionItems: input.actionItems ?? [],
        disconfirmingEvidence: input.disconfirmingEvidence ?? [],
        nextFocus: input.nextFocus ?? [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    }
    const noteDate = input.noteDate ?? new Date().toISOString().slice(0, 10);
    const rows = await this.prisma.$queryRaw<ResearchJournalEntryRow[]>(Prisma.sql`
      INSERT INTO research_journal_entries (owner, note_date, title, top_conclusion, action_items, disconfirming_evidence, next_focus)
      VALUES (
        ${owner},
        ${noteDate}::date,
        ${input.title},
        ${input.topConclusion},
        ${JSON.stringify(input.actionItems ?? [])}::jsonb,
        ${JSON.stringify(input.disconfirmingEvidence ?? [])}::jsonb,
        ${JSON.stringify(input.nextFocus ?? [])}::jsonb
      )
      ON CONFLICT (owner, note_date, title)
      DO UPDATE SET
        top_conclusion = EXCLUDED.top_conclusion,
        action_items = EXCLUDED.action_items,
        disconfirming_evidence = EXCLUDED.disconfirming_evidence,
        next_focus = EXCLUDED.next_focus,
        updated_at = CURRENT_TIMESTAMP
      RETURNING id::text, owner, note_date, title, top_conclusion, action_items, disconfirming_evidence, next_focus, created_at, updated_at
    `);
    const entry = rows[0];
    if (entry === undefined) {
      throw new Error('Research journal entry was not saved');
    }
    return toResearchJournalEntryDto(entry);
  }

  private async loadLiveContext(): Promise<ResearchLiveContext | null> {
    if (this.dashboardService === undefined) {
      return null;
    }

    try {
      const [overview, dataCenter, backtests, sampleSignals, stocks] = await Promise.all([
        this.dashboardService.getOverview(),
        this.dashboardService.getDataCenterSummary(),
        this.dashboardService.listBacktests(),
        this.dashboardService.getStrategySampleSignals('multi-factor'),
        this.dashboardService.listStocks(),
      ]);
      return {
        overview,
        dataCenter,
        backtests,
        sampleSignals: sampleSignals ?? [],
        stocksBySymbol: new Map(stocks.map((stock) => [stock.symbol, stock])),
      };
    } catch {
      return null;
    }
  }

  private async loadPortfolioContext(): Promise<PortfolioContextDto | null> {
    if (this.portfolioContextService === undefined) {
      return null;
    }

    try {
      return await this.portfolioContextService.getContext('Ricki');
    } catch {
      return null;
    }
  }
}

interface ResearchJournalEntryRow {
  readonly id: string;
  readonly owner: string;
  readonly note_date: Date;
  readonly title: string;
  readonly top_conclusion: string;
  readonly action_items: unknown;
  readonly disconfirming_evidence: unknown;
  readonly next_focus: unknown;
  readonly created_at: Date;
  readonly updated_at: Date;
}

interface ResearchLiveContext {
  readonly overview: DashboardOverviewDto;
  readonly dataCenter: DashboardDataCenterSummaryDto;
  readonly backtests: readonly DashboardBacktestListItemDto[];
  readonly sampleSignals: readonly DashboardStrategySignalSampleDto[];
  readonly stocksBySymbol: ReadonlyMap<string, { readonly symbol: string; readonly name: string; readonly industry?: string; readonly market?: string }>;
}

function buildLiveDailyNote(context: ResearchLiveContext): ResearchDailyNoteDto {
  const latestDate = context.overview.dataCenter.latestDailyBarDate ?? 'unknown';
  const successCount = context.overview.backtests.byStatus.SUCCESS ?? 0;
  const totalBacktests = Math.max(context.overview.backtests.total, 1);
  const successText = `${successCount}/${totalBacktests}`;
  const strategyCodes = context.overview.strategies.codes.join(' / ');

  return {
    ...DAILY_NOTE,
    title: `AresQuant 真实数据投研快照 ${latestDate}`,
    marketState: 'live',
    topConclusion: `当前数据中心覆盖 ${context.overview.dataCenter.stockCount} 只股票、${context.overview.dataCenter.dailyBarCount} 条日线和 ${context.overview.dataCenter.financialFactorCount} 条财务因子；策略池包含 ${strategyCodes}，回测成功 ${successText}，建议以真实信号确认后的观察和分批动作为主。`,
    sections: [
      {
        code: 'market-temperature',
        title: '市场温度',
        bullets: [
          `股票池 ${context.overview.dataCenter.stockCount} 只，日线 ${context.overview.dataCenter.dailyBarCount} 条，最新日线 ${latestDate}。`,
          `财务因子 ${context.overview.dataCenter.financialFactorCount} 条，最新财务数据 ${context.overview.dataCenter.latestFinancialFactorDate ?? '待同步'}。`,
        ],
      },
      {
        code: 'theme-strength',
        title: '主题强弱',
        bullets: [
          '主题暴露仍以当前持仓和基金上下文为基础，后续用行业/主题行情替换静态标签。',
          `数据集覆盖：stocks ${context.dataCenter.stocks?.total ?? 0}，dailyBars ${context.dataCenter.dailyBars?.total ?? 0}，financialFactors ${context.dataCenter.financialFactors?.total ?? 0}。`,
        ],
      },
      {
        code: 'portfolio-check',
        title: '持仓检查',
        bullets: [
          `组合上下文已加载 Ricki 股票和基金暴露；最新回测任务：${context.overview.backtests.latestTask?.name ?? '暂无'}。`,
          'Portfolio Context 已支持最新价、市值和浮盈亏；缺失价格时股票侧仍以成本口径估算。',
        ],
      },
      {
        code: 'factor-signals',
        title: '策略/因子信号',
        bullets: [
          `正式策略 ${context.overview.strategies.total} 个：${strategyCodes}。`,
          `multi-factor sample signals ${context.sampleSignals.length} 条，回测成功 ${successText}。`,
        ],
      },
      {
        code: 'action-plan',
        title: '操作建议',
        bullets: [
          '有真实数据覆盖时，优先把建议落到观察池、分批建仓、风控和止盈四类动作。',
          '样例信号只用于投研候选，不作为自动交易或实盘指令。',
        ],
      },
      {
        code: 'disconfirming-evidence',
        title: '反证条件',
        bullets: [
          '数据同步明显滞后、回测失败率升高或 sample signal 缺失时降低建议置信度。',
          ...DAILY_NOTE.disconfirmingEvidence.slice(0, 2),
        ],
      },
    ],
    actionBuckets: {
      ...DAILY_NOTE.actionBuckets,
      watch: context.sampleSignals.length > 0
        ? context.sampleSignals.map((signal) => `${signal.securityId} ${stockName(context, signal.securityId)} · ${(signal.targetWeight * 100).toFixed(2)}%`)
        : DAILY_NOTE.actionBuckets.watch,
      riskControl: [
        `若数据最新日期不是 ${latestDate} 或回测失败任务增加，先暂停提高仓位。`,
        ...DAILY_NOTE.actionBuckets.riskControl,
      ],
    },
    nextFocus: [
      '把 Research ideas 接入 multi-factor sample signals',
      '用最新回测结果校准建议置信度',
      '把 Portfolio Context 的持仓数据接入真实价格同步',
    ],
  };
}

function buildLivePortfolioReview(context: ResearchLiveContext): ResearchPortfolioReviewDto {
  const latestDate = context.overview.dataCenter.latestDailyBarDate ?? '待同步';
  const strategyCodes = context.overview.strategies.codes.join(' / ');
  const successCount = context.overview.backtests.byStatus.SUCCESS ?? 0;
  const failedCount = context.overview.backtests.byStatus.FAILED ?? 0;

  return {
    positioning: {
      stockExposure: `数据中心当前覆盖 ${context.overview.dataCenter.stockCount} 只股票，Ricki 股票持仓仍按成本口径跟踪。`,
      fundExposure: `策略池 ${strategyCodes} 已可为基金/主题暴露提供投研参照。`,
      cashLevel: PORTFOLIO_REVIEW.positioning.cashLevel,
      overallRisk: failedCount > successCount ? 'high' : 'medium',
    },
    themeExposures: PORTFOLIO_REVIEW.themeExposures.map((item) => ({
      ...item,
      suggestion: `${item.suggestion} 最新日线 ${latestDate}，需与当前主题强弱共同确认。`,
    })),
    priorities: [
      `先确认数据最新日期 ${latestDate} 与持仓观察周期一致。`,
      `优先跟踪 multi-factor 输出的 ${context.sampleSignals.length} 个候选标的。`,
      `回测成功 ${successCount} 个、失败 ${failedCount} 个；失败升高时降低动作置信度。`,
    ],
    riskNotes: [
      '真实行情数据已进入投研摘要；持仓市值和盈亏会优先读取 Portfolio Context，缺失时回退成本口径。',
      ...PORTFOLIO_REVIEW.riskNotes,
    ],
  };
}

function buildLiveIdeas(context: ResearchLiveContext): readonly ResearchIdeaDto[] {
  if (context.sampleSignals.length === 0) {
    return IDEAS;
  }

  const latestDate = context.overview.dataCenter.latestDailyBarDate ?? '待同步';
  return context.sampleSignals.slice(0, 6).map((signal) => {
    const stock = context.stocksBySymbol.get(signal.securityId);
    const name = stock?.name ?? signal.securityId;
    const industry = stock?.industry ?? stock?.market ?? 'A 股';
    const targetWeight = (signal.targetWeight * 100).toFixed(2);

    return {
      symbol: signal.securityId,
      name,
      suggestedAction: 'watch',
      oneLineThesis: `${name} 进入 multi-factor 样例信号，目标权重 ${targetWeight}%，先作为投研观察而不是交易指令。`,
      factorBreakdown: [
        { factor: 'Strategy Signal', signal: `${targetWeight}%`, explanation: signal.reason },
        { factor: 'Data Coverage', signal: latestDate, explanation: `日线与财务因子覆盖支持 ${industry} 标的进入候选池。` },
        { factor: 'Backtest Health', signal: `${context.overview.backtests.byStatus.SUCCESS ?? 0}/${Math.max(context.overview.backtests.total, 1)}`, explanation: '用回测成功率作为建议置信度的基础约束。' },
      ],
      risks: [
        'sample signal 只代表策略样例，不等于完整实盘建议。',
        '未接入真实持仓市值前，需避免同主题重复暴露。',
      ],
      triggers: [
        `数据最新日期保持在 ${latestDate} 且无明显同步缺口。`,
        '主题强度、估值和回测表现共同支持时再进入分批动作。',
      ],
    };
  });
}

function stockName(context: ResearchLiveContext, symbol: string): string {
  return context.stocksBySymbol.get(symbol)?.name ?? symbol;
}

function toResearchPortfolioContext(context: PortfolioContextDto): ResearchPortfolioContextDto {
  return {
    owner: context.owner,
    accountScope: context.accountScope,
    stockAccount: {
      positionLevel: context.stockAccount.positionLevel,
      positions: context.stockAccount.positions.map((position) => ({
        symbol: position.symbol,
        name: position.name,
        quantity: position.quantity,
        costPrice: position.costPrice,
        latestPrice: position.latestPrice,
        marketValue: position.marketValue,
        unrealizedPnl: position.unrealizedPnl,
        theme: position.theme,
        thesis: position.thesis,
        actionBias: position.actionBias,
      })),
    },
    fundAccount: {
      totalAssetValue: context.fundAccount.totalAssetValue,
      visibleAssetValue: context.fundAccount.visibleAssetValue,
      exposures: context.fundAccount.exposures.map((exposure) => ({
        name: exposure.name,
        theme: exposure.theme,
        amount: exposure.amount,
        weightPercent: exposure.weightPercent,
        actionBias: exposure.actionBias,
      })),
    },
    watchThemes: context.watchThemes,
    riskFlags: context.riskFlags,
    actionPolicy: context.actionPolicy,
  };
}

function toResearchThemeExposure(exposure: PortfolioThemeExposureSummaryDto): ResearchThemeExposureSummaryDto {
  return {
    theme: exposure.theme,
    source: exposure.source,
    amount: exposure.amount,
    weightPercent: exposure.weightPercent,
    actionBias: exposure.actionBias,
    riskNote: exposure.riskNote,
    nextStep: exposure.nextStep,
  };
}

function toResearchJournalEntryDto(row: ResearchJournalEntryRow): ResearchJournalEntryDto {
  return {
    id: row.id,
    owner: row.owner,
    noteDate: toDateOnly(row.note_date),
    title: row.title,
    topConclusion: row.top_conclusion,
    actionItems: asStringArray(row.action_items),
    disconfirmingEvidence: asStringArray(row.disconfirming_evidence),
    nextFocus: asStringArray(row.next_focus),
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString(),
  };
}

function asStringArray(value: unknown): readonly string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : [];
}

function toDateOnly(value: Date): string {
  return value.toISOString().slice(0, 10);
}

const RESEARCH_PLAYBOOKS: readonly ResearchPlaybookDto[] = [
  {
    code: 'daily-note',
    name: 'Daily / Intraday Note',
    description: '盘前、14:30 盘中和收盘后复盘模板，强调市场温度、主题强弱、持仓影响和反证条件。',
    output: ['一句话结论', '市场温度', '主题强弱', '持仓检查', '操作建议', '反证条件'],
  },
  {
    code: 'idea-generation',
    name: 'Idea Generation',
    description: '结合主题、动量、估值、波动和持仓上下文生成可解释观察标的。',
    output: ['候选标的', '因子拆解', '为什么现在看', '风险', '触发条件'],
  },
  {
    code: 'portfolio-review',
    name: 'Portfolio Review',
    description: '按股票、基金、现金和主题暴露检查组合状态，给出加仓、观望、止盈和风控优先级。',
    output: ['仓位状态', '主题暴露', '持仓建议', '调仓优先级', '风险提示'],
  },
  {
    code: 'thesis-tracker',
    name: 'Thesis Tracker',
    description: '记录每个持仓或观察方向的核心逻辑、风险、催化剂、退出条件和更新日志。',
    output: ['核心逻辑', '支撑证据', '风险点', '催化剂', '退出条件'],
  },
  {
    code: 'catalyst-calendar',
    name: 'Catalyst Calendar',
    description: '跟踪财报、政策、行业大会、美股科技映射和指数调仓等可能影响持仓的催化剂。',
    output: ['事件', '相关标的/主题', '影响级别', '当前应对'],
  },
];

function buildPortfolioAwareDailyNote(context: PortfolioContextDto): ResearchDailyNoteDto {
  const stockCostValue = roundMoney(toNumber(context.summary.stockCostValue));
  const visibleFundValue = roundMoney(toNumber(context.summary.visibleFundValue));
  const knownPortfolioValue = roundMoney(toNumber(context.summary.knownPortfolioValue));
  const stockWeightPercent = roundPercent(toNumber(context.summary.stockWeightPercent));
  const fundWeightPercent = roundPercent(toNumber(context.summary.fundWeightPercent));
  const highestFund = findHighestFundExposure(context.fundExposures);
  const marketSnapshots = context.marketSnapshots.map(mapMarketSnapshotToResearchSnapshot);
  const liveMarketSnapshots = marketSnapshots.filter((snapshot) => snapshot.quoteSource === 'eastmoney');
  const hasLiveQuotes = context.positions.some((position) => position.quoteSource === 'eastmoney');
  const hasLiveMarketSnapshots = liveMarketSnapshots.length > 0;
  const hasLiveMarket = hasLiveQuotes || hasLiveMarketSnapshots;
  const liveQuoteCount = context.positions.filter((position) => position.quoteSource === 'eastmoney').length;
  const topMovedPosition = findTopMovedPosition(context.positions);
  const topMovedIndex = findTopMovedMarketSnapshot(liveMarketSnapshots, 'index');
  const strongestTheme = findStrongestThemeSnapshot(liveMarketSnapshots);
  const weakestTheme = findWeakestThemeSnapshot(liveMarketSnapshots);
  const watchThemeNames = context.watchThemes.map((theme) => theme.name);
  const watchThemeText = watchThemeNames.length > 0 ? watchThemeNames.slice(0, 6).join('、') : 'AI、机器人、通信设备、黄金和绿电';

  return {
    title: 'AresQuant Portfolio-aware Daily Note',
    marketState: hasLiveMarket ? 'live' : 'fallback',
    topConclusion: hasLiveMarket
      ? buildLiveTopConclusion(liveQuoteCount, context.positions.length, topMovedPosition, topMovedIndex, strongestTheme, stockWeightPercent)
      : `当前已按 Ricki Portfolio Context 校准：基金仍是主仓，但个股约${stockWeightPercent.toFixed(1)}%并非 3.3%；机器人/物理 AI 个股已有一定弹性仓位，后续以持有、观察和回踩分批为主，不追高。`,
    portfolioCalibration: {
      stockCostValue,
      visibleFundValue,
      knownPortfolioValue,
      stockWeightPercent,
      fundWeightPercent,
      highestFundTheme: highestFund.theme,
      highestFundWeightPercent: toNumber(highestFund.weightPercent ?? '0'),
    },
    marketSnapshots,
    sections: [
      {
        code: 'market-temperature',
        title: '市场温度',
        bullets: hasLiveMarket
          ? buildMarketTemperatureBullets(liveQuoteCount, topMovedPosition, topMovedIndex)
          : ['当前未接入实时市场温度时，默认不把单日热点当作加仓依据。', '后续接入指数涨跌、成交额和涨跌家数后，再动态提高或降低动作置信度。'],
      },
      {
        code: 'theme-strength',
        title: '主题强弱',
        bullets: hasLiveMarketSnapshots
          ? buildThemeStrengthBullets(strongestTheme, weakestTheme, watchThemeText)
          : [`重点观察${watchThemeText}。`, '科技成长暴露已不低，只有主线强且回踩质量好时才考虑继续分批。'],
      },
      {
        code: 'portfolio-check',
        title: '持仓检查',
        bullets: [
          `股票成本约${formatCurrency(stockCostValue)}元，个股不是3.3%，而是约${stockWeightPercent}%。`,
          `基金仍是主仓，已知可见基金约${formatCurrency(visibleFundValue)}元，占已知组合约${fundWeightPercent}%。`,
          `最大基金主题为${highestFund.theme}，占基金账户约${highestFund.weightPercent ?? '0'}%，与 A 股科技成长方向存在同向波动。`,
        ],
      },
      {
        code: 'factor-signals',
        title: '策略/因子信号',
        bullets: ['暂未接入实时因子时不主动加仓；后续用 Momentum、Volatility、估值和主题强度共同确认。'],
      },
      {
        code: 'action-plan',
        title: '操作建议',
        bullets: ['核心仓位继续按 thesis 持有；AI/机器人 ETF 只在回踩不破时小仓分批。', '绿电、新能源和高弹性机器人股优先保留风控条件。'],
      },
      {
        code: 'disconfirming-evidence',
        title: '反证条件',
        bullets: ['若 AI/机器人/通信设备同步退潮，停止追加同类科技仓。', '若高弹性个股跌破趋势且主题转弱，优先风控而不是摊平。'],
      },
    ],
    actionBuckets: buildActionBuckets(context),
    disconfirmingEvidence: [
      '指数和主线主题同步放量破位。',
      '个股实际权重继续抬升导致组合过度集中。',
      '通信、AI、机器人和纳指科技共振回撤。',
    ],
    nextFocus: hasLiveMarketSnapshots
      ? ['接入涨跌家数与成交额分位', '接入上次复盘记录对照', '接入主题趋势持续性评分']
      : hasLiveQuotes
        ? ['继续接入指数涨跌与成交额', '接入主题强弱数据', '接入上次复盘记录对照']
        : ['接入实时价格计算股票市值权重', '接入主题强弱数据', '接入上次复盘记录对照'],
  };
}

function mapMarketSnapshotToResearchSnapshot(snapshot: PortfolioMarketSnapshotDto): ResearchMarketSnapshotDto {
  return {
    code: snapshot.code,
    name: snapshot.name,
    category: snapshot.category,
    latestPrice: toNumber(snapshot.latestPrice),
    dailyChange: toNumber(snapshot.dailyChange),
    dailyPctChange: toNumber(snapshot.dailyPctChange),
    amount: toNumber(snapshot.amount),
    quoteSource: snapshot.quoteSource,
  };
}

function buildLiveTopConclusion(
  liveQuoteCount: number,
  positionCount: number,
  topMovedPosition: PortfolioPositionDto | undefined,
  topMovedIndex: ResearchMarketSnapshotDto | undefined,
  strongestTheme: ResearchMarketSnapshotDto | undefined,
  stockWeightPercent: number,
): string {
  const positionText = liveQuoteCount > 0
    ? `当前 ${liveQuoteCount}/${positionCount} 只个股有实时价`
    : '个股实时价暂未完全覆盖';
  const indexText = topMovedIndex === undefined ? '指数温度待继续观察' : `${topMovedIndex.name}${formatSignedPercent(topMovedIndex.dailyPctChange)}`;
  const themeText = strongestTheme === undefined ? '主题强弱待继续观察' : `主题侧先看${strongestTheme.name}${formatSignedPercent(strongestTheme.dailyPctChange)}`;
  const positionMoveText = topMovedPosition === undefined
    ? '组合个股整体波动'
    : `${topMovedPosition.name}${formatSignedPercent(toNumber(topMovedPosition.dailyPctChange ?? '0'))}`;
  return `已接入 Eastmoney 实时行情：${positionText}，${indexText}，${themeText}；今日先结合${positionMoveText}决定是否加仓。个股成本权重约${stockWeightPercent.toFixed(1)}%，仍以回踩确认和风控优先。`;
}

function buildMarketTemperatureBullets(
  liveQuoteCount: number,
  topMovedPosition: PortfolioPositionDto | undefined,
  topMovedIndex: ResearchMarketSnapshotDto | undefined,
): readonly string[] {
  return [
    topMovedIndex === undefined
      ? '已接入实时市场快照，但指数样本暂未形成明确温度判断。'
      : `指数温度锚点：${topMovedIndex.name}${formatSignedPercent(topMovedIndex.dailyPctChange)}，成交额约${formatYi(topMovedIndex.amount)}亿。`,
    liveQuoteCount > 0
      ? `已读取 ${liveQuoteCount} 只持仓实时价，继续用个股日内涨跌校准今日操作节奏。`
      : '持仓实时价暂未覆盖时，先用指数和主题温度控制加仓节奏。',
    topMovedPosition === undefined
      ? '暂无明显领涨/领跌持仓，保持组合级观察。'
      : `今日波动最大持仓：${topMovedPosition.name}${formatSignedPercent(toNumber(topMovedPosition.dailyPctChange ?? '0'))}。`,
  ];
}

function buildThemeStrengthBullets(
  strongestTheme: ResearchMarketSnapshotDto | undefined,
  weakestTheme: ResearchMarketSnapshotDto | undefined,
  watchThemeText: string,
): readonly string[] {
  return [
    strongestTheme === undefined
      ? `重点观察${watchThemeText}，等待主题 ETF 样本形成排序。`
      : `今日主题相对强项：${strongestTheme.name}${formatSignedPercent(strongestTheme.dailyPctChange)}。`,
    weakestTheme === undefined
      ? '若主题样本不足，不把单个 ETF 波动当作主线确认。'
      : `今日主题相对弱项：${weakestTheme.name}${formatSignedPercent(weakestTheme.dailyPctChange)}。`,
    '科技成长暴露已不低，只有主线强且回踩质量好时才考虑继续分批。',
  ];
}

function mapPortfolioContextToResearchContext(context: PortfolioContextDto): ResearchPortfolioContextDto {
  return {
    owner: context.owner,
    accountScope: context.accountScope,
    stockAccount: {
      positionLevel: '半仓不到',
      positions: context.positions.map(mapPositionToResearchPosition),
    },
    fundAccount: {
      totalAssetValue: toNumber(context.account.totalAssetValue ?? context.summary.visibleFundValue),
      visibleAssetValue: toNumber(context.summary.visibleFundValue),
      exposures: context.fundExposures.map(mapFundToResearchExposure),
    },
    watchThemes: context.watchThemes.map((theme) => theme.name),
    riskFlags: context.riskFlags,
    actionPolicy: {
      allowedActions: ['hold', 'add', 'build', 'watch', 'take_profit', 'risk_control'],
      defaultBias: 'watch',
      rules: context.actionRules,
    },
  };
}

function mapPositionToResearchPosition(position: PortfolioPositionDto): ResearchStockPositionDto {
  return {
    symbol: position.symbol,
    name: position.name,
    quantity: position.quantity,
    costPrice: toNumber(position.costPrice),
    theme: position.themeTags.join(' / '),
    thesis: position.thesisSummary ?? '',
    actionBias: toResearchAction(position.actionBias),
  };
}

function mapFundToResearchExposure(exposure: PortfolioFundExposureDto): ResearchFundExposureDto {
  return {
    name: exposure.name,
    theme: exposure.theme,
    amount: toNumber(exposure.amount),
    weightPercent: toNumber(exposure.weightPercent ?? '0'),
    actionBias: toResearchAction(exposure.actionBias),
  };
}

function buildThemeExposureSummaries(context: PortfolioContextDto): readonly ResearchThemeExposureSummaryDto[] {
  const stockWeightPercent = toNumber(context.summary.stockWeightPercent);
  const fundSummaries = context.fundExposures.map((exposure) => ({
    theme: exposure.theme,
    source: 'fund' as const,
    amount: toNumber(exposure.amount),
    weightPercent: toNumber(exposure.weightPercent ?? '0'),
    actionBias: toResearchAction(exposure.actionBias),
    riskNote: buildFundRiskNote(exposure),
    nextStep: buildNextStep(exposure.actionBias, exposure.theme),
  }));
  const stockSummaries = groupStockThemeExposures(context.positions, stockWeightPercent);

  return [...fundSummaries, ...stockSummaries];
}

function groupStockThemeExposures(
  positions: readonly PortfolioPositionDto[],
  stockWeightPercent: number,
): readonly ResearchThemeExposureSummaryDto[] {
  const grouped = new Map<string, { amount: number; actionBias: ResearchAction; names: string[] }>();
  const actionPriority: Record<ResearchAction, number> = {
    risk_control: 6,
    take_profit: 5,
    watch: 4,
    build: 3,
    add: 2,
    hold: 1,
  };

  for (const position of positions) {
    const positionAmount = position.quantity * toNumber(position.costPrice);
    for (const theme of position.themeTags) {
      const current = grouped.get(theme);
      const actionBias = toResearchAction(position.actionBias);
      if (current === undefined) {
        grouped.set(theme, { amount: positionAmount, actionBias, names: [position.name] });
        continue;
      }

      current.amount += positionAmount;
      current.names.push(position.name);
      if (actionPriority[actionBias] > actionPriority[current.actionBias]) {
        current.actionBias = actionBias;
      }
    }
  }

  return [...grouped.entries()].map(([theme, value]) => ({
    theme,
    source: 'stock' as const,
    amount: roundMoney(value.amount),
    weightPercent: stockWeightPercent,
    actionBias: value.actionBias,
    riskNote: `股票侧 ${value.names.join('、')} 与${theme}相关，需要持续检查集中度和趋势质量。`,
    nextStep: buildNextStep(value.actionBias, theme),
  }));
}

function buildReviewThemeExposures(context: PortfolioContextDto): ResearchPortfolioReviewDto['themeExposures'] {
  const summaries = buildThemeExposureSummaries(context);
  const reviewItems = summaries.slice(0, 4).map((summary) => ({
    theme: summary.theme,
    status: summary.source === 'stock' ? '股票持仓相关主题' : '基金账户主题暴露',
    suggestion: summary.nextStep,
  }));

  return [
    { theme: 'AI / 机器人 / 物理 AI', status: '核心观察方向', suggestion: '结合强弱和回踩质量决定是否分批加仓。' },
    ...reviewItems,
  ];
}

function buildActionBuckets(context: PortfolioContextDto): ResearchDailyNoteDto['actionBuckets'] {
  const fundLabels = context.fundExposures.map((exposure) => ({ action: exposure.actionBias, label: exposureLabel(exposure) }));
  const themeLabels = context.watchThemes.map((theme) => ({ action: theme.actionBias, label: theme.name }));
  const positionLabels = context.positions.map((position) => ({ action: position.actionBias, label: `${position.name} / ${position.themeTags[0] ?? position.symbol}` }));

  return {
    hold: uniqueLabels([
      ...fundLabels.filter((item) => item.action === 'hold').map((item) => item.label),
      ...positionLabels.filter((item) => item.action === 'hold').map((item) => item.label),
      '核心机器人链股票继续按 thesis 持有',
    ]),
    add: uniqueLabels([...fundLabels, ...themeLabels, ...positionLabels].filter((item) => item.action === 'add').map((item) => item.label)),
    build: uniqueLabels([
      ...fundLabels.filter((item) => item.action === 'build').map((item) => item.label),
      ...themeLabels.filter((item) => item.action === 'build').map((item) => item.label),
      'AI ETF 或机器人 ETF 仅在回踩不破时小仓分批',
    ]),
    watch: uniqueLabels([
      ...fundLabels.filter((item) => item.action === 'watch').map((item) => item.label),
      ...themeLabels.filter((item) => item.action === 'watch').map((item) => item.label),
      ...positionLabels.filter((item) => item.action === 'watch').map((item) => item.label),
    ]),
    takeProfit: uniqueLabels([...fundLabels, ...themeLabels, ...positionLabels].filter((item) => item.action === 'take_profit').map((item) => item.label)),
    riskControl: uniqueLabels([
      ...fundLabels.filter((item) => item.action === 'risk_control').map((item) => item.label),
      ...themeLabels.filter((item) => item.action === 'risk_control').map((item) => item.label),
      ...positionLabels.filter((item) => item.action === 'risk_control').map((item) => item.label),
      '绿电 / 新能源暂不加仓',
      '巨轮智能等高弹性机器人股用趋势破位做风控',
    ]),
  };
}

function exposureLabel(exposure: PortfolioFundExposureDto): string {
  if (exposure.theme.includes(exposure.name)) {
    return exposure.theme;
  }

  return `${exposure.name} / ${exposure.theme}`;
}

function findHighestFundExposure(exposures: readonly PortfolioFundExposureDto[]): PortfolioFundExposureDto {
  return exposures.reduce((max, exposure) => (
    toNumber(exposure.weightPercent ?? '0') > toNumber(max.weightPercent ?? '0') ? exposure : max
  ));
}

function buildFundRiskNote(exposure: PortfolioFundExposureDto): string {
  if (exposure.theme.includes('海外科技') || exposure.theme.includes('AI') || exposure.theme.includes('通信')) {
    return `${exposure.theme}与科技成长风格相关，强行情贡献弹性，退潮时也会放大波动。`;
  }

  if (exposure.theme.includes('黄金')) {
    return '黄金可平衡科技成长高波动，但不应替代权益仓位判断。';
  }

  return `${exposure.theme}暴露需要结合主题强弱和组合集中度跟踪。`;
}

function buildNextStep(actionBias: string, theme: string): string {
  const action = toResearchAction(actionBias);
  if (action === 'hold') {
    return `继续持有${theme}，若波动放大则重新评估仓位贡献和风险。`;
  }

  if (action === 'build' || action === 'add') {
    return `仅在${theme}回踩不破且主题强度确认时分批。`;
  }

  if (action === 'risk_control') {
    return `${theme}暂不加仓，优先等待趋势修复或明确催化。`;
  }

  if (action === 'take_profit') {
    return `${theme}冲高时关注止盈节奏，避免回撤吞噬收益。`;
  }

  return `继续观察${theme}，等待主题强度、估值和趋势共同确认。`;
}

function toResearchAction(value: string): ResearchAction {
  if (isResearchAction(value)) {
    return value;
  }

  return 'watch';
}

function isResearchAction(value: string): value is ResearchAction {
  return ['hold', 'add', 'build', 'watch', 'take_profit', 'risk_control'].includes(value);
}

function toNumber(value: string): number {
  return Number.parseFloat(value);
}

function roundMoney(value: number): number {
  return Math.round(value * 100) / 100;
}

function roundPercent(value: number): number {
  return Math.round(value * 100) / 100;
}

function formatCurrency(value: number): string {
  return Math.round(value).toLocaleString('zh-CN');
}

function formatWan(value: number): string {
  return (value / 10000).toFixed(2);
}

function findTopMovedPosition(positions: readonly PortfolioPositionDto[]): PortfolioPositionDto | undefined {
  return positions
    .filter((position) => position.dailyPctChange !== null && position.dailyPctChange !== undefined)
    .sort((left, right) => Math.abs(toNumber(right.dailyPctChange ?? '0')) - Math.abs(toNumber(left.dailyPctChange ?? '0')))[0];
}

function findTopMovedMarketSnapshot(
  snapshots: readonly ResearchMarketSnapshotDto[],
  category: 'index' | 'theme',
): ResearchMarketSnapshotDto | undefined {
  return snapshots
    .filter((snapshot) => snapshot.category === category)
    .sort((left, right) => Math.abs(right.dailyPctChange) - Math.abs(left.dailyPctChange))[0];
}

function findStrongestThemeSnapshot(snapshots: readonly ResearchMarketSnapshotDto[]): ResearchMarketSnapshotDto | undefined {
  return snapshots
    .filter((snapshot) => snapshot.category === 'theme')
    .sort((left, right) => right.dailyPctChange - left.dailyPctChange)[0];
}

function findWeakestThemeSnapshot(snapshots: readonly ResearchMarketSnapshotDto[]): ResearchMarketSnapshotDto | undefined {
  return snapshots
    .filter((snapshot) => snapshot.category === 'theme')
    .sort((left, right) => left.dailyPctChange - right.dailyPctChange)[0];
}

function formatYi(value: number): string {
  return (value / 100000000).toFixed(0);
}

function formatSignedPercent(value: number): string {
  return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;
}

function uniqueLabels(labels: readonly string[]): readonly string[] {
  return [...new Set(labels)];
}

const IDEAS: readonly ResearchIdeaDto[] = [
  {
    symbol: 'WATCHLIST-AI-ROBOTICS',
    name: 'AI / 机器人观察池',
    suggestedAction: 'watch',
    oneLineThesis: '物理 AI 和机器人是中期高弹性方向，但短线容易拥挤，第一版先进入观察池而非直接追高。',
    factorBreakdown: [
      { factor: 'Momentum', signal: 'pending', explanation: '等待接入真实主题动量和个股动量。' },
      { factor: 'Valuation', signal: 'pending', explanation: '等待接入估值分位，避免在高拥挤区追高。' },
      { factor: 'Risk', signal: 'medium', explanation: '主题波动高，适合分批和条件触发。' },
    ],
    risks: ['主题退潮导致高位股快速回撤。', '估值消化不充分。'],
    triggers: ['主题强度保持前列且回踩不破趋势。', '组合总风险不升高且现金仍充足。'],
  },
];

const THESES: readonly ResearchThesisDto[] = [
  {
    target: '核心持仓组合',
    status: 'active',
    currentAction: 'hold',
    pillars: ['围绕 AI、机器人、通信设备、大科技和黄金构建中期观察框架。', '当前仓位半仓不到，保留分批调整空间。'],
    risks: ['主题暴露集中。', '高波动方向在市场退潮时回撤较快。'],
    disconfirmingEvidence: ['主线主题连续走弱。', '持仓跌破关键条件且基本面/主题逻辑同步削弱。'],
  },
];

const CATALYSTS: readonly ResearchCatalystDto[] = [
  {
    date: 'rolling',
    category: 'policy',
    title: 'AI / 机器人 / 数字经济政策与产业催化跟踪',
    relatedThemes: ['AI', '机器人', '物理 AI', '通信设备'],
    impactLevel: 'high',
    currentResponse: '第一版先记录为高优先级催化剂类型，后续接入具体事件日期和影响标的。',
  },
];
