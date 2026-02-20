/**
 * Decisions & Voting — Core CRUD, Transitions, Tally Computation
 */

import { query, transaction } from '@/lib/auth/db';
import { TABLE_NAMES } from '@/config/database';
import { logger } from '@/lib/logger';
import { notifyAllStaff, createNotification, fireNotification } from '@/lib/services/notifications';
import {
  VALID_TRANSITIONS,
  EDITABLE_STATUSES,
  type VotingMethod,
  type DecisionStatus,
} from '@/config/decisions';
import {
  type VoteData,
  type ConsentVoteInput,
  type ApprovalVoteInput,
  type DotVoteInput,
  type ScoreVoteInput,
  type SimpleMajorityVoteInput,
  type DecisionOption,
  type QuorumConfig,
} from '@/lib/schemas/decisions';

// ─── DB Row Interfaces ────────────────────────────────────────────────────

export interface DbDecisionRow {
  id: string;
  title: string;
  description: string;
  decision_type: string;
  voting_method: string;
  options: DecisionOption[];
  quorum: QuorumConfig;
  blind_voting: boolean;
  dot_count: number | null;
  invited_participants: string[];
  status: string;
  discussion_deadline: string | null;
  voting_deadline: string | null;
  outcome: Record<string, unknown> | null;
  outcome_summary: string | null;
  revealed_at: string | null;
  closed_at: string | null;
  closed_by: string | null;
  cancel_reason: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
  // Joined fields
  creator_id?: string;
  creator_email?: string;
  creator_name?: string | null;
  vote_count?: string;
  comment_count?: string;
  has_user_voted?: boolean;
}

// ─── JSON Helpers ─────────────────────────────────────────────────────────

export function asArray<T>(value: unknown, fallback: T[]): T[] {
  if (Array.isArray(value)) return value as T[];
  return fallback;
}

export function asObject<T>(value: unknown, fallback: T): T {
  if (value && typeof value === 'object' && !Array.isArray(value)) return value as T;
  return fallback;
}

// ─── Decisions CRUD ───────────────────────────────────────────────────────

interface DecisionFilters {
  status?: DecisionStatus;
  decisionType?: string;
  createdBy?: string;
  page?: number;
  limit?: number;
}

export interface DecisionStats {
  voting: number;
  discussion: number;
  closed: number;
  pendingVotes: number;
}

export async function getDecisionStats(requestingUserId: string): Promise<DecisionStats> {
  const result = await query<{
    voting: string;
    discussion: string;
    closed: string;
    pending_votes: string;
  }>(
    `SELECT
       COUNT(*) FILTER (WHERE status = 'voting')                                         AS voting,
       COUNT(*) FILTER (WHERE status = 'discussion')                                     AS discussion,
       COUNT(*) FILTER (WHERE status = 'closed')                                         AS closed,
       COUNT(*) FILTER (
         WHERE status = 'voting'
         AND id NOT IN (
           SELECT decision_id FROM ${TABLE_NAMES.DECISION_VOTES} WHERE user_id = $1
         )
       )                                                                                  AS pending_votes
     FROM ${TABLE_NAMES.DECISIONS}`,
    [requestingUserId]
  );

  const row = result.rows[0];
  return {
    voting: parseInt(row?.voting || '0', 10),
    discussion: parseInt(row?.discussion || '0', 10),
    closed: parseInt(row?.closed || '0', 10),
    pendingVotes: parseInt(row?.pending_votes || '0', 10),
  };
}

