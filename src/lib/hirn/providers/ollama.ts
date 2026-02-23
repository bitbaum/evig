/**
 * Ollama AI Provider
 *
 * Self-hosted AI with full privacy. Supports both chat and embeddings.
 * Default models:
 * - Chat: llama3.2
 * - Embeddings: nomic-embed-text (768 dimensions)
 */

import { logger } from '@/lib/logger'
import { OLLAMA_URL } from '@/config/urls'
import type {
  AIProvider,
  ChatCompletionOptions,
  ChatCompletionResponse,
  EmbeddingOptions,
  EmbeddingResponse,
  ProviderConfig,
} from './types'

const DEFAULT_BASE_URL = OLLAMA_URL
const DEFAULT_MODEL = 'llama3.2'
const DEFAULT_EMBEDDING_MODEL = 'nomic-embed-text'
const REQUEST_TIMEOUT_MS = 60_000  // Ollama can be slower (local)
const EMBEDDING_TIMEOUT_MS = 30_000
const AVAILABILITY_TIMEOUT_MS = 3_000

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
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)

    try {
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
        signal: controller.signal,
      })

      if (!response.ok) {
        const error = await response.text().catch(() => '')
        logger.error('Ollama API error', { status: response.status, error: error.substring(0, 200) })
        throw new Error(`Ollama API error: ${response.status} - ${error.substring(0, 200)}`)
      }

      let data: Record<string, unknown>
      try {
        data = await response.json()
      } catch {
        throw new Error('Ollama returned invalid JSON response')
      }

      const message = data.message as { content?: string } | undefined

      return {
        content: message?.content || '',
        usage: data.eval_count ? {
          promptTokens: (data.prompt_eval_count as number) || 0,
          completionTokens: (data.eval_count as number) || 0,
          totalTokens: ((data.prompt_eval_count as number) || 0) + ((data.eval_count as number) || 0),
        } : undefined,
        model: this.model,
        provider: this.name,
      }
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error(`Ollama Zeitüberschreitung nach ${REQUEST_TIMEOUT_MS / 1000}s`)
      }
      throw error
    } finally {
      clearTimeout(timeoutId)
    }
  }

  async embed(options: EmbeddingOptions): Promise<EmbeddingResponse> {
    const inputs = Array.isArray(options.input) ? options.input : [options.input]
    const embeddings: number[][] = []

    // Ollama processes one embedding at a time
    for (const input of inputs) {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), EMBEDDING_TIMEOUT_MS)

      try {
        const response = await fetch(`${this.baseUrl}/api/embeddings`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: options.model || this.embeddingModel,
            prompt: input,
          }),
          signal: controller.signal,
        })

        if (!response.ok) {
          const error = await response.text().catch(() => '')
          logger.error('Ollama embeddings error', { status: response.status, error: error.substring(0, 200) })
          throw new Error(`Ollama embeddings error: ${response.status} - ${error.substring(0, 200)}`)
        }

        let data: Record<string, unknown>
        try {
          data = await response.json()
        } catch {
          throw new Error('Ollama returned invalid JSON for embedding')
        }

        if (!Array.isArray(data.embedding)) {
          throw new Error('Ollama returned no embedding array')
        }

        embeddings.push(data.embedding as number[])
      } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') {
          throw new Error(`Ollama embedding Zeitüberschreitung nach ${EMBEDDING_TIMEOUT_MS / 1000}s`)
        }
        throw error
      } finally {
        clearTimeout(timeoutId)
      }
    }

    return {
      embeddings,
      model: options.model || this.embeddingModel,
      provider: this.name,
      dimensions: embeddings[0]?.length || 768,
    }
  }

  async isAvailable(): Promise<boolean> {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), AVAILABILITY_TIMEOUT_MS)

    try {
      const response = await fetch(`${this.baseUrl}/api/tags`, { signal: controller.signal })
      return response.ok
    } catch {
      return false
    } finally {
      clearTimeout(timeoutId)
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
