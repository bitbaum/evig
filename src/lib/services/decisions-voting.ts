/**
 * Decisions — Voting & Tally Computation
 *
 * Vote validation, submission, retrieval, participation status,
 * and tally computation for all voting methods.
 */

import { db } from '@/db';
import { sql, getTableName } from 'drizzle-orm';
import { decisions, decisionVotes } from '@/db/schema/misc';
import { users } from '@/db/schema/auth';
import {
  type VotingMethod,
} from '@/config/decisions';
import {
  consentVoteSchema,
  approvalVoteSchema,
  dotVoteSchema,
  scoreVoteSchema,
  simpleMajorityVoteSchema,
  rankedChoiceVoteSchema,
  type VoteData,
  type ConsentVoteInput,
  type ApprovalVoteInput,
  type DotVoteInput,
  type ScoreVoteInput,
  type SimpleMajorityVoteInput,
  type RankedChoiceVoteInput,
  type DecisionOption,
  type QuorumConfig,
} from '@/lib/schemas/decisions';
import { type DbDecisionRow, asArray, asObject } from './decisions-crud';

// Table name refs
const dTable = getTableName(decisions);
const dvTable = getTableName(decisionVotes);
const uTable = getTableName(users);

// ---- DB Row Interface ----

interface DbVoteRow {
  id: string;
  decision_id: string;
  user_id: string;
  vote_data: VoteData;
  created_at: string;
  updated_at: string;
  user_email?: string;
  user_name?: string | null;
}

// ---- Eligible Participant Resolution ----

/**
 * Resolves the list of eligible voter IDs based on participant_scope.
 * - all_staff:   users with is_staff = true
 * - board_only:  staff with 'vorstand' in staff_permissions
 * - all_members: users with is_member = true
 * - invited:     the explicit invited_participants list
 */
async function resolveEligibleUserIds(
  participantScope: string,
  invitedParticipants: string[]
): Promise<string[]> {
  switch (participantScope) {
    case 'board_only': {
      const result = await db.execute(sql`
        SELECT id FROM ${sql.raw(uTable)}
        WHERE is_staff = true AND staff_permissions @> ARRAY['vorstand']::text[]
      `);
      return (result.rows as unknown as { id: string }[]).map(r => r.id);
    }
    case 'all_members': {
      const result = await db.execute(sql`
        SELECT id FROM ${sql.raw(uTable)} WHERE is_member = true
      `);
      return (result.rows as unknown as { id: string }[]).map(r => r.id);
    }
    case 'invited':
      return invitedParticipants;
    default: // 'all_staff'
      {
        const result = await db.execute(sql`
          SELECT id FROM ${sql.raw(uTable)} WHERE is_staff = true
        `);
        return (result.rows as unknown as { id: string }[]).map(r => r.id);
      }
  }
}

// ---- Voting ----

