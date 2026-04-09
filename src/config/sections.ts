/**
 * Unified Sections Configuration - SINGLE SOURCE OF TRUTH
 *
 * This file is the SSOT for all sections across admin and user dashboard.
 * Both admin sidebar and dashboard cards derive their data from here.
 *
 * SSOT: Define once, use everywhere
 * DRY: No duplication between admin.ts and dashboard.ts
 * SoC: Section definitions separate from rendering logic
 *
 * Last Updated: 2026-01-27
 */

import type { LucideIcon } from 'lucide-react'
import {
  LayoutDashboard,
  Package,
  GraduationCap,
  Wrench,
  MapPin,
  Star,
  FileText,
  CheckSquare,
  Users,
  UserCog,
  DollarSign,
  BarChart3,
  Settings,
  Brain,
  ShoppingBag,
  Calendar,
  User,
  PenTool,
  Store,
  HelpCircle,
  Hammer,
  PackageCheck,
  PiggyBank,
  TrendingUp,
  Target,
  Eye,
  Heart,
  ClipboardList,
  Vote,
} from 'lucide-react'

// =============================================================================
// SECTION TYPES
// =============================================================================

/**
 * Where a section is visible
 */
export type SectionContext = 'admin' | 'dashboard' | 'both'

/**
 * Who can see a section
 */
export interface SectionVisibility {
  /** Section appears in admin sidebar */
  admin: boolean
  /** Section appears in user dashboard */
  dashboard: boolean
  /** For admin: requires staff access */
  requiresStaff?: boolean
  /** For admin: sensitive section (requires super admin or explicit grant) */
  sensitive?: boolean
  /** For dashboard: show only for users with this community role */
  communityRole?: 'seller' | 'repairer' | 'techniker'
  /** For dashboard: hide if user has this role (show onboarding instead) */
  hideIfRole?: 'seller' | 'repairer' | 'techniker'
}

/**
 * UI configuration for a section
 */
export interface SectionUI {
  label: string
  description: string
  icon: LucideIcon
  /** Emoji for dashboard cards (optional, fallback to icon) */
  emoji?: string
  /** Color theme */
  color: SectionColor
}

export type SectionColor =
  | 'primary'
  | 'secondary'
  | 'success'
  | 'warning'
  | 'error'
  | 'info'
  | 'neutral'

/**
 * Complete section definition
 */
export interface SectionConfig {
  /** Unique identifier (also used as admin permission key) */
  id: string
  /** URL path */
  path: string
  /** UI configuration */
  ui: SectionUI
  /** Visibility rules */
  visibility: SectionVisibility
  /** Display priority (lower = higher priority) */
  priority: number
  /** Category for grouping */
  category: SectionCategory
  /** Sidebar group for admin navigation (optional, defaults to none) */
  sidebarGroup?: SidebarGroupId
}

export type SectionCategory =
  | 'core'        // Main features (dashboard, profile)
  | 'activities'  // User activities (workshops, appointments)
  | 'commerce'    // Selling/marketplace
  | 'services'    // Service provision (repairs)
  | 'content'     // Content creation
  | 'management'  // Admin management sections
  | 'sensitive'   // Sensitive admin areas
  | 'system'      // System configuration
  | 'analyse'     // Analytics and reporting

// =============================================================================
// SIDEBAR GROUPS - For admin sidebar organization
// =============================================================================

/**
 * Sidebar group IDs for admin navigation
 */
export type SidebarGroupId =
  | 'uebersicht'   // Overview: Dashboard, Freigaben
  | 'angebot'      // Offerings: Produkte, Dienstleistungen, Workshops, Standorte
  | 'inhalte'      // Content: Blog & Seiten, Bewertungen
  | 'betrieb'      // Operations: Aufgaben
  | 'analyse'      // Analytics: Finanzen, Kennzahlen, Wirkung, Transparenz, Analytics
  | 'personen'     // People: Team & HR, Benutzer
  | 'system'       // System: Einstellungen

/**
 * Sidebar group configuration
 */
export interface SidebarGroup {
  id: SidebarGroupId
  label: string
  priority: number
}

/**
 * Sidebar groups for admin navigation - SSOT
 */
