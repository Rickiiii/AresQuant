# AresQuant Workday-Usable Roadmap Implementation Plan

> **For Hermes:** Use `writing-plans` and `test-driven-development` before implementing each phase. Advance one bounded step at a time, preserve phase boundaries, and avoid live trading, broker integration, automatic order execution, OptimizationService, machine learning systems, and paid data dependencies unless Ricki explicitly requests them.

**Goal:** Turn AresQuant from a mostly technical quant platform into a product Ricki can actually open and use every trading day for A-share portfolio review, intraday decision support, idea tracking, and post-market review.

**Architecture:** Keep the existing NestJS + Prisma + React Dashboard architecture. Prioritize a daily usage loop: portfolio context → market snapshot → theme strength → position diagnosis → action suggestions → thesis/notes persistence. Start with deterministic, explainable services and Eastmoney public data; only add persistent models where repeated daily usage needs history.

**Tech Stack:** NestJS, TypeScript, Prisma, PostgreSQL, Redis/BullMQ, React/Vite, Eastmoney public endpoints, Jest, ESLint.

---

## 1. Product North Star

AresQuant should answer these questions every workday:

1. 今天市场环境适不适合加仓？
2. 我的股票/基金/主题暴露有没有明显风险？
3. AI、机器人、物理 AI、通信设备、黄金、小盘、绿电等主题现在是强、弱，还是分化？
4. 我的持仓今天是 thesis 增强、削弱，还是只是正常波动？
5. 哪些标的适合继续持有、分批建仓、观望、止盈或风控？
6. 昨天/上次判断有没有被市场验证或证伪？
7. 明天最需要关注哪几个触发条件？

The product should feel like a **personal A-share investment cockpit**, not a generic backtest demo.

---

## 2. Current Context

Current implemented foundation:

- Data Center exists with Mock provider and Eastmoney provider basics.
- Strategy system exists with `equal-weight`, `momentum-top-n`, and `multi-factor`.
- Backtest engine exists with A-share rules.
- Dashboard exists with backend aggregation and React UI.
- Research Center exists but is mostly static fallback data.
- Portfolio context is currently hard-coded and incomplete; `603005 300@38.397` still needs to be reflected in code.
- Current tests: 31/32 suites pass; one Research e2e test fails due to expected integer cost values vs actual decimal values.

Important boundaries:

- Do not enter live trading.
- Do not build Broker/QMT/PTrade integration.
- Do not add OptimizationService or ML-heavy systems.
- Do not overbuild multi-user permissions or SaaS features.
- Keep the system local/personal and useful first.

---

## 3. Daily Usage Workflow Target

### 3.1 Morning / Before Market

User opens Dashboard and sees:

- Current portfolio exposure.
- Overnight risk notes: Nasdaq/AI/gold/HK tech/global tech mapping.
- Today watch themes.
- Today action plan:
  - `hold`
  - `build`
  - `watch`
  - `take_profit`
  - `risk_control`
- Key trigger conditions.

### 3.2 Intraday 14:30

This is the most important workflow.

System produces:

- Market temperature.
- Index performance.
- Breadth if available.
- Theme strength.
- Ricki portfolio impact.
- Stock and fund exposure impact.
- Position-level action suggestions.
- Disconfirming evidence.
- Tomorrow focus.

### 3.3 After Close

System stores and displays:

- What happened today.
- Whether 14:30 call was correct.
- Which thesis strengthened/weakened.
- Which triggers are active tomorrow.
- Which symbols/themes enter or leave watchlist.

### 3.4 Weekly Review

System summarizes:

- Portfolio allocation.
- Theme concentration.
- Biggest contributors and risks.
- Thesis quality.
- Next week plan.

---

## 4. Roadmap Overview

Recommended implementation sequence:

1. **Phase A — Stabilize current Research Center**
2. **Phase B — Portfolio Context becomes editable and persistent**
3. **Phase C — Market Snapshot and Theme Strength**
4. **Phase D — Daily Note Engine**
5. **Phase E — Thesis Tracker and Review Memory**
6. **Phase F — Watchlist and Idea Board**
7. **Phase G — Dashboard Product Polish**
8. **Phase H — Workday automation and reliability**

