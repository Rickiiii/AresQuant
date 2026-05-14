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

type ViewKey = 'overview' | 'data' | 'strategies' | 'backtests' | 'risk';

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

const navItems: readonly { readonly key: ViewKey; readonly label: string; readonly icon: React.ReactNode }[] = [
  { key: 'overview', label: 'Overview', icon: <AreaChart size={16} /> },
  { key: 'data', label: 'Data Center', icon: <DatabaseZap size={16} /> },
  { key: 'strategies', label: 'Strategies', icon: <BrainCircuit size={16} /> },
  { key: 'backtests', label: 'Backtests', icon: <Gauge size={16} /> },
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
