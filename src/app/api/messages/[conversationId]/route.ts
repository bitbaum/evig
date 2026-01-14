import { NextRequest } from 'next/server'
import { query } from '@/lib/auth/db'
import { apiError, apiSuccess, apiForbidden, apiNotFound } from '@/lib/api/helpers'
import { withAuth, ValidSession } from '@/lib/api/middleware'
import { ERROR_MESSAGES } from '@/config/error-messages'
import { logger } from '@/lib/logger'

interface MessageRow {
  id: string
  sender_id: string
  recipient_id: string
  content: string
  message_type: string
  is_read: boolean
  created_at: string
  sender_name: string
}

interface ConversationRow {
  participant_1: string
  participant_2: string
  context_id: string | null
  type: string
}

// GET /api/messages/[conversationId] - Get messages in conversation
export const GET = withAuth<{ conversationId: string }>(async (
  request: NextRequest,
  session: ValidSession,
  context?: { params?: { conversationId: string } }
) => {
  try {
    const conversationId = context?.params?.conversationId
    if (!conversationId) {
      return apiNotFound('Konversation nicht gefunden')
    }

    // Verify user is participant
    const convResult = await query(
      'SELECT participant_1, participant_2, context_id, type FROM conversations WHERE id = $1',
      [conversationId]
    )

    if (convResult.rows.length === 0) {
      return apiNotFound('Konversation nicht gefunden')
    }

    const conv = convResult.rows[0] as ConversationRow
    if (conv.participant_1 !== session.user.id && conv.participant_2 !== session.user.id) {
      return apiForbidden('Kein Zugriff auf diese Konversation')
    }

    const { searchParams } = new URL(request.url)
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100)
    const before = searchParams.get('before') // cursor for pagination

    let messagesQuery = 'SELECT m.id, m.sender_id, m.recipient_id, m.content, m.message_type, ' +
      'm.is_read, m.created_at, u.name as sender_name ' +
      'FROM messages m ' +
      'LEFT JOIN users u ON m.sender_id = u.id ' +
      'WHERE m.conversation_id = $1'
    
    const params: (string | number)[] = [conversationId]

    if (before) {
      params.push(before)
      messagesQuery += ' AND m.created_at < $' + params.length
    }

    params.push(limit)
    messagesQuery += ' ORDER BY m.created_at DESC LIMIT $' + params.length

    const result = await query(messagesQuery, params)
    const messages = result.rows as MessageRow[]

    // Mark messages as read
    const unreadField = conv.participant_1 === session.user.id ? 'unread_count_1' : 'unread_count_2'
    await query(
      'UPDATE conversations SET ' + unreadField + ' = 0 WHERE id = $1',
      [conversationId]
    )
    await query(
      'UPDATE messages SET is_read = true, read_at = CURRENT_TIMESTAMP ' +
      'WHERE conversation_id = $1 AND recipient_id = $2 AND is_read = false',
      [conversationId, session.user.id]
    )

    logger.info('Messages fetched', { conversationId, userId: session.user.id, count: messages.length })

    return apiSuccess({
      messages: messages.reverse(), // Return in chronological order
      conversation: {
        id: conversationId,
        context_id: conv.context_id,
        type: conv.type
      }
    })

  } catch (error) {
    logger.error('Error fetching messages', { error })
    return apiError(error, ERROR_MESSAGES.INTERNAL_SERVER_ERROR)
  }
})
