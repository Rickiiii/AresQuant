CREATE TYPE "BacktestTaskStatus" AS ENUM ('PENDING', 'RUNNING', 'SUCCESS', 'FAILED', 'CANCELED');
CREATE TYPE "BacktestOrderSide" AS ENUM ('BUY', 'SELL');
CREATE TYPE "BacktestOrderType" AS ENUM ('MARKET', 'LIMIT');
CREATE TYPE "BacktestOrderStatus" AS ENUM ('PENDING', 'FILLED', 'PARTIALLY_FILLED', 'REJECTED', 'CANCELED');

CREATE TABLE "backtest_tasks" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "name" VARCHAR(128) NOT NULL,
  "strategy_name" VARCHAR(128) NOT NULL,
  "status" "BacktestTaskStatus" NOT NULL DEFAULT 'PENDING',
  "start_date" DATE NOT NULL,
  "end_date" DATE NOT NULL,
  "initial_capital" DECIMAL(24,6) NOT NULL,
  "benchmark" VARCHAR(32),
  "config" JSONB NOT NULL,
  "error_message" TEXT,
  "started_at" TIMESTAMPTZ(6),
  "finished_at" TIMESTAMPTZ(6),
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "backtest_tasks_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "backtest_tasks_date_check" CHECK ("start_date" <= "end_date"),
  CONSTRAINT "backtest_tasks_capital_check" CHECK ("initial_capital" > 0)
);

CREATE TABLE "backtest_account_snapshots" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "task_id" UUID NOT NULL,
  "trade_date" DATE NOT NULL,
  "cash" DECIMAL(24,6) NOT NULL,
  "market_value" DECIMAL(24,6) NOT NULL,
  "total_asset" DECIMAL(24,6) NOT NULL,
  "daily_return" DECIMAL(18,8) NOT NULL,
  "cumulative_return" DECIMAL(18,8) NOT NULL,
  "drawdown" DECIMAL(18,8) NOT NULL,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "backtest_account_snapshots_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "backtest_positions" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "task_id" UUID NOT NULL,
  "symbol" VARCHAR(12) NOT NULL,
  "trade_date" DATE NOT NULL,
  "quantity" INTEGER NOT NULL,
  "available_quantity" INTEGER NOT NULL,
  "avg_cost" DECIMAL(18,6) NOT NULL,
  "last_price" DECIMAL(18,6) NOT NULL,
  "market_value" DECIMAL(24,6) NOT NULL,
  "unrealized_pnl" DECIMAL(24,6) NOT NULL,
  "realized_pnl" DECIMAL(24,6) NOT NULL,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "backtest_positions_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "backtest_orders" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "task_id" UUID NOT NULL,
  "symbol" VARCHAR(12) NOT NULL,
  "trade_date" DATE NOT NULL,
  "side" "BacktestOrderSide" NOT NULL,
  "order_type" "BacktestOrderType" NOT NULL,
  "price" DECIMAL(18,6) NOT NULL,
  "quantity" INTEGER NOT NULL,
  "filled_quantity" INTEGER NOT NULL DEFAULT 0,
  "avg_filled_price" DECIMAL(18,6),
  "status" "BacktestOrderStatus" NOT NULL DEFAULT 'PENDING',
  "reason" VARCHAR(64),
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "backtest_orders_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "backtest_trades" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "task_id" UUID NOT NULL,
  "order_id" UUID NOT NULL,
  "symbol" VARCHAR(12) NOT NULL,
  "trade_date" DATE NOT NULL,
  "side" "BacktestOrderSide" NOT NULL,
  "price" DECIMAL(18,6) NOT NULL,
  "quantity" INTEGER NOT NULL,
  "amount" DECIMAL(24,6) NOT NULL,
  "commission" DECIMAL(18,6) NOT NULL,
  "stamp_duty" DECIMAL(18,6) NOT NULL,
  "transfer_fee" DECIMAL(18,6) NOT NULL,
  "total_fee" DECIMAL(18,6) NOT NULL,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "backtest_trades_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "backtest_metrics" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "task_id" UUID NOT NULL,
  "total_return" DECIMAL(18,8) NOT NULL,
  "annualized_return" DECIMAL(18,8) NOT NULL,
  "max_drawdown" DECIMAL(18,8) NOT NULL,
  "sharpe_ratio" DECIMAL(18,8) NOT NULL,
  "sortino_ratio" DECIMAL(18,8) NOT NULL,
  "calmar_ratio" DECIMAL(18,8) NOT NULL,
  "win_rate" DECIMAL(18,8) NOT NULL,
  "profit_loss_ratio" DECIMAL(18,8) NOT NULL,
  "volatility" DECIMAL(18,8) NOT NULL,
  "beta" DECIMAL(18,8),
  "alpha" DECIMAL(18,8),
  "turnover_rate" DECIMAL(18,8) NOT NULL,
  "trade_count" INTEGER NOT NULL,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "backtest_metrics_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "backtest_tasks_status_created_at_idx" ON "backtest_tasks"("status", "created_at");
CREATE UNIQUE INDEX "backtest_account_snapshots_task_id_trade_date_key" ON "backtest_account_snapshots"("task_id", "trade_date");
CREATE INDEX "backtest_account_snapshots_task_id_idx" ON "backtest_account_snapshots"("task_id");
CREATE INDEX "backtest_positions_task_id_idx" ON "backtest_positions"("task_id");
CREATE INDEX "backtest_positions_task_id_trade_date_idx" ON "backtest_positions"("task_id", "trade_date");
CREATE INDEX "backtest_positions_task_id_symbol_idx" ON "backtest_positions"("task_id", "symbol");
CREATE INDEX "backtest_orders_task_id_idx" ON "backtest_orders"("task_id");
CREATE INDEX "backtest_orders_task_id_trade_date_idx" ON "backtest_orders"("task_id", "trade_date");
CREATE INDEX "backtest_orders_task_id_symbol_idx" ON "backtest_orders"("task_id", "symbol");
CREATE INDEX "backtest_trades_task_id_idx" ON "backtest_trades"("task_id");
CREATE INDEX "backtest_trades_task_id_trade_date_idx" ON "backtest_trades"("task_id", "trade_date");
CREATE INDEX "backtest_trades_order_id_idx" ON "backtest_trades"("order_id");
CREATE UNIQUE INDEX "backtest_metrics_task_id_key" ON "backtest_metrics"("task_id");

ALTER TABLE "backtest_account_snapshots" ADD CONSTRAINT "backtest_account_snapshots_task_id_fkey" FOREIGN KEY ("task_id") REFERENCES "backtest_tasks"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "backtest_positions" ADD CONSTRAINT "backtest_positions_task_id_fkey" FOREIGN KEY ("task_id") REFERENCES "backtest_tasks"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "backtest_orders" ADD CONSTRAINT "backtest_orders_task_id_fkey" FOREIGN KEY ("task_id") REFERENCES "backtest_tasks"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "backtest_trades" ADD CONSTRAINT "backtest_trades_task_id_fkey" FOREIGN KEY ("task_id") REFERENCES "backtest_tasks"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "backtest_trades" ADD CONSTRAINT "backtest_trades_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "backtest_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "backtest_metrics" ADD CONSTRAINT "backtest_metrics_task_id_fkey" FOREIGN KEY ("task_id") REFERENCES "backtest_tasks"("id") ON DELETE CASCADE ON UPDATE CASCADE;
