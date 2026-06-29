/**
 * Shared accept-offer logic for IT-Hilfe.
 *
 * Two routes call this: the original session-authenticated POST endpoint
 * at `/api/it-hilfe/requests/[id]/offers/[offerId]/accept`, and (incoming
 * in a follow-up commit) the token-driven endpoint that powers one-tap
 * email acceptance.
 *
 * The helper takes a pre-validated `acceptingUserId`:
 *   - `string` — session user; helper enforces it matches the request's
 *     `requesterId` and returns `not_authorized` otherwise.
 *   - `null` — caller has already verified authorization out-of-band
 *     (e.g. via a signed token bound to this offerId). Helper skips the
 *     identity check.
 *
 * State changes are wrapped in a single transaction. Notification
 * fan-out (in-app + email) is fire-and-forget after the transaction
 * commits — never throws into the caller.
 */

import { db } from '@/db'
import { sql, eq, and, ne, getTableName } from 'drizzle-orm'
import { itHilfeRequests, itHilfeOffers } from '@/db/schema/itHilfe'
import { users } from '@/db/schema/auth'
import { logger } from '@/lib/logger'
import { REQUEST_STATUS, OFFER_STATUS } from '@/config/it-hilfe'
import { NOTIFICATION_TYPES, RELATED_TYPES } from '@/config/notifications'
import { notifyUsers } from '@/lib/services/notifications'
import { findOrCreateItHilfeConversation } from './conversation'
import { APP_URL } from '@/config/urls'

export type AcceptOfferReason =
  | 'request_not_found'
  | 'offer_not_found'
  | 'not_authorized'
  | 'request_not_open'
  | 'offer_not_pending'

export type AcceptOfferResult =
  | { ok: true; requestId: string; offerId: string; helperId: string }
  | { ok: false; reason: AcceptOfferReason }

interface RequestRow {
  requester_id: string
  requester_name: string | null
  status: string
  title: string
}

interface OfferRow {
  id: string
  helper_id: string
  helper_name: string | null
  helper_email: string
  status: string
}

const reqTable = getTableName(itHilfeRequests)
const offTable = getTableName(itHilfeOffers)
const uTable = getTableName(users)

/**
 * Resolve an offer's parent requestId. Returns null if the offer doesn't
 * exist. Used by the token-driven accept route, where the signed token
 * only encodes the offerId and the route needs the requestId to call
 * acceptOffer().
 */
export async function lookupOfferRequestId(offerId: string): Promise<string | null> {
  const result = await db.execute(sql`
    SELECT request_id FROM ${sql.raw(offTable)} WHERE id = ${offerId}
  `)
  if (result.rows.length === 0) return null
  return (result.rows[0] as unknown as { request_id: string }).request_id
}

/**
 * Accept an offer atomically. Fetches request + offer, validates state,
 * mutates inside a transaction, then triggers notifications (fire-and-forget).
 *
 * @param acceptingUserId user ID of the caller, OR null to skip the identity
 *   check (used by the token-driven route where authorization is established
 *   by signed-token possession, not session).
 */
