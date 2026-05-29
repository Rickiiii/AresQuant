# AresQuant Productization Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 把 AresQuant 从“可启动的量化工作台骨架”推进到 Ricki 每天可用的 A 股投研与复盘系统。

**Architecture:** 继续保持 NestJS + Prisma + PostgreSQL + Redis/BullMQ + React/Vite 架构，不进入实盘交易。后续重点是让数据、持仓、观察池、投研观点、复盘记录形成闭环：真实数据进入系统，系统围绕当前组合生成可解释建议，复盘结果沉淀回数据库。

**Tech Stack:** NestJS、TypeScript、Prisma、PostgreSQL、Redis/BullMQ、React/Vite、Eastmoney 公开数据源、Jest、ESLint。

---

## 当前判断

现在的系统还不能算真正可用。它已经能启动、展示工作台、读取一部分持仓上下文，也有数据中心、策略、回测、投研模块的骨架，但距离“每天打开就能指导决策”还有明显距离。

最大缺口不是 UI，而是产品闭环：

- 数据没有形成稳定的一键同步和质量状态。
- 持仓只能种子写入，缺少可编辑、可更新、可导入能力。
- 投研建议仍以模板和 fallback 为主，缺少真实行情、主题强弱、持仓盈亏和反证条件。
- 回测结果还没有和具体持仓/观察池形成决策联动。
- 复盘没有持久化，无法比较“上次判断 vs 今天市场”。

## 文件结构

- Modify: `prisma/schema.prisma`，补齐持仓、观察池、thesis、复盘、事件日历模型。
- Modify: `src/modules/portfolio/**`，做持仓编辑、基金编辑、价格更新和组合暴露计算。
- Modify: `src/modules/data/**`，做一键真实数据同步、同步状态、数据质量摘要。
- Modify: `src/modules/research/**`，做投研建议生成、thesis 跟踪、复盘记录、催化日历。
- Modify: `src/modules/dashboard/**`，聚合“今日状态”和“下一步动作”。
- Modify: `apps/web/src/main.tsx`，逐步拆分为页面组件，并完善工作台交互。
- Create: `apps/web/src/components/**`，沉淀通用卡片、表格、状态标签、空状态、加载态。
- Create: `docs/user-workflows.md`，定义真实用户每天怎么用。

---

## 第一阶段：让数据可用

### Task 1: 一键真实数据同步状态

**Files:**
- Modify: `src/modules/data/application/services/data-sync.service.ts`
- Modify: `src/modules/data/presentation/data.controller.ts`
- Modify: `src/modules/dashboard/application/dashboard.service.ts`
- Test: `src/modules/data/application/services/data-sync.service.spec.ts`
- Test: `src/modules/dashboard/application/dashboard.service.spec.ts`

- [ ] Step 1: 增加“同步状态摘要”测试，覆盖股票、日线、财务因子、失败任务数量和最新同步时间。
- [ ] Step 2: 在 `DataSyncService` 增加 `getSyncHealth()`，返回 `healthy | stale | empty | failed`。
- [ ] Step 3: 在 `DataController` 增加 `GET /data/sync/health`。
- [ ] Step 4: 在 `DashboardService` 把同步健康状态汇总到首页。
- [ ] Step 5: 运行 `pnpm test -- data-sync dashboard.service`。

### Task 2: 东方财富数据同步入口产品化

**Files:**
- Modify: `src/modules/data/presentation/data.controller.ts`
- Modify: `src/modules/data/application/services/data-sync.service.ts`
- Modify: `apps/web/src/main.tsx`
- Test: `src/modules/data/presentation/data.controller.e2e-spec.ts`

- [ ] Step 1: 增加 `POST /data/sync/eastmoney/core`，同步股票池、近期日线、指数日线和基础财务因子。
- [ ] Step 2: 在后端返回同步结果：成功数量、失败数量、耗时、失败原因。
- [ ] Step 3: 在数据中心页面增加“同步核心数据”按钮、加载态、成功态、失败态。
- [ ] Step 4: 运行 `pnpm test -- data.controller data-sync`。
- [ ] Step 5: 运行 `pnpm --filter @ares-quant/web exec vite build`。

---

## 第二阶段：让持仓真正可维护

### Task 3: 持仓编辑和基金编辑

**Files:**
- Modify: `src/modules/portfolio/presentation/portfolio.controller.ts`
- Modify: `src/modules/portfolio/application/portfolio-context.service.ts`
- Modify: `src/modules/portfolio/domain/portfolio.types.ts`
- Modify: `apps/web/src/main.tsx`
- Test: `src/modules/portfolio/presentation/portfolio.controller.e2e-spec.ts`

- [ ] Step 1: 增加 `POST /portfolio/holdings`、`PATCH /portfolio/holdings/:id`、`DELETE /portfolio/holdings/:id`。
- [ ] Step 2: 增加 `POST /portfolio/funds`、`PATCH /portfolio/funds/:id`、`DELETE /portfolio/funds/:id`。
- [ ] Step 3: 持仓页面增加编辑弹窗：代码、名称、数量、成本、主题、操作倾向、thesis。
- [ ] Step 4: 基金页面增加编辑弹窗：名称、金额、主题、权重、操作倾向。
- [ ] Step 5: 运行 `pnpm test -- portfolio`。

### Task 4: 持仓价格更新和盈亏计算

**Files:**
- Modify: `src/modules/portfolio/application/portfolio-context.service.ts`
- Modify: `src/modules/data/application/services/data-sync.service.ts`
- Modify: `apps/web/src/main.tsx`
- Test: `src/modules/portfolio/application/portfolio-context.service.spec.ts`

