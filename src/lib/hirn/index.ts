/**
 * Hirn AI Knowledge System
 *
 * RAG-powered AI assistant for RevampIT administrators.
 * Provides context-aware responses based on project documentation.
 *
 * Architecture:
 * - providers/: AI provider abstraction (Groq, Ollama, OpenAI, etc.)
 * - chunking.ts: Document chunking strategies
 * - ingestion.ts: Document ingestion pipeline
 * - retrieval.ts: Vector similarity search
 * - chat.ts: RAG chat engine
 *
 * Usage:
 * ```typescript
 * import { chat, ingestFile, searchSimilar } from '@/lib/hirn'
 *
 * // Chat with context
 * const response = await chat('Was ist RevampIT?', {
 *   sessionId: 'session-123',
 *   userId: 'user-456',
 * })
 *
 * // Ingest a file
 * await ingestFile('/path/to/doc.md')
 *
 * // Search for similar content
 * const results = await searchSimilar('nachhaltige IT')
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
