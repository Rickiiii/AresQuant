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
  Gauge,
  GitBranch,
  Layers3,
  LineChart,
  ListChecks,
  Radar,
  RefreshCcw,
  Search,
  ShieldCheck,
  Sparkles,
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

type Overview = {
  readonly dataCenter: {
    readonly stockCount: number;
    readonly dailyBarCount: number;
    readonly latestDailyBarDate: string | null;
    readonly financialFactorCount: number;
    readonly latestFinancialFactorDate: string | null;
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
  readonly marketState: 'fallback';
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

type ResearchData = {
  readonly playbooks: readonly ResearchPlaybook[];
  readonly dailyNote: ResearchDailyNote;
  readonly portfolioReview: ResearchPortfolioReview;
  readonly portfolioContext: ResearchPortfolioContext;
  readonly ideas: readonly ResearchIdea[];
  readonly theses: readonly ResearchThesis[];
  readonly catalysts: readonly ResearchCatalyst[];
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
      name: 'Multi-Factor Strategy',
      version: '1.0.0',
      description: 'Weighted multi-factor TopN stock selection strategy for robust A-share ranking.',
      configSchema: [
        { name: 'maxPositions', type: 'number', required: true, defaultValue: 3, description: 'Maximum number of selected securities.' },
        { name: 'normalizeMethod', type: 'string', required: true, defaultValue: 'rank', description: 'Factor normalization method: rank, zscore, or minmax.' },
        { name: 'factors', type: 'array', required: true, defaultValue: 'momentum / roe / pe', description: 'Weighted factor definitions.' },
      ],
    },
    {
      code: 'momentum-top-n',
      name: 'Momentum Top N Strategy',
      version: '1.0.0',
      description: 'Select top N securities by momentum score and rebalance with controlled turnover.',
      configSchema: [{ name: 'maxPositions', type: 'number', required: true, defaultValue: 3, description: 'Maximum selected securities.' }],
    },
    {
      code: 'equal-weight',
      name: 'Equal Weight Strategy',
      version: '1.0.0',
      description: 'Allocate equal weights across selected securities as a transparent benchmark.',
      configSchema: [{ name: 'maxPositions', type: 'number', required: true, defaultValue: 3, description: 'Maximum selected securities.' }],
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
    { code: 'daily-note', name: 'Daily / Intraday Note', description: '盘前、14:30 和收盘复盘，把行情翻译成持仓动作。', output: ['市场温度', '主题强弱', '持仓检查', '操作建议'] },
    { code: 'idea-generation', name: 'Idea Generation', description: '结合主题、因子和估值生成可解释观察标的。', output: ['候选标的', '因子拆解', '风险', '触发条件'] },
    { code: 'portfolio-review', name: 'Portfolio Review', description: '检查股票、基金、现金和主题暴露。', output: ['仓位状态', '主题暴露', '调仓优先级'] },
    { code: 'thesis-tracker', name: 'Thesis Tracker', description: '记录每个持仓为什么持有、什么情况下改变。', output: ['核心逻辑', '反证条件', '退出规则'] },
    { code: 'catalyst-calendar', name: 'Catalyst Calendar', description: '跟踪政策、产业、财报和海外科技映射。', output: ['事件', '影响主题', '当前应对'] },
  ],
  dailyNote: {
    title: 'AresQuant Research Center Preview',
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
    nextFocus: ['接入真实 Portfolio Context', '接入主题强弱数据', '记录上次判断 vs 今日验证'],
  },
  portfolioReview: {
    positioning: {
      stockExposure: 'A 股账户半仓不到，仍有分批加仓空间。',
      fundExposure: '纳指100、通信设备、数字经济/大科技、黄金、中证1000、人工智能、绿电等暴露待结构化。',
      cashLevel: '保留风格切换和回撤买点弹药。',
      overallRisk: 'medium',
    },
    themeExposures: [
      { theme: 'AI / 机器人 / 物理 AI', status: '核心观察', suggestion: '等强弱确认后再分批，不追高。' },
      { theme: '通信设备 / CPO', status: '已有较高基金暴露', suggestion: '上涨看止盈节奏，下跌看 thesis 是否破坏。' },
      { theme: '黄金', status: '避险平衡', suggestion: '用于平衡科技高波动暴露。' },
    ],
    priorities: ['先控制主题拥挤风险', '再寻找强主题回踩买点', '保留现金应对风格切换'],
    riskNotes: ['当前页面为 fallback，不构成买卖建议。'],
  },
  portfolioContext: {
    owner: 'Ricki',
    accountScope: 'A 股账户 + 可见基金持仓',
    stockAccount: {
      positionLevel: '半仓不到',
      positions: [
        { symbol: '600366', name: '宁波韵升', quantity: 800, costPrice: 13.47, theme: '机器人 / 新材料 / 磁材', thesis: '物理 AI 与机器人链条观察标的。', actionBias: 'hold' },
        { symbol: '601689', name: '拓普集团', quantity: 200, costPrice: 69.62, theme: '机器人 / 汽车零部件', thesis: '机器人和智能汽车弹性方向。', actionBias: 'hold' },
        { symbol: '002031', name: '巨轮智能', quantity: 1500, costPrice: 8.37, theme: '机器人 / 智能装备', thesis: '高弹性机器人方向，需风控约束。', actionBias: 'watch' },
        { symbol: '002714', name: '牧原股份', quantity: 100, costPrice: 44.67, theme: '消费 / 农牧周期', thesis: '周期/消费平衡仓。', actionBias: 'hold' },
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
      ],
    },
    watchThemes: ['物理 AI', '机器人', 'AI ETF', '通信设备 / CPO', '黄金', '中证1000', '绿电', '恒生科技'],
    riskFlags: ['科技成长暴露集中，主题退潮会放大波动。', '机器人/物理 AI 股票和基金方向存在同向拥挤。', '绿电当前降低加仓优先级。'],
    actionPolicy: {
      allowedActions: ['hold', 'add', 'build', 'watch', 'take_profit', 'risk_control'],
      defaultBias: 'watch',
      rules: ['无真实信号确认前默认观察。', '分批加仓必须有触发条件、反证条件和风控条件。'],
    },
  },
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
      status: 'active',
      currentAction: 'hold',
      pillars: ['围绕 AI、机器人、通信设备、大科技和黄金构建中期框架。', '当前仓位半仓不到，保留分批调整空间。'],
      risks: ['主题暴露集中', '高波动方向退潮时回撤较快'],
      disconfirmingEvidence: ['主线主题连续走弱', '持仓 thesis 被反向证据破坏'],
    },
  ],
  catalysts: [
    { date: 'rolling', category: 'policy', title: 'AI / 机器人 / 数字经济政策与产业催化', relatedThemes: ['AI', '机器人', '通信设备'], impactLevel: 'high', currentResponse: '高优先级跟踪，等待具体事件日期和影响标的接入。' },
  ],
};

