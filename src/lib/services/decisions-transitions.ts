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
import { notifyUsers, createNotification, fireNotification } from '@/lib/services/notifications';
import { RELATED_TYPES } from '@/config/notifications';
import {
  VALID_TRANSITIONS,
  DECISION_STATUS,
  PARTICIPANT_SCOPE_DEFAULT,
  type VotingMethod,
  type DecisionStatus,
} from '@/config/decisions';
import {
  type VoteData,
  type DecisionOption,
} from '@/lib/schemas/decisions';
import { type DbDecisionRow, asArray, asObject } from './decisions-crud';
import { computeTallies, resolveEligibleUserIds } from './decisions-voting';
import { generateOutcomeNarrative } from '@/lib/ai/decisions-narrative';

// Table name refs
const dTable = getTableName(decisions);
const dvTable = getTableName(decisionVotes);

// users table name for resolveEligibleUserIds (passed from voting.ts via import)
// We still need uTable for the narrative update
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
    // Enforce quorum before closing
    const quorumConfig = asObject<{ type: string; value: number }>(decision.quorum, { type: 'percentage', value: 50 });
    const invitedParticipants = asArray<string>(decision.invited_participants, []);
    const participantScope = (decision.participant_scope as string) || PARTICIPANT_SCOPE_DEFAULT;

    // Resolve eligible voters via scope
    const eligibleIds = await resolveEligibleUserIds(participantScope, invitedParticipants);
    const totalEligible = eligibleIds.length;

    const voteCountResult = await db.execute(sql`
      SELECT COUNT(*) AS cnt FROM ${sql.raw(dvTable)} WHERE decision_id = ${id}
    `);
    const actualVotes = parseInt((voteCountResult.rows[0] as unknown as { cnt: string }).cnt || '0', 10);

    // Calculate required votes based on quorum config
    const requiredVotes = quorumConfig.type === 'percentage'
      ? Math.ceil((quorumConfig.value / 100) * totalEligible)
      : quorumConfig.value;

    if (actualVotes < requiredVotes) {
      const pct = totalEligible > 0 ? Math.round((actualVotes / totalEligible) * 100) : 0;
      return {
        error: 'quorum_not_met' as const,
        message: `Quorum nicht erreicht. ${actualVotes} von ${requiredVotes} Stimmen benötigt (${pct}%).`,
      };
    }

    // Closing: read votes + compute tallies + update atomically
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
        related_type: RELATED_TYPES.DECISION,
        related_id: txResult.id,
        metadata: { decisionId: txResult.id },
      }),
      `decision_closed:${txResult.id}`
    );

    // Generate AI outcome narrative asynchronously (non-blocking)
    fireNotification(
      async () => {
        const options = asArray<DecisionOption>(txResult.options, []);
        const outcome = (txResult.outcome || {}) as Record<string, unknown>;
        const narrative = await generateOutcomeNarrative({
          title: txResult.title,
          description: txResult.description,
          votingMethod: txResult.voting_method,
          options,
          outcome,
          outcomeSummary: txResult.outcome_summary,
          participantScope: (txResult.participant_scope as string) || PARTICIPANT_SCOPE_DEFAULT,
          category: txResult.category || 'operativ',
        });
        if (narrative) {
          await db.execute(sql`
            UPDATE ${sql.raw(dTable)}
            SET ai_outcome_narrative = ${narrative}
            WHERE id = ${txResult.id}
          `);
        }
      },
      `decision_narrative:${txResult.id}`
    );

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

  // Notify eligible voters when voting opens (scope-aware)
  if (newStatus === DECISION_STATUS.VOTING && updatedDecision) {
    const invited = asArray<string>(updatedDecision.invited_participants, []);
    const scope = (updatedDecision.participant_scope as string) || PARTICIPANT_SCOPE_DEFAULT;
    const eligibleIds = await resolveEligibleUserIds(scope, invited);

    const deadlineInfo = updatedDecision.voting_deadline
      ? ` Frist: ${new Date(updatedDecision.voting_deadline).toLocaleDateString('de-CH', { day: '2-digit', month: '2-digit', year: 'numeric' })}`
      : '';

    fireNotification(
      () => notifyUsers(
        eligibleIds.filter(id => id !== userId),
        {
          type: 'decision_voting',
          title: 'Abstimmung geöffnet',
          content: `"${updatedDecision.title}" wartet auf deine Stimme.${deadlineInfo}`,
          related_type: RELATED_TYPES.DECISION,
          related_id: updatedDecision.id,
          metadata: {
            decisionId: updatedDecision.id,
            votingDeadline: updatedDecision.voting_deadline ?? '',
          },
        },
      ),
      `decision_voting:${updatedDecision.id}`
    );
  }

  // Suppress unused uTable import warning — used indirectly via resolveEligibleUserIds
  void uTable;

  return { decision: updatedDecision };
}
