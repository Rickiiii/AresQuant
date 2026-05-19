# AresQuant

AresQuant 是一个基于 NestJS + Prisma 的 A 股量化交易系统。当前系统已经具备 A 股数据中心、Mock 数据源、东方财富真实数据源基础接入、数据质量校验、复权价格计算、专业回测引擎、多因子策略系统、正式策略回测接入，以及 Web Dashboard 的基础能力。

## 技术栈

- Node.js、TypeScript、NestJS
- Prisma ORM、PostgreSQL
- Redis 兼容服务，用于 BullMQ 任务队列
- Vite、React，用于 Web Dashboard
- Jest、ESLint
- Swagger 文档地址：`http://localhost:3000/docs`

## 快速启动

```powershell
pnpm install
Copy-Item .env.example .env
pnpm prisma:generate
pnpm prisma:deploy
pnpm start:dev

# 另开终端启动 Web Dashboard
npx pnpm@11.1.1 --filter @ares-quant/web dev
```

本地开发默认依赖：

- PostgreSQL：`localhost:5432`
- Redis 兼容服务：`localhost:6379`

## Phase 1：基础架构

Phase 1 已完成后端基础工程能力：

- NestJS 应用初始化
- 严格 TypeScript 配置
- Prisma 与 PostgreSQL 初始化
- Data、Strategy、Backtest、Risk、Trading、Notification、Portfolio 模块化目录
- Swagger 接入
- Data、Strategy、Backtest 基础模块骨架

## Phase 2：A 股数据中心

Phase 2 将 `DataModule` 扩展为可供回测使用的 A 股数据中心：

- 股票基础信息
- 交易日历
- 股票日线行情
- 指数日线行情
- 涨跌停价格
- 停牌信息
- 复权因子
- 财务因子
- 数据同步日志
- `DataProvider` 数据源抽象与 `MockDataProvider`
- 基于 Prisma 事务的 Repository Pattern
- 数据质量校验
- 前复权、后复权价格计算
- BullMQ 数据同步队列

详细文档：[docs/data-module.md](docs/data-module.md)

主要数据 API：

- `GET /data/stocks`
- `GET /data/stocks/:symbol`
- `GET /data/calendar?startDate=&endDate=`
- `GET /data/bars/daily?symbol=&startDate=&endDate=&adjustment=`
- `GET /data/bars/index?indexCode=&startDate=&endDate=`
- `GET /data/limit-prices?tradeDate=`
- `GET /data/suspensions?tradeDate=`
- `GET /data/financial-factors?symbol=`
- `POST /data/sync/stocks`
- `POST /data/sync/daily-bars`
- `POST /data/sync/all`
- `POST /data/quality/check`

同步 Mock 数据：

```powershell
Invoke-RestMethod -Uri http://localhost:3000/data/sync/all `
  -Method Post `
  -ContentType 'application/json' `
  -Body '{"startDate":"2026-05-11","endDate":"2026-05-15"}'
```

执行数据质量校验：

```powershell
Invoke-RestMethod -Uri http://localhost:3000/data/quality/check `
  -Method Post `
  -ContentType 'application/json' `
  -Body '{"symbol":"000001","startDate":"2026-05-11","endDate":"2026-05-15"}'
