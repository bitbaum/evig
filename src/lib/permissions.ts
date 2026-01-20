/**
 * RevampIT Simplified Permission System
 *
 * This replaces the complex 15+ role system with a simple approach:
 * - Regular users: No roles, just create content that needs approval
 * - Staff (@revamp-it.ch): Access to admin with granular permissions
 *
 * KISS, DRY, SSOT principles applied.
 */

// =============================================================================
// ADMIN SECTIONS - Define what sections exist in the admin dashboard
// =============================================================================

export const ADMIN_SECTIONS = {
  // Core sections - most staff can see
  dashboard: {
    label: 'Dashboard',
    path: '/admin',
    sensitive: false,
    description: 'Übersicht und Statistiken'
  },
  products: {
    label: 'Produkte',
    path: '/admin/products',
    sensitive: false,
    description: 'Produktverwaltung und Inventar'
  },
  workshops: {
    label: 'Workshops',
    path: '/admin/workshops',
    sensitive: false,
    description: 'Workshop-Verwaltung und Anmeldungen'
  },
  services: {
    label: 'Dienstleistungen',
    path: '/admin/services',
    sensitive: false,
    description: 'Service-Angebote verwalten'
  },
  locations: {
    label: 'Standorte',
    path: '/admin/locations',
    sensitive: false,
    description: 'Standortverwaltung'
  },
  reviews: {
    label: 'Bewertungen',
    path: '/admin/reviews',
    sensitive: false,
    description: 'Bewertungen moderieren'
  },
  content: {
    label: 'Inhalte',
    path: '/admin/content',
    sensitive: false,
    description: 'Blog, Seiten, Medien'
  },

  // Approval queue - for user-submitted content
  approvals: {
    label: 'Freigaben',
    path: '/admin/approvals',
    sensitive: false,
    description: 'Eingereichte Inhalte prüfen und freigeben'
  },

  // Sensitive sections - limited access
  users: {
    label: 'Benutzer',
    path: '/admin/users',
    sensitive: true,
    description: 'Benutzerverwaltung'
  },
  team: {
    label: 'Team & HR',
    path: '/admin/team',
    sensitive: true,
    description: 'Mitarbeiter, Freiwillige, Praktikanten'
  },
  finances: {
    label: 'Finanzen',
    path: '/admin/hirn/finanzen',
    sensitive: true,
    description: 'Finanzübersicht und Berichte'
  },
  analytics: {
    label: 'Analytics',
    path: '/admin/analytics',
    sensitive: false,
    description: 'Statistiken und Auswertungen'
  },
  settings: {
    label: 'Einstellungen',
    path: '/admin/settings',
    sensitive: true,
    description: 'Systemkonfiguration'
  },

  // Hirn sections (internal business intelligence)
  hirn: {
    label: 'Hirn',
    path: '/admin/hirn',
    sensitive: true,
    description: 'Business Intelligence Dashboard'
  },
} as const

export type AdminSection = keyof typeof ADMIN_SECTIONS

// =============================================================================
// STAFF EMAIL DOMAIN
// =============================================================================

export const STAFF_EMAIL_DOMAIN = 'revamp-it.ch'

/**
 * Check if an email belongs to staff
 */
export function isStaffEmail(email: string | null | undefined): boolean {
  if (!email) return false
  return email.toLowerCase().endsWith(`@${STAFF_EMAIL_DOMAIN}`)
}

// =============================================================================
// SUPER ADMINS - Full access to everything including sensitive sections
// =============================================================================

/**
 * Super admins have full access to all sections including sensitive ones.
 * This is a simple allowlist of email addresses.
 */
export const SUPER_ADMIN_EMAILS = [
  'andreas@revamp-it.ch',
  'veronica@revamp-it.ch',
  'daniel@revamp-it.ch',
  'georgy@revamp-it.ch',
  // Add more as needed
] as const

export function isSuperAdmin(email: string | null | undefined): boolean {
  if (!email) return false
  return SUPER_ADMIN_EMAILS.includes(email.toLowerCase() as typeof SUPER_ADMIN_EMAILS[number])
}

// =============================================================================
// PERMISSION CHECKING
// =============================================================================

export interface StaffUser {
  email: string
  is_staff: boolean
  staff_permissions: string[]  // Array of section keys, or ['*'] for all
}

