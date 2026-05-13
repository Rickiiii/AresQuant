# AresQuant

AresQuant 是面向 A 股市场的量化交易系统。第一阶段已完成 NestJS 后端工程初始化、Prisma/PostgreSQL 数据模型设计、首个 migration、行情同步模块骨架、回测引擎基础框架和多因子策略插件框架。

## 技术栈

- Node.js + TypeScript + NestJS
- Prisma ORM + PostgreSQL
- Redis 配置预留
- Swagger API 文档：启动后访问 `/docs`

## 初始化

```powershell
pnpm install
Copy-Item .env.example .env
docker compose up -d
pnpm prisma:generate
pnpm prisma:deploy
pnpm start:dev
```

## 数据库设计

核心 Prisma schema 位于 `prisma/schema.prisma`，首个 PostgreSQL migration 位于 `prisma/migrations/20260514000100_init_ares_quant/migration.sql`。

第一阶段表：

- `securities`：证券主数据，覆盖股票、ETF、指数。
- `trading_calendars`：交易日历。
- `daily_bars`：A 股日线行情，包含涨跌停、停牌标记。
- `minute_bars`：分钟线行情。
- `adjustment_factors`：复权因子。
- `special_statuses`：ST、停牌、涨跌停约束数据。
- `corporate_actions`：分红送配等公司行为。
- `data_sync_jobs`：行情同步任务状态。
- `strategy_definitions`：插件化策略定义。
- `backtest_runs` 与 `backtest_equity_points`：回测任务与权益曲线。

## 模块边界

- `src/modules/data`：行情数据同步、清洗、Repository 抽象与 Prisma 实现。
- `src/modules/strategy`：策略插件注册表与多因子策略框架。
- `src/modules/backtest`：回测引擎基础服务，后续扩展 T+1、涨跌停、滑点、手续费和仓位控制。
- `src/database`：Prisma 客户端生命周期管理。
- `src/config`：环境变量驱动配置与启动校验。

## API

当前基础接口：

- `POST /data/daily-bars/sync`：触发日线行情同步任务。

请求示例：

```json
{
  "tsCode": "000001.SZ",
  "fromDate": "2026-01-01",
  "toDate": "2026-05-14"
}
```

## 质量约束

- TypeScript strict mode。
- ESLint 禁止显式 `any`。
- DTO 使用 `class-validator` 校验。
- 数据库写入通过 Repository 和 Prisma transaction 进入。
- 关键服务包含 Nest Logger。