export const SIDEBAR_GROUPS: Record<SidebarGroupId, SidebarGroup> = {
  uebersicht: {
    id: 'uebersicht',
    label: 'Übersicht',
    priority: 0,
  },
  angebot: {
    id: 'angebot',
    label: 'Angebot',
    priority: 1,
  },
  inhalte: {
    id: 'inhalte',
    label: 'Inhalte',
    priority: 2,
  },
  betrieb: {
    id: 'betrieb',
    label: 'Betrieb',
    priority: 3,
  },
  analyse: {
    id: 'analyse',
    label: 'Analyse',
    priority: 4,
  },
  personen: {
    id: 'personen',
    label: 'Personen',
    priority: 5,
  },
  system: {
    id: 'system',
    label: 'System',
    priority: 6,
  },
}

// =============================================================================
// SECTION DEFINITIONS - SSOT
// =============================================================================

export const SECTIONS: Record<string, SectionConfig> = {
  // ---------------------------------------------------------------------------
  // CORE - Shared between admin and dashboard
  // ---------------------------------------------------------------------------
  dashboard: {
    id: 'dashboard',
    path: '/admin',
    ui: {
      label: 'Dashboard',
      description: 'Übersicht und Statistiken',
      icon: LayoutDashboard,
      emoji: '📊',
      color: 'primary',
    },
    visibility: { admin: true, dashboard: false, requiresStaff: true },
    priority: 0,
    category: 'core',
    sidebarGroup: 'uebersicht',
  },

  profile: {
    id: 'profile',
    path: '/dashboard/profile',
    ui: {
      label: 'Mein Profil',
      description: 'Persönliche Daten verwalten',
      icon: User,
      emoji: '👤',
      color: 'info',
    },
    visibility: { admin: false, dashboard: true },
    priority: 1,
    category: 'core',
  },

  // ---------------------------------------------------------------------------
  // ACTIVITIES - User-facing activities
  // ---------------------------------------------------------------------------
  workshops: {
    id: 'workshops',
    path: '/dashboard/workshops',
    ui: {
      label: 'Meine Workshops',
      description: 'Angemeldete Kurse verwalten',
      icon: GraduationCap,
      emoji: '🎓',
      color: 'success',
    },
    visibility: { admin: false, dashboard: true },
    priority: 10,
    category: 'activities',
  },

  appointments: {
    id: 'appointments',
    path: '/dashboard/appointments',
    ui: {
      label: 'Termine',
      description: 'Service-Termin buchen',
      icon: Calendar,
      emoji: '📅',
      color: 'warning',
    },
    visibility: { admin: false, dashboard: true },
    priority: 11,
    category: 'activities',
  },

  // ---------------------------------------------------------------------------
  // COMMERCE - Seller features
  // ---------------------------------------------------------------------------
  'seller-dashboard': {
    id: 'seller-dashboard',
    path: '/dashboard/seller',
    ui: {
      label: 'Seller Dashboard',
      description: 'Produkte und Verkäufe verwalten',
      icon: Store,
      emoji: '🏪',
      color: 'secondary',
    },
    visibility: { admin: false, dashboard: true, communityRole: 'seller' },
    priority: 20,
    category: 'commerce',
  },

  'my-listings': {
    id: 'my-listings',
    path: '/dashboard/listings',
    ui: {
      label: 'Meine Inserate',
      description: 'Ihre Inserate im Marketplace verwalten',
      icon: Package,
      emoji: '📦',
      color: 'primary',
    },
    visibility: { admin: false, dashboard: true },
    priority: 22,
    category: 'commerce',
  },

  'my-orders': {
    id: 'my-orders',
    path: '/dashboard/orders',
    ui: {
      label: 'Meine Bestellungen',
      description: 'Ihre Käufe und Verkäufe verwalten',
      icon: ShoppingBag,
      emoji: '🛒',
      color: 'info',
    },
    visibility: { admin: false, dashboard: true },
    priority: 23,
    category: 'commerce',
  },

  favorites: {
    id: 'favorites',
    path: '/dashboard/favorites',
    ui: {
      label: 'Favoriten',
      description: 'Gemerkte Inserate im Marketplace',
      icon: Heart,
      emoji: '❤️',
      color: 'error',
    },
    visibility: { admin: false, dashboard: true },
    priority: 24,
    category: 'commerce',
  },

  // ---------------------------------------------------------------------------
  // SERVICES - Repairer features
  // ---------------------------------------------------------------------------
  'repairer-dashboard': {
    id: 'repairer-dashboard',
    path: '/profil/techniker',
    ui: {
      label: 'Techniker-Profil',
      description: 'Techniker-Profil und Dienstleistungen verwalten',
      icon: Wrench,
      emoji: '🔧',
      color: 'warning',
    },
    visibility: { admin: false, dashboard: true, communityRole: 'repairer' },
    priority: 30,
    category: 'services',
  },

  'repairer-onboarding': {
    id: 'repairer-onboarding',
    path: '/profil/techniker',
    ui: {
      label: 'Als Techniker anbieten',
      description: 'Techniker-Profil erstellen und Anfragen erhalten',
      icon: Hammer,
      emoji: '🔧',
      color: 'warning',
    },
    visibility: { admin: false, dashboard: true, hideIfRole: 'repairer' },
    priority: 31,
    category: 'services',
  },

  // ---------------------------------------------------------------------------
  // CONTENT - Content creation
  // ---------------------------------------------------------------------------
  'blog-submit': {
    id: 'blog-submit',
    path: '/blog/submit',
    ui: {
      label: 'Beitrag verfassen',
      description: 'Idee teilen oder Tutorial schreiben',
      icon: PenTool,
      emoji: '✍️',
      color: 'info',
    },
    visibility: { admin: false, dashboard: true },
    priority: 40,
    category: 'content',
  },

  // ---------------------------------------------------------------------------
  // DONATIONS - User donation history
  // ---------------------------------------------------------------------------
  'user-donations': {
    id: 'user-donations',
    path: '/dashboard/donations',
    ui: {
      label: 'Meine Spenden',
      description: 'Geld- und Sachspenden einsehen',
      icon: Heart,
      emoji: '❤️',
      color: 'success',
    },
    visibility: { admin: false, dashboard: true },
    priority: 45,
    category: 'activities',
  },

  // ---------------------------------------------------------------------------
  // ADMIN MANAGEMENT - Staff sections (non-sensitive)
  // ---------------------------------------------------------------------------
  intake: {
    id: 'intake',
    path: '/admin/intake',
    ui: {
      label: 'Geräte-Eingang',
      description: 'Geräte erfassen, prüfen und freigeben',
      icon: PackageCheck,
      emoji: '📋',
      color: 'primary',
    },
    visibility: { admin: true, dashboard: false, requiresStaff: true },
    priority: 99,
    category: 'management',
    sidebarGroup: 'angebot',
  },

  products: {
    id: 'products',
    path: '/admin/products',
    ui: {
      label: 'Produkte',
      description: 'Produktverwaltung und Inventar',
      icon: Package,
      emoji: '📦',
      color: 'primary',
    },
    // Hidden from sidebar — functionality covered by Geräte-Eingang + Marketplace.
    // Route still exists for direct access/backwards compatibility.
    visibility: { admin: false, dashboard: false, requiresStaff: true },
    priority: 100,
    category: 'management',
  },

  marketplace: {
    id: 'marketplace',
    path: '/admin/marketplace',
    ui: {
      label: 'Marketplace',
      description: 'Inserate prüfen und verifizieren',
      icon: Store,
      emoji: '🏪',
      color: 'secondary',
    },
    visibility: { admin: true, dashboard: false, requiresStaff: true },
    priority: 100.5,
    category: 'management',
    sidebarGroup: 'angebot',
  },

  'it-hilfe-admin': {
    id: 'it-hilfe-admin',
    path: '/admin/it-hilfe',
    ui: {
      label: 'IT-Hilfe',
      description: 'Hilfsanfragen und Techniker verwalten',
      icon: HelpCircle,
      emoji: '🆘',
      color: 'info',
    },
    visibility: { admin: true, dashboard: false, requiresStaff: true },
    priority: 100.7,
    category: 'management',
    sidebarGroup: 'angebot',
  },

  'workshops-admin': {
    id: 'workshops-admin',
    path: '/admin/workshops',
    ui: {
      label: 'Workshops',
      description: 'Workshop-Verwaltung und Anmeldungen',
      icon: GraduationCap,
      emoji: '🎓',
      color: 'success',
    },
    visibility: { admin: true, dashboard: false, requiresStaff: true },
    priority: 101,
    category: 'management',
    sidebarGroup: 'angebot',
  },

  services: {
    id: 'services',
    path: '/admin/services',
    ui: {
      label: 'Dienstleistungen',
      description: 'Service-Angebote verwalten',
      icon: Wrench,
      emoji: '🔧',
      color: 'warning',
    },
    visibility: { admin: true, dashboard: false, requiresStaff: true },
    priority: 102,
    category: 'management',
    sidebarGroup: 'angebot',
  },

  locations: {
    id: 'locations',
    path: '/admin/locations',
    ui: {
      label: 'Standorte',
      description: 'Standortverwaltung',
      icon: MapPin,
      emoji: '📍',
      color: 'info',
    },
    visibility: { admin: true, dashboard: false, requiresStaff: true },
    priority: 103,
    category: 'management',
    sidebarGroup: 'angebot',
  },

  reviews: {
    id: 'reviews',
    path: '/admin/reviews',
    ui: {
      label: 'Bewertungen',
      description: 'Bewertungen moderieren',
      icon: Star,
      emoji: '⭐',
      color: 'warning',
    },
    visibility: { admin: true, dashboard: false, requiresStaff: true },
    priority: 104,
    category: 'management',
    sidebarGroup: 'inhalte',
  },

  content: {
    id: 'content',
    path: '/admin/content',
    ui: {
      label: 'Blog & Seiten',
      description: 'Blog, Seiten, Medien',
      icon: FileText,
      emoji: '📝',
      color: 'info',
    },
    visibility: { admin: true, dashboard: false, requiresStaff: true },
    priority: 105,
    category: 'management',
    sidebarGroup: 'inhalte',
  },

  approvals: {
    id: 'approvals',
    path: '/admin/approvals',
    ui: {
      label: 'Freigaben',
      description: 'Eingereichte Inhalte prüfen und freigeben',
      icon: CheckSquare,
      emoji: '✅',
      color: 'success',
    },
    visibility: { admin: true, dashboard: false, requiresStaff: true },
    priority: 106,
    category: 'management',
    sidebarGroup: 'uebersicht',
  },

  tasks: {
    id: 'tasks',
    path: '/admin/tasks',
    ui: {
      label: 'Aufgaben',
      description: 'Teamaufgaben verwalten',
      icon: ClipboardList,
      emoji: '📋',
      color: 'info',
    },
    visibility: { admin: true, dashboard: false, requiresStaff: true },
    priority: 130,
    category: 'management',
    sidebarGroup: 'betrieb',
  },

  protocols: {
    id: 'protocols',
    path: '/admin/protocols',
    ui: {
      label: 'Protokolle',
      description: 'Sitzungsprotokolle und Besprechungsnotizen',
      icon: FileText,
      emoji: '📝',
      color: 'info',
    },
    visibility: { admin: true, dashboard: false, requiresStaff: true },
    priority: 131,
    category: 'management',
    sidebarGroup: 'betrieb',
  },

  decisions: {
    id: 'decisions',
    path: '/admin/decisions',
    ui: {
      label: 'Entscheidungen',
      description: 'Vorschläge und Abstimmungen im Team',
      icon: Vote,
      emoji: '🗳️',
      color: 'info',
    },
    visibility: { admin: true, dashboard: false, requiresStaff: true },
    priority: 132,
    category: 'management',
    sidebarGroup: 'betrieb',
  },

  analytics: {
    id: 'analytics',
    path: '/admin/analytics',
    ui: {
      label: 'Analytics',
      description: 'Statistiken und Auswertungen',
      icon: BarChart3,
      emoji: '📈',
      color: 'info',
    },
    visibility: { admin: true, dashboard: false, requiresStaff: true },
    priority: 107,
    category: 'management',
    sidebarGroup: 'analyse',
  },

  donations: {
    id: 'donations',
    path: '/admin/donations',
    ui: {
      label: 'Spenden',
      description: 'Geld- und Sachspenden verwalten',
      icon: Heart,
      emoji: '❤️',
      color: 'success',
    },
    visibility: { admin: true, dashboard: false, requiresStaff: true, sensitive: true },
    priority: 108,
    category: 'sensitive',
    sidebarGroup: 'analyse',
  },

  // ---------------------------------------------------------------------------
  // SENSITIVE - Admin sections requiring elevated permissions
  // ---------------------------------------------------------------------------
  users: {
    id: 'users',
    path: '/admin/users',
    ui: {
      label: 'Benutzer',
      description: 'Benutzerverwaltung',
      icon: Users,
      emoji: '👥',
      color: 'error',
    },
    visibility: { admin: true, dashboard: false, requiresStaff: true, sensitive: true },
    priority: 200,
    category: 'sensitive',
    sidebarGroup: 'personen',
  },

  team: {
    id: 'team',
    path: '/admin/team',
    ui: {
      label: 'Team & HR',
      description: 'Mitarbeiter, Freiwillige, Praktikanten',
      icon: UserCog,
      emoji: '👔',
      color: 'error',
    },
    visibility: { admin: true, dashboard: false, requiresStaff: true, sensitive: true },
    priority: 201,
    category: 'sensitive',
    sidebarGroup: 'personen',
  },

  // ---------------------------------------------------------------------------
  // ANALYSE - Analytics and reporting sections (moved from Hirn)
  // ---------------------------------------------------------------------------
  finanzen: {
    id: 'finanzen',
    path: '/admin/analyse/finanzen',
    ui: {
      label: 'Finanzen',
      description: 'Detaillierte Finanzübersicht und Trends',
      icon: PiggyBank,
      emoji: '💰',
      color: 'info',
    },
    visibility: { admin: true, dashboard: false, requiresStaff: true, sensitive: true },
    priority: 150,
    category: 'analyse',
    sidebarGroup: 'analyse',
  },

  kennzahlen: {
    id: 'kennzahlen',
    path: '/admin/analyse/kennzahlen',
    ui: {
      label: 'Kennzahlen',
      description: 'KPIs und Metriken auf einen Blick',
      icon: TrendingUp,
      emoji: '📊',
      color: 'info',
    },
    visibility: { admin: true, dashboard: false, requiresStaff: true, sensitive: true },
    priority: 151,
    category: 'analyse',
    sidebarGroup: 'analyse',
  },

  wirkung: {
    id: 'wirkung',
    path: '/admin/analyse/wirkung',
    ui: {
      label: 'Wirkung',
      description: 'Ökologische und soziale Wirkung',
      icon: Target,
      emoji: '🎯',
      color: 'success',
    },
    visibility: { admin: true, dashboard: false, requiresStaff: true, sensitive: true },
    priority: 152,
    category: 'analyse',
    sidebarGroup: 'analyse',
  },

  transparenz: {
    id: 'transparenz',
    path: '/admin/analyse/transparenz',
    ui: {
      label: 'Transparenz',
      description: 'First Principles Analyse',
      icon: Eye,
      emoji: '👁️',
      color: 'warning',
    },
    visibility: { admin: true, dashboard: false, requiresStaff: true, sensitive: true },
    priority: 153,
    category: 'analyse',
    sidebarGroup: 'analyse',
  },

  // Keep 'finances' as alias for backwards compatibility
  finances: {
    id: 'finances',
    path: '/admin/analyse/finanzen',
    ui: {
      label: 'Finanzen',
      description: 'Finanzübersicht und Berichte',
      icon: DollarSign,
      emoji: '💰',
      color: 'error',
    },
    visibility: { admin: false, dashboard: false, requiresStaff: true, sensitive: true },
    priority: 999, // Hide from sidebar but keep for permissions
    category: 'sensitive',
  },

  hirn: {
    id: 'hirn',
    path: '/admin/hirn',
    ui: {
      label: 'Hirn AI',
      description: 'KI-Assistent für RevampIT',
      icon: Brain,
      emoji: '🧠',
      color: 'error',
    },
    visibility: { admin: true, dashboard: false, requiresStaff: true, sensitive: true },
    priority: 203,
    category: 'sensitive',
    // Note: Hirn is shown separately in sidebar, not in a group
  },

  settings: {
    id: 'settings',
    path: '/admin/settings',
    ui: {
      label: 'Einstellungen',
      description: 'Systemkonfiguration',
      icon: Settings,
      emoji: '⚙️',
      color: 'neutral',
    },
    visibility: { admin: true, dashboard: false, requiresStaff: true, sensitive: true },
    priority: 204,
    category: 'sensitive',
    sidebarGroup: 'system',
  },
}