/**
 * Check if a user can access a specific admin section
 */
export function canAccessSection(user: StaffUser | null | undefined, section: AdminSection): boolean {
  if (!user) return false
  if (!user.is_staff) return false

  // Super admins (by email) always have full access
  if (isSuperAdmin(user.email)) return true

  // Wildcard permission = full access
  if (user.staff_permissions.includes('*')) return true

  // Check specific permission
  return user.staff_permissions.includes(section)
}

/**
 * Check if a user can access any sensitive section
 */
export function canAccessSensitive(user: StaffUser | null | undefined): boolean {
  if (!user) return false
  if (!user.is_staff) return false
  if (isSuperAdmin(user.email)) return true
  if (user.staff_permissions.includes('*')) return true

  // Check if they have permission for any sensitive section
  const sensitiveSections = Object.entries(ADMIN_SECTIONS)
    .filter(([_, config]) => config.sensitive)
    .map(([key]) => key)

  return sensitiveSections.some(section => user.staff_permissions.includes(section))
}

/**
 * Get all sections a user can access
 */
export function getAccessibleSections(user: StaffUser | null | undefined): AdminSection[] {
  if (!user || !user.is_staff) return []

  // Super admins or wildcard = all sections
  if (isSuperAdmin(user.email) || user.staff_permissions.includes('*')) {
    return Object.keys(ADMIN_SECTIONS) as AdminSection[]
  }

  // Filter to permitted sections
  return user.staff_permissions.filter(
    perm => perm in ADMIN_SECTIONS
  ) as AdminSection[]
}

// =============================================================================
// DEFAULT PERMISSIONS FOR NEW STAFF
// =============================================================================

/**
 * Default permissions for new staff members (non-super-admins)
 * They get access to non-sensitive sections by default
 */
export const DEFAULT_STAFF_PERMISSIONS: AdminSection[] = [
  'dashboard',
  'products',
  'workshops',
  'services',
  'locations',
  'reviews',
  'content',
  'approvals',
  'analytics',
]

/**
 * Get initial permissions for a new staff member
 */
export function getInitialStaffPermissions(email: string): string[] {
  if (isSuperAdmin(email)) {
    return ['*']  // Full access
  }
  return [...DEFAULT_STAFF_PERMISSIONS]
}

// =============================================================================
// CONTENT APPROVAL STATUS
// =============================================================================

/**
 * Status for user-submitted content (products, services, workshops, blog posts)
 */
export const CONTENT_STATUS = {
  DRAFT: 'draft',           // User is still editing
  PENDING: 'pending',       // Submitted for review
  APPROVED: 'approved',     // Approved and visible
  REJECTED: 'rejected',     // Rejected with reason
  ARCHIVED: 'archived',     // No longer active
} as const

export type ContentStatus = typeof CONTENT_STATUS[keyof typeof CONTENT_STATUS]

// =============================================================================
// LEGACY COMPATIBILITY
// =============================================================================

/**
 * Map old role strings to new system for migration
 * This helps during the transition period
 */
export function migrateOldRole(oldRole: string | null | undefined): {
  is_staff: boolean
  staff_permissions: string[]
} {
  if (!oldRole) {
    return { is_staff: false, staff_permissions: [] }
  }

  // Map old roles to new system
  const roleMapping: Record<string, { is_staff: boolean, staff_permissions: string[] }> = {
    'revampit_super_admin': { is_staff: true, staff_permissions: ['*'] },
    'revampit_admin': { is_staff: true, staff_permissions: ['*'] },
    'admin': { is_staff: true, staff_permissions: ['*'] },
    'revampit_editor': { is_staff: true, staff_permissions: ['dashboard', 'content', 'products', 'workshops'] },
    'revampit_support': { is_staff: true, staff_permissions: ['dashboard', 'users', 'reviews'] },
    'hirn_admin': { is_staff: true, staff_permissions: ['dashboard', 'hirn', 'finances', 'analytics'] },
    'hirn_user': { is_staff: true, staff_permissions: ['dashboard', 'hirn', 'analytics'] },
    // All other roles (customer, seller, repairer, etc.) are just regular users
  }

  return roleMapping[oldRole] || { is_staff: false, staff_permissions: [] }
}

// =============================================================================
// TYPE EXPORTS
// =============================================================================

export type { AdminSection as AdminSectionType }
