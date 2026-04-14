-- Job runs table for system health monitoring
-- Written to from background jobs (Kivvi sync, cron, email dispatch).
-- Read by SystemHealthBar server component.

CREATE TABLE IF NOT EXISTS "job_runs" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "job_name" text NOT NULL,
  "ran_at" timestamptz NOT NULL DEFAULT now(),
  "success" boolean NOT NULL,
  "detail" text
);--> statement-breakpoint

CREATE INDEX IF NOT EXISTS "idx_job_runs_name_ran_at" ON "job_runs"("job_name", "ran_at" DESC);--> statement-breakpoint
