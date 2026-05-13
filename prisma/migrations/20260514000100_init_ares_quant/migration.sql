CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TYPE "Exchange" AS ENUM ('SSE', 'SZSE', 'BSE');
CREATE TYPE "SecurityType" AS ENUM ('STOCK', 'ETF', 'INDEX');
CREATE TYPE "ListingStatus" AS ENUM ('LISTED', 'SUSPENDED_LISTING', 'DELISTED');
CREATE TYPE "BarFrequency" AS ENUM ('DAILY', 'MINUTE_1', 'MINUTE_5', 'MINUTE_15', 'MINUTE_30', 'MINUTE_60');
CREATE TYPE "CorporateActionType" AS ENUM ('CASH_DIVIDEND', 'BONUS_SHARE', 'RIGHTS_ISSUE', 'SPLIT');
CREATE TYPE "DataSyncStatus" AS ENUM ('PENDING', 'RUNNING', 'SUCCEEDED', 'FAILED', 'CANCELLED');
CREATE TYPE "StrategyStatus" AS ENUM ('DRAFT', 'ACTIVE', 'PAUSED', 'ARCHIVED');
CREATE TYPE "BacktestStatus" AS ENUM ('PENDING', 'RUNNING', 'SUCCEEDED', 'FAILED', 'CANCELLED');

CREATE TABLE "securities" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "ts_code" VARCHAR(16) NOT NULL,
  "symbol" VARCHAR(12) NOT NULL,
  "name" VARCHAR(64) NOT NULL,
  "exchange" "Exchange" NOT NULL,
  "security_type" "SecurityType" NOT NULL,
  "industry" VARCHAR(128),
  "area" VARCHAR(64),
  "list_date" DATE NOT NULL,
  "delist_date" DATE,
  "listing_status" "ListingStatus" NOT NULL DEFAULT 'LISTED',
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(6) NOT NULL,
  CONSTRAINT "securities_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "trading_calendars" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "exchange" "Exchange" NOT NULL,
  "trade_date" DATE NOT NULL,
  "is_open" BOOLEAN NOT NULL,
  "prev_date" DATE,
  "next_date" DATE,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "trading_calendars_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "daily_bars" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "security_id" UUID NOT NULL,
  "trade_date" DATE NOT NULL,
  "open" DECIMAL(18,6) NOT NULL,
  "high" DECIMAL(18,6) NOT NULL,
  "low" DECIMAL(18,6) NOT NULL,
  "close" DECIMAL(18,6) NOT NULL,
  "previous_close" DECIMAL(18,6) NOT NULL,
  "change" DECIMAL(18,6) NOT NULL,
  "pct_change" DECIMAL(12,6) NOT NULL,
  "volume" DECIMAL(24,6) NOT NULL,
  "amount" DECIMAL(24,6) NOT NULL,
  "turnover_rate" DECIMAL(12,6),
  "volume_ratio" DECIMAL(12,6),
  "is_limit_up" BOOLEAN NOT NULL DEFAULT false,
  "is_limit_down" BOOLEAN NOT NULL DEFAULT false,
  "is_suspended" BOOLEAN NOT NULL DEFAULT false,
  "source" VARCHAR(32) NOT NULL,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(6) NOT NULL,
  CONSTRAINT "daily_bars_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "daily_bars_price_check" CHECK ("high" >= "low" AND "high" >= "open" AND "high" >= "close" AND "low" <= "open" AND "low" <= "close"),
  CONSTRAINT "daily_bars_volume_check" CHECK ("volume" >= 0 AND "amount" >= 0)
);

CREATE TABLE "minute_bars" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "security_id" UUID NOT NULL,
  "frequency" "BarFrequency" NOT NULL,
  "started_at" TIMESTAMPTZ(6) NOT NULL,
  "open" DECIMAL(18,6) NOT NULL,
  "high" DECIMAL(18,6) NOT NULL,
  "low" DECIMAL(18,6) NOT NULL,
  "close" DECIMAL(18,6) NOT NULL,
  "volume" DECIMAL(24,6) NOT NULL,
  "amount" DECIMAL(24,6) NOT NULL,
  "source" VARCHAR(32) NOT NULL,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "minute_bars_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "minute_bars_price_check" CHECK ("high" >= "low" AND "high" >= "open" AND "high" >= "close" AND "low" <= "open" AND "low" <= "close"),
  CONSTRAINT "minute_bars_volume_check" CHECK ("volume" >= 0 AND "amount" >= 0)
);

