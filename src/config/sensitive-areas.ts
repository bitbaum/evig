/**
 * Sensitive Areas Configuration
 *
 * This file defines which admin sections are considered sensitive
 * and require elevated permissions (super admin or explicit grant).
 *
 * SSOT: This is the single source of truth for sensitive area definitions.
 * DRY: Import this config anywhere you need to check sensitivity.
 * SoC: Sensitivity config is separate from section definitions.
 *
 * To mark a section as sensitive:
 * 1. Add its key to SENSITIVE_SECTION_KEYS below
 * 2. The change takes effect immediately across the app
 *
 * To remove sensitivity:
 * 1. Remove its key from SENSITIVE_SECTION_KEYS
 * 2. Staff members will now have access by default
 */

import type { AdminSection } from '@/lib/permissions'

/**
 * List of admin section keys that require elevated permissions.
 *
 * Sensitive sections are only accessible to:
 * - Super admins (hardcoded email list or is_super_admin flag)
 * - Staff with explicit permission grant for that section
 *
 * Regular staff members do NOT have access to these by default.
 */
export const SENSITIVE_SECTION_KEYS: AdminSection[] = [
  'users',      // User management - can modify accounts
  'team',       // Team & HR - employee data
  'finances',   // Financial data and reports
  'hirn',       // Business intelligence dashboard
  'settings',   // System configuration
]

/**
 * Check if a section is marked as sensitive
 */
export function isSensitiveSection(section: AdminSection): boolean {
  return SENSITIVE_SECTION_KEYS.includes(section)
}

/**
 * Get all sensitive sections
 */
export function getSensitiveSections(): AdminSection[] {
  return [...SENSITIVE_SECTION_KEYS]
}

/**
 * Get all non-sensitive sections
 * These are accessible to all staff by default
 */
export function getNonSensitiveSections(allSections: AdminSection[]): AdminSection[] {
  return allSections.filter(section => !SENSITIVE_SECTION_KEYS.includes(section))
}

/**
 * Sensitivity reason descriptions (for UI tooltips)
 */
export const SENSITIVITY_REASONS: Partial<Record<AdminSection, string>> = {
  users: 'Enthält personenbezogene Daten und Kontoinformationen',
  team: 'Enthält Mitarbeiter- und HR-Daten',
  finances: 'Enthält vertrauliche Finanzdaten',
  hirn: 'Enthält strategische Geschäftsinformationen',
  settings: 'Kann Systemkonfiguration ändern',
}

/**
 * Get the reason why a section is sensitive
 */
export function getSensitivityReason(section: AdminSection): string | undefined {
  return SENSITIVITY_REASONS[section]
}
