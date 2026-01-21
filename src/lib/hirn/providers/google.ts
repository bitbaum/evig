/**
 * Google AI Provider (Gemini)
 *
 * Access to Gemini models via Google AI Studio API.
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

const GOOGLE_API_URL = 'https://generativelanguage.googleapis.com/v1beta'
const DEFAULT_MODEL = 'gemini-1.5-flash'

export class GoogleProvider implements AIProvider {
  name = 'google'
  private apiKey: string
  private model: string

  constructor(config: ProviderConfig = {}) {
    this.apiKey = config.apiKey || process.env.GOOGLE_AI_API_KEY || ''
    this.model = config.model || DEFAULT_MODEL
  }

  async chat(options: ChatCompletionOptions): Promise<ChatCompletionResponse> {
    if (!this.apiKey) {
      throw new Error('Google AI API key not configured')
    }

    // Convert messages to Gemini format
    const systemInstruction = options.messages.find(m => m.role === 'system')?.content
    const contents = options.messages
      .filter(m => m.role !== 'system')
      .map(m => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }],
      }))

    const response = await fetch(
      `${GOOGLE_API_URL}/models/${this.model}:generateContent?key=${this.apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents,
          systemInstruction: systemInstruction ? { parts: [{ text: systemInstruction }] } : undefined,
          generationConfig: {
            temperature: options.temperature ?? 0.7,
            maxOutputTokens: options.maxTokens ?? 2048,
          },
        }),
      }
    )

    if (!response.ok) {
      const error = await response.text()
      logger.error('Google AI API error', { status: response.status, error })
      throw new Error(`Google AI API error: ${response.status} - ${error}`)
    }

    const data = await response.json()

    return {
      content: data.candidates?.[0]?.content?.parts?.[0]?.text || '',
      usage: data.usageMetadata ? {
        promptTokens: data.usageMetadata.promptTokenCount || 0,
        completionTokens: data.usageMetadata.candidatesTokenCount || 0,
        totalTokens: data.usageMetadata.totalTokenCount || 0,
      } : undefined,
      model: this.model,
      provider: this.name,
    }
  }

  async embed(options: EmbeddingOptions): Promise<EmbeddingResponse> {
    if (!this.apiKey) {
      throw new Error('Google AI API key not configured')
    }

    const inputs = Array.isArray(options.input) ? options.input : [options.input]
    const embeddings: number[][] = []

    for (const input of inputs) {
      const response = await fetch(
        `${GOOGLE_API_URL}/models/text-embedding-004:embedContent?key=${this.apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            content: { parts: [{ text: input }] },
          }),
        }
      )

      if (!response.ok) {
        const error = await response.text()
        logger.error('Google embeddings error', { status: response.status, error })
        throw new Error(`Google embeddings error: ${response.status} - ${error}`)
      }

      const data = await response.json()
      embeddings.push(data.embedding.values)
    }

    return {
      embeddings,
      model: 'text-embedding-004',
      provider: this.name,
      dimensions: embeddings[0]?.length || 768,
    }
  }

  async isAvailable(): Promise<boolean> {
    if (!this.apiKey) return false

    try {
      const response = await fetch(
        `${GOOGLE_API_URL}/models?key=${this.apiKey}`
      )
      return response.ok
    } catch {
      return false
    }
  }

  getDefaultModel(): string {
    return DEFAULT_MODEL
  }

  getDefaultEmbeddingModel(): string {
    return 'text-embedding-004'
  }
}
