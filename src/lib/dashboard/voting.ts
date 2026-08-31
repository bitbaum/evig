import { db } from '@/db';
import { sql, getTableName } from 'drizzle-orm';
import { decisions, decisionVotes, users } from '@/db/schema';
import { logger } from '@/lib/logger';
import { DECISION_STATUS, PARTICIPANT_SCOPE } from '@/config/decisions';

export interface PendingDecision {
  id: string;
  title: string;
  voting_deadline: string | null;
  votes_cast: number;
}

export async function getVotingData(
  userId: string,
  isSuper: boolean,
  isMember: boolean,
): Promise<PendingDecision[]> {
  const decisionsTable = getTableName(decisions);
  const votesTable = getTableName(decisionVotes);
  // users table imported to satisfy Drizzle's schema reference — not used in raw SQL
  void getTableName(users);

  try {
    // Find decisions in 'voting' status where this user is eligible and hasn't voted yet.
    // Scope resolution:
    //   all_staff   → any staff user (all admin users are staff)
    //   board_only  → super admin only
    //   all_members → users with is_member = true
    //   invited     → user ID appears in invited_participants JSON array
    const result = await db.execute(sql`
      SELECT
        d.id,
        d.title,
        d.voting_deadline,
        COUNT(dv.id)::int AS votes_cast
      FROM ${sql.raw(decisionsTable)} d
      LEFT JOIN ${sql.raw(votesTable)} dv ON dv.decision_id = d.id
      WHERE d.status = ${DECISION_STATUS.VOTING}
        AND NOT EXISTS (
          SELECT 1 FROM ${sql.raw(votesTable)} v2
          WHERE v2.decision_id = d.id AND v2.user_id = ${userId}
        )
        AND (
          d.participant_scope = ${PARTICIPANT_SCOPE.ALL_STAFF}
          OR (d.participant_scope = ${PARTICIPANT_SCOPE.BOARD_ONLY} AND ${isSuper})
          OR (d.participant_scope = ${PARTICIPANT_SCOPE.ALL_MEMBERS} AND ${isMember})
          OR (
            d.participant_scope = ${PARTICIPANT_SCOPE.INVITED}
            AND d.invited_participants::jsonb @> ${JSON.stringify([userId])}::jsonb
          )
        )
      GROUP BY d.id, d.title, d.voting_deadline
      ORDER BY d.voting_deadline ASC NULLS LAST
      LIMIT 3
    `);

    return result.rows as unknown as PendingDecision[];
  } catch (error) {
    logger.warn('VotingBanner query failed', { error, userId });
    return [];
  }
}
