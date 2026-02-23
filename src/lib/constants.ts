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
  // Organization Roles - DEPRECATED: Use is_staff + staff_permissions instead
  REVAMPIT_SUPER_ADMIN: 'revampit_super_admin',
  REVAMPIT_ADMIN: 'revampit_admin',
  REVAMPIT_EDITOR: 'revampit_editor',
  REVAMPIT_SUPPORT: 'revampit_support',

  // Business Partner Roles - DEPRECATED
  PARTNER_ADMIN: 'partner_admin',
  PARTNER_STAFF: 'partner_staff',

  // Hirn Dashboard Roles - DEPRECATED: Use staff_permissions instead
  HIRN_ADMIN: 'hirn_admin',
  HIRN_USER: 'hirn_user',

  // Community Roles - STILL ACTIVE: Used for seller/repairer profiles
  MODERATOR: 'moderator',
  SELLER: 'seller',
  REPAIRER: 'repairer',
  TECHNICAL_EXPERT: 'technical_expert',

  // Customer Roles - DEPRECATED: Regular users don't need roles
  PREMIUM_CUSTOMER: 'premium_customer',
  VERIFIED_CUSTOMER: 'verified_customer',
  CUSTOMER: 'customer'
} as const

export type UserRole = typeof ROLES[keyof typeof ROLES]

// =============================================================================
// CONTACT & SHOP CONSTANTS
// =============================================================================

export const CONTACT_EMAIL = 'empfang@revamp-it.ch'

export const SHOP_ONLINE_URL = 'https://revamp-it.ch/shop'
export const SHOPWARE_URL = 'https://revamp-it.ch/shop-sw'
export const STORE_ADDRESS = 'Hohlstrasse 89, 8004 Zürich'
export const STORE_GOOGLE_MAPS_URL = 'https://maps.google.com/?q=Hohlstrasse+89+8004+Zürich'
export const STORE_OSM_URL = 'https://www.openstreetmap.org/?mlat=47.378&mlon=8.527#map=17/47.378/8.527'
export const WAREHOUSE_GOOGLE_MAPS_URL = 'https://maps.google.com/?q=Hohlstrasse+89+8004+Zürich'
export const WAREHOUSE_OSM_URL = 'https://www.openstreetmap.org/?mlat=47.378&mlon=8.527#map=17/47.378/8.527'

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