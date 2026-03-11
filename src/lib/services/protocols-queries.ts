/**
 * Meeting Protocols — CRUD & Query Operations
 */

import { db } from '@/db'
import { sql, getTableName } from 'drizzle-orm'
import { meetingProtocols, protocolActionLinks, protocolDecisionVotes, protocolDecisionOutcomes } from '@/db/schema/misc'
import { users } from '@/db/schema/auth'
import { PROTOCOL_STATUS } from '@/config/protocol-status'
import { notifyUsers, fireNotification } from '@/lib/services/notifications'
import { logger } from '@/lib/logger'
import type {
  ProtocolListItem,
  ProtocolDetail,
  CreateProtocolInput,
  UpdateProtocolInput,
} from '@/lib/schemas/protocols'

// Table name refs
const mpTable = getTableName(meetingProtocols)
const palTable = getTableName(protocolActionLinks)
const pdvTable = getTableName(protocolDecisionVotes)
const pdoTable = getTableName(protocolDecisionOutcomes)
const uTable = getTableName(users)

// =============================================================================
// QUERIES
// =============================================================================

interface ProtocolStats {
  total: number
  draft: number
  review: number
  finalized: number
}

/**
 * Get protocol stats with visibility filtering
 */
export async function getProtocolStats(
  userId: string,
  isSuperAdmin: boolean,
): Promise<ProtocolStats> {
  const result = await db.execute(sql`
    SELECT
      COUNT(*) as total,
      COUNT(*) FILTER (WHERE status = ${PROTOCOL_STATUS.DRAFT}) as draft,
      COUNT(*) FILTER (WHERE status = ${PROTOCOL_STATUS.REVIEW}) as review,
      COUNT(*) FILTER (WHERE status = ${PROTOCOL_STATUS.FINALIZED}) as finalized
    FROM ${sql.raw(mpTable)} mp
    WHERE (
      mp.visibility = 'team'
      OR mp.created_by = ${userId}
      OR mp.attendees @> to_jsonb(${userId}::text)
      OR ${isSuperAdmin} = true
    )
  `)

  const row = result.rows[0] as unknown as { total: string; draft: string; review: string; finalized: string } | undefined
  return {
    total: parseInt(row?.total || '0'),
    draft: parseInt(row?.draft || '0'),
    review: parseInt(row?.review || '0'),
    finalized: parseInt(row?.finalized || '0'),
  }
}

/**
 * Get team members for attendee mapping
 */
export async function getTeamMembers(): Promise<Array<{ id: string; name: string }>> {
  const result = await db.execute(sql`
    SELECT id, name FROM ${sql.raw(uTable)} WHERE name IS NOT NULL ORDER BY name
  `)
  return result.rows as unknown as Array<{ id: string; name: string }>
}

/**
 * List protocols with visibility filtering and pagination
 */
