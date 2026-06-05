import { Injectable, Optional } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { DashboardService } from '@/modules/dashboard/application/dashboard.service';
import { PortfolioContextService } from '@/modules/portfolio/application/portfolio-context.service';
import { PortfolioService } from '@/modules/portfolio/application/portfolio.service';
import { PrismaService } from '@/database/prisma.service';
import type { PortfolioContextDto as EditablePortfolioContextDto, PortfolioThemeExposureSummaryDto } from '@/modules/portfolio/presentation/dto/portfolio-context.dto';
import type { PortfolioContextDto as LivePortfolioContextDto } from '@/modules/portfolio/presentation/dto/portfolio.dto';
import type { DashboardBacktestListItemDto } from '@/modules/dashboard/presentation/dto/dashboard-backtest.dto';
import type { DashboardDataCenterSummaryDto } from '@/modules/dashboard/presentation/dto/dashboard-data-center.dto';
import type { DashboardOverviewDto } from '@/modules/dashboard/presentation/dto/dashboard-overview.dto';
import type { DashboardStrategySignalSampleDto } from '@/modules/dashboard/presentation/dto/dashboard-strategy.dto';
import type {
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
} from '../presentation/dto/research.dto';

@Injectable()
export class ResearchService {
  constructor(
    @Optional() private readonly dashboardService?: DashboardService,
    @Optional() private readonly portfolioContextService?: PortfolioContextService,
    @Optional() private readonly portfolioService?: PortfolioService,
    @Optional() private readonly prisma?: PrismaService,
  ) {}

  listPlaybooks(): readonly ResearchPlaybookDto[] {
    return RESEARCH_PLAYBOOKS;
  }

  async getDailyNote(): Promise<ResearchDailyNoteDto> {
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
    const liveContext = await this.loadLivePortfolioContext();
    if (liveContext !== null) {
      return toLiveResearchPortfolioContext(liveContext);
    }

    const context = await this.loadEditablePortfolioContext();
    if (context === null) {
      return PORTFOLIO_CONTEXT;
    }
    return toResearchPortfolioContext(context);
  }

