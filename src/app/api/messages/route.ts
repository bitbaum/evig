import { NextRequest } from 'next/server'
import { db } from '@/db'
import { conversations, messages, users } from '@/db/schema'
import { eq, and, or, sql, desc } from 'drizzle-orm'
import { apiError, apiSuccess, apiBadRequest, parsePagination } from '@/lib/api/helpers'
import { withAuth, ValidSession } from '@/lib/api/middleware'
import { ERROR_MESSAGES } from '@/config/error-messages'
import { ORG } from '@/config/org'
import { logger } from '@/lib/logger'
import { validateBody, SendMessageSchema } from '@/lib/schemas'
import { rateLimiters } from '@/lib/security/rate-limit'
import { sendMessageInConversation } from '@/lib/messaging/send-message'
import { sendCustomEmail, newMarketplaceMessage } from '@/lib/email'
import { APP_URL } from '@/config/urls'

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
      return apiError(new Error('Rate limit'), 'Zu viele Nachrichten. Bitte versuche es später erneut.', 429)
    }

    const body = await request.json()
    const validation = validateBody(SendMessageSchema, body)
    if (!validation.success) return validation.error
    const { recipient_id, content, context_id, context_type } = validation.data

    if (recipient_id === session.user.id) return apiBadRequest('Nachricht an sich selbst nicht möglich')

    const result = await sendMessageInConversation({
      senderId: session.user.id,
      recipientId: recipient_id,
      content,
      type: context_type,
      contextId: context_id,
    })

    // Notify recipient by email (fire-and-forget)
    db.select({ email: users.email, name: users.name })
      .from(users)
      .where(eq(users.id, recipient_id))
      .limit(1)
      .then(([recipient]) => {
        if (!recipient?.email) return
        // /dashboard/messages?conversation=<id> — the dashboard page reads
        // `conversation` from searchParams to deep-link into a thread. There's
        // no /messages/[id] route (the previous URL 404'd on click), and no
        // /dashboard/messages/[id] either; the dashboard handles deep-linking
        // via query string.
        const conversationUrl = `${APP_URL}/dashboard/messages?conversation=${result.conversationId}`
        const preview = content.length > 200 ? content.slice(0, 200) + '...' : content
        sendCustomEmail(recipient.email, newMarketplaceMessage({
          recipientName: recipient.name || 'Nutzer',
          senderName: session.user.name || 'Jemand',
          listingTitle: context_id ? 'deiner Anfrage' : ORG.name,
          messagePreview: preview,
          conversationUrl,
        })).catch(err => logger.error('Failed to send new message notification email', { err, conversationId: result.conversationId }))
      })
      .catch(err => logger.error('Failed to look up recipient for message email', { err, recipientId: recipient_id }))

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
