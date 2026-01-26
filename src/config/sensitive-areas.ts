/**
 * Sensitive Areas Configuration - Derived from SSOT
 *
 * This file re-exports sensitive section utilities from the unified SSOT.
 * The actual sensitive section definitions are in @/config/sections.ts.
 *
 * SSOT: @/config/sections.ts is the single source
 * DRY: No duplication of sensitive section lists
 * SoC: Sensitivity is part of section visibility config
 *
 * Last Updated: 2026-01-26
 */

import {
  SENSITIVE_SECTION_IDS,
  SECTIONS,
  type SectionConfig,
} from '@/config/sections'

// =============================================================================
// RE-EXPORTS - For backwards compatibility
// =============================================================================

/**
 * List of admin section keys that require elevated permissions.
 * Derived from SSOT - sections marked with visibility.sensitive = true
 */
export const SENSITIVE_SECTION_KEYS = SENSITIVE_SECTION_IDS

export type SensitiveSection = (typeof SENSITIVE_SECTION_KEYS)[number]

/**
 * Check if a section is marked as sensitive
 */
export function isSensitiveSection(section: string): boolean {
  return SENSITIVE_SECTION_KEYS.includes(section)
}

/**
 * Get all sensitive sections
 */
export function getSensitiveSections(): string[] {
  return [...SENSITIVE_SECTION_KEYS]
}

/**
 * Get all non-sensitive sections
 */
export function getNonSensitiveSections(allSections: string[]): string[] {
  return allSections.filter(section => !SENSITIVE_SECTION_KEYS.includes(section))
}

// =============================================================================
// SENSITIVITY REASONS - UI tooltips
// =============================================================================

/**
 * Get sensitivity reason from section description
 */
function getSensitivityReasonFromSection(sectionId: string): string | undefined {
  const section = SECTIONS[sectionId]
  if (!section?.visibility.sensitive) return undefined

  // Generate reason based on section category and description
  const reasons: Record<string, string> = {
    users: 'Enthält personenbezogene Daten und Kontoinformationen',
    team: 'Enthält Mitarbeiter- und HR-Daten',
    finances: 'Enthält vertrauliche Finanzdaten',
    hirn: 'Enthält strategische Geschäftsinformationen',
    settings: 'Kann Systemkonfiguration ändern',
  }

  return reasons[sectionId]
}

/**
 * Sensitivity reason descriptions (for UI tooltips)
 */
export const SENSITIVITY_REASONS: Record<string, string> = Object.fromEntries(
  SENSITIVE_SECTION_KEYS
    .map(key => [key, getSensitivityReasonFromSection(key)])
    .filter(([_, reason]) => reason !== undefined) as [string, string][]
)

/**
 * Get the reason why a section is sensitive
 */
export function getSensitivityReason(section: string): string | undefined {
  return SENSITIVITY_REASONS[section]
}
