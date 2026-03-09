// =============================================================================
// CUSTOMER DOMAIN SCHEMA
// =============================================================================
//
// Tables that were checked but DO NOT exist in the migration files:
//   - customer_preferences
//   - customer_segments
//   - user_segments
//   - customer_interactions
//
// The customer-related tables that DO exist in migrations are defined in
// inventory.ts:
//   - customer_profiles (012_customer_profiles_erfassung.sql)
//   - product_customer_profiles (012_customer_profiles_erfassung.sql)
//
// Re-exported here for domain-oriented imports.

export {
  customerProfiles,
  type CustomerProfile,
  type NewCustomerProfile,
  productCustomerProfiles,
  type ProductCustomerProfile,
  type NewProductCustomerProfile,
} from './inventory'
