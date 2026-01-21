/**
 * xAI Provider (Grok)
 *
 * Access to Grok models via xAI API.
 * Uses OpenAI-compatible API format.
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

const XAI_API_URL = 'https://api.x.ai/v1'
const DEFAULT_MODEL = 'grok-beta'

export class XAIProvider implements AIProvider {
  name = 'xai'
  private apiKey: string
  private model: string

  constructor(config: ProviderConfig = {}) {
    this.apiKey = config.apiKey || process.env.XAI_API_KEY || ''
    this.model = config.model || DEFAULT_MODEL
  }

  async chat(options: ChatCompletionOptions): Promise<ChatCompletionResponse> {
    if (!this.apiKey) {
      throw new Error('xAI API key not configured')
    }

    const response = await fetch(`${XAI_API_URL}/chat/completions`, {
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
      logger.error('xAI API error', { status: response.status, error })
      throw new Error(`xAI API error: ${response.status} - ${error}`)
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
    throw new Error('xAI does not support embeddings. Use Ollama for embeddings.')
  }

  async isAvailable(): Promise<boolean> {
    if (!this.apiKey) return false

    try {
      const response = await fetch(`${XAI_API_URL}/models`, {
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
    return ''
  }
}
