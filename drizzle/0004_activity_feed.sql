-- Team activity feed — lightweight event log for the dashboard
-- Written to from service functions after successful actions.
-- Read by TeamActivityFeed server component for 'lead' dashboard mode.

CREATE TABLE IF NOT EXISTS "activity_feed" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "actor_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "action" text NOT NULL,
  "subject_type" text,
  "subject_id" text,
  "subject_label" text,
  "created_at" timestamptz NOT NULL DEFAULT now()
);--> statement-breakpoint

CREATE INDEX IF NOT EXISTS "idx_activity_feed_created" ON "activity_feed"("created_at" DESC);--> statement-breakpoint