const navItems: readonly { readonly key: ViewKey; readonly label: string; readonly icon: React.ReactNode }[] = [
  { key: 'overview', label: 'Overview', icon: <AreaChart size={16} /> },
  { key: 'data', label: 'Data Center', icon: <DatabaseZap size={16} /> },
  { key: 'strategies', label: 'Strategies', icon: <BrainCircuit size={16} /> },
  { key: 'backtests', label: 'Backtests', icon: <Gauge size={16} /> },
  { key: 'research', label: 'Research Center', icon: <Sparkles size={16} /> },
  { key: 'risk', label: 'Risk Monitor', icon: <ShieldCheck size={16} /> },
];

const equityPoints = [24, 34, 29, 48, 58, 52, 74, 66, 84, 92, 86, 98];
const factorRows = [
  { name: 'momentum', weight: '45%', direction: 'positive', score: 91 },
  { name: 'roe', weight: '35%', direction: 'positive', score: 84 },
  { name: 'pe', weight: '20%', direction: 'negative', score: 76 },
];
const stockRows = [
  ['000001.SZ', '平安银行', '银行', '20260514', 'active'],
  ['600000.SH', '浦发银行', '银行', '20260514', 'active'],
  ['000333.SZ', '美的集团', '家电', '20260514', 'active'],
  ['600519.SH', '贵州茅台', '白酒', '20260514', 'active'],
];

