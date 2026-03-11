import { NextRequest } from 'next/server'
import { db } from '@/db'
import { conversations, messages, users, serviceAppointments } from '@/db/schema'
import { eq, and, or, sql, desc, isNull } from 'drizzle-orm'
import { apiError, apiSuccess, apiBadRequest, parsePagination } from '@/lib/api/helpers'
import { withAuth, ValidSession } from '@/lib/api/middleware'
import { ERROR_MESSAGES } from '@/config/error-messages'
import { CONVERSATION_TYPES } from '@/config/database'
import { logger } from '@/lib/logger'
import { validateBody, SendMessageSchema } from '@/lib/schemas'
import { rateLimiters } from '@/lib/security/rate-limit'

// GET /api/messages - Get conversations for current user
export const GET = withAuth(async (
  request: NextRequest,
  session: ValidSession
) => {
  try {
    const { searchParams } = new URL(request.url)
    const contextId = searchParams.get('context_id') // Optional: filter by appointment
    const { limit, offset } = parsePagination(request, { defaultLimit: 50, maxLimit: 100 })

    const conditions = [
      or(
        eq(conversations.participant1, session.user.id),
        eq(conversations.participant2, session.user.id),
      ),
      eq(conversations.isActive, true),
    ]

    if (contextId) {
      conditions.push(eq(conversations.contextId, contextId))
    }

    const whereCondition = and(...conditions)

    const result = await db
      .select({
        id: conversations.id,
        type: conversations.type,
        contextId: conversations.contextId,
        participant1: conversations.participant1,
        participant2: conversations.participant2,
        lastMessageAt: conversations.lastMessageAt,
        lastMessagePreview: conversations.lastMessagePreview,
        unreadCount1: conversations.unreadCount1,
        unreadCount2: conversations.unreadCount2,
        otherUserName: sql<string>`CASE WHEN ${conversations.participant1} = ${session.user.id} THEN u2.name ELSE u1.name END`,
        otherUserId: sql<string>`CASE WHEN ${conversations.participant1} = ${session.user.id} THEN ${conversations.participant2} ELSE ${conversations.participant1} END`,
      })
      .from(conversations)
      .leftJoin(
        sql`${users} u1`,
        sql`${conversations.participant1} = u1.id`
      )
      .leftJoin(
        sql`${users} u2`,
        sql`${conversations.participant2} = u2.id`
      )
      .where(whereCondition)
      .orderBy(desc(conversations.lastMessageAt))
      .limit(limit)
      .offset(offset)

    const conversationsWithUnread = result.map(conv => ({
      ...conv,
      unread_count: conv.participant1 === session.user.id ? conv.unreadCount1 : conv.unreadCount2
    }))

    logger.info('Conversations fetched', { userId: session.user.id, count: conversationsWithUnread.length })

    return apiSuccess({ conversations: conversationsWithUnread })

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
    if (!rateLimiters.messageCreate(session.user.id + ':message')) {
      return apiError(new Error('Rate limit'), 'Zu viele Nachrichten. Bitte versuchen Sie es später erneut.', 429)
    }

    const body = await request.json()
    const validation = validateBody(SendMessageSchema, body)
    if (!validation.success) return validation.error
    const { recipient_id, content, context_id, context_type } = validation.data

    if (recipient_id === session.user.id) return apiBadRequest('Nachricht an sich selbst nicht möglich')

    // Ensure consistent participant ordering (lower UUID first)
    const participant_1 = session.user.id < recipient_id ? session.user.id : recipient_id
    const participant_2 = session.user.id < recipient_id ? recipient_id : session.user.id

    const result = await db.transaction(async (tx) => {
      // Find or create conversation
      const contextCondition = context_id
        ? eq(conversations.contextId, context_id)
        : isNull(conversations.contextId)

      const [existingConversation] = await tx
        .select({ id: conversations.id })
        .from(conversations)
        .where(and(
          eq(conversations.participant1, participant_1),
          eq(conversations.participant2, participant_2),
          eq(conversations.type, context_type),
          contextCondition,
        ))

      let conversationId: string

      if (!existingConversation) {
        // Create new conversation
        const [newConversation] = await tx
          .insert(conversations)
          .values({
            participant1: participant_1,
            participant2: participant_2,
            type: context_type,
            contextId: context_id || null,
          })
          .returning({ id: conversations.id })
        conversationId = newConversation.id
      } else {
        conversationId = existingConversation.id
      }

      // Create message
      const [newMessage] = await tx
        .insert(messages)
        .values({
          conversationId,
          senderId: session.user.id,
          recipientId: recipient_id,
          content,
        })
        .returning({ id: messages.id, createdAt: messages.createdAt })

      // Update conversation with last message info
      const isParticipant1 = session.user.id === participant_1
      await tx
        .update(conversations)
        .set({
          lastMessageAt: sql`CURRENT_TIMESTAMP`,
          lastMessagePreview: content.substring(0, 100),
          ...(isParticipant1
            ? { unreadCount2: sql`${conversations.unreadCount2} + 1` }
            : { unreadCount1: sql`${conversations.unreadCount1} + 1` }
          ),
          updatedAt: sql`CURRENT_TIMESTAMP`,
        })
        .where(eq(conversations.id, conversationId))

      // Update appointment messages count if context is appointment
      if (context_id && context_type === CONVERSATION_TYPES.APPOINTMENT) {
        await tx
          .update(serviceAppointments)
          .set({
            messagesCount: sql`${serviceAppointments.messagesCount} + 1`,
            lastContactAt: sql`CURRENT_TIMESTAMP`,
          })
          .where(eq(serviceAppointments.id, context_id))
      }

      return { conversationId, messageId: newMessage.id, createdAt: newMessage.createdAt }
    })

    logger.info('Message sent', {
      conversationId: result.conversationId,
      messageId: result.messageId,
      senderId: session.user.id,
      recipientId: recipient_id
    })

    return apiSuccess({
      message: 'Nachricht gesendet',
      conversation_id: result.conversationId,
      message_id: result.messageId,
      created_at: result.createdAt
    })

  } catch (error) {
    logger.error('Error sending message', { error })
    return apiError(error, ERROR_MESSAGES.INTERNAL_SERVER_ERROR)
  }
})