The shortest path to “can use every workday” is Phase A → B → C → D.

---

## 5. Phase A — Stabilize Current Research Center

**Goal:** Make the existing Research Center correct, test-green, and aligned with Ricki’s real portfolio.

**User Value:** Ricki can open the Research page and trust that portfolio weights and conclusions are not obviously wrong.

### Requirements

- Include all current stock holdings:
  - `600366 800@13.47`
  - `601689 200@69.62`
  - `002031 2100@8.1329`
  - `002714 100@44.67`
  - `603005 300@38.397`
- Recalculate stock cost value and known portfolio weight.
- Remove old “个股约25.5%” assumptions.
- Fix Research e2e test expectations.
- Keep data static for this phase; do not add database models yet.

### Likely Files

- Modify: `src/modules/research/application/research.service.ts`
- Modify: `src/modules/research/presentation/dto/research.dto.ts` if DTO needs fields for new exposure data
- Modify: `src/modules/research/presentation/research.controller.e2e-spec.ts`
- Modify: `apps/web/src/main.tsx` only if frontend fallback has stale portfolio data

### Acceptance Criteria

- `GET /research/portfolio-context` includes `603005`.
- `GET /research/daily-note` reports stock weight around 29%–30% depending denominator.
- No “个股3.3%” or old 25.5% wording remains.
- All backend tests pass.
- Web build passes.

### Validation Commands

```bash
pnpm prisma:validate
pnpm build
pnpm exec jest --runInBand
npx pnpm@11.1.1 --filter @ares-quant/web build
```

---

## 6. Phase B — Portfolio Context Persistence

**Goal:** Stop hard-coding Ricki’s portfolio in `ResearchService`; store portfolio, fund exposures, theme tags, and action bias in database-backed APIs.

**User Value:** Ricki can update positions/funds periodically without code edits, and all analysis uses the same source of truth.

### Requirements

Add portfolio models:

```text
PortfolioAccount
PortfolioPosition
FundExposure
ThemeTag
WatchTheme
```

Minimum fields:

```text
PortfolioAccount
- id
- name
- type: stock | fund | mixed
- baseCurrency
- totalAssetValue
- cashValue
- visibleAssetValue
- updatedAt

PortfolioPosition
- id
- accountId
- symbol
- name
- quantity
- costPrice
- latestPrice nullable
- marketValue nullable
- themeTags string[] or normalized relation
- thesisSummary
- actionBias
- riskLevel
- updatedAt

FundExposure
- id
- accountId
- name
- fundCode nullable
- theme
- amount
- weightPercent
- actionBias
- updatedAt
```

Start with simple CRUD/admin-style APIs; no authentication needed for local personal tool.

### Backend APIs

```http
GET /portfolio/context
PUT /portfolio/context
GET /portfolio/positions
POST /portfolio/positions
PATCH /portfolio/positions/:id
DELETE /portfolio/positions/:id
GET /portfolio/fund-exposures
POST /portfolio/fund-exposures
PATCH /portfolio/fund-exposures/:id
DELETE /portfolio/fund-exposures/:id
```

### Dashboard Requirements

Add Portfolio page or Research subsection:

- Stock positions table.
- Fund exposure table.
- Theme exposure summary.
- Manual edit forms.
- Clear “last updated” timestamp.

### Likely Files

- Modify: `prisma/schema.prisma`
- Create: `src/modules/portfolio/portfolio.module.ts`
- Create: `src/modules/portfolio/application/portfolio.service.ts`
- Create: `src/modules/portfolio/presentation/portfolio.controller.ts`
- Create: `src/modules/portfolio/presentation/dto/portfolio.dto.ts`
- Create: `src/modules/portfolio/infrastructure/prisma-portfolio.repository.ts`
- Modify: `src/app.module.ts`
- Modify: `src/modules/research/application/research.service.ts` to read from Portfolio service/repository
- Modify: `apps/web/src/main.tsx` initially, then later split components

