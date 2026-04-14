-- Add background/rationale field to decisions
-- Separate from description (what we're deciding) — this is the "why" context

ALTER TABLE "decisions" ADD COLUMN "background" text;--> statement-breakpoint
