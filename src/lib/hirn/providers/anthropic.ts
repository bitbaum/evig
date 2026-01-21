/**
 * Anthropic Provider (Claude)
 *
 * Access to Claude models via Anthropic API.
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

const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1'
const DEFAULT_MODEL = 'claude-3-5-sonnet-20241022'

export class AnthropicProvider implements AIProvider {
  name = 'anthropic'
  private apiKey: string
  private model: string

  constructor(config: ProviderConfig = {}) {
    this.apiKey = config.apiKey || process.env.ANTHROPIC_API_KEY || ''
    this.model = config.model || DEFAULT_MODEL
  }

  async chat(options: ChatCompletionOptions): Promise<ChatCompletionResponse> {
    if (!this.apiKey) {
      throw new Error('Anthropic API key not configured')
    }

    // Convert messages format (Anthropic uses different structure)
    const systemMessage = options.messages.find(m => m.role === 'system')
    const otherMessages = options.messages.filter(m => m.role !== 'system')

    const response = await fetch(`${ANTHROPIC_API_URL}/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: this.model,
        max_tokens: options.maxTokens ?? 2048,
        system: systemMessage?.content,
        messages: otherMessages.map(m => ({
          role: m.role,
          content: m.content,
        })),
      }),
    })

    if (!response.ok) {
      const error = await response.text()
      logger.error('Anthropic API error', { status: response.status, error })
      throw new Error(`Anthropic API error: ${response.status} - ${error}`)
    }

    const data = await response.json()

    return {
      content: data.content[0]?.text || '',
      usage: data.usage ? {
        promptTokens: data.usage.input_tokens,
        completionTokens: data.usage.output_tokens,
        totalTokens: data.usage.input_tokens + data.usage.output_tokens,
      } : undefined,
      model: this.model,
      provider: this.name,
    }
  }

  async embed(_options: EmbeddingOptions): Promise<EmbeddingResponse> {
    throw new Error('Anthropic does not support embeddings. Use Ollama for embeddings.')
  }

  async isAvailable(): Promise<boolean> {
    if (!this.apiKey) return false
    // Simple validation - Anthropic doesn't have a models endpoint
    return this.apiKey.startsWith('sk-ant-')
  }

  getDefaultModel(): string {
    return DEFAULT_MODEL
  }

  getDefaultEmbeddingModel(): string {
    return ''
  }
}