// =============================================================================
// DERIVED DATA - Auto-generated from SECTIONS
// =============================================================================

/**
 * All section IDs
 */
export const SECTION_IDS = Object.keys(SECTIONS)

/**
 * Admin section IDs (for permission system)
 */
export const ADMIN_SECTION_IDS = Object.values(SECTIONS)
  .filter(s => s.visibility.admin)
  .map(s => s.id)

/**
 * Sensitive section IDs
 */
export const SENSITIVE_SECTION_IDS = Object.values(SECTIONS)
  .filter(s => s.visibility.sensitive)
  .map(s => s.id)

/**
 * Dashboard section IDs
 */
export const DASHBOARD_SECTION_IDS = Object.values(SECTIONS)
  .filter(s => s.visibility.dashboard)
  .map(s => s.id)

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Get sections for admin sidebar
 */
export function getAdminSections(): SectionConfig[] {
  return Object.values(SECTIONS)
    .filter(s => s.visibility.admin)
    .sort((a, b) => a.priority - b.priority)
}

/**
 * Get sections for user dashboard
 */
export function getDashboardSections(): SectionConfig[] {
  return Object.values(SECTIONS)
    .filter(s => s.visibility.dashboard)
    .sort((a, b) => a.priority - b.priority)
}

/**
 * Get section by ID
 */
