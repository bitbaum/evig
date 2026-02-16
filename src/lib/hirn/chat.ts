/**
 * Hirn Chat Engine
 *
 * AI chat for admin users with baked-in organizational knowledge.
 */

import { query } from '@/lib/auth/db'
import { logger } from '@/lib/logger'
import { TABLE_NAMES } from '@/config/database'
import { getDefaultChatProvider, type Message } from './providers'
import { SYSTEM_PROMPT } from './system-prompt'

export interface ChatOptions {
  sessionId: string
  userId?: string
  temperature?: number
  maxTokens?: number
  systemPrompt?: string       // Custom system prompt override
}

export interface ChatResponse {
  content: string
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
  const historyResult = await query<{ role: string; content: string }>(
    `SELECT role, content FROM ${TABLE_NAMES.HIRN_CHAT_HISTORY}
     WHERE session_id = $1 AND (user_id = $2 OR user_id IS NULL)
     ORDER BY created_at ASC
     LIMIT 20`,
    [sessionId, userId || null]
  )

  const history: Message[] = historyResult.rows.map(h => ({
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
    await query(
      `INSERT INTO ${TABLE_NAMES.HIRN_CHAT_HISTORY} (user_id, session_id, role, content)
       VALUES ($1, $2, 'user', $3)`,
      [userId || null, sessionId, message]
    )

    // Store assistant response
    await query(
      `INSERT INTO ${TABLE_NAMES.HIRN_CHAT_HISTORY} (user_id, session_id, role, content, provider, model)
       VALUES ($1, $2, 'assistant', $3, $4, $5)`,
      [
        userId || null,
        sessionId,
        response.content,
        response.provider,
        response.model,
      ]
    )
  } catch (dbError) {
    // Log but don't throw — the AI response is still valid
    logger.error('Failed to save chat history', {
      error: dbError instanceof Error ? dbError.message : 'Unknown DB error',
      sessionId,
    })
  }

  logger.info('Chat response generated', {
    sessionId,
    userId,
    provider: response.provider,
    model: response.model,
  })

  return {
    content: response.content,
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
  createdAt: Date
  provider?: string
  model?: string
}>> {
  const result = await query<{
    id: string
    role: string
    content: string
    created_at: Date
    provider: string | null
    model: string | null
  }>(
    `SELECT id, role, content, created_at, provider, model
     FROM ${TABLE_NAMES.HIRN_CHAT_HISTORY}
     WHERE session_id = $1
     ORDER BY created_at ASC`,
    [sessionId]
  )

  return result.rows.map(r => ({
    id: r.id,
    role: r.role,
    content: r.content,
    createdAt: r.created_at,
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
  lastActivity: Date
  messageCount: number
}>> {
  const result = await query<{
    session_id: string
    first_message: string
    last_activity: Date
    message_count: string
  }>(
    `SELECT
       session_id,
       (SELECT content FROM ${TABLE_NAMES.HIRN_CHAT_HISTORY} h2
        WHERE h2.session_id = h.session_id AND h2.role = 'user'
        ORDER BY created_at ASC LIMIT 1) as first_message,
       MAX(created_at) as last_activity,
       COUNT(*) as message_count
     FROM ${TABLE_NAMES.HIRN_CHAT_HISTORY} h
     WHERE user_id = $1
     GROUP BY session_id
     ORDER BY last_activity DESC
     LIMIT $2`,
    [userId, limit]
  )

  return result.rows.map(r => ({
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
  await query(`DELETE FROM ${TABLE_NAMES.HIRN_CHAT_HISTORY} WHERE session_id = $1`, [sessionId])
  logger.info('Chat session deleted', { sessionId })
}

/**
 * Clear all chat history for a user
 */
export async function clearUserHistory(userId: string): Promise<void> {
  await query(`DELETE FROM ${TABLE_NAMES.HIRN_CHAT_HISTORY} WHERE user_id = $1`, [userId])
  logger.info('User chat history cleared', { userId })
}
