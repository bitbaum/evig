/**
 * Public Vote API
 *
 * GET  /api/vote/[id] - Fetch public decision info for voting (no auth required)
 * POST /api/vote/[id] - Submit a vote by email (no auth required)
 *
 * This endpoint is intentionally public so decisions can be shared via
 * link (email, phone, etc.) without requiring an admin account.
 * Voter identity is established by email lookup → existing user account.
 */

import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/auth/db'
import { submitVote, getPublicDecision } from '@/lib/services/decisions'
import { TABLE_NAMES } from '@/config/database'
import { logger } from '@/lib/logger'
import { apiSuccess, apiError, apiBadRequest } from '@/lib/api/helpers'
import { ERROR_MESSAGES } from '@/config/error-messages'

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
      // Custom 404 message — null means either missing OR not in voting phase
      return NextResponse.json(
        { success: false, error: 'Entscheidung nicht gefunden oder nicht aktiv' },
        { status: 404 }
      )
    }

    return apiSuccess({
      id: decision.id,
      title: decision.title,
      description: decision.description,
      background: decision.background,
      status: decision.status,
      votingMethod: decision.votingMethod,
      options: decision.options,
      dotCount: decision.dotCount,
      votingDeadline: decision.votingDeadline,
    })
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
    const body = await request.json()
    const { email, voteData } = body as { email?: string; voteData?: unknown }

    if (!email || typeof email !== 'string') {
      return apiBadRequest('E-Mail-Adresse erforderlich')
    }
    if (!voteData) {
      return apiBadRequest('Stimmdaten erforderlich')
    }

    // Look up user by email
    const userResult = await query<{ id: string }>(
      `SELECT id FROM ${TABLE_NAMES.USERS} WHERE email = $1`,
      [email.toLowerCase().trim()]
    )

    if (userResult.rows.length === 0) {
      // Custom 404 with sign-in CTA
      return NextResponse.json(
        { success: false, error: 'Keine Benutzer:in mit dieser E-Mail-Adresse gefunden. Bitte melde dich erst an.' },
        { status: 404 }
      )
    }

    const userId = userResult.rows[0].id

    // Delegate to the standard submitVote service — it handles eligibility checks
    const result = await submitVote(decisionId, userId, voteData as Parameters<typeof submitVote>[2])

    if ('error' in result) {
      const messages: Record<string, string> = {
        not_found: 'Entscheidung nicht gefunden',
        not_voting_phase: 'Diese Abstimmung läuft gerade nicht',
        not_participant: 'Du bist nicht zur Abstimmung berechtigt',
        invalid_data: 'Ungültige Stimmdaten',
      }
      return apiBadRequest(messages[result.error as string] || 'Fehler beim Abstimmen')
    }

    logger.info('Public vote submitted', { decisionId, userId })
    return apiSuccess(result.vote)
  } catch (error) {
    return apiError(error, ERROR_MESSAGES.INTERNAL_SERVER_ERROR)
  }
}
