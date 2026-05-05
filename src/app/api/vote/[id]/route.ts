/**
 * Public Vote API
 *
 * GET  /api/vote/[id] - Fetch public decision info for voting (no auth required)
 * POST /api/vote/[id] - Submit a vote by email (no auth required)
 *
 * This endpoint is intentionally public so decisions can be shared via
 * link (email, phone, etc.) without requiring an admin account.
 * Voter identity: registered account if email matches, anonymous otherwise (when allow_public_voting=true).
 */

import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/auth/db'
import { submitVote, getPublicDecision } from '@/lib/services/decisions'
import { TABLE_NAMES } from '@/config/database'
import { logger } from '@/lib/logger'
import { apiSuccess, apiSuccessCached, apiError, apiBadRequest } from '@/lib/api/helpers'
import { ERROR_MESSAGES } from '@/config/error-messages'
import { rateLimiters, getClientIdentifier } from '@/lib/security/rate-limit'

type RouteParams = { params: Promise<{ id: string }> }

// ── GET: Public decision data ─────────────────────────────────────────────────

export async function GET(
  _request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id: decisionId } = await params

    const decision = await getPublicDecision(decisionId)

    if (!decision) {
      return NextResponse.json(
        { success: false, error: ERROR_MESSAGES.DECISION_NOT_ACTIVE },
        { status: 404 }
      )
    }

    return apiSuccessCached({
      id: decision.id,
      title: decision.title,
      description: decision.description,
      background: decision.background,
      status: decision.status,
      votingMethod: decision.votingMethod,
      options: decision.options,
      dotCount: decision.dotCount,
      votingDeadline: decision.votingDeadline,
      allowPublicVoting: decision.allowPublicVoting,
    }, 30)
  } catch (error) {
    return apiError(error, ERROR_MESSAGES.INTERNAL_SERVER_ERROR)
  }
}

// ── POST: Submit vote by email ────────────────────────────────────────────────

export async function POST(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id: decisionId } = await params

    if (!rateLimiters.voteSubmit(getClientIdentifier(request))) {
      return NextResponse.json({ success: false, error: ERROR_MESSAGES.RATE_LIMITED }, { status: 429 })
    }

    const body = await request.json()
    const { email, voteData } = body as { email?: string; voteData?: unknown }

    if (!email || typeof email !== 'string') {
      return apiBadRequest(ERROR_MESSAGES.EMAIL_REQUIRED)
    }
    if (!voteData) {
      return apiBadRequest(ERROR_MESSAGES.VOTE_DATA_REQUIRED)
    }

    const normalizedEmail = email.toLowerCase().trim()

    // Try to match to a registered account — anonymous fallback otherwise
    const userResult = await query<{ id: string }>(
      `SELECT id FROM ${TABLE_NAMES.USERS} WHERE email = $1`,
      [normalizedEmail]
    )

    const voterIdentity = userResult.rows.length > 0
      ? { userId: userResult.rows[0].id }
      : { voterEmail: normalizedEmail }

    // Delegate to submitVote — it enforces allow_public_voting for anonymous voters
    const result = await submitVote(decisionId, voterIdentity, voteData as Parameters<typeof submitVote>[2])

    if ('error' in result) {
      const messages: Record<string, string> = {
        not_found: ERROR_MESSAGES.DECISION_NOT_FOUND,
        not_voting_phase: ERROR_MESSAGES.VOTE_NOT_IN_VOTING_PHASE_PUBLIC,
        not_participant: ERROR_MESSAGES.VOTE_NOT_PUBLIC,
        invalid_data: ERROR_MESSAGES.VOTE_INVALID_DATA,
      }
      return apiBadRequest(messages[result.error as string] || ERROR_MESSAGES.VOTE_SUBMIT_FAILED)
    }

    logger.info('Public vote submitted', { decisionId, voterIdentity: 'voterEmail' in voterIdentity ? 'anonymous' : 'registered' })
    return apiSuccess(result.vote)
  } catch (error) {
    return apiError(error, ERROR_MESSAGES.INTERNAL_SERVER_ERROR)
  }
}