async function fetchApi<T>(path: string): Promise<T> {
  const response = await fetch(`${apiBaseUrl}${path}`);
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
  const [playbooks, dailyNote, portfolioReview, portfolioContext, ideas, theses, catalysts] = await Promise.all([
    fetchApi<readonly ResearchPlaybook[]>('/research/playbooks'),
    fetchApi<ResearchDailyNote>('/research/daily-note'),
    fetchApi<ResearchPortfolioReview>('/research/portfolio-review'),
    fetchApi<ResearchPortfolioContext>('/research/portfolio-context'),
    fetchApi<readonly ResearchIdea[]>('/research/ideas'),
    fetchApi<readonly ResearchThesis[]>('/research/theses'),
    fetchApi<readonly ResearchCatalyst[]>('/research/catalysts'),
  ]);
  return { playbooks, dailyNote, portfolioReview, portfolioContext, ideas, theses, catalysts };
}

function useDashboardData(): { readonly data: DashboardData; readonly isLive: boolean; readonly refreshedAt: string } {
  const [state, setState] = React.useState<{ readonly data: DashboardData; readonly isLive: boolean; readonly refreshedAt: string }>({
    data: fallbackData,
    isLive: false,
    refreshedAt: new Date().toLocaleTimeString('zh-CN', { hour12: false }),
  });

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

  return state;
}

function useResearchData(): { readonly data: ResearchData; readonly isLive: boolean } {
  const [state, setState] = React.useState<{ readonly data: ResearchData; readonly isLive: boolean }>({
    data: fallbackResearchData,
    isLive: false,
  });

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

  return state;
}

function formatNumber(value: number): string {
  return new Intl.NumberFormat('zh-CN').format(value);
}

function formatMoney(value: string): string {
  return `¥${formatNumber(Number(value))}`;
}

function formatPercent(value: number): string {
  return `${value.toFixed(1)}%`;
}

function getSuccessRate(data: DashboardData): number {
  const successCount = data.overview.backtests.byStatus.SUCCESS ?? 0;
  const totalBacktests = Math.max(data.overview.backtests.total, 1);
  return (successCount / totalBacktests) * 100;
}

function App(): React.ReactElement {
  const { data, isLive, refreshedAt } = useDashboardData();
  const { data: researchData, isLive: isResearchLive } = useResearchData();
  const [activeView, setActiveView] = React.useState<ViewKey>('overview');
  const coverage = Object.values(data.dataCenter);
  const successRate = getSuccessRate(data);

  return (
    <main className="app-shell">
      <div className="aurora aurora-one" />
      <div className="aurora aurora-two" />
      <aside className="sidebar">
        <div className="brand-block">
          <div className="brand-mark"><CandlestickChart size={22} /></div>
          <div>
            <strong>AresQuant</strong>
            <span>A-share strategy OS</span>
          </div>
        </div>

        <div className="command-box">
          <Search size={15} />
          <span>Search strategies, symbols...</span>
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
            <div className="pulse-row"><span className={isLive ? 'pulse live' : 'pulse'} />{isLive ? 'Live API connected' : 'Preview fallback'}</div>
            <p>Phase6 Dashboard 正在使用后端聚合接口，前端可独立预览。</p>
          </div>
        </div>
      </aside>

      <section className="content-panel">
        <TopBar activeView={activeView} refreshedAt={refreshedAt} />
        {activeView === 'overview' && <OverviewView coverage={coverage} data={data} successRate={successRate} />}
        {activeView === 'data' && <DataCenterView coverage={coverage} />}
        {activeView === 'strategies' && <StrategiesView strategies={data.strategies} />}
        {activeView === 'backtests' && <BacktestsView backtests={data.backtests} byStatus={data.overview.backtests.byStatus} />}
        {activeView === 'research' && <ResearchView data={researchData} isLive={isResearchLive} />}
        {activeView === 'risk' && <RiskView data={data} />}
      </section>
    </main>
  );
}

