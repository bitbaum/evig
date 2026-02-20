/**
 * Meeting Protocols — CRUD & Query Operations
 */

import { query, transaction } from '@/lib/auth/db'
import { TABLE_NAMES } from '@/config/database'
import { notifyUsers, fireNotification } from '@/lib/services/notifications'
import { logger } from '@/lib/logger'
import type {
  ProtocolListItem,
  ProtocolDetail,
  CreateProtocolInput,
  UpdateProtocolInput,
} from '@/lib/schemas/protocols'

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
  const result = await query<{
    total: string
    draft: string
    review: string
    finalized: string
  }>(`
    SELECT
      COUNT(*) as total,
      COUNT(*) FILTER (WHERE status = 'draft') as draft,
      COUNT(*) FILTER (WHERE status = 'review') as review,
      COUNT(*) FILTER (WHERE status = 'finalized') as finalized
    FROM ${TABLE_NAMES.MEETING_PROTOCOLS} mp
    WHERE (
      mp.visibility = 'team'
      OR mp.created_by = $1
      OR mp.attendees @> to_jsonb($1::text)
      OR $2 = true
    )
  `, [userId, isSuperAdmin])

  const row = result.rows[0]
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
  const result = await query<{ id: string; name: string }>(
    `SELECT id, name FROM ${TABLE_NAMES.USERS} WHERE name IS NOT NULL ORDER BY name`
  )
  return result.rows
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

  let queryText = `
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
          FROM ${TABLE_NAMES.PROTOCOL_ACTION_LINKS} pal
          WHERE pal.protocol_id = mp.id
            AND pal.action_item_id = ai->>'id'
        )
      ) as unlinked_action_item_count,
      (mp.structured_notes IS NOT NULL) as has_structured_notes
    FROM ${TABLE_NAMES.MEETING_PROTOCOLS} mp
    LEFT JOIN ${TABLE_NAMES.USERS} u ON mp.created_by = u.id
    WHERE (
      mp.visibility = 'team'
      OR mp.created_by = $1
      OR mp.attendees @> to_jsonb($1::text)
      OR $2 = true
    )
  `

  const params: (string | boolean | number)[] = [userId, isSuperAdmin]
  let paramIndex = 3

  if (filters?.meeting_type) {
    queryText += ` AND mp.meeting_type = $${paramIndex++}`
    params.push(filters.meeting_type)
  }

  if (filters?.status) {
    queryText += ` AND mp.status = $${paramIndex++}`
    params.push(filters.status)
  }

  if (filters?.q) {
    queryText += ` AND mp.title ILIKE '%' || $${paramIndex++} || '%'`
    params.push(filters.q)
  }

  const whereClause = queryText.slice(queryText.indexOf('WHERE'))

  // Count query reuses the same WHERE clause
  const countText = `
    SELECT COUNT(*)::text as total
    FROM ${TABLE_NAMES.MEETING_PROTOCOLS} mp
    ${whereClause}
  `

  const offset = (page - 1) * limit
  queryText += ` ORDER BY mp.meeting_date DESC, mp.created_at DESC LIMIT $${paramIndex++} OFFSET $${paramIndex++}`
  params.push(limit, offset)

  const [countResult, listResult] = await Promise.all([
    query<{ total: string }>(countText, params.slice(0, params.length - 2)),
    query<ProtocolListItem>(queryText, params),
  ])

  return {
    protocols: listResult.rows,
    total: parseInt(countResult.rows[0]?.total || '0', 10),
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
  const result = await query<ProtocolDetail>(
    `SELECT
      mp.*,
      u.name as created_by_name,
      u.email as created_by_email
    FROM ${TABLE_NAMES.MEETING_PROTOCOLS} mp
    LEFT JOIN ${TABLE_NAMES.USERS} u ON mp.created_by = u.id
    WHERE mp.id = $1
    AND (
      mp.visibility = 'team'
      OR mp.created_by = $2
      OR mp.attendees @> to_jsonb($2::text)
      OR $3 = true
    )`,
    [id, userId, isSuperAdmin]
  )
  return result.rows[0] || null
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
  const result = await query<{ id: string }>(
    `INSERT INTO ${TABLE_NAMES.MEETING_PROTOCOLS} (
      title, meeting_date, meeting_type, visibility, attendees, input_method, created_by
    ) VALUES ($1, $2, $3, $4, $5::jsonb, $6, $7)
    RETURNING id`,
    [
      data.title,
      data.meeting_date,
      data.meeting_type,
      data.visibility,
      JSON.stringify(data.attendees || []),
      data.input_method || 'transcript',
      createdBy,
    ]
  )
  return result.rows[0]
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
  const existing = await query<{ status: string; created_by: string }>(
    `SELECT status, created_by FROM ${TABLE_NAMES.MEETING_PROTOCOLS} WHERE id = $1`,
    [id]
  )

  if (existing.rows.length === 0) return null

  const { status } = existing.rows[0]
  if (status !== 'draft' && status !== 'review') {
    throw new Error('PROTOCOL_NOT_EDITABLE')
  }

  // Build dynamic update
  const updates: string[] = []
  const params: unknown[] = []
  let paramIndex = 1

  const fieldMap: Record<string, unknown> = {
    title: data.title,
    meeting_date: data.meeting_date,
    meeting_type: data.meeting_type,
    visibility: data.visibility,
    attendees: data.attendees ? JSON.stringify(data.attendees) : undefined,
    structured_notes: data.structured_notes ? JSON.stringify(data.structured_notes) : undefined,
  }

  for (const [field, value] of Object.entries(fieldMap)) {
    if (value !== undefined) {
      if (field === 'attendees') {
        updates.push(`${field} = $${paramIndex++}::jsonb`)
      } else if (field === 'structured_notes') {
        updates.push(`${field} = $${paramIndex++}::jsonb`)
      } else {
        updates.push(`${field} = $${paramIndex++}`)
      }
      params.push(value)
    }
  }

  if (updates.length === 0) return null

  params.push(id)

  const result = await query<ProtocolDetail>(
    `UPDATE ${TABLE_NAMES.MEETING_PROTOCOLS}
     SET ${updates.join(', ')}
     WHERE id = $${paramIndex}
     RETURNING *`,
    params
  )

  return result.rows[0] || null
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
  const existing = await query<{ id: string; created_by: string }>(
    `SELECT id, created_by FROM ${TABLE_NAMES.MEETING_PROTOCOLS} WHERE id = $1`,
    [protocolId]
  )

  if (existing.rows.length === 0) {
    return { error: 'not_found' }
  }

  if (existing.rows[0].created_by !== userId && !isSuperAdmin) {
    return { error: 'not_authorized' }
  }

  await transaction(async (client) => {
    await client.query(
      `DELETE FROM ${TABLE_NAMES.PROTOCOL_ACTION_LINKS} WHERE protocol_id = $1`,
      [protocolId]
    )
    await client.query(
      `DELETE FROM ${TABLE_NAMES.PROTOCOL_DECISION_VOTES} WHERE protocol_id = $1`,
      [protocolId]
    )
    await client.query(
      `DELETE FROM ${TABLE_NAMES.PROTOCOL_DECISION_OUTCOMES} WHERE protocol_id = $1`,
      [protocolId]
    )
    await client.query(
      `DELETE FROM ${TABLE_NAMES.MEETING_PROTOCOLS} WHERE id = $1`,
      [protocolId]
    )
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
  const result = await query<{ id: string; title: string; attendees: string[] }>(
    `UPDATE ${TABLE_NAMES.MEETING_PROTOCOLS}
     SET status = 'finalized'
     WHERE id = $1 AND status = 'review'
     RETURNING id, title, attendees`,
    [id]
  )

  if (result.rows.length === 0) return false

  const { title, attendees } = result.rows[0]

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