- [ ] Step 1: 从日线最新收盘价更新股票持仓最新价。
- [ ] Step 2: 自动计算市值、浮盈亏、股票侧权重、组合估算总资产。
- [ ] Step 3: 前端持仓卡片展示浮盈亏、收益率、主题权重。
- [ ] Step 4: 运行 `pnpm test -- portfolio-context.service`。

---

## 第三阶段：让投研建议有证据链

### Task 5: Thesis Tracker

**Files:**
- Modify: `prisma/schema.prisma`
- Create: `src/modules/research/application/thesis-tracker.service.ts`
- Modify: `src/modules/research/presentation/research.controller.ts`
- Modify: `apps/web/src/main.tsx`
- Test: `src/modules/research/application/thesis-tracker.service.spec.ts`

- [ ] Step 1: 新增 `InvestmentThesis`、`ThesisPillar`、`ThesisRisk`、`ThesisUpdate` 模型。
- [ ] Step 2: 增加 `GET /research/theses`、`POST /research/theses`、`PATCH /research/theses/:id`。
- [ ] Step 3: 投研中心展示每个持仓的核心逻辑、风险点、反证条件和最近更新。
- [ ] Step 4: 运行 `pnpm prisma:generate`、`pnpm prisma:deploy`、`pnpm test -- thesis`。

### Task 6: Idea Engine 第一版

**Files:**
- Create: `src/modules/research/application/idea-engine.service.ts`
- Modify: `src/modules/research/application/research.service.ts`
- Modify: `apps/web/src/main.tsx`
- Test: `src/modules/research/application/idea-engine.service.spec.ts`

- [ ] Step 1: 输入股票池、因子得分、主题标签、持仓主题暴露。
- [ ] Step 2: 输出候选标的：总分、因子贡献、为什么现在看、风险、触发条件、建议动作。
- [ ] Step 3: 前端 Idea Card 展示分数、证据、风险、加入观察池按钮。
- [ ] Step 4: 运行 `pnpm test -- idea-engine research.service`。

---

## 第四阶段：让复盘沉淀

### Task 7: Daily Note 持久化

**Files:**
- Modify: `prisma/schema.prisma`
- Create: `src/modules/research/application/daily-note.service.ts`
- Modify: `src/modules/research/presentation/research.controller.ts`
- Modify: `apps/web/src/main.tsx`
- Test: `src/modules/research/application/daily-note.service.spec.ts`

- [ ] Step 1: 新增 `DailyNote`、`DailyNoteSection`、`DailyActionItem` 模型。
- [ ] Step 2: 增加 `POST /research/daily-notes/generate` 和 `GET /research/daily-notes/latest`。
- [ ] Step 3: Daily Note 必须包含市场温度、主题强弱、持仓影响、动作建议、反证条件、明日关注。
- [ ] Step 4: 前端增加“生成今日复盘”和“保存复盘”。
- [ ] Step 5: 运行 `pnpm test -- daily-note research.controller`。

### Task 8: 上次判断 vs 今日验证

**Files:**
- Modify: `src/modules/research/application/daily-note.service.ts`
- Modify: `apps/web/src/main.tsx`
- Test: `src/modules/research/application/daily-note.service.spec.ts`

- [ ] Step 1: 读取上一条 Daily Note 的 action items。
- [ ] Step 2: 对照今日行情和持仓表现，标记 `validated | invalidated | pending`。
- [ ] Step 3: 前端展示“上次判断回看”区块。
- [ ] Step 4: 运行 `pnpm test -- daily-note`。

---

## 第五阶段：把 UI 变成真正的产品

### Task 9: 前端拆分和交互打磨

**Files:**
- Modify: `apps/web/src/main.tsx`
- Create: `apps/web/src/components/CardHeader.tsx`
- Create: `apps/web/src/components/StatusPill.tsx`
- Create: `apps/web/src/components/MetricCard.tsx`
- Create: `apps/web/src/views/OverviewView.tsx`
- Create: `apps/web/src/views/DataCenterView.tsx`
- Create: `apps/web/src/views/ResearchView.tsx`
- Modify: `apps/web/src/styles.css`

- [ ] Step 1: 拆分大文件，保持现有视觉不回退。
- [ ] Step 2: 增加空状态、加载态、错误态。
- [ ] Step 3: 增加所有按钮的悬浮态、禁用态、提交中状态。
- [ ] Step 4: 用中文文案统一所有新增 UI。
- [ ] Step 5: 运行 `pnpm exec tsc -p apps/web/tsconfig.json --noEmit`。
- [ ] Step 6: 运行 `pnpm --filter @ares-quant/web exec vite build`。

### Task 10: 首页改成“今日该做什么”

**Files:**
- Modify: `src/modules/dashboard/application/dashboard.service.ts`
- Modify: `apps/web/src/views/OverviewView.tsx`
- Test: `src/modules/dashboard/application/dashboard.service.spec.ts`

- [ ] Step 1: 首页顶部展示今日结论：可加仓 / 观察 / 风控 / 止盈。
- [ ] Step 2: 展示三条最重要风险。
- [ ] Step 3: 展示三条最重要机会。
- [ ] Step 4: 展示持仓动作清单。
- [ ] Step 5: 运行 `pnpm test -- dashboard.service` 和前端构建。

---

## 验收标准

完成以上阶段后，AresQuant 每次打开必须能回答：

1. 今天市场适不适合继续加仓？
2. 当前持仓哪个最需要处理？
3. 哪些主题暴露过高？
4. 哪些观察池标的值得继续跟？
5. 策略和因子支持哪些判断？
6. 昨天或上次判断是否被验证？
7. 下一步动作是持有、分批、观察、止盈还是风控？

## 执行建议

优先执行第一阶段和第二阶段。没有真实数据和可维护持仓，后面的投研建议都会继续像“漂亮模板”，不能成为真正可用的系统。