export function validateVoteData(
  method: VotingMethod,
  data: unknown,
  decision: { options: unknown; dot_count: number | null }
): { success: true; data: VoteData } | { success: false; error: string } {
  switch (method) {
    case 'consent': {
      const result = consentVoteSchema.safeParse(data);
      if (!result.success)
        return { success: false, error: result.error.issues[0]?.message || 'Ungültig' };
      return { success: true, data: result.data };
    }
    case 'approval': {
      const result = approvalVoteSchema.safeParse(data);
      if (!result.success)
        return { success: false, error: result.error.issues[0]?.message || 'Ungültig' };
      const options = asArray<DecisionOption>(decision.options, []);
      const optionIds = new Set(options.map((o) => o.id));
      const invalid = result.data.approved_options.filter(
        (optId) => !optionIds.has(optId)
      );
      if (invalid.length > 0)
        return { success: false, error: 'Ungültige Option(en) ausgewählt' };
      return { success: true, data: result.data };
    }
    case 'dot': {
      const result = dotVoteSchema.safeParse(data);
      if (!result.success)
        return { success: false, error: result.error.issues[0]?.message || 'Ungültig' };
      const totalDots = Object.values(result.data.allocations).reduce(
        (sum, n) => sum + n,
        0
      );
      const maxDots = decision.dot_count || 5;
      if (totalDots > maxDots)
        return {
          success: false,
          error: `Maximal ${maxDots} Punkte erlaubt (${totalDots} vergeben)`,
        };
      return { success: true, data: result.data };
    }
    case 'score': {
      const result = scoreVoteSchema.safeParse(data);
      if (!result.success)
        return { success: false, error: result.error.issues[0]?.message || 'Ungültig' };
      return { success: true, data: result.data };
    }
    case 'simple_majority': {
      const result = simpleMajorityVoteSchema.safeParse(data);
      if (!result.success)
        return { success: false, error: result.error.issues[0]?.message || 'Ungültig' };
      return { success: true, data: result.data };
    }
    case 'ranked_choice': {
      const result = rankedChoiceVoteSchema.safeParse(data);
      if (!result.success)
        return { success: false, error: result.error.issues[0]?.message || 'Ungültig' };
      const options = asArray<DecisionOption>(decision.options, []);
      const optionIds = new Set(options.map((o) => o.id));
      const invalid = result.data.ranking.filter((id) => !optionIds.has(id));
      if (invalid.length > 0)
        return { success: false, error: 'Ungültige Kandidaten in der Rangfolge' };
      return { success: true, data: result.data };
    }
    default:
      return { success: false, error: 'Unbekannte Abstimmungsmethode' };
  }
}

export async function submitVote(
  decisionId: string,
  userId: string,
  voteData: VoteData
) {
  const existing = await db.execute(sql`
    SELECT id, status, voting_method, options, dot_count, invited_participants, participant_scope
    FROM ${sql.raw(dTable)} WHERE id = ${decisionId}
  `);
  if (existing.rows.length === 0) return { error: 'not_found' as const };

  const decision = existing.rows[0] as unknown as DbDecisionRow;
  if (decision.status !== 'voting')
    return { error: 'not_voting_phase' as const };

  // Check participant eligibility via scope
  const participantScope = (decision.participant_scope as string) || 'all_staff';
  const invited = asArray<string>(decision.invited_participants, []);
  const eligibleIds = await resolveEligibleUserIds(participantScope, invited);
  if (!eligibleIds.includes(userId)) {
    return { error: 'not_participant' as const };
  }

  // Validate vote data
  const validation = validateVoteData(
    decision.voting_method as VotingMethod,
    voteData,
    decision
  );
  if (!validation.success) return { error: 'invalid_data' as const, message: validation.error };

  // Upsert vote (INSERT ... ON CONFLICT DO UPDATE)
  const voteResult = await db.execute(sql`
    INSERT INTO ${sql.raw(dvTable)} (decision_id, user_id, vote_data)
    VALUES (${decisionId}, ${userId}, ${JSON.stringify(validation.data)}::jsonb)
    ON CONFLICT (decision_id, user_id)
    DO UPDATE SET vote_data = ${JSON.stringify(validation.data)}::jsonb, updated_at = now()
    RETURNING *,
      (SELECT email FROM ${sql.raw(uTable)} WHERE id = ${userId}) AS user_email,
      (SELECT name FROM ${sql.raw(uTable)} WHERE id = ${userId}) AS user_name
  `);

  const vote = voteResult.rows[0] as unknown as DbVoteRow & { user_email: string; user_name: string | null };
  return {
    vote: {
      ...vote,
      user: { id: userId, email: vote.user_email, name: vote.user_name },
    },
  };
}

