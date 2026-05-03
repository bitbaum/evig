import { NextRequest } from 'next/server'
import { db } from '@/db'
import { conversations, messages, users } from '@/db/schema'
import { eq, and, lt, desc, sql } from 'drizzle-orm'
import { apiError, apiSuccess, apiForbidden, apiNotFound, parsePagination } from '@/lib/api/helpers'
import { withAuth, ValidSession } from '@/lib/api/middleware'
import { ERROR_MESSAGES } from '@/config/error-messages'
import { logger } from '@/lib/logger'

// GET /api/messages/[conversationId] - Get messages in conversation
export const GET = withAuth<{ conversationId: string }>(async (
  request: NextRequest,
  session: ValidSession,
  context?: { params?: { conversationId: string } }
) => {
  try {
    const conversationId = context?.params?.conversationId
    if (!conversationId) {
      return apiNotFound(ERROR_MESSAGES.CONVERSATION_NOT_FOUND)
    }

    // Verify user is participant
    const [conv] = await db
      .select({
        participant1: conversations.participant1,
        participant2: conversations.participant2,
        contextId: conversations.contextId,
        type: conversations.type,
      })
      .from(conversations)
      .where(eq(conversations.id, conversationId))

    if (!conv) {
      return apiNotFound(ERROR_MESSAGES.CONVERSATION_NOT_FOUND)
    }

    if (conv.participant1 !== session.user.id && conv.participant2 !== session.user.id) {
      return apiForbidden('Kein Zugriff auf diese Konversation')
    }

    const { searchParams } = new URL(request.url)
    const { limit } = parsePagination(request, { defaultLimit: 50, maxLimit: 100 })
    const before = searchParams.get('before') // cursor for pagination

    const conditions = [eq(messages.conversationId, conversationId)]
    if (before) {
      conditions.push(lt(messages.createdAt, before))
    }

    const rows = await db
      .select({
        id: messages.id,
        sender_id: messages.senderId,
        recipient_id: messages.recipientId,
        content: messages.content,
        message_type: messages.messageType,
        is_read: messages.isRead,
        created_at: messages.createdAt,
        sender_name: users.name,
      })
      .from(messages)
      .leftJoin(users, eq(messages.senderId, users.id))
      .where(and(...conditions))
      .orderBy(desc(messages.createdAt))
      .limit(limit)

    // Mark messages as read
    const unreadField = conv.participant1 === session.user.id ? 'unreadCount1' : 'unreadCount2'
    await db
      .update(conversations)
      .set({ [unreadField]: 0 } as Record<string, unknown>)
      .where(eq(conversations.id, conversationId))

    await db
      .update(messages)
      .set({ isRead: true, readAt: sql`CURRENT_TIMESTAMP` })
      .where(and(
        eq(messages.conversationId, conversationId),
        eq(messages.recipientId, session.user.id),
        eq(messages.isRead, false)
      ))

    logger.info('Messages fetched', { conversationId, userId: session.user.id, count: rows.length })

    return apiSuccess({
      messages: rows.reverse(), // Return in chronological order
      conversation: {
        id: conversationId,
        context_id: conv.contextId,
        type: conv.type
      }
    })

  } catch (error) {
    logger.error('Error fetching messages', { error })
    return apiError(error, ERROR_MESSAGES.INTERNAL_SERVER_ERROR)
  }
})