CREATE TABLE "adjustment_factors" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "security_id" UUID NOT NULL,
  "trade_date" DATE NOT NULL,
  "factor" DECIMAL(24,12) NOT NULL,
  "source" VARCHAR(32) NOT NULL,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "adjustment_factors_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "adjustment_factors_factor_check" CHECK ("factor" > 0)
);

CREATE TABLE "special_statuses" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "security_id" UUID NOT NULL,
  "trade_date" DATE NOT NULL,
  "is_st" BOOLEAN NOT NULL DEFAULT false,
  "is_suspended" BOOLEAN NOT NULL DEFAULT false,
  "limit_up" DECIMAL(18,6),
  "limit_down" DECIMAL(18,6),
  "reason" VARCHAR(255),
  "source" VARCHAR(32) NOT NULL,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "special_statuses_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "special_statuses_limit_check" CHECK ("limit_up" IS NULL OR "limit_down" IS NULL OR "limit_up" >= "limit_down")
);

CREATE TABLE "corporate_actions" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "security_id" UUID NOT NULL,
  "ex_date" DATE NOT NULL,
  "action_type" "CorporateActionType" NOT NULL,
  "cash_dividend" DECIMAL(18,6),
  "bonus_ratio" DECIMAL(18,8),
  "rights_ratio" DECIMAL(18,8),
  "rights_price" DECIMAL(18,6),
  "source" VARCHAR(32) NOT NULL,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "corporate_actions_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "data_sync_jobs" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "source" VARCHAR(32) NOT NULL,
  "dataset" VARCHAR(64) NOT NULL,
  "status" "DataSyncStatus" NOT NULL DEFAULT 'PENDING',
  "started_at" TIMESTAMPTZ(6),
  "finished_at" TIMESTAMPTZ(6),
  "from_date" DATE,
  "to_date" DATE,
  "row_count" INTEGER NOT NULL DEFAULT 0,
  "error_code" VARCHAR(64),
  "error_message" TEXT,
  "metadata" JSONB,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(6) NOT NULL,
  CONSTRAINT "data_sync_jobs_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "data_sync_jobs_row_count_check" CHECK ("row_count" >= 0),
  CONSTRAINT "data_sync_jobs_date_range_check" CHECK ("from_date" IS NULL OR "to_date" IS NULL OR "from_date" <= "to_date")
);

CREATE TABLE "strategy_definitions" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "code" VARCHAR(64) NOT NULL,
  "name" VARCHAR(128) NOT NULL,
  "version" VARCHAR(32) NOT NULL,
  "status" "StrategyStatus" NOT NULL DEFAULT 'DRAFT',
  "description" TEXT,
  "parameters" JSONB NOT NULL,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(6) NOT NULL,
  CONSTRAINT "strategy_definitions_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "backtest_runs" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "strategy_definition_id" UUID NOT NULL,
  "status" "BacktestStatus" NOT NULL DEFAULT 'PENDING',
  "start_date" DATE NOT NULL,
  "end_date" DATE NOT NULL,
  "initial_cash" DECIMAL(24,6) NOT NULL,
  "commission_rate" DECIMAL(12,8) NOT NULL,
  "slippage_rate" DECIMAL(12,8) NOT NULL,
  "annualized_return" DECIMAL(18,8),
  "max_drawdown" DECIMAL(18,8),
  "sharpe_ratio" DECIMAL(18,8),
  "win_rate" DECIMAL(18,8),
  "error_message" TEXT,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(6) NOT NULL,
  CONSTRAINT "backtest_runs_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "backtest_runs_date_range_check" CHECK ("start_date" <= "end_date"),
  CONSTRAINT "backtest_runs_cost_check" CHECK ("initial_cash" > 0 AND "commission_rate" >= 0 AND "slippage_rate" >= 0)
);

CREATE TABLE "backtest_equity_points" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "backtest_run_id" UUID NOT NULL,
  "trade_date" DATE NOT NULL,
  "total_equity" DECIMAL(24,6) NOT NULL,
  "cash" DECIMAL(24,6) NOT NULL,
  "market_value" DECIMAL(24,6) NOT NULL,
  "daily_return" DECIMAL(18,8) NOT NULL,
  "drawdown" DECIMAL(18,8) NOT NULL,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "backtest_equity_points_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "securities_ts_code_key" ON "securities"("ts_code");
