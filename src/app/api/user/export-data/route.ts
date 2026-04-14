/**
 * GET /api/user/export-data
 *
 * GDPR/Swiss DSG compliant user data export.
 * Returns ALL data associated with the authenticated user as a JSON download.
 *
 * Rate limited to 3 exports per 24h via auth_audit_log counting.
 */

import { NextRequest, NextResponse } from 'next/server'
import { apiRateLimited, apiError } from '@/lib/api/helpers'
import { withAuth, ValidSession } from '@/lib/api/middleware'
import { query } from '@/lib/auth/db'
import { TABLE_NAMES } from '@/config/database'
import { logger } from '@/lib/logger'

const EXPORT_EVENT_TYPE = 'data_export'
const MAX_EXPORTS_PER_DAY = 3

interface CountRow {
  count: string
}

async function safeQuery<T = Record<string, unknown>>(
  sql: string,
  params: unknown[],
): Promise<T[]> {
  try {
    const result = await query<T>(sql, params as never)
    return result.rows
  } catch (error) {
    // Table may not exist in every environment — log and continue with empty
    logger.warn('Data export: query failed (continuing)', {
      error: error instanceof Error ? error.message : String(error),
      sql: sql.slice(0, 80),
    })
    return []
  }
}

export const GET = withAuth(async (_request: NextRequest, session: ValidSession) => {
  const userId = session.user.id
  const userEmail = session.user.email

  try {
    // --- Rate limit check: max 3 exports / 24h ---
    const rateLimitResult = await query<CountRow>(
      `SELECT COUNT(*)::text AS count
         FROM ${TABLE_NAMES.AUTH_AUDIT_LOG}
        WHERE user_id = $1
          AND event_type = $2
          AND created_at > NOW() - INTERVAL '24 hours'`,
      [userId, EXPORT_EVENT_TYPE],
    )
    const recentExports = Number(rateLimitResult.rows[0]?.count ?? 0)

    if (recentExports >= MAX_EXPORTS_PER_DAY) {
      logger.warn('Data export rate limit exceeded', { userId, recentExports })
      return apiRateLimited(`Maximale Anzahl Exporte pro Tag erreicht (${MAX_EXPORTS_PER_DAY}). Bitte versuche es später erneut.`)
    }

    // --- Collect all user data ---
    const [
      profile,
      listings,
      ordersAsBuyer,
      ordersAsSeller,
      reviewsGiven,
      messagesSent,
      messagesReceived,
      itHilfeRequests,
      itHilfeOffers,
      workshopRegistrations,
      donations,
    ] = await Promise.all([
      safeQuery(
        `SELECT id, email, name, created_at, updated_at
           FROM ${TABLE_NAMES.USERS}
          WHERE id = $1`,
        [userId],
      ),
      safeQuery(
        `SELECT * FROM ${TABLE_NAMES.LISTINGS} WHERE seller_id = $1`,
        [userId],
      ),
      safeQuery(
        `SELECT * FROM ${TABLE_NAMES.MARKETPLACE_ORDERS} WHERE buyer_id = $1`,
        [userId],
      ),
      safeQuery(
        `SELECT * FROM ${TABLE_NAMES.MARKETPLACE_ORDERS} WHERE seller_id = $1`,
        [userId],
      ),
      safeQuery(
        `SELECT * FROM ${TABLE_NAMES.REVIEWS} WHERE reviewer_id = $1`,
        [userId],
      ),
      safeQuery(
        `SELECT * FROM ${TABLE_NAMES.MESSAGES} WHERE sender_id = $1`,
        [userId],
      ),
      safeQuery(
        `SELECT * FROM ${TABLE_NAMES.MESSAGES} WHERE recipient_id = $1`,
        [userId],
      ),
      safeQuery(
        `SELECT * FROM ${TABLE_NAMES.IT_HILFE_REQUESTS} WHERE requester_id = $1`,
        [userId],
      ),
      safeQuery(
        `SELECT * FROM ${TABLE_NAMES.IT_HILFE_OFFERS} WHERE helper_id = $1`,
        [userId],
      ),
      safeQuery(
        `SELECT * FROM ${TABLE_NAMES.WORKSHOP_REGISTRATIONS} WHERE user_id = $1`,
        [userId],
      ),
      safeQuery(
        `SELECT * FROM ${TABLE_NAMES.DONATIONS} WHERE user_id = $1`,
        [userId],
      ),
    ])

    const exportPayload = {
      meta: {
        exportedAt: new Date().toISOString(),
        userId,
        email: userEmail,
        legalBasis:
          'Schweizer Datenschutzgesetz (DSG) Art. 25, EU-DSGVO Art. 15 und Art. 20',
        note:
          'Diese Datei enthält alle personenbezogenen Daten, die Revamp-IT zu deinem Konto gespeichert hat.',
      },
      profile: profile[0] ?? null,
      listings,
      orders: {
        asBuyer: ordersAsBuyer,
        asSeller: ordersAsSeller,
      },
      reviews: {
        given: reviewsGiven,
      },
      messages: {
        sent: messagesSent,
        received: messagesReceived,
      },
      itHilfe: {
        requests: itHilfeRequests,
        offers: itHilfeOffers,
      },
      workshopRegistrations,
      donations,
    }

    // --- Audit log ---
    const ipAddress =
      _request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      _request.headers.get('x-real-ip') ||
      'unknown'
    const userAgent = _request.headers.get('user-agent') ?? null

    await safeQuery(
      `INSERT INTO ${TABLE_NAMES.AUTH_AUDIT_LOG} (event_type, user_id, ip_address, user_agent, severity, details)
       VALUES ($1, $2, $3, $4, 'info', $5::jsonb)`,
      [
        EXPORT_EVENT_TYPE,
        userId,
        ipAddress,
        userAgent,
        JSON.stringify({ recordCount: {
          listings: listings.length,
          ordersAsBuyer: ordersAsBuyer.length,
          ordersAsSeller: ordersAsSeller.length,
          messagesSent: messagesSent.length,
          messagesReceived: messagesReceived.length,
        }}),
      ],
    )

    logger.info('User data exported', { userId, email: userEmail })

    // --- Return as downloadable JSON ---
    const date = new Date().toISOString().slice(0, 10)
    const filename = `revampit-data-export-${userId}-${date}.json`
    const body = JSON.stringify(exportPayload, null, 2)

    return new NextResponse(body, {
      status: 200,
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-store',
      },
    })
  } catch (error) {
    logger.error('Data export failed', {
      error: error instanceof Error ? error.message : String(error),
      userId,
    })
    return apiError(error, 'Export fehlgeschlagen. Bitte versuche es später erneut.')
  }
})