```

## Phase 3：专业 A 股回测引擎

Phase 3 已加入完整回测闭环：

- 回测任务管理
- 账户快照
- 持仓管理
- 订单管理
- 成交记录
- 绩效指标
- 撮合引擎
- A 股交易规则模拟
- 费用模型
- 滑点模型
- 组合管理
- 调仓订单生成
- 绩效分析
- StrategyRegistry 策略注册中心接入
- 基础 RiskService 风控接入

详细文档：[docs/backtest-engine.md](docs/backtest-engine.md)

## Phase 4：Strategy 基础架构

Phase 4 建立了新的正式 Strategy 架构，并与旧 Backtest 策略插件体系并存：

- `BaseStrategy`
- `StrategyService`
- `EqualWeightStrategy`
- `MomentumTopNStrategy`
- `StrategyModule`

旧 Backtest 仍继续使用 `StrategyRegistryService` 和旧 Plugin，不受新 Strategy 架构影响。

## Phase 5：多因子系统 + Strategy API

Phase 5 已加入正式多因子能力和 Strategy API：

- `Factor` 接口
- `BaseFactor`
- `FactorRegistryService`
- 内置因子：Momentum、Volatility、PE、PB、ROE、Turnover
- `FactorScoreService`：支持 `rank` / `zscore` / `minmax`、factor weights、正向 / 反向因子
- 正式 `MultiFactorStrategy`：基于 `BaseStrategy`，支持 TopN 选股和多因子加权
- `StrategyController`
- Strategy API DTO、Swagger 注解和测试

详细文档：

- [docs/factor-system.md](docs/factor-system.md)
- [docs/strategy-api.md](docs/strategy-api.md)

主要 Strategy API：

- `GET /strategies`
- `GET /strategies/:name`
- `POST /strategies/:name/validate-config`
- `POST /strategies/:name/signals`

当前支持的新策略 code：

- `equal-weight`
- `momentum-top-n`
- `multi-factor`

兼容说明：旧 Backtest 当前仍使用旧 `StrategyRegistryService` 和旧 Plugin，Phase 5 没有切换或重构旧 Backtest。

## Phase 6：Web Dashboard

Phase 6 已加入只读 Dashboard 聚合层和前端 Web 控制台：

- `DashboardModule`
- Dashboard Overview API
- Dashboard Backtest list / summary API
- Dashboard Data Center coverage API
- Dashboard Strategy API
- `apps/web` Vite + React + TypeScript 前端
- 暗色量化 Dashboard UI
- Overview、Data Center、Strategies、Backtests、Risk Monitor 多视图
- 前端 fallback preview 数据，后端未启动时也可预览 UI

详细文档：[docs/dashboard.md](docs/dashboard.md)

主要 Dashboard API：

- `GET /dashboard/overview`
- `GET /dashboard/backtests`
- `GET /dashboard/backtests/:id/summary`
- `GET /dashboard/data-center`
- `GET /dashboard/data-center/stocks`
- `GET /dashboard/data-center/daily-bars/coverage`
- `GET /dashboard/data-center/financial-factors/coverage`
- `GET /dashboard/strategies`
- `GET /dashboard/strategies/:code`
- `GET /dashboard/strategies/:code/sample-signals`

启动前端：

```powershell
npx pnpm@11.1.1 --filter @ares-quant/web dev
```

前端默认地址：

```text
http://localhost:5173
```

Phase 6 只做 Dashboard API 与展示层，没有进入模拟盘、实盘、Broker/QMT/PTrade、OptimizationService 或机器学习系统。

## Phase 7：正式 Strategy 接入回测引擎

Phase 7 已把正式 Strategy 架构接入 `BacktestEngineService`：

- 回测引擎优先通过 `StrategyService` 查找正式策略
- 支持在 `POST /backtests` 中直接使用正式策略 code：
  - `equal-weight`
  - `momentum-top-n`
  - `multi-factor`
- 找不到正式策略时自动回退旧 `StrategyRegistryService` plugin
- 保留旧 `equal_weight_mock` 等旧插件兼容
- 新增可选 `strategyConfig`，用于传入正式策略参数
- 回测循环会向正式策略提供 universe、market data、momentum scores、factor values 和当前持仓快照

Phase 7 没有进入模拟盘、实盘、Broker/QMT/PTrade、OptimizationService 或机器学习系统。

## Phase 8：东方财富真实数据源基础接入

Phase 8 Step 1 已加入 `EastmoneyDataProvider`，用于在本地没有历史数据文件时从东方财富公开 Web 接口拉取基础研究数据。Phase 8 Step 2 已为东方财富请求增加 8 秒超时、瞬时网络异常重试和 429/5xx 响应重试；后续 Step 已补充涨跌停价推导、PE/PB/PS 估值快照和只读 smoke check：

- `DATA_PROVIDER=mock`：默认 Mock 数据源
- `DATA_PROVIDER=eastmoney`：启用东方财富数据源
- 支持 A 股股票列表
- 支持股票日线 K 线
- 支持指数日线 K 线
- 通过沪深 300 指数 K 线推导交易日历
- 基于列表行情昨收价推导涨跌停价
- 基于个股快照读取 PE/PB/PS 估值字段
- `POST /data/sync/eastmoney/smoke-check` 只读诊断公开接口可用性

详细文档：[docs/eastmoney-data-provider.md](docs/eastmoney-data-provider.md)

## Product Vision：A 股投研工作台

AresQuant 后续产品化方向是从“数据 + 回测 + 策略”继续升级为“数据 + 策略 + 回测 + 投研 + 复盘”的 A 股个人投研工作台。路线图会吸收 TradingView、Wind/Choice、聚宽/米筐、Seeking Alpha/FinChat、Anthropic financial-services 等产品的优秀工作流，但保持 A 股本土化、个人持仓上下文优先、建议可解释、复盘可沉淀。

详细路线图：[docs/product-vision-and-roadmap.md](docs/product-vision-and-roadmap.md)

A 股投研工作流：[docs/research-playbooks.md](docs/research-playbooks.md)

Phase 9 Step 2 已加入 `ResearchModule` 第一版只读 API，用 fallback 数据把 Research Center 产品形态先跑起来：

- `GET /research/playbooks`：查看 A 股投研工作流模板
- `GET /research/daily-note`：盘前/盘中/收盘复盘结构化输出
- `GET /research/portfolio-review`：组合体检 fallback 输出
- `GET /research/portfolio-context`：Ricki 股票持仓、基金暴露、观察主题、风险旗标和动作规则
- `GET /research/ideas`：选股想法 fallback 输出
- `GET /research/theses`：持仓 thesis fallback 输出
- `GET /research/catalysts`：催化剂日历 fallback 输出

当前东方财富接入仅用于研究/回测数据补全，不作为生产交易数据源；停复牌和复权因子后续单独扩展。

当前支持的撮合和交易规则：

- 停牌股票不能成交
- 涨停股票默认不能买入
- 跌停股票默认不能卖出
- T+1 卖出限制
- 资金不足拒单
- 持仓不足拒单
- 100 股整数倍交易规则
- 最低佣金
- 佣金、印花税、过户费
- 滑点
- 市价单与限价单模型

主要回测 API：

- `POST /backtests`
- `GET /backtests`
- `GET /backtests/:id`
- `GET /backtests/:id/orders`
- `GET /backtests/:id/trades`
- `GET /backtests/:id/positions`
- `GET /backtests/:id/snapshots`
- `GET /backtests/:id/metrics`
- `DELETE /backtests/:id`

运行一次 Mock 回测：

```powershell
Invoke-RestMethod -Uri http://localhost:3000/backtests `
  -Method Post `
  -ContentType 'application/json' `
  -Body '{"name":"Phase 3 Mock Backtest","strategyName":"equal_weight_mock","startDate":"2026-05-11","endDate":"2026-05-15","initialCapital":1000000,"benchmark":"000300.SH","rebalanceFrequency":1,"maxPositions":2,"maxPositionWeight":0.5,"commissionRate":0.00025,"slippageRate":0.0005,"priceMode":"CLOSE"}'
```

## 质量检查

```powershell
pnpm build
pnpm test
npx pnpm@11.1.1 --filter @ares-quant/web build
pnpm lint
pnpm prisma:validate
```

当前已验证状态：

- `pnpm build`：通过
- `pnpm test`：通过
- `npx pnpm@11.1.1 --filter @ares-quant/web build`：通过
- `pnpm lint`：通过
- `pnpm prisma:validate`：通过
- Prisma migrations：已在本地应用

## 项目结构

```text
src/
  modules/
    data/
    strategy/
    backtest/
    dashboard/
    risk/
    trading/
    notification/
    portfolio/
  common/
  config/
  database/
  utils/
  scripts/
apps/
  web/
```

## 设计约束

- `.env` 不提交到仓库。
- 使用 `.env.example` 作为配置模板。
- 所有数据库写入必须通过 Repository。
- DTO 使用 `class-validator` 校验。
- 回测引擎中的资金、费用和价格计算使用 `Decimal`，避免浮点误差。
- 策略优先通过正式 `StrategyService` 注册和获取，回测引擎找不到正式策略时回退旧 `StrategyRegistryService` 插件。
