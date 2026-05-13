# AresQuant

AresQuant is a NestJS + Prisma based A-share quantitative trading platform. The current backend includes a data center, mock data provider, data quality checks, adjustment-factor price calculation, and a professional backtest engine.

## Stack

- Node.js, TypeScript, NestJS
- Prisma ORM, PostgreSQL
- Redis compatible service for BullMQ
- Jest, ESLint
- Swagger: `http://localhost:3000/docs`

## Quick Start

```powershell
pnpm install
Copy-Item .env.example .env
pnpm prisma:generate
pnpm prisma:deploy
pnpm start:dev
```

Local services used during development:

- PostgreSQL on `localhost:5432`
- Redis compatible service on `localhost:6379`

## Phase 1: Foundation

Phase 1 delivered the backend foundation:

- NestJS application skeleton
- Strict TypeScript config
- Prisma and PostgreSQL initialization
- Modular structure for Data, Strategy, Backtest, Risk, Trading, Notification, and Portfolio
- Swagger setup
- Initial Data, Strategy, and Backtest module skeletons

## Phase 2: A-share Data Center

Phase 2 extends `DataModule` into a usable A-share data center:

- Stock master data
- Trading calendar
- Stock daily bars
- Index daily bars
- Limit prices
- Suspensions
- Adjustment factors
- Financial factors
- Data sync logs
- `DataProvider` abstraction with `MockDataProvider`
- Repository Pattern with Prisma transaction based upserts
- Data quality checks
- Forward and backward adjusted price calculation
- BullMQ data queue

Detailed documentation: [docs/data-module.md](docs/data-module.md)

Main data APIs:

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

Run mock data sync:

```powershell
Invoke-RestMethod -Uri http://localhost:3000/data/sync/all `
  -Method Post `
  -ContentType 'application/json' `
  -Body '{"startDate":"2026-05-11","endDate":"2026-05-15"}'
```

Run a quality check:

```powershell
Invoke-RestMethod -Uri http://localhost:3000/data/quality/check `
  -Method Post `
  -ContentType 'application/json' `
  -Body '{"symbol":"000001","startDate":"2026-05-11","endDate":"2026-05-15"}'
```

## Phase 3: Professional A-share Backtest Engine

Phase 3 adds a complete backtest loop:

- Backtest task management
- Account snapshots
- Positions
- Orders
- Trades
- Metrics
- Matching engine
- A-share trading rules
- Fee model
- Slippage model
- Portfolio management
- Rebalance order generation
- Performance analysis
- StrategyRegistry integration
- Basic RiskService integration

Detailed documentation: [docs/backtest-engine.md](docs/backtest-engine.md)

Supported matching and trading rules:

- Suspended stocks cannot trade
- Limit-up stocks cannot be bought by default
- Limit-down stocks cannot be sold by default
- T+1 sell restriction
- Insufficient cash rejection
- Insufficient position rejection
- 100-share lot-size rule
- Minimum commission
- Commission, stamp duty, and transfer fee
- Slippage
- Market and limit order model

Main backtest APIs:

- `POST /backtests`
- `GET /backtests`
- `GET /backtests/:id`
- `GET /backtests/:id/orders`
- `GET /backtests/:id/trades`
- `GET /backtests/:id/positions`
- `GET /backtests/:id/snapshots`
- `GET /backtests/:id/metrics`
- `DELETE /backtests/:id`

Run a mock backtest:

```powershell
Invoke-RestMethod -Uri http://localhost:3000/backtests `
  -Method Post `
  -ContentType 'application/json' `
  -Body '{"name":"Phase 3 Mock Backtest","strategyName":"equal_weight_mock","startDate":"2026-05-11","endDate":"2026-05-15","initialCapital":1000000,"benchmark":"000300.SH","rebalanceFrequency":1,"maxPositions":2,"maxPositionWeight":0.5,"commissionRate":0.00025,"slippageRate":0.0005,"priceMode":"CLOSE"}'
```

## Quality Gates

```powershell
pnpm build
pnpm test
pnpm lint
pnpm prisma:validate
```

Current verified state:

- `pnpm build`: passing
- `pnpm test`: passing
- `pnpm lint`: passing
- `pnpm prisma:validate`: passing
- Prisma migrations: applied locally

## Project Layout

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

## Notes

- `.env` is intentionally ignored.
- Use `.env.example` as the configuration template.
- All database writes should go through repositories.
- DTOs use `class-validator`.
- Money and fee calculations in the backtest engine use `Decimal`.