export async function getDecisions(
  filters: DecisionFilters,
  requestingUserId: string
) {
  const { status, decisionType, createdBy, page = 1, limit = 20 } = filters;

  // Build dynamic WHERE clauses
  const conditions: string[] = [];
  const params: unknown[] = [];
  let paramIndex = 1;

  if (status) {
    conditions.push(`d.status = $${paramIndex++}`);
    params.push(status);
  }
  if (decisionType) {
    conditions.push(`d.decision_type = $${paramIndex++}`);
    params.push(decisionType);
  }
  if (createdBy) {
    conditions.push(`d.created_by = $${paramIndex++}`);
    params.push(createdBy);
  }

  const whereClause = conditions.length > 0
    ? `WHERE ${conditions.join(' AND ')}`
    : '';

  const offset = (page - 1) * limit;

  // Main query with subqueries for counts
  const decisionsResult = await query<DbDecisionRow & { vote_count: string; comment_count: string }>(
    `SELECT d.*,
            u.id AS creator_id, u.email AS creator_email, u.name AS creator_name,
            (SELECT COUNT(*) FROM ${TABLE_NAMES.DECISION_VOTES} dv WHERE dv.decision_id = d.id) AS vote_count,
            (SELECT COUNT(*) FROM ${TABLE_NAMES.DECISION_COMMENTS} dc WHERE dc.decision_id = d.id) AS comment_count
     FROM ${TABLE_NAMES.DECISIONS} d
     JOIN ${TABLE_NAMES.USERS} u ON u.id = d.created_by
     ${whereClause}
     ORDER BY d.created_at DESC
     LIMIT $${paramIndex++} OFFSET $${paramIndex++}`,
    [...params, limit, offset]
  );

  // Count query
  const countResult = await query<{ count: string }>(
    `SELECT COUNT(*) AS count FROM ${TABLE_NAMES.DECISIONS} d ${whereClause}`,
    params
  );
  const total = parseInt(countResult.rows[0]?.count || '0', 10);

  // Check which decisions the requesting user has voted on
  const decisionIds = decisionsResult.rows.map(d => d.id);
  let votedSet = new Set<string>();
  if (decisionIds.length > 0) {
    const votedResult = await query<{ decision_id: string }>(
      `SELECT decision_id FROM ${TABLE_NAMES.DECISION_VOTES}
       WHERE user_id = $1 AND decision_id = ANY($2)`,
      [requestingUserId, decisionIds]
    );
    votedSet = new Set(votedResult.rows.map(v => v.decision_id));
  }

  return {
    decisions: decisionsResult.rows.map(d => ({
      id: d.id,
      title: d.title,
      description: d.description,
      decisionType: d.decision_type,
      votingMethod: d.voting_method,
      options: asArray<DecisionOption>(d.options, []),
      quorum: asObject<QuorumConfig>(d.quorum, { type: 'percentage', value: 50 }),
      blindVoting: d.blind_voting,
      dotCount: d.dot_count,
      invitedParticipants: asArray<string>(d.invited_participants, []),
      status: d.status,
      discussionDeadline: d.discussion_deadline,
      votingDeadline: d.voting_deadline,
      outcome: d.outcome,
      outcomeSummary: d.outcome_summary,
      cancelReason: d.cancel_reason,
      creator: { id: d.creator_id!, email: d.creator_email!, name: d.creator_name },
      createdAt: d.created_at,
      voteCount: parseInt(d.vote_count || '0', 10),
      commentCount: parseInt(d.comment_count || '0', 10),
      hasUserVoted: votedSet.has(d.id),
    })),
    total,
    page,
    limit,
  };
}

