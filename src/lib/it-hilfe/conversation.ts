/**
 * Find-or-create the IT-Hilfe conversation between a requester and a technician,
 * scoped to a request. One conversation per {request, requester, technician}
 * triple — so a request can have several (the requester ↔ each interested
 * technician). Used both at offer-acceptance (inside its transaction) and by the
 * pre-acceptance "ask a question" flow, so the two parties can align on scope
 * before an offer is locked in.
 *
 * Uses raw SQL via `.execute` so it works with either the top-level `db` or a
 * transaction handle. Participant order is normalized (p1 < p2) to satisfy the
 * conversations CHECK constraint and make the lookup deterministic.
 */
import { sql, getTableName, type SQL } from 'drizzle-orm'
import { conversations } from '@/db/schema/messaging'
import { CONVERSATION_TYPES } from '@/config/database'

const CONV_TABLE = getTableName(conversations)

interface SqlExecutor {
  execute: (query: SQL) => Promise<{ rows: Array<Record<string, unknown>> }>
}

export async function findOrCreateItHilfeConversation(
  exec: SqlExecutor,
  params: { requestId: string; userA: string; userB: string; requestTitle: string },
): Promise<string> {
  const [p1, p2] = params.userA < params.userB
    ? [params.userA, params.userB]
    : [params.userB, params.userA]

  const existing = await exec.execute(sql`
    SELECT id FROM ${sql.raw(CONV_TABLE)}
    WHERE participant_1 = ${p1} AND participant_2 = ${p2}
      AND type = ${CONVERSATION_TYPES.IT_HILFE} AND context_id = ${params.requestId}
    LIMIT 1
  `)
  if (existing.rows.length > 0) return existing.rows[0].id as string

  const created = await exec.execute(sql`
    INSERT INTO ${sql.raw(CONV_TABLE)} (participant_1, participant_2, type, context_id, title)
    VALUES (${p1}, ${p2}, ${CONVERSATION_TYPES.IT_HILFE}, ${params.requestId}, ${`IT-Hilfe: ${params.requestTitle}`})
    RETURNING id
  `)
  return created.rows[0].id as string
}
