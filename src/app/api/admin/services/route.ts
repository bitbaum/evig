/**
 * API: Admin Services
 *
 * GET /api/admin/services - List all services (including inactive)
 * POST /api/admin/services - Create new service
 */

import { NextRequest } from 'next/server'
import { auth } from '@/auth'
import { canAccessSection } from '@/lib/permissions'
import { logger } from '@/lib/logger'
import { apiSuccess, apiError, apiUnauthorized, apiForbidden, apiBadRequest } from '@/lib/api/helpers'
import {
  getAdminServices,
  createServiceType,
} from '@/lib/services'
import { validateBody, AdminCreateServiceSchema } from '@/lib/schemas'

export async function GET() {
  try {
    const session = await auth()

    if (!session?.user) {
      return apiUnauthorized()
    }

    const user = {
      email: session.user.email,
      is_staff: session.user.isStaff,
      staff_permissions: session.user.staffPermissions,
    }

    if (!canAccessSection(user, 'services')) {
      return apiForbidden('Kein Zugriff auf Dienstleistungen')
    }

    const services = await getAdminServices()

    return apiSuccess(services)
  } catch (error) {
    logger.error('Failed to list services', { error })
    return apiError(error, 'Dienstleistungen konnten nicht geladen werden')
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user) {
      return apiUnauthorized()
    }

    const user = {
      email: session.user.email,
      is_staff: session.user.isStaff,
      staff_permissions: session.user.staffPermissions,
    }

    if (!canAccessSection(user, 'services')) {
      return apiForbidden('Kein Zugriff auf Dienstleistungen')
    }

    const body = await request.json()
    const validation = validateBody(AdminCreateServiceSchema, body)
    if (!validation.success) return validation.error
    const {
      name,
      slug,
      description,
      category,
      durationMinutes,
      priceCents,
      requiresApproval,
      isBookable,
      isFeatured,
      displayOrder,
      iconName,
      heroTitle,
      heroSubtitle,
      heroDescription,
      features,
      process,
      pricingBase,
      pricingDetails,
      pricingMediaPrices,
    } = validation.data

    const service = await createServiceType({
      name,
      slug,
      description: description || null,
      category: category || null,
      duration_minutes: durationMinutes,
      price_cents: priceCents ?? null,
      requires_approval: requiresApproval,
      is_bookable: isBookable,
      is_featured: isFeatured,
      display_order: displayOrder,
      icon_name: iconName,
      hero_title: heroTitle || null,
      hero_subtitle: heroSubtitle || null,
      hero_description: heroDescription || null,
      features_json: features,
      process_json: process,
      pricing_base: pricingBase || null,
      pricing_details: pricingDetails,
      pricing_media_prices: pricingMediaPrices || null,
    })

    logger.info('Service created', { serviceId: service?.id, userId: session.user.id })

    return apiSuccess(service, 201)
  } catch (error) {
    // Check for unique constraint violation
    if (error instanceof Error && error.message.includes('duplicate key')) {
      return apiBadRequest('Ein Service mit diesem Slug existiert bereits')
    }
    logger.error('Failed to create service', { error })
    return apiError(error, 'Dienstleistung konnte nicht erstellt werden')
  }
}
