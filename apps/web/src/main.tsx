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

type ViewKey = 'overview' | 'data' | 'strategies' | 'backtests' | 'research' | 'risk';
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
  { key: 'overview', label: '总览', icon: <AreaChart size={16} /> },
  { key: 'data', label: '数据中心', icon: <DatabaseZap size={16} /> },
  { key: 'strategies', label: '策略库', icon: <BrainCircuit size={16} /> },
  { key: 'backtests', label: '回测', icon: <Gauge size={16} /> },
  { key: 'research', label: '投研中心', icon: <Sparkles size={16} /> },
  { key: 'risk', label: '风险监控', icon: <ShieldCheck size={16} /> },
];

const equityPoints = [24, 34, 29, 48, 58, 52, 74, 66, 84, 92, 86, 98];
const factorRows = [
  { name: 'momentum', weight: '45%', direction: 'positive', score: 91 },
  { name: 'roe', weight: '35%', direction: 'positive', score: 84 },
  { name: 'pe', weight: '20%', direction: 'negative', score: 76 },
];
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
  const [activeView, setActiveView] = React.useState<ViewKey>('overview');
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

        <div className="command-box">
          <Search size={15} />
          <span>搜索策略、标的...</span>
          <kbd>⌘K</kbd>
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
          <div className="mini-panel">
            <span className="mini-label">今日系统健康</span>
            <strong>99.97%</strong>
            <div className="micro-bars">{Array.from({ length: 24 }, (_, index) => <i key={index} style={{ height: `${18 + ((index * 7) % 34)}px` }} />)}</div>
          </div>
          <div className="system-card">
            <div className="pulse-row"><span className={isLive ? 'pulse live' : 'pulse'} />{isLive ? '实时 API 已连接' : '预览数据模式'}</div>
            <p>Phase6 工作台正在使用后端聚合接口，前端可独立预览。</p>
          </div>
        </div>
      </aside>

      <section className="content-panel">
        <TopBar activeView={activeView} refreshedAt={refreshedAt} onRefresh={refresh} onToggleAmounts={() => setShowAmounts(!showAmounts)} onToggleTheme={() => setThemeMode(themeMode === 'light' ? 'dark' : 'light')} showAmounts={showAmounts} themeMode={themeMode} />
        {activeView === 'overview' && <OverviewView coverage={coverage} data={data} research={researchData} showAmounts={showAmounts} successRate={successRate} onNavigate={setActiveView} onRefresh={refresh} onRefreshResearch={refreshResearch} />}
        {activeView === 'data' && <DataCenterView coverage={coverage} syncHealth={data.overview.dataCenter.syncHealth} onRefresh={refresh} />}
        {activeView === 'strategies' && <StrategiesView strategies={data.strategies} />}
        {activeView === 'backtests' && <BacktestsView backtests={data.backtests} byStatus={data.overview.backtests.byStatus} />}
        {activeView === 'research' && <ResearchView data={researchData} isLive={isResearchLive} showAmounts={showAmounts} onRefresh={refreshResearch} />}
        {activeView === 'risk' && <RiskView data={data} />}
      </section>
    </main>
  );
}

