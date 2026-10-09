/**
 * Hirn Chat Engine
 *
 * AI chat for admin users with baked-in organizational knowledge.
 */

import { db } from '@/db';
import { hirnChatHistory } from '@/db/schema';
import { eq, and, asc, desc, sql, or, isNull, count } from 'drizzle-orm';
import { logger } from '@/lib/logger';
import { getChatResponse, type Message } from './providers';
import { SYSTEM_PROMPT } from './system-prompt';
import { parseActionEnvelope, stripActionBlock, type HirnActionCard } from './action-cockpit';
import { splitSuggestedReplies, type AnswerWithReplies } from './replies';
import { API_DEFAULTS } from '@/config/api-defaults';

export interface ChatOptions {
  sessionId: string;
  userId?: string;
  temperature?: number;
  maxTokens?: number;
  systemPrompt?: string; // Custom system prompt override
}

export interface ChatResponse {
  content: string;
  /** Suggested next messages (see ./replies); empty when none. */
  replies: string[];
  actions?: HirnActionCard[];
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  model: string;
  provider: string;
}

/**
 * What a person sees of a stored assistant answer: the machine blocks it may
 * carry (action envelope, suggested replies) taken out. History keeps the raw
 * answer so the model sees its own format on the next turn.
 */
function presentAssistantAnswer(raw: string): AnswerWithReplies {
  return splitSuggestedReplies(stripActionBlock(raw));
}

/**
 * Send a chat message and get a response
 */
export async function chat(message: string, options: ChatOptions): Promise<ChatResponse> {
  const {
    sessionId,
    userId,
    temperature = 0.7,
    maxTokens = 2048,
    systemPrompt = SYSTEM_PROMPT,
  } = options;

  // Get chat history for this session (scoped by user_id for defense in depth)
  const userCondition = userId
    ? or(eq(hirnChatHistory.userId, userId), isNull(hirnChatHistory.userId))
    : isNull(hirnChatHistory.userId);

  const historyRows = await db
    .select({ role: hirnChatHistory.role, content: hirnChatHistory.content })
    .from(hirnChatHistory)
    .where(and(eq(hirnChatHistory.sessionId, sessionId), userCondition))
    .orderBy(asc(hirnChatHistory.createdAt))
    .limit(API_DEFAULTS.CHAT_HISTORY_LIMIT);

  const history: Message[] = historyRows.map((h) => ({
    role: h.role as 'user' | 'assistant' | 'system',
    content: h.content,
  }));

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
  ];

  // Get the chat provider and generate response
  const response = await getChatResponse({ messages, temperature, maxTokens }, userId);

  // Store conversation history (best-effort — don't let DB errors kill the response)
  try {
    // Store user message
    await db.insert(hirnChatHistory).values({
      userId: userId || null,
      sessionId,
      role: 'user',
      content: message,
    });

    // Store assistant response
    await db.insert(hirnChatHistory).values({
      userId: userId || null,
      sessionId,
      role: 'assistant',
      content: response.content,
      provider: response.provider,
      model: response.model,
    });
  } catch (dbError) {
    // Log but don't throw — the AI response is still valid
    logger.error('Failed to save chat history', {
      error: dbError instanceof Error ? dbError.message : 'Unknown DB error',
      sessionId,
    });
  }

  const parsedActions = parseActionEnvelope(response.content);
  const { text: cleanedContent, replies } = presentAssistantAnswer(response.content);

  logger.info('Chat response generated', {
    sessionId,
    userId,
    provider: response.provider,
    model: response.model,
    actionCount: parsedActions.actions.length,
    actionParsingError: parsedActions.parsingError,
  });

  return {
    content: cleanedContent,
    replies,
    actions: parsedActions.actions,
    usage: response.usage,
    model: response.model,
    provider: response.provider,
  };
}

/**
 * Get chat history for a session
 */
export async function getChatHistory(
  sessionId: string,
  userId: string,
): Promise<
  Array<{
    id: string;
    role: string;
    content: string;
    createdAt: string;
    provider?: string;
    model?: string;
    replies?: string[];
  }>
> {
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
    // Scope by owner — session UUIDs are not authorization; without the
    // userId filter any staff member could read another's chat.
    .where(and(eq(hirnChatHistory.sessionId, sessionId), eq(hirnChatHistory.userId, userId)))
    .orderBy(asc(hirnChatHistory.createdAt));

  return rows.map((r) => {
    // Stored assistant answers are raw: without this the history view showed
    // the action envelope's JSON (and now the replies block) as message text.
    const shown = r.role === 'assistant' ? presentAssistantAnswer(r.content) : null;
    return {
      id: r.id,
      role: r.role,
      content: shown ? shown.text : r.content,
      createdAt: r.createdAt!,
      provider: r.provider || undefined,
      model: r.model || undefined,
      ...(shown ? { replies: shown.replies } : {}),
    };
  });
}

/**
 * Get all sessions for a user
 */
export async function getUserSessions(
  userId: string,
  limit = 20,
): Promise<
  Array<{
    sessionId: string;
    firstMessage: string;
    lastActivity: string;
    messageCount: number;
  }>
> {
  const h = hirnChatHistory;
  const rows = await db.execute<{
    session_id: string;
    first_message: string | null;
    last_activity: string;
    message_count: string;
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
  `);

  return rows.rows.map((r) => ({
    sessionId: r.session_id,
    firstMessage: r.first_message || 'Neues Gespräch',
    lastActivity: r.last_activity,
    messageCount: parseInt(r.message_count),
  }));
}

/**
 * Delete a chat session
 */
export async function deleteSession(sessionId: string, userId: string): Promise<void> {
  // Scope by owner (see getChatHistory).
  await db
    .delete(hirnChatHistory)
    .where(and(eq(hirnChatHistory.sessionId, sessionId), eq(hirnChatHistory.userId, userId)));
  logger.info('Chat session deleted', { sessionId, userId });
}

/**
 * Clear all chat history for a user
 */
export async function clearUserHistory(userId: string): Promise<void> {
  await db.delete(hirnChatHistory).where(eq(hirnChatHistory.userId, userId));
  logger.info('User chat history cleared', { userId });
}
