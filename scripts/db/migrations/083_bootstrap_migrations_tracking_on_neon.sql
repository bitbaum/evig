-- Migration 083: Bootstrap schema_migrations tracking + backfill
--
-- Migration 075 introduced the `schema_migrations` table along with a
-- backfill of pre-075 filenames. That migration was authored but never
-- applied to Neon — verified 2026-06-03 via:
--   SELECT EXISTS (SELECT 1 FROM pg_tables WHERE tablename='schema_migrations')
--     → returned `f`
-- Without this table, scripts/db/run-migration.sh can't skip-if-applied,
-- and a Neon restore-from-backup would re-attempt every migration —
-- pre-077 ones aren't idempotent so they'd fail on duplicate CREATE TABLE.
--
-- This migration:
--   1. Creates the table (idempotent via IF NOT EXISTS).
--   2. Backfills every migration filename present in scripts/db/migrations/
--      as "applied" (ON CONFLICT DO NOTHING so re-runs are safe).
--
-- Apply this BEFORE adding any new migrations to Neon. After this lands,
-- run-migration.sh will skip already-tracked files and only apply new ones.

CREATE TABLE IF NOT EXISTS schema_migrations (
  filename TEXT PRIMARY KEY,
  applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_schema_migrations_applied_at
  ON schema_migrations(applied_at);

-- Backfill: every existing migration file (001 through 082) — these have
-- already been applied to production (the live schema reflects them all).
-- Future migrations starting at 084+ will be tracked automatically by
-- the runner. Note: 083 itself is inserted at the end so re-running this
-- file is a no-op.

INSERT INTO schema_migrations (filename) VALUES
  ('001-unified-auth.sql'),
  ('002b-simplified-auth.sql'),
  ('002-fix-auth-columns.sql'),
  ('003-permission-requests.sql'),
  ('004b_ai_inventory_system.sql'),
  ('004-super-admin-management.sql'),
  ('004_ai_inventory_system.sql'),
  ('005b_auth_hardening_and_indexes.sql'),
  ('005c_messaging_system.sql'),
  ('005-hirn-ai-rag.sql'),
  ('005_messaging_system.sql'),
  ('006_seller_system.sql'),
  ('007_orders_system.sql'),
  ('008b_repairer_system.sql'),
  ('008_payment_processing_system.sql'),
  ('009_repair_booking_enhancements.sql'),
  ('010_peer_repair_system.sql'),
  ('011_workshop_materials.sql'),
  ('012_customer_profiles_erfassung.sql'),
  ('013_it_hilfe_user_skills.sql'),
  ('014_add_it_hilfe_conversation_type.sql'),
  ('015_content_management.sql'),
  ('016_workshop_proposals.sql'),
  ('017_service_types_alignment.sql'),
  ('018_service_presentation_fields.sql'),
  ('019_blog_submissions.sql'),
  ('020b_team_profiles.sql'),
  ('020_donations_extension.sql'),
  ('021_task_management.sql'),
  ('022_activity_stream.sql'),
  ('023_fix_users_trigger.sql'),
  ('025_meeting_protocols.sql'),
  ('026_it_hilfe_ai_diagnosis.sql'),
  ('027b_protocol_input_method.sql'),
  ('027_decisions_voting.sql'),
  ('028_decision_action_links.sql'),
  ('029_protocol_decision_voting.sql'),
  ('030_seed_it_hilfe_technicians.sql'),
  ('031_p2p_marketplace.sql'),
  ('032_marketplace_messaging.sql'),
  ('033_profile_avatar_and_settings.sql'),
  ('034_admin_edit_submissions.sql'),
  ('035_org_numbers.sql'),
  ('036_hirn_provider_settings_uniqueness.sql'),
  ('037_add_medusa_variant_id.sql'),
  ('038_workshop_schema_enhancement.sql'),
  ('039_notification_type_fix.sql'),
  ('040b_payrexx_marketplace.sql'),
  ('040_notification_type_task_request_response.sql'),
  ('041_marketplace_performance_indexes.sql'),
  ('042_newsletter_confirm_token.sql'),
  ('043_marketplace_specs_and_verification.sql'),
  ('044_listing_reports.sql'),
  ('045_admin_management_columns.sql'),
  ('046_unified_intake.sql'),
  ('047_intake_timeline.sql'),
  ('048_subscription_pools.sql'),
  ('049_it_hilfe_budget_tier.sql'),
  ('050_payrexx_provider.sql'),
  ('051_connect_ithilfe_repairers.sql'),
  ('052_fix_order_status_constraint.sql'),
  ('053_locations_missing_columns.sql'),
  ('054_task_due_dates.sql'),
  ('055_missing_indexes.sql'),
  ('056_task_assigned_to.sql'),
  ('057_decision_categories_deadlines.sql'),
  ('058_blog_submission_requires_changes.sql'),
  ('059_it_hilfe_completion.sql'),
  ('060_marketplace_order_timestamps.sql'),
  ('061_unify_technician_profiles.sql'),
  ('062_membership_system.sql'),
  ('063_decisions_enhancements.sql'),
  ('064_canton_on_repairer_profiles.sql'),
  ('065_decisions_background_field.sql'),
  ('066_anonymous_public_voting.sql'),
  ('067_timecards.sql'),
  ('068_workshop_proposal_link.sql'),
  ('069_notification_types_extend.sql'),
  ('070_referral_and_coupons.sql'),
  ('071_it_hilfe_kill_in_discussion.sql'),
  ('072_user_token_version.sql'),
  ('073_drop_dead_schema_objects.sql'),
  ('074_query_performance_composite_indexes.sql'),
  ('075_schema_migrations_tracking.sql'),
  ('076_workshop_instance_exclude_overlap.sql'),
  ('077_payment_transactions_user_restrict.sql'),
  ('078_refunds_fk_restrict.sql'),
  ('079_invariant_check_constraints.sql'),
  ('080_team_compensation_and_leave.sql'),
  ('081_audit_actor_fks_set_null.sql'),
  ('082_projects_needs_contributions.sql') 
ON CONFLICT (filename) DO NOTHING;

-- Self-record after backfilling everything else.
INSERT INTO schema_migrations (filename) VALUES
  ('083_bootstrap_migrations_tracking_on_neon.sql')
ON CONFLICT (filename) DO NOTHING;
