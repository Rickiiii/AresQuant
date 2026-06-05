import React from 'react';
import { createRoot } from 'react-dom/client';
import {
  Activity,
  AreaChart,
  BarChart3,
  Boxes,
  BrainCircuit,
  CandlestickChart,
  ChevronRight,
  CircleDot,
  DatabaseZap,
  Eye,
  EyeOff,
  Gauge,
  GitBranch,
  Layers3,
  LineChart,
  ListChecks,
  Moon,
  Play,
  Radar,
  RefreshCcw,
  Search,
  ShieldCheck,
  Sparkles,
  Sun,
  Table2,
  TrendingUp,
  Waves,
  Zap,
} from 'lucide-react';
import './styles.css';

type ApiResponse<T> = {
  readonly success: boolean;
  readonly data: T;
  readonly timestamp: string;
};

type ViewKey = 'today' | 'portfolio' | 'adviceBacktest' | 'notes' | 'lab' | 'overview' | 'data' | 'strategies' | 'backtests' | 'research' | 'trading' | 'preferences' | 'risk';
type ThemeMode = 'light' | 'dark';

type DataSyncStatus = 'healthy' | 'stale' | 'empty' | 'failed';

type DataSyncHealth = {
  readonly status: DataSyncStatus;
  readonly summary: string;
  readonly asOfDate: string | null;
  readonly staleDatasetCount: number;
  readonly emptyDatasetCount: number;
  readonly failedDatasetCount: number;
  readonly datasets: readonly {
    readonly dataSet: string;
    readonly label: string;
    readonly status: DataSyncStatus;
    readonly total: number;
    readonly latestDate: string | null;
    readonly errorMessage?: string;
  }[];
};

type Overview = {
  readonly dataCenter: {
    readonly stockCount: number;
    readonly dailyBarCount: number;
    readonly latestDailyBarDate: string | null;
    readonly financialFactorCount: number;
    readonly latestFinancialFactorDate: string | null;
    readonly syncHealth?: DataSyncHealth;
  };
  readonly strategies: {
    readonly total: number;
    readonly codes: readonly string[];
  };
  readonly backtests: {
    readonly total: number;
    readonly byStatus: Readonly<Record<string, number>>;
    readonly latestTask: {
      readonly id: string;
      readonly name: string;
      readonly strategyName: string;
      readonly status: string;
      readonly startDate: string;
      readonly endDate: string;
    } | null;
  };
};

type DataCoverage = {
  readonly dataSet: string;
  readonly total: number;
  readonly latestDate: string | null;
};

type DataCenterSummary = Readonly<Record<string, DataCoverage>>;

type DataSyncResult = {
  readonly taskName: string;
  readonly dataType: string;
  readonly status: 'SUCCESS' | 'FAILED';
  readonly totalCount: number;
  readonly successCount: number;
  readonly failedCount: number;
  readonly errorMessage?: string;
};

type EastmoneySmokeCheckResult = {
  readonly provider: 'eastmoney';
  readonly status: 'SUCCESS' | 'FAILED';
  readonly checks: readonly {
    readonly name: string;
    readonly status: 'SUCCESS' | 'FAILED';
    readonly sampleCount: number;
    readonly errorMessage?: string;
  }[];
};

type StrategyConfigField = {
  readonly name: string;
  readonly type: string;
  readonly required: boolean;
  readonly defaultValue?: unknown;
  readonly description: string;
};

type StrategyItem = {
  readonly code: string;
  readonly name: string;
  readonly version: string;
  readonly description?: string;
  readonly configSchema: readonly StrategyConfigField[];
};

type BacktestItem = {
  readonly id: string;
  readonly name: string;
  readonly strategyName: string;
  readonly status: string;
  readonly startDate: string;
  readonly endDate: string;
  readonly initialCapital: string;
};

type DashboardData = {
  readonly overview: Overview;
  readonly dataCenter: DataCenterSummary;
  readonly strategies: readonly StrategyItem[];
  readonly backtests: readonly BacktestItem[];
};

type ResearchPlaybook = {
  readonly code: string;
  readonly name: string;
  readonly description: string;
  readonly output: readonly string[];
};

type ResearchDailyNote = {
  readonly title: string;
  readonly marketState: 'fallback' | 'live';
  readonly topConclusion: string;
  readonly sections: readonly {
    readonly code: string;
    readonly title: string;
    readonly bullets: readonly string[];
  }[];
  readonly actionBuckets: {
    readonly hold: readonly string[];
    readonly add: readonly string[];
    readonly build: readonly string[];
    readonly watch: readonly string[];
    readonly takeProfit: readonly string[];
    readonly riskControl: readonly string[];
  };
  readonly disconfirmingEvidence: readonly string[];
  readonly nextFocus: readonly string[];
};

type ResearchIdea = {
  readonly symbol: string;
  readonly name: string;
  readonly suggestedAction: string;
  readonly oneLineThesis: string;
  readonly factorBreakdown: readonly {
    readonly factor: string;
    readonly signal: string;
    readonly explanation: string;
  }[];
  readonly risks: readonly string[];
  readonly triggers: readonly string[];
};

type ResearchPortfolioReview = {
  readonly positioning: {
    readonly stockExposure: string;
    readonly fundExposure: string;
    readonly cashLevel: string;
    readonly overallRisk: string;
  };
  readonly themeExposures: readonly {
    readonly theme: string;
    readonly status: string;
    readonly suggestion: string;
  }[];
  readonly priorities: readonly string[];
  readonly riskNotes: readonly string[];
};

type ResearchThesis = {
  readonly target: string;
  readonly status: string;
  readonly currentAction: string;
  readonly pillars: readonly string[];
  readonly risks: readonly string[];
  readonly disconfirmingEvidence: readonly string[];
};

type ResearchCatalyst = {
  readonly date: string;
  readonly category: string;
  readonly title: string;
  readonly relatedThemes: readonly string[];
  readonly impactLevel: string;
  readonly currentResponse: string;
};

type ResearchJournalEntry = {
  readonly id: string;
  readonly owner: string;
  readonly noteDate: string;
  readonly title: string;
  readonly topConclusion: string;
  readonly actionItems: readonly string[];
  readonly disconfirmingEvidence: readonly string[];
  readonly nextFocus: readonly string[];
  readonly createdAt: string;
  readonly updatedAt: string;
};

type ResearchPortfolioContext = {
  readonly owner: string;
  readonly accountScope: string;
  readonly stockAccount: {
    readonly positionLevel: string;
    readonly positions: readonly {
      readonly symbol: string;
      readonly name: string;
      readonly quantity: number;
      readonly costPrice: number;
      readonly latestPrice?: number | null;
      readonly marketValue?: number | null;
      readonly unrealizedPnl?: number | null;
      readonly theme: string;
      readonly thesis: string;
      readonly actionBias: string;
    }[];
  };
  readonly fundAccount: {
    readonly totalAssetValue: number;
    readonly visibleAssetValue: number;
    readonly exposures: readonly {
      readonly name: string;
      readonly theme: string;
      readonly amount: number;
      readonly weightPercent: number;
      readonly actionBias: string;
    }[];
  };
  readonly watchThemes: readonly string[];
  readonly riskFlags: readonly string[];
  readonly actionPolicy: {
    readonly allowedActions: readonly string[];
    readonly defaultBias: string;
    readonly rules: readonly string[];
  };
};

type ResearchThemeExposureSummary = {
  readonly theme: string;
  readonly source: string;
  readonly amount: number | null;
  readonly weightPercent: number | null;
  readonly actionBias: string;
  readonly riskNote: string;
  readonly nextStep: string;
};

type ResearchData = {
  readonly playbooks: readonly ResearchPlaybook[];
  readonly dailyNote: ResearchDailyNote;
  readonly portfolioReview: ResearchPortfolioReview;
  readonly portfolioContext: ResearchPortfolioContext;
  readonly themeExposures: readonly ResearchThemeExposureSummary[];
  readonly ideas: readonly ResearchIdea[];
  readonly theses: readonly ResearchThesis[];
  readonly catalysts: readonly ResearchCatalyst[];
  readonly journalEntries: readonly ResearchJournalEntry[];
};

type PortfolioPosition = {
  readonly id: string;
  readonly symbol: string;
  readonly name: string;
  readonly quantity: number;
  readonly costPrice: string;
  readonly latestPrice: string | null;
  readonly marketValue: string | null;
  readonly unrealizedPnl: string | null;
  readonly buyDate: string | null;
  readonly holdingStage: 'new' | 'holding' | 'long_term_core';
  readonly dailyPctChange?: string | null;
  readonly quoteSource?: string | null;
  readonly themeTags: readonly string[];
  readonly actionBias: string;
  readonly riskLevel: string;
};

type PortfolioFundExposure = {
  readonly id: string;
  readonly name: string;
  readonly fundCode: string | null;
  readonly theme: string;
  readonly amount: string;
  readonly weightPercent: string | null;
  readonly actionBias: string;
  readonly riskLevel: string;
};

type PortfolioMarketSnapshot = {
  readonly code: string;
  readonly name: string;
  readonly category: 'index' | 'theme';
  readonly latestPrice: string;
  readonly dailyChange: string;
  readonly dailyPctChange: string;
  readonly amount: string;
  readonly quoteSource: string;
};

type PortfolioStockQuote = {
  readonly symbol: string;
  readonly name: string;
  readonly latestPrice: string;
  readonly dailyChange: string;
  readonly dailyPctChange: string;
  readonly quoteSource: string;
  readonly market: string;
  readonly suggestedTheme: string;
};

type PortfolioFundQuote = {
  readonly fundCode: string;
  readonly name: string;
  readonly netValueDate: string;
  readonly unitNetValue: string;
  readonly estimatedNetValue: string | null;
  readonly estimatedPctChange: string | null;
  readonly estimatedAt: string | null;
  readonly quoteSource: string;
};

type PortfolioContext = {
  readonly source: 'database' | 'fallback';
  readonly owner: string;
  readonly accountScope: string;
  readonly summary: {
    readonly stockCostValue: string;
    readonly visibleFundValue: string;
    readonly knownPortfolioValue: string;
    readonly stockWeightPercent: string;
    readonly fundWeightPercent: string;
  };
  readonly positions: readonly PortfolioPosition[];
  readonly fundExposures: readonly PortfolioFundExposure[];
  readonly marketSnapshots: readonly PortfolioMarketSnapshot[];
  readonly riskFlags: readonly string[];
  readonly actionRules: readonly string[];
};

type PortfolioPositionDecision = {
  readonly id?: string;
  readonly symbol: string;
  readonly name: string;
  readonly quantity: number;
  readonly costPrice: string;
  readonly latestPrice: string | null;
  readonly marketValue: string | null;
  readonly unrealizedPnl: string | null;
  readonly buyDate?: string | null;
  readonly holdingStage: 'new' | 'holding' | 'long_term_core';
  readonly dailyPctChange?: string | null;
  readonly themeTags?: readonly string[];
  readonly riskLevel: string;
  readonly unrealizedPnlPercent: string | null;
  readonly action: 'hold' | 'watch' | 'avoid_add' | 'add_on_strength' | 'take_profit' | 'risk_control';
  readonly actionLabel: string;
  readonly systemAction: {
    readonly code: 'no_action' | 'reduce_risk' | 'avoid_add' | 'small_add_watch' | 'take_profit_watch';
    readonly label: string;
    readonly severity: 'none' | 'watch' | 'important' | 'urgent';
    readonly needsAttention: boolean;
    readonly instruction: string;
  };
  readonly reasons: readonly string[];
  readonly triggers: readonly string[];
  readonly pricePlan: {
    readonly currentPrice: string | null;
    readonly costPrice: string;
    readonly stopLossPrice: string | null;
    readonly profitProtectPrice: string | null;
    readonly addWatchPrice: string | null;
    readonly strengthConfirmPrice: string | null;
  };
};

type PortfolioFundSignal = {
  readonly fundName: string;
  readonly theme: string;
  readonly amount: string;
  readonly weightPercent: string | null;
  readonly proxyCode: string;
  readonly proxyName: string;
  readonly proxyPctChange: string | null;
  readonly quoteSource: string | null;
  readonly signalLabel: string;
  readonly actionLabel: string;
  readonly reason: string;
};

type PortfolioThemeRadar = {
  readonly theme: string;
  readonly stockValue: string;
  readonly fundValue: string;
  readonly totalValue: string;
  readonly weightPercent: string;
  readonly heatPctChange: string | null;
  readonly sourceCount: number;
  readonly riskLevel: 'low' | 'medium' | 'high';
  readonly heatLabel: string;
  readonly actionLabel: string;
  readonly reason: string;
  readonly members: readonly string[];
};

type PortfolioDailyAction = {
  readonly priority: number;
  readonly phase: '开盘前' | '盘中' | '收盘后';
  readonly title: string;
  readonly detail: string;
  readonly evidence: string;
  readonly tone: 'ready' | 'wait' | 'danger';
};

type PortfolioAdviceItem = {
  readonly source: 'preference' | 'quant';
  readonly targetType: 'stock' | 'fund' | 'theme' | 'portfolio';
  readonly targetName: string;
  readonly targetCode: string | null;
  readonly action: string;
  readonly actionLabel: string;
  readonly severity: 'none' | 'watch' | 'important' | 'urgent';
  readonly confidence: string;
  readonly reason: string;
  readonly evidence: string;
};

type PortfolioQuantSignal = {
  readonly symbol: string;
  readonly name: string;
  readonly dataStatus: 'live' | 'historical' | 'quote_only' | 'unavailable';
  readonly latestPrice: string | null;
  readonly ma5: string | null;
  readonly ma20: string | null;
  readonly drawdownFrom20HighPercent: string | null;
  readonly trend: 'uptrend' | 'downtrend' | 'sideways' | 'unknown';
  readonly riskLine: string;
  readonly action: string;
  readonly actionLabel: string;
  readonly confidence: '低' | '中' | '高';
  readonly reasons: readonly string[];
  readonly evidence: string;
};

type PortfolioAdviceBacktestItem = {
  readonly track: 'preference' | 'quant';
  readonly symbol: string;
  readonly name: string;
  readonly action: string;
  readonly actionLabel: string;
  readonly startDate: string;
  readonly endDate: string;
  readonly startPrice: string;
  readonly endPrice: string;
  readonly returnPercent: string;
  readonly verdict: '有效' | '无效' | '中性' | '证据不足';
  readonly explanation: string;
};

type PortfolioAdviceBacktestSummary = {
  readonly track: 'preference' | 'quant';
  readonly total: number;
  readonly effective: number;
  readonly ineffective: number;
  readonly inconclusive: number;
  readonly effectiveRate: string;
  readonly conclusion: string;
};

type PortfolioAdviceBacktest = {
  readonly generatedAt: string;
  readonly startDate: string;
  readonly endDate: string;
  readonly dataStatus: string;
  readonly summaries: readonly PortfolioAdviceBacktestSummary[];
  readonly items: readonly PortfolioAdviceBacktestItem[];
};

type InvestorPreference = {
  readonly horizon: string;
  readonly coreView: string;
  readonly roboticsMaxWeightPercent: number;
  readonly singleStockMaxDrawdownPercent: number;
  readonly portfolioMaxDrawdownPercent: number;
  readonly coreHoldings: readonly string[];
  readonly satelliteHoldings: readonly string[];
  readonly rebalanceCadence: string;
  readonly cashPlan: string;
  readonly trimOrder: readonly string[];
};

type PortfolioTradingDecision = {
  readonly generatedAt: string;
  readonly dataStatus: {
    readonly status: 'live' | 'fallback';
    readonly label: string;
    readonly updatedAt: string;
    readonly sources: readonly string[];
    readonly quoteCoverage: {
      readonly updated: number;
      readonly total: number;
      readonly ratio: string;
    };
    readonly stalePositionNames: readonly string[];
  };
  readonly marketRegime: {
    readonly code: 'risk_on' | 'balanced' | 'weak_defensive';
    readonly label: string;
    readonly score: string;
    readonly reasons: readonly string[];
  };
  readonly summary: {
    readonly totalCostValue: string;
    readonly totalMarketValue: string;
    readonly totalUnrealizedPnl: string;
    readonly totalUnrealizedPnlPercent: string;
    readonly primaryAction: string;
    readonly riskLevel: 'low' | 'medium' | 'high';
  };
  readonly decisions: readonly PortfolioPositionDecision[];
  readonly actionBuckets: {
    readonly hold: readonly string[];
    readonly watch: readonly string[];
    readonly avoidAdd: readonly string[];
    readonly addOnStrength: readonly string[];
    readonly takeProfit: readonly string[];
    readonly riskControl: readonly string[];
  };
  readonly intradayPlan: {
    readonly doNow: readonly string[];
    readonly waitFor: readonly string[];
    readonly avoid: readonly string[];
    readonly emergency: readonly string[];
  };
  readonly marketSnapshots: readonly PortfolioMarketSnapshot[];
  readonly fundSignals: readonly PortfolioFundSignal[];
  readonly themeRadar: readonly PortfolioThemeRadar[];
  readonly dailyActions: readonly PortfolioDailyAction[];
  readonly investorProfile: {
    readonly horizon: string;
    readonly style: string;
    readonly coreView: string;
    readonly principles: readonly string[];
  };
  readonly investorPreference: InvestorPreference;
  readonly questionsForInvestor: readonly {
    readonly id: string;
    readonly question: string;
    readonly reason: string;
  }[];
  readonly preferenceAdvice: readonly PortfolioAdviceItem[];
  readonly quantAdvice: readonly PortfolioAdviceItem[];
  readonly quantSignals: readonly PortfolioQuantSignal[];
  readonly nextTriggers: readonly string[];
  readonly disclaimers: readonly string[];
};

type DecisionSnapshot = {
  readonly savedAt: string;
  readonly primaryAction: string;
  readonly riskLevel: 'low' | 'medium' | 'high';
  readonly dataStatus: 'live' | 'fallback';
  readonly hold: readonly string[];
  readonly watch: readonly string[];
  readonly addOnStrength: readonly string[];
  readonly riskControl: readonly string[];
};

type PortfolioData = {
  readonly context: PortfolioContext;
  readonly positions: readonly PortfolioPosition[];
  readonly fundExposures: readonly PortfolioFundExposure[];
  readonly tradingDecision: PortfolioTradingDecision;
};

type PortfolioHealthSummary = {
  readonly totalValue: number;
  readonly stockValue: number;
  readonly fundValue: number;
  readonly stockWeight: number;
  readonly fundWeight: number;
  readonly topTheme: ResearchThemeExposureSummary | null;
  readonly keyPositions: readonly {
    readonly symbol: string;
    readonly name: string;
    readonly theme: string;
    readonly value: number;
    readonly weight: number;
  }[];
  readonly focusThemes: readonly ResearchThemeExposureSummary[];
  readonly riskNotes: readonly string[];
  readonly suggestedActions: readonly string[];
};

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? '';

const fallbackData: DashboardData = {
  overview: {
    dataCenter: {
      stockCount: 5120,
      dailyBarCount: 250000,
      latestDailyBarDate: '20260514',
      financialFactorCount: 32000,
      latestFinancialFactorDate: '20260510',
    },
    strategies: {
      total: 3,
      codes: ['equal-weight', 'momentum-top-n', 'multi-factor'],
    },
    backtests: {
      total: 12,
      byStatus: { SUCCESS: 9, FAILED: 2, RUNNING: 1, PENDING: 0, CANCELED: 0 },
      latestTask: {
        id: 'task-latest',
        name: '多因子 Phase5 验证回测',
        strategyName: 'multi-factor',
        status: 'SUCCESS',
        startDate: '20260501',
        endDate: '20260514',
      },
    },
  },
  dataCenter: {
    stocks: { dataSet: 'stocks', total: 5120, latestDate: '20260514' },
    tradingCalendar: { dataSet: 'tradingCalendar', total: 5200, latestDate: '20260514' },
    dailyBars: { dataSet: 'dailyBars', total: 250000, latestDate: '20260514' },
    indexDailyBars: { dataSet: 'indexDailyBars', total: 3000, latestDate: '20260514' },
    limitPrices: { dataSet: 'limitPrices', total: 248000, latestDate: '20260514' },
    suspensions: { dataSet: 'suspensions', total: 1200, latestDate: '20260513' },
    adjFactors: { dataSet: 'adjFactors', total: 250000, latestDate: '20260514' },
    financialFactors: { dataSet: 'financialFactors', total: 32000, latestDate: '20260510' },
  },
  strategies: [
    {
      code: 'multi-factor',
      name: '多因子策略',
      version: '1.0.0',
      description: '加权多因子 TopN 选股策略，用于稳健的 A 股排序。',
      configSchema: [
        { name: 'maxPositions', type: 'number', required: true, defaultValue: 3, description: '最大入选标的数量。' },
        { name: 'normalizeMethod', type: 'string', required: true, defaultValue: 'rank', description: '因子标准化方式：rank、zscore 或 minmax。' },
        { name: 'factors', type: 'array', required: true, defaultValue: 'momentum / roe / pe', description: '加权因子定义。' },
      ],
    },
    {
      code: 'momentum-top-n',
      name: '动量 TopN 策略',
      version: '1.0.0',
      description: '按动量得分选择前 N 个标的，并用换手约束控制调仓。',
      configSchema: [{ name: 'maxPositions', type: 'number', required: true, defaultValue: 3, description: '最大入选标的数量。' }],
    },
    {
      code: 'equal-weight',
      name: '等权策略',
      version: '1.0.0',
      description: '对入选标的等权配置，作为透明基准策略。',
      configSchema: [{ name: 'maxPositions', type: 'number', required: true, defaultValue: 3, description: '最大入选标的数量。' }],
    },
  ],
  backtests: [
    { id: 'bt-001', name: '多因子稳健性验证', strategyName: 'multi-factor', status: 'SUCCESS', startDate: '20260501', endDate: '20260514', initialCapital: '1000000' },
    { id: 'bt-002', name: '动量 TopN 对照组', strategyName: 'momentum-top-n', status: 'SUCCESS', startDate: '20260501', endDate: '20260514', initialCapital: '1000000' },
    { id: 'bt-003', name: '等权基准回测', strategyName: 'equal-weight', status: 'RUNNING', startDate: '20260501', endDate: '20260514', initialCapital: '1000000' },
    { id: 'bt-004', name: '数据缺口容错验证', strategyName: 'multi-factor', status: 'FAILED', startDate: '20260401', endDate: '20260514', initialCapital: '800000' },
  ],
};