export function getSection(id: string): SectionConfig | undefined {
  return SECTIONS[id]
}

/**
 * Check if section is sensitive
 */
export function isSensitiveSection(id: string): boolean {
  return SENSITIVE_SECTION_IDS.includes(id)
}

/**
 * Sensitivity reason descriptions (for UI tooltips)
 */
export const SENSITIVITY_REASONS: Record<string, string> = {
  users: 'Enthält personenbezogene Daten und Kontoinformationen',
  team: 'Enthält Mitarbeiter- und HR-Daten',
  finances: 'Enthält vertrauliche Finanzdaten',
  hirn: 'Enthält strategische Geschäftsinformationen',
  settings: 'Kann Systemkonfiguration ändern',
}

export function getSensitivityReason(section: string): string | undefined {
  return SENSITIVITY_REASONS[section]
}

/**
 * Get sections by category
 */
export function getSectionsByCategory(category: SectionCategory): SectionConfig[] {
  return Object.values(SECTIONS)
    .filter(s => s.category === category)
    .sort((a, b) => a.priority - b.priority)
}

/**
 * Get sidebar groups with their sections for admin navigation
 * Returns groups sorted by priority, each with its sections
 */
export function getSidebarGroupsWithSections(): Array<{
  group: SidebarGroup
  sections: SectionConfig[]
}> {
  const groups = Object.values(SIDEBAR_GROUPS).sort((a, b) => a.priority - b.priority)

  return groups.map(group => ({
    group,
    sections: Object.values(SECTIONS)
      .filter(s => s.visibility.admin && s.sidebarGroup === group.id)
      .sort((a, b) => a.priority - b.priority),
  })).filter(g => g.sections.length > 0) // Only return groups with sections
}