### Acceptance Criteria

- Ricki can update holdings without code changes.
- Research daily note reads portfolio context from DB-backed service.
- If DB has no portfolio, fallback seed/default data still works.
- All tests pass.

---

## 7. Phase C — Market Snapshot and Theme Strength

**Goal:** Connect daily workday analysis to real market conditions from Eastmoney public endpoints.

**User Value:** AresQuant stops being static and starts answering “今天市场怎么样”.

### Requirements

Add a read-only market snapshot service:

```http
GET /market/snapshot
GET /market/indices
GET /market/themes
GET /market/portfolio-prices
```

Initial index universe:

- 上证指数
- 深证成指
- 创业板指
- 科创 50
- 沪深 300
- 中证 1000
- 恒生科技 proxy if available
- 纳指/海外科技 proxy can remain manual/fallback initially

Theme groups:

```text
AI / 人工智能
机器人 / 物理 AI
通信设备 / CPO
数字经济 / 大科技
黄金
绿电 / 新能源
中证1000 / 小盘风格
港股科技
海外科技
```

For each theme, output:

```text
theme
state: strong | neutral | weak | divergent | unknown
sampleSymbols
averagePctChange nullable
leaderSymbols
laggardSymbols
portfolioImpact
actionMeaning
```

### Implementation Notes

- Start with symbol buckets and Eastmoney quote snapshots.
- If Eastmoney quote data is unavailable, return `unknown` with diagnostic reason.
- Add conservative request timeout/retry like existing Eastmoney provider.
- Avoid full industry taxonomy in first version.

### Likely Files

- Create: `src/modules/market/market.module.ts`
- Create: `src/modules/market/application/market-snapshot.service.ts`
- Create: `src/modules/market/application/theme-strength.service.ts`
- Create: `src/modules/market/presentation/market.controller.ts`
- Create: `src/modules/market/presentation/dto/market.dto.ts`
- Modify: `src/modules/data/providers/eastmoney/eastmoney-data-provider.ts` or create a quote-specific provider
- Modify: `src/app.module.ts`
- Modify: `apps/web/src/main.tsx`

### Acceptance Criteria

- Dashboard shows current index and theme state.
- Research daily note can reference actual market state instead of `fallback` only.
- API degrades gracefully when Eastmoney rate-limits or fields change.
- Tests cover parser and degraded response.

---

## 8. Phase D — Daily Note Engine

**Goal:** Productize the 14:30 daily review as a first-class AresQuant feature.

**User Value:** Ricki can use the system every workday for consistent, portfolio-aware action guidance.

### Requirements

Add Daily Note model and generation service:

```text
DailyNote
- id
- tradingDate
- noteType: morning | intraday_1430 | close | weekly
- generatedAt
- marketState
- topConclusion
- portfolioSummary
- themeSummary
- positionSuggestions
- actionBuckets
- disconfirmingEvidence
- nextFocus
- confidence
- sourceSnapshotJson
```

APIs:

```http
POST /research/daily-notes/generate
GET /research/daily-notes/latest?type=intraday_1430
GET /research/daily-notes?startDate=&endDate=&type=
GET /research/daily-notes/:id
```

Generation inputs:

- Portfolio context.
- Market snapshot.
- Theme strength.
- Existing strategy/factor signals where available.
- Previous Daily Note.
- Static playbook rules.

### Daily Note Output Sections

```text
1. 一句话结论
2. 市场温度
3. 主题强弱
4. 持仓检查
5. 策略/因子信号
6. 操作建议
7. 反证条件
8. 明日关注
9. 上次判断回看
```

### Suggestion Types

Use fixed enum-like values:

```text
hold
add
build
watch
take_profit
risk_control
```

Every suggestion must include:

```text
target
suggestion
reasoning
risk
trigger
invalidatingCondition
confidence
```

### Acceptance Criteria

