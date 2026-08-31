/**
 * Public Vote API
 *
 * GET  /api/vote/[id] - Fetch public decision info for voting (no auth required)
 * POST /api/vote/[id] - Submit a vote by email (no auth required)
 *
 * This endpoint is intentionally public so decisions can be shared via
 * link (email, phone, etc.) without requiring an admin account.
 *
 * Voter identity comes from the SESSION, never from the request body. A
 * signed-in member votes as themselves; everyone else votes anonymously by
 * email (only when allow_public_voting=true). An email in the body is an
 * unproven claim — see the POST handler.
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { query } from '@/lib/auth/db';
import type { ValidSession } from '@/lib/api/middleware';
import { getDbUserId } from '@/lib/api/task-helpers';
import { submitVote, getPublicDecision } from '@/lib/services/decisions';
import { TABLE_NAMES } from '@/config/database';
import { logger } from '@/lib/logger';
import { apiSuccess, apiSuccessCached, apiError, apiBadRequest } from '@/lib/api/helpers';
import { ERROR_CODES, ERROR_MESSAGES } from '@/config/error-messages';
import { rateLimiters, getClientIdentifier } from '@/lib/security/rate-limit';

type RouteParams = { params: Promise<{ id: string }> };

// ── GET: Public decision data ─────────────────────────────────────────────────

export async function GET(_request: NextRequest, { params }: RouteParams) {
  try {
    const { id: decisionId } = await params;

    const decision = await getPublicDecision(decisionId);

    if (!decision) {
      return NextResponse.json(
        { success: false, error: ERROR_MESSAGES.DECISION_NOT_ACTIVE },
        { status: 404 },
      );
    }

    return apiSuccessCached(
      {
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
      },
      30,
    );
  } catch (error) {
    return apiError(error, ERROR_MESSAGES.INTERNAL_SERVER_ERROR);
  }
}

// ── POST: Submit vote by email ────────────────────────────────────────────────

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: decisionId } = await params;

    if (!rateLimiters.voteSubmit(getClientIdentifier(request))) {
      return NextResponse.json(
        { success: false, error: ERROR_MESSAGES.RATE_LIMITED },
        { status: 429 },
      );
    }

    const body = await request.json();
    const { email, voteData } = body as { email?: string; voteData?: unknown };

    if (!voteData) {
      return apiBadRequest(ERROR_MESSAGES.VOTE_DATA_REQUIRED);
    }

    // Identity is proven by the session cookie, never asserted by the body.
    const session = await auth();
    let voterIdentity: { userId: string } | { voterEmail: string };

    if (session?.user?.email) {
      const userLookup = await getDbUserId(session as ValidSession);
      if ('error' in userLookup) return userLookup.error;
      voterIdentity = { userId: userLookup.dbUserId };
    } else {
      if (!email || typeof email !== 'string') {
        return apiBadRequest(ERROR_MESSAGES.EMAIL_REQUIRED);
      }

      const normalizedEmail = email.toLowerCase().trim();

      // A body-supplied email is an unproven claim, so it may only ever
      // identify an anonymous voter. If it belongs to a real account, casting
      // this ballot as that member would let anyone vote in their name — on a
      // private decision, over their existing vote. Make them prove it first.
      const registered = await query<{ id: string }>(
        `SELECT id FROM ${TABLE_NAMES.USERS} WHERE email = $1`,
        [normalizedEmail],
      );
      if (registered.rows.length > 0) {
        return apiBadRequest(
          ERROR_MESSAGES.VOTE_EMAIL_REGISTERED,
          undefined,
          ERROR_CODES.VOTE_EMAIL_REGISTERED,
        );
      }

      voterIdentity = { voterEmail: normalizedEmail };
    }

    // Delegate to submitVote — it enforces allow_public_voting for anonymous voters
    const result = await submitVote(
      decisionId,
      voterIdentity,
      voteData as Parameters<typeof submitVote>[2],
    );

    const isAnonymous = 'voterEmail' in voterIdentity;

    if ('error' in result) {
      const messages: Record<string, string> = {
        not_found: ERROR_MESSAGES.DECISION_NOT_FOUND,
        not_voting_phase: ERROR_MESSAGES.VOTE_NOT_IN_VOTING_PHASE_PUBLIC,
        // Same code, two different situations: an anonymous voter hit a
        // non-public decision ("sign in"), a signed-in one is outside the
        // participant scope ("you aren't invited") — telling the latter to
        // sign in would send them in a circle.
        not_participant: isAnonymous
          ? ERROR_MESSAGES.VOTE_NOT_PUBLIC
          : ERROR_MESSAGES.VOTE_NOT_PARTICIPANT,
        invalid_data: ERROR_MESSAGES.VOTE_INVALID_DATA,
      };
      return apiBadRequest(messages[result.error as string] || ERROR_MESSAGES.VOTE_SUBMIT_FAILED);
    }

    logger.info('Public vote submitted', {
      decisionId,
      voterIdentity: isAnonymous ? 'anonymous' : 'registered',
    });
    return apiSuccess(result.vote);
  } catch (error) {
    return apiError(error, ERROR_MESSAGES.INTERNAL_SERVER_ERROR);
  }
}
