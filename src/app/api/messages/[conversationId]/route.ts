import { NextRequest } from 'next/server'
import { auth } from '@/auth'
import { query } from '@/lib/auth/db'
import { apiError, apiSuccess, apiNotFound, apiUnauthorized, apiBadRequest } from '@/lib/api/helpers'
import { TABLE_NAMES } from '@/config/database'

export async function GET(
  request: NextRequest,
  { params }: { params: { conversationId: string } }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return apiUnauthorized('Nicht authentifiziert')
    }

    const conversationId = params.conversationId
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '50')
    const before = searchParams.get('before') // Message ID to paginate before

    // Verify user has access to this conversation
    const conversationCheck = await query(`
      SELECT id FROM ${TABLE_NAMES.CONVERSATIONS}
      WHERE id = $1 AND (participant_1 = $2 OR participant_2 = $2)
      AND is_active = true
    `, [conversationId, session.user.id])

    if (conversationCheck.rows.length === 0) {
      return apiNotFound('Unterhaltung')
    }

    // Build query for messages
    let whereClause = `WHERE m.conversation_id = $1`
    const queryParams = [conversationId]
    let paramIndex = 2

    if (before) {
      whereClause += ` AND m.id < $${paramIndex}`
      queryParams.push(before)
      paramIndex++
    }

    // Mark messages as read for current user
    await query(`
      UPDATE ${TABLE_NAMES.MESSAGES}
      SET is_read = true, read_at = CURRENT_TIMESTAMP
      WHERE conversation_id = $1 AND recipient_id = $2 AND is_read = false
    `, [conversationId, session.user.id])

    // Get messages
    const messages = await query(`
      SELECT
        m.*,
        u.name as sender_name,
        u.email as sender_email
      FROM ${TABLE_NAMES.MESSAGES} m
      JOIN ${TABLE_NAMES.USERS} u ON m.sender_id = u.id
      ${whereClause}
      ORDER BY m.created_at DESC
      LIMIT $${paramIndex}
    `, [...queryParams, limit])

    // Reverse to get chronological order
    const chronologicalMessages = messages.rows.reverse()

    return apiSuccess({
      messages: chronologicalMessages.map(msg => ({
        ...msg,
        created_at: msg.created_at?.toISOString(),
        updated_at: msg.updated_at?.toISOString(),
        read_at: msg.read_at?.toISOString(),
      }))
    })

  } catch (error) {
    return apiError(error, 'Interner Serverfehler')
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { conversationId: string } }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return apiUnauthorized('Nicht authentifiziert')
    }

    const conversationId = params.conversationId
    const { content, messageType = 'text' } = await request.json()

    if (!content) {
      return apiBadRequest('Nachricht erforderlich')
    }

    // Verify user has access to this conversation and get other participant
    const conversationCheck = await query(`
      SELECT
        CASE
          WHEN participant_1 = $2 THEN participant_2
          ELSE participant_1
        END as other_participant
      FROM ${TABLE_NAMES.CONVERSATIONS}
      WHERE id = $1 AND (participant_1 = $2 OR participant_2 = $2)
      AND is_active = true
    `, [conversationId, session.user.id])

    if (conversationCheck.rows.length === 0) {
      return apiNotFound('Unterhaltung')
    }

    const recipientId = conversationCheck.rows[0].other_participant

    // Create message
    const messageResult = await query(`
      INSERT INTO ${TABLE_NAMES.MESSAGES} (
        conversation_id, sender_id, recipient_id, content, message_type
      )
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id, created_at
    `, [conversationId, session.user.id, recipientId, content, messageType])

    const message = messageResult.rows[0]

    // Create notification for recipient
    await query(`
      INSERT INTO ${TABLE_NAMES.NOTIFICATIONS} (
        user_id, type, title, content, related_type, related_id, sent_in_app
      )
      VALUES ($1, 'message', 'Neue Nachricht', $2, 'conversation', $3, true)
    `, [recipientId, content.substring(0, 100), conversationId])

    return apiSuccess({
      message: {
        id: message.id,
        created_at: message.created_at?.toISOString(),
      }
    })

  } catch (error) {
    return apiError(error, 'Interner Serverfehler')
  }
}



