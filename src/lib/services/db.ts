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
 * Get all active services from database
 */
export async function getAllServiceTypes(): Promise<DbServiceType[]> {
  try {
    const result = await query<DbServiceType>(
      `SELECT
        id, slug, name, description, category,
        duration_minutes, price_cents, requires_approval,
        is_active, is_bookable, is_featured, display_order,
        created_at, updated_at
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
      `SELECT
        id, slug, name, description, category,
        duration_minutes, price_cents, requires_approval,
        is_active, is_bookable, is_featured, display_order,
        created_at, updated_at
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
      `SELECT
        id, slug, name, description, category,
        duration_minutes, price_cents, requires_approval,
        is_active, is_bookable, is_featured, display_order,
        created_at, updated_at
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
      `SELECT
        id, slug, name, description, category,
        duration_minutes, price_cents, requires_approval,
        is_active, is_bookable, is_featured, display_order,
        created_at, updated_at
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
      `SELECT
        id, slug, name, description, category,
        duration_minutes, price_cents, requires_approval,
        is_active, is_bookable, is_featured, display_order,
        created_at, updated_at
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
      `SELECT
        id, slug, name, description, category,
        duration_minutes, price_cents, requires_approval,
        is_active, is_bookable, is_featured, display_order,
        created_at, updated_at
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
