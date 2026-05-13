ALTER TYPE "Exchange" ADD VALUE IF NOT EXISTS 'BJSE';

CREATE TYPE "DataSyncLogStatus" AS ENUM ('PENDING', 'RUNNING', 'SUCCESS', 'FAILED');

ALTER TABLE "trading_calendars" ADD COLUMN IF NOT EXISTS "pre_trade_date" DATE;
ALTER TABLE "trading_calendars" ADD COLUMN IF NOT EXISTS "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE "daily_bars" ALTER COLUMN "security_id" DROP NOT NULL;
ALTER TABLE "daily_bars" ADD COLUMN IF NOT EXISTS "symbol" VARCHAR(12);
ALTER TABLE "daily_bars" ADD COLUMN IF NOT EXISTS "ts_code" VARCHAR(16);
ALTER TABLE "daily_bars" ADD COLUMN IF NOT EXISTS "pre_close" DECIMAL(18,6);
ALTER TABLE "daily_bars" ALTER COLUMN "source" SET DEFAULT 'mock';

CREATE TABLE "stocks" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "symbol" VARCHAR(12) NOT NULL,
  "ts_code" VARCHAR(16) NOT NULL,
  "name" VARCHAR(64) NOT NULL,
  "exchange" "Exchange" NOT NULL,
  "market" VARCHAR(32) NOT NULL,
  "industry" VARCHAR(128),
  "area" VARCHAR(64),
  "list_date" DATE NOT NULL,
  "delist_date" DATE,
  "is_active" BOOLEAN NOT NULL DEFAULT true,
  "is_st" BOOLEAN NOT NULL DEFAULT false,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "stocks_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "index_daily_bars" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "index_code" VARCHAR(16) NOT NULL,
  "trade_date" DATE NOT NULL,
  "open" DECIMAL(18,6) NOT NULL,
  "high" DECIMAL(18,6) NOT NULL,
  "low" DECIMAL(18,6) NOT NULL,
  "close" DECIMAL(18,6) NOT NULL,
  "pre_close" DECIMAL(18,6) NOT NULL,
  "change" DECIMAL(18,6) NOT NULL,
  "pct_change" DECIMAL(12,6) NOT NULL,
  "volume" DECIMAL(24,6) NOT NULL,
  "amount" DECIMAL(24,6) NOT NULL,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "index_daily_bars_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "index_daily_bars_price_check" CHECK ("high" >= "low" AND "high" >= "open" AND "high" >= "close" AND "low" <= "open" AND "low" <= "close"),
  CONSTRAINT "index_daily_bars_volume_check" CHECK ("volume" >= 0 AND "amount" >= 0)
);

CREATE TABLE "limit_prices" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "symbol" VARCHAR(12) NOT NULL,
  "trade_date" DATE NOT NULL,
  "up_limit" DECIMAL(18,6) NOT NULL,
  "down_limit" DECIMAL(18,6) NOT NULL,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "limit_prices_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "limit_prices_range_check" CHECK ("up_limit" >= "down_limit")
);

CREATE TABLE "suspensions" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "symbol" VARCHAR(12) NOT NULL,
  "trade_date" DATE NOT NULL,
  "suspend_type" VARCHAR(64) NOT NULL,
  "reason" VARCHAR(255),
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "suspensions_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "adj_factors" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "symbol" VARCHAR(12) NOT NULL,
  "trade_date" DATE NOT NULL,
  "factor" DECIMAL(24,12) NOT NULL,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "adj_factors_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "adj_factors_factor_check" CHECK ("factor" > 0)
);

CREATE TABLE "financial_factors" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "symbol" VARCHAR(12) NOT NULL,
  "report_date" DATE NOT NULL,
  "ann_date" DATE NOT NULL,
  "pe" DECIMAL(18,6),
  "pb" DECIMAL(18,6),
  "ps" DECIMAL(18,6),
  "roe" DECIMAL(18,6),
  "roa" DECIMAL(18,6),
  "gross_margin" DECIMAL(18,6),
  "net_profit_margin" DECIMAL(18,6),
  "debt_to_asset" DECIMAL(18,6),
  "revenue_growth" DECIMAL(18,6),
  "profit_growth" DECIMAL(18,6),
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "financial_factors_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "data_sync_logs" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "task_name" VARCHAR(128) NOT NULL,
  "data_type" VARCHAR(64) NOT NULL,
  "status" "DataSyncLogStatus" NOT NULL DEFAULT 'PENDING',
  "start_time" TIMESTAMPTZ(6),
  "end_time" TIMESTAMPTZ(6),
  "total_count" INTEGER NOT NULL DEFAULT 0,
  "success_count" INTEGER NOT NULL DEFAULT 0,
  "failed_count" INTEGER NOT NULL DEFAULT 0,
  "error_message" TEXT,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "data_sync_logs_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "data_sync_logs_count_check" CHECK ("total_count" >= 0 AND "success_count" >= 0 AND "failed_count" >= 0)
);

CREATE UNIQUE INDEX "stocks_symbol_key" ON "stocks"("symbol");
CREATE UNIQUE INDEX "stocks_ts_code_key" ON "stocks"("ts_code");
CREATE INDEX "stocks_exchange_market_idx" ON "stocks"("exchange", "market");
CREATE INDEX "stocks_is_active_is_st_idx" ON "stocks"("is_active", "is_st");

CREATE UNIQUE INDEX "daily_bars_symbol_trade_date_key" ON "daily_bars"("symbol", "trade_date");
CREATE INDEX "daily_bars_symbol_idx" ON "daily_bars"("symbol");
CREATE INDEX "daily_bars_symbol_trade_date_idx" ON "daily_bars"("symbol", "trade_date");

CREATE UNIQUE INDEX "index_daily_bars_index_code_trade_date_key" ON "index_daily_bars"("index_code", "trade_date");
CREATE INDEX "index_daily_bars_trade_date_idx" ON "index_daily_bars"("trade_date");
CREATE INDEX "index_daily_bars_index_code_trade_date_idx" ON "index_daily_bars"("index_code", "trade_date");

CREATE UNIQUE INDEX "limit_prices_symbol_trade_date_key" ON "limit_prices"("symbol", "trade_date");
CREATE INDEX "limit_prices_trade_date_idx" ON "limit_prices"("trade_date");

CREATE UNIQUE INDEX "suspensions_symbol_trade_date_key" ON "suspensions"("symbol", "trade_date");
CREATE INDEX "suspensions_trade_date_idx" ON "suspensions"("trade_date");

CREATE UNIQUE INDEX "adj_factors_symbol_trade_date_key" ON "adj_factors"("symbol", "trade_date");
CREATE INDEX "adj_factors_trade_date_idx" ON "adj_factors"("trade_date");

CREATE UNIQUE INDEX "financial_factors_symbol_report_date_key" ON "financial_factors"("symbol", "report_date");
CREATE INDEX "financial_factors_ann_date_idx" ON "financial_factors"("ann_date");

CREATE INDEX "data_sync_logs_task_name_data_type_status_idx" ON "data_sync_logs"("task_name", "data_type", "status");
CREATE INDEX "data_sync_logs_created_at_idx" ON "data_sync_logs"("created_at");
