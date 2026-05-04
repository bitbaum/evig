/**
 * POST /api/decisions/[id]/send-invitations
 *
 * Re-sends the "voting opened" email to eligible participants who have not
 * yet cast a vote. Does NOT create duplicate in-app notifications — email only.
 */

import { NextRequest, NextResponse } from 'next/server';
import { withAdmin } from '@/lib/api/middleware';
import { apiSuccess, apiError, apiNotFound, apiForbidden } from '@/lib/api/helpers';
import { db } from '@/db';
import { decisions, decisionVotes, users, userProfiles } from '@/db/schema';
import { eq, inArray, sql, getTableName } from 'drizzle-orm';
import { logger } from '@/lib/logger';
import { sendCustomEmail } from '@/lib/email';
import { decisionVotingOpened } from '@/lib/email/templates/decisions';
import { resolveEligibleUserIds } from '@/lib/services/decisions-voting';
import { DECISION_STATUS, PARTICIPANT_SCOPE_DEFAULT } from '@/config/decisions';
import { asArray } from '@/lib/services/decisions-crud';

const dTable = getTableName(decisions);
const dvTable = getTableName(decisionVotes);

export const POST = withAdmin<{ id: string }>(async (
  _request: NextRequest,
  _session,
  context
): Promise<NextResponse> => {
  try {
    const id = context?.params?.id;
    if (!id) return apiNotFound('Entscheidung');

    // Load decision
    const result = await db.execute(sql`
      SELECT id, title, status, voting_deadline,
             participant_scope, invited_participants, allow_public_voting
      FROM ${sql.raw(dTable)}
      WHERE id = ${id}
    `);
    if (result.rows.length === 0) return apiNotFound('Entscheidung');

    const decision = result.rows[0] as {
      id: string;
      title: string;
      status: string;
      voting_deadline: string | null;
      participant_scope: string | null;
      invited_participants: unknown;
      allow_public_voting: boolean;
    };

    // Only meaningful during active voting
    if (decision.status !== DECISION_STATUS.VOTING) {
      return apiForbidden('Einladungen können nur während der Abstimmungsphase gesendet werden');
    }

    // Resolve eligible voter IDs
    const scope = decision.participant_scope || PARTICIPANT_SCOPE_DEFAULT;
    const invited = asArray<string>(decision.invited_participants, []);
    const eligibleIds = await resolveEligibleUserIds(scope, invited);

    if (eligibleIds.length === 0) {
      return apiSuccess({ sent: 0, skipped: 0 });
    }

    // Find who has already voted
    const votedResult = await db.execute(sql`
      SELECT user_id FROM ${sql.raw(dvTable)}
      WHERE decision_id = ${id}
        AND user_id IS NOT NULL
    `);
    const voted = new Set(
      (votedResult.rows as { user_id: string }[]).map(r => r.user_id)
    );

    const nonVoterIds = eligibleIds.filter(uid => !voted.has(uid));
    if (nonVoterIds.length === 0) {
      return apiSuccess({ sent: 0, skipped: eligibleIds.length });
    }

    // Fetch email + notification preference for non-voters
    const userRows = await db
      .select({
        id: users.id,
        email: users.email,
        emailNotifications: userProfiles.emailNotifications,
      })
      .from(users)
      .leftJoin(userProfiles, eq(userProfiles.userId, users.id))
      .where(inArray(users.id, nonVoterIds));

    // Respect email_notifications preference (null = default true)
    const recipients = userRows.filter(
      r => r.email && r.emailNotifications !== false
    );

    if (recipients.length === 0) {
      return apiSuccess({ sent: 0, skipped: nonVoterIds.length });
    }

    const emailContent = decisionVotingOpened(
      decision.title,
      decision.voting_deadline ?? undefined,
      decision.id,
    );

    const results = await Promise.allSettled(
      recipients.map(r => sendCustomEmail(r.email!, emailContent))
    );

    let sent = 0;
    for (let i = 0; i < results.length; i++) {
      const settled = results[i];
      if (settled.status === 'fulfilled') {
        sent++;
      } else {
        logger.error('Failed to send invitation email', {
          userId: recipients[i].id,
          decisionId: id,
          error: settled.reason,
        });
      }
    }

    logger.info('Invitations sent', { decisionId: id, sent, total: recipients.length });

    return apiSuccess({
      sent,
      skipped: eligibleIds.length - nonVoterIds.length,
    });
  } catch (error) {
    return apiError(error, 'Fehler beim Senden der Einladungen');
  }
});
