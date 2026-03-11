/**
 * Service Database Queries
 *
 * Fetches operational service data from the service_types table.
 * This is the SSOT for service definitions that can be booked.
 */

import { db } from '@/db'
import { serviceTypes } from '@/db/schema'
import { eq, and, asc, desc, sql, getTableName, type SQL } from 'drizzle-orm'
import { logger } from '@/lib/logger'
import type { DbServiceType } from './types'

const stTable = getTableName(serviceTypes)

/**
 * Map Drizzle camelCase row to snake_case DbServiceType interface
 */
function toDbServiceType(row: typeof serviceTypes.$inferSelect): DbServiceType {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    description: row.description ?? null,
    category: row.category ?? null,
    duration_minutes: row.durationMinutes ?? 60,
    price_cents: row.priceCents ?? null,
    requires_approval: row.requiresApproval ?? false,
    is_active: row.isActive ?? true,
    is_bookable: row.isBookable ?? true,
    is_featured: row.isFeatured ?? false,
    display_order: row.displayOrder ?? 100,
    created_at: row.createdAt ? new Date(row.createdAt) : new Date(),
    updated_at: row.updatedAt ? new Date(row.updatedAt) : null,
    icon_name: row.iconName ?? null,
    hero_title: row.heroTitle ?? null,
    hero_subtitle: row.heroSubtitle ?? null,
    hero_description: row.heroDescription ?? null,
    features_json: row.featuresJson as DbServiceType['features_json'],
    process_json: row.processJson as DbServiceType['process_json'],
    pricing_base: row.pricingBase ?? null,
    pricing_details: row.pricingDetails as string[] | null,
    pricing_media_prices: row.pricingMediaPrices as string[] | null,
  }
}

/**
 * Get all active services from database
 */
export async function getAllServiceTypes(): Promise<DbServiceType[]> {
  try {
    const rows = await db.select()
      .from(serviceTypes)
      .where(eq(serviceTypes.isActive, true))
      .orderBy(asc(serviceTypes.displayOrder), asc(serviceTypes.name))
    return rows.map(toDbServiceType)
  } catch (error) {
    logger.error('Failed to get service types', { error })
    return []
  }
}

/**
 * Get featured services (for main /services page)
 */
export async function getFeaturedServiceTypes(): Promise<DbServiceType[]> {
  try {
    const rows = await db.select()
      .from(serviceTypes)
      .where(and(eq(serviceTypes.isActive, true), eq(serviceTypes.isFeatured, true)))
      .orderBy(asc(serviceTypes.displayOrder), asc(serviceTypes.name))
    return rows.map(toDbServiceType)
  } catch (error) {
    logger.error('Failed to get featured service types', { error })
    return []
  }
}

/**
 * Get bookable services (for appointment booking)
 */
export async function getBookableServiceTypes(): Promise<DbServiceType[]> {
  try {
    const rows = await db.select()
      .from(serviceTypes)
      .where(and(eq(serviceTypes.isActive, true), eq(serviceTypes.isBookable, true)))
      .orderBy(asc(serviceTypes.displayOrder), asc(serviceTypes.name))
    return rows.map(toDbServiceType)
  } catch (error) {
    logger.error('Failed to get bookable service types', { error })
    return []
  }
}

/**
 * Get a single service by slug
 */
export async function getServiceTypeBySlug(slug: string): Promise<DbServiceType | null> {
  try {
    const rows = await db.select()
      .from(serviceTypes)
      .where(and(eq(serviceTypes.slug, slug), eq(serviceTypes.isActive, true)))
    return rows[0] ? toDbServiceType(rows[0]) : null
  } catch (error) {
    logger.error('Failed to get service type by slug', { slug, error })
    return null
  }
}

/**
 * Get a single service by ID
 */
export async function getServiceTypeById(id: string): Promise<DbServiceType | null> {
  try {
    const rows = await db.select()
      .from(serviceTypes)
      .where(eq(serviceTypes.id, id))
    return rows[0] ? toDbServiceType(rows[0]) : null
  } catch (error) {
    logger.error('Failed to get service type by id', { id, error })
    return null
  }
}

/**
 * Get services by category
 */
export async function getServiceTypesByCategory(category: string): Promise<DbServiceType[]> {
  try {
    const rows = await db.select()
      .from(serviceTypes)
      .where(and(eq(serviceTypes.category, category), eq(serviceTypes.isActive, true)))
      .orderBy(asc(serviceTypes.displayOrder), asc(serviceTypes.name))
    return rows.map(toDbServiceType)
  } catch (error) {
    logger.error('Failed to get service types by category', { category, error })
    return []
  }
}

/**
 * Get all service slugs (for static generation)
 */
export async function getAllServiceSlugs(): Promise<string[]> {
  try {
    const rows = await db.select({ slug: serviceTypes.slug })
      .from(serviceTypes)
      .where(and(eq(serviceTypes.isActive, true), eq(serviceTypes.isFeatured, true)))
      .orderBy(asc(serviceTypes.displayOrder))
    return rows.map((row) => row.slug)
  } catch (error) {
    logger.error('Failed to get service slugs', { error })
    return []
  }
}

// ============================================================================
// Admin Functions
// ============================================================================

/**
 * Get all services for admin (includes inactive)
 */
export async function getAllServiceTypesForAdmin(): Promise<DbServiceType[]> {
  try {
    const rows = await db.select()
      .from(serviceTypes)
      .orderBy(desc(serviceTypes.isActive), asc(serviceTypes.displayOrder), asc(serviceTypes.name))
    return rows.map(toDbServiceType)
  } catch (error) {
    logger.error('Failed to get all service types for admin', { error })
    return []
  }
}

/**
 * Update service type fields
 */