export async function getDecisionById(id: string, requestingUserId: string) {
  const result = await query<DbDecisionRow & { vote_count: string; comment_count: string }>(
    `SELECT d.*,
            u.id AS creator_id, u.email AS creator_email, u.name AS creator_name,
            (SELECT COUNT(*) FROM ${TABLE_NAMES.DECISION_VOTES} dv WHERE dv.decision_id = d.id) AS vote_count,
            (SELECT COUNT(*) FROM ${TABLE_NAMES.DECISION_COMMENTS} dc WHERE dc.decision_id = d.id) AS comment_count
     FROM ${TABLE_NAMES.DECISIONS} d
     JOIN ${TABLE_NAMES.USERS} u ON u.id = d.created_by
     WHERE d.id = $1`,
    [id]
  );

  if (result.rows.length === 0) return null;
  const d = result.rows[0];

  // Check if user has voted
  const voteCheck = await query<{ id: string }>(
    `SELECT id FROM ${TABLE_NAMES.DECISION_VOTES}
     WHERE decision_id = $1 AND user_id = $2`,
    [id, requestingUserId]
  );

  return {
    id: d.id,
    title: d.title,
    description: d.description,
    decisionType: d.decision_type,
    votingMethod: d.voting_method,
    options: asArray<DecisionOption>(d.options, []),
    quorum: asObject<QuorumConfig>(d.quorum, { type: 'percentage', value: 50 }),
    blindVoting: d.blind_voting,
    dotCount: d.dot_count,
    invitedParticipants: asArray<string>(d.invited_participants, []),
    status: d.status,
    discussionDeadline: d.discussion_deadline,
    votingDeadline: d.voting_deadline,
    outcome: d.outcome,
    outcomeSummary: d.outcome_summary,
    cancelReason: d.cancel_reason,
    revealedAt: d.revealed_at,
    closedAt: d.closed_at,
    closedBy: d.closed_by,
    creator: { id: d.creator_id!, email: d.creator_email!, name: d.creator_name },
    createdAt: d.created_at,
    voteCount: parseInt(d.vote_count || '0', 10),
    commentCount: parseInt(d.comment_count || '0', 10),
    hasUserVoted: voteCheck.rows.length > 0,
  };
}

interface CreateDecisionData {
  title: string;
  description: string;
  decisionType: string;
  votingMethod: string;
  options?: DecisionOption[];
  quorum?: QuorumConfig;
  blindVoting?: boolean;
  dotCount?: number | null;
  invitedParticipants?: string[];
  discussionDeadline?: string | null;
  votingDeadline?: string | null;
  initialStatus?: string;
}

export async function createDecision(
  data: CreateDecisionData,
  createdBy: string
) {
  // Generate IDs for options if not provided
  const options = (data.options || []).map((opt) => ({
    ...opt,
    id: opt.id || crypto.randomUUID(),
  }));

  const result = await query<{ id: string; title: string; status: string; created_at: string; creator_email: string; creator_name: string | null }>(
    `WITH inserted AS (
       INSERT INTO ${TABLE_NAMES.DECISIONS}
         (title, description, decision_type, voting_method, options, quorum,
          blind_voting, dot_count, invited_participants, discussion_deadline,
          voting_deadline, status, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
       RETURNING *
     )
     SELECT i.id, i.title, i.status, i.created_at,
            u.email AS creator_email, u.name AS creator_name
     FROM inserted i
     JOIN ${TABLE_NAMES.USERS} u ON u.id = i.created_by`,
    [
      data.title,
      data.description,
      data.decisionType,
      data.votingMethod,
      JSON.stringify(options),
      JSON.stringify(data.quorum || { type: 'percentage', value: 50 }),
      data.blindVoting ?? true,
      data.dotCount ?? null,
      JSON.stringify(data.invitedParticipants || []),
      data.discussionDeadline ? new Date(data.discussionDeadline) : null,
      data.votingDeadline ? new Date(data.votingDeadline) : null,
      data.initialStatus || 'draft',
      createdBy,
    ]
  );

  const row = result.rows[0];
  return {
    id: row.id,
    title: row.title,
    status: row.status,
    createdAt: row.created_at,
    creator: { id: createdBy, email: row.creator_email, name: row.creator_name },
  };
}

interface UpdateDecisionData {
  title?: string;
  description?: string;
  decisionType?: string;
  votingMethod?: string;
  options?: DecisionOption[];
  quorum?: QuorumConfig;
  blindVoting?: boolean;
  dotCount?: number | null;
  invitedParticipants?: string[];
  discussionDeadline?: string | null;
  votingDeadline?: string | null;
  outcomeSummary?: string | null;
}

