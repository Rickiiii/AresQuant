# AresQuant Product Vision and Roadmap

> **For Hermes:** Use the `writing-plans` and `test-driven-development` skills before implementing any roadmap phase. Advance one bounded step at a time, preserve phase boundaries, and avoid live trading, OptimizationService, machine learning, and complex paid dependencies unless Ricki explicitly requests them.

**Goal:** 将 AresQuant 打造成面向 A 股个人/半专业投资者的“数据 + 策略 + 回测 + 投研 + 复盘”一体化工作台。

**Architecture:** AresQuant 的核心不是简单复制市面产品，而是以本地可控数据中心和回测引擎为底座，把优秀投研产品的工作流产品化：行情数据结构化、策略可解释、持仓可跟踪、复盘可沉淀、建议有证据链。短期保持 NestJS + Prisma + React Dashboard 架构，不进入实盘交易、不接重型商业数据、不引入复杂 AI/ML 依赖。

**Tech Stack:** NestJS、TypeScript、Prisma、PostgreSQL、Redis/BullMQ、React/Vite、Eastmoney 公开数据源、Jest、ESLint。

---

## 1. 产品定位

AresQuant 应定位为：

> **A 股个人投研与策略工作台：用量化数据解释持仓，用投研框架生成行动，用复盘记录持续进化。**

它不应该只是一个回测系统，也不应该变成复杂券商终端的仿制品。它最独特的价值应该是：

1. **个人持仓上下文优先**：围绕 Ricki 的真实股票、基金、ETF、主题暴露和现金仓位工作。
2. **A 股交易规则原生**：T+1、涨跌停、停牌、100 股、费用、印花税、市场风格切换。
3. **研究逻辑可追踪**：每次买入、加仓、观望、止盈都有 thesis、触发条件和后续复盘。
4. **策略结果可解释**：多因子不是黑箱，而是展示每个标的为什么入选、哪里有风险。
5. **复盘可沉淀**：每天 14:30 复盘不是机械行情，而是持续比较“之前判断 vs 当前市场”。

---

## 2. 市面优秀产品参考与吸收方向

### 2.1 TradingView

**优点：**

- 图表体验极强
- 技术指标丰富
- 观察列表、提醒、社区脚本生态成熟

**AresQuant 可吸收：**

- Watchlist 观察池
- 标的卡片中的趋势、均线、成交量、强弱标签
- 策略信号可视化
- 简洁直观的图表交互

**不直接复制：**

- 不做完整专业图表终端
- 不追求海量技术指标
- 不做社交脚本生态

### 2.2 Wind / Choice / 同花顺 iFinD

**优点：**

- A 股数据全
- 财务、公告、研报、行业数据强
- 机构工作流成熟

**AresQuant 可吸收：**

- 数据中心质量意识
- 标的基本面摘要
- 行业/主题归因
- 财报和事件日历
- 研究报告式输出格式

**不直接复制：**

- 不做大而全终端
- 不依赖昂贵商业数据
- 不追求机构级所有字段覆盖

### 2.3 聚宽 / 米筐 / BigQuant

**优点：**

- 策略开发和回测体验完整
- 因子研究、选股、组合回测路径清晰

**AresQuant 可吸收：**

- 多因子研究流程
- 回测任务管理
- 策略参数化
- 结果对比、指标归因、调仓记录

**不直接复制：**

- 不做云端 Notebook 平台
- 不做海量公共策略市场
- 不引入复杂机器学习流水线，除非后续明确进入

### 2.4 Seeking Alpha / Koyfin / FinChat

**优点：**

- 投资 thesis、估值、财务可视化和报告感强
- 自然语言摘要友好
- 适合从“数据”走向“观点”

**AresQuant 可吸收：**

- 标的 investment thesis 页面
- 持仓观点变化记录
- 估值与基本面摘要
- 可读性强的日报/周报/组合复盘

**不直接复制：**

- 不做海外股票数据库
- 不做全市场新闻社区

### 2.5 Anthropic financial-services

**优点：**

- 投研 Agent / Skill / Workflow 结构清晰
- morning note、idea generation、thesis tracker、catalyst calendar 等流程很成熟

**AresQuant 可吸收：**

- A 股化 Morning Note
- A 股 Idea Generation
- 持仓 Thesis Tracker
- Catalyst Calendar
- Portfolio Review / Rebalance 框架

**不直接复制：**

- 不直接迁移 Claude 插件结构
- 不接它列出的付费 MCP 数据源
- 不做投行、KYC、基金会计运营模块

---

## 3. AresQuant 的独特性设计

### 3.1 “数据可信 + 观点可追踪”双引擎

市面上很多工具要么偏行情，要么偏聊天。AresQuant 应做成：

- 数据层：行情、估值、因子、回测结果、持仓暴露。
- 观点层：thesis、风险点、催化剂、操作建议、复盘记录。

