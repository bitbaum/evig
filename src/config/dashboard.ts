/**
 * Dashboard Configuration - Derived from SSOT
 *
 * All dashboard navigation items derive from the unified sections config.
 * This ensures admin and user dashboard share the same source of truth.
 *
 * SSOT: @/config/sections.ts is the single source
 * DRY: No duplication between admin and dashboard
 *
 * Last Updated: 2026-01-26
 */

import {
  SECTIONS,
  getDashboardSections,
  CATEGORIES,
  type SectionConfig,
  type SectionCategory,
  type SectionColor,
} from '@/config/sections'

// =============================================================================
// LEGACY COMPATIBILITY - Types for existing components
// =============================================================================

export interface DashboardCard {
  id: string
  title: string
  description: string
  href: string
  icon: string // Emoji
  category: DashboardCategory
  /** Show only for users with this community role */
  requiredRole?: CommunityRole
  /** Hide for users with this role */
  hiddenForRoles?: CommunityRole[]
  badge?: string
  color: 'info' | 'success' | 'warning' | 'error' | 'secondary' | 'neutral'
  priority: number
}

/** Community roles (not staff roles) */
export type CommunityRole = 'seller' | 'repairer' | 'helper'

export type DashboardCategory =
  | 'account'
  | 'activities'
  | 'commerce'
  | 'services'
  | 'content'
  | 'admin'

export interface DashboardCategoryConfig {
  id: DashboardCategory
  title: string
  description: string
  icon: string
  priority: number
}

// =============================================================================
// CATEGORY MAPPING - Map SSOT categories to dashboard categories
// =============================================================================

const categoryMapping: Record<SectionCategory, DashboardCategory> = {
  core: 'account',
  activities: 'activities',
  commerce: 'commerce',
  services: 'services',
  content: 'content',
  management: 'admin',
  sensitive: 'admin',
  system: 'admin',
  analyse: 'admin',
}

const colorMapping: Record<SectionColor, DashboardCard['color']> = {
  primary: 'info',
  secondary: 'secondary',
  success: 'success',
  warning: 'warning',
  error: 'error',
  info: 'info',
  neutral: 'neutral',
}

// =============================================================================
// DASHBOARD CATEGORIES - Derived from SSOT
// =============================================================================

export const DASHBOARD_CATEGORIES: Record<DashboardCategory, DashboardCategoryConfig> = {
  account: {
    id: 'account',
    title: CATEGORIES.core.label,
    description: CATEGORIES.core.description,
    icon: CATEGORIES.core.emoji,
    priority: CATEGORIES.core.priority,
  },
  activities: {
    id: 'activities',
    title: CATEGORIES.activities.label,
    description: CATEGORIES.activities.description,
    icon: CATEGORIES.activities.emoji,
    priority: CATEGORIES.activities.priority,
  },
  commerce: {
    id: 'commerce',
    title: CATEGORIES.commerce.label,
    description: CATEGORIES.commerce.description,
    icon: CATEGORIES.commerce.emoji,
    priority: CATEGORIES.commerce.priority,
  },
  services: {
    id: 'services',
    title: CATEGORIES.services.label,
    description: CATEGORIES.services.description,
    icon: CATEGORIES.services.emoji,
    priority: CATEGORIES.services.priority,
  },
  content: {
    id: 'content',
    title: CATEGORIES.content.label,
    description: CATEGORIES.content.description,
    icon: CATEGORIES.content.emoji,
    priority: CATEGORIES.content.priority,
  },
  admin: {
    id: 'admin',
    title: 'Administration',
    description: 'System verwalten',
    icon: '⚙️',
    priority: 10,
  },
}

// =============================================================================
// DASHBOARD ROUTES - Derived from SSOT
// =============================================================================

export const DASHBOARD_ROUTES = {
  HOME: '/dashboard',
  PROFILE: SECTIONS.profile?.path ?? '/dashboard/profile',
  WORKSHOPS: SECTIONS.workshops?.path ?? '/dashboard/workshops',
  APPOINTMENTS: SECTIONS.appointments?.path ?? '/dashboard/appointments',
  SELLER: SECTIONS['seller-dashboard']?.path ?? '/dashboard/seller',
  SELLER_PRODUCTS: '/dashboard/seller/products',
  SELLER_PRODUCTS_NEW: '/dashboard/seller/products/new',
  SELLER_ONBOARDING: SECTIONS['seller-onboarding']?.path ?? '/dashboard/seller/onboarding',
  REPAIRER: SECTIONS['repairer-dashboard']?.path ?? '/dashboard/repairer',
  REPAIRER_BOOKINGS: '/dashboard/repairer/bookings',
  REPAIRER_SERVICES: '/dashboard/repairer/services',
  REPAIRER_ONBOARDING: SECTIONS['repairer-onboarding']?.path ?? '/dashboard/repairer/onboarding',
  ADMIN: '/admin',
  BLOG_SUBMIT: SECTIONS['blog-submit']?.path ?? '/blog/submit',
} as const

