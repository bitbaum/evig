/**
 * Ollama AI Provider
 *
 * Self-hosted AI with full privacy. Supports both chat and embeddings.
 * Default models:
 * - Chat: llama3.2
 * - Embeddings: nomic-embed-text (768 dimensions)
 */

import { logger } from '@/lib/logger'
import type {
  AIProvider,
  ChatCompletionOptions,
  ChatCompletionResponse,
  EmbeddingOptions,
  EmbeddingResponse,
  ProviderConfig,
} from './types'

const DEFAULT_BASE_URL = 'http://localhost:11434'
const DEFAULT_MODEL = 'llama3.2'
const DEFAULT_EMBEDDING_MODEL = 'nomic-embed-text'

export class OllamaProvider implements AIProvider {
  name = 'ollama'
  private baseUrl: string
  private model: string
  private embeddingModel: string

  constructor(config: ProviderConfig = {}) {
    this.baseUrl = config.baseUrl || process.env.OLLAMA_BASE_URL || DEFAULT_BASE_URL
    this.model = config.model || process.env.OLLAMA_MODEL || DEFAULT_MODEL
    this.embeddingModel = config.embeddingModel || process.env.OLLAMA_EMBEDDING_MODEL || DEFAULT_EMBEDDING_MODEL
  }

  async chat(options: ChatCompletionOptions): Promise<ChatCompletionResponse> {
    const response = await fetch(`${this.baseUrl}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: this.model,
        messages: options.messages,
        stream: false,
        options: {
          temperature: options.temperature ?? 0.7,
          num_predict: options.maxTokens ?? 2048,
        },
      }),
    })

    if (!response.ok) {
      const error = await response.text()
      logger.error('Ollama API error', { status: response.status, error })
      throw new Error(`Ollama API error: ${response.status} - ${error}`)
    }

    const data = await response.json()

    return {
      content: data.message?.content || '',
      usage: data.eval_count ? {
        promptTokens: data.prompt_eval_count || 0,
        completionTokens: data.eval_count || 0,
        totalTokens: (data.prompt_eval_count || 0) + (data.eval_count || 0),
      } : undefined,
      model: this.model,
      provider: this.name,
    }
  }

  async embed(options: EmbeddingOptions): Promise<EmbeddingResponse> {
    const inputs = Array.isArray(options.input) ? options.input : [options.input]
    const embeddings: number[][] = []

    // Ollama processes one embedding at a time
    for (const input of inputs) {
      const response = await fetch(`${this.baseUrl}/api/embeddings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: options.model || this.embeddingModel,
          prompt: input,
        }),
      })

      if (!response.ok) {
        const error = await response.text()
        logger.error('Ollama embeddings error', { status: response.status, error })
        throw new Error(`Ollama embeddings error: ${response.status} - ${error}`)
      }

      const data = await response.json()
      embeddings.push(data.embedding)
    }

    return {
      embeddings,
      model: options.model || this.embeddingModel,
      provider: this.name,
      dimensions: embeddings[0]?.length || 768,
    }
  }

  async isAvailable(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/api/tags`)
      return response.ok
    } catch {
      return false
    }
  }

  getDefaultModel(): string {
    return DEFAULT_MODEL
  }

  getDefaultEmbeddingModel(): string {
    return DEFAULT_EMBEDDING_MODEL
  }

  /**
   * Pull a model if it's not already available
   */
  async pullModel(model: string): Promise<void> {
    logger.info('Pulling Ollama model', { model })

    const response = await fetch(`${this.baseUrl}/api/pull`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: model }),
    })

    if (!response.ok) {
      throw new Error(`Failed to pull model ${model}`)
    }

    // Wait for the pull to complete (streaming response)
    const reader = response.body?.getReader()
    if (reader) {
      while (true) {
        const { done } = await reader.read()
        if (done) break
      }
    }

    logger.info('Model pulled successfully', { model })
  }

  /**
   * List available models
   */
  async listModels(): Promise<string[]> {
    const response = await fetch(`${this.baseUrl}/api/tags`)
    if (!response.ok) {
      throw new Error('Failed to list Ollama models')
    }
    const data = await response.json()
    return data.models?.map((m: { name: string }) => m.name) || []
  }
}
