import { NextRequest } from 'next/server'
import { auth } from '@/auth'
import { db } from '@/db'
import { conversations, messages, users } from '@/db/schema'
import { eq, and, or, sql, desc } from 'drizzle-orm'
import { apiError, apiSuccess, apiUnauthorized, apiBadRequest, parsePagination } from '@/lib/api/helpers'
import { ERROR_MESSAGES } from '@/config/error-messages'
import { validateBody, CreateConversationSchema } from '@/lib/schemas'

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return apiUnauthorized(ERROR_MESSAGES.UNAUTHORIZED)
    }

    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type')
    const { limit, offset } = parsePagination(request, { defaultLimit: 20 })

    const conditions = [
      or(
        eq(conversations.participant1, session.user.id),
        eq(conversations.participant2, session.user.id)
      )!,
      eq(conversations.isActive, true),
    ]

    if (type) {
      conditions.push(eq(conversations.type, type))
    }

    const where = and(...conditions)

    const rows = await db
      .select({
        id: conversations.id,
        participant_1: conversations.participant1,
        participant_2: conversations.participant2,
        type: conversations.type,
        context_id: conversations.contextId,
        title: conversations.title,
        last_message_preview: conversations.lastMessagePreview,
        last_message_at: conversations.lastMessageAt,
        is_active: conversations.isActive,
        created_at: conversations.createdAt,
        updated_at: conversations.updatedAt,
        unread_count_1: conversations.unreadCount1,
        unread_count_2: conversations.unreadCount2,
        // Get other participant info via subquery
        other_participant: sql<Record<string, unknown>>`
          CASE
            WHEN ${conversations.participant1} = ${session.user.id} THEN (
              SELECT json_build_object(
                'id', u2.id, 'name', COALESCE(u2.name, u2.email), 'email', u2.email, 'role', u2.role
              ) FROM users u2 WHERE u2.id = ${conversations.participant2}
            )
            ELSE (
              SELECT json_build_object(
                'id', u1.id, 'name', COALESCE(u1.name, u1.email), 'email', u1.email, 'role', u1.role
              ) FROM users u1 WHERE u1.id = ${conversations.participant1}
            )
          END`,
        unread_count: sql<number>`
          CASE
            WHEN ${conversations.participant1} = ${session.user.id} THEN ${conversations.unreadCount1}
            ELSE ${conversations.unreadCount2}
          END`,
      })
      .from(conversations)
      .where(where)
      .orderBy(desc(conversations.lastMessageAt))
      .limit(limit)
      .offset(offset)

    return apiSuccess({
      conversations: rows,
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

    const body = await request.json()
    const validation = validateBody(CreateConversationSchema, body)
    if (!validation.success) return validation.error
    const { participantId, type, contextId, initialMessage } = validation.data

    if (participantId === session.user.id) {
      return apiBadRequest('Sie können keine Unterhaltung mit sich selbst starten')
    }

    // Ensure consistent ordering of participants
    const [participant1, participant2] = [session.user.id, participantId].sort()

    // Check if conversation already exists
    const conditions = [
      eq(conversations.participant1, participant1),
      eq(conversations.participant2, participant2),
      eq(conversations.type, type),
    ]
    if (contextId) {
      conditions.push(eq(conversations.contextId, contextId))
    }

    const [existingConv] = await db
      .select({ id: conversations.id })
      .from(conversations)
      .where(and(...conditions))

    if (existingConv) {
      return apiSuccess({
        conversation: { id: existingConv.id },
        message: 'Unterhaltung existiert bereits'
      })
    }

    // Create new conversation
    const [newConv] = await db
      .insert(conversations)
      .values({
        participant1,
        participant2,
        type,
        contextId: contextId || undefined,
        title: `Unterhaltung mit ${participantId}`,
        lastMessagePreview: initialMessage ? initialMessage.substring(0, 100) : 'Neue Unterhaltung',
      })
      .returning({ id: conversations.id })

    // Create initial message if provided
    if (initialMessage) {
      await db
        .insert(messages)
        .values({
          conversationId: newConv.id,
          senderId: session.user.id,
          recipientId: participantId,
          content: initialMessage,
        })
    }

    return apiSuccess({
      conversation: { id: newConv.id }
    })

  } catch (error) {
    return apiError(error, ERROR_MESSAGES.INTERNAL_SERVER_ERROR)
  }
}