export async function getProtocols(
  userId: string,
  isSuperAdmin: boolean,
  filters?: { meeting_type?: string; status?: string; q?: string; page?: number; limit?: number }
): Promise<{ protocols: ProtocolListItem[]; total: number }> {
  const page = filters?.page ?? 1
  const limit = filters?.limit ?? 20
  const offset = (page - 1) * limit

  // Build dynamic filter conditions
  const conditions: ReturnType<typeof sql>[] = [
    sql`(
      mp.visibility = 'team'
      OR mp.created_by = ${userId}
      OR mp.attendees @> to_jsonb(${userId}::text)
      OR ${isSuperAdmin} = true
    )`
  ]

  if (filters?.meeting_type) {
    conditions.push(sql`mp.meeting_type = ${filters.meeting_type}`)
  }
  if (filters?.status) {
    conditions.push(sql`mp.status = ${filters.status}`)
  }
  if (filters?.q) {
    conditions.push(sql`mp.title ILIKE '%' || ${filters.q} || '%'`)
  }

  // Join conditions with AND
  let whereClause = conditions[0]
  for (let i = 1; i < conditions.length; i++) {
    whereClause = sql`${whereClause} AND ${conditions[i]}`
  }

  const [countResult, listResult] = await Promise.all([
    db.execute(sql`
      SELECT COUNT(*)::text as total
      FROM ${sql.raw(mpTable)} mp
      WHERE ${whereClause}
    `),
    db.execute(sql`
      SELECT
        mp.id,
        mp.title,
        mp.meeting_date,
        mp.meeting_type,
        mp.visibility,
        mp.attendees,
        mp.status,
        mp.created_at,
        u.name as created_by_name,
        (
          SELECT COUNT(*)::int
          FROM jsonb_array_elements(COALESCE(mp.structured_notes->'action_items', '[]'::jsonb)) ai
        ) as action_item_count,
        (
          SELECT COUNT(*)::int
          FROM jsonb_array_elements(COALESCE(mp.structured_notes->'action_items', '[]'::jsonb)) ai
          WHERE NOT EXISTS (
            SELECT 1
            FROM ${sql.raw(palTable)} pal
            WHERE pal.protocol_id = mp.id
              AND pal.action_item_id = ai->>'id'
          )
        ) as unlinked_action_item_count,
        (mp.structured_notes IS NOT NULL) as has_structured_notes
      FROM ${sql.raw(mpTable)} mp
      LEFT JOIN ${sql.raw(uTable)} u ON mp.created_by = u.id
      WHERE ${whereClause}
      ORDER BY mp.meeting_date DESC, mp.created_at DESC
      LIMIT ${limit} OFFSET ${offset}
    `),
  ])

  return {
    protocols: listResult.rows as unknown as ProtocolListItem[],
    total: parseInt((countResult.rows[0] as unknown as { total: string })?.total || '0', 10),
  }
}

/**
 * Get single protocol with visibility check
 */
export async function getProtocolById(
  id: string,
  userId: string,
  isSuperAdmin: boolean,
): Promise<ProtocolDetail | null> {
  const result = await db.execute(sql`
    SELECT
      mp.*,
      u.name as created_by_name,
      u.email as created_by_email
    FROM ${sql.raw(mpTable)} mp
    LEFT JOIN ${sql.raw(uTable)} u ON mp.created_by = u.id
    WHERE mp.id = ${id}
    AND (
      mp.visibility = 'team'
      OR mp.created_by = ${userId}
      OR mp.attendees @> to_jsonb(${userId}::text)
      OR ${isSuperAdmin} = true
    )
  `)
  return (result.rows[0] as unknown as ProtocolDetail) || null
}

// =============================================================================
// CRUD
// =============================================================================

/**
 * Create protocol in draft status
 */
export async function createProtocol(
  data: CreateProtocolInput,
  createdBy: string
): Promise<{ id: string }> {
  const result = await db.execute(sql`
    INSERT INTO ${sql.raw(mpTable)} (
      title, meeting_date, meeting_type, visibility, attendees, input_method, created_by
    ) VALUES (
      ${data.title},
      ${data.meeting_date},
      ${data.meeting_type},
      ${data.visibility},
      ${JSON.stringify(data.attendees || [])}::jsonb,
      ${data.input_method || 'transcript'},
      ${createdBy}
    )
    RETURNING id
  `)
  return result.rows[0] as unknown as { id: string }
}

/**
 * Update protocol (draft/review only)
 */
