-- ============================================================================
-- RevampIT Hirn AI RAG System Migration
-- Created: 2026-01-20
-- Description: Sets up pgvector and tables for AI-powered knowledge retrieval
-- ============================================================================

-- ============================================================================
-- 1. ENABLE PGVECTOR EXTENSION
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS vector;

-- ============================================================================
-- 2. CREATE DOCUMENTS TABLE
-- Stores original documents with metadata
-- ============================================================================

CREATE TABLE IF NOT EXISTS hirn_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Document identification
    source_path TEXT NOT NULL UNIQUE,  -- File path or unique identifier
    source_type TEXT NOT NULL,         -- 'markdown', 'code', 'text', 'json'

    -- Content
    title TEXT,
    content TEXT NOT NULL,
    content_hash TEXT NOT NULL,        -- SHA256 hash for change detection

    -- Metadata
    metadata JSONB DEFAULT '{}',       -- Flexible metadata storage

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    indexed_at TIMESTAMPTZ             -- When embeddings were last generated
);

-- ============================================================================
-- 3. CREATE CHUNKS TABLE
-- Stores document chunks with embeddings for vector search
-- ============================================================================

CREATE TABLE IF NOT EXISTS hirn_chunks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Parent document reference
    document_id UUID NOT NULL REFERENCES hirn_documents(id) ON DELETE CASCADE,

    -- Chunk content
    content TEXT NOT NULL,
    chunk_index INTEGER NOT NULL,      -- Order within document

    -- Vector embedding (1536 dimensions for OpenAI, 768 for many open models)
    -- Using 768 as default for compatibility with local models like nomic-embed-text
    embedding vector(768),

    -- Metadata
    metadata JSONB DEFAULT '{}',

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 4. CREATE CHAT HISTORY TABLE
-- Stores admin chat conversations for context
-- ============================================================================

CREATE TABLE IF NOT EXISTS hirn_chat_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- User reference
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,

    -- Conversation
    session_id UUID NOT NULL,          -- Groups messages in a conversation
    role TEXT NOT NULL,                -- 'user', 'assistant', 'system'
    content TEXT NOT NULL,

    -- Context used for this response
    context_chunks UUID[],             -- Array of chunk IDs used

    -- Provider info
    provider TEXT,                     -- 'groq', 'ollama', 'openai', etc.
    model TEXT,                        -- Model name used

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 5. CREATE PROVIDER SETTINGS TABLE
-- Stores user/system AI provider preferences
-- ============================================================================

CREATE TABLE IF NOT EXISTS hirn_provider_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Scope
    scope TEXT NOT NULL DEFAULT 'system',  -- 'system' or 'user'
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,

    -- Provider configuration
    provider TEXT NOT NULL,            -- 'groq', 'ollama', 'openai', 'anthropic', 'google'
    is_enabled BOOLEAN DEFAULT true,
    is_default BOOLEAN DEFAULT false,

    -- Settings (API keys stored encrypted in practice)
    settings JSONB DEFAULT '{}',       -- base_url, model preferences, etc.

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    -- Constraints
    UNIQUE(scope, user_id, provider),
    CHECK (scope = 'system' OR user_id IS NOT NULL)
);

-- ============================================================================
-- 6. CREATE INDEXES
-- ============================================================================

-- Document indexes
CREATE INDEX IF NOT EXISTS idx_hirn_documents_source_path ON hirn_documents(source_path);
CREATE INDEX IF NOT EXISTS idx_hirn_documents_source_type ON hirn_documents(source_type);
CREATE INDEX IF NOT EXISTS idx_hirn_documents_content_hash ON hirn_documents(content_hash);

-- Chunk indexes
CREATE INDEX IF NOT EXISTS idx_hirn_chunks_document_id ON hirn_chunks(document_id);

-- Vector similarity index (IVFFlat for faster approximate search)
-- Note: Create this AFTER inserting initial data for better index quality
-- For small datasets (<10k), exact search is fine, so we use HNSW
CREATE INDEX IF NOT EXISTS idx_hirn_chunks_embedding ON hirn_chunks
    USING hnsw (embedding vector_cosine_ops);

-- Chat history indexes
CREATE INDEX IF NOT EXISTS idx_hirn_chat_history_user_id ON hirn_chat_history(user_id);
CREATE INDEX IF NOT EXISTS idx_hirn_chat_history_session_id ON hirn_chat_history(session_id);
CREATE INDEX IF NOT EXISTS idx_hirn_chat_history_created_at ON hirn_chat_history(created_at);

-- Provider settings indexes
CREATE INDEX IF NOT EXISTS idx_hirn_provider_settings_scope ON hirn_provider_settings(scope);
CREATE INDEX IF NOT EXISTS idx_hirn_provider_settings_user_id ON hirn_provider_settings(user_id);

-- ============================================================================
-- 7. ADD UPDATED_AT TRIGGERS
-- ============================================================================

CREATE TRIGGER update_hirn_documents_updated_at
BEFORE UPDATE ON hirn_documents
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_hirn_provider_settings_updated_at
BEFORE UPDATE ON hirn_provider_settings
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 8. INSERT DEFAULT PROVIDER SETTINGS
-- ============================================================================

-- Groq as default (free tier available)
INSERT INTO hirn_provider_settings (scope, provider, is_enabled, is_default, settings)
VALUES ('system', 'groq', true, true, '{
    "model": "llama-3.3-70b-versatile",
    "description": "Free tier, fast inference"
}')
ON CONFLICT DO NOTHING;

-- Ollama for self-hosting
INSERT INTO hirn_provider_settings (scope, provider, is_enabled, is_default, settings)
VALUES ('system', 'ollama', true, false, '{
    "base_url": "http://localhost:11434",
    "model": "llama3.2",
    "embedding_model": "nomic-embed-text",
    "description": "Self-hosted, privacy-focused"
}')
ON CONFLICT DO NOTHING;

-- OpenRouter for variety
INSERT INTO hirn_provider_settings (scope, provider, is_enabled, is_default, settings)
VALUES ('system', 'openrouter', false, false, '{
    "model": "meta-llama/llama-3.3-70b-instruct",
    "description": "Pay-per-token, many models available"
}')
ON CONFLICT DO NOTHING;

-- ============================================================================
-- 9. COMMENTS
-- ============================================================================

COMMENT ON TABLE hirn_documents IS 'Stores original documents for RAG knowledge base';
COMMENT ON TABLE hirn_chunks IS 'Stores document chunks with vector embeddings for similarity search';
COMMENT ON TABLE hirn_chat_history IS 'Stores admin chat conversations for context';
COMMENT ON TABLE hirn_provider_settings IS 'Stores AI provider configurations';
COMMENT ON COLUMN hirn_chunks.embedding IS 'Vector embedding (768 dimensions) for semantic search';
