/**
 * Decisions — State Transitions
 *
 * Handles status transitions (draft -> discussion -> voting -> closed/cancelled),
 * including tally computation on close and notifications on status change.
 */

import { db } from '@/db';
import { sql, getTableName } from 'drizzle-orm';
import { decisions, decisionVotes } from '@/db/schema/misc';
import { users } from '@/db/schema/auth';
import { notifyAllStaff, createNotification, fireNotification } from '@/lib/services/notifications';
import {
  VALID_TRANSITIONS,
  DECISION_STATUS,
  type VotingMethod,
  type DecisionStatus,
} from '@/config/decisions';
import {
  type VoteData,
  type DecisionOption,
} from '@/lib/schemas/decisions';
import { type DbDecisionRow, asArray } from './decisions-crud';
import { computeTallies } from './decisions-voting';

// Table name refs
const dTable = getTableName(decisions);
const dvTable = getTableName(decisionVotes);
const uTable = getTableName(users);

export async function transitionDecision(
  id: string,
  newStatus: DecisionStatus,
  userId: string,
  extra?: { cancelReason?: string; outcomeSummary?: string }
) {
  const existing = await db.execute(sql`
    SELECT * FROM ${sql.raw(dTable)} WHERE id = ${id}
  `);
  if (existing.rows.length === 0) return { error: 'not_found' as const };

  const decision = existing.rows[0] as unknown as DbDecisionRow;
  const currentStatus = decision.status as DecisionStatus;
  const validTargets = VALID_TRANSITIONS[currentStatus] || [];

  if (!validTargets.includes(newStatus)) {
    return { error: 'invalid_transition' as const };
  }

  if (newStatus === DECISION_STATUS.CANCELLED) {
    const updated = await db.execute(sql`
      UPDATE ${sql.raw(dTable)}
      SET status = ${newStatus},
          cancel_reason = ${extra?.cancelReason || null},
          closed_at = ${new Date()},
          closed_by = ${userId}
      WHERE id = ${id}
      RETURNING *
    `);
    return { decision: updated.rows[0] as unknown as DbDecisionRow };
  }

  if (newStatus === DECISION_STATUS.CLOSED) {
    // Closing requires reading votes + computing tallies + updating atomically
    const txResult = await db.transaction(async (tx) => {
      const votesResult = await tx.execute(sql`
        SELECT vote_data FROM ${sql.raw(dvTable)} WHERE decision_id = ${id}
      `);
      const options = asArray<DecisionOption>(decision.options, []);
      const tallies = computeTallies(
        decision.voting_method as VotingMethod,
        (votesResult.rows as unknown as Array<{ vote_data: VoteData }>).map(v => v.vote_data),
        options
      );

      const updated = await tx.execute(sql`
        UPDATE ${sql.raw(dTable)}
        SET status = ${newStatus},
            outcome = ${JSON.stringify(tallies)}::jsonb,
            outcome_summary = ${extra?.outcomeSummary || null},
            revealed_at = ${new Date()},
            closed_at = ${new Date()},
            closed_by = ${userId}
        WHERE id = ${id} AND status = ${currentStatus}
        RETURNING *
      `);

      return (updated.rows[0] as unknown as DbDecisionRow) || null;
    });

    if (!txResult) {
      return { error: 'invalid_transition' as const };
    }

    // Notify the creator when decision closes
    fireNotification(
      () => createNotification(txResult.created_by, {
        type: 'decision_closed',
        title: 'Entscheidung abgeschlossen',
        content: `"${txResult.title}" wurde abgeschlossen.`,
        related_type: 'decision',
        related_id: txResult.id,
      }),
      `decision_closed:${txResult.id}`
    )

    return { decision: txResult };
  }

  // Default transition (e.g. draft -> discussion, discussion -> voting)
  const updated = await db.execute(sql`
    UPDATE ${sql.raw(dTable)}
    SET status = ${newStatus}
    WHERE id = ${id}
    RETURNING *
  `);

  const updatedDecision = updated.rows[0] as unknown as DbDecisionRow;

  // Notify all staff when voting opens
  if (newStatus === DECISION_STATUS.VOTING && updatedDecision) {
    fireNotification(
      () => notifyAllStaff(
        {
          type: 'decision_voting',
          title: 'Abstimmung geöffnet',
          content: `"${updatedDecision.title}" wartet auf deine Stimme.`,
          related_type: 'decision',
          related_id: updatedDecision.id,
        },
        userId, // don't notify the person who opened voting
      ),
      `decision_voting:${updatedDecision.id}`
    )
  }

  return { decision: updatedDecision };
}
