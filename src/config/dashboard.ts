/**
 * Dashboard Configuration - Single Source of Truth
 * 
 * All dashboard navigation items, categories, and routes should be defined here.
 * Following dev guide: docs/development/DEV_GUIDE.md - SSOT principle
 * 
 * Created: 2026-01-05
 * Last Modified: 2026-01-05
 * Last Modified Summary: Initial dashboard navigation config for SSOT compliance
 */

import { ROLES } from '@/lib/constants'
import type { UserRole } from '@/lib/constants'

export interface DashboardCard {
  id: string
  title: string
  description: string
  href: string
  icon: string // Emoji or icon name
  category: DashboardCategory
  requiredRole?: UserRole | UserRole[] // If specified, only show for these roles
  hiddenForRoles?: UserRole[] // Hide for these roles
  badge?: string
  color: 'info' | 'success' | 'warning' | 'error' | 'secondary' | 'neutral'
  priority: number // Lower number = higher priority (shown first)
}

export type DashboardCategory = 
  | 'account'      // Account management (profile, settings)
  | 'activities'   // User activities (workshops, appointments)
  | 'commerce'     // Selling/buying (seller dashboard, marketplace)
  | 'services'     // Service provision (repairer dashboard)
  | 'content'      // Content creation (blog submissions)
  | 'admin'        // Admin functions

export interface DashboardCategoryConfig {
  id: DashboardCategory
  title: string
  description: string
  icon: string
  priority: number
}

/**
 * Dashboard categories configuration
 * SSOT for category definitions
 */
export const DASHBOARD_CATEGORIES: Record<DashboardCategory, DashboardCategoryConfig> = {
  account: {
    id: 'account',
    title: 'Konto',
    description: 'Profil und Einstellungen verwalten',
    icon: '👤',
    priority: 1,
  },
  activities: {
    id: 'activities',
    title: 'Aktivitäten',
    description: 'Workshops, Termine und Buchungen',
    icon: '📚',
    priority: 2,
  },
  commerce: {
    id: 'commerce',
    title: 'Verkauf & Handel',
    description: 'Produkte verkaufen und Marktplatz nutzen',
    icon: '🏪',
    priority: 3,
  },
  services: {
    id: 'services',
    title: 'Dienstleistungen',
    description: 'Reparaturen und Services anbieten',
    icon: '🔧',
    priority: 4,
  },
  content: {
    id: 'content',
    title: 'Inhalte',
    description: 'Beiträge verfassen und teilen',
    icon: '✍️',
    priority: 5,
  },
  admin: {
    id: 'admin',
    title: 'Administration',
    description: 'System verwalten',
    icon: '⚙️',
    priority: 6,
  },
}

/**
 * Dashboard routes - SSOT for all dashboard paths
 */
export const DASHBOARD_ROUTES = {
  HOME: '/dashboard',
  PROFILE: '/dashboard/profile',
  WORKSHOPS: '/dashboard/workshops',
  APPOINTMENTS: '/dashboard/appointments',
  SELLER: '/dashboard/seller',
  SELLER_PRODUCTS: '/dashboard/seller/products',
  SELLER_PRODUCTS_NEW: '/dashboard/seller/products/new',
  SELLER_ONBOARDING: '/dashboard/seller/onboarding',
  REPAIRER: '/dashboard/repairer',
  REPAIRER_BOOKINGS: '/dashboard/repairer/bookings',
  REPAIRER_SERVICES: '/dashboard/repairer/services',
  REPAIRER_ONBOARDING: '/dashboard/repairer/onboarding',
  ADMIN: '/admin',
  BLOG_SUBMIT: '/blog/submit',
} as const

/**
 * Dashboard cards configuration
 * SSOT for all dashboard navigation items
 */
