# AresQuant

AresQuant 是一个基于 NestJS + Prisma 的 A 股量化交易系统。当前后端已经具备 A 股数据中心、Mock 数据源、数据质量校验、复权价格计算，以及专业回测引擎的基础能力。

## 技术栈

- Node.js、TypeScript、NestJS
- Prisma ORM、PostgreSQL
- Redis 兼容服务，用于 BullMQ 任务队列
- Jest、ESLint
- Swagger 文档地址：`http://localhost:3000/docs`

## 快速启动

```powershell
pnpm install
Copy-Item .env.example .env
pnpm prisma:generate
pnpm prisma:deploy
pnpm start:dev
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
pnpm lint
pnpm prisma:validate
```

当前已验证状态：

- `pnpm build`：通过
- `pnpm test`：通过
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
    risk/
    trading/
    notification/
    portfolio/
  common/
  config/
  database/
  utils/
  scripts/
```

## 设计约束

- `.env` 不提交到仓库。
- 使用 `.env.example` 作为配置模板。
- 所有数据库写入必须通过 Repository。
- DTO 使用 `class-validator` 校验。
- 回测引擎中的资金、费用和价格计算使用 `Decimal`，避免浮点误差。
- 策略通过 StrategyRegistry 注册和获取，回测引擎不直接依赖具体策略实现。
