/**
 * Groq AI Provider
 *
 * Uses Groq's free tier for fast inference with Llama models.
 * Note: Groq doesn't provide embeddings, so we use Ollama for that.
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

const GROQ_API_URL = 'https://api.groq.com/openai/v1'
const DEFAULT_MODEL = 'llama-3.3-70b-versatile'
const REQUEST_TIMEOUT_MS = 30_000
const AVAILABILITY_TIMEOUT_MS = 5_000

export class GroqProvider implements AIProvider {
  name = 'groq'
  private apiKey: string
  private model: string

  constructor(config: ProviderConfig = {}) {
    this.apiKey = config.apiKey || process.env.GROQ_API_KEY || ''
    this.model = config.model || DEFAULT_MODEL
  }

  async chat(options: ChatCompletionOptions): Promise<ChatCompletionResponse> {
    if (!this.apiKey) {
      throw new Error('Groq API key not configured')
    }

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)

    try {
      const response = await fetch(`${GROQ_API_URL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: this.model,
          messages: options.messages,
          temperature: options.temperature ?? 0.7,
          max_tokens: options.maxTokens ?? 2048,
          stream: false,
        }),
        signal: controller.signal,
      })

      if (!response.ok) {
        const error = await response.text().catch(() => '')
        logger.error('Groq API error', { status: response.status, error: error.substring(0, 200) })
        throw new Error(`Groq API error: ${response.status} - ${error.substring(0, 200)}`)
      }

      let data: Record<string, unknown>
      try {
        data = await response.json()
      } catch {
        throw new Error('Groq returned invalid JSON response')
      }

      const choices = data.choices as Array<{ message?: { content?: string } }> | undefined
      const usage = data.usage as { prompt_tokens?: number; completion_tokens?: number; total_tokens?: number } | undefined

      return {
        content: choices?.[0]?.message?.content || '',
        usage: usage ? {
          promptTokens: usage.prompt_tokens || 0,
          completionTokens: usage.completion_tokens || 0,
          totalTokens: usage.total_tokens || 0,
        } : undefined,
        model: this.model,
        provider: this.name,
      }
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error(`Groq Zeitüberschreitung nach ${REQUEST_TIMEOUT_MS / 1000}s`)
      }
      throw error
    } finally {
      clearTimeout(timeoutId)
    }
  }

  async embed(_options: EmbeddingOptions): Promise<EmbeddingResponse> {
    // Groq doesn't provide embeddings API
    // This will be handled by the provider factory to use Ollama instead
    throw new Error('Groq does not support embeddings. Use Ollama for embeddings.')
  }

  async isAvailable(): Promise<boolean> {
    if (!this.apiKey) return false

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), AVAILABILITY_TIMEOUT_MS)

    try {
      const response = await fetch(`${GROQ_API_URL}/models`, {
        headers: { 'Authorization': `Bearer ${this.apiKey}` },
        signal: controller.signal,
      })
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
    return '' // Groq doesn't support embeddings
  }
}
