import { NextRequest } from 'next/server'
import { query } from '@/lib/auth/db'
import { apiError, apiSuccess, apiBadRequest } from '@/lib/api/helpers'
import { withAuth, ValidSession } from '@/lib/api/middleware'
import { ERROR_MESSAGES } from '@/config/error-messages'
import { logger } from '@/lib/logger'

interface ConversationRow {
  id: string
  type: string
  context_id: string | null
  participant_1: string
  participant_2: string
  last_message_at: string
  last_message_preview: string | null
  unread_count_1: number
  unread_count_2: number
  other_user_name: string
  other_user_id: string
}

interface IdRow {
  id: string
}

interface MessageResultRow {
  id: string
  created_at: string
}

// GET /api/messages - Get conversations for current user
export const GET = withAuth(async (
  request: NextRequest,
  session: ValidSession
) => {
  try {
    const { searchParams } = new URL(request.url)
    const contextId = searchParams.get('context_id') // Optional: filter by appointment
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100)
    const offset = parseInt(searchParams.get('offset') || '0')

    let whereClause = '(c.participant_1 = $1 OR c.participant_2 = $1)'
    const params: (string | number)[] = [session.user.id]

    if (contextId) {
      params.push(contextId)
      whereClause += ' AND c.context_id = $' + params.length
    }

    params.push(limit)
    params.push(offset)

    const result = await query(
      'SELECT c.id, c.type, c.context_id, c.participant_1, c.participant_2, ' +
      'c.last_message_at, c.last_message_preview, c.unread_count_1, c.unread_count_2, ' +
      'CASE WHEN c.participant_1 = $1 THEN u2.name ELSE u1.name END as other_user_name, ' +
      'CASE WHEN c.participant_1 = $1 THEN c.participant_2 ELSE c.participant_1 END as other_user_id ' +
      'FROM conversations c ' +
      'LEFT JOIN users u1 ON c.participant_1 = u1.id ' +
      'LEFT JOIN users u2 ON c.participant_2 = u2.id ' +
      'WHERE ' + whereClause + ' AND c.is_active = true ' +
      'ORDER BY c.last_message_at DESC ' +
      'LIMIT $' + (params.length - 1) + ' OFFSET $' + params.length,
      params
    )

    const conversations = (result.rows as ConversationRow[]).map(conv => ({
      ...conv,
      unread_count: conv.participant_1 === session.user.id ? conv.unread_count_1 : conv.unread_count_2
    }))

    logger.info('Conversations fetched', { userId: session.user.id, count: conversations.length })

    return apiSuccess({ conversations })

  } catch (error) {
    logger.error('Error fetching conversations', { error })
    return apiError(error, ERROR_MESSAGES.INTERNAL_SERVER_ERROR)
  }
})

// POST /api/messages - Create or get conversation and send message
export const POST = withAuth(async (
  request: NextRequest,
  session: ValidSession
) => {
  try {
    const body = await request.json()
    const { recipient_id, content, context_id, context_type = 'appointment' } = body

    if (!recipient_id) return apiBadRequest('Empfänger erforderlich')
    if (!content) return apiBadRequest('Nachricht erforderlich')
    if (recipient_id === session.user.id) return apiBadRequest('Nachricht an sich selbst nicht möglich')

    // Ensure consistent participant ordering (lower UUID first)
    const participant_1 = session.user.id < recipient_id ? session.user.id : recipient_id
    const participant_2 = session.user.id < recipient_id ? recipient_id : session.user.id

    await query('BEGIN')

    try {
      // Find or create conversation
      let conversationResult = await query(
        'SELECT id FROM conversations ' +
        'WHERE participant_1 = $1 AND participant_2 = $2 AND type = $3 ' +
        (context_id ? 'AND context_id = $4' : 'AND context_id IS NULL'),
        context_id ? [participant_1, participant_2, context_type, context_id] : [participant_1, participant_2, context_type]
      )

      let conversationId: string

      if (conversationResult.rows.length === 0) {
        // Create new conversation
        const createResult = await query(
          'INSERT INTO conversations (participant_1, participant_2, type, context_id) ' +
          'VALUES ($1, $2, $3, $4) RETURNING id',
          [participant_1, participant_2, context_type, context_id || null]
        )
        conversationId = (createResult.rows[0] as IdRow).id
      } else {
        conversationId = (conversationResult.rows[0] as IdRow).id
      }

      // Create message
      const messageResult = await query(
        'INSERT INTO messages (conversation_id, sender_id, recipient_id, content) ' +
        'VALUES ($1, $2, $3, $4) RETURNING id, created_at',
        [conversationId, session.user.id, recipient_id, content]
      )

      // Update conversation with last message info
      const unreadField = session.user.id === participant_1 ? 'unread_count_2' : 'unread_count_1'
      await query(
        'UPDATE conversations SET ' +
        'last_message_at = CURRENT_TIMESTAMP, ' +
        'last_message_preview = $1, ' +
        unreadField + ' = ' + unreadField + ' + 1, ' +
        'updated_at = CURRENT_TIMESTAMP ' +
        'WHERE id = $2',
        [content.substring(0, 100), conversationId]
      )

      // Update appointment messages count if context is appointment
      if (context_id && context_type === 'appointment') {
        await query(
          'UPDATE service_appointments SET ' +
          'messages_count = messages_count + 1, ' +
          'last_contact_at = CURRENT_TIMESTAMP ' +
          'WHERE id = $1',
          [context_id]
        )
      }

      await query('COMMIT')

      const messageRow = messageResult.rows[0] as MessageResultRow

      logger.info('Message sent', {
        conversationId,
        messageId: messageRow.id,
        senderId: session.user.id,
        recipientId: recipient_id
      })

      return apiSuccess({
        message: 'Nachricht gesendet',
        conversation_id: conversationId,
        message_id: messageRow.id,
        created_at: messageRow.created_at
      })

    } catch (txError) {
      await query('ROLLBACK')
      throw txError
    }

  } catch (error) {
    logger.error('Error sending message', { error })
    return apiError(error, ERROR_MESSAGES.INTERNAL_SERVER_ERROR)
  }
})