export async function getVotes(decisionId: string, requestingUserId: string) {
  const existing = await db.execute(sql`
    SELECT id, blind_voting, status FROM ${sql.raw(dTable)} WHERE id = ${decisionId}
  `);
  if (existing.rows.length === 0) return { error: 'not_found' as const };

  const decision = existing.rows[0] as unknown as { id: string; blind_voting: boolean; status: string };

  // Get user's own vote
  const userVoteResult = await db.execute(sql`
    SELECT dv.*, u.email AS user_email, u.name AS user_name
    FROM ${sql.raw(dvTable)} dv
    JOIN ${sql.raw(uTable)} u ON u.id = dv.user_id
    WHERE dv.decision_id = ${decisionId} AND dv.user_id = ${requestingUserId}
  `);
  const userVote = userVoteResult.rows.length > 0 ? userVoteResult.rows[0] as unknown as DbVoteRow : null;

  // Blind voting: only show all votes if blind=false, user has voted, or decision is closed
  const showAll = !decision.blind_voting || !!userVote || decision.status === 'closed';

  if (!showAll) {
    return {
      votes: [] as Array<DbVoteRow & { voteData: VoteData; user: { id: string; email: string; name: string | null } }>,
      blind: true,
    };
  }

  const allVotesResult = await db.execute(sql`
    SELECT dv.*, u.email AS user_email, u.name AS user_name
    FROM ${sql.raw(dvTable)} dv
    JOIN ${sql.raw(uTable)} u ON u.id = dv.user_id
    WHERE dv.decision_id = ${decisionId}
    ORDER BY dv.created_at ASC
  `);

  return {
    votes: (allVotesResult.rows as unknown as (DbVoteRow & { user_email: string; user_name: string | null })[]).map(v => ({
      ...v,
      voteData: v.vote_data,
      user: { id: v.user_id, email: v.user_email, name: v.user_name },
    })),
    blind: false,
  };
}

export async function getParticipationStatus(decisionId: string) {
  const existing = await db.execute(sql`
    SELECT id, invited_participants, participant_scope, quorum FROM ${sql.raw(dTable)} WHERE id = ${decisionId}
  `);
  if (existing.rows.length === 0) return null;

  const decision = existing.rows[0] as unknown as {
    id: string;
    invited_participants: string[];
    participant_scope: string;
    quorum: QuorumConfig;
  };
  const invited = asArray<string>(decision.invited_participants, []);
  const participantScope = (decision.participant_scope as string) || 'all_staff';

  // Get eligible participant IDs via scope
  const eligibleIds = await resolveEligibleUserIds(participantScope, invited);

  // Fetch user details for eligible participants
  let eligibleUsers: { id: string; email: string }[] = [];
  if (eligibleIds.length > 0) {
    const result = await db.execute(sql`
      SELECT id, email FROM ${sql.raw(uTable)}
      WHERE id IN (${sql.join(eligibleIds.map(id => sql`${id}`), sql`, `)})
    `);
    eligibleUsers = result.rows as unknown as { id: string; email: string }[];
  }

  // Get who voted
  const votedResult = await db.execute(sql`
    SELECT user_id FROM ${sql.raw(dvTable)} WHERE decision_id = ${decisionId}
  `);
  const votedIds = new Set((votedResult.rows as unknown as Array<{ user_id: string }>).map(v => v.user_id));

  const voted = eligibleUsers.filter(u => votedIds.has(u.id));
  const notVoted = eligibleUsers.filter(u => !votedIds.has(u.id));

  const quorum = asObject<QuorumConfig>(decision.quorum, { type: 'percentage', value: 50 });
  const quorumTarget =
    quorum.type === 'percentage'
      ? Math.ceil((quorum.value / 100) * eligibleUsers.length)
      : quorum.value;

  return {
    total: eligibleUsers.length,
    voted,
    notVoted,
    quorumTarget,
    quorumMet: voted.length >= quorumTarget,
    progressPercent:
      eligibleUsers.length > 0
        ? Math.round((voted.length / eligibleUsers.length) * 100)
        : 0,
  };
}

// ---- Tally Computation ----

