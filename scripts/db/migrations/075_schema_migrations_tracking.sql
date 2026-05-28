-- Migration 075: Schema migrations tracking table
--
-- The runner at scripts/db/run-migration.sh previously ran every .sql
-- file under scripts/db/migrations/ on every invocation, with no record
-- of what had already been applied. Most migrations are idempotent
-- (`IF NOT EXISTS` / `IF EXISTS` guards), but a handful are not — most
-- notably 061_unify_technician_profiles.sql which does a raw INSERT of
-- helper-profile rows into repairer_profiles. A re-run against an
-- already-populated database would crash on the duplicate-id INSERT
-- and leave the migration half-applied.
--
-- This migration creates schema_migrations(filename PK, applied_at)
-- and bootstraps it with the 74 historical filenames. The updated
-- runner script reads this table to skip files already recorded as
-- applied, wraps each new file in a transaction, and records the
-- filename on success.
--
-- Bootstrap rationale: production already has every numbered migration
-- applied (the app is running on this schema). The bootstrap is a
-- pure record-keeping insert with no schema effect. Listing each file
-- explicitly — rather than `INSERT ... FROM pg_class` or similar —
-- gives anyone reviewing this file an unambiguous "yes, this is
-- exactly what we consider already-applied at the moment 075 ships".

CREATE TABLE IF NOT EXISTS schema_migrations (
  filename TEXT PRIMARY KEY,
  applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO schema_migrations (filename) VALUES
  ('001-unified-auth.sql'),
  ('002-fix-auth-columns.sql'),
  ('002b-simplified-auth.sql'),
  ('003-permission-requests.sql'),
  ('004-super-admin-management.sql'),
  ('004_ai_inventory_system.sql'),
  ('004b_ai_inventory_system.sql'),
  ('005-hirn-ai-rag.sql'),
  ('005_messaging_system.sql'),
  ('005b_auth_hardening_and_indexes.sql'),
  ('005c_messaging_system.sql'),
  ('006_seller_system.sql'),
  ('007_orders_system.sql'),
  ('008_payment_processing_system.sql'),
  ('008b_repairer_system.sql'),
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
  ('020_donations_extension.sql'),
  ('020b_team_profiles.sql'),
  ('021_task_management.sql'),
  ('022_activity_stream.sql'),
  ('023_fix_users_trigger.sql'),
  ('025_meeting_protocols.sql'),
  ('026_it_hilfe_ai_diagnosis.sql'),
  ('027_decisions_voting.sql'),
  ('027b_protocol_input_method.sql'),
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
  ('040_notification_type_task_request_response.sql'),
  ('040b_payrexx_marketplace.sql'),
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
  ('074_query_performance_composite_indexes.sql')
ON CONFLICT (filename) DO NOTHING;
