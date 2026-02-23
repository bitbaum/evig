/**
 * Admin Configuration - Derived from SSOT
 *
 * Admin shortcuts and commands derive from the unified sections config.
 * This ensures admin and user dashboard share the same source of truth.
 *
 * SSOT: @/config/sections.ts is the single source for section definitions
 * DRY: No duplication between admin.ts and permissions.ts
 *
 * Last Updated: 2026-01-26
 */

import {
  Rocket,
  Database,
  Settings,
  Users,
  Package,
  FileText,
  Terminal,
  Shield,
  Eye,
  Plus,
  MapPin,
  GraduationCap,
  type LucideIcon,
} from 'lucide-react'
import { MEDUSA_ADMIN_URL } from '@/config/urls'
import { getAdminSections, SECTIONS, type SectionConfig } from '@/config/sections'

// =============================================================================
// ADMIN SHORTCUT TYPES
// =============================================================================

export interface AdminShortcut {
  id: string
  title: string
  description: string
  href?: string
  /** Command to copy to clipboard (for action shortcuts) */
  command?: string
  icon: LucideIcon
  color: string
  external?: boolean
  /** Category for grouping */
  category: 'setup' | 'internal' | 'external' | 'system' | 'marketplace' | 'quick'
}

export interface AdminQuickCommand {
  title: string
  command: string
}

// =============================================================================
// ADMIN NAVIGATION - Derived from SSOT
// =============================================================================

/**
 * Get admin navigation items from SSOT sections
 */
export function getAdminNavigation(): Array<{
  id: string
  title: string
  description: string
  href: string
  icon: LucideIcon
  sensitive: boolean
}> {
  return getAdminSections().map(section => ({
    id: section.id,
    title: section.ui.label,
    description: section.ui.description,
    href: section.path,
    icon: section.ui.icon,
    sensitive: section.visibility.sensitive ?? false,
  }))
}

// =============================================================================
// ADMIN SHORTCUTS - Dev tools and quick access
// =============================================================================

/**
 * Admin shortcuts configuration
 * These are developer/admin tools, not the main navigation
 */
export const ADMIN_SHORTCUTS: AdminShortcut[] = [
  // Quick Setup Actions
  {
    id: 'start-services',
    title: 'Alle Services starten',
    description: 'Startet Frontend, CMS und Medusa mit einem Befehl',
    command: 'npm run d',
    icon: Rocket,
    color: 'bg-green-500',
    category: 'setup',
  },
  {
    id: 'setup-admins',
    title: 'Admin Benutzer einrichten',
    description: 'Erstellt Admin-Benutzer für CMS und Medusa',
    command: 'npm run setup-admins',
    icon: Shield,
    color: 'bg-blue-500',
    category: 'setup',
  },

  // Internal Admin Interfaces - derived from SSOT
  {
    id: 'products',
    title: SECTIONS.products?.ui.label ?? 'Produktverwaltung',
    description: SECTIONS.products?.ui.description ?? 'Produkte hinzufügen, bearbeiten und löschen',
    href: SECTIONS.products?.path ?? '/admin/products',
    icon: Package,
    color: 'bg-indigo-500',
    category: 'internal',
  },
  {
    id: 'locations',
    title: SECTIONS.locations?.ui.label ?? 'Ortsverwaltung',
    description: SECTIONS.locations?.ui.description ?? 'Veranstaltungsorte genehmigen und verwalten',
    href: SECTIONS.locations?.path ?? '/admin/locations',
    icon: MapPin,
    color: 'bg-orange-500',
    category: 'internal',
  },
  {
    id: 'workshops',
    title: SECTIONS['workshops-admin']?.ui.label ?? 'Workshop-Verwaltung',
    description: SECTIONS['workshops-admin']?.ui.description ?? 'Workshop-Vorschläge genehmigen und verwalten',
    href: SECTIONS['workshops-admin']?.path ?? '/admin/workshops',
    icon: GraduationCap,
    color: 'bg-purple-500',
    category: 'internal',
  },

  // External Admin Interfaces
  {
    id: 'medusa-admin',
    title: 'Medusa Admin',
    description: 'Direkter Zugriff auf Medusa Admin-Interface',
    href: MEDUSA_ADMIN_URL,
    icon: Settings,
    color: 'bg-gray-500',
    external: true,
    category: 'external',
  },
  {
    id: 'cms',
    title: 'CMS Inhalte bearbeiten',
    description: 'Seiten, Blog-Artikel und Inhalte verwalten',
    href: '/ai-cms',
    icon: FileText,
    color: 'bg-teal-500',
    category: 'external',
  },

  // System Management
  {
    id: 'db-status',
    title: 'Datenbank Status',
    description: 'Überprüft den Status aller Datenbanken',
    command: 'docker ps',
    icon: Database,
    color: 'bg-orange-500',
    category: 'system',
  },
  {
    id: 'logs',
    title: 'Logs anzeigen',
    description: 'Container-Logs für Fehlerbehebung',
    command: 'npm run medusa:logs',
    icon: Terminal,
    color: 'bg-gray-500',
    category: 'system',
  },

  // Marketplace Management
  {
    id: 'marketplace',
    title: 'User Marketplace',
    description: 'Benutzer-Anzeigen und Marketplace-Übersicht',
    href: '/marketplace',
    icon: Users,
    color: 'bg-purple-500',
    category: 'marketplace',
  },

  // Quick Access
  {
    id: 'shop-frontend',
    title: 'Shop Frontend',
    description: 'E-Commerce Shop in neuem Tab öffnen',
    href: '/shop/medusa',
    icon: Eye,
    color: 'bg-emerald-500',
    category: 'quick',
  },
  {
    id: 'list-product',
    title: 'Produkt auflisten',
    description: 'Neues Produkt als Benutzer auflisten',
    href: '/marketplace/sell',
    icon: Plus,
    color: 'bg-green-500',
    category: 'quick',
  },
  {
    id: 'new-product-medusa',
    title: 'Neues Produkt',
    description: 'Schnellzugriff für neue Produkte im Medusa Admin',
    href: `${MEDUSA_ADMIN_URL}/products/new`,
    icon: Plus,
    color: 'bg-purple-500',
    external: true,
    category: 'quick',
  },
]

/**
 * Quick commands shown in the admin panel footer
 */
export const ADMIN_QUICK_COMMANDS: AdminQuickCommand[] = [
  {
    title: 'Alle Services starten',
    command: 'npm run d',
  },
  {
    title: 'Admin-Benutzer einrichten',
    command: 'npm run setup-admins',
  },
  {
    title: 'Container-Status prüfen',
    command: 'docker ps',
  },
  {
    title: 'Medusa-Logs anzeigen',
    command: 'npm run medusa:logs',
  },
]

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Get shortcuts by category
 */
export function getShortcutsByCategory(
  category: AdminShortcut['category']
): AdminShortcut[] {
  return ADMIN_SHORTCUTS.filter(s => s.category === category)
}

/**
 * Get all internal navigation shortcuts
 */
export function getInternalShortcuts(): AdminShortcut[] {
  return ADMIN_SHORTCUTS.filter(s => s.category === 'internal')
}