export function computeTallies(
  method: VotingMethod,
  votes: VoteData[],
  options: DecisionOption[]
) {
  switch (method) {
    case 'consent': {
      const counts = { agree: 0, abstain: 0, disagree: 0, block: 0 };
      const blocks: { rationale?: string }[] = [];
      for (const vote of votes) {
        const v = vote as ConsentVoteInput;
        if (v.response in counts) counts[v.response as keyof typeof counts]++;
        if (v.response === 'block') blocks.push({ rationale: v.rationale });
      }
      return {
        method: 'consent',
        counts,
        blocks,
        passed: counts.block === 0,
        totalVotes: votes.length,
      };
    }
    case 'approval': {
      const optionCounts: Record<string, number> = {};
      for (const opt of options) optionCounts[opt.id!] = 0;
      for (const vote of votes) {
        const v = vote as ApprovalVoteInput;
        for (const optId of v.approved_options) {
          optionCounts[optId] = (optionCounts[optId] || 0) + 1;
        }
      }
      const ranked = options
        .map((o) => ({ ...o, votes: optionCounts[o.id!] || 0 }))
        .sort((a, b) => b.votes - a.votes);
      return {
        method: 'approval',
        optionCounts,
        ranked,
        winner: ranked[0] || null,
        totalVotes: votes.length,
      };
    }
    case 'dot': {
      const optionDots: Record<string, number> = {};
      for (const opt of options) optionDots[opt.id!] = 0;
      for (const vote of votes) {
        const v = vote as DotVoteInput;
        for (const [optId, count] of Object.entries(v.allocations)) {
          optionDots[optId] = (optionDots[optId] || 0) + count;
        }
      }
      const ranked = options
        .map((o) => ({ ...o, dots: optionDots[o.id!] || 0 }))
        .sort((a, b) => b.dots - a.dots);
      return {
        method: 'dot',
        optionDots,
        ranked,
        winner: ranked[0] || null,
        totalVotes: votes.length,
      };
    }
    case 'score': {
      const optionScores: Record<string, number[]> = {};
      for (const opt of options) optionScores[opt.id!] = [];
      for (const vote of votes) {
        const v = vote as ScoreVoteInput;
        for (const [optId, score] of Object.entries(v.scores)) {
          if (!optionScores[optId]) optionScores[optId] = [];
          optionScores[optId].push(score);
        }
      }
      const ranked = options
        .map((o) => {
          const scores = optionScores[o.id!] || [];
          const avg =
            scores.length > 0
              ? scores.reduce((a: number, b: number) => a + b, 0) / scores.length
              : 0;
          return { ...o, averageScore: Math.round(avg * 100) / 100, voteCount: scores.length };
        })
        .sort((a, b) => b.averageScore - a.averageScore);
      return {
        method: 'score',
        ranked,
        winner: ranked[0] || null,
        totalVotes: votes.length,
      };
    }
    case 'simple_majority': {
      const counts = { yes: 0, no: 0, abstain: 0 };
      for (const vote of votes) {
        const v = vote as SimpleMajorityVoteInput;
        if (v.response in counts) counts[v.response as keyof typeof counts]++;
      }
      return {
        method: 'simple_majority',
        counts,
        passed: counts.yes > counts.no,
        totalVotes: votes.length,
      };
    }
    case 'ranked_choice': {
      // Borda count: with N candidates, 1st choice gets N-1 pts, 2nd gets N-2, ..., last gets 0
      const N = options.length;
      const bordaPoints: Record<string, number> = {};
      for (const opt of options) bordaPoints[opt.id!] = 0;

      for (const vote of votes) {
        const v = vote as RankedChoiceVoteInput;
        v.ranking.forEach((optId, position) => {
          const points = N - 1 - position;
          if (optId in bordaPoints && points > 0) {
            bordaPoints[optId] += points;
          }
        });
      }

      const maxPossible = votes.length * (N - 1);
      const ranked = options
        .map(o => ({
          ...o,
          bordaPoints: bordaPoints[o.id!] ?? 0,
          scorePercent: maxPossible > 0
            ? Math.round(((bordaPoints[o.id!] ?? 0) / maxPossible) * 100)
            : 0,
        }))
        .sort((a, b) => b.bordaPoints - a.bordaPoints);

      return {
        method: 'ranked_choice',
        ranked,
        bordaPoints,
        winner: ranked[0] ?? null,
        totalVotes: votes.length,
        maxPossiblePoints: maxPossible,
      };
    }
    default:
      return { method, totalVotes: votes.length };
  }
}

// Export resolveEligibleUserIds so transitions.ts can reuse it
export { resolveEligibleUserIds };
