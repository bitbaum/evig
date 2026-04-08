/**
 * Shared Messaging Service — SSOT
 *
 * All message/conversation creation routes delegate to this function.
 * Handles: participant ordering, find-or-create conversation, message insert,
 * metadata update (lastMessagePreview, unreadCount), appointment context.
 */

import { db } from '@/db'
import { conversations, messages } from '@/db/schema/messaging'
import { serviceAppointments } from '@/db/schema'
import { eq, and, sql, isNull } from 'drizzle-orm'
import { logger } from '@/lib/logger'
import { CONVERSATION_TYPES } from '@/config/database'

interface SendMessageParams {
  senderId: string
  recipientId: string
  content: string
  type: string
  contextId?: string | null
  title?: string
}

interface SendMessageResult {
  conversationId: string
  messageId: string
  createdAt: string
  isNewConversation: boolean
}

/**
 * Send a message in a conversation (find-or-create).
 * All operations in a single transaction for consistency.
 */
export async function sendMessageInConversation(params: SendMessageParams): Promise<SendMessageResult> {
  const { senderId, recipientId, content, type, contextId, title } = params

  // Consistent participant ordering (lower UUID first)
  const participant1 = senderId < recipientId ? senderId : recipientId
  const participant2 = senderId < recipientId ? recipientId : senderId
  const isParticipant1 = senderId === participant1

  return db.transaction(async (tx) => {
    // 1. Find existing conversation
    const contextCondition = contextId
      ? eq(conversations.contextId, contextId)
      : isNull(conversations.contextId)

    const [existing] = await tx
      .select({ id: conversations.id })
      .from(conversations)
      .where(and(
        eq(conversations.participant1, participant1),
        eq(conversations.participant2, participant2),
        eq(conversations.type, type),
        contextCondition,
      ))

    let conversationId: string
    let isNewConversation = false

    if (existing) {
      conversationId = existing.id
    } else {
      // 2. Create new conversation
      const [newConv] = await tx
        .insert(conversations)
        .values({
          participant1,
          participant2,
          type,
          contextId: contextId || undefined,
          title: title || undefined,
          lastMessagePreview: content.substring(0, 100),
        })
        .returning({ id: conversations.id })
      conversationId = newConv.id
      isNewConversation = true
    }

    // 3. Insert message
    const [newMessage] = await tx
      .insert(messages)
      .values({
        conversationId,
        senderId,
        recipientId,
        content,
      })
      .returning({ id: messages.id, createdAt: messages.createdAt })

    // 4. Update conversation metadata
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

    // 5. Update appointment context metadata if applicable
    if (contextId && type === CONVERSATION_TYPES.APPOINTMENT) {
      await tx
        .update(serviceAppointments)
        .set({
          messagesCount: sql`${serviceAppointments.messagesCount} + 1`,
          lastContactAt: sql`CURRENT_TIMESTAMP`,
        })
        .where(eq(serviceAppointments.id, contextId))
        .catch(err => logger.warn('Failed to update appointment metadata', { error: err, contextId }))
    }

    return {
      conversationId,
      messageId: newMessage.id,
      createdAt: newMessage.createdAt || new Date().toISOString(),
      isNewConversation,
    }
  })
}