const fallbackResearchData: ResearchData = {
  playbooks: [
    { code: 'daily-note', name: '每日 / 盘中笔记', description: '盘前、14:30 和收盘复盘，把行情翻译成持仓动作。', output: ['市场温度', '主题强弱', '持仓检查', '操作建议'] },
    { code: 'idea-generation', name: '想法生成', description: '结合主题、因子和估值生成可解释观察标的。', output: ['候选标的', '因子拆解', '风险', '触发条件'] },
    { code: 'portfolio-review', name: '组合复盘', description: '检查股票、基金、现金和主题暴露。', output: ['仓位状态', '主题暴露', '调仓优先级'] },
    { code: 'thesis-tracker', name: '投资逻辑跟踪', description: '记录每个持仓为什么持有、什么情况下改变。', output: ['核心逻辑', '反证条件', '退出规则'] },
    { code: 'catalyst-calendar', name: '催化日历', description: '跟踪政策、产业、财报和海外科技映射。', output: ['事件', '影响主题', '当前应对'] },
  ],
  dailyNote: {
    title: 'AresQuant 投研中心预览',
    marketState: 'fallback',
    topConclusion: '产品骨架已就位：先以观望和结构化复盘为主，后续接入真实持仓、行情和因子后生成更高置信度建议。',
    sections: [
      { code: 'market-temperature', title: '市场温度', bullets: ['等待指数、成交额、涨跌家数和风格强弱接入。'] },
      { code: 'theme-strength', title: '主题强弱', bullets: ['重点跟踪 AI、机器人、物理 AI、通信设备、黄金、中证1000、绿电。'] },
      { code: 'portfolio-check', title: '持仓体检', bullets: ['围绕 Ricki 当前股票和基金暴露输出继续持有、分批加仓、观望、止盈、风控。'] },
      { code: 'action-plan', title: '行动计划', bullets: ['没有真实信号确认前不主动追高，优先等待强主题回踩和风险确认。'] },
    ],
    actionBuckets: {
      hold: ['纳指100 / 海外科技', '黄金 / 避险资产', '核心股票长期持有'],
      add: [],
      build: ['强主题回踩不破趋势时考虑分批。'],
      watch: ['AI / 机器人 / 物理 AI', '通信设备 / CPO', '黄金', '中证1000', '绿电'],
      takeProfit: [],
      riskControl: ['主题冲高回落并跌破关键趋势时收缩高波动仓位。'],
    },
    disconfirmingEvidence: ['数据同步滞后', '主题强度走弱', '持仓逻辑被反向证据破坏'],
    nextFocus: ['接入真实组合上下文', '接入主题强弱数据', '记录上次判断 vs 今日验证'],
  },
  portfolioReview: {
    positioning: {
      stockExposure: 'A 股账户半仓不到，仍有分批加仓空间。',
      fundExposure: '纳指100、通信设备、数字经济/大科技、黄金、中证1000、人工智能、绿电等暴露待结构化。',
      cashLevel: '保留风格切换和回撤买点弹药。',
      overallRisk: '中等',
    },
    themeExposures: [
      { theme: 'AI / 机器人 / 物理 AI', status: '核心观察', suggestion: '等强弱确认后再分批，不追高。' },
      { theme: '通信设备 / CPO', status: '已有较高基金暴露', suggestion: '上涨看止盈节奏，下跌看 thesis 是否破坏。' },
      { theme: '黄金', status: '避险平衡', suggestion: '用于平衡科技高波动暴露。' },
    ],
    priorities: ['先控制主题拥挤风险', '再寻找强主题回踩买点', '保留现金应对风格切换'],
    riskNotes: ['当前页面为预览数据，不构成买卖建议。'],
  },
  portfolioContext: {
    owner: 'Ricki',
    accountScope: 'A 股账户 + 可见基金持仓',
    stockAccount: {
      positionLevel: '半仓不到',
      positions: [
        { symbol: '600366', name: '宁波韵升', quantity: 800, costPrice: 13.47, marketValue: 10776, theme: '稀土永磁 / 电机材料', thesis: '稀土永磁/电机材料方向长期持有。', actionBias: 'hold' },
        { symbol: '601689', name: '拓普集团', quantity: 200, costPrice: 69.62, marketValue: 13924, theme: '物理AI / 机器人执行器 / 智能车', thesis: '物理AI/机器人执行器/智能车方向长期持有。', actionBias: 'hold' },
        { symbol: '002031', name: '巨轮智能', quantity: 2100, costPrice: 8.1329, marketValue: 17079.09, theme: '机器人 / 工业母机高弹性', thesis: '机器人/工业母机高弹性方向长期持有。', actionBias: 'hold' },
        { symbol: '002714', name: '牧原股份', quantity: 100, costPrice: 44.67, marketValue: 4467, theme: '生猪养殖 / 农业', thesis: '生猪养殖/农业方向长期持有。', actionBias: 'hold' },
        { symbol: '603005', name: '晶方科技', quantity: 200, costPrice: 38.397, marketValue: 7679.4, theme: '半导体封测 / CIS封装', thesis: '半导体封测/CIS封装方向长期持有。', actionBias: 'hold' },
        { symbol: '560710', name: '船舶ETF', quantity: 6400, costPrice: 1.013, marketValue: 6483.2, theme: '船舶军工 / 高端装备', thesis: '船舶军工/高端装备方向长期持有。', actionBias: 'hold' },
        { symbol: '002050', name: '三花智控', quantity: 200, costPrice: 46, marketValue: 9200, theme: '新能源车热管理 / 物理AI机器人', thesis: '新能源车热管理/物理AI机器人方向长期持有。', actionBias: 'hold' },
      ],
    },
    fundAccount: {
      totalAssetValue: 206994.69,
      visibleAssetValue: 137386,
      exposures: [
        { name: '纳指100', theme: '美股科技 / QDII', amount: 33910, weightPercent: 24.68, actionBias: 'hold' },
        { name: '通信设备', theme: '通信设备 / 光模块 / AI算力链', amount: 21137, weightPercent: 15.39, actionBias: 'hold' },
        { name: '数字经济', theme: '数字经济 / 大科技', amount: 19320, weightPercent: 14.06, actionBias: 'hold' },
        { name: '黄金', theme: '黄金 / 避险资产', amount: 16017, weightPercent: 11.66, actionBias: 'hold' },
        { name: '中证1000', theme: 'A股小盘宽基', amount: 14516, weightPercent: 10.57, actionBias: 'hold' },
        { name: '人工智能', theme: '人工智能 / AI应用', amount: 13301, weightPercent: 9.68, actionBias: 'hold' },
        { name: '绿电', theme: '新能源 / 绿电', amount: 8960, weightPercent: 6.52, actionBias: 'hold' },
        { name: '消费', theme: '消费复苏', amount: 2747, weightPercent: 2, actionBias: 'hold' },
        { name: '恒生科技', theme: '港股科技 / 恒生科技', amount: 4307, weightPercent: 3.13, actionBias: 'hold' },
        { name: '全球精选', theme: '全球权益', amount: 2029, weightPercent: 1.48, actionBias: 'hold' },
        { name: '标普500', theme: '美股宽基 / QDII', amount: 1142, weightPercent: 0.83, actionBias: 'hold' },
      ],
    },
    watchThemes: ['机器人/物理AI', '通信设备/光模块/AI算力链', '半导体封测/CIS封装', '船舶军工/高端装备', '黄金/避险资产', 'A股小盘宽基', '港股科技/恒生科技'],
    riskFlags: ['科技成长和 AI 算力链暴露集中，主题退潮会放大波动。', '机器人/物理 AI 股票侧持仓较多，需要观察拥挤度。', '海外科技、港股科技和 A 股大科技存在同向风格风险。'],
    actionPolicy: {
      allowedActions: ['hold', 'add', 'build', 'watch', 'take_profit', 'risk_control'],
      defaultBias: 'watch',
      rules: ['无真实信号确认前默认观察。', '分批加仓必须有触发条件、反证条件和风控条件。'],
    },
  },
  themeExposures: [
    { theme: '美股科技 / QDII', source: 'fund', amount: 33910, weightPercent: 24.68, actionBias: 'hold', riskNote: '纳指100为最大单一基金暴露。', nextStep: '长期持有，观察美股科技估值和汇率扰动。' },
    { theme: '通信设备 / 光模块 / AI算力链', source: 'fund', amount: 21137, weightPercent: 15.39, actionBias: 'hold', riskNote: '和 AI 算力链条相关度强。', nextStep: '长期持有，关注主题拥挤度。' },
    { theme: '数字经济 / 大科技', source: 'fund', amount: 19320, weightPercent: 14.06, actionBias: 'hold', riskNote: '与美股科技和 AI 应用存在风格相关。', nextStep: '长期持有，结合主题强弱观察。' },
    { theme: '机器人 / 物理AI', source: 'stock', amount: 40203.09, weightPercent: 19.42, actionBias: 'hold', riskNote: '拓普集团、巨轮智能、三花智控同向波动可能放大。', nextStep: '长期持有，重点观察拥挤和回撤风险。' },
    { theme: '黄金 / 避险资产', source: 'fund', amount: 16017, weightPercent: 11.66, actionBias: 'hold', riskNote: '平衡科技成长高波动。', nextStep: '作为组合稳定器持有。' },
    { theme: '半导体封测 / CIS封装', source: 'stock', amount: 7679.4, weightPercent: 3.71, actionBias: 'hold', riskNote: '弹性较高，受消费电子和国产替代预期影响。', nextStep: '长期持有，关注产业景气。' },
  ],
  ideas: [
    {
      symbol: 'WATCHLIST-AI-ROBOTICS',
      name: 'AI / 机器人观察池',
      suggestedAction: 'watch',
      oneLineThesis: '物理 AI 和机器人是中期高弹性方向，但短线容易拥挤。',
      factorBreakdown: [
        { factor: 'Momentum', signal: 'pending', explanation: '等待主题和个股动量接入。' },
        { factor: 'Valuation', signal: 'pending', explanation: '等待估值分位，避免高位追涨。' },
      ],
      risks: ['主题退潮', '估值消化不足'],
      triggers: ['主题强度保持前列', '回踩不破趋势'],
    },
  ],
  theses: [
    {
      target: '核心持仓组合',
      status: '进行中',
      currentAction: 'hold',
      pillars: ['围绕 AI、机器人、通信设备、大科技和黄金构建中期框架。', '当前仓位半仓不到，保留分批调整空间。'],
      risks: ['主题暴露集中', '高波动方向退潮时回撤较快'],
      disconfirmingEvidence: ['主线主题连续走弱', '持仓 thesis 被反向证据破坏'],
    },
  ],
  catalysts: [
    { date: '滚动跟踪', category: '政策', title: 'AI / 机器人 / 数字经济政策与产业催化', relatedThemes: ['AI', '机器人', '通信设备'], impactLevel: '高', currentResponse: '高优先级跟踪，等待具体事件日期和影响标的接入。' },
  ],
  journalEntries: [],
};

const navItems: readonly { readonly key: ViewKey; readonly label: string; readonly icon: React.ReactNode }[] = [
  { key: 'today', label: '今日决策', icon: <Radar size={16} /> },
  { key: 'portfolio', label: '我的组合', icon: <Boxes size={16} /> },
  { key: 'preferences', label: '个人偏好', icon: <BrainCircuit size={16} /> },
  { key: 'adviceBacktest', label: '建议回测', icon: <GitBranch size={16} /> },
  { key: 'notes', label: '投研笔记', icon: <Sparkles size={16} /> },
];

const fallbackAdviceBacktest: PortfolioAdviceBacktest = {
  generatedAt: new Date().toISOString(),
  startDate: '--',
  endDate: '--',
  dataStatus: '后端未连接或真实日线不足，暂时不能复盘建议效果。',
  summaries: [
    { track: 'preference', total: 0, effective: 0, ineffective: 0, inconclusive: 0, effectiveRate: '0.00', conclusion: '投资偏好建议暂无足够历史证据。' },
    { track: 'quant', total: 0, effective: 0, ineffective: 0, inconclusive: 0, effectiveRate: '0.00', conclusion: '量化建议暂无足够历史证据。' },
  ],
  items: [],
};

const fallbackPortfolioData: PortfolioData = {
  context: {
    source: 'fallback',
    owner: 'Ricki',
    accountScope: 'A 股账户 + 可见基金持仓',
    summary: {
      stockCostValue: '69608.69',
      visibleFundValue: '135386.00',
      knownPortfolioValue: '204994.69',
      stockWeightPercent: '33.96',
      fundWeightPercent: '66.04',
    },
    positions: [
      { id: 'fallback-position-600366', symbol: '600366', name: '宁波韵升', quantity: 800, costPrice: '13.470000', latestPrice: null, marketValue: '10776.00', unrealizedPnl: '0.00', buyDate: null, holdingStage: 'holding', dailyPctChange: null, themeTags: ['稀土永磁', '电机材料'], actionBias: 'hold', riskLevel: 'medium' },
      { id: 'fallback-position-601689', symbol: '601689', name: '拓普集团', quantity: 200, costPrice: '69.620000', latestPrice: null, marketValue: '13924.00', unrealizedPnl: '0.00', buyDate: null, holdingStage: 'long_term_core', dailyPctChange: null, themeTags: ['物理AI', '机器人执行器', '智能车'], actionBias: 'hold', riskLevel: 'medium' },
      { id: 'fallback-position-002031', symbol: '002031', name: '巨轮智能', quantity: 2100, costPrice: '8.132900', latestPrice: null, marketValue: '17079.09', unrealizedPnl: '0.00', buyDate: null, holdingStage: 'holding', dailyPctChange: null, themeTags: ['机器人', '工业母机高弹性'], actionBias: 'watch', riskLevel: 'high' },
      { id: 'fallback-position-002714', symbol: '002714', name: '牧原股份', quantity: 100, costPrice: '44.670000', latestPrice: null, marketValue: '4467.00', unrealizedPnl: '0.00', buyDate: null, holdingStage: 'holding', dailyPctChange: null, themeTags: ['生猪养殖', '农业'], actionBias: 'hold', riskLevel: 'medium' },
      { id: 'fallback-position-603005', symbol: '603005', name: '晶方科技', quantity: 200, costPrice: '38.397000', latestPrice: null, marketValue: '7679.40', unrealizedPnl: '0.00', buyDate: null, holdingStage: 'holding', dailyPctChange: null, themeTags: ['半导体封测', 'CIS封装'], actionBias: 'watch', riskLevel: 'medium' },
      { id: 'fallback-position-560710', symbol: '560710', name: '船舶ETF', quantity: 6400, costPrice: '1.013000', latestPrice: null, marketValue: '6483.20', unrealizedPnl: '0.00', buyDate: null, holdingStage: 'holding', dailyPctChange: null, themeTags: ['船舶军工', '高端装备'], actionBias: 'hold', riskLevel: 'medium' },
      { id: 'fallback-position-002050', symbol: '002050', name: '三花智控', quantity: 200, costPrice: '46.000000', latestPrice: null, marketValue: '9200.00', unrealizedPnl: '0.00', buyDate: null, holdingStage: 'long_term_core', dailyPctChange: null, themeTags: ['新能源车热管理', '物理AI机器人'], actionBias: 'hold', riskLevel: 'medium' },
    ],
    fundExposures: fallbackResearchData.portfolioContext.fundAccount.exposures.map((exposure, index) => ({
      id: `fallback-fund-${index}`,
      name: exposure.name,
      fundCode: null,
      theme: exposure.theme,
      amount: exposure.amount.toFixed(2),
      weightPercent: exposure.weightPercent.toFixed(2),
      actionBias: exposure.actionBias,
      riskLevel: 'medium',
    })),
    marketSnapshots: [],
    riskFlags: fallbackResearchData.portfolioContext.riskFlags,
    actionRules: fallbackResearchData.portfolioContext.actionPolicy.rules,
  },
  positions: [],
  fundExposures: [],
  tradingDecision: {
    generatedAt: new Date().toISOString(),
    dataStatus: {
      status: 'fallback',
      label: '实时行情未更新，当前只基于持仓成本和既有逻辑做保守观察。',
      updatedAt: new Date().toISOString(),
      sources: [],
      quoteCoverage: { updated: 0, total: 7, ratio: '0.00' },
      stalePositionNames: ['宁波韵升', '拓普集团', '巨轮智能', '牧原股份', '晶方科技', '船舶ETF', '三花智控'],
    },
    marketRegime: { code: 'balanced', label: '均衡观察', score: '50.00', reasons: ['预览模式下以组合结构和风险标签为主。'] },
    summary: {
      totalCostValue: '69608.69',
      totalMarketValue: '69608.69',
      totalUnrealizedPnl: '0.00',
      totalUnrealizedPnlPercent: '0.00',
      primaryAction: '长期看好机器人方向，但实时行情未更新：今天不做买卖动作，先明确核心仓、仓位上限和回撤容忍。',
      riskLevel: 'medium',
    },
    decisions: [],
    actionBuckets: {
      hold: ['宁波韵升', '拓普集团', '牧原股份', '船舶ETF', '三花智控'],
      watch: ['巨轮智能', '晶方科技'],
      avoidAdd: ['同主题拥挤时避免加仓'],
      addOnStrength: [],
      takeProfit: [],
      riskControl: ['巨轮智能'],
    },
    intradayPlan: {
      doNow: ['先看高风险持仓和最大主题暴露。'],
      waitFor: ['等待主题强弱、成交额和个股趋势同时确认。'],
      avoid: ['避免在同一主题已经拥挤时继续叠加仓位。'],
      emergency: ['若个股跌破成本保护线且主题同步走弱，优先进入风控复盘。'],
    },
    marketSnapshots: [],
    fundSignals: fallbackResearchData.portfolioContext.fundAccount.exposures.map((exposure) => ({
      fundName: exposure.name,
      theme: exposure.theme,
      amount: exposure.amount.toFixed(2),
      weightPercent: exposure.weightPercent.toFixed(2),
      proxyCode: '000001.SH',
      proxyName: '上证指数',
      proxyPctChange: null,
      quoteSource: null,
      signalLabel: '代理行情待更新',
      actionLabel: '先复核',
      reason: `${exposure.name} 暂无代理行情，先按权重和主题集中度做保守复盘。`,
    })),
    themeRadar: [
      { theme: '海外科技', stockValue: '0.00', fundValue: '38123.00', totalValue: '38123.00', weightPercent: '18.60', heatPctChange: null, sourceCount: 3, riskLevel: 'medium', heatLabel: '热度待更新', actionLabel: '持有观察', reason: '海外科技是基金侧核心暴露，等待代理行情更新后再判断强弱。', members: ['纳指100', '全球精选', '标普500'] },
      { theme: 'AI / 机器人', stockValue: '41259.09', fundValue: '13301.00', totalValue: '54560.09', weightPercent: '26.62', heatPctChange: null, sourceCount: 5, riskLevel: 'high', heatLabel: '热度待更新', actionLabel: '控制集中度', reason: 'AI/机器人已经是组合核心主线，继续加仓前先确认已有股票和基金是否重复暴露。', members: ['宁波韵升', '拓普集团', '巨轮智能', '三花智控', '人工智能'] },
    ],
    dailyActions: [
      { priority: 1, phase: '开盘前', title: '先补齐行情覆盖', detail: '当前为预览/兜底数据，先刷新真实行情后再判断。', evidence: '真实行情覆盖 0/7', tone: 'danger' },
      { priority: 2, phase: '盘中', title: '控制 AI / 机器人 集中度', detail: 'AI/机器人是组合核心主线，继续加仓前先确认股票和基金是否重复暴露。', evidence: '宁波韵升、拓普集团、巨轮智能、三花智控、人工智能', tone: 'wait' },
      { priority: 3, phase: '收盘后', title: '保存今日建议快照', detail: '收盘后保存一次建议快照，明天打开时对比风险队列和主线变化。', evidence: '用于追踪建议变化，不替代交易记录。', tone: 'wait' },
    ],
    investorProfile: {
      horizon: '长线持有为主，策略不以日内波动作为主要买卖依据。',
      style: '成长方向配置 + 主题产业趋势跟踪 + 分批调整。',
      coreView: '长期看好机器人 / 物理 AI 方向，但不把看好方向等同于无条件加仓。',
      principles: [
        '核心方向优先看产业逻辑、仓位上限、回撤容忍和基本面反证。',
        '机器人方向允许长期持有和分批，但主题拥挤时先控制加仓节奏。',
      ],
    },
    investorPreference: {
      horizon: '1-3 年长线持有',
      coreView: '长期看好机器人 / 物理 AI 方向',
      roboticsMaxWeightPercent: 35,
      singleStockMaxDrawdownPercent: 18,
      portfolioMaxDrawdownPercent: 10,
      coreHoldings: ['拓普集团', '三花智控'],
      satelliteHoldings: ['巨轮智能', '宁波韵升'],
      rebalanceCadence: '每月复盘，重大风险才临时调整',
      cashPlan: '暂未配置新增资金计划',
      trimOrder: ['绿电', '消费', '港股科技', '海外科技', '黄金'],
    },
    questionsForInvestor: [
      { id: 'robotics_max_weight', question: '机器人/物理 AI 方向你愿意给到组合最高多少仓位？', reason: '没有主题仓位上限，系统不能判断该继续加仓还是停止加仓。' },
      { id: 'drawdown_tolerance', question: '单只股票和组合分别能接受多大回撤？', reason: '长线策略必须先定义能承受的波动。' },
      { id: 'core_robotics_names', question: '哪些机器人相关股票是 1-3 年核心仓，哪些只是弹性仓？', reason: '核心仓和弹性仓不能用同一套风控标准。' },
    ],
    preferenceAdvice: [
      { source: 'preference', targetType: 'theme', targetName: 'AI / 机器人', targetCode: null, action: 'cap_theme_weight', actionLabel: '控制主题仓位', severity: 'important', confidence: '中高', reason: '你长期看好机器人方向，但主题仓位上限还没有确认。', evidence: '先明确机器人方向最高仓位，再决定是否继续加仓。' },
      { source: 'preference', targetType: 'portfolio', targetName: '组合', targetCode: null, action: 'no_trade', actionLabel: '暂不操作', severity: 'none', confidence: '中', reason: '实时行情未更新，长线建议不做买卖动作。', evidence: '先维护持仓数据和投资偏好配置。' },
    ],
    quantAdvice: [
      { source: 'quant', targetType: 'portfolio', targetName: '组合', targetCode: null, action: 'no_signal', actionLabel: '无量化信号', severity: 'none', confidence: '低', reason: '量化建议依赖实时行情；当前行情未更新。', evidence: '行情未覆盖。' },
    ],
    quantSignals: [],
    nextTriggers: fallbackResearchData.portfolioContext.actionPolicy.rules,
    disclaimers: ['本模块是投研辅助，不构成投资建议。'],
  },
};

const equityPoints = [24, 34, 29, 48, 58, 52, 74, 66, 84, 92, 86, 98];
const factorRows = [
  { name: 'momentum', weight: '45%', direction: 'positive', score: 91 },
  { name: 'roe', weight: '35%', direction: 'positive', score: 84 },
  { name: 'pe', weight: '20%', direction: 'negative', score: 76 },
];
const decisionSnapshotStorageKey = 'ares-decision-snapshot';
const stockRows = [
  ['000001.SZ', '平安银行', '银行', '20260514', '正常'],
  ['600000.SH', '浦发银行', '银行', '20260514', '正常'],
  ['000333.SZ', '美的集团', '家电', '20260514', '正常'],
  ['600519.SH', '贵州茅台', '白酒', '20260514', '正常'],
];

async function fetchApi<T>(path: string): Promise<T> {
  const response = await fetch(`${apiBaseUrl}${path}`);
  if (!response.ok) {
    throw new Error(`Request failed: ${path}`);
  }
  const payload = (await response.json()) as ApiResponse<T>;
  return payload.data;
}

