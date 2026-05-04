/**
 * Decisions — Public Read Access
 *
 * Minimal, auth-free data access for the /vote/[id] public voting page.
 * Admin CRUD lives in decisions-crud.ts.
 */

import { db } from '@/db';
import { sql, getTableName } from 'drizzle-orm';
import { decisions } from '@/db/schema/misc';
import { DECISION_STATUS, type VotingMethod } from '@/config/decisions';
import { type DecisionOption } from '@/lib/schemas/decisions';
import { asArray } from './decisions-crud';

const dTable = getTableName(decisions);

/** Voting option as stored — IDs are always set for persisted options. */
export interface PublicDecisionOption {
  id: string;
  label: string;
  description?: string;
  imageUrl?: string;
}

export interface PublicDecision {
  id: string;
  title: string;
  description: string;
  background: string | null;
  status: string;
  votingMethod: VotingMethod;
  options: PublicDecisionOption[];
  dotCount: number | null;
  votingDeadline: string | null;
  allowPublicVoting: boolean;
}

/**
 * Fetch the minimal public data needed for the /vote/[id] page.
 * Only returns decisions in VOTING or DISCUSSION status — returns null otherwise.
 * No auth required; exposes only non-sensitive fields.
 */
export async function getPublicDecision(id: string): Promise<PublicDecision | null> {
  const result = await db.execute(sql`
    SELECT id, title, description, background, status, voting_method, options, dot_count, voting_deadline, allow_public_voting
    FROM ${sql.raw(dTable)}
    WHERE id = ${id}
  `);

  if (result.rows.length === 0) return null;

  const d = result.rows[0] as unknown as {
    id: string;
    title: string;
    description: string;
    background: string | null;
    status: string;
    voting_method: string;
    options: unknown;
    dot_count: number | null;
    voting_deadline: string | null;
    allow_public_voting: boolean;
  };

  if (!([DECISION_STATUS.VOTING, DECISION_STATUS.DISCUSSION] as string[]).includes(d.status)) {
    return null;
  }

  const rawOptions = asArray<DecisionOption>(d.options, []);
  const options: PublicDecisionOption[] = rawOptions
    .filter((o): o is DecisionOption & { id: string } => typeof o.id === 'string')
    .map(o => ({ id: o.id, label: o.label, description: o.description, imageUrl: o.imageUrl }));

  return {
    id: d.id,
    title: d.title,
    description: d.description,
    background: d.background,
    status: d.status,
    votingMethod: d.voting_method as VotingMethod,
    options,
    dotCount: d.dot_count,
    votingDeadline: d.voting_deadline,
    allowPublicVoting: d.allow_public_voting ?? false,
  };
}
