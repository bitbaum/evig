/**
 * Repairer Dashboard API
 * GET /api/repairer/dashboard - Get repairer dashboard stats and bookings
 *
 * MIGRATION: Now uses unified permissions for admin access check
 */

import { NextRequest } from 'next/server'
import { query } from '@/lib/auth/db'
import { TABLE_NAMES } from '@/config/database'
import { apiError, apiSuccess, apiUnauthorized } from '@/lib/api/helpers'
import { logger } from '@/lib/logger'
import { auth } from '@/auth'
import { ROLES } from '@/lib/constants'
import { hasAdminAccessUnified, type UnifiedUser } from '@/lib/auth/unified-permissions'

interface BookingRow {
  id: string
  customer_name: string
  customer_email: string
  service_name: string
  status: string
  urgency: string
  preferred_date: string
  confirmed_date: string
  description: string
  device_info: string
  price_charged_cents: number
  created_at: string
}

interface ServiceRow {
  id: string
  service_name: string
  description: string
  base_price_chf: number
  hourly_rate_chf: number
  is_active: boolean
}

interface StatsRow {
  total_bookings: string
  completed_bookings: string
  pending_bookings: string
  confirmed_bookings: string
  total_revenue: string
}

interface RatingRow {
  average_rating: string
  review_count: string
}

export async function GET(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user) {
      return apiUnauthorized('Anmeldung erforderlich')
    }

    const userRole = session.user.role as string

    // UNIFIED: Build user object for admin check
    const user: UnifiedUser = {
      email: session.user.email || '',
      role: userRole,
      isStaff: session.user.isStaff,
      staffPermissions: session.user.staffPermissions,
      isSuperAdmin: session.user.isSuperAdmin,
    }

    // Access granted if: repairer role OR admin access (via old or new system)
    const hasAccess = userRole === ROLES.REPAIRER || hasAdminAccessUnified(user)

    if (!hasAccess) {
      return apiUnauthorized('Repairer-Berechtigung erforderlich')
    }

    const userId = session.user.id

    // Get repairer profile
    let repairerId: string | null = null
    try {
      const profileResult = await query<{ id: string }>(
        `SELECT id FROM ${TABLE_NAMES.REPAIRER_PROFILES} WHERE user_id = $1`,
        [userId]
      )
      repairerId = profileResult.rows[0]?.id || null
    } catch {
      logger.debug('Repairer profile query failed, continuing with user_id')
    }

    // Fetch bookings assigned to this repairer
    const bookingsResult = await query<BookingRow>(
      `SELECT
        sa.id,
        u.name as customer_name,
        u.email as customer_email,
        st.name as service_name,
        sa.status,
        sa.urgency,
        sa.preferred_date,
        sa.confirmed_date,
        sa.description,
        sa.device_info,
        sa.price_charged_cents,
        sa.created_at
       FROM ${TABLE_NAMES.SERVICE_APPOINTMENTS} sa
       JOIN ${TABLE_NAMES.USERS} u ON sa.user_id = u.id
       JOIN ${TABLE_NAMES.SERVICE_TYPES} st ON sa.service_type_id = st.id
       WHERE sa.repairer_id = $1 OR (sa.repairer_id IS NULL AND $2 = true)
       ORDER BY sa.created_at DESC
       LIMIT 10`,
      [userId, userRole === ROLES.REVAMPIT_ADMIN]
    )

    // Fetch stats
    const statsResult = await query<StatsRow>(
      `SELECT
        COUNT(*) as total_bookings,
        COUNT(*) FILTER (WHERE status = 'completed') as completed_bookings,
        COUNT(*) FILTER (WHERE status IN ('requested', 'in_progress')) as pending_bookings,
        COUNT(*) FILTER (WHERE status = 'confirmed') as confirmed_bookings,
        COALESCE(SUM(price_charged_cents), 0) as total_revenue
       FROM ${TABLE_NAMES.SERVICE_APPOINTMENTS}
       WHERE repairer_id = $1`,
      [userId]
    )

    // Fetch rating info from repairer profile or reviews
    let ratingInfo: RatingRow = { average_rating: '0', review_count: '0' }
    try {
      if (repairerId) {
        const ratingResult = await query<RatingRow>(
          `SELECT
            COALESCE(AVG(rating), 0) as average_rating,
            COUNT(*) as review_count
           FROM ${TABLE_NAMES.REPAIRER_REVIEWS}
           WHERE repairer_id = $1 AND status = 'published'`,
          [repairerId]
        )
        if (ratingResult.rows[0]) {
          ratingInfo = ratingResult.rows[0]
        }
      }
    } catch {
      logger.debug('Repairer reviews query failed')
    }

    // Fetch services offered by this repairer
    let services: ServiceRow[] = []
    try {
      if (repairerId) {
        const servicesResult = await query<ServiceRow>(
          `SELECT
            id,
            service_name,
            description,
            base_price_chf,
            hourly_rate_chf,
            is_active
           FROM ${TABLE_NAMES.REPAIRER_SERVICES}
           WHERE repairer_id = $1
           ORDER BY is_active DESC, service_name ASC`,
          [repairerId]
        )
        services = servicesResult.rows
      }
    } catch {
      logger.debug('Repairer services query failed')
    }

    const stats = statsResult.rows[0] || {
      total_bookings: '0',
      completed_bookings: '0',
      pending_bookings: '0',
      confirmed_bookings: '0',
      total_revenue: '0',
    }

    // Transform bookings
    const bookings = bookingsResult.rows.map(row => ({
      id: row.id,
      customer: row.customer_name || row.customer_email?.split('@')[0] || 'Kunde',
      service: row.service_name,
      status: row.status,
      urgency: row.urgency || 'normal',
      preferredDate: row.preferred_date,
      confirmedDate: row.confirmed_date,
      description: row.description,
      deviceInfo: row.device_info,
      price: row.price_charged_cents ? row.price_charged_cents / 100 : null,
      createdAt: row.created_at,
    }))

    // Transform services
    const formattedServices = services.map(row => ({
      id: row.id,
      name: row.service_name,
      description: row.description,
      basePrice: parseFloat(String(row.base_price_chf)) || 0,
      hourlyRate: parseFloat(String(row.hourly_rate_chf)) || 0,
      isActive: row.is_active,
    }))

    return apiSuccess({
      stats: {
        totalBookings: parseInt(stats.total_bookings),
        completedBookings: parseInt(stats.completed_bookings),
        pendingBookings: parseInt(stats.pending_bookings),
        confirmedBookings: parseInt(stats.confirmed_bookings),
        totalRevenue: parseInt(stats.total_revenue) / 100, // Convert cents to CHF
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
