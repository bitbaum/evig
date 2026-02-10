/**
 * Decisions & Voting Service Layer
 *
 * Rewritten from Prisma to raw SQL using revampit's query<T>() pattern.
 * All JSONB fields: pass as JSON.stringify() in params, receive as parsed objects from pg driver.
 * COUNT(*) returns string from pg — parse with parseInt().
 */

import { query } from '@/lib/auth/db';
import { TABLE_NAMES } from '@/config/database';
import { logger } from '@/lib/logger';
import {
  VALID_TRANSITIONS,
  type VotingMethod,
  type DecisionStatus,
} from '@/config/decisions';
import {
  consentVoteSchema,
  approvalVoteSchema,
  dotVoteSchema,
  scoreVoteSchema,
  simpleMajorityVoteSchema,
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

interface DbDecisionRow {
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

interface DbCommentRow {
  id: string;
  decision_id: string;
  user_id: string;
  content: string;
  position: string;
  option_id: string | null;
  parent_comment_id: string | null;
  is_edited: boolean;
  edited_at: string | null;
  created_at: string;
  user_email?: string;
  user_name?: string | null;
}

// ─── JSON Helpers ─────────────────────────────────────────────────────────

function asArray<T>(value: unknown, fallback: T[]): T[] {
  if (Array.isArray(value)) return value as T[];
  return fallback;
}

function asObject<T>(value: unknown, fallback: T): T {
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

  const editableStatuses = ['draft', 'discussion'];
  if (!editableStatuses.includes(decision.status)) {
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
    // Fetch votes for tally computation
    const votesResult = await query<{ vote_data: VoteData }>(
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

// ─── Comments ─────────────────────────────────────────────────────────────

export async function getComments(decisionId: string) {
  const result = await query<DbCommentRow>(
    `SELECT dc.*, u.email AS user_email, u.name AS user_name
     FROM ${TABLE_NAMES.DECISION_COMMENTS} dc
     JOIN ${TABLE_NAMES.USERS} u ON u.id = dc.user_id
     WHERE dc.decision_id = $1
     ORDER BY dc.created_at ASC`,
    [decisionId]
  );

  return result.rows.map(c => ({
    id: c.id,
    decision_id: c.decision_id,
    content: c.content,
    position: c.position,
    option_id: c.option_id,
    parent_comment_id: c.parent_comment_id,
    is_edited: c.is_edited,
    edited_at: c.edited_at,
    created_at: c.created_at,
    user: { id: c.user_id, email: c.user_email!, name: c.user_name },
  }));
}

export async function createComment(
  decisionId: string,
  userId: string,
  data: { content: string; position: string; optionId?: string | null; parentCommentId?: string | null }
) {
  // Verify decision exists and is commentable
  const existing = await query<{ id: string; status: string }>(
    `SELECT id, status FROM ${TABLE_NAMES.DECISIONS} WHERE id = $1`,
    [decisionId]
  );
  if (existing.rows.length === 0) return { error: 'not_found' as const };

  if (!['discussion', 'voting'].includes(existing.rows[0].status)) {
    return { error: 'not_commentable' as const };
  }

  const result = await query<DbCommentRow & { user_email: string; user_name: string | null }>(
    `WITH inserted AS (
       INSERT INTO ${TABLE_NAMES.DECISION_COMMENTS}
         (decision_id, user_id, content, position, option_id, parent_comment_id)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *
     )
     SELECT i.*, u.email AS user_email, u.name AS user_name
     FROM inserted i
     JOIN ${TABLE_NAMES.USERS} u ON u.id = i.user_id`,
    [decisionId, userId, data.content, data.position, data.optionId ?? null, data.parentCommentId ?? null]
  );

  const c = result.rows[0];
  return {
    comment: {
      ...c,
      user: { id: c.user_id, email: c.user_email, name: c.user_name },
    },
  };
}

export async function updateComment(
  commentId: string,
  userId: string,
  content: string
) {
  const existing = await query<{ id: string; user_id: string }>(
    `SELECT id, user_id FROM ${TABLE_NAMES.DECISION_COMMENTS} WHERE id = $1`,
    [commentId]
  );
  if (existing.rows.length === 0) return { error: 'not_found' as const };
  if (existing.rows[0].user_id !== userId) return { error: 'not_author' as const };

  const result = await query<DbCommentRow & { user_email: string; user_name: string | null }>(
    `UPDATE ${TABLE_NAMES.DECISION_COMMENTS}
     SET content = $1, is_edited = true, edited_at = now()
     WHERE id = $2
     RETURNING *,
       (SELECT email FROM ${TABLE_NAMES.USERS} WHERE id = user_id) AS user_email,
       (SELECT name FROM ${TABLE_NAMES.USERS} WHERE id = user_id) AS user_name`,
    [content, commentId]
  );

  const c = result.rows[0];
  return {
    comment: {
      ...c,
      user: { id: c.user_id, email: c.user_email, name: c.user_name },
    },
  };
}

export async function deleteComment(commentId: string, userId: string) {
  const existing = await query<{ id: string; user_id: string }>(
    `SELECT id, user_id FROM ${TABLE_NAMES.DECISION_COMMENTS} WHERE id = $1`,
    [commentId]
  );
  if (existing.rows.length === 0) return { error: 'not_found' as const };
  if (existing.rows[0].user_id !== userId) return { error: 'not_author' as const };

  await query(
    `DELETE FROM ${TABLE_NAMES.DECISION_COMMENTS} WHERE id = $1`,
    [commentId]
  );

  return { success: true };
}
