/**
 * Service Database Queries
 *
 * Fetches operational service data from the service_types table.
 * This is the SSOT for service definitions that can be booked.
 */

import { query } from '@/lib/auth/db'
import { TABLE_NAMES } from '@/config/database'
import { logger } from '@/lib/logger'
import type { DbServiceType } from './types'

/**
 * Standard columns to select for service types
 * Includes both operational and presentation fields
 */
const SERVICE_TYPE_COLUMNS = `
  id, slug, name, description, category,
  duration_minutes, price_cents, requires_approval,
  is_active, is_bookable, is_featured, display_order,
  created_at, updated_at,
  icon_name, hero_title, hero_subtitle, hero_description,
  features_json, process_json,
  pricing_base, pricing_details, pricing_media_prices
`

/**
 * Get all active services from database
 */
export async function getAllServiceTypes(): Promise<DbServiceType[]> {
  try {
    const result = await query<DbServiceType>(
      `SELECT ${SERVICE_TYPE_COLUMNS}
      FROM ${TABLE_NAMES.SERVICE_TYPES}
      WHERE is_active = true
      ORDER BY display_order, name`
    )
    return result.rows
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
    const result = await query<DbServiceType>(
      `SELECT ${SERVICE_TYPE_COLUMNS}
      FROM ${TABLE_NAMES.SERVICE_TYPES}
      WHERE is_active = true AND is_featured = true
      ORDER BY display_order, name`
    )
    return result.rows
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
    const result = await query<DbServiceType>(
      `SELECT ${SERVICE_TYPE_COLUMNS}
      FROM ${TABLE_NAMES.SERVICE_TYPES}
      WHERE is_active = true AND is_bookable = true
      ORDER BY display_order, name`
    )
    return result.rows
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
    const result = await query<DbServiceType>(
      `SELECT ${SERVICE_TYPE_COLUMNS}
      FROM ${TABLE_NAMES.SERVICE_TYPES}
      WHERE slug = $1 AND is_active = true`,
      [slug]
    )
    return result.rows[0] || null
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
    const result = await query<DbServiceType>(
      `SELECT ${SERVICE_TYPE_COLUMNS}
      FROM ${TABLE_NAMES.SERVICE_TYPES}
      WHERE id = $1`,
      [id]
    )
    return result.rows[0] || null
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
    const result = await query<DbServiceType>(
      `SELECT ${SERVICE_TYPE_COLUMNS}
      FROM ${TABLE_NAMES.SERVICE_TYPES}
      WHERE category = $1 AND is_active = true
      ORDER BY display_order, name`,
      [category]
    )
    return result.rows
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
    const result = await query<{ slug: string }>(
      `SELECT slug FROM ${TABLE_NAMES.SERVICE_TYPES}
       WHERE is_active = true AND is_featured = true
       ORDER BY display_order`
    )
    return result.rows.map((row) => row.slug)
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
    const result = await query<DbServiceType>(
      `SELECT ${SERVICE_TYPE_COLUMNS}
      FROM ${TABLE_NAMES.SERVICE_TYPES}
      ORDER BY is_active DESC, display_order, name`
    )
    return result.rows
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
    // Build dynamic UPDATE query
    const fields: string[] = []
    const values: unknown[] = []
    let paramIndex = 1

    const addField = (key: string, value: unknown) => {
      // Handle JSONB fields
      if (key === 'features_json' || key === 'process_json' || key === 'pricing_details' || key === 'pricing_media_prices') {
        fields.push(`${key} = $${paramIndex}::jsonb`)
      } else {
        fields.push(`${key} = $${paramIndex}`)
      }
      values.push(value)
      paramIndex++
    }

    // Add all provided fields
    if (data.name !== undefined) addField('name', data.name)
    if (data.slug !== undefined) addField('slug', data.slug)
    if (data.description !== undefined) addField('description', data.description)
    if (data.category !== undefined) addField('category', data.category)
    if (data.duration_minutes !== undefined) addField('duration_minutes', data.duration_minutes)
    if (data.price_cents !== undefined) addField('price_cents', data.price_cents)
    if (data.requires_approval !== undefined) addField('requires_approval', data.requires_approval)
    if (data.is_active !== undefined) addField('is_active', data.is_active)
    if (data.is_bookable !== undefined) addField('is_bookable', data.is_bookable)
    if (data.is_featured !== undefined) addField('is_featured', data.is_featured)
    if (data.display_order !== undefined) addField('display_order', data.display_order)
    if (data.icon_name !== undefined) addField('icon_name', data.icon_name)
    if (data.hero_title !== undefined) addField('hero_title', data.hero_title)
    if (data.hero_subtitle !== undefined) addField('hero_subtitle', data.hero_subtitle)
    if (data.hero_description !== undefined) addField('hero_description', data.hero_description)
    if (data.features_json !== undefined) addField('features_json', JSON.stringify(data.features_json))
    if (data.process_json !== undefined) addField('process_json', JSON.stringify(data.process_json))
    if (data.pricing_base !== undefined) addField('pricing_base', data.pricing_base)
    if (data.pricing_details !== undefined) addField('pricing_details', JSON.stringify(data.pricing_details))
    if (data.pricing_media_prices !== undefined) addField('pricing_media_prices', JSON.stringify(data.pricing_media_prices))

    if (fields.length === 0) {
      logger.warn('No fields to update for service type', { id })
      return getServiceTypeById(id)
    }

    // Add ID as last parameter
    values.push(id)

    const result = await query<DbServiceType>(
      `UPDATE ${TABLE_NAMES.SERVICE_TYPES}
       SET ${fields.join(', ')}, updated_at = NOW()
       WHERE id = $${paramIndex}
       RETURNING ${SERVICE_TYPE_COLUMNS}`,
      values
    )

    if (result.rows.length === 0) {
      logger.warn('Service type not found for update', { id })
      return null
    }

    logger.info('Service type updated', { id, fields: Object.keys(data) })
    return result.rows[0]
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
    const result = await query<DbServiceType>(
      `INSERT INTO ${TABLE_NAMES.SERVICE_TYPES} (
        name, slug, description, category,
        duration_minutes, price_cents, requires_approval,
        is_active, is_bookable, is_featured, display_order,
        icon_name, hero_title, hero_subtitle, hero_description,
        features_json, process_json,
        pricing_base, pricing_details, pricing_media_prices
      ) VALUES (
        $1, $2, $3, $4,
        $5, $6, $7,
        $8, $9, $10, $11,
        $12, $13, $14, $15,
        $16::jsonb, $17::jsonb,
        $18, $19::jsonb, $20::jsonb
      )
      RETURNING ${SERVICE_TYPE_COLUMNS}`,
      [
        data.name,
        data.slug,
        data.description ?? null,
        data.category ?? null,
        data.duration_minutes ?? 60,
        data.price_cents ?? null,
        data.requires_approval ?? false,
        true, // is_active
        data.is_bookable ?? true,
        data.is_featured ?? false,
        data.display_order ?? 100,
        data.icon_name ?? 'Wrench',
        data.hero_title ?? null,
        data.hero_subtitle ?? null,
        data.hero_description ?? null,
        JSON.stringify(data.features_json ?? []),
        JSON.stringify(data.process_json ?? []),
        data.pricing_base ?? null,
        JSON.stringify(data.pricing_details ?? []),
        data.pricing_media_prices ? JSON.stringify(data.pricing_media_prices) : null,
      ]
    )

    logger.info('Service type created', { slug: data.slug })
    return result.rows[0]
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
    const result = await query(
      `UPDATE ${TABLE_NAMES.SERVICE_TYPES}
       SET is_active = false, updated_at = NOW()
       WHERE id = $1`,
      [id]
    )

    const success = (result.rowCount ?? 0) > 0
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
