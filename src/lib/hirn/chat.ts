/**
 * Hirn Chat Engine
 *
 * RAG-powered chat for admin users.
 * Retrieves relevant context and generates responses.
 */

import { query } from '@/lib/auth/db'
import { logger } from '@/lib/logger'
import { getDefaultChatProvider, type Message, type ChatCompletionResponse } from './providers'
import { searchSimilar, formatContext, type RetrievalResult } from './retrieval'

export interface ChatOptions {
  sessionId: string
  userId?: string
  temperature?: number
  maxTokens?: number
  topK?: number               // Number of context chunks to retrieve
  minSimilarity?: number      // Minimum similarity threshold
  systemPrompt?: string       // Custom system prompt
}

export interface ChatResponse {
  content: string
  contextUsed: RetrievalResult[]
  usage?: {
    promptTokens: number
    completionTokens: number
    totalTokens: number
  }
  model: string
  provider: string
}

const DEFAULT_SYSTEM_PROMPT = `Du bist Hirn, ein KI-Assistent für RevampIT, einen Schweizer Non-Profit-Verein für nachhaltige IT.

Du hilfst Administratoren bei Fragen zu:
- Interne Prozesse und Dokumentation
- Technische Details der Plattform
- Projekt-Informationen und Kontext

Verwende den bereitgestellten Kontext, um präzise und hilfreiche Antworten zu geben.
Wenn du dir bei einer Antwort nicht sicher bist, sage es ehrlich.
Antworte auf Deutsch, es sei denn, der Benutzer stellt die Frage auf Englisch.

Wichtig:
- Verwende "ss" statt "ß" (Schweizer Deutsch)
- Sei präzise und hilfreich
- Verweise auf die Quellen, wenn relevant`

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
    topK = 5,
    minSimilarity = 0.5,
    systemPrompt = DEFAULT_SYSTEM_PROMPT,
  } = options

  // Retrieve relevant context
  const contextResults = await searchSimilar(message, {
    topK,
    minSimilarity,
  })

  const contextText = formatContext(contextResults)

  // Get chat history for this session
  const historyResult = await query<{ role: string; content: string }>(
    `SELECT role, content FROM hirn_chat_history
     WHERE session_id = $1
     ORDER BY created_at ASC
     LIMIT 20`,
    [sessionId]
  )

  const history: Message[] = historyResult.rows.map(h => ({
    role: h.role as 'user' | 'assistant' | 'system',
    content: h.content,
  }))

  // Build messages array
  const messages: Message[] = [
    {
      role: 'system',
      content: `${systemPrompt}\n\n--- Relevanter Kontext ---\n\n${contextText}`,
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

  // Store the conversation in history
  const contextChunkIds = contextResults.map(r => r.chunkId)

  // Store user message
  await query(
    `INSERT INTO hirn_chat_history (user_id, session_id, role, content)
     VALUES ($1, $2, 'user', $3)`,
    [userId || null, sessionId, message]
  )

  // Store assistant response with context reference
  await query(
    `INSERT INTO hirn_chat_history (user_id, session_id, role, content, context_chunks, provider, model)
     VALUES ($1, $2, 'assistant', $3, $4, $5, $6)`,
    [
      userId || null,
      sessionId,
      response.content,
      contextChunkIds,
      response.provider,
      response.model,
    ]
  )

  logger.info('Chat response generated', {
    sessionId,
    userId,
    contextChunks: contextChunkIds.length,
    provider: response.provider,
    model: response.model,
  })

  return {
    content: response.content,
    contextUsed: contextResults,
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
     FROM hirn_chat_history
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
       (SELECT content FROM hirn_chat_history h2
        WHERE h2.session_id = h.session_id AND h2.role = 'user'
        ORDER BY created_at ASC LIMIT 1) as first_message,
       MAX(created_at) as last_activity,
       COUNT(*) as message_count
     FROM hirn_chat_history h
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
  await query(`DELETE FROM hirn_chat_history WHERE session_id = $1`, [sessionId])
  logger.info('Chat session deleted', { sessionId })
}

/**
 * Clear all chat history for a user
 */
export async function clearUserHistory(userId: string): Promise<void> {
  await query(`DELETE FROM hirn_chat_history WHERE user_id = $1`, [userId])
  logger.info('User chat history cleared', { userId })
}
