/**
 * OpenAI Provider
 *
 * Supports GPT models for chat and text-embedding-3-small for embeddings.
 * Requires user-provided API key.
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

const OPENAI_API_URL = 'https://api.openai.com/v1'
const DEFAULT_MODEL = 'gpt-4o-mini'
const DEFAULT_EMBEDDING_MODEL = 'text-embedding-3-small'

export class OpenAIProvider implements AIProvider {
  name = 'openai'
  private apiKey: string
  private model: string
  private embeddingModel: string

  constructor(config: ProviderConfig = {}) {
    this.apiKey = config.apiKey || process.env.OPENAI_API_KEY || ''
    this.model = config.model || DEFAULT_MODEL
    this.embeddingModel = config.embeddingModel || DEFAULT_EMBEDDING_MODEL
  }

  async chat(options: ChatCompletionOptions): Promise<ChatCompletionResponse> {
    if (!this.apiKey) {
      throw new Error('OpenAI API key not configured')
    }

    const response = await fetch(`${OPENAI_API_URL}/chat/completions`, {
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
      }),
    })

    if (!response.ok) {
      const error = await response.text()
      logger.error('OpenAI API error', { status: response.status, error })
      throw new Error(`OpenAI API error: ${response.status} - ${error}`)
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

  async embed(options: EmbeddingOptions): Promise<EmbeddingResponse> {
    if (!this.apiKey) {
      throw new Error('OpenAI API key not configured')
    }

    const response = await fetch(`${OPENAI_API_URL}/embeddings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: options.model || this.embeddingModel,
        input: options.input,
      }),
    })

    if (!response.ok) {
      const error = await response.text()
      logger.error('OpenAI embeddings error', { status: response.status, error })
      throw new Error(`OpenAI embeddings error: ${response.status} - ${error}`)
    }

    const data = await response.json()
    const embeddings = data.data.map((item: { embedding: number[] }) => item.embedding)

    return {
      embeddings,
      model: options.model || this.embeddingModel,
      provider: this.name,
      dimensions: embeddings[0]?.length || 1536,
    }
  }

  async isAvailable(): Promise<boolean> {
    if (!this.apiKey) return false

    try {
      const response = await fetch(`${OPENAI_API_URL}/models`, {
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
    return DEFAULT_EMBEDDING_MODEL
  }
}
