-- Add dashboard_mode preference to users
-- Controls which dashboard layout variant the user sees:
--   coordinator (default) — UnifiedQueue first, Monatsüberblick collapsed
--   lead                  — Monatsüberblick expanded, team feed visible
--   volunteer             — PersonalSection largest, queue compact

ALTER TABLE "users" ADD COLUMN "dashboard_mode" text NOT NULL DEFAULT 'coordinator';--> statement-breakpoint
