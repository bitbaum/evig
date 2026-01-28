/**
 * Services Database Functions
 *
 * Reads services from the database for public display.
 * Admin manages services in database, public reads from database.
 * SSOT: Database is the single source of truth for service definitions.
 */

import { query } from '@/lib/auth/db'
import { TABLE_NAMES } from '@/config/database'
import { logger } from '@/lib/logger'

export interface Service {
  id: string
  slug: string
  name: string
  description: string
  heroTitle: string | null
  heroSubtitle: string | null
  heroDescription: string | null
  content: string | null
  icon: string
  priceDisplay: string | null
  priceDetails: string[]
  isActive: boolean
  sortOrder: number
  createdAt: string
  updatedAt: string
}

/**
 * Get all active services for public display
 */
export async function getActiveServices(): Promise<Service[]> {
  try {
    const result = await query<{
      id: string
      slug: string
      name: string
      description: string
      hero_title: string | null
      hero_subtitle: string | null
      hero_description: string | null
      content: string | null
      icon: string
      price_display: string | null
      price_details: string[] | null
      is_active: boolean
      sort_order: number
      created_at: string
      updated_at: string
    }>(
      `SELECT
        id, slug, name, description,
        hero_title, hero_subtitle, hero_description,
        content, icon, price_display, price_details,
        is_active, sort_order, created_at, updated_at
      FROM ${TABLE_NAMES.SERVICES}
      WHERE is_active = true
      ORDER BY sort_order, name`
    )

    return result.rows.map(mapServiceFromDb)
  } catch (error) {
    logger.error('Failed to get active services', { error })
    return []
  }
}

/**
 * Get a single service by slug
 */
export async function getServiceBySlug(slug: string): Promise<Service | null> {
  try {
    const result = await query<{
      id: string
      slug: string
      name: string
      description: string
      hero_title: string | null
      hero_subtitle: string | null
      hero_description: string | null
      content: string | null
      icon: string
      price_display: string | null
      price_details: string[] | null
      is_active: boolean
      sort_order: number
      created_at: string
      updated_at: string
    }>(
      `SELECT
        id, slug, name, description,
        hero_title, hero_subtitle, hero_description,
        content, icon, price_display, price_details,
        is_active, sort_order, created_at, updated_at
      FROM ${TABLE_NAMES.SERVICES}
      WHERE slug = $1 AND is_active = true`,
      [slug]
    )

    if (result.rows.length === 0) return null
    return mapServiceFromDb(result.rows[0])
  } catch (error) {
    logger.error('Failed to get service by slug', { slug, error })
    return null
  }
}

/**
 * Get all service slugs for static generation
 */
export async function getAllServiceSlugs(): Promise<string[]> {
  try {
    const result = await query<{ slug: string }>(
      `SELECT slug FROM ${TABLE_NAMES.SERVICES} WHERE is_active = true ORDER BY sort_order`
    )
    return result.rows.map((row) => row.slug)
  } catch (error) {
    logger.error('Failed to get service slugs', { error })
    return []
  }
}

/**
 * Map database row to Service interface
 */
function mapServiceFromDb(row: {
  id: string
  slug: string
  name: string
  description: string
  hero_title: string | null
  hero_subtitle: string | null
  hero_description: string | null
  content: string | null
  icon: string
  price_display: string | null
  price_details: string[] | null
  is_active: boolean
  sort_order: number
  created_at: string
  updated_at: string
}): Service {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    description: row.description,
    heroTitle: row.hero_title,
    heroSubtitle: row.hero_subtitle,
    heroDescription: row.hero_description,
    content: row.content,
    icon: row.icon,
    priceDisplay: row.price_display,
    priceDetails: row.price_details || [],
    isActive: row.is_active,
    sortOrder: row.sort_order,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}