export async function updateDecision(
  id: string,
  data: UpdateDecisionData,
  userId: string
) {
  // Fetch current decision
  const existing = await query<{ id: string; status: string; created_by: string }>(
    `SELECT id, status, created_by FROM ${TABLE_NAMES.DECISIONS} WHERE id = $1`,
    [id]
  );
  if (existing.rows.length === 0) return { error: 'not_found' as const };

  const decision = existing.rows[0];

  // Only creator can edit
  if (decision.created_by !== userId) {
    return { error: 'not_creator' as const };
  }

  // Allow outcomeSummary update on closed decisions
  if (data.outcomeSummary !== undefined && decision.status === 'closed') {
    const updated = await query<DbDecisionRow>(
      `UPDATE ${TABLE_NAMES.DECISIONS} SET outcome_summary = $1 WHERE id = $2 RETURNING *`,
      [data.outcomeSummary, id]
    );
    return { decision: updated.rows[0] };
  }

  if (!(EDITABLE_STATUSES as readonly string[]).includes(decision.status)) {
    return { error: 'not_editable' as const };
  }

  // Build dynamic SET clause
  const setClauses: string[] = [];
  const params: unknown[] = [];
  let paramIndex = 1;

  if (data.title !== undefined) {
    setClauses.push(`title = $${paramIndex++}`);
    params.push(data.title);
  }
  if (data.description !== undefined) {
    setClauses.push(`description = $${paramIndex++}`);
    params.push(data.description);
  }
  if (data.decisionType !== undefined) {
    setClauses.push(`decision_type = $${paramIndex++}`);
    params.push(data.decisionType);
  }
  if (data.votingMethod !== undefined) {
    setClauses.push(`voting_method = $${paramIndex++}`);
    params.push(data.votingMethod);
  }
  if (data.options !== undefined) {
    setClauses.push(`options = $${paramIndex++}`);
    params.push(JSON.stringify(data.options));
  }
  if (data.quorum !== undefined) {
    setClauses.push(`quorum = $${paramIndex++}`);
    params.push(JSON.stringify(data.quorum));
  }
  if (data.blindVoting !== undefined) {
    setClauses.push(`blind_voting = $${paramIndex++}`);
    params.push(data.blindVoting);
  }
  if (data.dotCount !== undefined) {
    setClauses.push(`dot_count = $${paramIndex++}`);
    params.push(data.dotCount);
  }
  if (data.invitedParticipants !== undefined) {
    setClauses.push(`invited_participants = $${paramIndex++}`);
    params.push(JSON.stringify(data.invitedParticipants));
  }
  if (data.discussionDeadline !== undefined) {
    setClauses.push(`discussion_deadline = $${paramIndex++}`);
    params.push(data.discussionDeadline ? new Date(data.discussionDeadline) : null);
  }
  if (data.votingDeadline !== undefined) {
    setClauses.push(`voting_deadline = $${paramIndex++}`);
    params.push(data.votingDeadline ? new Date(data.votingDeadline) : null);
  }

  if (setClauses.length === 0) {
    return { decision: existing.rows[0] };
  }

  params.push(id);
  const updated = await query<DbDecisionRow>(
    `UPDATE ${TABLE_NAMES.DECISIONS}
     SET ${setClauses.join(', ')}
     WHERE id = $${paramIndex}
     RETURNING *`,
    params
  );

  return { decision: updated.rows[0] };
}

/**
 * Delete a decision and all related records (cascade).
 * Only the creator or a super admin may delete.
 */
export async function deleteDecision(
  decisionId: string,
  userId: string,
  isSuperAdmin: boolean,
): Promise<{ deleted: true } | { error: 'not_found' | 'not_authorized' }> {
  const existing = await query<{ id: string; created_by: string }>(
    `SELECT id, created_by FROM ${TABLE_NAMES.DECISIONS} WHERE id = $1`,
    [decisionId]
  );
  if (existing.rows.length === 0) return { error: 'not_found' };

  if (existing.rows[0].created_by !== userId && !isSuperAdmin) {
    return { error: 'not_authorized' };
  }

  await transaction(async (client) => {
    await client.query(
      `DELETE FROM ${TABLE_NAMES.DECISION_COMMENTS} WHERE decision_id = $1`,
      [decisionId]
    );
    await client.query(
      `DELETE FROM ${TABLE_NAMES.DECISION_VOTES} WHERE decision_id = $1`,
      [decisionId]
    );
    await client.query(
      `DELETE FROM ${TABLE_NAMES.DECISIONS} WHERE id = $1`,
      [decisionId]
    );
  });

  logger.info('Decision deleted', { decisionId, userId });
  return { deleted: true };
}