function TopBar(props: { readonly activeView: ViewKey; readonly refreshedAt: string; readonly onRefresh: () => Promise<void>; readonly onToggleAmounts: () => void; readonly onToggleTheme: () => void; readonly showAmounts: boolean; readonly themeMode: ThemeMode }): React.ReactElement {
  const titleMap: Readonly<Record<ViewKey, string>> = {
    overview: '统一指挥台',
    data: '数据中心',
    strategies: '策略实验室',
    backtests: '回测控制台',
    research: '投研中心',
    risk: '风险监控',
  };

  return (
    <header className="top-bar">
      <div>
        <div className="breadcrumb"><Sparkles size={14} /> 第 6 阶段工作台 <span>/</span> {titleMap[props.activeView]}</div>
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
    theme: '',
    thesis: '',
    actionBias: 'watch',
  });
  const [fundForm, setFundForm] = React.useState({
    name: '',
    theme: '',
    amount: '',
    weightPercent: '',
    actionBias: 'watch',
  });
  const [isSavingPortfolio, setIsSavingPortfolio] = React.useState(false);
  const [portfolioMessage, setPortfolioMessage] = React.useState('新增或更新后，投研中心会立即重新计算组合上下文和主题暴露。');
  const [isSavingJournal, setIsSavingJournal] = React.useState(false);
  const [journalMessage, setJournalMessage] = React.useState('保存后会进入历史记录，用来对照今天判断和后续市场验证。');
  const stockMarketValue = context.stockAccount.positions.reduce((sum, item) => sum + (item.marketValue ?? item.quantity * (item.latestPrice ?? item.costPrice)), 0);
  const fundVisibleValue = context.fundAccount.visibleAssetValue;
  const estimatedPortfolioValue = stockMarketValue + fundVisibleValue;
  const topFundExposures = context.fundAccount.exposures.slice(0, 6);
  const primaryIdeas = props.data.ideas.slice(0, 4);
  const riskCount = context.riskFlags.length + props.data.portfolioReview.riskNotes.length;
  const actionBuckets = [
    ['分批加仓', daily.actionBuckets.build],
    ['观察', daily.actionBuckets.watch],
    ['风控', daily.actionBuckets.riskControl],
    ['止盈', daily.actionBuckets.takeProfit],
  ] as const;

  async function saveStockHolding(): Promise<void> {
    setIsSavingPortfolio(true);
    setPortfolioMessage('正在保存股票持仓。');
    try {
      await postApi<ResearchPortfolioContext>('/portfolio/holdings/stocks', {
        symbol: stockForm.symbol,
        name: stockForm.name,
        quantity: Number(stockForm.quantity),
        costPrice: Number(stockForm.costPrice),
        latestPrice: stockForm.latestPrice.length === 0 ? null : Number(stockForm.latestPrice),
        theme: stockForm.theme,
        thesis: stockForm.thesis.length === 0 ? undefined : stockForm.thesis,
        actionBias: stockForm.actionBias,
      });
      setStockForm({ symbol: '', name: '', quantity: '', costPrice: '', latestPrice: '', theme: '', thesis: '', actionBias: 'watch' });
      await props.onRefresh();
      setPortfolioMessage('股票持仓已保存，组合上下文已刷新。');
    } catch (error) {
      const message = error instanceof Error ? error.message : '保存失败';
      setPortfolioMessage(`股票持仓保存失败：${message}`);
    } finally {
      setIsSavingPortfolio(false);
    }
  }

  async function saveFundHolding(): Promise<void> {
    setIsSavingPortfolio(true);
    setPortfolioMessage('正在保存基金暴露。');
    try {
      await postApi<ResearchPortfolioContext>('/portfolio/holdings/funds', {
        name: fundForm.name,
        theme: fundForm.theme,
        amount: Number(fundForm.amount),
        weightPercent: fundForm.weightPercent.length === 0 ? undefined : Number(fundForm.weightPercent),
        actionBias: fundForm.actionBias,
      });
      setFundForm({ name: '', theme: '', amount: '', weightPercent: '', actionBias: 'watch' });
      await props.onRefresh();
      setPortfolioMessage('基金暴露已保存，主题矩阵已刷新。');
    } catch (error) {
      const message = error instanceof Error ? error.message : '保存失败';
      setPortfolioMessage(`基金暴露保存失败：${message}`);
    } finally {
      setIsSavingPortfolio(false);
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
        <div><span>观察信号</span><strong>{primaryIdeas.length}</strong><small>{daily.marketState === 'live' ? '来自策略样例' : '预览候选'}</small></div>
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

        <article className="glass-card idea-board">
          <CardHeader icon={<Zap />} title="想法引擎" subtitle="策略信号转成投研观察卡" />
          <div className="idea-stack">
            {primaryIdeas.map((idea) => (
              <div className="idea-card compact" key={idea.symbol}>
                <div className="strategy-topline"><span className="strategy-code">{idea.symbol}</span><span className="version-pill">{actionLabel(idea.suggestedAction)}</span></div>
                <h3>{idea.name}</h3>
                <p>{localizedText(idea.oneLineThesis)}</p>
                <div className="factor-mini-list">
                  {idea.factorBreakdown.slice(0, 3).map((factor) => <span key={factor.factor}>{factor.factor}: {actionLabel(factor.signal)}</span>)}
                </div>
              </div>
            ))}
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
              <input onChange={(event) => setStockForm({ ...stockForm, symbol: event.target.value })} placeholder="代码，如 300750" value={stockForm.symbol} />
              <input onChange={(event) => setStockForm({ ...stockForm, name: event.target.value })} placeholder="名称" value={stockForm.name} />
              <input onChange={(event) => setStockForm({ ...stockForm, quantity: event.target.value })} placeholder="数量" type="number" value={stockForm.quantity} />
              <input onChange={(event) => setStockForm({ ...stockForm, costPrice: event.target.value })} placeholder="成本价" type="number" value={stockForm.costPrice} />
              <input onChange={(event) => setStockForm({ ...stockForm, latestPrice: event.target.value })} placeholder="最新价，可空" type="number" value={stockForm.latestPrice} />
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
            <button className="secondary-action" disabled={isSavingPortfolio} onClick={() => void saveStockHolding()} type="button"><CandlestickChart size={15} /> 保存股票</button>
          </div>

          <div className="portfolio-form">
            <strong>基金暴露</strong>
            <div className="form-grid">
              <input onChange={(event) => setFundForm({ ...fundForm, name: event.target.value })} placeholder="基金名称" value={fundForm.name} />
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
          <CardHeader icon={<BrainCircuit />} title="信号证据" subtitle="候选理由、风险与触发条件" />
          {primaryIdeas.map((idea) => (
            <div className="evidence-card" key={`${idea.symbol}-evidence`}>
              <strong>{idea.name}</strong>
              <span>{idea.risks[0]}</span>
              <p>{idea.triggers[0]}</p>
            </div>
          ))}
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

function RiskView(props: { readonly data: DashboardData }): React.ReactElement {
  const failed = props.data.overview.backtests.byStatus.FAILED ?? 0;
  const running = props.data.overview.backtests.byStatus.RUNNING ?? 0;

  return (
    <div className="view-stack">
      <section className="risk-grid">
        <MetricCard icon={<ShieldCheck />} label="策略边界" value="安全" helper="未进入模拟盘 / 实盘" tone="green" />
        <MetricCard icon={<CircleDot />} label="失败任务" value={String(failed)} helper="异常路径可追踪" tone="amber" />
        <MetricCard icon={<Activity />} label="运行任务" value={String(running)} helper="队列状态监控" tone="cyan" />
        <MetricCard icon={<Zap />} label="实盘交易" value="已禁用" helper="Phase6 明确禁用" tone="violet" />
      </section>
      <article className="glass-card risk-console">
        <CardHeader icon={<ShieldCheck />} title="边界护栏" subtitle="当前阶段约束检查" />
        {['未接入 Broker / QMT / PTrade', '未启用模拟交易子系统', '未启用实盘交易子系统', '未启用 OptimizationService', '未引入机器学习依赖'].map((item) => (
          <div className="guard-row" key={item}><span className="pulse live" />{item}<strong>通过</strong></div>
        ))}
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
