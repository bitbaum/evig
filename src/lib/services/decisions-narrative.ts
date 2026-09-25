/**
 * Decisions — AI Beschluss narrative, on request only.
 *
 * Deliberately NOT re-exported from the `decisions` barrel: that barrel is
 * imported by the close-decisions cron, and nothing a cron can reach may call
 * a model (the free-tier keys are spent only when a person asks — see
 * src/lib/ai/__tests__/no-background-ai.test.ts). The only caller is
 * POST /api/decisions/[id]/narrative, behind a staff click.
 */

import { db } from '@/db';
import { sql, getTableName } from 'drizzle-orm';
import { decisions } from '@/db/schema/misc';
import { DECISION_STATUS, PARTICIPANT_SCOPE_DEFAULT } from '@/config/decisions';
import { type DecisionOption } from '@/lib/schemas/decisions';
import { type DbDecisionRow, asArray } from './decisions-crud';
import { generateOutcomeNarrative } from '@/lib/ai/decisions-narrative';

const dTable = getTableName(decisions);

export async function writeOutcomeNarrative(
  id: string,
): Promise<{ narrative: string } | { error: 'not_found' | 'not_closed' | 'ai_unavailable' }> {
  const rows = await db.execute(sql`SELECT * FROM ${sql.raw(dTable)} WHERE id = ${id}`);
  const decision = rows.rows[0] as unknown as DbDecisionRow | undefined;
  if (!decision) return { error: 'not_found' };
  if (decision.status !== DECISION_STATUS.CLOSED) return { error: 'not_closed' };

  const narrative = await generateOutcomeNarrative({
    title: decision.title,
    description: decision.description,
    votingMethod: decision.voting_method,
    options: asArray<DecisionOption>(decision.options, []),
    outcome: (decision.outcome || {}) as Record<string, unknown>,
    outcomeSummary: decision.outcome_summary,
    participantScope: (decision.participant_scope as string) || PARTICIPANT_SCOPE_DEFAULT,
    category: decision.category || 'operativ',
  });
  if (!narrative) return { error: 'ai_unavailable' };

  await db.execute(sql`
    UPDATE ${sql.raw(dTable)} SET ai_outcome_narrative = ${narrative} WHERE id = ${id}
  `);
  return { narrative };
}
