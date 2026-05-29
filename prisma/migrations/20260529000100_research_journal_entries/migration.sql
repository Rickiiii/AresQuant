CREATE TABLE "research_journal_entries" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "owner" VARCHAR(64) NOT NULL DEFAULT 'Ricki',
  "note_date" DATE NOT NULL,
  "title" VARCHAR(160) NOT NULL,
  "top_conclusion" TEXT NOT NULL,
  "action_items" JSONB NOT NULL DEFAULT '[]',
  "disconfirming_evidence" JSONB NOT NULL DEFAULT '[]',
  "next_focus" JSONB NOT NULL DEFAULT '[]',
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "research_journal_entries_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "research_journal_entries_owner_note_date_title_key" ON "research_journal_entries"("owner", "note_date", "title");
CREATE INDEX "research_journal_entries_owner_note_date_idx" ON "research_journal_entries"("owner", "note_date");