// =============================================================================
// DASHBOARD CARDS - Derived from SSOT sections
// =============================================================================

/**
 * Convert SSOT section to dashboard card
 */
function sectionToCard(section: SectionConfig): DashboardCard {
  const card: DashboardCard = {
    id: section.id,
    title: section.ui.label,
    description: section.ui.description,
    href: section.path,
    icon: section.ui.emoji ?? '📄',
    category: categoryMapping[section.category],
    color: colorMapping[section.ui.color],
    priority: section.priority,
  }

  // Handle community role visibility
  if (section.visibility.communityRole) {
    card.requiredRole = section.visibility.communityRole
  }

  if (section.visibility.hideIfRole) {
    card.hiddenForRoles = [section.visibility.hideIfRole]
  }

  return card
}

/**
 * Dashboard cards derived from SSOT
 */
export const DASHBOARD_CARDS: DashboardCard[] = getDashboardSections().map(sectionToCard)

// =============================================================================
// USER INFO & FILTERING
// =============================================================================

export interface DashboardUserInfo {
  /** Legacy role field (deprecated, use communityRoles) */
  role?: string | null
  /** Community roles the user has */
  communityRoles?: CommunityRole[]
  /** Is user a staff member */
  isStaff?: boolean
  /** Is user a super admin */
  isSuperAdmin?: boolean
}

/**
 * Get dashboard cards filtered by user info
 *
 * @param userRole - Legacy parameter (deprecated)
 * @param userInfo - User info for filtering
 */
export function getDashboardCardsForRole(
  userRole: string | null = null,
  userInfo?: DashboardUserInfo
): DashboardCard[] {
  const communityRoles = userInfo?.communityRoles ?? []
  const isStaff = userInfo?.isStaff ?? false
  const isSuperAdmin = userInfo?.isSuperAdmin ?? false

  // Legacy: Extract community roles from old role field
  const legacyRole = userInfo?.role ?? userRole
  if (legacyRole && !communityRoles.includes(legacyRole as CommunityRole)) {
    if (['seller', 'repairer', 'helper'].includes(legacyRole)) {
      communityRoles.push(legacyRole as CommunityRole)
    }
  }

  return DASHBOARD_CARDS.filter(card => {
    // Hide if user has a role that should hide this card
    if (card.hiddenForRoles?.some(role => communityRoles.includes(role))) {
      return false
    }

    // Show if no role requirement
    if (!card.requiredRole) {
      return true
    }

    // Show if user has required community role
    if (communityRoles.includes(card.requiredRole)) {
      return true
    }

    return false
  })
}

/**
 * Group dashboard cards by category
 */
export function groupCardsByCategory(
  cards: DashboardCard[]
): Map<DashboardCategory, DashboardCard[]> {
  const grouped = new Map<DashboardCategory, DashboardCard[]>()

  // Initialize all categories
  Object.keys(DASHBOARD_CATEGORIES).forEach(category => {
    grouped.set(category as DashboardCategory, [])
  })

  // Group cards
  cards.forEach(card => {
    const categoryCards = grouped.get(card.category) || []
    categoryCards.push(card)
    grouped.set(card.category, categoryCards)
  })

  // Sort cards within each category by priority
  grouped.forEach(categoryCards => {
    categoryCards.sort((a, b) => a.priority - b.priority)
  })

  return grouped
}

// =============================================================================
// ADMIN CARD - Special handling for staff users
// =============================================================================

/**
 * Get admin dashboard card for staff users
 */
export function getAdminCard(): DashboardCard {
  return {
    id: 'admin',
    title: 'Admin-Bereich',
    description: 'System verwalten',
    href: '/admin',
    icon: '⚙️',
    category: 'admin',
    color: 'error',
    priority: 1000,
  }
}

/**
 * Get all dashboard cards including admin card if applicable
 */
export function getAllDashboardCards(userInfo: DashboardUserInfo): DashboardCard[] {
  const cards = getDashboardCardsForRole(null, userInfo)

  // Add admin card for staff users
  if (userInfo.isStaff || userInfo.isSuperAdmin) {
    cards.push(getAdminCard())
  }

  return cards
}
