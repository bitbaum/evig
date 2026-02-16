/**
 * Organizational Numbers — Server-only Data Layer
 *
 * Provides DB access to reconciled organizational numbers stored in the
 * shared Neon database (org_numbers table). Both revampit and revamp-info
 * share this data source.
 *
 * For client components: import from '@/lib/org-numbers.defaults' instead.
 * For server-side: use getOrgNumber/getOrgNumbers (DB queries)
 *
 * Source: revamp-info NUMBERS_REGISTRY (audited 2026-02-16)
 */

import 'server-only'

import { TABLE_NAMES } from '@/config/database'
import { logger } from '@/lib/logger'

// Re-export everything from client-safe defaults for backward compatibility
// in server components that already import from this file
export type { OrgNumber, OrgNumberCategory, OrgNumberConfidence } from './org-numbers.defaults'
export { ORG_NUMBERS_DEFAULTS, getDefaultNumeric, getDefaultValue } from './org-numbers.defaults'

// ============================================================================
// Server-side DB queries
// ============================================================================

import type { OrgNumber, OrgNumberCategory } from './org-numbers.defaults'
import { ORG_NUMBERS_DEFAULTS } from './org-numbers.defaults'

/**
 * Get a single org number by key. Returns null if not found.
 */
export async function getOrgNumber(key: string): Promise<OrgNumber | null> {
  try {
    const { query } = await import('@/lib/auth/db')
    const result = await query<Record<string, unknown>>(
      `SELECT key, value, numeric_value, label, category, confidence,
              methodology, calculation, source_document, external_link,
              last_verified, updated_at
       FROM ${TABLE_NAMES.ORG_NUMBERS}
       WHERE key = $1`,
      [key]
    )

    if (result.rows.length === 0) return null
    return mapRow(result.rows[0])
  } catch (error) {
    logger.error('Failed to get org number', { key, error })
    return null
  }
}

/**
 * Get org numbers, optionally filtered by category.
 */
export async function getOrgNumbers(category?: OrgNumberCategory): Promise<OrgNumber[]> {
  try {
    const { query } = await import('@/lib/auth/db')

    const sql = category
      ? `SELECT * FROM ${TABLE_NAMES.ORG_NUMBERS} WHERE category = $1 ORDER BY key`
      : `SELECT * FROM ${TABLE_NAMES.ORG_NUMBERS} ORDER BY key`

    const params = category ? [category] : undefined
    const result = await query<Record<string, unknown>>(sql, params)
    return result.rows.map(mapRow)
  } catch (error) {
    logger.error('Failed to get org numbers', { category, error })
    return []
  }
}

/**
 * Get the numeric_value for a key. Falls back to defaults on DB failure.
 */
export async function getNumericValue(key: string): Promise<number> {
  const fromDb = await getOrgNumber(key)
  if (fromDb?.numericValue != null) return fromDb.numericValue

  const fallback = ORG_NUMBERS_DEFAULTS[key]
  if (fallback?.numericValue != null) return fallback.numericValue

  throw new Error(`Org number "${key}" not found or not numeric`)
}

function mapRow(row: Record<string, unknown>): OrgNumber {
  return {
    key: row.key as string,
    value: row.value as string,
    numericValue: row.numeric_value != null ? Number(row.numeric_value) : null,
    label: row.label as string,
    category: row.category as OrgNumberCategory,
    confidence: row.confidence as string as OrgNumber['confidence'],
    methodology: (row.methodology as string) || null,
    calculation: (row.calculation as string) || null,
    sourceDocument: (row.source_document as string) || null,
    externalLink: (row.external_link as string) || null,
    lastVerified: String(row.last_verified),
    updatedAt: String(row.updated_at),
  }
}
