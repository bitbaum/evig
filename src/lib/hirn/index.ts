/**
 * Hirn AI Knowledge System
 *
 * AI assistant for RevampIT administrators with baked-in organizational knowledge.
 * The system prompt contains all org data directly (no runtime retrieval needed).
 *
 * Architecture:
 * - system-prompt.ts: Baked-in organizational knowledge
 * - chat.ts: Chat engine (system prompt + conversation history)
 * - providers/: AI provider abstraction (Groq, Ollama, OpenAI, etc.)
 * - ingestion.ts: Document ingestion pipeline (for document management)
 * - retrieval.ts: Vector similarity search (for document management)
 * - chunking.ts: Document chunking strategies
 *
 * Usage:
 * ```typescript
 * import { chat } from '@/lib/hirn'
 *
 * const response = await chat('Was ist RevampIT?', {
 *   sessionId: 'session-123',
 *   userId: 'user-456',
 * })
 * ```
 */

// Re-export main functions
export { chat, getChatHistory, getUserSessions, deleteSession, clearUserHistory } from './chat'
export type { ChatOptions, ChatResponse } from './chat'

export {
  ingestDocument,
  ingestFile,
  ingestDirectory,
  getIngestionStats,
} from './ingestion'
export type { DocumentInput, IngestResult } from './ingestion'

export {
  searchSimilar,
  formatContext,
  listDocuments,
  deleteDocument,
} from './retrieval'
export type { RetrievalResult, RetrievalOptions } from './retrieval'

export { chunkText, chunkMarkdown, chunkCode, estimateTokens } from './chunking'
export type { Chunk, ChunkOptions } from './chunking'

export {
  createProvider,
  getDefaultChatProvider,
  getEmbeddingProvider,
  generateEmbeddings,
  getProviderSettings,
  updateProviderSettings,
  setDefaultProvider,
  addUserProvider,
} from './providers'
export type {
  AIProvider,
  ProviderName,
  ProviderConfig,
  Message,
  ChatCompletionOptions,
  ChatCompletionResponse,
  EmbeddingOptions,
  EmbeddingResponse,
} from './providers'
