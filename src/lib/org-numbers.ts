/**
 * Organizational Numbers — Server-only Data Layer
 *
 * Provides DB access to reconciled organizational numbers stored in the
 * shared Postgres database (org_numbers table). Both revampit and revamp-info
 * share this data source.
 *
 * For client components: import from '@/lib/org-numbers.defaults' instead.
 * For server-side: use getOrgNumber/getOrgNumbers (DB queries)
 *
 * Source: revamp-info NUMBERS_REGISTRY (audited 2026-02-16)
 */

import 'server-only'

import { eq, asc } from 'drizzle-orm'
import { db } from '@/db'
import { orgNumbers } from '@/db/schema'
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
    const [row] = await db
      .select()
      .from(orgNumbers)
      .where(eq(orgNumbers.key, key))

    if (!row) return null
    return mapRow(row)
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
    const query = db.select().from(orgNumbers)

    const rows = category
      ? await query.where(eq(orgNumbers.category, category)).orderBy(asc(orgNumbers.key))
      : await query.orderBy(asc(orgNumbers.key))

    return rows.map(mapRow)
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

type OrgNumberRow = typeof orgNumbers.$inferSelect

function mapRow(row: OrgNumberRow): OrgNumber {
  return {
    key: row.key,
    value: row.value,
    numericValue: row.numericValue != null ? Number(row.numericValue) : null,
    label: row.label,
    category: row.category as OrgNumberCategory,
    confidence: row.confidence as OrgNumber['confidence'],
    methodology: row.methodology || null,
    calculation: row.calculation || null,
    sourceDocument: row.sourceDocument || null,
    externalLink: row.externalLink || null,
    lastVerified: String(row.lastVerified),
    updatedAt: String(row.updatedAt),
  }
}
