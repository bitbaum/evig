/**
 * Decisions & Voting — Vote Submission, Retrieval, Participation
 */

import { query } from '@/lib/auth/db';
import { TABLE_NAMES } from '@/config/database';
import {
  type VotingMethod,
} from '@/config/decisions';
import {
  consentVoteSchema,
  approvalVoteSchema,
  dotVoteSchema,
  scoreVoteSchema,
  simpleMajorityVoteSchema,
  type VoteData,
  type DecisionOption,
  type QuorumConfig,
} from '@/lib/schemas/decisions';
import { type DbDecisionRow, asArray, asObject } from './decisions-core';

// ─── DB Row Interface ─────────────────────────────────────────────────────

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

// ─── Voting ───────────────────────────────────────────────────────────────

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
    default:
      return { success: false, error: 'Unbekannte Abstimmungsmethode' };
  }
}

export async function submitVote(
  decisionId: string,
  userId: string,
  voteData: VoteData
) {
  const existing = await query<DbDecisionRow>(
    `SELECT id, status, voting_method, options, dot_count, invited_participants
     FROM ${TABLE_NAMES.DECISIONS} WHERE id = $1`,
    [decisionId]
  );
  if (existing.rows.length === 0) return { error: 'not_found' as const };

  const decision = existing.rows[0];
  if (decision.status !== 'voting')
    return { error: 'not_voting_phase' as const };

  // Check participant
  const invited = asArray<string>(decision.invited_participants, []);
  if (invited.length > 0 && !invited.includes(userId)) {
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
  const voteResult = await query<DbVoteRow & { user_email: string; user_name: string | null }>(
    `INSERT INTO ${TABLE_NAMES.DECISION_VOTES} (decision_id, user_id, vote_data)
     VALUES ($1, $2, $3)
     ON CONFLICT (decision_id, user_id)
     DO UPDATE SET vote_data = $3, updated_at = now()
     RETURNING *,
       (SELECT email FROM ${TABLE_NAMES.USERS} WHERE id = $2) AS user_email,
       (SELECT name FROM ${TABLE_NAMES.USERS} WHERE id = $2) AS user_name`,
    [decisionId, userId, JSON.stringify(validation.data)]
  );

  const vote = voteResult.rows[0];
  return {
    vote: {
      ...vote,
      user: { id: userId, email: vote.user_email, name: vote.user_name },
    },
  };
}

export async function getVotes(decisionId: string, requestingUserId: string) {
  const existing = await query<{ id: string; blind_voting: boolean; status: string }>(
    `SELECT id, blind_voting, status FROM ${TABLE_NAMES.DECISIONS} WHERE id = $1`,
    [decisionId]
  );
  if (existing.rows.length === 0) return { error: 'not_found' as const };

  const decision = existing.rows[0];

  // Get user's own vote
  const userVoteResult = await query<DbVoteRow & { user_email: string; user_name: string | null }>(
    `SELECT dv.*, u.email AS user_email, u.name AS user_name
     FROM ${TABLE_NAMES.DECISION_VOTES} dv
     JOIN ${TABLE_NAMES.USERS} u ON u.id = dv.user_id
     WHERE dv.decision_id = $1 AND dv.user_id = $2`,
    [decisionId, requestingUserId]
  );
  const userVote = userVoteResult.rows.length > 0 ? userVoteResult.rows[0] : null;

  // Blind voting: only show all votes if blind=false, user has voted, or decision is closed
  const showAll = !decision.blind_voting || !!userVote || decision.status === 'closed';

  if (!showAll) {
    // In this branch, userVote is always null (blind + not voted + not closed)
    return {
      votes: [] as Array<DbVoteRow & { voteData: VoteData; user: { id: string; email: string; name: string | null } }>,
      blind: true,
    };
  }

  const allVotesResult = await query<DbVoteRow & { user_email: string; user_name: string | null }>(
    `SELECT dv.*, u.email AS user_email, u.name AS user_name
     FROM ${TABLE_NAMES.DECISION_VOTES} dv
     JOIN ${TABLE_NAMES.USERS} u ON u.id = dv.user_id
     WHERE dv.decision_id = $1
     ORDER BY dv.created_at ASC`,
    [decisionId]
  );

  return {
    votes: allVotesResult.rows.map(v => ({
      ...v,
      voteData: v.vote_data,
      user: { id: v.user_id, email: v.user_email, name: v.user_name },
    })),
    blind: false,
  };
}

export async function getParticipationStatus(decisionId: string) {
  const existing = await query<{ id: string; invited_participants: string[]; quorum: QuorumConfig }>(
    `SELECT id, invited_participants, quorum FROM ${TABLE_NAMES.DECISIONS} WHERE id = $1`,
    [decisionId]
  );
  if (existing.rows.length === 0) return null;

  const decision = existing.rows[0];
  const invited = asArray<string>(decision.invited_participants, []);

  // Get eligible participants
  let eligibleUsers: { id: string; email: string }[];
  if (invited.length > 0) {
    const result = await query<{ id: string; email: string }>(
      `SELECT id, email FROM ${TABLE_NAMES.USERS} WHERE id = ANY($1)`,
      [invited]
    );
    eligibleUsers = result.rows;
  } else {
    // Default: all staff users
    const result = await query<{ id: string; email: string }>(
      `SELECT id, email FROM ${TABLE_NAMES.USERS} WHERE is_staff = true`,
      []
    );
    eligibleUsers = result.rows;
  }

  // Get who voted
  const votedResult = await query<{ user_id: string }>(
    `SELECT user_id FROM ${TABLE_NAMES.DECISION_VOTES} WHERE decision_id = $1`,
    [decisionId]
  );
  const votedIds = new Set(votedResult.rows.map(v => v.user_id));

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
