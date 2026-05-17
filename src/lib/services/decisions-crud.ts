/**
 * Decisions — CRUD Operations
 *
 * Pure database operations for creating, reading, updating, and deleting decisions.
 * Also exports shared types and JSON helpers used by sibling modules.
 */

import { db } from '@/db';
import { sql, getTableName } from 'drizzle-orm';
import { decisions, decisionVotes, decisionComments } from '@/db/schema/misc';
import { users } from '@/db/schema/auth';
import { logger } from '@/lib/logger';
import {
  EDITABLE_STATUSES,
  DECISION_STATUS,
  PARTICIPANT_SCOPE_DEFAULT,
  DEFAULT_QUORUM,
  type DecisionStatus,
} from '@/config/decisions';
import {
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
  background: string | null;
  category: string | null;
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
  participant_scope: string;
  outcome: Record<string, unknown> | null;
  outcome_summary: string | null;
  ai_outcome_narrative: string | null;
  revealed_at: string | null;
  closed_at: string | null;
  closed_by: string | null;
  cancel_reason: string | null;
  allow_public_voting: boolean;
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

// ---- Row Mapper ----

function mapDecisionBase(d: DbDecisionRow & { vote_count: string; comment_count: string }) {
  return {
    id: d.id,
    title: d.title,
    description: d.description,
    background: d.background,
    category: d.category || 'operativ',
    decisionType: d.decision_type,
    votingMethod: d.voting_method,
    options: asArray<DecisionOption>(d.options, []),
    quorum: asObject<QuorumConfig>(d.quorum, DEFAULT_QUORUM),
    blindVoting: d.blind_voting,
    dotCount: d.dot_count,
    invitedParticipants: asArray<string>(d.invited_participants, []),
    status: d.status,
    discussionDeadline: d.discussion_deadline,
    votingDeadline: d.voting_deadline,
    outcome: d.outcome,
    outcomeSummary: d.outcome_summary,
    aiOutcomeNarrative: d.ai_outcome_narrative,
    cancelReason: d.cancel_reason,
    participantScope: d.participant_scope || PARTICIPANT_SCOPE_DEFAULT,
    creator: { id: d.creator_id!, email: d.creator_email!, name: d.creator_name },
    createdAt: d.created_at,
    voteCount: parseInt(d.vote_count || '0', 10),
    commentCount: parseInt(d.comment_count || '0', 10),
  };
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

  // Single query with COUNT(*) OVER() for pagination
  const decisionsResult = await db.execute(sql`
    SELECT d.*,
           u.id AS creator_id, u.email AS creator_email, u.name AS creator_name,
           COUNT(*) OVER() AS _total_count,
           (SELECT COUNT(*) FROM ${sql.raw(dvTable)} dv WHERE dv.decision_id = d.id) AS vote_count,
           (SELECT COUNT(*) FROM ${sql.raw(dcTable)} dc WHERE dc.decision_id = d.id) AS comment_count
    FROM ${sql.raw(dTable)} d
    JOIN ${sql.raw(uTable)} u ON u.id = d.created_by
    ${whereClause}
    ORDER BY d.created_at DESC
    LIMIT ${limit} OFFSET ${offset}
  `);

  const total = parseInt((decisionsResult.rows[0] as unknown as { _total_count: string })?._total_count || '0', 10);

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
      ...mapDecisionBase(d),
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
    ...mapDecisionBase(d),
    allowPublicVoting: d.allow_public_voting ?? false,
    revealedAt: d.revealed_at,
    closedAt: d.closed_at,
    closedBy: d.closed_by,
    hasUserVoted: voteCheck.rows.length > 0,
  };
}

interface CreateDecisionData {
  title: string;
  description: string;
  background?: string | null;
  category?: string;
  decisionType: string;
  votingMethod: string;
  options?: DecisionOption[];
  quorum?: QuorumConfig;
  blindVoting?: boolean;
  allowPublicVoting?: boolean;
  dotCount?: number | null;
  invitedParticipants?: string[];
  participantScope?: string;
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
        (title, description, background, category, decision_type, voting_method, options, quorum,
         blind_voting, allow_public_voting, dot_count, invited_participants, participant_scope,
         discussion_deadline, voting_deadline, status, created_by)
      VALUES (
        ${data.title},
        ${data.description},
        ${data.background ?? null},
        ${data.category || 'operativ'},
        ${data.decisionType},
        ${data.votingMethod},
        ${JSON.stringify(options)}::jsonb,
        ${JSON.stringify(data.quorum || { type: 'percentage', value: 50 })}::jsonb,
        ${data.blindVoting ?? true},
        ${data.allowPublicVoting ?? false},
        ${data.dotCount ?? null},
        ${JSON.stringify(data.invitedParticipants || [])}::jsonb,
        ${data.participantScope || PARTICIPANT_SCOPE_DEFAULT},
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

  const row = result.rows[0] as unknown as { id: string; title: string; status: string; created_at: string; creator_email: string; creator_name: string | null } | undefined;
  if (!row) {
    throw new Error('Decision insert returned no rows — check DB schema and migrations');
  }
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
  background?: string | null;
  category?: string;
  decisionType?: string;
  votingMethod?: string;
  options?: DecisionOption[];
  quorum?: QuorumConfig;
  blindVoting?: boolean;
  dotCount?: number | null;
  invitedParticipants?: string[];
  participantScope?: string;
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
  if (data.background !== undefined) {
    setClauses.push(sql`background = ${data.background}`);
  }
  if (data.category !== undefined) {
    setClauses.push(sql`category = ${data.category}`);
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
  if (data.participantScope !== undefined) {
    setClauses.push(sql`participant_scope = ${data.participantScope}`);
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

// Public vote page data access lives in decisions-public.ts