每条建议都应该尽量有证据链：

```text
建议：继续持有 / 分批加仓 / 观望 / 止盈
依据：趋势 + 因子 + 估值 + 持仓权重 + 主题强弱 + 风险触发条件
反证：哪些数据出现会让这个建议失效
```

### 3.2 个人持仓驱动，而非全市场泛泛扫描

AresQuant 优先服务 Ricki 当前组合：

- A 股股票持仓
- 基金/ETF 持仓
- AI、机器人、物理 AI、通信设备、大科技、黄金、中证 1000、绿电等暴露
- 当前半仓不到、有继续加仓空间的状态

系统功能优先级：

1. 当前持仓是否健康
2. 当前仓位是否需要调整
3. 观察池里是否有更优选择
4. 市场风格是否支持继续加仓
5. 回测/因子是否支持这个判断

### 3.3 A 股本土化细节

必须保持 A 股特色：

- 涨跌停和 ST 规则
- T+1
- 100 股整数倍
- 北交所 / 科创板 / 创业板不同涨跌幅
- ETF / QDII / 场外基金与股票不同流动性和交易时点
- 政策、主题、行业轮动对短中期表现影响大

---

## 4. 产品模块路线图

## Phase 9：Research Center 基础层

**目标：** 增加投研工作台，但只做研究和展示，不做实盘、不做机器学习。

### 9.1 Research Playbooks 文档

新增文档：

- `docs/research-playbooks.md`
- `docs/product-vision-and-roadmap.md`（本文档）

定义 A 股化工作流，详见 [research-playbooks.md](research-playbooks.md)：

- Daily / Intraday Note
- Idea Generation
- Thesis Tracker
- Catalyst Calendar
- Portfolio Review

### 9.2 ResearchModule 后端骨架

建议新增：

```text
src/modules/research/
  research.module.ts
  domain/
    research.types.ts
    thesis.types.ts
    catalyst.types.ts
  application/
    research-playbook.service.ts
    portfolio-review.service.ts
    idea-generation.service.ts
    thesis-tracker.service.ts
  presentation/
    research.controller.ts
    dto/
      research.dto.ts
```

第一版只输出结构化 Mock/Fallback 数据，连接已有 Data / Strategy / Dashboard 聚合能力。

### 9.3 Research API

Phase 9 Step 2 已实现第一版 Research API，当前只返回结构化 fallback 数据：

```http
GET /research/playbooks
GET /research/daily-note
GET /research/portfolio-review
GET /research/portfolio-context
GET /research/theme-exposures
GET /research/ideas
GET /research/theses
GET /research/catalysts
```

后续迭代再把这些接口逐步连接真实 Data / Strategy / Portfolio Context。

### 9.4 Dashboard Research Center 页面

新增前端页面：

```text
Research Center
├── Today Note
├── Portfolio Review
├── Ideas
├── Thesis Tracker
└── Catalyst Calendar
```

第一版可以使用后端 API + 前端 fallback preview。

---

## Phase 10：Portfolio Context / 持仓上下文

**目标：** 让系统知道 Ricki 的真实持仓和基金暴露，所有建议围绕持仓展开。

**当前状态：** Phase 10 Step 1 已实现基础数据库模型、`PortfolioModule`、`GET /portfolio/context` 和 Research Center 优先读取 Portfolio Context 的集成。第一版只做只读上下文和暴露分析，不做交易、不做自动调仓。

### 10.1 持仓模型

已加入基础模型：

```text
PortfolioAccount
PortfolioHolding
FundHolding
ThemeExposure
WatchlistItem
```

字段关注：

- symbol / fundCode
- name
- quantity / amount
- costBasis
- latestPrice
- marketValue
- unrealizedPnl
- themeTags
- riskLevel

### 10.2 持仓暴露分析

当前 `GET /portfolio/context` 输出：

- 股票 / 基金 / ETF / 黄金 / 现金占比
- AI / 机器人 / 通信设备 / 大科技 / 绿电 / 小盘 / 海外科技暴露
- 当前仓位 vs 目标区间
- 加仓空间与风险预算

### 10.3 操作建议模板

建议分类固定为：

- 继续持有
- 分批加仓
- 观望
- 止盈
- 减仓风控
- 移入观察池
- 移出观察池

---

## Phase 11：Idea Engine / 选股想法生成器

**目标：** 把多因子系统从“策略 API”升级为“可解释选股想法”。

### 11.1 因子候选池

基于已有因子：

- Momentum
- Volatility
- PE
- PB
- ROE
- Turnover

输出候选：

```text
symbol
name
score
factorBreakdown
themeTags
whyNow
risks
suggestedAction
```

### 11.2 A 股主题观察池

优先主题：

