CREATE TYPE "PortfolioAccountType" AS ENUM ('STOCK', 'FUND', 'MIXED');
CREATE TYPE "PortfolioRiskLevel" AS ENUM ('LOW', 'MEDIUM', 'HIGH');
CREATE TYPE "PortfolioActionBias" AS ENUM ('HOLD', 'ADD', 'BUILD', 'WATCH', 'TAKE_PROFIT', 'RISK_CONTROL');
CREATE TYPE "PortfolioExposureSource" AS ENUM ('STOCK', 'FUND', 'MIXED');

CREATE TABLE "portfolio_accounts" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "owner" VARCHAR(64) NOT NULL,
  "name" VARCHAR(128) NOT NULL,
  "account_type" "PortfolioAccountType" NOT NULL DEFAULT 'MIXED',
  "total_asset_value" DECIMAL(24,6),
  "visible_asset_value" DECIMAL(24,6),
  "cash_amount" DECIMAL(24,6),
  "position_level" VARCHAR(64),
  "is_primary" BOOLEAN NOT NULL DEFAULT false,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "portfolio_accounts_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "portfolio_holdings" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "account_id" UUID NOT NULL,
  "symbol" VARCHAR(12) NOT NULL,
  "name" VARCHAR(64) NOT NULL,
  "quantity" INTEGER NOT NULL,
  "cost_price" DECIMAL(18,6) NOT NULL,
  "latest_price" DECIMAL(18,6),
  "market_value" DECIMAL(24,6),
  "unrealized_pnl" DECIMAL(24,6),
  "theme_tags" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "risk_level" "PortfolioRiskLevel" NOT NULL DEFAULT 'MEDIUM',
  "action_bias" "PortfolioActionBias" NOT NULL DEFAULT 'WATCH',
  "thesis" TEXT NOT NULL,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "portfolio_holdings_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "fund_holdings" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "account_id" UUID NOT NULL,
  "fund_code" VARCHAR(32),
  "name" VARCHAR(128) NOT NULL,
  "theme" VARCHAR(128) NOT NULL,
  "amount" DECIMAL(24,6) NOT NULL,
  "weight_percent" DECIMAL(10,4) NOT NULL,
  "risk_level" "PortfolioRiskLevel" NOT NULL DEFAULT 'MEDIUM',
  "action_bias" "PortfolioActionBias" NOT NULL DEFAULT 'WATCH',
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "fund_holdings_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "theme_exposures" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "account_id" UUID NOT NULL,
  "theme" VARCHAR(128) NOT NULL,
  "source" "PortfolioExposureSource" NOT NULL,
  "amount" DECIMAL(24,6),
  "weight_percent" DECIMAL(10,4),
  "action_bias" "PortfolioActionBias" NOT NULL DEFAULT 'WATCH',
  "risk_note" TEXT NOT NULL,
  "next_step" TEXT NOT NULL,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "theme_exposures_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "watchlist_items" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "account_id" UUID NOT NULL,
  "symbol" VARCHAR(12),
  "name" VARCHAR(128) NOT NULL,
  "theme" VARCHAR(128) NOT NULL,
  "reason" TEXT NOT NULL,
  "action_bias" "PortfolioActionBias" NOT NULL DEFAULT 'WATCH',
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "watchlist_items_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "portfolio_accounts_owner_is_primary_idx" ON "portfolio_accounts"("owner", "is_primary");
CREATE UNIQUE INDEX "portfolio_accounts_owner_name_key" ON "portfolio_accounts"("owner", "name");
CREATE UNIQUE INDEX "portfolio_holdings_account_id_symbol_key" ON "portfolio_holdings"("account_id", "symbol");
CREATE INDEX "portfolio_holdings_symbol_idx" ON "portfolio_holdings"("symbol");
CREATE INDEX "portfolio_holdings_account_id_action_bias_idx" ON "portfolio_holdings"("account_id", "action_bias");
CREATE UNIQUE INDEX "fund_holdings_account_id_name_theme_key" ON "fund_holdings"("account_id", "name", "theme");
CREATE INDEX "fund_holdings_theme_idx" ON "fund_holdings"("theme");
CREATE INDEX "fund_holdings_account_id_action_bias_idx" ON "fund_holdings"("account_id", "action_bias");
CREATE UNIQUE INDEX "theme_exposures_account_id_theme_source_key" ON "theme_exposures"("account_id", "theme", "source");
CREATE INDEX "theme_exposures_theme_idx" ON "theme_exposures"("theme");
CREATE INDEX "theme_exposures_account_id_action_bias_idx" ON "theme_exposures"("account_id", "action_bias");
CREATE INDEX "watchlist_items_account_id_action_bias_idx" ON "watchlist_items"("account_id", "action_bias");
CREATE INDEX "watchlist_items_symbol_idx" ON "watchlist_items"("symbol");

ALTER TABLE "portfolio_holdings" ADD CONSTRAINT "portfolio_holdings_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "portfolio_accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "fund_holdings" ADD CONSTRAINT "fund_holdings_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "portfolio_accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "theme_exposures" ADD CONSTRAINT "theme_exposures_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "portfolio_accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "watchlist_items" ADD CONSTRAINT "watchlist_items_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "portfolio_accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
