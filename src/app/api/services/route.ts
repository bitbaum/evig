/**
 * API: Public Services
 *
 * GET /api/services - List active services from unified service layer
 *
 * Query params:
 * - featured=true: Only return featured services (default)
 * - bookable=true: Only return bookable services
 * - all=true: Return all active services
 */

import { NextRequest } from 'next/server'
import { logger } from '@/lib/logger'
import { apiSuccessCached, apiError } from '@/lib/api/helpers'
import {
  getFeaturedServices,
  getBookableServices,
  getAllServices,
} from '@/lib/services'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const featured = searchParams.get('featured') !== 'false'
    const bookable = searchParams.get('bookable') === 'true'
    const all = searchParams.get('all') === 'true'

    let services

    if (all) {
      services = await getAllServices()
    } else if (bookable) {
      services = await getBookableServices()
    } else {
      // Default: featured services
      services = await getFeaturedServices()
    }

    // Transform to API response format (exclude React components like icons)
    const response = services.map((service) => ({
      id: service.id,
      slug: service.slug,
      name: service.name,
      description: service.description,
      category: service.category,
      hero: service.hero,
      features: service.features.map((f) => ({
        title: f.title,
        description: f.description,
        // Icon name as string for client-side rendering
        iconName: f.icon?.displayName || 'Wrench',
      })),
      process: service.process,
      pricing: service.pricing,
      priceCents: service.priceCents,
      durationMinutes: service.durationMinutes,
      isBookable: service.isBookable,
      isFeatured: service.isFeatured,
      displayOrder: service.displayOrder,
    }))

    // Services list is stable public data — cache 5 min, stale 1 min
    return apiSuccessCached(response, 300, 60)
  } catch (error) {
    logger.error('Failed to list services', { error })
    return apiError(error, 'Services konnten nicht geladen werden')
  }
}
