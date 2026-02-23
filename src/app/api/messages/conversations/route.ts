import { NextRequest } from 'next/server'
import { auth } from '@/auth'
import { query } from '@/lib/auth/db'
import { apiError, apiSuccess, apiUnauthorized, apiBadRequest } from '@/lib/api/helpers'
import { ERROR_MESSAGES } from '@/config/error-messages'
import { TABLE_NAMES } from '@/config/database'

interface ConversationRow {
  id: string
  participant_1: string
  participant_2: string
  type: string
  context_id: string | null
  title: string
  last_message_preview: string
  other_participant: {
    id: string
    name: string
    email: string
    role: string
  }
  unread_count: number
  last_message_at: Date
  created_at: Date
  updated_at: Date
}

interface IdRow {
  id: string
}

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return apiUnauthorized(ERROR_MESSAGES.UNAUTHORIZED)
    }

    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') // 'direct', 'appointment', 'marketplace', 'service'
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = parseInt(searchParams.get('offset') || '0')

    // Get user's conversations
    let whereClause = `
      WHERE (c.participant_1 = $1 OR c.participant_2 = $1)
      AND c.is_active = true
    `
    const params = [session.user.id]

    if (type) {
      whereClause += ` AND c.type = $${params.length + 1}`
      params.push(type)
    }

    const conversations = await query(`
      SELECT
        c.*,
        -- Get other participant info
        CASE
          WHEN c.participant_1 = $1 THEN (
            SELECT json_build_object(
              'id', u2.id,
              'name', COALESCE(u2.name, u2.email),
              'email', u2.email,
              'role', u2.role
            )
            FROM ${TABLE_NAMES.USERS} u2 WHERE u2.id = c.participant_2
          )
          ELSE (
            SELECT json_build_object(
              'id', u1.id,
              'name', COALESCE(u1.name, u1.email),
              'email', u1.email,
              'role', u1.role
            )
            FROM ${TABLE_NAMES.USERS} u1 WHERE u1.id = c.participant_1
          )
        END as other_participant,
        -- Get unread count for current user
        CASE
          WHEN c.participant_1 = $1 THEN c.unread_count_1
          ELSE c.unread_count_2
        END as unread_count
      FROM ${TABLE_NAMES.CONVERSATIONS} c
      ${whereClause}
      ORDER BY c.last_message_at DESC
      LIMIT $${params.length + 1} OFFSET $${params.length + 2}
    `, [...params, limit, offset])

    return apiSuccess({
      conversations: (conversations.rows as ConversationRow[]).map((conv: ConversationRow) => ({
        ...conv,
        last_message_at: conv.last_message_at?.toISOString(),
        created_at: conv.created_at?.toISOString(),
        updated_at: conv.updated_at?.toISOString(),
      }))
    })

  } catch (error) {
    return apiError(error, ERROR_MESSAGES.INTERNAL_SERVER_ERROR)
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return apiUnauthorized(ERROR_MESSAGES.UNAUTHORIZED)
    }

    const { participantId, type, contextId, initialMessage } = await request.json()

    if (!participantId) {
      return apiBadRequest('Teilnehmer-ID erforderlich')
    }

    if (participantId === session.user.id) {
      return apiBadRequest('Sie können keine Unterhaltung mit sich selbst starten')
    }

    // Ensure consistent ordering of participants
    const [participant1, participant2] = [session.user.id, participantId].sort()

    // Check if conversation already exists
    const existingConv = await query(`
      SELECT id FROM ${TABLE_NAMES.CONVERSATIONS}
      WHERE participant_1 = $1 AND participant_2 = $2
      AND type = $3 AND context_id = $4
    `, [participant1, participant2, type || 'direct', contextId])

    if (existingConv.rows.length > 0) {
      return apiSuccess({
        conversation: { id: (existingConv.rows[0] as IdRow).id },
        message: 'Unterhaltung existiert bereits'
      })
    }

    // Create new conversation
    const conversationResult = await query(`
      INSERT INTO ${TABLE_NAMES.CONVERSATIONS} (
        participant_1, participant_2, type, context_id,
        title, last_message_preview
      )
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id
    `, [
      participant1,
      participant2,
      type || 'direct',
      contextId,
      `Unterhaltung mit ${participantId}`, // Will be updated with proper name
      initialMessage ? initialMessage.substring(0, 100) : 'Neue Unterhaltung'
    ])

    const conversationId = (conversationResult.rows[0] as IdRow).id

    // Create initial message if provided
    if (initialMessage) {
      await query(`
        INSERT INTO ${TABLE_NAMES.MESSAGES} (
          conversation_id, sender_id, recipient_id, content
        )
        VALUES ($1, $2, $3, $4)
      `, [conversationId, session.user.id, participantId, initialMessage])
    }

    return apiSuccess({
      conversation: { id: conversationId }
    })

  } catch (error) {
    return apiError(error, ERROR_MESSAGES.INTERNAL_SERVER_ERROR)
  }
}
