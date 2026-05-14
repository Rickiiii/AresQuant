# Phase 6：Web Dashboard

Phase 6 为 AresQuant 增加了只读 Dashboard 聚合层和前端 Web 控制台，用于把数据中心、策略系统和回测结果集中展示在一个面向研究流程的界面中。

> 范围边界：Phase 6 只做 Dashboard API 与前端展示，不进入模拟盘、实盘、Broker/QMT/PTrade、OptimizationService 或机器学习系统。

## 模块目标

Dashboard 模块负责把已有后端能力聚合为前端友好的只读接口：

- Overview：数据中心、策略和回测任务总览
- Backtests：回测列表和单任务摘要
- Data Center：数据集覆盖度和股票池列表
- Strategies：策略列表、配置 schema 和样例信号
- Web UI：暗色量化 Dashboard 前端

Dashboard 不替代原有业务 API：

- `/data/*` 仍是数据中心正式 API
- `/strategies/*` 仍是正式 Strategy API
- `/backtests/*` 仍是回测任务正式 API
- `/dashboard/*` 只做展示聚合

## 后端接口

### Overview

```http
GET /dashboard/overview
```

返回：

- 股票池数量
- 日线数量和最新日期
- 财务因子数量和最新日期
- 策略数量和 code 列表
- 回测任务数量、状态分布和最新任务

### Backtests

```http
GET /dashboard/backtests
GET /dashboard/backtests/:id/summary
```

`GET /dashboard/backtests` 返回 Dashboard 列表项：

- id
- name
- strategyName
- status
- startDate / endDate
- initialCapital
- benchmark
- errorMessage

`GET /dashboard/backtests/:id/summary` 返回单任务详情摘要：

- task
- metrics
- equityCurve
- positions：历史持仓快照，包含可选 `tradeDate`
- orders：订单聚合统计
- trades：成交聚合统计

### Data Center

```http
GET /dashboard/data-center
GET /dashboard/data-center/stocks
GET /dashboard/data-center/daily-bars/coverage
GET /dashboard/data-center/financial-factors/coverage
```

`GET /dashboard/data-center` 返回各数据集覆盖度：

- stocks
- tradingCalendar
- dailyBars
- indexDailyBars
- limitPrices
- suspensions
- adjFactors
- financialFactors

覆盖度结构：

```ts
{
  dataSet: string;
  total: number;
  latestDate: string | null;
}
```

### Strategies

```http
GET /dashboard/strategies
GET /dashboard/strategies/:code
GET /dashboard/strategies/:code/sample-signals
```

用于前端展示：

- 策略 code / name / version
- 策略描述
- 配置 schema
- 默认配置
- 样例信号

当前支持：

- `equal-weight`
- `momentum-top-n`
- `multi-factor`

## 前端 Web App

前端目录：

```text
apps/web/
```

技术栈：

- Vite
- React
- TypeScript
- lucide-react
- 原生 CSS / SVG 图表

启动开发环境：

```bash
npx pnpm@11.1.1 --filter @ares-quant/web dev
```

生产构建：

```bash
npx pnpm@11.1.1 --filter @ares-quant/web build
```

根目录也提供脚本：

```bash
npx pnpm@11.1.1 web:dev
npx pnpm@11.1.1 web:build
npx pnpm@11.1.1 web:preview
```

默认前端地址：

```text
http://localhost:5173
```

默认后端地址由 Vite proxy 指向：

```text
http://localhost:3000
```

如需指定 API 地址，可设置：

```bash
VITE_API_BASE_URL=http://localhost:3000
```

## 前端页面结构

当前 Web UI 是一个多视图 Dashboard MVP：

```text
Overview
Data Center
Strategies
Backtests
Risk Monitor
```

### Overview

- Hero 总览卡片
- 股票池、日线记录、策略数量、回测成功率
- Equity telemetry SVG 曲线
- Backtest status 状态分布
- 数据覆盖卡片
- 策略概览卡片
- 最近回测卡片

### Data Center

- Coverage Matrix
- 数据集数量、最新日期和相对完整度条
- Sync Pulse 同步柱状图
- Stock Universe Preview 表格

### Strategies

- 策略卡片
- strategy code / version
- description
- config schema
- factor weights preview
- signal sample preview

### Backtests

- Equity telemetry
- Backtest status
- Backtest Runs 表格

### Risk Monitor

- 当前阶段边界状态
- 失败任务数
- 运行任务数
- Live Trading 禁用状态
- Guardrails 检查列表

## Preview fallback

前端会优先请求真实后端：

```text
/dashboard/overview
/dashboard/data-center
/dashboard/strategies
/dashboard/backtests
```

如果后端未启动，前端自动使用内置 fallback 数据，方便独立预览 UI。

## 代码位置

后端：

```text
src/modules/dashboard/dashboard.module.ts
src/modules/dashboard/application/dashboard.service.ts
src/modules/dashboard/presentation/dashboard.controller.ts
src/modules/dashboard/presentation/dto/
```

前端：

```text
apps/web/index.html
apps/web/package.json
apps/web/tsconfig.json
apps/web/vite.config.ts
apps/web/src/main.tsx
apps/web/src/styles.css
apps/web/src/vite-env.d.ts
```

## 测试与验证

后端测试覆盖：

- Dashboard Overview
- Dashboard Backtest list / summary
- Dashboard Data Center
- Dashboard Strategy list / detail / sample signals

前端验证：

- TypeScript build
- Vite production build

推荐最终验证：

```bash
npm run build
npm run test -- --runInBand
npx pnpm@11.1.1 --filter @ares-quant/web build
```

## Phase 6 明确不包含

为保持阶段边界清晰，Phase 6 没有实现：

- 模拟盘系统
- 实盘交易系统
- Broker 抽象
- QMT / PTrade 接入
- OptimizationService
- 机器学习系统
- 新的复杂外部依赖

这些能力如果未来需要，应作为独立阶段单独设计。