export interface UpdateServiceTypeData {
  name?: string
  slug?: string
  description?: string | null
  category?: string | null
  duration_minutes?: number
  price_cents?: number | null
  requires_approval?: boolean
  is_active?: boolean
  is_bookable?: boolean
  is_featured?: boolean
  display_order?: number
  // Presentation fields
  icon_name?: string | null
  hero_title?: string | null
  hero_subtitle?: string | null
  hero_description?: string | null
  features_json?: object[] | null
  process_json?: object[] | null
  pricing_base?: string | null
  pricing_details?: string[] | null
  pricing_media_prices?: string[] | null
}

/**
 * Update a service type by ID
 */
export async function updateServiceType(
  id: string,
  data: UpdateServiceTypeData
): Promise<DbServiceType | null> {
  try {
    // Build dynamic SET clauses as parameterized sql fragments
    const setClauses: SQL[] = []

    const addClause = (col: string, val: unknown, isJsonb = false) => {
      if (isJsonb) {
        setClauses.push(sql`${sql.raw(col)} = ${val}::jsonb`)
      } else {
        setClauses.push(sql`${sql.raw(col)} = ${val}`)
      }
    }

    if (data.name !== undefined) addClause('name', data.name)
    if (data.slug !== undefined) addClause('slug', data.slug)
    if (data.description !== undefined) addClause('description', data.description)
    if (data.category !== undefined) addClause('category', data.category)
    if (data.duration_minutes !== undefined) addClause('duration_minutes', data.duration_minutes)
    if (data.price_cents !== undefined) addClause('price_cents', data.price_cents)
    if (data.requires_approval !== undefined) addClause('requires_approval', data.requires_approval)
    if (data.is_active !== undefined) addClause('is_active', data.is_active)
    if (data.is_bookable !== undefined) addClause('is_bookable', data.is_bookable)
    if (data.is_featured !== undefined) addClause('is_featured', data.is_featured)
    if (data.display_order !== undefined) addClause('display_order', data.display_order)
    if (data.icon_name !== undefined) addClause('icon_name', data.icon_name)
    if (data.hero_title !== undefined) addClause('hero_title', data.hero_title)
    if (data.hero_subtitle !== undefined) addClause('hero_subtitle', data.hero_subtitle)
    if (data.hero_description !== undefined) addClause('hero_description', data.hero_description)
    if (data.features_json !== undefined) addClause('features_json', JSON.stringify(data.features_json), true)
    if (data.process_json !== undefined) addClause('process_json', JSON.stringify(data.process_json), true)
    if (data.pricing_base !== undefined) addClause('pricing_base', data.pricing_base)
    if (data.pricing_details !== undefined) addClause('pricing_details', JSON.stringify(data.pricing_details), true)
    if (data.pricing_media_prices !== undefined) addClause('pricing_media_prices', JSON.stringify(data.pricing_media_prices), true)

    if (setClauses.length === 0) {
      logger.warn('No fields to update for service type', { id })
      return getServiceTypeById(id)
    }

    // Join SET clause fragments with commas
    let setFragment = setClauses[0]
    for (let i = 1; i < setClauses.length; i++) {
      setFragment = sql`${setFragment}, ${setClauses[i]}`
    }
    setFragment = sql`${setFragment}, updated_at = NOW()`

    const result = await db.execute(sql`
      UPDATE ${sql.raw(stTable)}
      SET ${setFragment}
      WHERE id = ${id}
      RETURNING id
    `)

    if (result.rows.length === 0) {
      logger.warn('Service type not found for update', { id })
      return null
    }

    logger.info('Service type updated', { id, fields: Object.keys(data) })
    return getServiceTypeById(id)
  } catch (error) {
    logger.error('Failed to update service type', { id, error })
    throw error
  }
}

/**
 * Create a new service type
 */
export async function createServiceType(
  data: Omit<UpdateServiceTypeData, 'is_active'> & { name: string; slug: string }
): Promise<DbServiceType | null> {
  try {
    const rows = await db.insert(serviceTypes).values({
      name: data.name,
      slug: data.slug,
      description: data.description ?? null,
      category: data.category ?? null,
      durationMinutes: data.duration_minutes ?? 60,
      priceCents: data.price_cents ?? null,
      requiresApproval: data.requires_approval ?? false,
      isActive: true,
      isBookable: data.is_bookable ?? true,
      isFeatured: data.is_featured ?? false,
      displayOrder: data.display_order ?? 100,
      iconName: data.icon_name ?? 'Wrench',
      heroTitle: data.hero_title ?? null,
      heroSubtitle: data.hero_subtitle ?? null,
      heroDescription: data.hero_description ?? null,
      featuresJson: data.features_json ?? [],
      processJson: data.process_json ?? [],
      pricingBase: data.pricing_base ?? null,
      pricingDetails: data.pricing_details ?? [],
      pricingMediaPrices: data.pricing_media_prices ?? null,
    }).returning()

    logger.info('Service type created', { slug: data.slug })
    return rows[0] ? toDbServiceType(rows[0]) : null
  } catch (error) {
    logger.error('Failed to create service type', { slug: data.slug, error })
    throw error
  }
}

/**
 * Delete a service type (soft delete by setting is_active = false)
 */
export async function deleteServiceType(id: string): Promise<boolean> {
  try {
    const rows = await db.update(serviceTypes)
      .set({ isActive: false, updatedAt: new Date().toISOString() })
      .where(eq(serviceTypes.id, id))
      .returning({ id: serviceTypes.id })

    const success = rows.length > 0
    if (success) {
      logger.info('Service type deleted (soft)', { id })
    } else {
      logger.warn('Service type not found for deletion', { id })
    }
    return success
  } catch (error) {
    logger.error('Failed to delete service type', { id, error })
    throw error
  }
}
