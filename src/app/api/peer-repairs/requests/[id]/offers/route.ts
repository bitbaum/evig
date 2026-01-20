import { NextRequest } from 'next/server'
import { auth } from '@/auth'
import { query } from '@/lib/auth/db'
import { apiError, apiSuccess, apiUnauthorized, apiBadRequest, apiNotFound, apiForbidden } from '@/lib/api/helpers'
import { ERROR_MESSAGES } from '@/config/error-messages'
import { TABLE_NAMES } from '@/config/database'
import { logger } from '@/lib/logger'
import { getSkillIds } from '@/config/peer-repairs'

interface OfferRow {
  id: string
  request_id: string
  helper_id: string
  helper_name: string
  helper_email: string
  message: string
  estimated_time: string | null
  proposed_compensation: string | null
  relevant_skills: string[] | null
  status: string
  created_at: string
}

interface RequestOwnerRow {
  requester_id: string
  status: string
}

interface RouteParams {
  params: Promise<{ id: string }>
}

/**
 * GET /api/peer-repairs/requests/[id]/offers
 * Get offers for a request (owner only)
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return apiUnauthorized(ERROR_MESSAGES.UNAUTHORIZED)
    }

    const { id } = await params

    // Validate UUID format
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
      return apiBadRequest('Ungültige Anfrage-ID')
    }

    // Check if request exists and user is owner
    const requestResult = await query(`
      SELECT requester_id, status FROM ${TABLE_NAMES.PEER_REPAIR_REQUESTS}
      WHERE id = $1
    `, [id])

    if (requestResult.rows.length === 0) {
      return apiNotFound('Reparaturanfrage')
    }

    const requestData = requestResult.rows[0] as RequestOwnerRow

    if (requestData.requester_id !== session.user.id) {
      return apiForbidden('Sie können nur Angebote für Ihre eigenen Anfragen einsehen')
    }

    // Get offers with helper details
    const offersResult = await query(`
      SELECT
        o.*,
        u.name as helper_name,
        u.email as helper_email
      FROM ${TABLE_NAMES.PEER_REPAIR_OFFERS} o
      JOIN ${TABLE_NAMES.USERS} u ON o.helper_id = u.id
      WHERE o.request_id = $1
      ORDER BY o.created_at DESC
    `, [id])

    const offers = (offersResult.rows as OfferRow[]).map(row => ({
      id: row.id,
      requestId: row.request_id,
      helperId: row.helper_id,
      helperName: row.helper_name,
      helperEmail: row.helper_email,
      message: row.message,
      estimatedTime: row.estimated_time,
      proposedCompensation: row.proposed_compensation,
      relevantSkills: row.relevant_skills || [],
      status: row.status,
      createdAt: row.created_at,
    }))

    logger.info('Fetched offers for request', {
      requestId: id,
      ownerId: session.user.id,
      offerCount: offers.length,
    })

    return apiSuccess({ offers })
  } catch (error) {
    logger.error('Error fetching offers', { error })
    return apiError(error, ERROR_MESSAGES.INTERNAL_SERVER_ERROR)
  }
}

/**
 * POST /api/peer-repairs/requests/[id]/offers
 * Submit an offer for a request (requires auth, not own request)
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return apiUnauthorized(ERROR_MESSAGES.UNAUTHORIZED)
    }

    const { id } = await params

    // Validate UUID format
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
      return apiBadRequest('Ungültige Anfrage-ID')
    }

    // Check if request exists and is open
    const requestResult = await query(`
      SELECT requester_id, status, title FROM ${TABLE_NAMES.PEER_REPAIR_REQUESTS}
      WHERE id = $1
    `, [id])

    if (requestResult.rows.length === 0) {
      return apiNotFound('Reparaturanfrage')
    }

    const requestData = requestResult.rows[0] as RequestOwnerRow & { title: string }

    // Cannot offer on own request
    if (requestData.requester_id === session.user.id) {
      return apiBadRequest('Sie können kein Angebot für Ihre eigene Anfrage abgeben')
    }

    // Only allow offers on open or in_discussion requests
    if (!['open', 'in_discussion'].includes(requestData.status)) {
      return apiBadRequest('Diese Anfrage akzeptiert keine neuen Angebote mehr')
    }

    // Check if user already made an offer
    const existingOfferResult = await query(`
      SELECT id FROM ${TABLE_NAMES.PEER_REPAIR_OFFERS}
      WHERE request_id = $1 AND helper_id = $2
    `, [id, session.user.id])

    if (existingOfferResult.rows.length > 0) {
      return apiBadRequest('Sie haben bereits ein Angebot für diese Anfrage abgegeben')
    }

    const body = await request.json()
    const {
      message,
      estimatedTime,
      proposedCompensation,
      relevantSkills = [],
    } = body

    // Validate required fields
    if (!message) {
      return apiBadRequest('Eine Nachricht ist erforderlich')
    }

    if (message.length < 20 || message.length > 2000) {
      return apiBadRequest('Nachricht muss zwischen 20 und 2000 Zeichen lang sein')
    }

    // Validate skills if provided
    const validSkillIds = getSkillIds()
    const invalidSkills = relevantSkills.filter((s: string) => !validSkillIds.includes(s))
    if (invalidSkills.length > 0) {
      return apiBadRequest(`Ungültige Skills: ${invalidSkills.join(', ')}`)
    }

    // Insert the offer
    const result = await query(`
      INSERT INTO ${TABLE_NAMES.PEER_REPAIR_OFFERS} (
        request_id,
        helper_id,
        message,
        estimated_time,
        proposed_compensation,
        relevant_skills
      ) VALUES (
        $1, $2, $3, $4, $5, $6
      )
      RETURNING id
    `, [
      id,
      session.user.id,
      message,
      estimatedTime || null,
      proposedCompensation || null,
      relevantSkills.length > 0 ? relevantSkills : null,
    ])

    const offerId = (result.rows[0] as { id: string }).id

    // Update request status to in_discussion if it was open
    if (requestData.status === 'open') {
      await query(`
        UPDATE ${TABLE_NAMES.PEER_REPAIR_REQUESTS}
        SET status = 'in_discussion'
        WHERE id = $1
      `, [id])
    }

    logger.info('Created peer repair offer', {
      offerId,
      requestId: id,
      helperId: session.user.id,
    })

    return apiSuccess({
      message: 'Angebot erfolgreich abgegeben',
      offerId,
    }, 201)
  } catch (error) {
    // Handle unique constraint violation
    if (error instanceof Error && error.message.includes('unique_offer_per_user_request')) {
      return apiBadRequest('Sie haben bereits ein Angebot für diese Anfrage abgegeben')
    }
    logger.error('Error creating offer', { error })
    return apiError(error, ERROR_MESSAGES.INTERNAL_SERVER_ERROR)
  }
}
