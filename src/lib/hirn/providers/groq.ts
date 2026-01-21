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
    })

    if (!response.ok) {
      const error = await response.text()
      logger.error('Groq API error', { status: response.status, error })
      throw new Error(`Groq API error: ${response.status} - ${error}`)
    }

    const data = await response.json()

    return {
      content: data.choices[0]?.message?.content || '',
      usage: data.usage ? {
        promptTokens: data.usage.prompt_tokens,
        completionTokens: data.usage.completion_tokens,
        totalTokens: data.usage.total_tokens,
      } : undefined,
      model: this.model,
      provider: this.name,
    }
  }

  async embed(_options: EmbeddingOptions): Promise<EmbeddingResponse> {
    // Groq doesn't provide embeddings API
    // This will be handled by the provider factory to use Ollama instead
    throw new Error('Groq does not support embeddings. Use Ollama for embeddings.')
  }

  async isAvailable(): Promise<boolean> {
    if (!this.apiKey) return false

    try {
      const response = await fetch(`${GROQ_API_URL}/models`, {
        headers: { 'Authorization': `Bearer ${this.apiKey}` },
      })
      return response.ok
    } catch {
      return false
    }
  }

  getDefaultModel(): string {
    return DEFAULT_MODEL
  }

  getDefaultEmbeddingModel(): string {
    return '' // Groq doesn't support embeddings
  }
}
