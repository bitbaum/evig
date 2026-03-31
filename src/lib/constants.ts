/**
 * Shared constants for the application
 * These are safe to import in both client and server code
 *
 * AUTH SYSTEM: The new simplified system uses is_staff + staff_permissions.
 * See @/lib/permissions.ts for the SSOT.
 *
 * This file keeps:
 * - ROLES object (for SELLER/REPAIRER community role checks)
 * - UserRole type (for type compatibility)
 * - Contact/shop constants
 * - Re-exports from permissions.ts
 */

// =============================================================================
// ROLES - Kept for community role checks (SELLER, REPAIRER)
// =============================================================================

/**
 * User roles - primarily used for community roles (SELLER, REPAIRER).
 * For staff/admin checks, use the new system: is_staff + staff_permissions
 * @see @/lib/permissions.ts
 */
export const ROLES = {
  // Staff role — used in auth fallback. Migrate to is_staff + staff_permissions.
  REVAMPIT_ADMIN: 'revampit_admin',

  // Community Roles — actively used for seller/repairer profiles
  SELLER: 'seller',
  REPAIRER: 'repairer',

  // Default role for regular users
  CUSTOMER: 'customer',
} as const

export type UserRole = typeof ROLES[keyof typeof ROLES]

// =============================================================================
// CONTACT & SHOP CONSTANTS — re-exported from SSOT (@/config/org)
// =============================================================================

import { CONTACT, LOCATIONS, EXTERNAL_LINKS } from '@/config/org'

export const CONTACT_EMAIL = CONTACT.email
export const SUPPORT_EMAIL = CONTACT.supportEmail

export const SHOP_ONLINE_URL = EXTERNAL_LINKS.shopOnline
export const SHOPWARE_URL = EXTERNAL_LINKS.shopware
export const STORE_ADDRESS = LOCATIONS.store.full
export const STORE_GOOGLE_MAPS_URL = LOCATIONS.store.googleMapsUrl
export const STORE_OSM_URL = LOCATIONS.store.osmUrl
export const WAREHOUSE_GOOGLE_MAPS_URL = LOCATIONS.warehouse.googleMapsUrl
export const WAREHOUSE_OSM_URL = LOCATIONS.warehouse.osmUrl

// =============================================================================
// NEW SIMPLIFIED PERMISSION SYSTEM (v2)
// =============================================================================
// The above role system is being replaced with a simpler approach.
// Re-export from the new permissions module for easy migration.
// SSOT: All section definitions now come from @/config/sections.ts

export {
  // Permission system
  ADMIN_SECTIONS,
  STAFF_EMAIL_DOMAIN,
  SUPER_ADMIN_EMAILS,
  DEFAULT_STAFF_PERMISSIONS,
  CONTENT_STATUS,
  isStaffEmail,
  isSuperAdmin,
  canAccessSection,
  canAccessSensitive,
  getAccessibleSections,
  getInitialStaffPermissions,
  migrateOldRole,
  isSensitiveSection,
  // SSOT section data
  SECTIONS,
  ADMIN_SECTION_IDS,
  SENSITIVE_SECTION_IDS,
  getAdminSections,
  getDashboardSections,
  getSection,
  getSectionsByCategory,
  CATEGORIES,
  getSortedCategories,
} from './permissions'

export type {
  AdminSection,
  StaffUser,
  ContentStatus,
  SectionConfig,
  SectionCategory,
  SectionColor,
} from './permissions'