export async function updateProtocol(
  id: string,
  data: UpdateProtocolInput,
  userId: string,
): Promise<ProtocolDetail | null> {
  // Verify protocol exists and is editable
  const existing = await db.execute(sql`
    SELECT status, created_by FROM ${sql.raw(mpTable)} WHERE id = ${id}
  `)

  if (existing.rows.length === 0) return null

  const { status } = existing.rows[0] as unknown as { status: string; created_by: string }
  if (status !== PROTOCOL_STATUS.DRAFT && status !== PROTOCOL_STATUS.REVIEW) {
    throw new Error('PROTOCOL_NOT_EDITABLE')
  }

  // Build dynamic update
  const setClauses: ReturnType<typeof sql>[] = []

  if (data.title !== undefined) {
    setClauses.push(sql`title = ${data.title}`)
  }
  if (data.meeting_date !== undefined) {
    setClauses.push(sql`meeting_date = ${data.meeting_date}`)
  }
  if (data.meeting_type !== undefined) {
    setClauses.push(sql`meeting_type = ${data.meeting_type}`)
  }
  if (data.visibility !== undefined) {
    setClauses.push(sql`visibility = ${data.visibility}`)
  }
  if (data.attendees !== undefined) {
    setClauses.push(sql`attendees = ${JSON.stringify(data.attendees)}::jsonb`)
  }
  if (data.structured_notes !== undefined) {
    setClauses.push(sql`structured_notes = ${JSON.stringify(data.structured_notes)}::jsonb`)
  }

  if (setClauses.length === 0) return null

  // Join SET clauses with commas
  let setFragment = setClauses[0]
  for (let i = 1; i < setClauses.length; i++) {
    setFragment = sql`${setFragment}, ${setClauses[i]}`
  }

  const result = await db.execute(sql`
    UPDATE ${sql.raw(mpTable)}
    SET ${setFragment}
    WHERE id = ${id}
    RETURNING *
  `)

  return (result.rows[0] as unknown as ProtocolDetail) || null
}

// =============================================================================
// DELETE
// =============================================================================

/**
 * Delete a protocol and all related records (cascade).
 * Only the creator or a super admin may delete.
 */
export async function deleteProtocol(
  protocolId: string,
  userId: string,
  isSuperAdmin: boolean,
): Promise<{ deleted: true } | { error: 'not_found' | 'not_authorized' }> {
  const existing = await db.execute(sql`
    SELECT id, created_by FROM ${sql.raw(mpTable)} WHERE id = ${protocolId}
  `)

  if (existing.rows.length === 0) {
    return { error: 'not_found' }
  }

  const row = existing.rows[0] as unknown as { id: string; created_by: string }
  if (row.created_by !== userId && !isSuperAdmin) {
    return { error: 'not_authorized' }
  }

  await db.transaction(async (tx) => {
    await tx.execute(sql`
      DELETE FROM ${sql.raw(palTable)} WHERE protocol_id = ${protocolId}
    `)
    await tx.execute(sql`
      DELETE FROM ${sql.raw(pdvTable)} WHERE protocol_id = ${protocolId}
    `)
    await tx.execute(sql`
      DELETE FROM ${sql.raw(pdoTable)} WHERE protocol_id = ${protocolId}
    `)
    await tx.execute(sql`
      DELETE FROM ${sql.raw(mpTable)} WHERE id = ${protocolId}
    `)
  })

  logger.info('Protocol deleted', { protocolId, userId })
  return { deleted: true }
}

// =============================================================================
// FINALIZE
// =============================================================================

/**
 * Mark protocol as finalized
 */
export async function finalizeProtocol(
  id: string,
): Promise<boolean> {
  const result = await db.execute(sql`
    UPDATE ${sql.raw(mpTable)}
    SET status = ${PROTOCOL_STATUS.FINALIZED}
    WHERE id = ${id} AND status = ${PROTOCOL_STATUS.REVIEW}
    RETURNING id, title, attendees
  `)

  if (result.rows.length === 0) return false

  const { title, attendees } = result.rows[0] as unknown as { id: string; title: string; attendees: string[] }

  // Notify all attendees that the protocol is available
  if (attendees && attendees.length > 0) {
    fireNotification(
      () => notifyUsers(attendees, {
        type: 'protocol_finalized',
        title: 'Protokoll abgeschlossen',
        content: `Das Protokoll "${title}" ist jetzt verfügbar.`,
        related_type: 'protocol',
        related_id: id,
      }),
      `protocol_finalized:${id}`
    )
  }

  return true
}
