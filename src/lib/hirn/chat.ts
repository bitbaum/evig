/**
 * Hirn Chat Engine
 *
 * AI chat for admin users with baked-in organizational knowledge.
 */

import { db } from '@/db'
import { hirnChatHistory } from '@/db/schema'
import { eq, and, asc, desc, sql, or, isNull, count } from 'drizzle-orm'
import { logger } from '@/lib/logger'
import { getDefaultChatProvider, type Message } from './providers'
import { SYSTEM_PROMPT } from './system-prompt'
import { parseActionEnvelope, stripActionBlock, type HirnActionCard } from './action-cockpit'

export interface ChatOptions {
  sessionId: string
  userId?: string
  temperature?: number
  maxTokens?: number
  systemPrompt?: string       // Custom system prompt override
}

export interface ChatResponse {
  content: string
  actions?: HirnActionCard[]
  usage?: {
    promptTokens: number
    completionTokens: number
    totalTokens: number
  }
  model: string
  provider: string
}

/**
 * Send a chat message and get a response
 */
export async function chat(
  message: string,
  options: ChatOptions
): Promise<ChatResponse> {
  const {
    sessionId,
    userId,
    temperature = 0.7,
    maxTokens = 2048,
    systemPrompt = SYSTEM_PROMPT,
  } = options

  // Get chat history for this session (scoped by user_id for defense in depth)
  const userCondition = userId
    ? or(eq(hirnChatHistory.userId, userId), isNull(hirnChatHistory.userId))
    : isNull(hirnChatHistory.userId)

  const historyRows = await db
    .select({ role: hirnChatHistory.role, content: hirnChatHistory.content })
    .from(hirnChatHistory)
    .where(and(eq(hirnChatHistory.sessionId, sessionId), userCondition))
    .orderBy(asc(hirnChatHistory.createdAt))
    .limit(20)

  const history: Message[] = historyRows.map(h => ({
    role: h.role as 'user' | 'assistant' | 'system',
    content: h.content,
  }))

  // Build messages array
  const messages: Message[] = [
    {
      role: 'system',
      content: systemPrompt,
    },
    ...history,
    {
      role: 'user',
      content: message,
    },
  ]

  // Get the chat provider and generate response
  const provider = await getDefaultChatProvider(userId)
  const response = await provider.chat({
    messages,
    temperature,
    maxTokens,
  })

  // Store conversation history (best-effort — don't let DB errors kill the response)
  try {
    // Store user message
    await db.insert(hirnChatHistory).values({
      userId: userId || null,
      sessionId,
      role: 'user',
      content: message,
    })

    // Store assistant response
    await db.insert(hirnChatHistory).values({
      userId: userId || null,
      sessionId,
      role: 'assistant',
      content: response.content,
      provider: response.provider,
      model: response.model,
    })
  } catch (dbError) {
    // Log but don't throw — the AI response is still valid
    logger.error('Failed to save chat history', {
      error: dbError instanceof Error ? dbError.message : 'Unknown DB error',
      sessionId,
    })
  }

  const parsedActions = parseActionEnvelope(response.content)
  const cleanedContent = stripActionBlock(response.content)

  logger.info('Chat response generated', {
    sessionId,
    userId,
    provider: response.provider,
    model: response.model,
    actionCount: parsedActions.actions.length,
    actionParsingError: parsedActions.parsingError,
  })

  return {
    content: cleanedContent,
    actions: parsedActions.actions,
    usage: response.usage,
    model: response.model,
    provider: response.provider,
  }
}

/**
 * Get chat history for a session
 */
export async function getChatHistory(
  sessionId: string
): Promise<Array<{
  id: string
  role: string
  content: string
  createdAt: string
  provider?: string
  model?: string
}>> {
  const rows = await db
    .select({
      id: hirnChatHistory.id,
      role: hirnChatHistory.role,
      content: hirnChatHistory.content,
      createdAt: hirnChatHistory.createdAt,
      provider: hirnChatHistory.provider,
      model: hirnChatHistory.model,
    })
    .from(hirnChatHistory)
    .where(eq(hirnChatHistory.sessionId, sessionId))
    .orderBy(asc(hirnChatHistory.createdAt))

  return rows.map(r => ({
    id: r.id,
    role: r.role,
    content: r.content,
    createdAt: r.createdAt!,
    provider: r.provider || undefined,
    model: r.model || undefined,
  }))
}

/**
 * Get all sessions for a user
 */
export async function getUserSessions(
  userId: string,
  limit = 20
): Promise<Array<{
  sessionId: string
  firstMessage: string
  lastActivity: string
  messageCount: number
}>> {
  const h = hirnChatHistory
  const rows = await db.execute<{
    session_id: string
    first_message: string | null
    last_activity: string
    message_count: string
  }>(sql`
    SELECT
      ${h.sessionId} as session_id,
      (SELECT ${h.content} FROM ${h} h2
       WHERE h2.session_id = h.session_id AND h2.role = 'user'
       ORDER BY h2.created_at ASC LIMIT 1) as first_message,
      MAX(${h.createdAt}) as last_activity,
      COUNT(*) as message_count
    FROM ${h}
    WHERE ${h.userId} = ${userId}
    GROUP BY ${h.sessionId}
    ORDER BY last_activity DESC
    LIMIT ${limit}
  `)

  return rows.rows.map(r => ({
    sessionId: r.session_id,
    firstMessage: r.first_message || 'Neues Gespräch',
    lastActivity: r.last_activity,
    messageCount: parseInt(r.message_count),
  }))
}

/**
 * Delete a chat session
 */
export async function deleteSession(sessionId: string): Promise<void> {
  await db.delete(hirnChatHistory).where(eq(hirnChatHistory.sessionId, sessionId))
  logger.info('Chat session deleted', { sessionId })
}

/**
 * Clear all chat history for a user
 */
export async function clearUserHistory(userId: string): Promise<void> {
  await db.delete(hirnChatHistory).where(eq(hirnChatHistory.userId, userId))
  logger.info('User chat history cleared', { userId })
}
