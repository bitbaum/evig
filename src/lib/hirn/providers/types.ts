/**
 * Hirn AI Provider Types
 *
 * Defines interfaces for AI providers used in the RAG system.
 * Supports chat completions and embeddings generation.
 */

export interface Message {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export interface ChatCompletionOptions {
  messages: Message[]
  temperature?: number
  maxTokens?: number
  stream?: boolean
}

export interface ChatCompletionResponse {
  content: string
  usage?: {
    promptTokens: number
    completionTokens: number
    totalTokens: number
  }
  model: string
  provider: string
}

export interface EmbeddingOptions {
  input: string | string[]
  model?: string
}

export interface EmbeddingResponse {
  embeddings: number[][]
  model: string
  provider: string
  dimensions: number
}

export interface ProviderConfig {
  apiKey?: string
  baseUrl?: string
  model?: string
  embeddingModel?: string
}

/**
 * Base interface for all AI providers
 */
export interface AIProvider {
  name: string

  /**
   * Generate a chat completion
   */
  chat(options: ChatCompletionOptions): Promise<ChatCompletionResponse>

  /**
   * Generate embeddings for text
   */
  embed(options: EmbeddingOptions): Promise<EmbeddingResponse>

  /**
   * Check if the provider is available/configured
   */
  isAvailable(): Promise<boolean>

  /**
   * Get the default model for this provider
   */
  getDefaultModel(): string

  /**
   * Get the default embedding model for this provider
   */
  getDefaultEmbeddingModel(): string
}

/**
 * Provider names supported by the system
 * - ollama: Local, free, private (self-hosted)
 * - groq: Free tier, ultra-fast inference
 * - openrouter: Pay-per-use, many models available
 */
export type ProviderName = 'ollama' | 'groq' | 'openrouter'