CREATE INDEX "securities_exchange_symbol_idx" ON "securities"("exchange", "symbol");
CREATE INDEX "securities_security_type_listing_status_idx" ON "securities"("security_type", "listing_status");

CREATE UNIQUE INDEX "trading_calendars_exchange_trade_date_key" ON "trading_calendars"("exchange", "trade_date");
CREATE INDEX "trading_calendars_exchange_is_open_trade_date_idx" ON "trading_calendars"("exchange", "is_open", "trade_date");

CREATE UNIQUE INDEX "daily_bars_security_id_trade_date_key" ON "daily_bars"("security_id", "trade_date");
CREATE INDEX "daily_bars_trade_date_idx" ON "daily_bars"("trade_date");
CREATE INDEX "daily_bars_security_id_trade_date_idx" ON "daily_bars"("security_id", "trade_date" DESC);
CREATE INDEX "daily_bars_is_suspended_is_limit_up_is_limit_down_idx" ON "daily_bars"("is_suspended", "is_limit_up", "is_limit_down");

CREATE UNIQUE INDEX "minute_bars_security_id_frequency_started_at_key" ON "minute_bars"("security_id", "frequency", "started_at");
CREATE INDEX "minute_bars_frequency_started_at_idx" ON "minute_bars"("frequency", "started_at");

CREATE UNIQUE INDEX "adjustment_factors_security_id_trade_date_key" ON "adjustment_factors"("security_id", "trade_date");
CREATE INDEX "adjustment_factors_trade_date_idx" ON "adjustment_factors"("trade_date");

CREATE UNIQUE INDEX "special_statuses_security_id_trade_date_key" ON "special_statuses"("security_id", "trade_date");
CREATE INDEX "special_statuses_trade_date_is_st_is_suspended_idx" ON "special_statuses"("trade_date", "is_st", "is_suspended");

CREATE INDEX "corporate_actions_security_id_ex_date_idx" ON "corporate_actions"("security_id", "ex_date");
CREATE INDEX "corporate_actions_action_type_ex_date_idx" ON "corporate_actions"("action_type", "ex_date");

CREATE INDEX "data_sync_jobs_source_dataset_status_idx" ON "data_sync_jobs"("source", "dataset", "status");
CREATE INDEX "data_sync_jobs_created_at_idx" ON "data_sync_jobs"("created_at");

CREATE UNIQUE INDEX "strategy_definitions_code_key" ON "strategy_definitions"("code");
CREATE INDEX "strategy_definitions_status_code_idx" ON "strategy_definitions"("status", "code");

CREATE INDEX "backtest_runs_strategy_definition_id_created_at_idx" ON "backtest_runs"("strategy_definition_id", "created_at");
CREATE INDEX "backtest_runs_status_created_at_idx" ON "backtest_runs"("status", "created_at");

CREATE UNIQUE INDEX "backtest_equity_points_backtest_run_id_trade_date_key" ON "backtest_equity_points"("backtest_run_id", "trade_date");
CREATE INDEX "backtest_equity_points_trade_date_idx" ON "backtest_equity_points"("trade_date");

ALTER TABLE "daily_bars" ADD CONSTRAINT "daily_bars_security_id_fkey" FOREIGN KEY ("security_id") REFERENCES "securities"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "minute_bars" ADD CONSTRAINT "minute_bars_security_id_fkey" FOREIGN KEY ("security_id") REFERENCES "securities"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "adjustment_factors" ADD CONSTRAINT "adjustment_factors_security_id_fkey" FOREIGN KEY ("security_id") REFERENCES "securities"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "special_statuses" ADD CONSTRAINT "special_statuses_security_id_fkey" FOREIGN KEY ("security_id") REFERENCES "securities"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "corporate_actions" ADD CONSTRAINT "corporate_actions_security_id_fkey" FOREIGN KEY ("security_id") REFERENCES "securities"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "backtest_runs" ADD CONSTRAINT "backtest_runs_strategy_definition_id_fkey" FOREIGN KEY ("strategy_definition_id") REFERENCES "strategy_definitions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "backtest_equity_points" ADD CONSTRAINT "backtest_equity_points_backtest_run_id_fkey" FOREIGN KEY ("backtest_run_id") REFERENCES "backtest_runs"("id") ON DELETE CASCADE ON UPDATE CASCADE;
