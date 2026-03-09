// =============================================================================
// REVIEWS SCHEMA
// =============================================================================
// The following tables are referenced in TABLE_NAMES (src/config/database.ts)
// but have NO corresponding migration files defining their structure:
//
//   - reviews
//   - review_attachments
//   - review_responses
//   - review_votes
//   - review_moderation_log
//
// These tables are skipped per the rule: "If a table is referenced in
// TABLE_NAMES but NOT defined in any migration, skip it."
//
// When migrations are created for these tables, add the Drizzle definitions
// here following the same patterns used in the other schema files.
//
// Note: Repairer-specific reviews (repairer_reviews) are defined in
// src/db/schema/services.ts, based on 008_repairer_system.sql.
// =============================================================================

// Placeholder export so TypeScript treats this file as a module.
// Remove once real table definitions are added.
export {}