/**
 * Get Hirn section config (special case - not in a group)
 */
export function getHirnSection(): SectionConfig | undefined {
  return SECTIONS.hirn
}

// =============================================================================
// CATEGORY DEFINITIONS
// =============================================================================

export interface CategoryConfig {
  id: SectionCategory
  label: string
  description: string
  emoji: string
  priority: number
}

export const CATEGORIES: Record<SectionCategory, CategoryConfig> = {
  core: {
    id: 'core',
    label: 'Übersicht',
    description: 'Hauptbereiche',
    emoji: '🏠',
    priority: 0,
  },
  activities: {
    id: 'activities',
    label: 'Aktivitäten',
    description: 'Workshops, Termine und Buchungen',
    emoji: '📚',
    priority: 1,
  },
  commerce: {
    id: 'commerce',
    label: 'Verkauf & Handel',
    description: 'Produkte verkaufen und Marktplatz nutzen',
    emoji: '🏪',
    priority: 2,
  },
  services: {
    id: 'services',
    label: 'Dienstleistungen',
    description: 'Reparaturen und Services anbieten',
    emoji: '🔧',
    priority: 3,
  },
  content: {
    id: 'content',
    label: 'Inhalte',
    description: 'Beiträge verfassen und teilen',
    emoji: '✍️',
    priority: 4,
  },
  management: {
    id: 'management',
    label: 'Verwaltung',
    description: 'Inhalte und Ressourcen verwalten',
    emoji: '📋',
    priority: 5,
  },
  sensitive: {
    id: 'sensitive',
    label: 'Sensibel',
    description: 'Geschützte Bereiche',
    emoji: '🔒',
    priority: 6,
  },
  system: {
    id: 'system',
    label: 'System',
    description: 'Systemkonfiguration',
    emoji: '⚙️',
    priority: 7,
  },
  analyse: {
    id: 'analyse',
    label: 'Analyse',
    description: 'Analytics und Auswertungen',
    emoji: '📊',
    priority: 8,
  },
}

/**
 * Get sorted categories
 */
export function getSortedCategories(): CategoryConfig[] {
  return Object.values(CATEGORIES).sort((a, b) => a.priority - b.priority)
}

// =============================================================================
// TYPE EXPORTS
// =============================================================================

export type SectionId = keyof typeof SECTIONS
