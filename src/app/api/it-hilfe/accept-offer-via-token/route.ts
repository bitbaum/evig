import { NextRequest, NextResponse } from 'next/server'
import { apiError, apiSuccess, apiBadRequest, apiNotFound } from '@/lib/api/helpers'
import { ERROR_MESSAGES } from '@/config/error-messages'
import { logger } from '@/lib/logger'
import { verifyOfferAcceptToken } from '@/lib/it-hilfe/offer-accept-tokens'
import { acceptOffer, lookupOfferRequestId, type AcceptOfferReason } from '@/lib/it-hilfe/accept-offer'

/**
 * POST /api/it-hilfe/accept-offer-via-token
 * Body: { token: string }
 *
 * One-tap offer acceptance from an emailed link. The HMAC-signed token
 * is the proof of authorization — it encodes the offerId and was sent
 * to the request owner's verified email when the offer was created.
 *
 * The page route at /it-hilfe/accept (commit 2b-2) renders a single
 * "Confirm" button that POSTs to this endpoint, deliberately keeping
 * the state-mutating action behind a click to defeat email-prefetcher
 * pre-clicks.
 *
 * Returns the requestId on success so the page route can redirect to
 * /it-hilfe/<requestId>?accepted=1.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null)
    const token = body && typeof body.token === 'string' ? body.token : null
    if (!token) {
      return apiBadRequest('Token fehlt')
    }

    const verifyResult = verifyOfferAcceptToken(token)
    if (!verifyResult.ok) {
      return badRequestForVerifyReason(verifyResult.reason)
    }

    const { offerId } = verifyResult
    const requestId = await lookupOfferRequestId(offerId)
    if (!requestId) {
      return apiNotFound('Angebot')
    }

    const result = await acceptOffer({
      requestId,
      offerId,
      acceptingUserId: null, // token-driven; auth established by signature
    })

    if (!result.ok) {
      return badRequestForAcceptReason(result.reason)
    }

    logger.info('Accepted offer via token', { requestId, offerId, helperId: result.helperId })
    return apiSuccess({ requestId: result.requestId, helperId: result.helperId })
  } catch (error) {
    logger.error('Error accepting offer via token', { error })
    return apiError(error, ERROR_MESSAGES.INTERNAL_SERVER_ERROR)
  }
}

function badRequestForVerifyReason(reason: 'malformed' | 'expired' | 'invalid_signature'): NextResponse {
  // 410 Gone for expired; 400 for the rest. Lets the page route distinguish.
  const messages: Record<typeof reason, string> = {
    malformed: 'Token ungültig',
    expired: 'Dieser Link ist abgelaufen',
    invalid_signature: 'Token ungültig',
  }
  const status = reason === 'expired' ? 410 : 400
  return NextResponse.json(
    { success: false, error: messages[reason], reason },
    { status }
  )
}

function badRequestForAcceptReason(reason: AcceptOfferReason): NextResponse {
  // request_not_found / offer_not_found → 404
  // offer_not_pending / request_not_open → 409 Conflict (state-level failure)
  // not_authorized → 403 (should not happen on this route since acceptingUserId is null,
  //   but mapped defensively)
  switch (reason) {
    case 'request_not_found':
      return NextResponse.json(
        { success: false, error: 'Anfrage nicht gefunden', reason },
        { status: 404 }
      )
    case 'offer_not_found':
      return NextResponse.json(
        { success: false, error: 'Angebot nicht gefunden', reason },
        { status: 404 }
      )
    case 'not_authorized':
      return NextResponse.json(
        { success: false, error: 'Nicht berechtigt', reason },
        { status: 403 }
      )
    case 'request_not_open':
      return NextResponse.json(
        { success: false, error: 'Diese Anfrage kann keine Angebote mehr akzeptieren', reason },
        { status: 409 }
      )
    case 'offer_not_pending':
      return NextResponse.json(
        { success: false, error: 'Dieses Angebot wurde bereits bearbeitet', reason },
        { status: 409 }
      )
  }
}
