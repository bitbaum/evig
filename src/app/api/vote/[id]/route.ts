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
import { submitVote } from '@/lib/services/decisions'
import { TABLE_NAMES } from '@/config/database'
import { DECISION_STATUS } from '@/config/decisions'
import { logger } from '@/lib/logger'

type RouteParams = { params: Promise<{ id: string }> }

// ── GET: Public decision data ─────────────────────────────────────────────────

export async function GET(
  _request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id: decisionId } = await params

    const result = await query<{
      id: string
      title: string
      description: string
      background: string | null
      status: string
      voting_method: string
      options: unknown
      dot_count: number | null
      voting_deadline: string | null
    }>(
      `SELECT id, title, description, background, status, voting_method, options, dot_count, voting_deadline
       FROM ${TABLE_NAMES.DECISIONS}
       WHERE id = $1`,
      [decisionId]
    )

    if (result.rows.length === 0) {
      return NextResponse.json({ success: false, error: 'Entscheidung nicht gefunden' }, { status: 404 })
    }

    const d = result.rows[0]

    // Only expose decisions that are in voting phase (or discussion for transparency)
    if (!([DECISION_STATUS.VOTING, DECISION_STATUS.DISCUSSION] as string[]).includes(d.status)) {
      return NextResponse.json(
        { success: false, error: 'Diese Abstimmung ist nicht aktiv' },
        { status: 403 }
      )
    }

    const options = Array.isArray(d.options) ? d.options : (typeof d.options === 'string' ? JSON.parse(d.options) : [])

    return NextResponse.json({
      success: true,
      data: {
        id: d.id,
        title: d.title,
        description: d.description,
        background: d.background,
        status: d.status,
        votingMethod: d.voting_method,
        options,
        dotCount: d.dot_count,
        votingDeadline: d.voting_deadline,
      },
    })
  } catch (error) {
    logger.error('Public vote GET error', { error })
    return NextResponse.json({ success: false, error: 'Serverfehler' }, { status: 500 })
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
      return NextResponse.json({ success: false, error: 'E-Mail-Adresse erforderlich' }, { status: 400 })
    }
    if (!voteData) {
      return NextResponse.json({ success: false, error: 'Stimmdaten erforderlich' }, { status: 400 })
    }

    // Look up user by email
    const userResult = await query<{ id: string }>(
      `SELECT id FROM ${TABLE_NAMES.USERS} WHERE email = $1`,
      [email.toLowerCase().trim()]
    )

    if (userResult.rows.length === 0) {
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
      return NextResponse.json(
        { success: false, error: messages[result.error as string] || 'Fehler beim Abstimmen' },
        { status: 400 }
      )
    }

    logger.info('Public vote submitted', { decisionId, userId })
    return NextResponse.json({ success: true, data: result.vote })
  } catch (error) {
    logger.error('Public vote POST error', { error })
    return NextResponse.json({ success: false, error: 'Serverfehler' }, { status: 500 })
  }
}