- 物理 AI
- 机器人
- AI 算力 / CPO / 通信设备
- 大科技 / 数字经济
- 黄金
- 中证 1000 / 小盘风格
- 绿电
- 恒生科技 / 海外科技映射

### 11.3 Dashboard 展示

每个 idea card 展示：

- 总分
- 因子贡献
- 估值状态
- 动量状态
- 风险提示
- 操作建议
- 是否加入观察池

---

## Phase 12：Thesis Tracker / 持仓逻辑跟踪

**目标：** 每个持仓都维护“为什么持有”和“什么情况应该改变”。

### 12.1 Thesis 数据结构

```text
InvestmentThesis
ThesisPillar
ThesisRisk
ThesisUpdate
ThesisCatalyst
```

### 12.2 标准模板

```text
标的：
方向：持有 / 观察 / 减仓
核心逻辑：
支撑证据：
风险点：
催化剂：
退出条件：
最近更新：
当前结论：
```

### 12.3 与复盘联动

每天 14:30 / 收盘后检查：

- 今日走势是否强化 thesis
- 是否出现反证
- 是否触发加仓/减仓/止盈条件
- 是否需要更新观察池

---

## Phase 13：Daily Note / 复盘系统产品化

**目标：** 将 14:30 盘中复盘固化为系统功能，而不是只靠临时 cron 文本。

### 13.1 复盘结构

```text
1. 市场温度
2. 指数表现
3. 主题强弱
4. 持仓表现
5. 基金暴露影响
6. 今日异常信号
7. 操作建议
8. 明日关注
9. 上次判断回看
```

### 13.2 复盘质量要求

必须避免：

- 只报涨跌幅
- 没有持仓上下文
- 没有操作建议
- 没有风险提示
- 没有复盘之前判断

必须包含：

- 具体持仓/主题影响
- 加仓/观望/止盈/风控建议
- 判断置信度
- 反证条件

---

## Phase 14：Product Polish / 打磨成好用产品

**目标：** 让系统真正“好用、好看、独特”。

### 14.1 Dashboard 体验

优先打磨：

- 首页一屏看懂今日状态
- Research Center 页面视觉完整
- 持仓卡片漂亮、有信息密度
- Idea Card 可解释
- Backtest 结果对比清晰
- 移动端或窄屏可读

### 14.2 交互原则

- 每个页面都有明确的“下一步行动”
- 每个指标旁边有解释
- 每个建议都有依据
- 不展示暂时无法维护的复杂功能
- 保留 fallback preview，后端未启动时也能看 UI

### 14.3 质量门槛

每个阶段完成必须跑：

```bash
pnpm test
pnpm build
pnpm lint
pnpm prisma:validate
npx pnpm@11.1.1 --filter @ares-quant/web build
```

---

## 5. 明确不做 / 暂缓做的内容

除非 Ricki 明确要求，否则暂缓：

- 实盘交易
- Broker / QMT / PTrade
- 自动下单
- OptimizationService
- 机器学习选股系统
- 大规模付费数据源集成
- 投行 pitch deck / LBO / KYC / 基金会计运营
- 社区化、多人协作、权限系统

这些方向不是没有价值，而是会让当前产品过早复杂化，偏离“先打造一个好用、独特、可持续迭代的个人 A 股投研工作台”。

---

## 6. 建议的下一步实施顺序

### Next Step 1：新增 Research Playbooks 文档

创建：

```text
docs/research-playbooks.md
```

内容包括：

- A 股 Daily Note 模板
- A 股 Idea Generation 模板
- Portfolio Review 模板
- Thesis Tracker 模板
- Catalyst Calendar 模板

只写文档，不改代码。

### Next Step 2：ResearchModule 后端骨架

创建最小后端模块和只读 API，TDD：

```text
GET /research/playbooks
GET /research/daily-note
GET /research/portfolio-review
GET /research/ideas
```

第一版返回结构化 fallback 数据。

### Next Step 3：Dashboard Research Center 页面

前端新增 Research Center，先接 fallback 数据和已有后端 API。

### Next Step 4：连接真实 Data / Strategy / Dashboard 数据

逐步接入：

- 股票列表
- 指数日线
- 财务因子
- 多因子 sample signals
- 回测摘要

### Next Step 5：持仓上下文模块

再考虑数据库模型，沉淀真实持仓与 thesis。

---

## 7. 验收标准

AresQuant 的“完美”不是功能无限多，而是每次打开都能回答：

1. 今天市场环境适不适合加仓？
2. 我的持仓有没有风险？
3. 哪些主题在走强/走弱？
4. 哪些标的值得进入观察池？
5. 当前策略/因子支持哪些判断？
6. 之前的判断有没有被市场验证或证伪？
7. 我下一步应该继续持有、分批加仓、观望、止盈还是风控？

如果每个版本都围绕这些问题迭代，AresQuant 就会从普通量化 Demo 变成真正有用、独特、有个人风格的投研产品。
