/**
 * Decisions & Voting — Core CRUD, Transitions, Tally Computation
 */

import { db } from '@/db';
import { sql, getTableName } from 'drizzle-orm';
import { decisions, decisionVotes, decisionComments } from '@/db/schema/misc';
import { users } from '@/db/schema/auth';
import { logger } from '@/lib/logger';
import { notifyAllStaff, createNotification, fireNotification } from '@/lib/services/notifications';
import {
  VALID_TRANSITIONS,
  EDITABLE_STATUSES,
  DECISION_STATUS,
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

// Table name refs
const dTable = getTableName(decisions);
const dvTable = getTableName(decisionVotes);
const dcTable = getTableName(decisionComments);
const uTable = getTableName(users);

// ---- DB Row Interfaces ----

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

// ---- JSON Helpers ----

export function asArray<T>(value: unknown, fallback: T[]): T[] {
  if (Array.isArray(value)) return value as T[];
  return fallback;
}

export function asObject<T>(value: unknown, fallback: T): T {
  if (value && typeof value === 'object' && !Array.isArray(value)) return value as T;
  return fallback;
}

// ---- Decisions CRUD ----

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
  const result = await db.execute(sql`
    SELECT
      COUNT(*) FILTER (WHERE status = ${DECISION_STATUS.VOTING})                      AS voting,
      COUNT(*) FILTER (WHERE status = ${DECISION_STATUS.DISCUSSION})                  AS discussion,
      COUNT(*) FILTER (WHERE status = ${DECISION_STATUS.CLOSED})                      AS closed,
      COUNT(*) FILTER (
        WHERE status = ${DECISION_STATUS.VOTING}
        AND id NOT IN (
          SELECT decision_id FROM ${sql.raw(dvTable)} WHERE user_id = ${requestingUserId}
        )
      )                                                                                AS pending_votes
    FROM ${sql.raw(dTable)}
  `);

  const row = result.rows[0] as unknown as { voting: string; discussion: string; closed: string; pending_votes: string } | undefined;
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

  // Build dynamic WHERE conditions
  const conditions: ReturnType<typeof sql>[] = [];

  if (status) {
    conditions.push(sql`d.status = ${status}`);
  }
  if (decisionType) {
    conditions.push(sql`d.decision_type = ${decisionType}`);
  }
  if (createdBy) {
    conditions.push(sql`d.created_by = ${createdBy}`);
  }

  const whereClause = conditions.length > 0
    ? sql`WHERE ${conditions.reduce((acc, cond, i) => i === 0 ? cond : sql`${acc} AND ${cond}`, sql``)}`
    : sql``;

  const offset = (page - 1) * limit;

  // Main query with subqueries for counts
  const decisionsResult = await db.execute(sql`
    SELECT d.*,
           u.id AS creator_id, u.email AS creator_email, u.name AS creator_name,
           (SELECT COUNT(*) FROM ${sql.raw(dvTable)} dv WHERE dv.decision_id = d.id) AS vote_count,
           (SELECT COUNT(*) FROM ${sql.raw(dcTable)} dc WHERE dc.decision_id = d.id) AS comment_count
    FROM ${sql.raw(dTable)} d
    JOIN ${sql.raw(uTable)} u ON u.id = d.created_by
    ${whereClause}
    ORDER BY d.created_at DESC
    LIMIT ${limit} OFFSET ${offset}
  `);

  // Count query
  const countResult = await db.execute(sql`
    SELECT COUNT(*) AS count FROM ${sql.raw(dTable)} d ${whereClause}
  `);
  const total = parseInt((countResult.rows[0] as unknown as { count: string })?.count || '0', 10);

  // Check which decisions the requesting user has voted on
  const decisionIds = (decisionsResult.rows as unknown as DbDecisionRow[]).map(d => d.id);
  let votedSet = new Set<string>();
  if (decisionIds.length > 0) {
    const votedResult = await db.execute(sql`
      SELECT decision_id FROM ${sql.raw(dvTable)}
      WHERE user_id = ${requestingUserId} AND decision_id IN (${sql.join(decisionIds.map(id => sql`${id}`), sql`, `)})
    `);
    votedSet = new Set((votedResult.rows as unknown as Array<{ decision_id: string }>).map(v => v.decision_id));
  }

  return {
    decisions: (decisionsResult.rows as unknown as (DbDecisionRow & { vote_count: string; comment_count: string })[]).map(d => ({
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
  const result = await db.execute(sql`
    SELECT d.*,
           u.id AS creator_id, u.email AS creator_email, u.name AS creator_name,
           (SELECT COUNT(*) FROM ${sql.raw(dvTable)} dv WHERE dv.decision_id = d.id) AS vote_count,
           (SELECT COUNT(*) FROM ${sql.raw(dcTable)} dc WHERE dc.decision_id = d.id) AS comment_count
    FROM ${sql.raw(dTable)} d
    JOIN ${sql.raw(uTable)} u ON u.id = d.created_by
    WHERE d.id = ${id}
  `);

  if (result.rows.length === 0) return null;
  const d = result.rows[0] as unknown as DbDecisionRow & { vote_count: string; comment_count: string };

  // Check if user has voted
  const voteCheck = await db.execute(sql`
    SELECT id FROM ${sql.raw(dvTable)}
    WHERE decision_id = ${id} AND user_id = ${requestingUserId}
  `);

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

  const result = await db.execute(sql`
    WITH inserted AS (
      INSERT INTO ${sql.raw(dTable)}
        (title, description, decision_type, voting_method, options, quorum,
         blind_voting, dot_count, invited_participants, discussion_deadline,
         voting_deadline, status, created_by)
      VALUES (
        ${data.title},
        ${data.description},
        ${data.decisionType},
        ${data.votingMethod},
        ${JSON.stringify(options)}::jsonb,
        ${JSON.stringify(data.quorum || { type: 'percentage', value: 50 })}::jsonb,
        ${data.blindVoting ?? true},
        ${data.dotCount ?? null},
        ${JSON.stringify(data.invitedParticipants || [])}::jsonb,
        ${data.discussionDeadline ? new Date(data.discussionDeadline) : null},
        ${data.votingDeadline ? new Date(data.votingDeadline) : null},
        ${data.initialStatus || DECISION_STATUS.DRAFT},
        ${createdBy}
      )
      RETURNING *
    )
    SELECT i.id, i.title, i.status, i.created_at,
           u.email AS creator_email, u.name AS creator_name
    FROM inserted i
    JOIN ${sql.raw(uTable)} u ON u.id = i.created_by
  `);

  const row = result.rows[0] as unknown as { id: string; title: string; status: string; created_at: string; creator_email: string; creator_name: string | null };
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
  const existing = await db.execute(sql`
    SELECT id, status, created_by FROM ${sql.raw(dTable)} WHERE id = ${id}
  `);
  if (existing.rows.length === 0) return { error: 'not_found' as const };

  const decision = existing.rows[0] as unknown as { id: string; status: string; created_by: string };

  // Only creator can edit
  if (decision.created_by !== userId) {
    return { error: 'not_creator' as const };
  }

  // Allow outcomeSummary update on closed decisions
  if (data.outcomeSummary !== undefined && decision.status === DECISION_STATUS.CLOSED) {
    const updated = await db.execute(sql`
      UPDATE ${sql.raw(dTable)} SET outcome_summary = ${data.outcomeSummary} WHERE id = ${id} RETURNING *
    `);
    return { decision: updated.rows[0] as unknown as DbDecisionRow };
  }

  if (!(EDITABLE_STATUSES as readonly string[]).includes(decision.status)) {
    return { error: 'not_editable' as const };
  }

  // Build dynamic SET clauses
  const setClauses: ReturnType<typeof sql>[] = [];

  if (data.title !== undefined) {
    setClauses.push(sql`title = ${data.title}`);
  }
  if (data.description !== undefined) {
    setClauses.push(sql`description = ${data.description}`);
  }
  if (data.decisionType !== undefined) {
    setClauses.push(sql`decision_type = ${data.decisionType}`);
  }
  if (data.votingMethod !== undefined) {
    setClauses.push(sql`voting_method = ${data.votingMethod}`);
  }
  if (data.options !== undefined) {
    setClauses.push(sql`options = ${JSON.stringify(data.options)}::jsonb`);
  }
  if (data.quorum !== undefined) {
    setClauses.push(sql`quorum = ${JSON.stringify(data.quorum)}::jsonb`);
  }
  if (data.blindVoting !== undefined) {
    setClauses.push(sql`blind_voting = ${data.blindVoting}`);
  }
  if (data.dotCount !== undefined) {
    setClauses.push(sql`dot_count = ${data.dotCount}`);
  }
  if (data.invitedParticipants !== undefined) {
    setClauses.push(sql`invited_participants = ${JSON.stringify(data.invitedParticipants)}::jsonb`);
  }
  if (data.discussionDeadline !== undefined) {
    setClauses.push(sql`discussion_deadline = ${data.discussionDeadline ? new Date(data.discussionDeadline) : null}`);
  }
  if (data.votingDeadline !== undefined) {
    setClauses.push(sql`voting_deadline = ${data.votingDeadline ? new Date(data.votingDeadline) : null}`);
  }

  if (setClauses.length === 0) {
    return { decision: existing.rows[0] as unknown as DbDecisionRow };
  }

  // Join SET clauses with commas
  let setFragment = setClauses[0];
  for (let i = 1; i < setClauses.length; i++) {
    setFragment = sql`${setFragment}, ${setClauses[i]}`;
  }

  const updated = await db.execute(sql`
    UPDATE ${sql.raw(dTable)}
    SET ${setFragment}
    WHERE id = ${id}
    RETURNING *
  `);

  return { decision: updated.rows[0] as unknown as DbDecisionRow };
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
  const existing = await db.execute(sql`
    SELECT id, created_by FROM ${sql.raw(dTable)} WHERE id = ${decisionId}
  `);
  if (existing.rows.length === 0) return { error: 'not_found' };

  const row = existing.rows[0] as unknown as { id: string; created_by: string };
  if (row.created_by !== userId && !isSuperAdmin) {
    return { error: 'not_authorized' };
  }

  await db.transaction(async (tx) => {
    await tx.execute(sql`
      DELETE FROM ${sql.raw(dcTable)} WHERE decision_id = ${decisionId}
    `);
    await tx.execute(sql`
      DELETE FROM ${sql.raw(dvTable)} WHERE decision_id = ${decisionId}
    `);
    await tx.execute(sql`
      DELETE FROM ${sql.raw(dTable)} WHERE id = ${decisionId}
    `);
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
    default:
      return { method, totalVotes: votes.length };
  }
}
