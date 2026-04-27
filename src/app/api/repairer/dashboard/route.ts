/**
 * Repairer Dashboard API
 * GET /api/repairer/dashboard - Get repairer dashboard stats and bookings
 */

import { NextRequest } from 'next/server'
import { db } from '@/db'
import { serviceAppointments, serviceTypes, users, repairerProfiles, repairerReviews, repairerServices } from '@/db/schema'
import { eq, sql, desc, and, isNull } from 'drizzle-orm'
import { alias } from 'drizzle-orm/pg-core'
import { apiError, apiSuccess, apiUnauthorized } from '@/lib/api/helpers'
import { logger } from '@/lib/logger'
import { APPOINTMENT_STATUS } from '@/config/appointment-status'
import { REVIEW_STATUS } from '@/config/review-status'
import { URGENCY_DEFAULT } from '@/config/it-hilfe'
import { auth } from '@/auth'
import { ROLES } from '@/lib/constants'

const customerUser = alias(users, 'customer')

export async function GET(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user) {
      return apiUnauthorized('Anmeldung erforderlich')
    }

    const userRole = session.user.role as string

    // Access granted if: repairer role OR staff
    const hasAccess = userRole === ROLES.REPAIRER || session.user.isStaff

    if (!hasAccess) {
      return apiUnauthorized('Repairer-Berechtigung erforderlich')
    }

    const userId = session.user.id

    // Get repairer profile
    let repairerId: string | null = null
    try {
      const [profile] = await db
        .select({ id: repairerProfiles.id })
        .from(repairerProfiles)
        .where(eq(repairerProfiles.userId, userId))
      repairerId = profile?.id || null
    } catch {
      logger.debug('Repairer profile query failed, continuing with user_id')
    }

    // Fetch bookings assigned to this repairer
    const isAdmin = userRole === ROLES.REVAMPIT_ADMIN
    const bookingCondition = isAdmin
      ? sql`(${serviceAppointments.repairerId} = ${userId} OR ${serviceAppointments.repairerId} IS NULL)`
      : eq(serviceAppointments.repairerId, userId)

    const bookingRows = await db
      .select({
        id: serviceAppointments.id,
        customer_name: customerUser.name,
        customer_email: customerUser.email,
        service_name: serviceTypes.name,
        status: serviceAppointments.status,
        urgency: serviceAppointments.urgency,
        preferred_date: serviceAppointments.preferredDate,
        confirmed_date: serviceAppointments.confirmedDate,
        description: serviceAppointments.description,
        device_info: serviceAppointments.deviceInfo,
        price_charged_cents: serviceAppointments.priceChargedCents,
        created_at: serviceAppointments.createdAt,
      })
      .from(serviceAppointments)
      .innerJoin(customerUser, eq(serviceAppointments.userId, customerUser.id))
      .innerJoin(serviceTypes, eq(serviceAppointments.serviceTypeId, serviceTypes.id))
      .where(bookingCondition)
      .orderBy(desc(serviceAppointments.createdAt))
      .limit(10)

    // Fetch stats
    const [stats] = await db
      .select({
        total_bookings: sql<string>`COUNT(*)`,
        completed_bookings: sql<string>`COUNT(*) FILTER (WHERE ${serviceAppointments.status} = ${APPOINTMENT_STATUS.COMPLETED})`,
        pending_bookings: sql<string>`COUNT(*) FILTER (WHERE ${serviceAppointments.status} IN (${APPOINTMENT_STATUS.REQUESTED}, ${APPOINTMENT_STATUS.IN_PROGRESS}))`,
        confirmed_bookings: sql<string>`COUNT(*) FILTER (WHERE ${serviceAppointments.status} = ${APPOINTMENT_STATUS.CONFIRMED})`,
        total_revenue: sql<string>`COALESCE(SUM(${serviceAppointments.priceChargedCents}), 0)`,
      })
      .from(serviceAppointments)
      .where(eq(serviceAppointments.repairerId, userId))

    // Fetch rating info from repairer reviews
    let ratingInfo = { average_rating: '0', review_count: '0' }
    try {
      if (repairerId) {
        const [ratingRow] = await db
          .select({
            average_rating: sql<string>`COALESCE(AVG(${repairerReviews.rating}), 0)`,
            review_count: sql<string>`COUNT(*)`,
          })
          .from(repairerReviews)
          .where(and(
            eq(repairerReviews.repairerId, repairerId),
            eq(repairerReviews.isPublic, true)
          ))
        if (ratingRow) {
          ratingInfo = ratingRow
        }
      }
    } catch {
      logger.debug('Repairer reviews query failed')
    }

    // Fetch services offered by this repairer
    let serviceRows: { id: string; service_name: string; description: string | null; base_price_cents: number | null; hourly_rate_cents: number | null; is_active: boolean | null }[] = []
    try {
      if (repairerId) {
        serviceRows = await db
          .select({
            id: repairerServices.id,
            service_name: repairerServices.serviceName,
            description: repairerServices.description,
            base_price_cents: repairerServices.basePriceCents,
            hourly_rate_cents: repairerServices.hourlyRateCents,
            is_active: repairerServices.isActive,
          })
          .from(repairerServices)
          .where(eq(repairerServices.repairerId, repairerId))
          .orderBy(desc(repairerServices.isActive), repairerServices.serviceName)
      }
    } catch {
      logger.debug('Repairer services query failed')
    }

    const statsData = stats || {
      total_bookings: '0',
      completed_bookings: '0',
      pending_bookings: '0',
      confirmed_bookings: '0',
      total_revenue: '0',
    }

    // Transform bookings
    const bookings = bookingRows.map(row => ({
      id: row.id,
      customer: row.customer_name || row.customer_email?.split('@')[0] || 'Kunde',
      service: row.service_name,
      status: row.status,
      urgency: row.urgency || URGENCY_DEFAULT,
      preferredDate: row.preferred_date,
      confirmedDate: row.confirmed_date,
      description: row.description,
      deviceInfo: row.device_info,
      price: row.price_charged_cents ? row.price_charged_cents / 100 : null,
      createdAt: row.created_at,
    }))

    // Transform services (fix column name bug: was base_price_chf, now correctly base_price_cents)
    const formattedServices = serviceRows.map(row => ({
      id: row.id,
      name: row.service_name,
      description: row.description,
      basePrice: (row.base_price_cents || 0) / 100,
      hourlyRate: (row.hourly_rate_cents || 0) / 100,
      isActive: row.is_active,
    }))

    return apiSuccess({
      stats: {
        totalBookings: parseInt(statsData.total_bookings),
        completedBookings: parseInt(statsData.completed_bookings),
        pendingBookings: parseInt(statsData.pending_bookings),
        confirmedBookings: parseInt(statsData.confirmed_bookings),
        totalRevenue: parseInt(statsData.total_revenue) / 100,
        averageRating: parseFloat(ratingInfo.average_rating) || 0,
        reviewCount: parseInt(ratingInfo.review_count) || 0,
      },
      bookings,
      services: formattedServices,
      repairerId,
    })
  } catch (error) {
    logger.error('Failed to fetch repairer dashboard', { error })
    return apiError(error, 'Dashboard konnte nicht geladen werden')
  }
}
