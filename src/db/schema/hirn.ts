import { pgTable, uuid, text, boolean, timestamp, integer, jsonb, index, uniqueIndex } from 'drizzle-orm/pg-core'
import { users } from './auth'

// =============================================================================
// HIRN DOCUMENTS
// =============================================================================
// Stores original documents for the RAG knowledge base.

export const hirnDocuments = pgTable('hirn_documents', {
  id: uuid('id').primaryKey().defaultRandom(),

  // Document identification
  sourcePath: text('source_path').notNull().unique(),
  sourceType: text('source_type').notNull(),

  // Content
  title: text('title'),
  content: text('content').notNull(),
  contentHash: text('content_hash').notNull(),

  // Metadata
  metadata: jsonb('metadata').default({}),

  // Timestamps
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' }).defaultNow(),
  indexedAt: timestamp('indexed_at', { withTimezone: true, mode: 'string' }),
}, (table) => [
  index('idx_hirn_documents_source_path').on(table.sourcePath),
  index('idx_hirn_documents_source_type').on(table.sourceType),
  index('idx_hirn_documents_content_hash').on(table.contentHash),
])

export type HirnDocument = typeof hirnDocuments.$inferSelect
export type NewHirnDocument = typeof hirnDocuments.$inferInsert

// =============================================================================
// HIRN CHUNKS
// =============================================================================
// Stores document chunks with vector embeddings for similarity search.
// The `embedding` column uses pgvector (vector(768)) which is not natively
// supported by drizzle-orm/pg-core — use customType or raw SQL for vector ops.
// The HNSW index on embedding is managed by migration, not Drizzle.

export const hirnChunks = pgTable('hirn_chunks', {
  id: uuid('id').primaryKey().defaultRandom(),

  // Parent document
  documentId: uuid('document_id').notNull().references(() => hirnDocuments.id, { onDelete: 'cascade' }),

  // Chunk content
  content: text('content').notNull(),
  chunkIndex: integer('chunk_index').notNull(),

  // Note: embedding column (vector(768)) is managed at DB level via pgvector extension.
  // Drizzle doesn't have a native vector type — use raw SQL for similarity queries.

  // Metadata
  metadata: jsonb('metadata').default({}),

  // Timestamps
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
  index('idx_hirn_chunks_document_id').on(table.documentId),
])

export type HirnChunk = typeof hirnChunks.$inferSelect
export type NewHirnChunk = typeof hirnChunks.$inferInsert

// =============================================================================
// HIRN CHAT HISTORY
// =============================================================================
// Stores admin chat conversations for context.

export const hirnChatHistory = pgTable('hirn_chat_history', {
  id: uuid('id').primaryKey().defaultRandom(),

  // User reference
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }),

  // Conversation
  sessionId: uuid('session_id').notNull(),
  role: text('role').notNull(),
  content: text('content').notNull(),

  // Context used for this response (array of chunk UUIDs)
  // Stored as UUID[] in PostgreSQL; Drizzle reads as string[]
  contextChunks: text('context_chunks').array(),

  // Provider info
  provider: text('provider'),
  model: text('model'),

  // Timestamps
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
  index('idx_hirn_chat_history_user_id').on(table.userId),
  index('idx_hirn_chat_history_session_id').on(table.sessionId),
  index('idx_hirn_chat_history_created_at').on(table.createdAt),
])

export type HirnChatHistoryEntry = typeof hirnChatHistory.$inferSelect
export type NewHirnChatHistoryEntry = typeof hirnChatHistory.$inferInsert

// =============================================================================
// HIRN PROVIDER SETTINGS
// =============================================================================
// Stores AI provider configurations (system-wide and per-user).
// Final state includes partial unique indexes from migration 036.
// CHECK (scope = 'system' OR user_id IS NOT NULL) — validated at app layer

export const hirnProviderSettings = pgTable('hirn_provider_settings', {
  id: uuid('id').primaryKey().defaultRandom(),

  // Scope
  scope: text('scope').notNull().default('system'),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }),

  // Provider configuration
  provider: text('provider').notNull(),
  isEnabled: boolean('is_enabled').default(true),
  isDefault: boolean('is_default').default(false),

  // Settings
  settings: jsonb('settings').default({}),

  // Timestamps
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
  uniqueIndex('hirn_provider_settings_scope_user_id_provider_key')
    .on(table.scope, table.userId, table.provider),
  index('idx_hirn_provider_settings_scope').on(table.scope),
  index('idx_hirn_provider_settings_user_id').on(table.userId),
  // Partial unique indexes from 036 are managed at DB level:
  // ux_hirn_provider_settings_system_provider ON (provider) WHERE scope='system' AND user_id IS NULL
  // ux_hirn_provider_settings_user_provider ON (user_id, provider) WHERE scope='user' AND user_id IS NOT NULL
])

export type HirnProviderSetting = typeof hirnProviderSettings.$inferSelect
export type NewHirnProviderSetting = typeof hirnProviderSettings.$inferInsert