  async listThemeExposures(): Promise<readonly ResearchThemeExposureSummaryDto[]> {
    const context = await this.loadEditablePortfolioContext();
    if (context === null) {
      return THEME_EXPOSURES;
    }
    return context.themeExposures.map(toResearchThemeExposure);
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

  private async loadLivePortfolioContext(): Promise<LivePortfolioContextDto | null> {
    if (this.portfolioService === undefined) {
      return null;
    }

    try {
      return await this.portfolioService.getContext();
    } catch {
      return null;
    }
  }

  private async loadEditablePortfolioContext(): Promise<EditablePortfolioContextDto | null> {
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

function toResearchPortfolioContext(context: EditablePortfolioContextDto): ResearchPortfolioContextDto {
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

function toLiveResearchPortfolioContext(context: LivePortfolioContextDto): ResearchPortfolioContextDto {
  return {
    owner: context.owner,
    accountScope: context.accountScope,
    stockAccount: {
      positionLevel: `股票 ${context.summary.stockWeightPercent}% / 基金 ${context.summary.fundWeightPercent}%`,
      positions: context.positions.map((position) => ({
        symbol: position.symbol,
        name: position.name,
        quantity: position.quantity,
        costPrice: Number(position.costPrice),
        latestPrice: position.latestPrice === null ? null : Number(position.latestPrice),
        marketValue: position.marketValue === null ? null : Number(position.marketValue),
        unrealizedPnl: position.unrealizedPnl === null ? null : Number(position.unrealizedPnl),
        theme: position.themeTags.join(' / '),
        thesis: position.thesisSummary ?? '等待补充持仓逻辑。',
        actionBias: position.actionBias as ResearchPortfolioContextDto['stockAccount']['positions'][number]['actionBias'],
      })),
    },
    fundAccount: {
      totalAssetValue: Number(context.account.totalAssetValue ?? context.summary.knownPortfolioValue),
      visibleAssetValue: Number(context.account.visibleAssetValue ?? context.summary.visibleFundValue),
      exposures: context.fundExposures.map((exposure) => ({
        name: exposure.name,
        theme: exposure.theme,
        amount: Number(exposure.amount),
        weightPercent: exposure.weightPercent === null ? 0 : Number(exposure.weightPercent),
        actionBias: exposure.actionBias as ResearchPortfolioContextDto['fundAccount']['exposures'][number]['actionBias'],
      })),
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

const DAILY_NOTE: ResearchDailyNoteDto = {
  title: 'AresQuant Portfolio-aware Daily Note Fallback',
  marketState: 'fallback',
  topConclusion: '当前已按 Ricki 真实持仓校准：基金仍是主仓，但个股约29.9%并非 3.3%；后续以持有、观察和回踩分批为主，不追高。',
  portfolioCalibration: {
    stockCostValue: 57765.19,
    visibleFundValue: 135386,
    knownPortfolioValue: 193151.19,
    stockWeightPercent: 29.91,
    fundWeightPercent: 70.09,
    highestFundTheme: '海外科技',
    highestFundWeightPercent: 23.93,
  },
  marketSnapshots: [],
  sections: [
    {
      code: 'market-temperature',
      title: '市场温度',
      bullets: ['等待接入指数表现、成交额、涨跌家数和风格强弱。'],
    },
    {
      code: 'theme-strength',
      title: '主题强弱',
      bullets: ['重点跟踪 AI、机器人、物理 AI、通信设备、大科技、黄金、中证1000、绿电和恒生科技。'],
    },
    {
      code: 'portfolio-check',
      title: '持仓检查',
      bullets: [
        '股票成本约57,765元，基金仍是主仓，个股不是3.3%。',
        '组合已按 Ricki 当前股票和基金暴露校准，后续接入实时价格后动态生成。',
      ],
    },
    {
      code: 'factor-signals',
      title: '策略/因子信号',
      bullets: ['后续接入 Momentum、Volatility、PE、PB、ROE、Turnover 等已有因子。'],
    },
    {
      code: 'action-plan',
      title: '操作建议',
      bullets: ['没有真实行情确认前不主动追高；优先输出继续持有、分批加仓、观望、止盈和风控分类。'],
    },
    {
      code: 'disconfirming-evidence',
      title: '反证条件',
      bullets: ['主题退潮、关键指数放量破位、持仓 thesis 被证伪或风险暴露过高时降低操作置信度。'],
    },
  ],
  actionBuckets: {
    hold: ['黄金 / 避险', '纳指100 / 海外科技', '核心机器人链股票继续按 thesis 持有'],
    add: [],
    build: ['AI ETF 或机器人 ETF 仅在回踩不破时小仓分批'],
    watch: ['通信设备 / CPO', 'AI / 人工智能', '中证1000 / 小盘风格'],
    takeProfit: [],
    riskControl: ['绿电 / 新能源暂不加仓', '巨轮智能等高弹性机器人股用趋势破位做风控'],
  },
  disconfirmingEvidence: [
    '指数和主线主题同步放量破位。',
    '持仓方向的核心 thesis 出现反向证据。',
    '组合主题暴露过度集中且缺少现金缓冲。',
  ],
  nextFocus: ['接入真实 Portfolio Context', '接入主题强弱数据', '接入上次复盘记录对照'],
};

const PORTFOLIO_REVIEW: ResearchPortfolioReviewDto = {
  positioning: {
    stockExposure: '半仓不到的 A 股股票账户上下文待接入',
    fundExposure: '纳指100、通信设备、数字经济/大科技、黄金、中证1000、人工智能、绿电等暴露待结构化',
    cashLevel: '仍保留继续分批加仓空间',
    overallRisk: 'medium',
  },
  themeExposures: [
    { theme: 'AI / 机器人 / 物理 AI', status: '核心观察方向', suggestion: '结合强弱和回踩质量决定是否分批加仓。' },
    { theme: '通信设备 / CPO', status: '已有较高基金暴露', suggestion: '上涨时关注止盈节奏，下跌时看 thesis 是否被破坏。' },
    { theme: '黄金', status: '组合避险资产', suggestion: '用于平衡高波动科技暴露，不宜只按短线涨跌处理。' },
    { theme: '绿电', status: '偏弱暴露', suggestion: '若无催化和趋势修复，降低加仓优先级。' },
  ],
  priorities: ['先控制高拥挤主题追高风险。', '再寻找强主题回踩后的分批建仓点。', '保留现金应对风格切换。'],
  riskNotes: ['第一版为静态 fallback，不构成买卖建议。', '真实建议必须接入行情、持仓成本和主题强弱后生成。'],
};

const PORTFOLIO_CONTEXT: ResearchPortfolioContextDto = {
  owner: 'Ricki',
  accountScope: 'A 股账户 + 可见基金持仓',
  stockAccount: {
    positionLevel: '半仓不到',
    positions: [
      {
        symbol: '600366',
        name: '宁波韵升',
        quantity: 800,
        costPrice: 13.47,
        theme: '机器人 / 新材料 / 磁材',
        thesis: '物理 AI 与机器人链条观察标的，后续需要用行情强弱和主题延续性验证。',
        actionBias: 'hold',
      },
      {
        symbol: '601689',
        name: '拓普集团',
        quantity: 200,
        costPrice: 69.62,
        theme: '机器人 / 汽车零部件',
        thesis: '机器人和智能汽车弹性方向，重点跟踪主题拥挤度与趋势质量。',
        actionBias: 'hold',
      },
      {
        symbol: '002031',
        name: '巨轮智能',
        quantity: 2100,
        costPrice: 8.1329,
        theme: '机器人 / 智能装备',
        thesis: '高弹性机器人方向，适合用风控条件约束，不宜无信号追高。',
        actionBias: 'watch',
      },
      {
        symbol: '002714',
        name: '牧原股份',
        quantity: 100,
        costPrice: 44.67,
        theme: '消费 / 农牧周期',
        thesis: '非 AI 主线的周期/消费平衡仓，关注猪周期和组合分散价值。',
        actionBias: 'hold',
      },
      {
        symbol: '603005',
        name: '晶方科技',
        quantity: 300,
        costPrice: 38.397,
        theme: '半导体 / AI 硬件 / 先进封装',
        thesis: 'AI 硬件和半导体链条观察仓，等待主题强弱和趋势质量确认。',
        actionBias: 'watch',
      },
    ],
  },
  fundAccount: {
    totalAssetValue: 141737,
    visibleAssetValue: 135386,
    exposures: [
      { name: '纳指100', theme: '海外科技', amount: 33910, weightPercent: 23.93, actionBias: 'hold' },
      { name: '通信设备', theme: '通信设备 / CPO', amount: 21137, weightPercent: 14.91, actionBias: 'watch' },
      { name: '数字经济 / 大科技', theme: '数字经济 / 大科技', amount: 19320, weightPercent: 13.63, actionBias: 'hold' },
      { name: '黄金', theme: '黄金 / 避险', amount: 16017, weightPercent: 11.3, actionBias: 'hold' },
      { name: '中证1000', theme: '小盘风格', amount: 14516, weightPercent: 10.24, actionBias: 'watch' },
      { name: '人工智能', theme: 'AI / 人工智能', amount: 13301, weightPercent: 9.38, actionBias: 'watch' },
      { name: '绿电', theme: '绿电 / 新能源', amount: 8960, weightPercent: 6.32, actionBias: 'risk_control' },
      { name: '消费', theme: '消费', amount: 2747, weightPercent: 1.94, actionBias: 'watch' },
      { name: '恒生科技', theme: '港股科技', amount: 2307, weightPercent: 1.63, actionBias: 'watch' },
      { name: '全球精选', theme: '全球权益', amount: 2029, weightPercent: 1.43, actionBias: 'hold' },
      { name: '标普500', theme: '海外宽基', amount: 1142, weightPercent: 0.81, actionBias: 'hold' },
    ],
  },
  watchThemes: ['物理 AI', '机器人', 'AI ETF', '通信设备 / CPO', '黄金', '中证1000', '绿电', '恒生科技'],
  riskFlags: [
    '基金侧海外科技 + 通信设备 + 数字经济 + 人工智能暴露较集中，强行情可贡献弹性，退潮时也会放大波动。',
    '股票侧机器人/物理 AI 相关标的较多，后续建议使用 thesis 和风控条件约束加仓。',
    '绿电暴露当前应降低加仓优先级，等待趋势或催化修复。',
  ],
  actionPolicy: {
    allowedActions: ['hold', 'add', 'build', 'watch', 'take_profit', 'risk_control'],
    defaultBias: 'watch',
    rules: [
      '没有真实行情和主题强弱确认前，默认观察，不主动追高。',
      '半仓不到时可以寻找分批加仓点，但必须优先检查主题拥挤度和组合集中度。',
      '任何加仓建议必须同时给出触发条件、反证条件和风控条件。',
    ],
  },
};

const THEME_EXPOSURES: readonly ResearchThemeExposureSummaryDto[] = [
  {
    theme: '海外科技',
    source: 'fund',
    amount: 33910,
    weightPercent: 23.93,
    actionBias: 'hold',
    riskNote: '纳指100为最大单一基金暴露，和 A 股大科技方向存在风格同向。',
    nextStep: '若海外科技继续强势可持有；若高位波动放大，优先观察而非追加。',
  },
  {
    theme: '通信设备 / CPO',
    source: 'fund',
    amount: 21137,
    weightPercent: 14.91,
    actionBias: 'watch',
    riskNote: '通信设备暴露较高，和 AI 算力链条相关度强。',
    nextStep: '等待主题强度确认；冲高时关注止盈节奏，回踩不破再考虑分批。',
  },
  {
    theme: 'AI / 人工智能',
    source: 'fund',
    amount: 13301,
    weightPercent: 9.38,
    actionBias: 'watch',
    riskNote: '与数字经济、大科技、通信设备存在交叉暴露。',
    nextStep: '优先结合 AI ETF 和机器人观察池，避免同主题重复追高。',
  },
  {
    theme: '机器人 / 物理 AI',
    source: 'stock',
    amount: null,
    weightPercent: null,
    actionBias: 'watch',
    riskNote: '股票侧 600366、601689、002031 均与机器人/物理 AI 相关，弹性和波动同步放大。',
    nextStep: '后续接入实时价格后计算股票侧实际权重，再决定继续持有、分批或风控。',
  },
  {
    theme: '黄金 / 避险',
    source: 'fund',
    amount: 16017,
    weightPercent: 11.3,
    actionBias: 'hold',
    riskNote: '黄金可平衡科技成长高波动，但不应替代权益仓位判断。',
    nextStep: '作为组合稳定器持有，若风险偏好显著回升再评估止盈。',
  },
  {
    theme: '绿电 / 新能源',
    source: 'fund',
    amount: 8960,
    weightPercent: 6.32,
    actionBias: 'risk_control',
    riskNote: '当前暴露不高但趋势和催化优先级偏低。',
    nextStep: '暂不加仓，等待趋势修复或明确政策/产业催化。',
  },
];

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
