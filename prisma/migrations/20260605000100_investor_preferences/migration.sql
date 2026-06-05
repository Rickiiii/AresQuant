CREATE TABLE "investor_preferences" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "owner" VARCHAR(64) NOT NULL,
  "horizon" VARCHAR(128) NOT NULL,
  "core_view" TEXT NOT NULL,
  "robotics_max_weight_percent" DECIMAL(10, 4) NOT NULL,
  "single_stock_max_drawdown_percent" DECIMAL(10, 4) NOT NULL,
  "portfolio_max_drawdown_percent" DECIMAL(10, 4) NOT NULL,
  "core_holdings" JSONB NOT NULL DEFAULT '[]',
  "satellite_holdings" JSONB NOT NULL DEFAULT '[]',
  "rebalance_cadence" VARCHAR(128) NOT NULL,
  "cash_plan" TEXT NOT NULL,
  "trim_order" JSONB NOT NULL DEFAULT '[]',
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "investor_preferences_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "investor_preferences_owner_key" ON "investor_preferences"("owner");
