import { NextRequest } from 'next/server'
import { auth } from '@/auth'
import { db } from '@/db'
import { itHilfeOffers, itHilfeRequests } from '@/db/schema'
import { eq, and } from 'drizzle-orm'
import { apiError, apiSuccess, apiUnauthorized, apiBadRequest, apiNotFound, apiForbidden } from '@/lib/api/helpers'
import { ERROR_MESSAGES } from '@/config/error-messages'
import { logger } from '@/lib/logger'
import { REQUEST_STATUS } from '@/config/it-hilfe'
import { rateLimiters } from '@/lib/security/rate-limit'
import { findOrCreateItHilfeConversation } from '@/lib/it-hilfe/conversation'

interface RouteParams {
  params: Promise<{ id: string }>
}

/**
 * POST /api/it-hilfe/requests/[id]/conversation
 *
 * Open (find-or-create) a pre-acceptance conversation so the requester and a
 * technician can align on scope BEFORE an offer is accepted:
 *   - Requester → an offerer: body { withUserId } must be someone who has an
 *     offer on this request.
 *   - Technician (non-owner) → the requester: only while the request is OPEN
 *     (ask a question before offering).
 * Returns { conversationId }. Rate-limited like messaging.
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth()
    if (!session?.user?.id) return apiUnauthorized(ERROR_MESSAGES.UNAUTHORIZED)
    const userId = session.user.id

    if (!rateLimiters.messageCreate(`${userId}:it-hilfe-conv`)) {
      return apiError(null, 'Zu viele Anfragen — bitte später erneut versuchen', 429)
    }

    const { id } = await params

    const [req] = await db
      .select({
        requesterId: itHilfeRequests.requesterId,
        title: itHilfeRequests.title,
        status: itHilfeRequests.status,
      })
      .from(itHilfeRequests)
      .where(eq(itHilfeRequests.id, id))
    if (!req) return apiNotFound('Anfrage')

    let technicianId: string
    if (req.requesterId === userId) {
      // Requester messaging an offerer — they must have an offer on this request.
      const body = await request.json().catch(() => ({}))
      const withUserId = typeof body?.withUserId === 'string' ? body.withUserId : ''
      if (!withUserId) return apiBadRequest('withUserId erforderlich')
      const [offer] = await db
        .select({ id: itHilfeOffers.id })
        .from(itHilfeOffers)
        .where(and(eq(itHilfeOffers.requestId, id), eq(itHilfeOffers.helperId, withUserId)))
      if (!offer) return apiForbidden('Kein Angebot von dieser Person')
      technicianId = withUserId
    } else {
      // A technician asking the requester a question — only on open requests.
      if (req.status !== REQUEST_STATUS.OPEN) return apiForbidden('Anfrage ist nicht mehr offen')
      technicianId = userId
    }

    const conversationId = await findOrCreateItHilfeConversation(db, {
      requestId: id,
      userA: req.requesterId,
      userB: technicianId,
      requestTitle: req.title,
    })

    return apiSuccess({ conversationId })
  } catch (error) {
    logger.error('Failed to open IT-Hilfe conversation', { error })
    return apiError(error, 'Konversation konnte nicht geöffnet werden')
  }
}