- One click generates today’s intraday note.
- Generated note is persisted.
- Latest note is visible on Dashboard top section.
- The note references previous note if available.
- It never produces action suggestions without reasoning and risk.

---

## 9. Phase E — Thesis Tracker and Review Memory

**Goal:** Make AresQuant remember why Ricki holds or watches each target and whether the thesis is still valid.

**User Value:** Daily analysis becomes cumulative instead of starting from zero.

### Requirements

Add thesis models:

```text
InvestmentThesis
ThesisPillar
ThesisRisk
ThesisCatalyst
ThesisUpdate
```

APIs:

```http
GET /research/theses
POST /research/theses
GET /research/theses/:id
PATCH /research/theses/:id
POST /research/theses/:id/updates
```

Each thesis should include:

```text
target
status: active | watch | challenged | invalidated | closed
currentAction
pillars
risks
catalysts
exitConditions
lastReviewConclusion
```

### Integration

Daily Note should automatically classify each position:

```text
thesis_strengthened
thesis_unchanged
thesis_weakened
thesis_invalidated
unknown
```

### Acceptance Criteria

- Every current holding can have a thesis card.
- Daily note shows whether thesis changed.
- User can update thesis after review.
- Previous thesis decisions are visible.

---

## 10. Phase F — Watchlist and Idea Board

**Goal:** Turn strategy/factor output into an actionable watchlist rather than raw signals.

**User Value:** Ricki can see what is worth watching next and under what conditions to act.

### Requirements

Models:

```text
WatchlistItem
ResearchIdea
IdeaFactorBreakdown
```

APIs:

```http
GET /research/watchlist
POST /research/watchlist
PATCH /research/watchlist/:id
DELETE /research/watchlist/:id
GET /research/ideas
POST /research/ideas/generate
```

Idea card fields:

```text
symbol
name
themeTags
score
factorBreakdown
whyNow
risks
trigger
suggestedAction
confidence
status: new | watching | promoted | rejected | archived
```

### Candidate Sources

- Ricki’s current holdings.
- Manually defined watchlist.
- Theme buckets.
- Multi-factor strategy outputs.
- Momentum + valuation + volatility filters.

### Acceptance Criteria

- Research Center shows idea cards.
- Each idea has a clear action: watch/build/skip/risk_control.
- User can promote an idea to watchlist or archive it.
- Ideas are explainable and not black-box.

---

## 11. Phase G — Dashboard Product Polish

**Goal:** Make the product pleasant and fast to use every workday.

**User Value:** Ricki can open one page and know what to do next.

### UX Requirements

Home page first screen should show:

1. Today conclusion.
2. Market temperature.
3. Portfolio risk state.
4. Top 3 action suggestions.
5. Theme strength cards.
6. “Generate 14:30 note” button.

Research Center sections:

```text
Today Note
Portfolio Health
Theme Exposure
Position Cards
Idea Board
Thesis Tracker
Catalyst Calendar
Review History
```

### Frontend Refactor Requirement

`apps/web/src/main.tsx` is already too large. Split before adding much more UI:

```text
apps/web/src/
  api/
    client.ts
  components/
    MetricCard.tsx
    SectionCard.tsx
    ActionBadge.tsx
  features/
    dashboard/
    research/
    portfolio/
    market/
  types/
    api.ts
```

### Acceptance Criteria

- Main UI files stay readable.
- Dashboard works with backend and fallback preview.
- Mobile/narrow screen readable.
- Every recommendation has visible reasoning.

---

## 12. Phase H — Workday Automation and Reliability

**Goal:** Make daily usage low-friction.

**User Value:** Ricki does not need to manually remember every step.

### Requirements

Add operational scripts and optional scheduled job support:

```bash
pnpm ares:dev
pnpm ares:check
pnpm ares:daily-note
pnpm ares:sync-market
```

Potential cron integration:

- 09:00 generate morning note.
- 14:30 generate intraday note and optionally send Feishu summary.
- 15:15 generate close review.
- Friday after close generate weekly review.