export const DASHBOARD_CARDS: DashboardCard[] = [
  // Account Category
  {
    id: 'profile',
    title: 'Mein Profil',
    description: 'Persönliche Daten verwalten',
    href: DASHBOARD_ROUTES.PROFILE,
    icon: '👤',
    category: 'account',
    color: 'info',
    priority: 1,
  },

  // Activities Category
  {
    id: 'workshops',
    title: 'Meine Workshops',
    description: 'Angemeldete Kurse verwalten',
    href: DASHBOARD_ROUTES.WORKSHOPS,
    icon: '🎓',
    category: 'activities',
    color: 'success',
    priority: 1,
  },
  {
    id: 'appointments',
    title: 'Termine',
    description: 'Service-Termin buchen',
    href: DASHBOARD_ROUTES.APPOINTMENTS,
    icon: '📅',
    category: 'activities',
    color: 'warning',
    priority: 2,
  },

  // Commerce Category - Seller Dashboard (shown if user has seller role)
  {
    id: 'seller-dashboard',
    title: 'Seller Dashboard',
    description: 'Produkte und Verkäufe',
    href: DASHBOARD_ROUTES.SELLER,
    icon: '🏪',
    category: 'commerce',
    requiredRole: ROLES.SELLER,
    color: 'secondary',
    priority: 1,
  },
  // Commerce Category - Seller Onboarding (shown if user doesn't have seller role)
  {
    id: 'seller-onboarding',
    title: 'Auf Revamp‑IT verkaufen',
    description: 'Eigene Produkte anbieten – Versand direkt an Käufer',
    href: DASHBOARD_ROUTES.SELLER_ONBOARDING,
    icon: '🏪',
    category: 'commerce',
    hiddenForRoles: [ROLES.SELLER],
    color: 'secondary',
    priority: 2,
  },

  // Services Category - Repairer Dashboard (shown if user has repairer role)
  {
    id: 'repairer-dashboard',
    title: 'Repairer Dashboard',
    description: 'Reparaturen verwalten',
    href: DASHBOARD_ROUTES.REPAIRER,
    icon: '🔧',
    category: 'services',
    requiredRole: ROLES.REPAIRER,
    color: 'warning',
    priority: 1,
  },
  // Services Category - Repairer Onboarding (shown if user doesn't have repairer role)
  {
    id: 'repairer-onboarding',
    title: 'Reparaturen anbieten',
    description: 'Dienstleistungen publizieren und Anfragen erhalten',
    href: DASHBOARD_ROUTES.REPAIRER_ONBOARDING,
    icon: '🔧',
    category: 'services',
    hiddenForRoles: [ROLES.REPAIRER],
    color: 'warning',
    priority: 2,
  },

  // Content Category
  {
    id: 'blog-submit',
    title: 'Beitrag verfassen',
    description: 'Idee teilen oder Tutorial schreiben',
    href: DASHBOARD_ROUTES.BLOG_SUBMIT,
    icon: '✍️',
    category: 'content',
    color: 'info',
    priority: 1,
  },

  // Admin Category
  {
    id: 'admin',
    title: 'Admin-Bereich',
    description: 'System verwalten',
    href: DASHBOARD_ROUTES.ADMIN,
    icon: '⚙️',
    category: 'admin',
    requiredRole: ROLES.REVAMPIT_ADMIN,
    color: 'error',
    priority: 1,
  },
]

/**
 * User info for dashboard card filtering
 * UNIFIED: Supports both old role system and new is_staff system
 */
export interface DashboardUserInfo {
  role: UserRole | null
  isStaff?: boolean
  isSuperAdmin?: boolean
}

/**
 * Get dashboard cards filtered by user role
 * UNIFIED: Now supports both old role system AND new is_staff permission system
 *
 * @param userRole - Legacy parameter (role only)
 * @param userInfo - Optional unified user info (role + isStaff)
 */
export function getDashboardCardsForRole(
  userRole: UserRole | null,
  userInfo?: DashboardUserInfo
): DashboardCard[] {
  // Build unified info from params
  const role = userInfo?.role ?? userRole
  const isStaff = userInfo?.isStaff ?? false
  const isSuperAdmin = userInfo?.isSuperAdmin ?? false

  // UNIFIED: Check if user has admin access via either system
  const hasAdminAccess =
    role === ROLES.REVAMPIT_ADMIN ||
    isStaff === true ||
    isSuperAdmin === true

  return DASHBOARD_CARDS.filter(card => {
    // Hide if user has a role that should hide this card
    if (card.hiddenForRoles && role && card.hiddenForRoles.includes(role)) {
      return false
    }

    // Show if no role requirement
    if (!card.requiredRole) {
      return true
    }

    // UNIFIED: For admin-only cards, also show if user has isStaff or isSuperAdmin
    const requiredRoles = Array.isArray(card.requiredRole)
      ? card.requiredRole
      : [card.requiredRole]

    // Check if this requires admin access
    if (requiredRoles.includes(ROLES.REVAMPIT_ADMIN) && hasAdminAccess) {
      return true
    }

    // Show if user has required role
    if (role) {
      return requiredRoles.includes(role)
    }

    return false
  })
}

/**
 * Group dashboard cards by category
 */
export function groupCardsByCategory(cards: DashboardCard[]): Map<DashboardCategory, DashboardCard[]> {
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
  grouped.forEach((cards, category) => {
    cards.sort((a, b) => a.priority - b.priority)
  })

  return grouped
}
