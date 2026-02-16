/**
 * API: Admin Service by ID
 *
 * GET /api/admin/services/[id] - Get single service
 * PUT /api/admin/services/[id] - Update service
 * DELETE /api/admin/services/[id] - Soft delete service
 */

import { NextRequest } from 'next/server'
import { withAdmin } from '@/lib/api/middleware'
import { canAccessSection } from '@/lib/permissions'
import { logger } from '@/lib/logger'
import { apiSuccess, apiError, apiForbidden, apiBadRequest, apiNotFound } from '@/lib/api/helpers'
import {
  getAdminServiceById,
  updateServiceType,
  deleteServiceType,
} from '@/lib/services'

export const GET = withAdmin<{ id: string }>(async (request, session, context) => {
  try {
    const { id } = context!.params!

    const user = {
      email: session.user.email,
      is_staff: session.user.isStaff,
      staff_permissions: session.user.staffPermissions,
    }

    if (!canAccessSection(user, 'services')) {
      return apiForbidden('Kein Zugriff auf Dienstleistungen')
    }

    const service = await getAdminServiceById(id)

    if (!service) {
      return apiNotFound('Dienstleistung nicht gefunden')
    }

    return apiSuccess(service)
  } catch (error) {
    logger.error('Failed to get service', { error })
    return apiError(error, 'Dienstleistung konnte nicht geladen werden')
  }
})

export const PUT = withAdmin<{ id: string }>(async (request, session, context) => {
  try {
    const { id } = context!.params!

    const user = {
      email: session.user.email,
      is_staff: session.user.isStaff,
      staff_permissions: session.user.staffPermissions,
    }

    if (!canAccessSection(user, 'services')) {
      return apiForbidden('Kein Zugriff auf Dienstleistungen')
    }

    const body = await request.json()
    const {
      name,
      slug,
      description,
      category,
      durationMinutes,
      priceCents,
      requiresApproval,
      isActive,
      isBookable,
      isFeatured,
      displayOrder,
      // Presentation fields
      iconName,
      heroTitle,
      heroSubtitle,
      heroDescription,
      features,
      process,
      pricingBase,
      pricingDetails,
      pricingMediaPrices,
    } = body

    // Validate slug format if provided
    if (slug && !/^[a-z0-9-]+$/.test(slug)) {
      return apiBadRequest('Slug darf nur Kleinbuchstaben, Zahlen und Bindestriche enthalten')
    }

    // Build update data (only include defined fields)
    const updateData: Record<string, unknown> = {}

    if (name !== undefined) updateData.name = name
    if (slug !== undefined) updateData.slug = slug
    if (description !== undefined) updateData.description = description
    if (category !== undefined) updateData.category = category
    if (durationMinutes !== undefined) updateData.duration_minutes = durationMinutes
    if (priceCents !== undefined) updateData.price_cents = priceCents
    if (requiresApproval !== undefined) updateData.requires_approval = requiresApproval
    if (isActive !== undefined) updateData.is_active = isActive
    if (isBookable !== undefined) updateData.is_bookable = isBookable
    if (isFeatured !== undefined) updateData.is_featured = isFeatured
    if (displayOrder !== undefined) updateData.display_order = displayOrder

    // Presentation fields
    if (iconName !== undefined) updateData.icon_name = iconName
    if (heroTitle !== undefined) updateData.hero_title = heroTitle
    if (heroSubtitle !== undefined) updateData.hero_subtitle = heroSubtitle
    if (heroDescription !== undefined) updateData.hero_description = heroDescription
    if (features !== undefined) updateData.features_json = features
    if (process !== undefined) updateData.process_json = process
    if (pricingBase !== undefined) updateData.pricing_base = pricingBase
    if (pricingDetails !== undefined) updateData.pricing_details = pricingDetails
    if (pricingMediaPrices !== undefined) updateData.pricing_media_prices = pricingMediaPrices

    const service = await updateServiceType(id, updateData)

    if (!service) {
      return apiNotFound('Dienstleistung nicht gefunden')
    }

    logger.info('Service updated', { serviceId: id, userId: session.user.id, fields: Object.keys(updateData) })

    return apiSuccess(service)
  } catch (error) {
    // Check for unique constraint violation
    if (error instanceof Error && error.message.includes('duplicate key')) {
      return apiBadRequest('Ein Service mit diesem Slug existiert bereits')
    }
    logger.error('Failed to update service', { error })
    return apiError(error, 'Dienstleistung konnte nicht aktualisiert werden')
  }
})

export const DELETE = withAdmin<{ id: string }>(async (request, session, context) => {
  try {
    const { id } = context!.params!

    const user = {
      email: session.user.email,
      is_staff: session.user.isStaff,
      staff_permissions: session.user.staffPermissions,
    }

    if (!canAccessSection(user, 'services')) {
      return apiForbidden('Kein Zugriff auf Dienstleistungen')
    }

    const success = await deleteServiceType(id)

    if (!success) {
      return apiNotFound('Dienstleistung nicht gefunden')
    }

    logger.info('Service deleted', { serviceId: id, userId: session.user.id })

    return apiSuccess({ deleted: true })
  } catch (error) {
    logger.error('Failed to delete service', { error })
    return apiError(error, 'Dienstleistung konnte nicht gelöscht werden')
  }
})