function TopBar(props: { readonly activeView: ViewKey; readonly refreshedAt: string }): React.ReactElement {
  const titleMap: Readonly<Record<ViewKey, string>> = {
    overview: 'Unified Command Center',
    data: 'Data Center Observatory',
    strategies: 'Strategy Laboratory',
    backtests: 'Backtest Control Room',
    research: 'Research Center',
    risk: 'Risk Monitor',
  };

  return (
    <header className="top-bar">
      <div>
        <div className="breadcrumb"><Sparkles size={14} /> Phase6 Dashboard <span>/</span> {titleMap[props.activeView]}</div>
        <h1>{titleMap[props.activeView]}</h1>
      </div>
      <div className="top-actions">
        <span className="timestamp">Last refresh {props.refreshedAt}</span>
        <button className="primary-action"><RefreshCcw size={16} /> Refresh telemetry</button>
      </div>
    </header>
  );
}

function OverviewView(props: { readonly data: DashboardData; readonly coverage: readonly DataCoverage[]; readonly successRate: number }): React.ReactElement {
  const successCount = props.data.overview.backtests.byStatus.SUCCESS ?? 0;

  return (
    <div className="view-stack">
      <section className="hero-card">
        <div>
          <div className="eyebrow"><Zap size={14} /> Quant Intelligence Layer</div>
          <h2>策略、数据与回测的统一量化驾驶舱</h2>
          <p>从数据覆盖到策略配置，再到回测表现与风险状态，AresQuant Dashboard 将 A 股量化研究流程压缩进一个高密度、可观测的操作界面。</p>
        </div>
        <div className="hero-orb"><Radar size={52} /></div>
      </section>

      <section className="metric-grid">
        <MetricCard icon={<DatabaseZap />} label="股票池" value={formatNumber(props.data.overview.dataCenter.stockCount)} helper={`最新 ${props.data.overview.dataCenter.latestDailyBarDate ?? '--'}`} tone="violet" />
        <MetricCard icon={<BarChart3 />} label="日线记录" value={formatNumber(props.data.overview.dataCenter.dailyBarCount)} helper="行情数据覆盖" tone="cyan" />
        <MetricCard icon={<BrainCircuit />} label="策略数量" value={String(props.data.overview.strategies.total)} helper={props.data.overview.strategies.codes.join(' / ')} tone="green" />
        <MetricCard icon={<Activity />} label="回测成功率" value={formatPercent(props.successRate)} helper={`${successCount}/${props.data.overview.backtests.total} successful`} tone="amber" />
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

function DataCenterView(props: { readonly coverage: readonly DataCoverage[] }): React.ReactElement {
  const maxTotal = Math.max(...props.coverage.map((item) => item.total), 1);

  return (
    <div className="view-stack">
      <section className="split-grid data-hero-grid">
        <article className="glass-card xl-card">
          <CardHeader icon={<DatabaseZap />} title="Coverage Matrix" subtitle="数据集覆盖、最新同步日期和相对完整度" />
          <div className="coverage-matrix">
            {props.coverage.map((item) => (
              <div className="matrix-row" key={item.dataSet}>
                <div>
                  <strong>{item.dataSet}</strong>
                  <span>{item.latestDate ?? 'not synced'}</span>
                </div>
                <div className="matrix-bar"><i style={{ width: `${Math.max(8, (item.total / maxTotal) * 100)}%` }} /></div>
                <em>{formatNumber(item.total)}</em>
              </div>
            ))}
          </div>
        </article>
        <article className="glass-card sync-card">
          <CardHeader icon={<Waves />} title="Sync Pulse" subtitle="最近数据同步节奏" />
          <div className="pulse-chart">
            {props.coverage.slice(0, 8).map((item, index) => <i key={item.dataSet} style={{ height: `${38 + ((index * 19) % 92)}px` }} />)}
          </div>
          <p className="muted-copy">数据层当前支持 stocks、dailyBars、financialFactors、adjFactors、tradingCalendar 等 Dashboard 只读聚合。</p>
        </article>
      </section>

      <article className="glass-card">
        <CardHeader icon={<Table2 />} title="Stock Universe Preview" subtitle="股票池展示表格样式预览" />
        <div className="data-table">
          <div className="table-head"><span>TS Code</span><span>Name</span><span>Industry</span><span>Latest</span><span>Status</span></div>
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
            <h2>{strategy.name}</h2>
            <p>{strategy.description}</p>
            <div className="schema-list">
              {strategy.configSchema.map((field) => (
                <div className="schema-row" key={field.name}>
                  <div><strong>{field.name}</strong><span>{field.description}</span></div>
                  <em>{field.type}{field.required ? ' · required' : ''}</em>
                </div>
              ))}
            </div>
          </article>
        ))}
      </section>

      <section className="split-grid">
        <article className="glass-card">
          <CardHeader icon={<Layers3 />} title="Factor Weights" subtitle="Multi-factor strategy preview" />
          <div className="factor-list">
            {factorRows.map((factor) => (
              <div className="factor-row" key={factor.name}>
                <div><strong>{factor.name}</strong><span>{factor.direction} · weight {factor.weight}</span></div>
                <div className="radial-score" style={{ '--score': `${factor.score}%` } as React.CSSProperties}>{factor.score}</div>
              </div>
            ))}
          </div>
        </article>
        <article className="glass-card">
          <CardHeader icon={<GitBranch />} title="Signal Sample" subtitle="Dashboard sample output" />
          <div className="signal-grid">
            {['000001', '600000', '000333'].map((symbol, index) => (
              <div className="signal-card" key={symbol}>
                <span>{symbol}</span>
                <strong>{formatPercent(33.3 - index * 2.1)}</strong>
                <small>target weight</small>
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
        <CardHeader icon={<ListChecks />} title="Backtest Runs" subtitle="任务列表、策略、资金与状态" />
        <div className="data-table backtest-table">
          <div className="table-head"><span>Name</span><span>Strategy</span><span>Range</span><span>Capital</span><span>Status</span></div>
          {props.backtests.map((task) => (
            <div className="table-row" key={task.id}>
              <span>{task.name}</span>
              <span>{task.strategyName}</span>
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

function ResearchView(props: { readonly data: ResearchData; readonly isLive: boolean }): React.ReactElement {
  const daily = props.data.dailyNote;
  const context = props.data.portfolioContext;
  const stockMarketValue = context.stockAccount.positions.reduce((sum, item) => sum + item.quantity * item.costPrice, 0);
  const topFundExposures = context.fundAccount.exposures.slice(0, 6);
  const actionBuckets = [
    ['分批加仓', daily.actionBuckets.build],
    ['观察', daily.actionBuckets.watch],
    ['风控', daily.actionBuckets.riskControl],
    ['止盈', daily.actionBuckets.takeProfit],
  ] as const;

  return (
    <div className="view-stack research-view">
      <section className="hero-card research-hero">
        <div>
          <div className="eyebrow"><Sparkles size={14} /> {props.isLive ? 'Research API live' : 'Research fallback preview'}</div>
          <h2>把行情、持仓和策略信号翻译成可执行的 A 股投研动作</h2>
          <p>{daily.topConclusion}</p>
        </div>
        <div className="hero-orb"><BrainCircuit size={52} /></div>
      </section>

      <section className="research-grid">
        <article className="glass-card research-note-card">
          <CardHeader icon={<Radar />} title={daily.title} subtitle="14:30 盘中复盘 / 盘前计划 / 收盘验证" />
          <div className="research-section-list">
            {daily.sections.map((section) => (
              <div className="research-section" key={section.code}>
                <strong>{section.title}</strong>
                {section.bullets.map((bullet) => <span key={bullet}>{bullet}</span>)}
              </div>
            ))}
          </div>
        </article>

        <article className="glass-card action-board">
          <CardHeader icon={<ListChecks />} title="Action Buckets" subtitle="所有建议必须落到固定动作分类" />
          {actionBuckets.map(([label, items]) => (
            <div className="action-row" key={label}>
              <span>{label}</span>
              <strong>{items.length}</strong>
              <small>{items[0] ?? '等待真实信号确认'}</small>
            </div>
          ))}
          <div className="policy-strip">
            <strong>默认动作：{context.actionPolicy.defaultBias}</strong>
            {context.actionPolicy.rules.map((rule) => <span key={rule}>{rule}</span>)}
          </div>
        </article>
      </section>

      <section className="research-grid portfolio-context-grid">
        <article className="glass-card">
          <CardHeader icon={<CandlestickChart />} title={`${context.owner} 股票持仓`} subtitle={`${context.accountScope} · ${context.stockAccount.positionLevel}`} />
          <div className="portfolio-stat-row">
            <div><span>成本口径合计</span><strong>¥{formatNumber(Math.round(stockMarketValue))}</strong></div>
            <div><span>持仓数</span><strong>{context.stockAccount.positions.length}</strong></div>
            <div><span>动作基准</span><strong>{context.actionPolicy.defaultBias}</strong></div>
          </div>
          <div className="position-list">
            {context.stockAccount.positions.map((position) => (
              <div className="position-card" key={position.symbol}>
                <div className="strategy-topline"><span className="strategy-code">{position.symbol}</span><span className="version-pill">{position.actionBias}</span></div>
                <strong>{position.name}</strong>
                <span>{position.quantity} 股 @ ¥{position.costPrice.toFixed(2)} · {position.theme}</span>
                <p>{position.thesis}</p>
              </div>
            ))}
          </div>
        </article>

        <article className="glass-card">
          <CardHeader icon={<Layers3 />} title="基金/主题暴露" subtitle={`可见基金 ${formatNumber(context.fundAccount.visibleAssetValue)} / 账户约 ${formatNumber(context.fundAccount.totalAssetValue)}`} />
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
        <CardHeader icon={<ShieldCheck />} title="Portfolio Risk Flags" subtitle="后续所有建议都必须先通过这些组合约束" />
        <div className="risk-flag-grid">
          {context.riskFlags.map((flag) => <div className="risk-flag" key={flag}><span className="pulse warning" />{flag}</div>)}
        </div>
      </article>

      <section className="research-grid three-way">
        <article className="glass-card">
          <CardHeader icon={<Activity />} title="Portfolio Context" subtitle={`整体风险：${props.data.portfolioReview.positioning.overallRisk}`} />
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
          <CardHeader icon={<Zap />} title="Idea Engine" subtitle="可解释观察标的" />
          {props.data.ideas.map((idea) => (
            <div className="idea-card" key={idea.symbol}>
              <div className="strategy-topline"><span className="strategy-code">{idea.symbol}</span><span className="version-pill">{idea.suggestedAction}</span></div>
              <h3>{idea.name}</h3>
              <p>{idea.oneLineThesis}</p>
              <div className="factor-mini-list">
                {idea.factorBreakdown.map((factor) => <span key={factor.factor}>{factor.factor}: {factor.signal}</span>)}
              </div>
            </div>
          ))}
        </article>

        <article className="glass-card">
          <CardHeader icon={<GitBranch />} title="Thesis & Catalysts" subtitle="为什么持有，以及什么会改变判断" />
          {props.data.theses.map((thesis) => (
            <div className="thesis-card" key={thesis.target}>
              <strong>{thesis.target}</strong>
              <span>{thesis.status} · {thesis.currentAction}</span>
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
        <CardHeader icon={<Table2 />} title="Research Playbooks" subtitle="吸收成熟投研产品工作流，但围绕 Ricki 的 A 股持仓重构" />
        <div className="playbook-grid">
          {props.data.playbooks.map((playbook) => (
            <div className="playbook-card" key={playbook.code}>
              <strong>{playbook.name}</strong>
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
        <MetricCard icon={<ShieldCheck />} label="策略边界" value="Safe" helper="未进入模拟盘 / 实盘" tone="green" />
        <MetricCard icon={<CircleDot />} label="失败任务" value={String(failed)} helper="异常路径可追踪" tone="amber" />
        <MetricCard icon={<Activity />} label="运行任务" value={String(running)} helper="队列状态监控" tone="cyan" />
        <MetricCard icon={<Zap />} label="Live Trading" value="Disabled" helper="Phase6 明确禁用" tone="violet" />
      </section>
      <article className="glass-card risk-console">
        <CardHeader icon={<ShieldCheck />} title="Boundary Guardrails" subtitle="当前阶段约束检查" />
        {['No Broker / QMT / PTrade integration', 'No paper trading subsystem', 'No live trading subsystem', 'No OptimizationService', 'No machine learning dependency'].map((item) => (
          <div className="guard-row" key={item}><span className="pulse live" />{item}<strong>PASS</strong></div>
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
      <CardHeader icon={<LineChart />} title="Equity telemetry" subtitle="净值曲线、回撤与收益节奏" />
      <div className="chart-surface">
        <svg viewBox="0 0 720 270" role="img" aria-label="equity curve">
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
        <div className="chart-chip"><TrendingUp size={14} /> +12.4% cumulative</div>
        <div className="chart-stats"><span>Sharpe 1.60</span><span>MaxDD 5.0%</span><span>Win 55%</span></div>
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
      <CardHeader icon={<ShieldCheck />} title="Backtest status" subtitle="任务状态分布" />
      <div className="status-stack">
        {Object.entries(props.byStatus).map(([status, count]) => (
          <div className="status-row" key={status}>
            <span>{status}</span>
            <div className="status-bar"><i style={{ width: `${Math.min(100, (count / total) * 100)}%` }} /></div>
            <strong>{count}</strong>
          </div>
        ))}
      </div>
      {props.latestTask && (
        <div className="latest-task">
          <span>Latest</span>
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
      <CardHeader icon={<Boxes />} title="Data coverage" subtitle="Count and latest date" />
      <div className="coverage-list">
        {props.coverage.map((item) => (
          <div className="coverage-item" key={item.dataSet}>
            <div><strong>{item.dataSet}</strong><span>{item.latestDate ?? 'not synced'}</span></div>
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
      <CardHeader icon={<GitBranch />} title="Strategies" subtitle="Config schema ready" />
      <div className="strategy-list">
        {props.strategies.map((strategy) => (
          <div className="strategy-card" key={strategy.code}>
            <div><strong>{strategy.name}</strong><span>{strategy.code} · v{strategy.version}</span></div>
            <p>{strategy.description}</p>
            <small>{strategy.configSchema.length} config fields</small>
          </div>
        ))}
      </div>
    </article>
  );
}

function BacktestsCompactCard(props: { readonly backtests: readonly BacktestItem[] }): React.ReactElement {
  return (
    <article className="glass-card">
      <CardHeader icon={<Gauge />} title="Recent backtests" subtitle="Dashboard summaries" />
      <div className="backtest-list">
        {props.backtests.slice(0, 4).map((task) => (
          <div className="backtest-item" key={task.id}>
            <StatusPill status={task.status} />
            <strong>{task.name}</strong>
            <small>{task.strategyName} · {task.initialCapital}</small>
          </div>
        ))}
      </div>
    </article>
  );
}

function StatusPill(props: { readonly status: string }): React.ReactElement {
  return <span className={`status-pill ${props.status.toLowerCase()}`}>{props.status}</span>;
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