### Reliability Requirements

- Data provider diagnostics visible in Dashboard.
- If Eastmoney fails, note must say data source unavailable rather than hallucinating.
- Store source snapshot used for every note.
- Add “stale data” warning if latest market data is old.

### Acceptance Criteria

- Ricki can run one command to validate project health.
- 14:30 note can be generated from API or script.
- Dashboard clearly indicates fresh/stale/fallback data.

---

## 13. Immediate Next 5 Implementation Steps

### Step 1 — Fix Current Research Calibration

**Objective:** Make current Research Center trustworthy.

**Files:**

- Modify: `src/modules/research/application/research.service.ts`
- Modify: `src/modules/research/presentation/research.controller.e2e-spec.ts`
- Possibly modify: `apps/web/src/main.tsx`

**Work:**

- Add `603005` position.
- Recalculate stock/fund/known portfolio weights.
- Update test expected values with decimals or `toBeCloseTo`.
- Ensure all Research copy uses updated weight.

**Verify:**

```bash
pnpm exec jest src/modules/research/presentation/research.controller.e2e-spec.ts --runInBand
pnpm exec jest --runInBand
pnpm build
npx pnpm@11.1.1 --filter @ares-quant/web build
```

### Step 2 — Create Portfolio Context Design and Prisma Models

**Objective:** Prepare persistent portfolio source of truth.

**Files:**

- Modify: `prisma/schema.prisma`
- Create: `docs/portfolio-context.md`

**Work:**

- Define minimal models.
- Add migration.
- Add seed fallback plan.

**Verify:**

```bash
pnpm prisma:validate
pnpm prisma:generate
```

### Step 3 — Add Portfolio APIs

**Objective:** Allow reading/updating holdings from API.

**Files:**

- Create: `src/modules/portfolio/portfolio.module.ts`
- Create: `src/modules/portfolio/application/portfolio.service.ts`
- Create: `src/modules/portfolio/presentation/portfolio.controller.ts`
- Create: `src/modules/portfolio/presentation/dto/portfolio.dto.ts`
- Modify: `src/app.module.ts`

**Verify:**

```bash
pnpm exec jest src/modules/portfolio --runInBand
pnpm build
```

### Step 4 — Connect ResearchService to Portfolio Context

**Objective:** Daily note uses DB/fallback portfolio data.

**Files:**

- Modify: `src/modules/research/application/research.service.ts`
- Modify: `src/modules/research/research.module.ts`
- Modify tests under `src/modules/research/**`

**Verify:**

```bash
pnpm exec jest src/modules/research --runInBand
pnpm exec jest --runInBand
```

### Step 5 — Add Market Snapshot Read API

**Objective:** Replace static market state with real/fallback market snapshot.

**Files:**

- Create: `src/modules/market/market.module.ts`
- Create: `src/modules/market/application/market-snapshot.service.ts`
- Create: `src/modules/market/presentation/market.controller.ts`
- Create: `src/modules/market/presentation/dto/market.dto.ts`
- Modify: `src/app.module.ts`

**Verify:**

```bash
pnpm exec jest src/modules/market --runInBand
pnpm build
```

---

## 14. Definition of “Actually Usable Every Workday”

AresQuant reaches the first daily-usable milestone when Ricki can:

1. Start backend and web dashboard.
2. See current portfolio and fund exposure.
3. Click one button or open one page for 14:30 review.
4. See market/theme state based on current data or explicit stale/fallback warning.
5. Get position-level action suggestions with reasons and risk.
6. Save the day’s note.
7. Tomorrow, compare against yesterday’s note.

This is the MVP that matters more than adding more abstract quant features.

---

## 15. Validation Gate for Every Phase

Run in a temp copy for non-mutating validation if needed:

```bash
pnpm prisma:validate
pnpm build
pnpm exec jest --runInBand
npx pnpm@11.1.1 --filter @ares-quant/web build
pnpm lint
```

Do not call a phase done unless tests/builds pass or failures are explicitly documented with root cause and next fix.