async function postApi<T>(path: string, body?: unknown): Promise<T> {
  const response = await fetch(`${apiBaseUrl}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  if (!response.ok) {
    throw new Error(`Request failed: ${path}`);
  }
  const payload = (await response.json()) as ApiResponse<T>;
  return payload.data;
}

async function loadDashboard(): Promise<DashboardData> {
  const [overview, dataCenter, strategies, backtests] = await Promise.all([
    fetchApi<Overview>('/dashboard/overview'),
    fetchApi<DataCenterSummary>('/dashboard/data-center'),
    fetchApi<readonly StrategyItem[]>('/dashboard/strategies'),
    fetchApi<readonly BacktestItem[]>('/dashboard/backtests'),
  ]);
  return { overview, dataCenter, strategies, backtests };
}

async function loadResearch(): Promise<ResearchData> {
  const [playbooks, dailyNote, portfolioReview, portfolioContext, themeExposures, ideas, theses, catalysts, journalEntries] = await Promise.all([
    fetchApi<readonly ResearchPlaybook[]>('/research/playbooks'),
    fetchApi<ResearchDailyNote>('/research/daily-note'),
    fetchApi<ResearchPortfolioReview>('/research/portfolio-review'),
    fetchApi<ResearchPortfolioContext>('/research/portfolio-context'),
    fetchApi<readonly ResearchThemeExposureSummary[]>('/research/theme-exposures'),
    fetchApi<readonly ResearchIdea[]>('/research/ideas'),
    fetchApi<readonly ResearchThesis[]>('/research/theses'),
    fetchApi<readonly ResearchCatalyst[]>('/research/catalysts'),
    fetchApi<readonly ResearchJournalEntry[]>('/research/journal'),
  ]);
  return { playbooks, dailyNote, portfolioReview, portfolioContext, themeExposures, ideas, theses, catalysts, journalEntries };
}

async function loadPortfolio(): Promise<PortfolioData> {
  const [context, positions, fundExposures, tradingDecision] = await Promise.all([
    fetchApi<PortfolioContext>('/portfolio/context'),
    fetchApi<readonly PortfolioPosition[]>('/portfolio/positions'),
    fetchApi<readonly PortfolioFundExposure[]>('/portfolio/fund-exposures'),
    fetchApi<PortfolioTradingDecision>('/portfolio/trading-decision'),
  ]);
  return { context, positions, fundExposures, tradingDecision };
}

async function loadAdviceBacktest(): Promise<PortfolioAdviceBacktest> {
  return fetchApi<PortfolioAdviceBacktest>('/portfolio/advice-backtest?days=30');
}

async function lookupPortfolioQuotes(symbols: readonly string[]): Promise<readonly PortfolioStockQuote[]> {
  const query = encodeURIComponent(symbols.join(','));
  return fetchApi<readonly PortfolioStockQuote[]>(`/portfolio/quotes?symbols=${query}`);
}

async function lookupPortfolioFundQuotes(codes: readonly string[]): Promise<readonly PortfolioFundQuote[]> {
  const query = encodeURIComponent(codes.join(','));
  return fetchApi<readonly PortfolioFundQuote[]>(`/portfolio/fund-quotes?codes=${query}`);
}

function useDashboardData(): { readonly data: DashboardData; readonly isLive: boolean; readonly refreshedAt: string; readonly refresh: () => Promise<void> } {
  const [state, setState] = React.useState<{ readonly data: DashboardData; readonly isLive: boolean; readonly refreshedAt: string }>({
    data: fallbackData,
    isLive: false,
    refreshedAt: new Date().toLocaleTimeString('zh-CN', { hour12: false }),
  });

  const refresh = React.useCallback(async () => {
    try {
      const data = await loadDashboard();
      setState({ data, isLive: true, refreshedAt: new Date().toLocaleTimeString('zh-CN', { hour12: false }) });
    } catch {
      setState({ data: fallbackData, isLive: false, refreshedAt: new Date().toLocaleTimeString('zh-CN', { hour12: false }) });
    }
  }, []);

  React.useEffect(() => {
    let mounted = true;
    loadDashboard()
      .then((data) => {
        if (mounted) {
          setState({ data, isLive: true, refreshedAt: new Date().toLocaleTimeString('zh-CN', { hour12: false }) });
        }
      })
      .catch(() => {
        if (mounted) {
          setState({ data: fallbackData, isLive: false, refreshedAt: new Date().toLocaleTimeString('zh-CN', { hour12: false }) });
        }
      });
    return () => {
      mounted = false;
    };
  }, []);

  return { ...state, refresh };
}

function useResearchData(): { readonly data: ResearchData; readonly isLive: boolean; readonly refresh: () => Promise<void> } {
  const [state, setState] = React.useState<{ readonly data: ResearchData; readonly isLive: boolean }>({
    data: fallbackResearchData,
    isLive: false,
  });

  const refresh = React.useCallback(async () => {
    try {
      const data = await loadResearch();
      setState({ data, isLive: true });
    } catch {
      setState({ data: fallbackResearchData, isLive: false });
    }
  }, []);

  React.useEffect(() => {
    let mounted = true;
    loadResearch()
      .then((data) => {
        if (mounted) {
          setState({ data, isLive: true });
        }
      })
      .catch(() => {
        if (mounted) {
          setState({ data: fallbackResearchData, isLive: false });
        }
      });
    return () => {
      mounted = false;
    };
  }, []);

  return { ...state, refresh };
}

function usePortfolioData(): { readonly data: PortfolioData; readonly isLive: boolean; readonly refresh: () => Promise<void> } {
  const [state, setState] = React.useState<{ readonly data: PortfolioData; readonly isLive: boolean }>({
    data: fallbackPortfolioData,
    isLive: false,
  });

  const refresh = React.useCallback(async () => {
    try {
      const data = await loadPortfolio();
      setState({ data, isLive: true });
    } catch {
      setState({ data: fallbackPortfolioData, isLive: false });
    }
  }, []);

  React.useEffect(() => {
    let mounted = true;
    loadPortfolio()
      .then((data) => {
        if (mounted) {
          setState({ data, isLive: true });
        }
      })
      .catch(() => {
        if (mounted) {
          setState({ data: fallbackPortfolioData, isLive: false });
        }
      });
    return () => {
      mounted = false;
    };
  }, []);

  return { ...state, refresh };
}

function useAdviceBacktestData(): { readonly data: PortfolioAdviceBacktest; readonly isLive: boolean; readonly refresh: () => Promise<void> } {
  const [state, setState] = React.useState<{ readonly data: PortfolioAdviceBacktest; readonly isLive: boolean }>({
    data: fallbackAdviceBacktest,
    isLive: false,
  });

  const refresh = React.useCallback(async () => {
    try {
      const data = await loadAdviceBacktest();
      setState({ data, isLive: true });
    } catch {
      setState({ data: fallbackAdviceBacktest, isLive: false });
    }
  }, []);

  React.useEffect(() => {
    let mounted = true;
    loadAdviceBacktest()
      .then((data) => {
        if (mounted) {
          setState({ data, isLive: true });
        }
      })
      .catch(() => {
        if (mounted) {
          setState({ data: fallbackAdviceBacktest, isLive: false });
        }
      });
    return () => {
      mounted = false;
    };
  }, []);

  return { ...state, refresh };
}

function formatNumber(value: number): string {
  return new Intl.NumberFormat('zh-CN').format(value);
}

function formatMoney(value: string): string {
  return `¥${formatNumber(Number(value))}`;
}

function privacyMoney(value: number, showAmounts: boolean): string {
  return showAmounts ? `¥${formatNumber(Math.round(value))}` : '金额已隐藏';
}

function formatPercent(value: number): string {
  return `${value.toFixed(1)}%`;
}

function formatDateTime(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return date.toLocaleString('zh-CN', { hour12: false });
}

function dataSetLabel(dataSet: string): string {
  const labels: Readonly<Record<string, string>> = {
    stocks: '股票池',
    tradingCalendar: '交易日历',
    dailyBars: '日线行情',
    indexDailyBars: '指数日线',
    limitPrices: '涨跌停价格',
    suspensions: '停复牌',
    adjFactors: '复权因子',
    financialFactors: '财务因子',
  };
  return labels[dataSet] ?? dataSet;
}

function statusLabel(status: string): string {
  const labels: Readonly<Record<string, string>> = {
    SUCCESS: '成功',
    FAILED: '失败',
    RUNNING: '运行中',
    PENDING: '等待中',
    CANCELED: '已取消',
  };
  return labels[status] ?? status;
}

function syncHealthLabel(status: string | undefined): string {
  const labels: Readonly<Record<string, string>> = {
    healthy: '数据健康',
    stale: '数据过期',
    empty: '数据为空',
    failed: '状态异常',
  };
  return labels[status ?? ''] ?? '预览数据';
}

function syncResultLabel(taskName: string): string {
  const labels: Readonly<Record<string, string>> = {
    syncStocks: '股票池',
    syncTradingCalendar: '交易日历',
    syncDailyBars: '日线行情',
    syncIndexDailyBars: '指数日线',
    syncLimitPrices: '涨跌停价格',
    syncSuspensions: '停复牌',
    syncAdjFactors: '复权因子',
    syncFinancialFactors: '财务因子',
  };
  return labels[taskName] ?? taskName;
}

function smokeCheckLabel(name: string): string {
  const labels: Readonly<Record<string, string>> = {
    stocks: '股票池',
    dailyBars: '日线行情',
    indexDailyBars: '指数日线',
    limitPrices: '涨跌停价格',
    financialFactors: '财务因子',
  };
  return labels[name] ?? name;
}

function todayInputValue(): string {
  return new Date().toISOString().slice(0, 10);
}

function daysAgoInputValue(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date.toISOString().slice(0, 10);
}

function parseSymbolInput(value: string): readonly string[] {
  return value
    .split(/[\s,，、]+/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function syncHealthTone(status: string | undefined): 'violet' | 'cyan' | 'green' | 'amber' {
  if (status === 'healthy') {
    return 'green';
  }
  if (status === 'failed' || status === 'empty') {
    return 'amber';
  }
  if (status === 'stale') {
    return 'cyan';
  }
  return 'violet';
}

function actionLabel(action: string): string {
  const labels: Readonly<Record<string, string>> = {
    hold: '持有',
    add: '加仓',
    build: '分批建仓',
    watch: '观察',
    avoid_add: '避免加仓',
    add_on_strength: '强势确认后分批',
    take_profit: '止盈',
    risk_control: '风控',
    pending: '待确认',
    active: '进行中',
    medium: '中等',
    high: '高',
    low: '低',
  };
  return labels[action] ?? action;
}

function sourceLabel(source: string): string {
  const labels: Readonly<Record<string, string>> = {
    stock: '股票',
    fund: '基金',
  };
  return labels[source] ?? source;
}

function riskLevelLabel(level: string): string {
  const labels: Readonly<Record<string, string>> = {
    low: '低',
    medium: '中等',
    high: '高',
  };
  return labels[level] ?? level;
}

function strategyDisplayName(strategy: Pick<StrategyItem, 'code' | 'name'> | string): string {
  const code = typeof strategy === 'string' ? strategy : strategy.code;
  const fallback = typeof strategy === 'string' ? strategy : strategy.name;
  const labels: Readonly<Record<string, string>> = {
    'multi-factor': '多因子策略',
    'momentum-top-n': '动量 TopN 策略',
    'equal-weight': '等权策略',
    'Multi-Factor Strategy': '多因子策略',
    'Momentum Top N Strategy': '动量 TopN 策略',
    'Equal Weight Strategy': '等权策略',
  };
  return labels[code] ?? fallback;
}

function strategyDisplayDescription(strategy: StrategyItem): string {
  const labels: Readonly<Record<string, string>> = {
    'multi-factor': '加权多因子 TopN 选股策略，用于稳健的 A 股排序。',
    'momentum-top-n': '按动量得分选择前 N 个标的，并用换手约束控制调仓。',
    'equal-weight': '对入选标的等权配置，作为透明基准策略。',
  };
  return labels[strategy.code] ?? strategy.description ?? '';
}

function playbookDisplayName(playbook: ResearchPlaybook): string {
  const labels: Readonly<Record<string, string>> = {
    'daily-note': '每日 / 盘中笔记',
    'idea-generation': '想法生成',
    'portfolio-review': '组合复盘',
    'thesis-tracker': '投资逻辑跟踪',
    'catalyst-calendar': '催化日历',
  };
  return labels[playbook.code] ?? playbook.name;
}

function noteTitle(title: string): string {
  return title.replace('Research Center', '投研中心').replace('Fallback', '预览').replace('fallback', '预览');
}

function localizedText(text: string): string {
  return text
    .replaceAll('Research Center', '投研中心')
    .replaceAll('Research ideas', '投研想法')
    .replaceAll('Portfolio Context', '组合上下文')
    .replaceAll('sample signals', '样例信号')
    .replaceAll('sample signal', '样例信号')
    .replaceAll('fallback', '预览')
    .replaceAll('Fallback', '预览');
}

function directionLabel(direction: string): string {
  const labels: Readonly<Record<string, string>> = {
    positive: '正向',
    negative: '反向',
  };
  return labels[direction] ?? direction;
}

function getSuccessRate(data: DashboardData): number {
  const successCount = data.overview.backtests.byStatus.SUCCESS ?? 0;
  const totalBacktests = Math.max(data.overview.backtests.total, 1);
  return (successCount / totalBacktests) * 100;
}

function todayDecision(syncHealth: DataSyncHealth | undefined, successRate: number): { readonly title: string; readonly detail: string; readonly tone: 'ready' | 'warn' | 'blocked' } {
  if (syncHealth === undefined) {
    return { title: '先连接后端服务', detail: '当前是预览数据模式，先启动后端和数据库，才能用真实数据做判断。', tone: 'blocked' };
  }
  if (syncHealth.status === 'empty' || syncHealth.status === 'failed') {
    return { title: '先修复数据，再做判断', detail: syncHealth.summary, tone: 'blocked' };
  }
  if (syncHealth.status === 'stale') {
    return { title: '先同步核心数据', detail: '行情数据存在滞后，建议先点“一键同步核心数据”，再看投研和风险。', tone: 'warn' };
  }
  if (successRate < 55) {
    return { title: '先检查策略风险', detail: '数据已可用，但回测成功率偏低，建议先看风险清单和失败回测。', tone: 'warn' };
  }
  return { title: '可以开始今日复盘', detail: '数据、策略和投研模块已经能支撑一次基础盘前/盘中复盘。', tone: 'ready' };
}

function buildOverviewRisks(data: DashboardData, syncHealth: DataSyncHealth | undefined): readonly string[] {
  const risks: string[] = [];
  if (syncHealth === undefined) {
    risks.push('后端未连接，页面正在使用预览数据。');
  } else if (syncHealth.status !== 'healthy') {
    risks.push(syncHealth.summary);
  }
  const failedBacktests = data.overview.backtests.byStatus.FAILED ?? 0;
  if (failedBacktests > 0) {
    risks.push(`${failedBacktests} 个回测任务失败，需要检查参数、数据缺口或策略逻辑。`);
  }
  if (data.overview.backtests.latestTask?.status === 'FAILED') {
    risks.push(`最新回测「${data.overview.backtests.latestTask.name}」失败，先不要提高策略置信度。`);
  }
  if (risks.length === 0) {
    risks.push('暂无硬性阻断风险，可以进入投研复盘和持仓检查。');
  }
  return risks.slice(0, 3);
}

function buildPortfolioHealth(research: ResearchData): PortfolioHealthSummary {
  const context = research.portfolioContext;
  const stockPositions = context.stockAccount.positions.map((position) => ({
    ...position,
    value: position.marketValue ?? position.quantity * (position.latestPrice ?? position.costPrice),
  }));
  const stockValue = stockPositions.reduce((sum, item) => sum + item.value, 0);
  const fundValue = context.fundAccount.visibleAssetValue;
  const totalValue = stockValue + fundValue;
  const stockWeight = totalValue === 0 ? 0 : (stockValue / totalValue) * 100;
  const fundWeight = totalValue === 0 ? 0 : (fundValue / totalValue) * 100;
  const focusThemes = [...research.themeExposures]
    .filter((item) => item.amount !== null || item.weightPercent !== null)
    .sort((left, right) => (right.weightPercent ?? 0) - (left.weightPercent ?? 0))
    .slice(0, 5);
  const keyPositions = [...stockPositions]
    .sort((left, right) => right.value - left.value)
    .slice(0, 5)
    .map((position) => ({
      symbol: position.symbol,
      name: position.name,
      theme: position.theme,
      value: position.value,
      weight: totalValue === 0 ? 0 : (position.value / totalValue) * 100,
    }));
  const topTheme = focusThemes[0] ?? null;
  const riskNotes = [
    ...(topTheme === null ? [] : [`最大主题暴露是 ${topTheme.theme}，权重约 ${topTheme.weightPercent?.toFixed(2) ?? '待计算'}%。`]),
    ...context.riskFlags,
    ...research.portfolioReview.riskNotes,
  ].slice(0, 4);

  return {
    totalValue,
    stockValue,
    fundValue,
    stockWeight,
    fundWeight,
    topTheme,
    keyPositions,
    focusThemes,
    riskNotes,
    suggestedActions: [
      '长期持有为主，不把系统输出当作自动交易指令。',
      '优先观察机器人/物理AI、AI算力链、半导体封测三类高弹性暴露。',
      '若科技成长主题同步走弱，先降低新增仓位冲动，保留复盘证据。',
    ],
  };
}

function App(): React.ReactElement {
  const { data, isLive, refreshedAt, refresh } = useDashboardData();
  const { data: researchData, isLive: isResearchLive, refresh: refreshResearch } = useResearchData();
  const { data: portfolioData, isLive: isPortfolioLive, refresh: refreshPortfolio } = usePortfolioData();
  const { data: adviceBacktestData, isLive: isAdviceBacktestLive, refresh: refreshAdviceBacktest } = useAdviceBacktestData();
  const [activeView, setActiveView] = React.useState<ViewKey>('today');
  const [showAmounts, setShowAmounts] = React.useState<boolean>(() => {
    if (typeof window === 'undefined') {
      return true;
    }
    return window.localStorage.getItem('ares-show-amounts') !== 'false';
  });
  const [themeMode, setThemeMode] = React.useState<ThemeMode>(() => {
    if (typeof window === 'undefined') {
      return 'light';
    }
    return window.localStorage.getItem('ares-theme') === 'dark' ? 'dark' : 'light';
  });
  const coverage = Object.values(data.dataCenter);
  const successRate = getSuccessRate(data);

  React.useEffect(() => {
    document.documentElement.dataset.theme = themeMode;
    window.localStorage.setItem('ares-theme', themeMode);
  }, [themeMode]);

  React.useEffect(() => {
    window.localStorage.setItem('ares-show-amounts', String(showAmounts));
  }, [showAmounts]);

  return (
    <main className="app-shell">
      <div className="aurora aurora-one" />
      <div className="aurora aurora-two" />
      <aside className="sidebar">
        <div className="brand-block">
          <div className="brand-mark"><CandlestickChart size={22} /></div>
          <div>
            <strong>AresQuant</strong>
            <span>A 股策略工作台</span>
          </div>
        </div>

        <nav className="nav-list">
          {navItems.map((item) => (
            <button className={item.key === activeView ? 'active' : ''} key={item.key} onClick={() => setActiveView(item.key)} type="button">
              <span>{item.icon}{item.label}</span>
              <ChevronRight size={14} />
            </button>
          ))}
        </nav>

        <div className="sidebar-stack">
          <div className="system-card">
            <div className="pulse-row"><span className={isLive ? 'pulse live' : 'pulse'} />{isLive ? '实时 API 已连接' : '预览数据模式'}</div>
            <p>{isLive ? '后端服务可用，页面会读取真实接口数据。' : '后端未连接时只展示本地预览数据，不能作为实际判断依据。'}</p>
          </div>
        </div>
      </aside>

      <section className="content-panel">
        <TopBar activeView={activeView} refreshedAt={refreshedAt} onRefresh={refresh} onToggleAmounts={() => setShowAmounts(!showAmounts)} onToggleTheme={() => setThemeMode(themeMode === 'light' ? 'dark' : 'light')} showAmounts={showAmounts} themeMode={themeMode} />
        {activeView === 'today' && <TradingDecisionView data={portfolioData} isLive={isPortfolioLive} showAmounts={showAmounts} onRefresh={refreshPortfolio} />}
        {activeView === 'portfolio' && <PortfolioWorkspaceView data={portfolioData} showAmounts={showAmounts} onRefresh={refreshPortfolio} />}
        {activeView === 'adviceBacktest' && <AdviceBacktestView data={adviceBacktestData} isLive={isAdviceBacktestLive} onRefresh={refreshAdviceBacktest} />}
        {activeView === 'lab' && <StrategyLabView coverage={coverage} data={data} onRefresh={refresh} />}
        {activeView === 'notes' && <ResearchView data={researchData} isLive={isResearchLive} showAmounts={showAmounts} onRefresh={refreshResearch} />}
        {activeView === 'overview' && <TradingDecisionView data={portfolioData} isLive={isPortfolioLive} showAmounts={showAmounts} onRefresh={refreshPortfolio} />}
        {activeView === 'data' && <StrategyLabView coverage={coverage} data={data} onRefresh={refresh} />}
        {activeView === 'strategies' && <StrategyLabView coverage={coverage} data={data} onRefresh={refresh} />}
        {activeView === 'backtests' && <StrategyLabView coverage={coverage} data={data} onRefresh={refresh} />}
        {activeView === 'research' && <ResearchView data={researchData} isLive={isResearchLive} showAmounts={showAmounts} onRefresh={refreshResearch} />}
        {activeView === 'trading' && <TradingDecisionView data={portfolioData} isLive={isPortfolioLive} showAmounts={showAmounts} onRefresh={refreshPortfolio} />}
        {activeView === 'preferences' && <PreferencesView data={portfolioData} onRefresh={refreshPortfolio} />}
        {activeView === 'risk' && <RiskView portfolio={portfolioData} showAmounts={showAmounts} />}
      </section>
    </main>
  );
}

function TopBar(props: { readonly activeView: ViewKey; readonly refreshedAt: string; readonly onRefresh: () => Promise<void>; readonly onToggleAmounts: () => void; readonly onToggleTheme: () => void; readonly showAmounts: boolean; readonly themeMode: ThemeMode }): React.ReactElement {
  const titleMap: Readonly<Record<ViewKey, string>> = {
    today: '今日决策',
    portfolio: '我的组合',
    adviceBacktest: '建议回测',
    lab: '策略回测',
    notes: '投研笔记',
    overview: '统一指挥台',
    data: '数据中心',
    strategies: '策略实验室',
    backtests: '回测控制台',
    research: '投研中心',
    trading: '组合决策',
    preferences: '个人偏好',
    risk: '风险监控',
  };

  return (
    <header className="top-bar">
      <div>
        <div className="breadcrumb"><Sparkles size={14} /> AresQuant <span>/</span> {titleMap[props.activeView]}</div>
        <h1>{titleMap[props.activeView]}</h1>
      </div>
      <div className="top-actions">
        <span className="timestamp">最近刷新 {props.refreshedAt}</span>
        <button className="secondary-action icon-action" onClick={props.onToggleAmounts} title="隐藏或显示持仓金额" type="button">{props.showAmounts ? <EyeOff size={16} /> : <Eye size={16} />} {props.showAmounts ? '隐藏金额' : '显示金额'}</button>
        <button className="secondary-action icon-action" onClick={props.onToggleTheme} title="切换主题" type="button">{props.themeMode === 'light' ? <Moon size={16} /> : <Sun size={16} />} {props.themeMode === 'light' ? '暗色' : '浅色'}</button>
        <button className="primary-action" onClick={() => void props.onRefresh()} type="button"><RefreshCcw size={16} /> 刷新状态</button>
      </div>
    </header>
  );
}

function AdviceBacktestView(props: { readonly data: PortfolioAdviceBacktest; readonly isLive: boolean; readonly onRefresh: () => Promise<void> }): React.ReactElement {
  const preferenceSummary = props.data.summaries.find((item) => item.track === 'preference');
  const quantSummary = props.data.summaries.find((item) => item.track === 'quant');
  const preferenceItems = props.data.items.filter((item) => item.track === 'preference');
  const quantItems = props.data.items.filter((item) => item.track === 'quant');

  return (
    <div className="view-stack advice-backtest-view">
      <section className="hero-card compact-workspace-hero">
        <div>
          <div className="eyebrow"><GitBranch size={14} /> {props.isLive ? '真实日线复盘' : '回测数据未连接'}</div>
          <h2>建议回测</h2>
          <p>这里不展示样例策略，只回答一个问题：如果当时执行系统的投资偏好建议或量化建议，到今天看是更好、更差，还是证据不足。</p>
        </div>
        <div className="workspace-summary-card">
          <span>复盘区间</span>
          <strong>{props.data.startDate}</strong>
          <small>至 {props.data.endDate}</small>
        </div>
      </section>

      <section className="workspace-kpi-grid">
        <MetricCard icon={<BrainCircuit />} label="偏好建议有效率" value={`${preferenceSummary?.effectiveRate ?? '0.00'}%`} helper={preferenceSummary?.conclusion ?? '暂无复盘'} tone="violet" />
        <MetricCard icon={<Radar />} label="量化建议有效率" value={`${quantSummary?.effectiveRate ?? '0.00'}%`} helper={quantSummary?.conclusion ?? '暂无复盘'} tone="cyan" />
        <MetricCard icon={<ListChecks />} label="可判定建议" value={`${props.data.items.filter((item) => item.verdict === '有效' || item.verdict === '无效').length} 条`} helper={props.data.dataStatus} tone={props.isLive ? 'green' : 'amber'} />
        <MetricCard icon={<ShieldCheck />} label="证据不足" value={`${props.data.items.filter((item) => item.verdict === '证据不足').length} 条`} helper="缺少真实日线时不强行判断" tone="amber" />
      </section>

      <section className="workspace-two-column">
        <AdviceBacktestPanel title="投资偏好建议复盘" subtitle="看长期偏好建议是否帮助你避险或持有正确方向" items={preferenceItems} />
        <AdviceBacktestPanel title="量化建议复盘" subtitle="只看价格信号是否带来更好的风险收益结果" items={quantItems} />
      </section>

      <article className="glass-card data-readiness-card">
        <CardHeader icon={<DatabaseZap />} title="数据说明" subtitle="只有真实日线足够时才判定有效或无效" />
        <p className="muted-copy">{props.data.dataStatus}</p>
        <div className="feature-action-row">
          <button className="secondary-action" onClick={() => void props.onRefresh()} type="button"><RefreshCcw size={15} /> 重新回测</button>
          <span>回测结果用于验证系统建议质量，不代表下一次建议一定正确。</span>
        </div>
      </article>
    </div>
  );
}

function AdviceBacktestPanel(props: { readonly title: string; readonly subtitle: string; readonly items: readonly PortfolioAdviceBacktestItem[] }): React.ReactElement {
  return (
    <article className="glass-card advice-backtest-panel">
      <CardHeader icon={<GitBranch />} title={props.title} subtitle={props.subtitle} />
      <div className="advice-backtest-list">
        {props.items.length === 0 && <p className="muted-copy">暂无可复盘建议。</p>}
        {props.items.map((item) => (
          <div className={verdictTone(item.verdict)} key={`${item.track}-${item.symbol}-${item.action}`}>
            <section>
              <strong>{item.name}</strong>
              <span>{item.symbol} · {item.actionLabel}</span>
            </section>
            <b>{item.verdict}</b>
            <em>{item.returnPercent === '--' ? '--' : `${item.returnPercent}%`}</em>
            <p>{item.explanation}</p>
            <small>{item.startDate} {item.startPrice} → {item.endDate} {item.endPrice}</small>
          </div>
        ))}
      </div>
    </article>
  );
}

function verdictTone(verdict: PortfolioAdviceBacktestItem['verdict']): 'good' | 'bad' | 'neutral' | 'unknown' {
  if (verdict === '有效') {
    return 'good';
  }
  if (verdict === '无效') {
    return 'bad';
  }
  if (verdict === '证据不足') {
    return 'unknown';
  }
  return 'neutral';
}

function PortfolioWorkspaceView(props: { readonly data: PortfolioData; readonly showAmounts: boolean; readonly onRefresh: () => Promise<void> }): React.ReactElement {
  const context = props.data.context;
  const positions = context.positions.length > 0 ? context.positions : props.data.positions;
  const funds = context.fundExposures.length > 0 ? context.fundExposures : props.data.fundExposures;
  const decision = props.data.tradingDecision;
  const totalValue = Number(context.summary.knownPortfolioValue);
  const robotTheme = decision.themeRadar.find((item) => item.theme.includes('机器人') || item.theme.toLowerCase().includes('ai'));
  const attentionCount = decision.decisions.filter((item) => item.systemAction.needsAttention).length;
  const liveQuoteCount = positions.filter((item) => hasLivePositionQuote(item)).length;

  return (
    <div className="view-stack portfolio-workspace">
      <section className="hero-card compact-workspace-hero">
        <div>
          <div className="eyebrow"><Boxes size={14} /> 组合与偏好</div>
          <h2>我的组合</h2>
          <p>这里维护真实持仓、基金暴露和长期投资偏好。今日决策会直接读取这里的数据，所以这里是系统判断是否可信的基础。</p>
        </div>
        <div className="workspace-summary-card">
          <span>已知资产</span>
          <strong>{privacyMoney(totalValue, props.showAmounts)}</strong>
          <small>股票 {context.summary.stockWeightPercent}% / 基金 {context.summary.fundWeightPercent}%</small>
        </div>
      </section>

      <section className="workspace-kpi-grid">
        <MetricCard icon={<CandlestickChart />} label="股票 / ETF" value={`${positions.length} 个`} helper={`实时行情 ${liveQuoteCount}/${positions.length}`} tone={liveQuoteCount === positions.length ? 'green' : 'amber'} />
        <MetricCard icon={<Boxes />} label="基金暴露" value={`${funds.length} 个`} helper="基金净值和主题暴露会参与组合判断" tone="cyan" />
        <MetricCard icon={<Radar />} label="需要关注" value={`${attentionCount} 个`} helper="来自今日决策的结构化动作字段" tone={attentionCount > 0 ? 'amber' : 'green'} />
        <MetricCard icon={<BrainCircuit />} label="机器人方向" value={robotTheme?.weightPercent === undefined ? '待计算' : `${robotTheme.weightPercent}%`} helper={robotTheme?.reason ?? '长期偏好配置会约束加仓节奏'} tone="violet" />
      </section>

      <section className="workspace-two-column">
        <article className="glass-card compact-list-card">
          <CardHeader icon={<CandlestickChart />} title="股票持仓" subtitle="优先展示名称、主题和动作，而不是只看代码" />
          <div className="compact-holding-list">
            {positions.slice(0, 8).map((position) => (
              <div key={position.id}>
                <div>
                  <strong>{position.name}</strong>
                  <span>{position.symbol} · {position.themeTags.join(' / ') || '主题待补充'}</span>
                </div>
                <em>{props.showAmounts ? formatMoney(position.marketValue ?? '0') : actionLabel(position.actionBias)}</em>
              </div>
            ))}
          </div>
        </article>
        <article className="glass-card compact-list-card">
          <CardHeader icon={<Layers3 />} title="基金暴露" subtitle="按主题管理场外基金，而不是只看基金名称" />
          <div className="compact-holding-list">
            {funds.slice(0, 8).map((fund) => (
              <div key={fund.id}>
                <div>
                  <strong>{fund.name}</strong>
                  <span>{fund.fundCode ?? '未配置代码'} · {fund.theme}</span>
                </div>
                <em>{props.showAmounts ? formatMoney(fund.amount) : `${fund.weightPercent ?? '--'}%`}</em>
              </div>
            ))}
          </div>
        </article>
      </section>

      <PreferencesView data={props.data} onRefresh={props.onRefresh} />
    </div>
  );
}

function StrategyLabView(props: { readonly data: DashboardData; readonly coverage: readonly DataCoverage[]; readonly onRefresh: () => Promise<void> }): React.ReactElement {
  const syncHealth = props.data.overview.dataCenter.syncHealth;
  const healthyCount = syncHealth?.datasets.filter((item) => item.status === 'healthy').length ?? 0;
  const totalDatasets = syncHealth?.datasets.length ?? props.coverage.length;
  const availableCoverage = props.coverage.filter((item) => item.total > 0);
  const unavailableCoverage = props.coverage.filter((item) => item.total === 0);

  return (
    <div className="view-stack strategy-lab-view">
      <section className="hero-card compact-workspace-hero">
        <div>
          <div className="eyebrow"><Gauge size={14} /> 策略验证</div>
          <h2>策略回测</h2>
          <p>真实回测还没有形成可用闭环，所以暂时不展示策略参数、样例信号和模拟净值曲线。这里先只保留数据可用性，等回测能真正回答“执行后是好是坏”再开放。</p>
        </div>
        <div className="workspace-summary-card">
          <span>数据状态</span>
          <strong>{syncHealthLabel(syncHealth?.status)}</strong>
          <small>{healthyCount}/{totalDatasets} 个数据集健康</small>
        </div>
      </section>

      <section className="workspace-kpi-grid">
        <MetricCard icon={<DatabaseZap />} label="数据可用性" value={syncHealthLabel(syncHealth?.status)} helper={syncHealth?.summary ?? '当前使用预览数据'} tone={syncHealthTone(syncHealth?.status)} />
        <MetricCard icon={<BarChart3 />} label="日线记录" value={formatNumber(props.data.overview.dataCenter.dailyBarCount)} helper={`最新 ${props.data.overview.dataCenter.latestDailyBarDate ?? '--'}`} tone="green" />
        <MetricCard icon={<ListChecks />} label="已接入数据" value={`${availableCoverage.length} 类`} helper={availableCoverage.length === 0 ? '暂无真实数据' : availableCoverage.map((item) => dataSetLabel(item.dataSet)).slice(0, 2).join(' / ')} tone="cyan" />
        <MetricCard icon={<ShieldCheck />} label="待补数据" value={`${unavailableCoverage.length} 类`} helper={unavailableCoverage.length === 0 ? '核心数据已有记录' : unavailableCoverage.map((item) => dataSetLabel(item.dataSet)).slice(0, 2).join(' / ')} tone={unavailableCoverage.length === 0 ? 'green' : 'amber'} />
      </section>

      <section className="workspace-two-column">
        <article className="glass-card empty-feature-card">
          <CardHeader icon={<BrainCircuit />} title="策略库暂不展示" subtitle="避免把未解释清楚的技术参数误当成功能" />
          <div className="feature-block-list">
            <div><span className="pulse warning" /><strong>不展示等权 / 多因子参数</strong><p>这些名称和 number 必填字段目前不能直接帮你做投资判断，先从前端撤掉。</p></div>
            <div><span className="pulse warning" /><strong>不展示因子权重和信号样例</strong><p>样例数据没有真实交易含义，等真实信号能关联到你的持仓和收益复盘后再开放。</p></div>
            <div><span className="pulse warning" /><strong>不展示模拟净值曲线</strong><p>没有真实任务结果时，净值图只会误导你以为系统已经跑过策略。</p></div>
          </div>
        </article>
        <article className="glass-card empty-feature-card">
          <CardHeader icon={<Gauge />} title="真实回测待补齐" subtitle="下一版要做成能验证建议质量的工具" />
          <div className="feature-block-list">
            <div><span className="pulse live" /><strong>输入一条历史建议</strong><p>例如“当时减仓巨轮智能”或“按偏好继续持有拓普集团”。</p></div>
            <div><span className="pulse live" /><strong>拉取执行日到今天的行情</strong><p>用真实价格计算如果执行 / 不执行，到今天分别会怎样。</p></div>
            <div><span className="pulse live" /><strong>输出明确结论</strong><p>直接告诉你这条建议目前看是有效、无效，还是证据不足。</p></div>
          </div>
        </article>
      </section>

      <article className="glass-card data-readiness-card">
        <CardHeader icon={<DatabaseZap />} title="当前真实数据可用性" subtitle="这里只展示能支撑后续回测的数据，不展示样例表格" />
        <div className="compact-data-list">
          {props.coverage.map((item) => (
            <div className={item.total > 0 ? 'ready' : 'empty'} key={item.dataSet}>
              <div><strong>{dataSetLabel(item.dataSet)}</strong><span>{item.latestDate ?? '未同步'}</span></div>
              <em>{formatNumber(item.total)}</em>
            </div>
          ))}
        </div>
        <div className="feature-action-row">
          <button className="secondary-action" onClick={() => void props.onRefresh()} type="button"><RefreshCcw size={15} /> 刷新数据状态</button>
          <span>{syncHealth?.summary ?? '后端未连接时无法判断真实数据是否完整。'}</span>
        </div>
      </article>
    </div>
  );
}

function OverviewView(props: {
  readonly data: DashboardData;
  readonly coverage: readonly DataCoverage[];
  readonly research: ResearchData;
  readonly showAmounts: boolean;
  readonly successRate: number;
  readonly onNavigate: (view: ViewKey) => void;
  readonly onRefresh: () => Promise<void>;
  readonly onRefreshResearch: () => Promise<void>;
}): React.ReactElement {
  const successCount = props.data.overview.backtests.byStatus.SUCCESS ?? 0;
  const syncHealth = props.data.overview.dataCenter.syncHealth;
  const decision = todayDecision(syncHealth, props.successRate);
  const risks = buildOverviewRisks(props.data, syncHealth);
  const portfolioHealth = buildPortfolioHealth(props.research);
  const [actionMessage, setActionMessage] = React.useState('从上到下点一遍，就能完成一次最小可用的日常工作流。');
  const [runningAction, setRunningAction] = React.useState<string | null>(null);

  async function runCoreSyncFromOverview(): Promise<void> {
    setRunningAction('sync');
    setActionMessage('正在同步核心数据，完成后会刷新首页状态。');
    try {
      await postApi<readonly DataSyncResult[]>('/data/sync/core', {
        startDate: daysAgoInputValue(7),
        endDate: todayInputValue(),
        symbols: ['000001', '600519', '000333', '600000'],
      });
      await props.onRefresh();
      setActionMessage('核心数据已同步，下一步可以检查风险或保存今日复盘。');
    } catch (error) {
      const message = error instanceof Error ? error.message : '同步失败';
      setActionMessage(`同步失败：${message}`);
    } finally {
      setRunningAction(null);
    }
  }

  async function saveDailyJournalFromOverview(): Promise<void> {
    const daily = props.research.dailyNote;
    setRunningAction('journal');
    setActionMessage('正在保存今日投研记录。');
    try {
      await postApi<ResearchJournalEntry>('/research/journal', {
        noteDate: todayInputValue(),
        title: noteTitle(daily.title),
        topConclusion: localizedText(daily.topConclusion),
        actionItems: [
          ...daily.actionBuckets.add,
          ...daily.actionBuckets.build,
          ...daily.actionBuckets.watch,
          ...daily.actionBuckets.takeProfit,
          ...daily.actionBuckets.riskControl,
        ].map(localizedText),
        disconfirmingEvidence: daily.disconfirmingEvidence.map(localizedText),
        nextFocus: daily.nextFocus.map(localizedText),
      });
      await props.onRefreshResearch();
      setActionMessage('今日投研记录已保存，后续可以在投研历史里回看和验证。');
    } catch (error) {
      const message = error instanceof Error ? error.message : '保存失败';
      setActionMessage(`保存失败：${message}`);
    } finally {
      setRunningAction(null);
    }
  }

  return (
    <div className="view-stack">
      <section className={`hero-card action-hero ${decision.tone}`}>
        <div>
          <div className="eyebrow"><Zap size={14} /> 我的组合体检</div>
          <h2>你的组合现在主要押在科技成长和物理 AI，先看集中度，再谈动作</h2>
          <p>系统已按你的真实持仓计算资产结构、主题暴露和重点观察项。这里不是买卖建议，而是每天打开后先完成一次组合体检。</p>
          <div className="hero-action-row">
            <button className="primary-action" disabled={runningAction !== null} onClick={() => void runCoreSyncFromOverview()} type="button"><Play size={16} /> 一键同步核心数据</button>
            <button className="secondary-action" onClick={() => props.onNavigate('research')} type="button"><Sparkles size={16} /> 进入投研中心</button>
            <button className="secondary-action" onClick={() => props.onNavigate('risk')} type="button"><ShieldCheck size={16} /> 查看风险</button>
          </div>
        </div>
        <div className="today-summary">
          <span>组合总资产</span>
          <strong>{privacyMoney(portfolioHealth.totalValue, props.showAmounts)}</strong>
          <small>股票 {formatPercent(portfolioHealth.stockWeight)} / 基金 {formatPercent(portfolioHealth.fundWeight)}</small>
        </div>
      </section>

      <section className="portfolio-health-grid">
        <article className="glass-card portfolio-health-main">
          <CardHeader icon={<ShieldCheck />} title="今日组合体检" subtitle="先回答：钱在哪、风险在哪、今天该看什么" />
          <div className="portfolio-health-stats">
            <div><span>股票市值</span><strong>{privacyMoney(portfolioHealth.stockValue, props.showAmounts)}</strong><small>{formatPercent(portfolioHealth.stockWeight)}</small></div>
            <div><span>基金市值</span><strong>{privacyMoney(portfolioHealth.fundValue, props.showAmounts)}</strong><small>{formatPercent(portfolioHealth.fundWeight)}</small></div>
            <div><span>最大主题</span><strong>{portfolioHealth.topTheme?.theme ?? '待计算'}</strong><small>{portfolioHealth.topTheme?.weightPercent === null || portfolioHealth.topTheme === null ? '权重待计算' : formatPercent(portfolioHealth.topTheme.weightPercent)}</small></div>
          </div>
          <div className="portfolio-health-actions">
            {portfolioHealth.suggestedActions.map((item) => <div key={item}><span className="pulse live" />{item}</div>)}
          </div>
        </article>

        <article className="glass-card">
          <CardHeader icon={<CandlestickChart />} title="重点持仓" subtitle="按当前市值排序" />
          <div className="holding-focus-list">
            {portfolioHealth.keyPositions.map((position) => (
              <div key={position.symbol}>
                <div><strong>{position.name}</strong><span>{position.symbol} · {position.theme}</span></div>
                <em>{props.showAmounts ? `${privacyMoney(position.value, true)} / ` : ''}{formatPercent(position.weight)}</em>
              </div>
            ))}
          </div>
        </article>
      </section>

      <section className="split-grid">
        <article className="glass-card">
          <CardHeader icon={<Waves />} title="主题暴露 Top5" subtitle="组合最需要盯住的方向" />
          <div className="theme-health-list">
            {portfolioHealth.focusThemes.map((theme) => (
              <div key={`${theme.theme}-${theme.source}`}>
                <div>
                  <strong>{theme.theme}</strong>
                  <span>{sourceLabel(theme.source)} · {actionLabel(theme.actionBias)}</span>
                </div>
                <div className="theme-health-bar"><i style={{ width: `${Math.min(theme.weightPercent ?? 0, 100)}%` }} /></div>
                <em>{theme.weightPercent === null ? '待计算' : formatPercent(theme.weightPercent)}</em>
              </div>
            ))}
          </div>
        </article>
        <article className="glass-card">
          <CardHeader icon={<ListChecks />} title="风险提醒" subtitle="今天复盘时必须先看" />
          <div className="portfolio-risk-list">
            {portfolioHealth.riskNotes.map((risk) => <div key={risk}><span className="pulse warning" />{risk}</div>)}
          </div>
        </article>
      </section>

      <section className="today-workflow-grid">
        <article className="workflow-card">
          <div className="workflow-index">1</div>
          <div>
            <strong>同步核心数据</strong>
            <span>{syncHealth?.asOfDate === null || syncHealth === undefined ? '当前没有可用行情日期' : `当前行情日期 ${syncHealth.asOfDate}`}</span>
          </div>
          <button className="secondary-action" disabled={runningAction !== null} onClick={() => void runCoreSyncFromOverview()} type="button"><DatabaseZap size={15} /> {runningAction === 'sync' ? '同步中' : '执行'}</button>
        </article>
        <article className="workflow-card">
          <div className="workflow-index">2</div>
          <div>
            <strong>检查今日风险</strong>
            <span>{risks[0]}</span>
          </div>
          <button className="secondary-action" onClick={() => props.onNavigate('risk')} type="button"><ShieldCheck size={15} /> 查看</button>
        </article>
        <article className="workflow-card">
          <div className="workflow-index">3</div>
          <div>
            <strong>维护组合持仓</strong>
            <span>录入股票、基金和动作倾向，让投研结论贴近你的账户。</span>
          </div>
          <button className="secondary-action" onClick={() => props.onNavigate('research')} type="button"><CandlestickChart size={15} /> 录入</button>
        </article>
        <article className="workflow-card">
          <div className="workflow-index">4</div>
          <div>
            <strong>保存今日复盘</strong>
            <span>{props.research.journalEntries.length === 0 ? '还没有保存历史记录' : `已有 ${props.research.journalEntries.length} 条记录`}</span>
          </div>
          <button className="secondary-action" disabled={runningAction !== null} onClick={() => void saveDailyJournalFromOverview()} type="button"><ListChecks size={15} /> {runningAction === 'journal' ? '保存中' : '保存'}</button>
        </article>
      </section>

      <section className="split-grid">
        <article className="glass-card action-board-panel">
          <CardHeader icon={<ListChecks />} title="下一步动作" subtitle="这不是投资建议，是系统帮你整理的工作顺序" />
          <div className="action-check-list">
            <div><span className={syncHealth?.status === 'healthy' ? 'pulse live' : 'pulse'} /><strong>数据状态</strong><em>{syncHealthLabel(syncHealth?.status)}</em></div>
            <div><span className={props.successRate >= 55 ? 'pulse live' : 'pulse'} /><strong>回测状态</strong><em>{formatPercent(props.successRate)} 成功率</em></div>
            <div><span className={props.research.portfolioContext.stockAccount.positions.length > 0 ? 'pulse live' : 'pulse'} /><strong>组合上下文</strong><em>{props.research.portfolioContext.stockAccount.positions.length} 个股票持仓</em></div>
            <div><span className={props.research.journalEntries.length > 0 ? 'pulse live' : 'pulse'} /><strong>复盘沉淀</strong><em>{props.research.journalEntries.length} 条历史记录</em></div>
          </div>
          <p className="muted-copy">{actionMessage}</p>
        </article>
        <article className="glass-card action-board-panel">
          <CardHeader icon={<ShieldCheck />} title="当前阻断项" subtitle="先处理这些，再看策略信号" />
          <div className="risk-brief-list">
            {risks.map((risk) => <div key={risk}><span className="pulse warning" />{risk}</div>)}
          </div>
        </article>
      </section>

      <section className="metric-grid">
        <MetricCard icon={<DatabaseZap />} label="数据状态" value={syncHealthLabel(syncHealth?.status)} helper={syncHealth?.summary ?? '当前使用前端预览数据'} tone={syncHealthTone(syncHealth?.status)} />
        <MetricCard icon={<BarChart3 />} label="日线记录" value={formatNumber(props.data.overview.dataCenter.dailyBarCount)} helper={`行情日期 ${syncHealth?.asOfDate ?? props.data.overview.dataCenter.latestDailyBarDate ?? '--'}`} tone="cyan" />
        <MetricCard icon={<BrainCircuit />} label="策略数量" value={String(props.data.overview.strategies.total)} helper={props.data.overview.strategies.codes.join(' / ')} tone="green" />
        <MetricCard icon={<Activity />} label="回测成功率" value={formatPercent(props.successRate)} helper={`${successCount}/${props.data.overview.backtests.total} 成功`} tone="amber" />
      </section>

      <section className="main-grid">
        <EquityCard />
        <StatusCard byStatus={props.data.overview.backtests.byStatus} latestTask={props.data.overview.backtests.latestTask} />
      </section>

      <section className="three-column">
        <DataCoverageCard coverage={props.coverage.slice(0, 6)} />
        <StrategiesCompactCard strategies={props.data.strategies} />
        <BacktestsCompactCard backtests={props.data.backtests} />
      </section>
    </div>
  );
}

function DataCenterView(props: { readonly coverage: readonly DataCoverage[]; readonly syncHealth?: DataSyncHealth; readonly onRefresh: () => Promise<void> }): React.ReactElement {
  const maxTotal = Math.max(...props.coverage.map((item) => item.total), 1);
  const [startDate, setStartDate] = React.useState(daysAgoInputValue(7));
  const [endDate, setEndDate] = React.useState(todayInputValue());
  const [symbols, setSymbols] = React.useState('000001, 600519, 000333, 600000');
  const [isSyncing, setIsSyncing] = React.useState(false);
  const [isChecking, setIsChecking] = React.useState(false);
  const [syncResults, setSyncResults] = React.useState<readonly DataSyncResult[]>([]);
  const [smokeResult, setSmokeResult] = React.useState<EastmoneySmokeCheckResult | null>(null);
  const [operationMessage, setOperationMessage] = React.useState<string>('核心同步默认只拉取少量标的，适合先验证链路和工作台展示。');
  const health = props.syncHealth;

  async function runCoreSync(): Promise<void> {
    setIsSyncing(true);
    setOperationMessage('正在同步核心数据，请保持后端服务运行。');
    try {
      const results = await postApi<readonly DataSyncResult[]>('/data/sync/core', {
        startDate,
        endDate,
        symbols: parseSymbolInput(symbols),
      });
      setSyncResults(results);
      setOperationMessage(results.some((item) => item.status === 'FAILED') ? '同步完成，但存在失败任务，请查看下方明细。' : '核心数据同步完成，工作台状态已刷新。');
      await props.onRefresh();
    } catch (error) {
      const message = error instanceof Error ? error.message : '同步失败';
      setOperationMessage(`核心同步失败：${message}`);
    } finally {
      setIsSyncing(false);
    }
  }

  async function runSmokeCheck(): Promise<void> {
    setIsChecking(true);
    setOperationMessage('正在检查东方财富数据源连接。');
    try {
      const result = await postApi<EastmoneySmokeCheckResult>('/data/sync/eastmoney/smoke-check');
      setSmokeResult(result);
      setOperationMessage(result.status === 'SUCCESS' ? '数据源连接正常，可以继续同步核心数据。' : '数据源检查未完全通过，请查看失败项。');
    } catch (error) {
      const message = error instanceof Error ? error.message : '连接检查失败';
      setOperationMessage(`连接检查失败：${message}`);
    } finally {
      setIsChecking(false);
    }
  }

  return (
    <div className="view-stack">
      <section className="split-grid data-hero-grid">
        <article className="glass-card xl-card">
          <CardHeader icon={<DatabaseZap />} title="覆盖矩阵" subtitle="数据集覆盖、最新同步日期和相对完整度" />
          <div className="coverage-matrix">
            {props.coverage.map((item) => (
              <div className="matrix-row" key={item.dataSet}>
                <div>
                  <strong>{dataSetLabel(item.dataSet)}</strong>
                  <span>{item.latestDate ?? '未同步'}</span>
                </div>
                <div className="matrix-bar"><i style={{ width: `${Math.max(8, (item.total / maxTotal) * 100)}%` }} /></div>
                <em>{formatNumber(item.total)}</em>
              </div>
            ))}
          </div>
        </article>
        <article className="glass-card sync-card">
          <CardHeader icon={<Waves />} title="同步控制台" subtitle="数据源自检、核心同步和任务回执" />
          <div className={`sync-health-panel ${health?.status ?? 'empty'}`}>
            <div>
              <span>当前状态</span>
              <strong>{syncHealthLabel(health?.status)}</strong>
              <p>{health?.summary ?? '后端未返回同步健康状态。'}</p>
            </div>
            <em>{health?.asOfDate ?? '未同步'}</em>
          </div>
          <div className="sync-form">
            <label>
              <span>开始日期</span>
              <input onChange={(event) => setStartDate(event.target.value)} type="date" value={startDate} />
            </label>
            <label>
              <span>结束日期</span>
              <input onChange={(event) => setEndDate(event.target.value)} type="date" value={endDate} />
            </label>
            <label className="wide-field">
              <span>核心标的</span>
              <input onChange={(event) => setSymbols(event.target.value)} placeholder="000001, 600519" value={symbols} />
            </label>
          </div>
          <div className="sync-actions">
            <button className="secondary-action" disabled={isChecking || isSyncing} onClick={() => void runSmokeCheck()} type="button"><Radar size={15} /> 连接自检</button>
            <button className="primary-action compact" disabled={isChecking || isSyncing} onClick={() => void runCoreSync()} type="button"><Play size={15} /> {isSyncing ? '同步中' : '核心同步'}</button>
          </div>
          <p className="muted-copy">{operationMessage}</p>
        </article>
      </section>

      {health?.datasets !== undefined && (
        <article className="glass-card">
          <CardHeader icon={<ListChecks />} title="健康明细" subtitle="每个数据集的同步状态、最新日期和记录数" />
          <div className="health-grid">
            {health.datasets.map((item) => (
              <div className="health-item" key={item.dataSet}>
                <div>
                  <strong>{item.label}</strong>
                  <span>{item.latestDate ?? '未同步'} · {formatNumber(item.total)} 条</span>
                </div>
                <em className={`health-badge ${item.status}`}>{syncHealthLabel(item.status)}</em>
                {item.errorMessage !== undefined && <p>{item.errorMessage}</p>}
              </div>
            ))}
          </div>
        </article>
      )}

      {(syncResults.length > 0 || smokeResult !== null) && (
        <section className="split-grid">
          <article className="glass-card">
            <CardHeader icon={<Activity />} title="同步结果" subtitle="核心同步任务回执" />
            <div className="sync-result-list">
              {syncResults.length === 0 && <p className="muted-copy">还没有执行核心同步。</p>}
              {syncResults.map((item) => (
                <div className="sync-result-row" key={item.taskName}>
                  <div>
                    <strong>{syncResultLabel(item.taskName)}</strong>
                    <span>{formatNumber(item.successCount)} / {formatNumber(item.totalCount)} 成功</span>
                  </div>
                  <em className={`status-pill ${item.status.toLowerCase()}`}>{statusLabel(item.status)}</em>
                  {item.errorMessage !== undefined && <p>{item.errorMessage}</p>}
                </div>
              ))}
            </div>
          </article>
          <article className="glass-card">
            <CardHeader icon={<Radar />} title="数据源自检" subtitle="东方财富公开接口可用性" />
            <div className="sync-result-list">
              {smokeResult === null && <p className="muted-copy">还没有执行连接自检。</p>}
              {smokeResult?.checks.map((item) => (
                <div className="sync-result-row" key={item.name}>
                  <div>
                    <strong>{smokeCheckLabel(item.name)}</strong>
                    <span>样本 {formatNumber(item.sampleCount)} 条</span>
                  </div>
                  <em className={`status-pill ${item.status.toLowerCase()}`}>{statusLabel(item.status)}</em>
                  {item.errorMessage !== undefined && <p>{item.errorMessage}</p>}
                </div>
              ))}
            </div>
          </article>
        </section>
      )}

      <article className="glass-card">
        <CardHeader icon={<Table2 />} title="股票池预览" subtitle="股票池展示表格样式预览" />
        <div className="data-table">
          <div className="table-head"><span>TS Code</span><span>名称</span><span>行业</span><span>最新日期</span><span>状态</span></div>
          {stockRows.map((row) => (
            <div className="table-row" key={row[0]}>{row.map((cell, index) => <span className={index === 4 ? 'positive-text' : ''} key={cell}>{cell}</span>)}</div>
          ))}
        </div>
      </article>
    </div>
  );
}

function StrategiesView(props: { readonly strategies: readonly StrategyItem[] }): React.ReactElement {
  return (
    <div className="view-stack">
      <section className="strategy-grid-wide">
        {props.strategies.map((strategy, index) => (
          <article className={index === 0 ? 'glass-card featured-strategy' : 'glass-card strategy-detail-card'} key={strategy.code}>
            <div className="strategy-topline">
              <span className="strategy-code">{strategy.code}</span>
              <span className="version-pill">v{strategy.version}</span>
            </div>
            <h2>{strategyDisplayName(strategy)}</h2>
            <p>{strategyDisplayDescription(strategy)}</p>
            <div className="schema-list">
              {strategy.configSchema.map((field) => (
                <div className="schema-row" key={field.name}>
                  <div><strong>{field.name}</strong><span>{field.description}</span></div>
                  <em>{field.type}{field.required ? ' · 必填' : ''}</em>
                </div>
              ))}
            </div>
          </article>
        ))}
      </section>

      <section className="split-grid">
        <article className="glass-card">
          <CardHeader icon={<Layers3 />} title="因子权重" subtitle="多因子策略预览" />
          <div className="factor-list">
            {factorRows.map((factor) => (
              <div className="factor-row" key={factor.name}>
                <div><strong>{factor.name}</strong><span>{directionLabel(factor.direction)} · 权重 {factor.weight}</span></div>
                <div className="radial-score" style={{ '--score': `${factor.score}%` } as React.CSSProperties}>{factor.score}</div>
              </div>
            ))}
          </div>
        </article>
        <article className="glass-card">
          <CardHeader icon={<GitBranch />} title="信号样例" subtitle="工作台样例输出" />
          <div className="signal-grid">
            {['000001', '600000', '000333'].map((symbol, index) => (
              <div className="signal-card" key={symbol}>
                <span>{symbol}</span>
                <strong>{formatPercent(33.3 - index * 2.1)}</strong>
                <small>目标权重</small>
              </div>
            ))}
          </div>
        </article>
      </section>
    </div>
  );
}

function BacktestsView(props: { readonly backtests: readonly BacktestItem[]; readonly byStatus: Readonly<Record<string, number>> }): React.ReactElement {
  return (
    <div className="view-stack">
      <section className="main-grid">
        <EquityCard />
        <StatusCard byStatus={props.byStatus} latestTask={props.backtests[0] ?? null} />
      </section>
      <article className="glass-card">
        <CardHeader icon={<ListChecks />} title="回测任务" subtitle="任务列表、策略、资金与状态" />
        <div className="data-table backtest-table">
          <div className="table-head"><span>名称</span><span>策略</span><span>区间</span><span>资金</span><span>状态</span></div>
          {props.backtests.map((task) => (
            <div className="table-row" key={task.id}>
              <span>{task.name}</span>
              <span>{strategyDisplayName(task.strategyName)}</span>
              <span>{task.startDate} → {task.endDate}</span>
              <span>{formatMoney(task.initialCapital)}</span>
              <span><StatusPill status={task.status} /></span>
            </div>
          ))}
        </div>
      </article>
    </div>
  );
}

function ResearchView(props: { readonly data: ResearchData; readonly isLive: boolean; readonly showAmounts: boolean; readonly onRefresh: () => Promise<void> }): React.ReactElement {
  const daily = props.data.dailyNote;
  const context = props.data.portfolioContext;
  const [stockForm, setStockForm] = React.useState({
    symbol: '',
    name: '',
    quantity: '',
    costPrice: '',
    latestPrice: '',
    buyDate: '',
    holdingStage: 'holding',
    theme: '',
    thesis: '',
    actionBias: 'watch',
  });
  const [fundForm, setFundForm] = React.useState({
    fundCode: '',
    name: '',
    theme: '',
    amount: '',
    weightPercent: '',
    actionBias: 'watch',
  });
  const [lastPortfolioStockQuote, setLastPortfolioStockQuote] = React.useState<PortfolioStockQuote | null>(null);
  const [lastPortfolioFundQuote, setLastPortfolioFundQuote] = React.useState<PortfolioFundQuote | null>(null);
  const [isSavingPortfolio, setIsSavingPortfolio] = React.useState(false);
  const [isLookingUpPortfolioQuote, setIsLookingUpPortfolioQuote] = React.useState(false);
  const [isLookingUpPortfolioFund, setIsLookingUpPortfolioFund] = React.useState(false);
  const [portfolioMessage, setPortfolioMessage] = React.useState('新增或更新后，投研中心会立即重新计算组合上下文和主题暴露。');
  const [isSavingJournal, setIsSavingJournal] = React.useState(false);
  const [journalMessage, setJournalMessage] = React.useState('保存后会进入历史记录，用来对照今天判断和后续市场验证。');
  const stockMarketValue = context.stockAccount.positions.reduce((sum, item) => sum + (item.marketValue ?? item.quantity * (item.latestPrice ?? item.costPrice)), 0);
  const fundVisibleValue = context.fundAccount.visibleAssetValue;
  const estimatedPortfolioValue = stockMarketValue + fundVisibleValue;
  const topFundExposures = context.fundAccount.exposures.slice(0, 6);
  const riskCount = context.riskFlags.length + props.data.portfolioReview.riskNotes.length;
  const normalizedPortfolioStockSymbol = normalizeStockSymbolInput(stockForm.symbol);
  const existingPortfolioStock = normalizedPortfolioStockSymbol === null ? undefined : context.stockAccount.positions.find((position) => position.symbol === normalizedPortfolioStockSymbol);
  const actionBuckets = [
    ['分批加仓', daily.actionBuckets.build],
    ['观察', daily.actionBuckets.watch],
    ['风控', daily.actionBuckets.riskControl],
    ['止盈', daily.actionBuckets.takeProfit],
  ] as const;

  async function saveStockHolding(): Promise<void> {
    const normalizedSymbol = normalizeStockSymbolInput(stockForm.symbol);
    if (normalizedSymbol === null) {
      setPortfolioMessage('请先输入可识别的 6 位 A 股代码，例如 300750、300750.SZ 或 sz300750。');
      return;
    }
    if (stockForm.name.trim().length === 0 || stockForm.theme.trim().length === 0) {
      setPortfolioMessage('请先查询真实行情并确认名称、主题后再保存。');
      return;
    }
    setIsSavingPortfolio(true);
    setPortfolioMessage('正在保存股票持仓。');
    try {
      await postApi<ResearchPortfolioContext>('/portfolio/holdings/stocks', {
        symbol: normalizedSymbol,
        name: stockForm.name.trim(),
        quantity: Number(stockForm.quantity),
        costPrice: Number(stockForm.costPrice),
        latestPrice: stockForm.latestPrice.length === 0 ? null : Number(stockForm.latestPrice),
        buyDate: stockForm.buyDate.trim().length === 0 ? undefined : stockForm.buyDate.trim(),
        holdingStage: stockForm.holdingStage,
        theme: stockForm.theme.trim(),
        themeTags: stockForm.theme.split(/[\/,，、]+/).map((item) => item.trim()).filter(Boolean),
        thesis: stockForm.thesis.length === 0 ? undefined : stockForm.thesis.trim(),
        actionBias: stockForm.actionBias,
      });
      setStockForm({ symbol: '', name: '', quantity: '', costPrice: '', latestPrice: '', buyDate: '', holdingStage: 'holding', theme: '', thesis: '', actionBias: 'watch' });
      setLastPortfolioStockQuote(null);
      await props.onRefresh();
      setPortfolioMessage('股票持仓已保存，组合上下文已刷新。');
    } catch (error) {
      const message = error instanceof Error ? error.message : '保存失败';
      setPortfolioMessage(`股票持仓保存失败：${message}`);
    } finally {
      setIsSavingPortfolio(false);
    }
  }

  async function lookupPortfolioStockQuote(): Promise<void> {
    const symbol = normalizeStockSymbolInput(stockForm.symbol);
    if (symbol === null) {
      setPortfolioMessage('先输入股票代码，例如 300750、300750.SZ 或 sz300750。');
      return;
    }

    setIsLookingUpPortfolioQuote(true);
    setPortfolioMessage(`正在通过真实行情源查询 ${symbol}。`);
    try {
      const quotes = await lookupPortfolioQuotes([symbol]);
      const quote = quotes[0];
      if (quote === undefined) {
        setPortfolioMessage(`没有查到 ${symbol} 的真实行情，请确认代码是否正确。`);
        return;
      }
      setStockForm({
        ...stockForm,
        symbol: quote.symbol,
        name: quote.name,
        latestPrice: String(Number(quote.latestPrice)),
        costPrice: stockForm.costPrice.trim().length === 0 ? String(Number(quote.latestPrice)) : stockForm.costPrice,
        theme: stockForm.theme.trim().length === 0 ? quote.suggestedTheme : stockForm.theme,
      });
      setLastPortfolioStockQuote(quote);
      setPortfolioMessage(`${quote.name} 已回填：现价 ${Number(quote.latestPrice)}，今日涨跌 ${quote.dailyPctChange}%，数据源 ${quote.quoteSource}。`);
    } catch (error) {
      const message = error instanceof Error ? error.message : '查询失败';
      setPortfolioMessage(`行情查询失败：${message}`);
    } finally {
      setIsLookingUpPortfolioQuote(false);
    }
  }

  async function saveFundHolding(): Promise<void> {
    setIsSavingPortfolio(true);
    setPortfolioMessage('正在保存基金暴露。');
    try {
      await postApi<ResearchPortfolioContext>('/portfolio/holdings/funds', {
        fundCode: fundForm.fundCode.trim().length === 0 ? undefined : fundForm.fundCode.trim(),
        name: fundForm.name,
        theme: fundForm.theme,
        amount: Number(fundForm.amount),
        weightPercent: fundForm.weightPercent.length === 0 ? undefined : Number(fundForm.weightPercent),
        actionBias: fundForm.actionBias,
      });
      setFundForm({ fundCode: '', name: '', theme: '', amount: '', weightPercent: '', actionBias: 'watch' });
      setLastPortfolioFundQuote(null);
      await props.onRefresh();
      setPortfolioMessage('基金暴露已保存，主题矩阵已刷新。');
    } catch (error) {
      const message = error instanceof Error ? error.message : '保存失败';
      setPortfolioMessage(`基金暴露保存失败：${message}`);
    } finally {
      setIsSavingPortfolio(false);
    }
  }

  async function lookupPortfolioFundQuote(): Promise<void> {
    const fundCode = fundForm.fundCode.trim();
    if (!/^[0-9]{6}$/.test(fundCode)) {
      setPortfolioMessage('先输入 6 位基金代码，例如 161725。');
      return;
    }

    setIsLookingUpPortfolioFund(true);
    setPortfolioMessage(`正在查询基金 ${fundCode} 的净值。`);
    try {
      const quotes = await lookupPortfolioFundQuotes([fundCode]);
      const quote = quotes[0];
      if (quote === undefined) {
        setPortfolioMessage(`没有查到 ${fundCode} 的基金净值，请确认代码是否正确。`);
        return;
      }
      setFundForm({
        ...fundForm,
        fundCode: quote.fundCode,
        name: quote.name,
        theme: fundForm.theme.trim().length === 0 ? inferFundTheme(quote.name) : fundForm.theme,
      });
      setLastPortfolioFundQuote(quote);
      setPortfolioMessage(`${quote.name} 已回填：${quote.netValueDate} 单位净值 ${quote.unitNetValue}${quote.estimatedPctChange === null ? '' : `，估算涨跌 ${quote.estimatedPctChange}%`}。`);
    } catch (error) {
      const message = error instanceof Error ? error.message : '查询失败';
      setPortfolioMessage(`基金净值查询失败：${message}`);
    } finally {
      setIsLookingUpPortfolioFund(false);
    }
  }

  async function saveDailyJournal(): Promise<void> {
    setIsSavingJournal(true);
    setJournalMessage('正在保存今日投研记录。');
    try {
      await postApi<ResearchJournalEntry>('/research/journal', {
        noteDate: todayInputValue(),
        title: noteTitle(daily.title),
        topConclusion: localizedText(daily.topConclusion),
        actionItems: [
          ...daily.actionBuckets.add,
          ...daily.actionBuckets.build,
          ...daily.actionBuckets.watch,
          ...daily.actionBuckets.takeProfit,
          ...daily.actionBuckets.riskControl,
        ].map(localizedText),
        disconfirmingEvidence: daily.disconfirmingEvidence.map(localizedText),
        nextFocus: daily.nextFocus.map(localizedText),
      });
      await props.onRefresh();
      setJournalMessage('今日投研记录已保存，可以在历史记录里回看。');
    } catch (error) {
      const message = error instanceof Error ? error.message : '保存失败';
      setJournalMessage(`投研记录保存失败：${message}`);
    } finally {
      setIsSavingJournal(false);
    }
  }

  return (
    <div className="view-stack research-view">
      <section className="hero-card research-hero">
        <div>
          <div className="eyebrow"><Sparkles size={14} /> {daily.marketState === 'live' && props.isLive ? '投研 API 实时连接' : '投研预览数据'}</div>
          <h2>今日决策板</h2>
          <p>{localizedText(daily.topConclusion)}</p>
        </div>
        <div className="research-brief-panel">
          <span>信号姿态</span>
          <strong>{actionLabel(context.actionPolicy.defaultBias)}</strong>
          <small>{daily.nextFocus[0] === undefined ? '等待下一步投研信号' : localizedText(daily.nextFocus[0])}</small>
        </div>
      </section>

      <section className="research-kpi-strip">
        <div><span>估算组合口径</span><strong>{privacyMoney(estimatedPortfolioValue, props.showAmounts)}</strong><small>股票 {formatPercent(stockMarketValue / Math.max(estimatedPortfolioValue, 1) * 100)} / 基金 {formatPercent(fundVisibleValue / Math.max(estimatedPortfolioValue, 1) * 100)}</small></div>
        <div><span>股票持仓</span><strong>{context.stockAccount.positions.length}</strong><small>{context.stockAccount.positionLevel}</small></div>
        <div><span>主题暴露</span><strong>{props.data.themeExposures.length}</strong><small>股票 + 基金矩阵</small></div>
        <div><span>投研记录</span><strong>{props.data.journalEntries.length}</strong><small>已保存的复盘历史</small></div>
        <div><span>风险约束</span><strong>{riskCount}</strong><small>动作前检查</small></div>
      </section>

      <section className="research-command-grid">
        <article className="glass-card research-note-card">
          <CardHeader icon={<Radar />} title={noteTitle(daily.title)} subtitle="14:30 盘中复盘 / 盘前计划 / 收盘验证" />
          <div className="research-section-list">
            {daily.sections.map((section) => (
              <div className="research-section" key={section.code}>
                <strong>{section.title}</strong>
                {section.bullets.map((bullet) => <span key={bullet}>{localizedText(bullet)}</span>)}
              </div>
            ))}
          </div>
          <div className="journal-save-row">
            <button className="primary-action compact" disabled={isSavingJournal} onClick={() => void saveDailyJournal()} type="button"><ListChecks size={15} /> {isSavingJournal ? '保存中' : '保存记录'}</button>
            <span>{journalMessage}</span>
          </div>
        </article>

        <article className="glass-card action-board">
          <CardHeader icon={<ListChecks />} title="动作分组" subtitle="所有建议必须落到固定动作分类" />
          {actionBuckets.map(([label, items]) => (
            <div className="action-row" key={label}>
              <span>{label}</span>
              <strong>{items.length}</strong>
              <small>{items[0] === undefined ? '等待真实信号确认' : localizedText(items[0])}</small>
            </div>
          ))}
          <div className="policy-strip">
            <strong>默认动作：{actionLabel(context.actionPolicy.defaultBias)}</strong>
            {context.actionPolicy.rules.map((rule) => <span key={rule}>{localizedText(rule)}</span>)}
          </div>
        </article>
      </section>

      <article className="glass-card">
        <CardHeader icon={<Table2 />} title="投研历史" subtitle="已保存的每日复盘和后续验证入口" />
        <div className="journal-list">
          {props.data.journalEntries.length === 0 && <p className="muted-copy">还没有保存投研记录。</p>}
          {props.data.journalEntries.map((entry) => (
            <div className="journal-entry" key={entry.id}>
              <div className="strategy-topline"><span className="strategy-code">{entry.noteDate}</span><span className="version-pill">{entry.owner}</span></div>
              <strong>{entry.title}</strong>
              <p>{entry.topConclusion}</p>
              <div>
                {entry.actionItems.slice(0, 4).map((item) => <span key={item}>{item}</span>)}
              </div>
            </div>
          ))}
        </div>
      </article>

      <article className="glass-card portfolio-editor">
        <CardHeader icon={<Boxes />} title="组合维护" subtitle="新增或更新你的股票持仓和基金暴露" />
        <div className="portfolio-editor-grid">
          <div className="portfolio-form">
            <strong>股票持仓</strong>
            <div className="form-grid">
              <input
                onBlur={() => {
                  if (normalizeStockSymbolInput(stockForm.symbol) !== null && stockForm.name.trim().length === 0) {
                    void lookupPortfolioStockQuote();
                  }
                }}
                onChange={(event) => setStockForm({ ...stockForm, symbol: event.target.value })}
                placeholder="代码，如 300750 或 300750.SZ"
                value={stockForm.symbol}
              />
              <input onChange={(event) => setStockForm({ ...stockForm, name: event.target.value })} placeholder="名称" value={stockForm.name} />
              <button className="secondary-action" disabled={isLookingUpPortfolioQuote || normalizeStockSymbolInput(stockForm.symbol) === null} onClick={() => void lookupPortfolioStockQuote()} type="button"><Search size={15} /> {isLookingUpPortfolioQuote ? '查询中' : '查真实行情'}</button>
              <input onChange={(event) => setStockForm({ ...stockForm, quantity: event.target.value })} placeholder="数量" type="number" value={stockForm.quantity} />
              <input onChange={(event) => setStockForm({ ...stockForm, costPrice: event.target.value })} placeholder="成本价" type="number" value={stockForm.costPrice} />
              <input onChange={(event) => setStockForm({ ...stockForm, latestPrice: event.target.value })} placeholder="最新价，可空" type="number" value={stockForm.latestPrice} />
              <input onChange={(event) => setStockForm({ ...stockForm, buyDate: event.target.value })} type="date" value={stockForm.buyDate} />
              <select onChange={(event) => setStockForm({ ...stockForm, holdingStage: event.target.value })} value={stockForm.holdingStage}>
                <option value="new">新买入</option>
                <option value="holding">持有中</option>
                <option value="long_term_core">长期核心</option>
              </select>
              <select onChange={(event) => setStockForm({ ...stockForm, actionBias: event.target.value })} value={stockForm.actionBias}>
                <option value="watch">观察</option>
                <option value="hold">持有</option>
                <option value="build">分批建仓</option>
                <option value="add">加仓</option>
                <option value="take_profit">止盈</option>
                <option value="risk_control">风控</option>
              </select>
              <input className="wide-field" onChange={(event) => setStockForm({ ...stockForm, theme: event.target.value })} placeholder="主题，如 新能源 / 电池" value={stockForm.theme} />
              <input className="wide-field" onChange={(event) => setStockForm({ ...stockForm, thesis: event.target.value })} placeholder="持仓逻辑，可空" value={stockForm.thesis} />
            </div>
            {(lastPortfolioStockQuote !== null || existingPortfolioStock !== undefined) && (
              <div className="quote-draft-card">
                <div>
                  <span>{existingPortfolioStock === undefined ? '新标的' : '已有持仓'}</span>
                  <strong>{lastPortfolioStockQuote?.name ?? existingPortfolioStock?.name} · {lastPortfolioStockQuote?.symbol ?? existingPortfolioStock?.symbol}</strong>
                  <small>数据源 {lastPortfolioStockQuote?.quoteSource ?? '持仓记录'} · {lastPortfolioStockQuote?.market ?? 'A 股'}</small>
                </div>
                <div className="quote-draft-metrics">
                  <span>现价 <strong>{lastPortfolioStockQuote?.latestPrice ?? existingPortfolioStock?.latestPrice ?? '待查询'}</strong></span>
                  <span>涨跌 <strong className={Number(lastPortfolioStockQuote?.dailyPctChange ?? 0) >= 0 ? 'quote-up' : 'quote-down'}>{lastPortfolioStockQuote?.dailyPctChange ?? '--'}%</strong></span>
                  <span>主题 <strong>{lastPortfolioStockQuote?.suggestedTheme ?? existingPortfolioStock?.theme ?? '待补充'}</strong></span>
                </div>
                <div className="quote-draft-actions">
                  <button
                    className="secondary-action"
                    disabled={lastPortfolioStockQuote === null}
                    onClick={() => {
                      if (lastPortfolioStockQuote === null) {
                        return;
                      }
                      setStockForm({
                        ...stockForm,
                        symbol: lastPortfolioStockQuote.symbol,
                        name: lastPortfolioStockQuote.name,
                        costPrice: stockForm.costPrice.trim().length === 0 ? String(Number(lastPortfolioStockQuote.latestPrice)) : stockForm.costPrice,
                        latestPrice: String(Number(lastPortfolioStockQuote.latestPrice)),
                        theme: stockForm.theme.trim().length === 0 ? lastPortfolioStockQuote.suggestedTheme : stockForm.theme,
                      });
                    }}
                    type="button"
                  >
                    <RefreshCcw size={15} /> 用行情填表
                  </button>
                  <small>{stockForm.quantity.trim().length === 0 ? '保存前还需要填写数量。' : '数量已填写，可以保存或继续补充逻辑。'}</small>
                </div>
              </div>
            )}
            <button className="secondary-action" disabled={isSavingPortfolio} onClick={() => void saveStockHolding()} type="button"><CandlestickChart size={15} /> 保存股票</button>
          </div>

          <div className="portfolio-form">
            <strong>基金暴露</strong>
            <div className="form-grid">
              <input
                onBlur={() => {
                  if (/^[0-9]{6}$/.test(fundForm.fundCode.trim()) && fundForm.name.trim().length === 0) {
                    void lookupPortfolioFundQuote();
                  }
                }}
                onChange={(event) => setFundForm({ ...fundForm, fundCode: event.target.value })}
                placeholder="基金代码，如 161725"
                value={fundForm.fundCode}
              />
              <input onChange={(event) => setFundForm({ ...fundForm, name: event.target.value })} placeholder="基金名称" value={fundForm.name} />
              <button className="secondary-action" disabled={isLookingUpPortfolioFund || !/^[0-9]{6}$/.test(fundForm.fundCode.trim())} onClick={() => void lookupPortfolioFundQuote()} type="button"><Search size={15} /> {isLookingUpPortfolioFund ? '查询中' : '查基金净值'}</button>
              <input onChange={(event) => setFundForm({ ...fundForm, theme: event.target.value })} placeholder="主题" value={fundForm.theme} />
              <input onChange={(event) => setFundForm({ ...fundForm, amount: event.target.value })} placeholder="金额" type="number" value={fundForm.amount} />
              <input onChange={(event) => setFundForm({ ...fundForm, weightPercent: event.target.value })} placeholder="权重%，可空" type="number" value={fundForm.weightPercent} />
              <select className="wide-field" onChange={(event) => setFundForm({ ...fundForm, actionBias: event.target.value })} value={fundForm.actionBias}>
                <option value="watch">观察</option>
                <option value="hold">持有</option>
                <option value="build">分批建仓</option>
                <option value="add">加仓</option>
                <option value="take_profit">止盈</option>
                <option value="risk_control">风控</option>
              </select>
            </div>
            {lastPortfolioFundQuote !== null && (
              <div className="quote-draft-card">
                <div>
                  <span>基金净值</span>
                  <strong>{lastPortfolioFundQuote.name} · {lastPortfolioFundQuote.fundCode}</strong>
                  <small>数据源 {lastPortfolioFundQuote.quoteSource} · 净值日 {lastPortfolioFundQuote.netValueDate}</small>
                </div>
                <div className="quote-draft-metrics">
                  <span>单位净值 <strong>{lastPortfolioFundQuote.unitNetValue}</strong></span>
                  <span>估算净值 <strong>{lastPortfolioFundQuote.estimatedNetValue ?? '无估算'}</strong></span>
                  <span>估算涨跌 <strong className={Number(lastPortfolioFundQuote.estimatedPctChange ?? 0) >= 0 ? 'quote-up' : 'quote-down'}>{lastPortfolioFundQuote.estimatedPctChange ?? '--'}%</strong></span>
                </div>
                <div className="quote-draft-actions">
                  <small>{lastPortfolioFundQuote.estimatedAt === null ? '场外基金净值通常收盘后更新。' : `估算时间 ${lastPortfolioFundQuote.estimatedAt}，最终以正式净值为准。`}</small>
                </div>
              </div>
            )}
            <button className="secondary-action" disabled={isSavingPortfolio} onClick={() => void saveFundHolding()} type="button"><Layers3 size={15} /> 保存基金</button>
          </div>
        </div>
        <p className="muted-copy">{portfolioMessage}</p>
      </article>

      <section className="research-grid portfolio-context-grid">
        <article className="glass-card">
          <CardHeader icon={<CandlestickChart />} title={`${context.owner} 股票持仓`} subtitle={`${context.accountScope} · ${context.stockAccount.positionLevel}`} />
          <div className="portfolio-stat-row">
            <div><span>股票市值</span><strong>{privacyMoney(stockMarketValue, props.showAmounts)}</strong></div>
            <div><span>持仓数</span><strong>{context.stockAccount.positions.length}</strong></div>
            <div><span>动作基准</span><strong>{actionLabel(context.actionPolicy.defaultBias)}</strong></div>
          </div>
          <div className="position-list">
            {context.stockAccount.positions.map((position) => (
              <div className="position-card" key={position.symbol}>
                <div className="strategy-topline"><span className="strategy-code">{position.symbol}</span><span className="version-pill">{actionLabel(position.actionBias)}</span></div>
                <strong>{position.name}</strong>
                <span>{position.quantity} 股{props.showAmounts ? ` @ ¥${position.costPrice.toFixed(2)}${position.latestPrice === undefined || position.latestPrice === null ? '' : ` / 最新 ¥${position.latestPrice.toFixed(2)}`}` : ''} · {position.theme}</span>
                {position.marketValue !== undefined && position.marketValue !== null && <span>{props.showAmounts ? `市值 ${privacyMoney(position.marketValue, true)}${position.unrealizedPnl === undefined || position.unrealizedPnl === null ? '' : ` · 浮盈亏 ${privacyMoney(position.unrealizedPnl, true)}`}` : '金额已隐藏，仅显示持仓数量和主题'}</span>}
                <p>{position.thesis}</p>
              </div>
            ))}
          </div>
        </article>

        <article className="glass-card">
          <CardHeader icon={<Layers3 />} title="基金/主题暴露" subtitle={props.showAmounts ? `可见基金 ${formatNumber(fundVisibleValue)} / 账户约 ${formatNumber(context.fundAccount.totalAssetValue)}` : '金额已隐藏，仅显示权重和主题'} />
          <div className="fund-exposure-list">
            {topFundExposures.map((exposure) => (
              <div className="fund-exposure-row" key={`${exposure.name}-${exposure.theme}`}>
                <div><strong>{exposure.name}</strong><span>{exposure.theme}</span></div>
                <div className="exposure-bar"><i style={{ width: `${Math.min(exposure.weightPercent * 2.4, 100)}%` }} /></div>
                <em>{exposure.weightPercent.toFixed(2)}%</em>
              </div>
            ))}
          </div>
          <div className="watch-theme-cloud">
            {context.watchThemes.map((theme) => <span key={theme}>{theme}</span>)}
          </div>
        </article>
      </section>

      <article className="glass-card risk-flag-panel">
        <CardHeader icon={<ShieldCheck />} title="组合风险标记" subtitle="后续所有建议都必须先通过这些组合约束" />
        <div className="risk-flag-grid">
          {context.riskFlags.map((flag) => <div className="risk-flag" key={flag}><span className="pulse warning" />{flag}</div>)}
        </div>
      </article>

      <article className="glass-card theme-exposure-panel">
        <CardHeader icon={<Waves />} title="主题暴露矩阵" subtitle="把股票和基金暴露合并成可操作的主题视图" />
        <div className="theme-exposure-grid">
          {props.data.themeExposures.map((exposure) => (
            <div className="theme-exposure-card" key={`${exposure.theme}-${exposure.source}`}>
              <div className="strategy-topline"><span className="strategy-code">{exposure.theme}</span><span className="version-pill">{actionLabel(exposure.actionBias)}</span></div>
              <div className="theme-exposure-meta">
                <span>{sourceLabel(exposure.source)}</span>
                <strong>{exposure.weightPercent === null ? '待接实时权重' : `${exposure.weightPercent.toFixed(2)}%`}</strong>
              </div>
              <p>{exposure.riskNote}</p>
              <small>{exposure.nextStep}</small>
            </div>
          ))}
        </div>
      </article>

      <section className="research-grid three-way">
        <article className="glass-card">
          <CardHeader icon={<Activity />} title="组合上下文" subtitle={`整体风险：${riskLevelLabel(props.data.portfolioReview.positioning.overallRisk)}`} />
          <div className="theme-stack">
            {props.data.portfolioReview.themeExposures.map((item) => (
              <div className="theme-card" key={item.theme}>
                <strong>{item.theme}</strong>
                <span>{item.status}</span>
                <p>{item.suggestion}</p>
              </div>
            ))}
          </div>
        </article>

        <article className="glass-card">
          <CardHeader icon={<GitBranch />} title="投资逻辑与催化" subtitle="为什么持有，以及什么会改变判断" />
          {props.data.theses.map((thesis) => (
            <div className="thesis-card" key={thesis.target}>
              <strong>{thesis.target}</strong>
              <span>{actionLabel(thesis.status)} · {actionLabel(thesis.currentAction)}</span>
              <p>{thesis.pillars[0]}</p>
            </div>
          ))}
          {props.data.catalysts.map((catalyst) => (
            <div className="catalyst-card" key={`${catalyst.date}-${catalyst.title}`}>
              <span>{catalyst.category} · {catalyst.impactLevel}</span>
              <strong>{catalyst.title}</strong>
              <p>{catalyst.currentResponse}</p>
            </div>
          ))}
        </article>
      </section>

      <article className="glass-card">
        <CardHeader icon={<Table2 />} title="投研工作流" subtitle="吸收成熟投研产品工作流，但围绕 Ricki 的 A 股持仓重构" />
        <div className="playbook-grid">
          {props.data.playbooks.map((playbook) => (
            <div className="playbook-card" key={playbook.code}>
              <strong>{playbookDisplayName(playbook)}</strong>
              <p>{playbook.description}</p>
              <div>{playbook.output.map((item) => <span key={item}>{item}</span>)}</div>
            </div>
          ))}
        </div>
      </article>
    </div>
  );
}

function TradingDecisionView(props: { readonly data: PortfolioData; readonly isLive: boolean; readonly showAmounts: boolean; readonly onRefresh: () => Promise<void> }): React.ReactElement {
  const context = props.data.context;
  const decision = props.data.tradingDecision;
  const positions = props.data.positions.length > 0 ? props.data.positions : context.positions;
  const dataStatus = decision.dataStatus ?? fallbackPortfolioData.tradingDecision.dataStatus;
  const [stockForm, setStockForm] = React.useState({
    symbol: '',
    name: '',
    quantity: '',
    costPrice: '',
    latestPrice: '',
    buyDate: '',
    holdingStage: 'holding',
    theme: '',
    thesis: '',
    actionBias: 'watch',
  });
  const [fundForm, setFundForm] = React.useState({
    fundCode: '',
    name: '',
    theme: '',
    amount: '',
    weightPercent: '',
    actionBias: 'watch',
  });
  const [lastStockQuote, setLastStockQuote] = React.useState<PortfolioStockQuote | null>(null);
  const [lastFundQuote, setLastFundQuote] = React.useState<PortfolioFundQuote | null>(null);
  const [isSavingHolding, setIsSavingHolding] = React.useState(false);
  const [isLookingUpQuote, setIsLookingUpQuote] = React.useState(false);
  const [isLookingUpFundQuote, setIsLookingUpFundQuote] = React.useState(false);
  const [holdingMessage, setHoldingMessage] = React.useState('选择已有持仓或基金可自动带出信息；保存后会重新生成今日建议。');
  const [isGeneratingRealtimeAdvice, setIsGeneratingRealtimeAdvice] = React.useState(false);
  const [lastRealtimeAdviceAt, setLastRealtimeAdviceAt] = React.useState<number | null>(null);
  const [realtimeAdviceMessage, setRealtimeAdviceMessage] = React.useState('点击后会重新拉取最新行情和当前持仓，生成一版可执行建议。');
  const [cooldownTick, setCooldownTick] = React.useState(Date.now());
  const decisions = decision.decisions.length > 0 ? decision.decisions : positions.map((position) => ({
    ...position,
    unrealizedPnlPercent: null,
    action: position.riskLevel === 'high' ? 'risk_control' as const : position.actionBias === 'hold' ? 'hold' as const : 'watch' as const,
    actionLabel: actionLabel(position.riskLevel === 'high' ? 'risk_control' : position.actionBias),
    systemAction: {
      code: position.riskLevel === 'high' ? 'reduce_risk' as const : 'no_action' as const,
      label: position.riskLevel === 'high' ? '减仓复核' : '不操作',
      severity: position.riskLevel === 'high' ? 'urgent' as const : 'none' as const,
      needsAttention: position.riskLevel === 'high',
      instruction: position.riskLevel === 'high'
        ? `${position.name} 风险等级较高，但实时行情未更新，先不要补仓，等待行情恢复后重新生成建议。`
        : `${position.name} 当前没有触发买卖条件，系统建议继续持有。`,
    },
    reasons: [`主题：${(position.themeTags ?? []).join(' / ') || '待补充'}`],
    triggers: ['等待主题强弱、趋势和组合集中度共同确认。'],
    pricePlan: {
      currentPrice: position.latestPrice,
      costPrice: position.costPrice,
      stopLossPrice: null,
      profitProtectPrice: null,
      addWatchPrice: null,
      strengthConfirmPrice: null,
    },
  }));
  const fundExposures = props.data.fundExposures.length > 0 ? props.data.fundExposures : context.fundExposures;
  const topFunds = [...fundExposures].sort((left, right) => Number(right.weightPercent ?? '0') - Number(left.weightPercent ?? '0')).slice(0, 5);
  const topFundSignals = [...(decision.fundSignals ?? [])].sort((left, right) => Number(right.weightPercent ?? '0') - Number(left.weightPercent ?? '0')).slice(0, 6);
  const topThemeRadar = [...(decision.themeRadar ?? [])].slice(0, 6);
  const marketSnapshots = decision.marketSnapshots.length > 0 ? decision.marketSnapshots : context.marketSnapshots;
  const highRisk = decisions.filter((item) => item.riskLevel === 'high' || item.action === 'risk_control');
  const attentionDecisions = decisions.filter((item) => item.systemAction.needsAttention);
  const noActionDecisions = decisions.filter((item) => !item.systemAction.needsAttention);
  const urgentDecisions = attentionDecisions.filter((item) => item.systemAction.severity === 'urgent');
  const importantDecisions = attentionDecisions.filter((item) => item.systemAction.severity === 'important');
  const watchActionDecisions = attentionDecisions.filter((item) => item.systemAction.severity === 'watch');
  const positionBySymbol = new Map(positions.map((position) => [position.symbol, position] as const));
  const themeTagsBySymbol = new Map(positions.map((position) => [position.symbol, position.themeTags ?? []] as const));
  const quantSignalBySymbol = new Map((decision.quantSignals ?? []).map((signal) => [signal.symbol, signal] as const));
  const liveQuoteNames = positions.filter(hasLivePositionQuote).map((position) => `${position.name} ${position.symbol}`);
  const staleQuoteNames = positions.filter((position) => !hasLivePositionQuote(position)).map((position) => `${position.name} ${position.symbol}`);
  const coverageRatio = Number(dataStatus.quoteCoverage.ratio);
  const quoteHealth = coverageRatio >= 100
    ? { label: '全部真实行情覆盖', tone: 'live' as const, detail: '当前组合里的股票/ETF 都拿到了行情，今日建议可信度最高。' }
    : coverageRatio > 0
      ? { label: '部分真实行情覆盖', tone: 'partial' as const, detail: '没有拿到行情的标的会按成本兜底，建议需要人工复核。' }
      : { label: '未拿到真实行情', tone: 'fallback' as const, detail: '当前建议只适合做结构复盘，不适合直接作为盘中动作依据。' };
  const bucketItems = {
    hold: decisions.filter((item) => item.action === 'hold').map((item) => formatDecisionTarget(item, themeTagsBySymbol)),
    watch: decisions.filter((item) => item.action === 'watch').map((item) => formatDecisionTarget(item, themeTagsBySymbol)),
    addOnStrength: decisions.filter((item) => item.action === 'add_on_strength').map((item) => formatDecisionTarget(item, themeTagsBySymbol)),
    riskControl: decisions.filter((item) => item.action === 'risk_control').map((item) => formatDecisionTarget(item, themeTagsBySymbol)),
  };
  const [previousSnapshot, setPreviousSnapshot] = React.useState<DecisionSnapshot | null>(() => readDecisionSnapshot());
  const currentSnapshot = buildDecisionSnapshot(decision, dataStatus.status, bucketItems);
  const snapshotComparison = compareDecisionSnapshots(previousSnapshot, currentSnapshot);
  const stockFormInvalid = validateTradingStockForm(stockForm) !== null;
  const fundFormInvalid = validateTradingFundForm(fundForm) !== null;
  const normalizedStockSymbol = normalizeStockSymbolInput(stockForm.symbol);
  const existingStockDraft = normalizedStockSymbol === null ? undefined : positions.find((position) => position.symbol === normalizedStockSymbol);
  const realtimeAdviceCooldownSeconds = lastRealtimeAdviceAt === null
    ? 0
    : Math.max(0, 10 - Math.floor((cooldownTick - lastRealtimeAdviceAt) / 1000));
  const realtimeAdviceDisabled = isGeneratingRealtimeAdvice || realtimeAdviceCooldownSeconds > 0;
  const actionRows = [
    { title: '现在先做', items: decision.intradayPlan.doNow, tone: 'ready' },
    { title: '等待确认', items: decision.intradayPlan.waitFor, tone: 'wait' },
    { title: '今天避免', items: decision.intradayPlan.avoid, tone: 'avoid' },
    { title: '风控触发', items: decision.intradayPlan.emergency, tone: 'danger' },
  ];

  function fillStockForm(symbol: string): void {
    const position = positions.find((item) => item.symbol === symbol);
    if (position === undefined) {
      setStockForm({ ...stockForm, symbol });
      return;
    }
    setStockForm({
      symbol: position.symbol,
      name: position.name,
      quantity: String(position.quantity),
      costPrice: String(Number(position.costPrice)),
      latestPrice: position.latestPrice === null ? '' : String(Number(position.latestPrice)),
      buyDate: position.buyDate ?? '',
      holdingStage: position.holdingStage,
      theme: (position.themeTags ?? []).join(' / '),
      thesis: '',
      actionBias: position.actionBias,
    });
    setLastStockQuote(null);
  }

  function fillFundForm(name: string): void {
    const fund = fundExposures.find((item) => item.name === name);
    if (fund === undefined) {
      setFundForm({ ...fundForm, name });
      return;
    }
    setFundForm({
      fundCode: fund.fundCode ?? '',
      name: fund.name,
      theme: fund.theme,
      amount: String(Number(fund.amount)),
      weightPercent: fund.weightPercent === null ? '' : String(Number(fund.weightPercent)),
      actionBias: fund.actionBias,
    });
    setLastFundQuote(null);
  }

  async function saveTradingStockHolding(): Promise<void> {
    const validationMessage = validateTradingStockForm(stockForm);
    if (validationMessage !== null) {
      setHoldingMessage(validationMessage);
      return;
    }
    const normalizedSymbol = normalizeStockSymbolInput(stockForm.symbol);
    if (normalizedSymbol === null) {
      setHoldingMessage('股票代码必须能识别为 6 位 A 股代码。');
      return;
    }

    setIsSavingHolding(true);
    setHoldingMessage('正在保存持仓，并重新生成组合建议。');
    try {
      await postApi<unknown>('/portfolio/holdings/stocks', {
        symbol: normalizedSymbol,
        name: stockForm.name.trim(),
        quantity: Number(stockForm.quantity),
        costPrice: Number(stockForm.costPrice),
        latestPrice: stockForm.latestPrice.trim().length === 0 ? null : Number(stockForm.latestPrice),
        buyDate: stockForm.buyDate.trim().length === 0 ? undefined : stockForm.buyDate.trim(),
        holdingStage: stockForm.holdingStage,
        theme: stockForm.theme.trim(),
        themeTags: stockForm.theme.split(/[\/,，、]+/).map((item) => item.trim()).filter(Boolean),
        thesis: stockForm.thesis.trim().length === 0 ? undefined : stockForm.thesis.trim(),
        actionBias: stockForm.actionBias,
      });
      await props.onRefresh();
      setHoldingMessage(`${stockForm.name || stockForm.symbol} 已保存，今日组合建议已刷新。`);
    } catch (error) {
      const message = error instanceof Error ? error.message : '保存失败';
      setHoldingMessage(`持仓保存失败：${message}`);
    } finally {
      setIsSavingHolding(false);
    }
  }

  async function lookupTradingStockQuote(): Promise<void> {
    const symbol = normalizeStockSymbolInput(stockForm.symbol);
    if (symbol === null) {
      setHoldingMessage('先输入股票代码，例如 300750、300750.SZ 或 sz300750。');
      return;
    }
    setIsLookingUpQuote(true);
    setHoldingMessage(`正在通过真实行情源查询 ${symbol}。`);
    try {
      const quotes = await lookupPortfolioQuotes([symbol]);
      const quote = quotes[0];
      if (quote === undefined) {
        setHoldingMessage(`没有查到 ${symbol} 的实时行情，请确认代码是否正确。`);
        return;
      }
      setStockForm({
        ...stockForm,
        symbol: quote.symbol,
        name: quote.name,
        latestPrice: String(Number(quote.latestPrice)),
        theme: stockForm.theme.trim().length === 0 ? quote.suggestedTheme : stockForm.theme,
      });
      setLastStockQuote(quote);
      setHoldingMessage(`${quote.name} 行情已回填：现价 ${Number(quote.latestPrice)}，今日涨跌 ${quote.dailyPctChange}%，主题建议 ${quote.suggestedTheme}。`);
    } catch (error) {
      const message = error instanceof Error ? error.message : '查询失败';
      setHoldingMessage(`行情查询失败：${message}`);
    } finally {
      setIsLookingUpQuote(false);
    }
  }

  async function saveTradingFundHolding(): Promise<void> {
    const validationMessage = validateTradingFundForm(fundForm);
    if (validationMessage !== null) {
      setHoldingMessage(validationMessage);
      return;
    }

    setIsSavingHolding(true);
    setHoldingMessage('正在保存基金暴露，并重新生成组合建议。');
    try {
      await postApi<unknown>('/portfolio/holdings/funds', {
        fundCode: fundForm.fundCode.trim().length === 0 ? undefined : fundForm.fundCode.trim(),
        name: fundForm.name.trim(),
        theme: fundForm.theme.trim(),
        amount: Number(fundForm.amount),
        weightPercent: fundForm.weightPercent.trim().length === 0 ? undefined : Number(fundForm.weightPercent),
        actionBias: fundForm.actionBias,
      });
      await props.onRefresh();
      setHoldingMessage(`${fundForm.name || '基金暴露'} 已保存，组合权重和建议已刷新。`);
    } catch (error) {
      const message = error instanceof Error ? error.message : '保存失败';
      setHoldingMessage(`基金保存失败：${message}`);
    } finally {
      setIsSavingHolding(false);
    }
  }

  async function lookupTradingFundQuote(): Promise<void> {
    const fundCode = fundForm.fundCode.trim();
    if (!/^[0-9]{6}$/.test(fundCode)) {
      setHoldingMessage('先输入 6 位基金代码，例如 161725。');
      return;
    }
    setIsLookingUpFundQuote(true);
    setHoldingMessage(`正在查询基金 ${fundCode} 的净值。`);
    try {
      const quotes = await lookupPortfolioFundQuotes([fundCode]);
      const quote = quotes[0];
      if (quote === undefined) {
        setHoldingMessage(`没有查到 ${fundCode} 的基金净值，请确认代码是否正确。`);
        return;
      }
      setFundForm({
        ...fundForm,
        fundCode: quote.fundCode,
        name: quote.name,
        theme: fundForm.theme.trim().length === 0 ? inferFundTheme(quote.name) : fundForm.theme,
      });
      setLastFundQuote(quote);
      setHoldingMessage(`${quote.name} 已回填：${quote.netValueDate} 单位净值 ${quote.unitNetValue}${quote.estimatedPctChange === null ? '' : `，估算涨跌 ${quote.estimatedPctChange}%`}。`);
    } catch (error) {
      const message = error instanceof Error ? error.message : '查询失败';
      setHoldingMessage(`基金净值查询失败：${message}`);
    } finally {
      setIsLookingUpFundQuote(false);
    }
  }

  async function generateRealtimeAdvice(): Promise<void> {
    const now = Date.now();
    if (lastRealtimeAdviceAt !== null && now - lastRealtimeAdviceAt < 10_000) {
      const remainingSeconds = Math.ceil((10_000 - (now - lastRealtimeAdviceAt)) / 1000);
      setRealtimeAdviceMessage(`刚刚已经生成过一次，${remainingSeconds} 秒后可以再次刷新，避免行情接口被频繁请求。`);
      setCooldownTick(now);
      return;
    }

    setIsGeneratingRealtimeAdvice(true);
    setRealtimeAdviceMessage('正在拉取最新行情、基金代理温度和你的真实持仓，生成实时建议。');
    try {
      await props.onRefresh();
      const refreshedAt = Date.now();
      setLastRealtimeAdviceAt(refreshedAt);
      setCooldownTick(refreshedAt);
      setRealtimeAdviceMessage('实时建议已生成：先看今日行动清单、风险队列和逐只持仓判断。');
    } catch (error) {
      const message = error instanceof Error ? error.message : '生成失败';
      setRealtimeAdviceMessage(`实时建议生成失败：${message}`);
    } finally {
      setIsGeneratingRealtimeAdvice(false);
    }
  }

  function saveCurrentDecisionSnapshot(): void {
    window.localStorage.setItem(decisionSnapshotStorageKey, JSON.stringify(currentSnapshot));
    setPreviousSnapshot(currentSnapshot);
  }

  React.useEffect(() => {
    if (lastRealtimeAdviceAt === null) {
      return undefined;
    }
    const timer = window.setInterval(() => setCooldownTick(Date.now()), 500);
    return () => window.clearInterval(timer);
  }, [lastRealtimeAdviceAt]);

  return (
    <div className="view-stack trading-view">
      <section className="hero-card trading-hero">
        <div>
          <div className="eyebrow"><Radar size={14} /> {dataStatus.status === 'live' ? '实时行情已接入' : '保守观察模式'} · {context.source === 'database' ? '数据库组合' : '本地持仓兜底'}</div>
          <h2>今日组合决策</h2>
          <p>{decision.summary.primaryAction}</p>
          <div className="decision-status-strip">
            <span className={`status-chip ${dataStatus.status}`}>{dataStatus.status === 'live' ? '行情可信' : '行情未更新'}</span>
            <span className="status-chip coverage">覆盖 {dataStatus.quoteCoverage.updated}/{dataStatus.quoteCoverage.total}</span>
            <span>{dataStatus.label}</span>
            <small>更新时间 {formatDateTime(dataStatus.updatedAt)}</small>
          </div>
          {dataStatus.stalePositionNames.length > 0 && (
            <div className="stale-position-strip">
              <span>未更新</span>
              <strong>{dataStatus.stalePositionNames.join(' / ')}</strong>
            </div>
          )}
          <div className="hero-actions realtime-advice-actions">
            <button className="primary-action realtime-advice-button" disabled={realtimeAdviceDisabled} onClick={() => void generateRealtimeAdvice()} type="button">
              <Zap size={16} />
              {isGeneratingRealtimeAdvice ? '生成中' : realtimeAdviceCooldownSeconds > 0 ? `${realtimeAdviceCooldownSeconds} 秒后可再生成` : '实时生成精准建议'}
            </button>
          </div>
          <div className="realtime-advice-note">
            <strong>{realtimeAdviceMessage}</strong>
            <span>依据：当前持仓、最新股票/ETF行情、基金主题代理温度、风险队列和触发线。</span>
          </div>
        </div>
        <div className="decision-score">
          <span>今日状态</span>
          <strong>{decision.marketRegime.label}</strong>
          <small>风险 {riskLevelLabel(decision.summary.riskLevel)} · 数据源 {dataStatus.sources.join(' / ') || '持仓成本兜底'}</small>
        </div>
      </section>

      <article className="glass-card daily-action-command">
        <CardHeader icon={<ListChecks />} title="今日行动清单" subtitle="按优先级执行，不需要自己从各模块里总结" />
        <div className="system-action-summary">
          <div className={attentionDecisions.length > 0 ? 'attention' : 'clear'}>
            <span>需要处理</span>
            <strong>{attentionDecisions.length} 只</strong>
            <small>{attentionDecisions.length === 0 ? '今天没有触发买卖动作' : attentionDecisions.slice(0, 4).map((item) => `${item.name}：${item.systemAction.label}`).join(' / ')}</small>
          </div>
          <div>
            <span>紧急</span>
            <strong>{urgentDecisions.length} 只</strong>
            <small>{urgentDecisions.map((item) => item.name).join(' / ') || '暂无减仓复核'}</small>
          </div>
          <div>
            <span>重要</span>
            <strong>{importantDecisions.length} 只</strong>
            <small>{importantDecisions.map((item) => item.name).join(' / ') || '暂无禁止加仓/止盈观察'}</small>
          </div>
          <div>
            <span>可观察</span>
            <strong>{watchActionDecisions.length} 只</strong>
            <small>{watchActionDecisions.map((item) => item.name).join(' / ') || '暂无小额分批候选'}</small>
          </div>
          <div className="clear">
            <span>无需操作</span>
            <strong>{noActionDecisions.length} 只</strong>
            <small>{noActionDecisions.slice(0, 4).map((item) => item.name).join(' / ') || '暂无'}</small>
          </div>
        </div>
        <div className="daily-action-list">
          {(decision.dailyActions ?? []).map((action) => (
            <div className={action.tone} key={`${action.priority}-${action.title}`}>
              <span>{action.priority}</span>
              <section>
                <strong>{action.phase} · {action.title}</strong>
                <p>{action.detail}</p>
                <small>{action.evidence}</small>
              </section>
            </div>
          ))}
        </div>
      </article>

      <article className="glass-card investor-profile-card trading-secondary-block">
        <CardHeader icon={<BrainCircuit />} title="长期投资画像" subtitle="后端策略会按这个画像解释持仓，不按短线噪音乱给动作" />
        <div className="investor-profile-grid">
          <div>
            <span>投资周期</span>
            <strong>{decision.investorProfile.horizon}</strong>
          </div>
          <div>
            <span>策略风格</span>
            <strong>{decision.investorProfile.style}</strong>
          </div>
          <div>
            <span>核心观点</span>
            <strong>{decision.investorProfile.coreView}</strong>
          </div>
        </div>
        <div className="investor-principles">
          {decision.investorProfile.principles.map((item) => <p key={item}><span className="pulse live" />{item}</p>)}
        </div>
        <div className="investor-question-list">
          {decision.questionsForInvestor.map((item) => (
            <div key={item.id}>
              <strong>{item.question}</strong>
              <span>{item.reason}</span>
            </div>
          ))}
        </div>
      </article>

      <section className="dual-advice-grid trading-secondary-block">
        <AdvicePanel
          icon={<Sparkles />}
          items={decision.preferenceAdvice}
          subtitle="按你的长线偏好、机器人方向、仓位约束生成"
          title="投资偏好建议"
        />
        <AdvicePanel
          icon={<LineChart />}
          items={decision.quantAdvice}
          subtitle="只看价格、涨跌、风控线和强弱信号"
          title="量化交易建议"
        />
      </section>

      <section className="daily-decision-grid trading-secondary-block">
        <article className="glass-card daily-action-card">
          <CardHeader icon={<ListChecks />} title="今天先看" subtitle="从这里开始，不用猜页面顺序" />
          {decision.intradayPlan.doNow.slice(0, 2).map((item) => <p key={item}><span className="pulse live" />{item}</p>)}
        </article>
        <article className="glass-card daily-action-card">
          <CardHeader icon={<ShieldCheck />} title="风险队列" subtitle="优先复盘这些名称" />
          {bucketItems.riskControl.length > 0 ? bucketItems.riskControl.map((item) => <p key={item}><span className="pulse warning" />{item}</p>) : <p><span className="pulse live" />暂无必须优先风控的持仓</p>}
        </article>
        <article className="glass-card daily-action-card">
          <CardHeader icon={<TrendingUp />} title="强势观察" subtitle="只看确认，不追涨" />
          {bucketItems.addOnStrength.length > 0 ? bucketItems.addOnStrength.map((item) => <p key={item}><span className="pulse live" />{item}</p>) : <p><span className="pulse" />暂无强势确认队列</p>}
        </article>
      </section>

      <article className="glass-card decision-history-card trading-secondary-block">
        <CardHeader icon={<GitBranch />} title="和上次建议相比" subtitle={previousSnapshot === null ? '还没有保存过建议快照' : `上次保存 ${formatDateTime(previousSnapshot.savedAt)}`} />
        <div className="decision-history-grid">
          {snapshotComparison.map((item) => (
            <div className={item.tone} key={item.title}>
              <span>{item.title}</span>
              <strong>{item.summary}</strong>
            </div>
          ))}
        </div>
        <div className="snapshot-save-row">
          <button className="secondary-action" onClick={saveCurrentDecisionSnapshot} type="button"><ListChecks size={15} /> 保存今日建议快照</button>
          <span>保存后，下次打开会自动对比风险队列、强势观察和主建议变化。</span>
        </div>
      </article>

      <section className="metric-grid">
        <MetricCard icon={<CandlestickChart />} label="股票成本" value={props.showAmounts ? formatMoney(decision.summary.totalCostValue) : '已隐藏'} helper={`已知组合 ${props.showAmounts ? formatMoney(context.summary.knownPortfolioValue) : '仅显示比例'}`} tone="violet" />
        <MetricCard icon={<TrendingUp />} label="当前市值" value={props.showAmounts ? formatMoney(decision.summary.totalMarketValue) : '已隐藏'} helper={`浮盈亏 ${props.showAmounts ? formatMoney(decision.summary.totalUnrealizedPnl) : '金额隐藏'}`} tone="green" />
        <MetricCard icon={<Waves />} label="基金权重" value={formatPercent(Number(context.summary.fundWeightPercent))} helper={`股票 ${formatPercent(Number(context.summary.stockWeightPercent))}`} tone="cyan" />
        <MetricCard icon={<ShieldCheck />} label="高风险项" value={`${highRisk.length} 个`} helper={highRisk.map((item) => item.name).join(' / ') || '暂无高风险标记'} tone="amber" />
      </section>

      <article className="glass-card quote-health-card trading-secondary-block">
        <CardHeader icon={<Activity />} title="真实行情体检" subtitle="判断页面建议到底有多可信" />
        <div className="quote-health-layout">
          <div className={`quote-health-main ${quoteHealth.tone}`}>
            <span>{quoteHealth.label}</span>
            <strong>{dataStatus.quoteCoverage.updated}/{dataStatus.quoteCoverage.total}</strong>
            <em>{quoteHealth.detail}</em>
          </div>
          <div className="quote-health-list">
            <div>
              <span>数据源</span>
              <strong>{dataStatus.sources.join(' / ') || '持仓成本兜底'}</strong>
            </div>
            <div>
              <span>已更新</span>
              <strong>{liveQuoteNames.slice(0, 4).join(' / ') || '暂无'}</strong>
            </div>
            <div>
              <span>待复核</span>
              <strong>{staleQuoteNames.slice(0, 4).join(' / ') || '全部已覆盖'}</strong>
            </div>
          </div>
        </div>
      </article>

      <article className="glass-card theme-radar-card trading-secondary-block">
        <CardHeader icon={<Waves />} title="组合主题雷达" subtitle="股票和基金合并看主线集中度，先控拥挤再谈加仓" />
        <div className="theme-radar-list">
          {topThemeRadar.map((theme) => (
            <div className={`theme-radar-row ${theme.riskLevel}`} key={theme.theme}>
              <div className="theme-radar-title">
                <strong>{theme.theme}</strong>
                <span>{theme.sourceCount} 个来源 · {theme.heatLabel}</span>
              </div>
              <div className="theme-radar-bar">
                <i style={{ width: `${Math.min(Math.max(Number(theme.weightPercent), 4), 100)}%` }} />
              </div>
              <div className="theme-radar-meta">
                <strong>{formatPercent(Number(theme.weightPercent))}</strong>
                <span>{theme.heatPctChange === null ? '热度待更新' : `${Number(theme.heatPctChange) >= 0 ? '+' : ''}${theme.heatPctChange}%`}</span>
                <em>{theme.actionLabel}</em>
              </div>
              <p>{theme.reason}</p>
              <small>{theme.members.slice(0, 5).join(' / ')}</small>
            </div>
          ))}
        </div>
      </article>

      <article className="glass-card quick-holding-editor trading-secondary-block">
        <CardHeader icon={<Boxes />} title="快速维护真实持仓" subtitle="股票和基金变了先在这里改，建议才可信" />
        <div className="quick-editor-grid">
          <div>
            <strong>股票 / ETF</strong>
            <div className="quick-holding-form">
              <select onChange={(event) => fillStockForm(event.target.value)} value={stockForm.symbol}>
                <option value="">选择已有持仓</option>
                {positions.map((position) => <option key={position.symbol} value={position.symbol}>{position.name} · {position.symbol}</option>)}
              </select>
              <input
                onBlur={() => {
                  if (normalizeStockSymbolInput(stockForm.symbol) !== null && stockForm.name.trim().length === 0) {
                    void lookupTradingStockQuote();
                  }
                }}
                onChange={(event) => setStockForm({ ...stockForm, symbol: event.target.value })}
                placeholder="代码，如 300750 或 300750.SZ"
                value={stockForm.symbol}
              />
              <input onChange={(event) => setStockForm({ ...stockForm, name: event.target.value })} placeholder="名称" value={stockForm.name} />
              <button className="secondary-action" disabled={isLookingUpQuote || normalizeStockSymbolInput(stockForm.symbol) === null} onClick={() => void lookupTradingStockQuote()} type="button"><Search size={15} /> {isLookingUpQuote ? '查询中' : '查真实行情'}</button>
              <input onChange={(event) => setStockForm({ ...stockForm, quantity: event.target.value })} placeholder="数量" type="number" value={stockForm.quantity} />
              <input onChange={(event) => setStockForm({ ...stockForm, costPrice: event.target.value })} placeholder="成本价" type="number" value={stockForm.costPrice} />
              <input onChange={(event) => setStockForm({ ...stockForm, latestPrice: event.target.value })} placeholder="最新价，可空" type="number" value={stockForm.latestPrice} />
              <input onChange={(event) => setStockForm({ ...stockForm, buyDate: event.target.value })} type="date" value={stockForm.buyDate} />
              <select onChange={(event) => setStockForm({ ...stockForm, holdingStage: event.target.value })} value={stockForm.holdingStage}>
                <option value="new">新买入</option>
                <option value="holding">持有中</option>
                <option value="long_term_core">长期核心</option>
              </select>
              <select onChange={(event) => setStockForm({ ...stockForm, actionBias: event.target.value })} value={stockForm.actionBias}>
                <option value="watch">观察</option>
                <option value="hold">持有</option>
                <option value="build">分批建仓</option>
                <option value="add">加仓</option>
                <option value="take_profit">止盈</option>
                <option value="risk_control">风控</option>
              </select>
              <input className="wide-field" onChange={(event) => setStockForm({ ...stockForm, theme: event.target.value })} placeholder="主题，如 机器人 / 物理AI" value={stockForm.theme} />
              <input className="wide-field" onChange={(event) => setStockForm({ ...stockForm, thesis: event.target.value })} placeholder="持仓逻辑，可空" value={stockForm.thesis} />
              <button className="primary-action" disabled={isSavingHolding || stockFormInvalid} onClick={() => void saveTradingStockHolding()} type="button"><RefreshCcw size={15} /> {isSavingHolding ? '保存中' : '保存股票'}</button>
            </div>
            {(lastStockQuote !== null || existingStockDraft !== undefined) && (
              <div className="quote-draft-card">
                <div>
                  <span>{existingStockDraft === undefined ? '新标的' : '已有持仓'}</span>
                  <strong>{lastStockQuote?.name ?? existingStockDraft?.name} · {lastStockQuote?.symbol ?? existingStockDraft?.symbol}</strong>
                  <small>数据源 {lastStockQuote?.quoteSource ?? existingStockDraft?.quoteSource ?? '持仓记录'} · {lastStockQuote?.market ?? 'A 股'}</small>
                </div>
                <div className="quote-draft-metrics">
                  <span>现价 <strong>{lastStockQuote?.latestPrice ?? existingStockDraft?.latestPrice ?? '待查询'}</strong></span>
                  <span>涨跌 <strong className={Number(lastStockQuote?.dailyPctChange ?? existingStockDraft?.dailyPctChange ?? 0) >= 0 ? 'quote-up' : 'quote-down'}>{lastStockQuote?.dailyPctChange ?? existingStockDraft?.dailyPctChange ?? '--'}%</strong></span>
                  <span>主题 <strong>{lastStockQuote?.suggestedTheme ?? existingStockDraft?.themeTags.join(' / ') ?? '待补充'}</strong></span>
                </div>
                <div className="quote-draft-actions">
                  <button
                    className="secondary-action"
                    disabled={lastStockQuote === null}
                    onClick={() => {
                      if (lastStockQuote === null) {
                        return;
                      }
                      setStockForm({
                        ...stockForm,
                        symbol: lastStockQuote.symbol,
                        name: lastStockQuote.name,
                        costPrice: stockForm.costPrice.trim().length === 0 ? String(Number(lastStockQuote.latestPrice)) : stockForm.costPrice,
                        latestPrice: String(Number(lastStockQuote.latestPrice)),
                        theme: stockForm.theme.trim().length === 0 ? lastStockQuote.suggestedTheme : stockForm.theme,
                      });
                    }}
                    type="button"
                  >
                    <RefreshCcw size={15} /> 用行情填表
                  </button>
                  <small>{stockForm.quantity.trim().length === 0 ? '保存前还需要填写数量。' : '数量已填写，可以保存或继续补充逻辑。'}</small>
                </div>
              </div>
            )}
          </div>
          <div>
            <strong>场外基金 / 主题暴露</strong>
            <div className="quick-fund-form">
              <select onChange={(event) => fillFundForm(event.target.value)} value={fundForm.name}>
                <option value="">选择已有基金</option>
                {fundExposures.map((fund) => <option key={`${fund.name}-${fund.theme}`} value={fund.name}>{fund.name} · {fund.theme}</option>)}
              </select>
              <input
                onBlur={() => {
                  if (/^[0-9]{6}$/.test(fundForm.fundCode.trim()) && fundForm.name.trim().length === 0) {
                    void lookupTradingFundQuote();
                  }
                }}
                onChange={(event) => setFundForm({ ...fundForm, fundCode: event.target.value })}
                placeholder="基金代码"
                value={fundForm.fundCode}
              />
              <button className="secondary-action" disabled={isLookingUpFundQuote || !/^[0-9]{6}$/.test(fundForm.fundCode.trim())} onClick={() => void lookupTradingFundQuote()} type="button"><Search size={15} /> {isLookingUpFundQuote ? '查询中' : '查基金净值'}</button>
              <input onChange={(event) => setFundForm({ ...fundForm, name: event.target.value })} placeholder="基金名称" value={fundForm.name} />
              <input onChange={(event) => setFundForm({ ...fundForm, theme: event.target.value })} placeholder="主题" value={fundForm.theme} />
              <input onChange={(event) => setFundForm({ ...fundForm, amount: event.target.value })} placeholder="金额" type="number" value={fundForm.amount} />
              <input onChange={(event) => setFundForm({ ...fundForm, weightPercent: event.target.value })} placeholder="权重%，可空" type="number" value={fundForm.weightPercent} />
              <select onChange={(event) => setFundForm({ ...fundForm, actionBias: event.target.value })} value={fundForm.actionBias}>
                <option value="watch">观察</option>
                <option value="hold">持有</option>
                <option value="build">分批建仓</option>
                <option value="add">加仓</option>
                <option value="take_profit">止盈</option>
                <option value="risk_control">风控</option>
              </select>
              <button className="primary-action" disabled={isSavingHolding || fundFormInvalid} onClick={() => void saveTradingFundHolding()} type="button"><RefreshCcw size={15} /> {isSavingHolding ? '保存中' : '保存基金'}</button>
            </div>
            {lastFundQuote !== null && (
              <div className="quote-draft-card">
                <div>
                  <span>基金净值</span>
                  <strong>{lastFundQuote.name} · {lastFundQuote.fundCode}</strong>
                  <small>数据源 {lastFundQuote.quoteSource} · 净值日 {lastFundQuote.netValueDate}</small>
                </div>
                <div className="quote-draft-metrics">
                  <span>单位净值 <strong>{lastFundQuote.unitNetValue}</strong></span>
                  <span>估算净值 <strong>{lastFundQuote.estimatedNetValue ?? '无估算'}</strong></span>
                  <span>估算涨跌 <strong className={Number(lastFundQuote.estimatedPctChange ?? 0) >= 0 ? 'quote-up' : 'quote-down'}>{lastFundQuote.estimatedPctChange ?? '--'}%</strong></span>
                </div>
                <div className="quote-draft-actions">
                  <small>{lastFundQuote.estimatedAt === null ? '场外基金净值通常收盘后更新。' : `估算时间 ${lastFundQuote.estimatedAt}，最终以正式净值为准。`}</small>
                </div>
              </div>
            )}
          </div>
        </div>
        <p className="muted-copy">{holdingMessage}</p>
      </article>

      <section className="trading-command-grid trading-secondary-block">
        <article className="glass-card decision-board">
          <CardHeader icon={<ListChecks />} title="动作队列" subtitle="先看队列，不直接下单" />
          <div className="decision-buckets">
            <DecisionBucket title="持有" items={bucketItems.hold} emptyText={decision.actionBuckets.hold.join(' / ') || '暂无'} />
            <DecisionBucket title="观察" items={bucketItems.watch} emptyText={decision.actionBuckets.watch.join(' / ') || '暂无'} />
            <DecisionBucket title="强势分批" items={bucketItems.addOnStrength} emptyText={decision.actionBuckets.addOnStrength.join(' / ') || '暂无'} />
            <DecisionBucket title="风控" items={bucketItems.riskControl} emptyText={decision.actionBuckets.riskControl.join(' / ') || '暂无'} />
          </div>
        </article>
        <article className="glass-card decision-board">
          <CardHeader icon={<Activity />} title="市场温度" subtitle="指数和核心主题的实时背景" />
          <div className="market-snapshot-list">
            {marketSnapshots.length > 0
              ? marketSnapshots.slice(0, 7).map((snapshot) => (
                <div className={Number(snapshot.dailyPctChange) >= 0 ? 'up' : 'down'} key={snapshot.code}>
                  <span>{snapshot.name}</span>
                  <strong>{snapshot.latestPrice}</strong>
                  <em>{Number(snapshot.dailyPctChange) >= 0 ? '+' : ''}{snapshot.dailyPctChange}%</em>
                </div>
              ))
              : <p className="empty-market-note">市场快照未更新，先按持仓成本和个股状态做保守复盘。</p>}
          </div>
        </article>
      </section>

      <section className="trading-command-grid compact trading-secondary-block">
        <article className="glass-card decision-board">
          <CardHeader icon={<Layers3 />} title="基金主题 Top5" subtitle="按权重看集中度" />
          <div className="decision-funds">
            {topFunds.map((fund) => (
              <div key={`${fund.name}-${fund.theme}`}>
                <span>{fund.name}</span>
                <strong>{fund.theme}</strong>
                <em>{fund.weightPercent === null ? '权重待算' : formatPercent(Number(fund.weightPercent))}</em>
              </div>
            ))}
          </div>
        </article>
        <article className="glass-card decision-board">
          <CardHeader icon={<GitBranch />} title="基金代理温度" subtitle="场外基金用主题 ETF/指数做代理行情，不伪装成净值" />
          <div className="fund-signal-list">
            {topFundSignals.map((signal) => (
              <div className={fundSignalTone(signal)} key={`${signal.fundName}-${signal.proxyCode}`}>
                <span>
                  <strong>{signal.fundName}</strong>
                  <small>{signal.theme}</small>
                </span>
                <em>{signal.proxyName} {signal.proxyPctChange === null ? '待更新' : `${Number(signal.proxyPctChange) >= 0 ? '+' : ''}${signal.proxyPctChange}%`}</em>
                <b>{signal.actionLabel}</b>
                <p>{signal.reason}</p>
              </div>
            ))}
          </div>
        </article>
      </section>

      <article className="glass-card decision-board trading-secondary-block">
        <CardHeader icon={<GitBranch />} title="下一步触发器" subtitle="用这些规则复核建议" />
        <div className="trigger-rule-list">
          {decision.nextTriggers.slice(0, 4).map((item) => <p key={item}><span className="pulse warning" />{item}</p>)}
        </div>
      </article>

      <section className="trading-plan-grid trading-secondary-block">
        {actionRows.map((row) => (
          <article className={`glass-card plan-card ${row.tone}`} key={row.title}>
            <CardHeader icon={<ShieldCheck />} title={row.title} subtitle="盘中复盘用" />
            {row.items.map((item) => <p key={item}><span className="pulse live" />{item}</p>)}
          </article>
        ))}
      </section>

      <article className="glass-card holding-decision-section">
        <CardHeader icon={<Table2 />} title="逐只持仓怎么判断" subtitle="名称、主题、价格位置、理由和触发线放在一起看" />
        <div className="holding-diagnosis-overview">
          <div>
            <span>诊断覆盖</span>
            <strong>{liveQuoteNames.length}/{positions.length}</strong>
            <small>{liveQuoteNames.length === positions.length ? '全部持仓已接入真实行情' : '未覆盖标的会降低建议置信度'}</small>
          </div>
          <div className={attentionDecisions.length > 0 ? 'attention' : 'clear'}>
            <span>需要动作</span>
            <strong>{attentionDecisions.length} 只</strong>
            <small>{attentionDecisions.map((item) => item.name).slice(0, 4).join(' / ') || '暂无买卖动作'}</small>
          </div>
          <div>
            <span>趋势偏弱</span>
            <strong>{(decision.quantSignals ?? []).filter((signal) => signal.trend === 'downtrend' || signal.action === 'avoid_add' || signal.action === 'risk_reduce').length} 只</strong>
            <small>{(decision.quantSignals ?? []).filter((signal) => signal.trend === 'downtrend' || signal.action === 'avoid_add' || signal.action === 'risk_reduce').map((signal) => signal.name).slice(0, 4).join(' / ') || '暂无明显弱势信号'}</small>
          </div>
          <div>
            <span>长期核心</span>
            <strong>{decisions.filter((item) => item.holdingStage === 'long_term_core').length} 只</strong>
            <small>{decisions.filter((item) => item.holdingStage === 'long_term_core').map((item) => item.name).join(' / ') || '还未标记核心仓'}</small>
          </div>
        </div>
        <div className="holding-decision-grid">
          {decisions.map((item) => {
            const signal = quantSignalBySymbol.get(item.symbol);
            const position = positionBySymbol.get(item.symbol);
            return (
            <div className={`holding-decision-card ${item.action} system-${item.systemAction.severity}${item.systemAction.needsAttention ? ' needs-attention' : ''}`} key={item.symbol}>
              <div className="holding-decision-head">
                <span className="decision-target">
                  <strong>{item.name}</strong>
                  <small>{item.symbol} · {getDecisionTheme(item, themeTagsBySymbol)}</small>
                </span>
                <span className={`decision-pill system-${item.systemAction.severity}`}>{item.systemAction.label}</span>
              </div>
              <div className={`system-action-row system-${item.systemAction.severity}`}>
                <span>{item.systemAction.needsAttention ? '需要处理' : '无需操作'}</span>
                <strong>{item.systemAction.instruction}</strong>
              </div>
              <div className="holding-source-row">
                <span className={hasLivePositionQuote(position) ? 'live' : 'fallback'}>
                  {hasLivePositionQuote(position) ? '真实行情' : '成本兜底'}
                </span>
                <strong>{position?.quoteSource ?? '未更新行情'}</strong>
                <span>{holdingStageLabel(item.holdingStage)}</span>
                <strong>{item.buyDate === null || item.buyDate === undefined ? '买入日期未填' : `买入 ${item.buyDate}`}</strong>
              </div>
              <div className="holding-price-grid">
                <div><span>现价</span><strong>{props.showAmounts ? item.latestPrice ?? '待更新' : '已隐藏'}</strong></div>
                <div><span>成本</span><strong>{props.showAmounts ? item.costPrice : '已隐藏'}</strong></div>
                <div><span>浮盈亏</span><strong className={Number(item.unrealizedPnlPercent ?? 0) >= 0 ? 'quote-up' : 'quote-down'}>{props.showAmounts ? `${item.unrealizedPnlPercent ?? '0.00'}%` : '比例隐藏'}</strong></div>
                <div><span>今日涨跌</span><strong className={Number(item.dailyPctChange ?? 0) >= 0 ? 'quote-up' : 'quote-down'}>{item.dailyPctChange === null ? '待更新' : `${item.dailyPctChange}%`}</strong></div>
              </div>
              <div className="holding-diagnosis-strip">
                <span>{pricePositionLabel(item, props.showAmounts)}</span>
                <span>{trendLabel(signal)}</span>
                <span>{riskDistanceLabel(item, props.showAmounts)}</span>
                <span>置信度 {signal?.confidence ?? (hasLivePositionQuote(position) ? '中' : '低')}</span>
              </div>
              <div className="trigger-line-grid">
                <span>风控线 {props.showAmounts ? item.pricePlan.stopLossPrice ?? '--' : '已隐藏'}</span>
                <span>回踩观察 {props.showAmounts ? item.pricePlan.addWatchPrice ?? '--' : '已隐藏'}</span>
                <span>强势确认 {props.showAmounts ? item.pricePlan.strengthConfirmPrice ?? '--' : '已隐藏'}</span>
              </div>
              <div className="decision-next-step">
                <strong>{decisionNextStepTitle(item)}</strong>
                <span>{decisionNextStepDetail(item)}</span>
              </div>
              <div className="holding-reason-list">
                {item.reasons.slice(1, 3).map((reason) => <p key={reason}>{reason}</p>)}
                {item.triggers.slice(0, 2).map((trigger) => <p key={trigger}>{trigger}</p>)}
              </div>
              <details className="holding-diagnosis-detail">
                <summary>展开诊断详情</summary>
                <div className="holding-diagnosis-body">
                  <section>
                    <span>诊断结论</span>
                    <strong>{holdingDiagnosisSummary(item, signal, props.showAmounts)}</strong>
                  </section>
                  <section>
                    <span>量化证据</span>
                    <strong>{signal?.evidence ?? '暂未拿到历史日线，当前只按真实行情或成本口径判断。'}</strong>
                  </section>
                  <section>
                    <span>触发检查</span>
                    <strong>{item.triggers.length === 0 ? '暂无额外触发条件。' : item.triggers.slice(0, 3).join(' / ')}</strong>
                  </section>
                  <section>
                    <span>持仓逻辑</span>
                    <strong>{holdingLogicText(item)}</strong>
                  </section>
                </div>
              </details>
            </div>
            );
          })}
        </div>
      </article>

      <article className="glass-card risk-console trading-secondary-block">
        <CardHeader icon={<ShieldCheck />} title="使用边界" subtitle="系统只做投研辅助" />
        {decision.disclaimers.map((item) => <div className="guard-row" key={item}><span className="pulse live" />{item}<strong>确认</strong></div>)}
        {decision.nextTriggers.map((item) => <div className="guard-row" key={item}><span className="pulse warning" />{item}<strong>触发器</strong></div>)}
      </article>
    </div>
  );
}

function DecisionBucket(props: { readonly title: string; readonly items: readonly string[]; readonly emptyText: string }): React.ReactElement {
  return (
    <div>
      <span>{props.title}</span>
      {props.items.length === 0
        ? <strong>{props.emptyText}</strong>
        : (
          <ul>
            {props.items.slice(0, 5).map((item) => <li key={item}>{item}</li>)}
          </ul>
        )}
    </div>
  );
}

function PreferencesView(props: { readonly data: PortfolioData; readonly onRefresh: () => Promise<void> }): React.ReactElement {
  const decision = props.data.tradingDecision;
  const [form, setForm] = React.useState(() => investorPreferenceToForm(decision.investorPreference));
  const [isSaving, setIsSaving] = React.useState(false);
  const [message, setMessage] = React.useState('保存后，投资偏好建议会按这份配置重新生成。');
  const preferenceReview = buildAdviceReview(decision.preferenceAdvice, decision.decisions, 'preference');
  const quantReview = buildAdviceReview(decision.quantAdvice, decision.decisions, 'quant');

  React.useEffect(() => {
    setForm(investorPreferenceToForm(decision.investorPreference));
  }, [decision.generatedAt, decision.investorPreference]);

  async function save(): Promise<void> {
    setIsSaving(true);
    setMessage('正在保存投资偏好配置。');
    try {
      await postApi<InvestorPreference>('/portfolio/investor-preference', investorPreferenceFromForm(form));
      await props.onRefresh();
      setMessage('投资偏好已保存，组合建议和复盘已刷新。');
    } catch (error) {
      const text = error instanceof Error ? error.message : '保存失败';
      setMessage(`投资偏好保存失败：${text}`);
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="view-stack preferences-view">
      <section className="hero-card preferences-hero">
        <div>
          <div className="eyebrow"><BrainCircuit size={14} /> 长线画像配置</div>
          <h2>个人偏好</h2>
          <p>这里决定“投资偏好建议”的判断口径；量化交易建议仍然只看行情信号，不读取这些主观偏好。</p>
        </div>
        <div className="decision-score">
          <span>机器人上限</span>
          <strong>{decision.investorPreference.roboticsMaxWeightPercent}%</strong>
          <small>单股回撤 {decision.investorPreference.singleStockMaxDrawdownPercent}% · 组合回撤 {decision.investorPreference.portfolioMaxDrawdownPercent}%</small>
        </div>
      </section>

      <article className="glass-card preference-editor-card">
        <CardHeader icon={<BrainCircuit />} title="投资偏好配置" subtitle="这些配置会影响投资偏好建议，不影响量化信号本身" />
        <div className="preference-form-grid">
          <LabeledField label="投资周期" helper="例如：1-3 年长线持有">
            <input onChange={(event) => setForm({ ...form, horizon: event.target.value })} value={form.horizon} />
          </LabeledField>
          <LabeledField label="核心观点" helper="你长期相信的主线">
            <input onChange={(event) => setForm({ ...form, coreView: event.target.value })} value={form.coreView} />
          </LabeledField>
          <LabeledField label="机器人方向最高仓位" helper="超过后系统会提醒控制集中度">
            <input onChange={(event) => setForm({ ...form, roboticsMaxWeightPercent: event.target.value })} type="number" value={form.roboticsMaxWeightPercent} />
          </LabeledField>
          <LabeledField label="单股最大回撤" helper="单只股票超过后进入复核">
            <input onChange={(event) => setForm({ ...form, singleStockMaxDrawdownPercent: event.target.value })} type="number" value={form.singleStockMaxDrawdownPercent} />
          </LabeledField>
          <LabeledField label="组合最大回撤" helper="组合层面的承受范围">
            <input onChange={(event) => setForm({ ...form, portfolioMaxDrawdownPercent: event.target.value })} type="number" value={form.portfolioMaxDrawdownPercent} />
          </LabeledField>
          <LabeledField label="核心仓" helper="用顿号或逗号分隔">
            <input onChange={(event) => setForm({ ...form, coreHoldings: event.target.value })} value={form.coreHoldings} />
          </LabeledField>
          <LabeledField label="弹性仓" helper="高波动观察仓">
            <input onChange={(event) => setForm({ ...form, satelliteHoldings: event.target.value })} value={form.satelliteHoldings} />
          </LabeledField>
          <LabeledField label="调仓周期" helper="例如：每月复盘">
            <input onChange={(event) => setForm({ ...form, rebalanceCadence: event.target.value })} value={form.rebalanceCadence} />
          </LabeledField>
          <LabeledField label="新增资金计划" helper="是否定投、补跌或暂无">
            <input onChange={(event) => setForm({ ...form, cashPlan: event.target.value })} value={form.cashPlan} />
          </LabeledField>
          <LabeledField label="腾仓顺序" helper="需要加机器人时先动哪些非核心资产">
            <input onChange={(event) => setForm({ ...form, trimOrder: event.target.value })} value={form.trimOrder} />
          </LabeledField>
        </div>
        <div className="preference-save-row">
          <button className="primary-action" disabled={isSaving} onClick={() => void save()} type="button"><RefreshCcw size={16} /> {isSaving ? '保存中' : '保存投资偏好'}</button>
          <span>{message}</span>
        </div>
      </article>

      <section className="dual-advice-grid">
        <AdviceReviewPanel review={preferenceReview} title="投资偏好建议复盘" subtitle="按你的长期偏好执行，当前看是好还是坏" />
        <AdviceReviewPanel review={quantReview} title="量化交易建议复盘" subtitle="按量化信号执行，当前看是好还是坏" />
      </section>
    </div>
  );
}

function LabeledField(props: { readonly label: string; readonly helper: string; readonly children: React.ReactNode }): React.ReactElement {
  return (
    <label className="labeled-field">
      <span>{props.label}</span>
      {props.children}
      <small>{props.helper}</small>
    </label>
  );
}

function AdviceReviewPanel(props: { readonly title: string; readonly subtitle: string; readonly review: readonly AdviceReviewItem[] }): React.ReactElement {
  return (
    <article className="glass-card advice-review-panel">
      <CardHeader icon={<GitBranch />} title={props.title} subtitle={props.subtitle} />
      <div className="advice-review-list">
        {props.review.map((item) => (
          <div className={item.outcome} key={`${item.name}-${item.actionLabel}`}>
            <span>{item.name}</span>
            <strong>{item.resultLabel}</strong>
            <p>{item.detail}</p>
            <small>{item.evidence}</small>
          </div>
        ))}
      </div>
    </article>
  );
}

function AdvicePanel(props: { readonly icon: React.ReactNode; readonly title: string; readonly subtitle: string; readonly items: readonly PortfolioAdviceItem[] }): React.ReactElement {
  return (
    <article className="glass-card advice-panel">
      <CardHeader icon={props.icon} title={props.title} subtitle={props.subtitle} />
      <div className="advice-list">
        {props.items.map((item) => (
          <div className={`advice-item ${item.severity}`} key={`${item.source}-${item.targetName}-${item.action}`}>
            <div className="advice-item-head">
              <span>
                <strong>{item.targetName}</strong>
                <small>{item.targetCode ?? targetTypeLabel(item.targetType)}</small>
              </span>
              <b>{item.actionLabel}</b>
            </div>
            <p>{item.reason}</p>
            <small>{item.evidence}</small>
            <em>置信度 {item.confidence}</em>
          </div>
        ))}
      </div>
    </article>
  );
}

type InvestorPreferenceForm = {
  readonly horizon: string;
  readonly coreView: string;
  readonly roboticsMaxWeightPercent: string;
  readonly singleStockMaxDrawdownPercent: string;
  readonly portfolioMaxDrawdownPercent: string;
  readonly coreHoldings: string;
  readonly satelliteHoldings: string;
  readonly rebalanceCadence: string;
  readonly cashPlan: string;
  readonly trimOrder: string;
};

type AdviceReviewItem = {
  readonly name: string;
  readonly actionLabel: string;
  readonly outcome: 'good' | 'bad' | 'neutral' | 'unknown';
  readonly resultLabel: string;
  readonly detail: string;
  readonly evidence: string;
};

function buildAdviceReview(items: readonly PortfolioAdviceItem[], decisions: readonly PortfolioPositionDecision[], source: PortfolioAdviceItem['source']): readonly AdviceReviewItem[] {
  const bySymbol = new Map(decisions.map((decision) => [decision.symbol, decision]));
  const byName = new Map(decisions.map((decision) => [decision.name, decision]));
  return items.slice(0, 8).map((item) => {
    const decision = item.targetCode === null ? byName.get(item.targetName) : bySymbol.get(item.targetCode);
    if (decision === undefined || decision.latestPrice === null) {
      return {
        name: item.targetName,
        actionLabel: item.actionLabel,
        outcome: 'unknown',
        resultLabel: '暂无法复盘',
        detail: '缺少对应持仓或实时价格，无法判断如果执行该建议到现在是好是坏。',
        evidence: item.evidence,
      };
    }
    const pnlPct = Number(decision.unrealizedPnlPercent ?? 0);
    const action = item.action;
    const avoidedLoss = (action.includes('risk') || action.includes('reduce') || action.includes('avoid')) && pnlPct < 0;
    const missedGain = (action.includes('risk') || action.includes('reduce') || action.includes('avoid')) && pnlPct > 3;
    const heldWinner = (action.includes('hold') || action.includes('no_trade') || action.includes('no_action')) && pnlPct > 0;
    const heldLoser = (action.includes('hold') || action.includes('no_trade') || action.includes('no_action')) && pnlPct < -5;
    const good = avoidedLoss || heldWinner;
    const bad = missedGain || heldLoser;
    return {
      name: item.targetName,
      actionLabel: item.actionLabel,
      outcome: good ? 'good' : bad ? 'bad' : 'neutral',
      resultLabel: good ? '目前看有利' : bad ? '目前看不利' : '目前看中性',
      detail: source === 'preference'
        ? '这是按投资偏好建议执行的即时复盘，重点看是否符合长线持有和风险容忍。'
        : '这是按量化交易建议执行的即时复盘，重点看是否避开风险或错过收益。',
      evidence: `当前浮盈亏 ${decision.unrealizedPnlPercent ?? '0.00'}%，现价 ${decision.latestPrice}，建议依据：${item.evidence}`,
    };
  });
}

function investorPreferenceToForm(preference: InvestorPreference): InvestorPreferenceForm {
  return {
    horizon: preference.horizon,
    coreView: preference.coreView,
    roboticsMaxWeightPercent: String(preference.roboticsMaxWeightPercent),
    singleStockMaxDrawdownPercent: String(preference.singleStockMaxDrawdownPercent),
    portfolioMaxDrawdownPercent: String(preference.portfolioMaxDrawdownPercent),
    coreHoldings: preference.coreHoldings.join('、'),
    satelliteHoldings: preference.satelliteHoldings.join('、'),
    rebalanceCadence: preference.rebalanceCadence,
    cashPlan: preference.cashPlan,
    trimOrder: preference.trimOrder.join('、'),
  };
}

function investorPreferenceFromForm(form: InvestorPreferenceForm): InvestorPreference {
  return {
    horizon: form.horizon.trim(),
    coreView: form.coreView.trim(),
    roboticsMaxWeightPercent: Number(form.roboticsMaxWeightPercent),
    singleStockMaxDrawdownPercent: Number(form.singleStockMaxDrawdownPercent),
    portfolioMaxDrawdownPercent: Number(form.portfolioMaxDrawdownPercent),
    coreHoldings: splitPreferenceList(form.coreHoldings),
    satelliteHoldings: splitPreferenceList(form.satelliteHoldings),
    rebalanceCadence: form.rebalanceCadence.trim(),
    cashPlan: form.cashPlan.trim(),
    trimOrder: splitPreferenceList(form.trimOrder),
  };
}

function splitPreferenceList(value: string): readonly string[] {
  return value.split(/[、,，/]+/).map((item) => item.trim()).filter(Boolean);
}

function targetTypeLabel(type: PortfolioAdviceItem['targetType']): string {
  const labels: Record<PortfolioAdviceItem['targetType'], string> = {
    stock: '股票',
    fund: '基金',
    theme: '主题',
    portfolio: '组合',
  };
  return labels[type];
}

function holdingStageLabel(stage: PortfolioPositionDecision['holdingStage']): string {
  const labels: Record<PortfolioPositionDecision['holdingStage'], string> = {
    new: '新买入',
    holding: '持有中',
    long_term_core: '长期核心',
  };
  return labels[stage];
}

function decisionNextStepTitle(item: PortfolioPositionDecision): string {
  if (item.systemAction.code === 'reduce_risk') {
    return '需要处理';
  }
  if (item.systemAction.code === 'avoid_add') {
    return '今天不补仓';
  }
  if (item.systemAction.code === 'small_add_watch') {
    return '只等回踩';
  }
  if (item.systemAction.code === 'take_profit_watch') {
    return '保护利润';
  }
  return '不需要操作';
}

function decisionNextStepDetail(item: PortfolioPositionDecision): string {
  if (item.systemAction.code === 'reduce_risk') {
    return `跌破风控条件才进入减仓复核；当前先看 ${item.pricePlan.stopLossPrice ?? '风控线'} 是否有效跌破。`;
  }
  if (item.systemAction.code === 'avoid_add') {
    return item.holdingStage === 'new'
      ? '新买入阶段遇到大波动，系统只要求停止补仓，先观察买入逻辑是否仍成立。'
      : '趋势或波动不支持继续加仓，已有仓位按风控线处理。';
  }
  if (item.systemAction.code === 'small_add_watch') {
    return `不追高，只在回踩 ${item.pricePlan.addWatchPrice ?? '--'} 附近不破时再考虑小额分批。`;
  }
  if (item.systemAction.code === 'take_profit_watch') {
    return `观察能否站稳 ${item.pricePlan.profitProtectPrice ?? '--'}，不能站稳再考虑保护利润。`;
  }
  return '没有触发买卖条件，继续持有，不需要你做动作。';
}

function pricePositionLabel(item: PortfolioPositionDecision, showAmounts: boolean): string {
  if (!showAmounts) {
    return '价格已隐藏';
  }
  if (item.latestPrice === null) {
    return '现价待更新';
  }
  const latest = Number(item.latestPrice);
  const cost = Number(item.costPrice);
  if (!Number.isFinite(latest) || !Number.isFinite(cost) || cost <= 0) {
    return '价格口径待确认';
  }
  const diffPercent = ((latest - cost) / cost) * 100;
  if (Math.abs(diffPercent) < 1) {
    return '贴近成本区';
  }
  return diffPercent > 0 ? `高于成本 ${formatPercent(diffPercent)}` : `低于成本 ${formatPercent(Math.abs(diffPercent))}`;
}

function trendLabel(signal: PortfolioQuantSignal | undefined): string {
  if (signal === undefined) {
    return '趋势待计算';
  }
  const labels: Record<PortfolioQuantSignal['trend'], string> = {
    uptrend: '短线偏强',
    downtrend: '短线偏弱',
    sideways: '横盘震荡',
    unknown: '趋势未知',
  };
  return labels[signal.trend];
}

function riskDistanceLabel(item: PortfolioPositionDecision, showAmounts: boolean): string {
  if (!showAmounts) {
    return '风控距离已隐藏';
  }
  if (item.latestPrice === null || item.pricePlan.stopLossPrice === null) {
    return '风控距离待算';
  }
  const latest = Number(item.latestPrice);
  const stopLoss = Number(item.pricePlan.stopLossPrice);
  if (!Number.isFinite(latest) || !Number.isFinite(stopLoss) || stopLoss <= 0) {
    return '风控线待确认';
  }
  const distance = ((latest - stopLoss) / stopLoss) * 100;
  if (distance <= 0) {
    return '已触及风控线';
  }
  if (distance < 5) {
    return `距风控线 ${formatPercent(distance)}`;
  }
  return `风控缓冲 ${formatPercent(distance)}`;
}

function holdingDiagnosisSummary(item: PortfolioPositionDecision, signal: PortfolioQuantSignal | undefined, showAmounts: boolean): string {
  const priceText = pricePositionLabel(item, showAmounts);
  const trendText = trendLabel(signal);
  const riskText = riskDistanceLabel(item, showAmounts);
  return `${priceText}，${trendText}，${riskText}。系统动作：${item.systemAction.label}。`;
}

function holdingLogicText(item: PortfolioPositionDecision): string {
  if (item.holdingStage === 'new') {
    return '新买入阶段优先验证买入逻辑，不因为单日波动直接做减仓判断；跌破风控线或原逻辑失效才复核。';
  }
  if (item.holdingStage === 'long_term_core') {
    return '长期核心仓按长线逻辑管理，重点看基本面/产业逻辑是否破坏，以及是否超过组合仓位上限。';
  }
  if (item.action === 'add_on_strength') {
    return '持有中且有强势观察条件，但系统仍要求等回踩或确认，不追高。';
  }
  if (item.action === 'avoid_add') {
    return '当前不是卖出结论，而是禁止继续加仓；已有仓位继续按触发线和持仓逻辑复核。';
  }
  return '普通持有仓，当前没有触发明确买卖动作，继续观察价格和逻辑变化。';
}

function getDecisionTheme(item: PortfolioPositionDecision, themeTagsBySymbol: ReadonlyMap<string, readonly string[]>): string {
  const tags = item.themeTags ?? themeTagsBySymbol.get(item.symbol) ?? [];
  if (tags.length > 0) {
    return tags.join(' / ');
  }

  const reasonTheme = item.reasons.find((reason) => reason.startsWith('主题：'))?.replace('主题：', '').trim();
  return reasonTheme && reasonTheme !== '待补充' ? reasonTheme : '主题待补充';
}

function formatDecisionTarget(item: PortfolioPositionDecision, themeTagsBySymbol: ReadonlyMap<string, readonly string[]>): string {
  const theme = getDecisionTheme(item, themeTagsBySymbol);
  return theme === '主题待补充' ? item.name : `${item.name} · ${theme.split(' / ')[0] ?? theme}`;
}

function fundSignalTone(signal: PortfolioFundSignal): 'ready' | 'wait' | 'danger' {
  const pctChange = signal.proxyPctChange === null ? null : Number(signal.proxyPctChange);
  if (pctChange === null || !Number.isFinite(pctChange)) {
    return 'wait';
  }
  if (pctChange <= -2 || signal.actionLabel.includes('风控')) {
    return 'danger';
  }
  if (pctChange >= 2) {
    return 'ready';
  }
  return 'wait';
}

function hasLivePositionQuote(position: Pick<PortfolioPosition, 'latestPrice' | 'quoteSource'> | undefined): boolean {
  return position !== undefined && position.latestPrice !== null && typeof position.quoteSource === 'string' && position.quoteSource.length > 0;
}

function normalizeStockSymbolInput(value: string): string | null {
  const compact = value
    .trim()
    .toUpperCase()
    .replace(/^(SH|SZ|BJ)/, '')
    .replace(/\.(SH|SZ|BJ)$/, '')
    .replace(/[^0-9]/g, '');
  return /^[0-9]{6}$/.test(compact) ? compact : null;
}

function inferFundTheme(name: string): string {
  if (name.includes('纳斯达克') || name.includes('纳指')) {
    return '美股科技 / QDII';
  }
  if (name.includes('标普') || name.includes('S&P')) {
    return '美股宽基 / QDII';
  }
  if (name.includes('恒生科技')) {
    return '港股科技 / 恒生科技';
  }
  if (name.includes('黄金')) {
    return '黄金 / 避险资产';
  }
  if (name.includes('通信') || name.includes('5G')) {
    return '通信设备 / AI算力链';
  }
  if (name.includes('人工智能') || name.includes('AI')) {
    return '人工智能 / AI应用';
  }
  if (name.includes('中证1000')) {
    return 'A股小盘宽基';
  }
  if (name.includes('消费') || name.includes('白酒')) {
    return '消费复苏';
  }
  if (name.includes('新能源') || name.includes('绿色') || name.includes('绿电')) {
    return '新能源 / 绿电';
  }
  return '基金主题待确认';
}

function validateTradingStockForm(form: { readonly symbol: string; readonly name: string; readonly quantity: string; readonly costPrice: string; readonly latestPrice: string; readonly theme: string }): string | null {
  if (normalizeStockSymbolInput(form.symbol) === null) {
    return '股票代码必须能识别为 6 位 A 股代码，例如 300750、300750.SZ 或 sz300750。';
  }
  if (form.name.trim().length === 0) {
    return '请填写股票名称，建议必须显示名称而不是只显示代码。';
  }
  if (!isPositiveNumber(form.quantity)) {
    return '持仓数量必须大于 0。';
  }
  if (!isPositiveNumber(form.costPrice)) {
    return '成本价必须大于 0。';
  }
  if (form.latestPrice.trim().length > 0 && !isPositiveNumber(form.latestPrice)) {
    return '最新价可以留空；如果填写，必须大于 0。';
  }
  if (form.theme.trim().length === 0) {
    return '请填写持仓主题，这会影响组合建议解释。';
  }
  return null;
}

function validateTradingFundForm(form: { readonly name: string; readonly theme: string; readonly amount: string; readonly weightPercent: string }): string | null {
  if (form.name.trim().length === 0) {
    return '请填写基金名称。';
  }
  if (form.theme.trim().length === 0) {
    return '请填写基金主题，这会影响主题暴露判断。';
  }
  if (!isPositiveNumber(form.amount)) {
    return '基金金额必须大于 0。';
  }
  if (form.weightPercent.trim().length > 0 && !isNonNegativeNumber(form.weightPercent)) {
    return '基金权重可以留空；如果填写，必须是大于等于 0 的数字。';
  }
  return null;
}

function isPositiveNumber(value: string): boolean {
  const parsed = Number(value);
  return value.trim().length > 0 && Number.isFinite(parsed) && parsed > 0;
}

function isNonNegativeNumber(value: string): boolean {
  const parsed = Number(value);
  return value.trim().length > 0 && Number.isFinite(parsed) && parsed >= 0;
}

function readDecisionSnapshot(): DecisionSnapshot | null {
  if (typeof window === 'undefined') {
    return null;
  }
  const raw = window.localStorage.getItem(decisionSnapshotStorageKey);
  if (raw === null) {
    return null;
  }
  try {
    const parsed = JSON.parse(raw) as DecisionSnapshot;
    return typeof parsed.savedAt === 'string' && typeof parsed.primaryAction === 'string' ? parsed : null;
  } catch {
    return null;
  }
}

function buildDecisionSnapshot(
  decision: PortfolioTradingDecision,
  dataStatus: DecisionSnapshot['dataStatus'],
  buckets: Pick<DecisionSnapshot, 'hold' | 'watch' | 'addOnStrength' | 'riskControl'>,
): DecisionSnapshot {
  return {
    savedAt: new Date().toISOString(),
    primaryAction: decision.summary.primaryAction,
    riskLevel: decision.summary.riskLevel,
    dataStatus,
    hold: buckets.hold,
    watch: buckets.watch,
    addOnStrength: buckets.addOnStrength,
    riskControl: buckets.riskControl,
  };
}

function compareDecisionSnapshots(previous: DecisionSnapshot | null, current: DecisionSnapshot): readonly { readonly title: string; readonly summary: string; readonly tone: 'ready' | 'wait' | 'danger' }[] {
  if (previous === null) {
    return [
      { title: '首次记录', summary: '先保存一次今日建议，之后系统会自动显示变化。', tone: 'wait' },
      { title: '当前风险', summary: current.riskControl.length === 0 ? '暂无风险队列' : current.riskControl.join(' / '), tone: current.riskControl.length === 0 ? 'ready' : 'danger' },
      { title: '当前强势', summary: current.addOnStrength.length === 0 ? '暂无强势观察' : current.addOnStrength.join(' / '), tone: 'ready' },
    ];
  }

  const addedRisk = diffAdded(previous.riskControl, current.riskControl);
  const addedStrength = diffAdded(previous.addOnStrength, current.addOnStrength);
  const removedRisk = diffAdded(current.riskControl, previous.riskControl);
  return [
    {
      title: '主建议变化',
      summary: previous.primaryAction === current.primaryAction ? '主建议没有变化' : current.primaryAction,
      tone: previous.primaryAction === current.primaryAction ? 'ready' : 'wait',
    },
    {
      title: '新增风险',
      summary: addedRisk.length === 0 ? (removedRisk.length === 0 ? '风险队列无新增' : `移出风险：${removedRisk.join(' / ')}`) : addedRisk.join(' / '),
      tone: addedRisk.length === 0 ? 'ready' : 'danger',
    },
    {
      title: '新增强势',
      summary: addedStrength.length === 0 ? '强势观察无新增' : addedStrength.join(' / '),
      tone: addedStrength.length === 0 ? 'wait' : 'ready',
    },
  ];
}

function diffAdded(previous: readonly string[], current: readonly string[]): readonly string[] {
  const previousSet = new Set(previous);
  return current.filter((item) => !previousSet.has(item));
}

function RiskView(props: { readonly portfolio: PortfolioData; readonly showAmounts: boolean }): React.ReactElement {
  const decision = props.portfolio.tradingDecision;
  const decisions = decision.decisions.length > 0 ? decision.decisions : props.portfolio.context.positions.map((position) => ({
    ...position,
    unrealizedPnlPercent: null,
    action: position.riskLevel === 'high' ? 'risk_control' as const : 'watch' as const,
    actionLabel: actionLabel(position.riskLevel === 'high' ? 'risk_control' : 'watch'),
    systemAction: {
      code: position.riskLevel === 'high' ? 'reduce_risk' as const : 'no_action' as const,
      label: position.riskLevel === 'high' ? '减仓复核' : '不操作',
      severity: position.riskLevel === 'high' ? 'urgent' as const : 'none' as const,
      needsAttention: position.riskLevel === 'high',
      instruction: position.riskLevel === 'high' ? `${position.name} 风险等级较高，等待实时行情确认。` : `${position.name} 当前不操作。`,
    },
    reasons: [`主题：${position.themeTags.join(' / ')}`],
    triggers: ['等待实时行情确认。'],
    pricePlan: { currentPrice: position.latestPrice, costPrice: position.costPrice, stopLossPrice: null, profitProtectPrice: null, addWatchPrice: null, strengthConfirmPrice: null },
  }));
  const attention = decisions.filter((item) => item.systemAction.needsAttention);
  const urgent = attention.filter((item) => item.systemAction.severity === 'urgent');
  const topTheme = [...decision.themeRadar].sort((left, right) => Number(right.weightPercent) - Number(left.weightPercent))[0];
  const quoteCoverage = decision.dataStatus.quoteCoverage;
  const conflicts = decision.preferenceAdvice.flatMap((preference) => {
    const quant = decision.quantAdvice.find((item) => item.targetCode !== null && item.targetCode === preference.targetCode);
    if (quant === undefined || preference.severity === quant.severity || preference.targetCode === null) {
      return [];
    }
    return [`${preference.targetName}: 偏好建议「${preference.actionLabel}」，量化建议「${quant.actionLabel}」`];
  });
  const riskRows = [
    ...urgent.map((item) => ({ tone: 'danger' as const, title: `${item.name} 需要处理`, detail: item.systemAction.instruction, evidence: `现价 ${item.latestPrice ?? '未更新'} / 风控线 ${item.pricePlan.stopLossPrice ?? '待生成'}` })),
    ...(topTheme === undefined ? [] : [{ tone: topTheme.riskLevel === 'high' ? 'danger' as const : 'wait' as const, title: `${topTheme.theme} 集中度`, detail: topTheme.reason, evidence: `权重 ${topTheme.weightPercent}% / 成员 ${topTheme.members.slice(0, 5).join('、')}` }]),
    ...decision.dataStatus.stalePositionNames.slice(0, 3).map((name) => ({ tone: 'wait' as const, title: `${name} 行情未更新`, detail: '该标的风险判断只能用成本和持仓逻辑兜底，不能作为加仓依据。', evidence: decision.dataStatus.label })),
    ...conflicts.slice(0, 3).map((item) => ({ tone: 'wait' as const, title: '两套建议存在分歧', detail: item, evidence: '需要你结合长期偏好和量化信号做最终判断。' })),
  ];

  return (
    <div className="view-stack">
      <section className="risk-grid">
        <MetricCard icon={<ShieldCheck />} label="需要处理" value={`${attention.length} 只`} helper={attention.map((item) => item.name).join(' / ') || '暂无'} tone={attention.length > 0 ? 'amber' : 'green'} />
        <MetricCard icon={<Activity />} label="行情覆盖" value={`${quoteCoverage.updated}/${quoteCoverage.total}`} helper={decision.dataStatus.status === 'live' ? '真实行情参与判断' : '行情未完整更新'} tone="cyan" />
        <MetricCard icon={<Waves />} label="最大主题" value={topTheme?.theme ?? '待更新'} helper={topTheme === undefined ? '主题雷达未生成' : `权重 ${topTheme.weightPercent}%`} tone="violet" />
        <MetricCard icon={<GitBranch />} label="建议分歧" value={`${conflicts.length} 个`} helper={conflicts[0] ?? '偏好和量化暂无明显冲突'} tone={conflicts.length > 0 ? 'amber' : 'green'} />
      </section>
      <article className="glass-card risk-console">
        <CardHeader icon={<ShieldCheck />} title="组合风险监控" subtitle="基于当前持仓、行情覆盖、主题集中度和两套建议生成" />
        {riskRows.length === 0 ? (
          <div className="guard-row"><span className="pulse live" />当前没有明显风险项<strong>正常</strong></div>
        ) : riskRows.map((item) => (
          <div className={`guard-row ${item.tone}`} key={`${item.title}-${item.evidence}`}>
            <span className={item.tone === 'danger' ? 'pulse warning' : 'pulse live'} />
            <section>
              <strong>{item.title}</strong>
              <p>{item.detail}</p>
              <small>{item.evidence}</small>
            </section>
            <b>{item.tone === 'danger' ? '优先' : '观察'}</b>
          </div>
        ))}
      </article>
      <article className="glass-card risk-console">
        <CardHeader icon={<ListChecks />} title="风险说明" subtitle="这里不再展示未接入模块，而是展示当前组合真正需要注意的事情" />
        <div className="guard-row"><span className="pulse live" />风险监控不会自动下单，只给组合复盘和动作优先级。<strong>说明</strong></div>
        <div className="guard-row"><span className="pulse live" />投资偏好建议和量化建议冲突时，会在这里单独列出来。<strong>说明</strong></div>
        <div className="guard-row"><span className="pulse live" />金额隐藏开关当前为 {props.showAmounts ? '显示金额' : '隐藏金额'}，风险判断仍保留比例和动作。<strong>说明</strong></div>
      </article>
    </div>
  );
}

function MetricCard(props: {
  readonly icon: React.ReactNode;
  readonly label: string;
  readonly value: string;
  readonly helper: string;
  readonly tone: 'violet' | 'cyan' | 'green' | 'amber';
}): React.ReactElement {
  return (
    <article className={`metric-card ${props.tone}`}>
      <div className="metric-icon">{props.icon}</div>
      <span>{props.label}</span>
      <strong>{props.value}</strong>
      <small>{props.helper}</small>
    </article>
  );
}

function EquityCard(): React.ReactElement {
  return (
    <article className="glass-card chart-card">
      <CardHeader icon={<LineChart />} title="净值监控" subtitle="净值曲线、回撤与收益节奏" />
      <div className="chart-surface">
        <svg viewBox="0 0 720 270" role="img" aria-label="净值曲线">
          <defs>
            <linearGradient id="curve" x1="0" x2="1" y1="0" y2="0">
              <stop stopColor="#7170ff" />
              <stop offset="1" stopColor="#31d0aa" />
            </linearGradient>
            <linearGradient id="fill" x1="0" x2="0" y1="0" y2="1">
              <stop stopColor="#7170ff" stopOpacity="0.3" />
              <stop offset="1" stopColor="#7170ff" stopOpacity="0" />
            </linearGradient>
          </defs>
          <path className="grid-line" d="M0 44H720M0 104H720M0 164H720M0 224H720" />
          <path d="M22 226 C92 182, 114 204, 172 146 S302 104, 356 124 S498 42, 574 72 S658 44, 700 28 L700 252 L22 252 Z" fill="url(#fill)" />
          <path d="M22 226 C92 182, 114 204, 172 146 S302 104, 356 124 S498 42, 574 72 S658 44, 700 28" fill="none" stroke="url(#curve)" strokeLinecap="round" strokeWidth="4" />
          {equityPoints.map((point, index) => <circle cx={28 + index * 61} cy={238 - point * 2} fill="#f7f8f8" key={index} opacity="0.7" r="3" />)}
        </svg>
        <div className="chart-chip"><TrendingUp size={14} /> 累计 +12.4%</div>
        <div className="chart-stats"><span>Sharpe 1.60</span><span>最大回撤 5.0%</span><span>胜率 55%</span></div>
      </div>
    </article>
  );
}

function StatusCard(props: {
  readonly byStatus: Readonly<Record<string, number>>;
  readonly latestTask: Overview['backtests']['latestTask'] | BacktestItem | null;
}): React.ReactElement {
  const total = Math.max(Object.values(props.byStatus).reduce((sum, count) => sum + count, 0), 1);

  return (
    <article className="glass-card">
      <CardHeader icon={<ShieldCheck />} title="回测状态" subtitle="任务状态分布" />
      <div className="status-stack">
        {Object.entries(props.byStatus).map(([status, count]) => (
          <div className="status-row" key={status}>
            <span>{statusLabel(status)}</span>
            <div className="status-bar"><i style={{ width: `${Math.min(100, (count / total) * 100)}%` }} /></div>
            <strong>{count}</strong>
          </div>
        ))}
      </div>
      {props.latestTask && (
        <div className="latest-task">
          <span>最新任务</span>
          <strong>{props.latestTask.name}</strong>
          <small>{props.latestTask.startDate} → {props.latestTask.endDate}</small>
        </div>
      )}
    </article>
  );
}

function DataCoverageCard(props: { readonly coverage: readonly DataCoverage[] }): React.ReactElement {
  return (
    <article className="glass-card">
      <CardHeader icon={<Boxes />} title="数据覆盖" subtitle="数量与最新日期" />
      <div className="coverage-list">
        {props.coverage.map((item) => (
          <div className="coverage-item" key={item.dataSet}>
            <div><strong>{dataSetLabel(item.dataSet)}</strong><span>{item.latestDate ?? '未同步'}</span></div>
            <em>{formatNumber(item.total)}</em>
          </div>
        ))}
      </div>
    </article>
  );
}

function StrategiesCompactCard(props: { readonly strategies: readonly StrategyItem[] }): React.ReactElement {
  return (
    <article className="glass-card">
      <CardHeader icon={<GitBranch />} title="策略" subtitle="配置结构已就绪" />
      <div className="strategy-list">
        {props.strategies.map((strategy) => (
          <div className="strategy-card" key={strategy.code}>
            <div><strong>{strategyDisplayName(strategy)}</strong><span>{strategy.code} · v{strategy.version}</span></div>
            <p>{strategyDisplayDescription(strategy)}</p>
            <small>{strategy.configSchema.length} 个配置字段</small>
          </div>
        ))}
      </div>
    </article>
  );
}

function BacktestsCompactCard(props: { readonly backtests: readonly BacktestItem[] }): React.ReactElement {
  return (
    <article className="glass-card">
      <CardHeader icon={<Gauge />} title="近期回测" subtitle="工作台摘要" />
      <div className="backtest-list">
        {props.backtests.slice(0, 4).map((task) => (
          <div className="backtest-item" key={task.id}>
            <StatusPill status={task.status} />
            <strong>{task.name}</strong>
            <small>{strategyDisplayName(task.strategyName)} · {task.initialCapital}</small>
          </div>
        ))}
      </div>
    </article>
  );
}

function StatusPill(props: { readonly status: string }): React.ReactElement {
  return <span className={`status-pill ${props.status.toLowerCase()}`}>{statusLabel(props.status)}</span>;
}

function CardHeader(props: { readonly icon: React.ReactNode; readonly title: string; readonly subtitle: string }): React.ReactElement {
  return (
    <header className="card-header">
      <div className="card-icon">{props.icon}</div>
      <div>
        <h2>{props.title}</h2>
        <p>{props.subtitle}</p>
      </div>
    </header>
  );
}

createRoot(document.getElementById('root') as HTMLElement).render(<App />);