export async function acceptOffer(params: {
  requestId: string
  offerId: string
  acceptingUserId: string | null
}): Promise<AcceptOfferResult> {
  const { requestId, offerId, acceptingUserId } = params

  const [requestResult, offerResult] = await Promise.all([
    db.execute(sql`
      SELECT r.requester_id, r.status, r.title, u.name as requester_name
      FROM ${sql.raw(reqTable)} r
      JOIN ${sql.raw(uTable)} u ON r.requester_id = u.id
      WHERE r.id = ${requestId}
    `),
    db.execute(sql`
      SELECT o.id, o.helper_id, o.status, u.name as helper_name, u.email as helper_email
      FROM ${sql.raw(offTable)} o
      JOIN ${sql.raw(uTable)} u ON o.helper_id = u.id
      WHERE o.id = ${offerId} AND o.request_id = ${requestId}
    `),
  ])

  if (requestResult.rows.length === 0) {
    return { ok: false, reason: 'request_not_found' }
  }
  const requestData = requestResult.rows[0] as unknown as RequestRow

  if (acceptingUserId !== null && requestData.requester_id !== acceptingUserId) {
    return { ok: false, reason: 'not_authorized' }
  }

  if (requestData.status !== REQUEST_STATUS.OPEN) {
    return { ok: false, reason: 'request_not_open' }
  }

  if (offerResult.rows.length === 0) {
    return { ok: false, reason: 'offer_not_found' }
  }
  const offerData = offerResult.rows[0] as unknown as OfferRow

  if (offerData.status !== OFFER_STATUS.PENDING) {
    return { ok: false, reason: 'offer_not_pending' }
  }

  // The pre-transaction SELECT above is a fast-fail check. Re-verify
  // request.status === OPEN and offer.status === PENDING INSIDE the
  // transaction with FOR UPDATE on the request row. Without this lock,
  // two concurrent acceptOffer calls on the SAME request (e.g. owner
  // accepts offer1 via the session-auth route + simultaneously accepts
  // offer2 via the one-tap-token email link) can both pass the outer
  // OPEN check, both run their transactions, and produce inconsistent
  // state: two ACCEPTED offers, request.matchedOfferId pointing at one
  // of them (last-write-wins), the other helper getting accepted+rejected
  // emails seconds apart. FOR UPDATE on the request serializes them;
  // the second transaction sees MATCHED and aborts cleanly. Returning
  // a sentinel so the outer function can map it to AcceptOfferResult.
  const raceFailed = await db.transaction(async (tx) => {
    const lockedReq = await tx.execute(sql`
      SELECT status FROM ${sql.raw(reqTable)}
      WHERE id = ${requestId}
      FOR UPDATE
    `)
    const lockedReqStatus = (lockedReq.rows[0] as { status?: string } | undefined)?.status
    if (lockedReqStatus !== REQUEST_STATUS.OPEN) return true

    // The request lock serializes all acceptances; an offer can't be
    // accepted concurrently because the surrounding request transaction
    // is queued. Still re-read the offer status — if a separate (non-
    // acceptance) path WITHDREW the offer between the outer SELECT and
    // this point, we should abort the same way.
    const lockedOff = await tx.execute(sql`
      SELECT status FROM ${sql.raw(offTable)}
      WHERE id = ${offerId}
    `)
    const lockedOffStatus = (lockedOff.rows[0] as { status?: string } | undefined)?.status
    if (lockedOffStatus !== OFFER_STATUS.PENDING) return true

    await tx.update(itHilfeOffers)
      .set({ status: OFFER_STATUS.ACCEPTED })
      .where(eq(itHilfeOffers.id, offerId))

    await tx.update(itHilfeOffers)
      .set({ status: OFFER_STATUS.REJECTED })
      .where(
        and(
          eq(itHilfeOffers.requestId, requestId),
          ne(itHilfeOffers.id, offerId),
          eq(itHilfeOffers.status, OFFER_STATUS.PENDING)
        )
      )

    await tx.update(itHilfeRequests)
      .set({ status: REQUEST_STATUS.MATCHED, matchedOfferId: offerId })
      .where(eq(itHilfeRequests.id, requestId))

    // Ensure the requester ↔ helper conversation exists (shared with the
    // pre-acceptance "ask a question" flow).
    await findOrCreateItHilfeConversation(tx, {
      requestId,
      userA: requestData.requester_id,
      userB: offerData.helper_id,
      requestTitle: requestData.title,
    })

    return false
  })

  if (raceFailed) {
    // Map to the most accurate reason. We can't distinguish here whether
    // the request was already matched vs the offer was withdrawn out-of-
    // band; surface the request-side reason since that's what the
    // typical race shape (concurrent accept) produces.
    return { ok: false, reason: 'request_not_open' }
  }

  logger.info('Accepted peer repair offer', {
    requestId,
    offerId,
    requesterId: requestData.requester_id,
    helperId: offerData.helper_id,
    acceptedViaSession: acceptingUserId !== null,
  })

  fireNotifications({
    requestId,
    offerId,
    requestTitle: requestData.title,
    requesterName: requestData.requester_name || 'Anfragender',
    acceptedHelper: {
      id: offerData.helper_id,
      name: offerData.helper_name || 'Techniker',
      email: offerData.helper_email,
    },
  })

  return { ok: true, requestId, offerId, helperId: offerData.helper_id }
}

/**
 * Fire-and-forget notification fan-out via the central notification service.
 * Single source of truth: notifyUsers handles in-app row + email dispatch
 * (template chosen by NOTIFICATION_TYPES.IT_HILFE_OFFER_* in
 * services/notifications.ts getEmailContent) + sent_email tracking +
 * email-preference checks. Errors are logged, never thrown.
 */
function fireNotifications(params: {
  requestId: string
  offerId: string
  requestTitle: string
  requesterName: string
  acceptedHelper: { id: string; name: string; email: string }
}) {
  const { requestId, offerId, requestTitle, requesterName, acceptedHelper } = params
  const requestUrl = `${APP_URL}/it-hilfe/${requestId}`

  // Accepted helper — single call: in-app row + rich HTML email
  notifyUsers([acceptedHelper.id], {
    type: NOTIFICATION_TYPES.IT_HILFE_OFFER_ACCEPTED,
    title: 'Dein Angebot wurde angenommen!',
    content: `Dein Angebot für "${requestTitle}" wurde angenommen. Eine Unterhaltung wurde erstellt.`,
    related_type: RELATED_TYPES.IT_HILFE,
    related_id: requestId,
    metadata: {
      helperName: acceptedHelper.name,
      requestTitle,
      requesterName,
      requestUrl,
    },
  }).catch(err => logger.error('Failed to send accept notification', { err, helperId: acceptedHelper.id }))

  // Rejected helpers — discover from DB, then single notifyUsers call
  db.execute(sql`
    SELECT o.helper_id
    FROM ${sql.raw(offTable)} o
    WHERE o.request_id = ${requestId} AND o.status = ${OFFER_STATUS.REJECTED} AND o.id != ${offerId}
  `).then(result => {
    const rejectedIds = (result.rows as unknown as { helper_id: string }[]).map(r => r.helper_id)
    if (rejectedIds.length > 0) {
      notifyUsers(rejectedIds, {
        type: NOTIFICATION_TYPES.IT_HILFE_OFFER_REJECTED,
        title: `Anfrage "${requestTitle}" vergeben`,
        content: 'Die Anfrage wurde an einen anderen Techniker vergeben. Danke für dein Angebot!',
        related_type: RELATED_TYPES.IT_HILFE,
        related_id: requestId,
        metadata: {
          helperName: 'Techniker',  // per-user names not fetched; template falls back
          requestTitle,
          requestUrl,
        },
      }).catch(err => logger.error('Failed to send reject notifications', { err }))
    }
  }).catch(err => logger.error('Failed to fetch rejected offers for notification', { err }))
}