export async function transitionDecision(
  id: string,
  newStatus: DecisionStatus,
  userId: string,
  extra?: { cancelReason?: string; outcomeSummary?: string }
) {
  const existing = await query<DbDecisionRow>(
    `SELECT * FROM ${TABLE_NAMES.DECISIONS} WHERE id = $1`,
    [id]
  );
  if (existing.rows.length === 0) return { error: 'not_found' as const };

  const decision = existing.rows[0];
  const currentStatus = decision.status as DecisionStatus;
  const validTargets = VALID_TRANSITIONS[currentStatus] || [];

  if (!validTargets.includes(newStatus)) {
    return { error: 'invalid_transition' as const };
  }

  const setClauses: string[] = ['status = $1'];
  const params: unknown[] = [newStatus];
  let paramIndex = 2;

  if (newStatus === 'cancelled') {
    setClauses.push(`cancel_reason = $${paramIndex++}`);
    params.push(extra?.cancelReason || null);
    setClauses.push(`closed_at = $${paramIndex++}`);
    params.push(new Date());
    setClauses.push(`closed_by = $${paramIndex++}`);
    params.push(userId);
  }

  if (newStatus === 'closed') {
    // Closing requires reading votes + computing tallies + updating atomically
    const result = await transaction(async (client) => {
      const votesResult = await client.query<{ vote_data: VoteData }>(
        `SELECT vote_data FROM ${TABLE_NAMES.DECISION_VOTES} WHERE decision_id = $1`,
        [id]
      );
      const options = asArray<DecisionOption>(decision.options, []);
      const tallies = computeTallies(
        decision.voting_method as VotingMethod,
        votesResult.rows.map(v => v.vote_data),
        options
      );

      setClauses.push(`outcome = $${paramIndex++}`);
      params.push(JSON.stringify(tallies));
      setClauses.push(`outcome_summary = $${paramIndex++}`);
      params.push(extra?.outcomeSummary || null);
      setClauses.push(`revealed_at = $${paramIndex++}`);
      params.push(new Date());
      setClauses.push(`closed_at = $${paramIndex++}`);
      params.push(new Date());
      setClauses.push(`closed_by = $${paramIndex++}`);
      params.push(userId);

      params.push(id);
      params.push(currentStatus);
      const updated = await client.query<DbDecisionRow>(
        `UPDATE ${TABLE_NAMES.DECISIONS}
         SET ${setClauses.join(', ')}
         WHERE id = $${paramIndex} AND status = $${paramIndex + 1}
         RETURNING *`,
        params
      );

      return updated.rows[0] || null;
    });

    if (!result) {
      return { error: 'invalid_transition' as const };
    }

    // Notify the creator when decision closes
    fireNotification(
      () => createNotification(result.created_by, {
        type: 'decision_closed',
        title: 'Entscheidung abgeschlossen',
        content: `"${result.title}" wurde abgeschlossen.`,
        related_type: 'decision',
        related_id: result.id,
      }),
      `decision_closed:${result.id}`
    )

    return { decision: result };
  }

  params.push(id);
  const updated = await query<DbDecisionRow>(
    `UPDATE ${TABLE_NAMES.DECISIONS}
     SET ${setClauses.join(', ')}
     WHERE id = $${paramIndex}
     RETURNING *`,
    params
  );

  const updatedDecision = updated.rows[0];

  // Notify all staff when voting opens
  if (newStatus === 'voting' && updatedDecision) {
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

// ─── Tally Computation ────────────────────────────────────────────────────

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
    default:
      return { method, totalVotes: votes.length };
  }
}
