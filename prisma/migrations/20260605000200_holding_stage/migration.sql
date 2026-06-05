ALTER TABLE "portfolio_holdings"
  ADD COLUMN "buy_date" DATE,
  ADD COLUMN "holding_stage" VARCHAR(32);

UPDATE "portfolio_holdings"
SET "holding_stage" = 'holding'
WHERE "holding_stage" IS NULL;
