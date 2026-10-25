/**
 * OpenRouter Provider
 *
 * Pay-per-token access to many models including Claude, GPT, Llama, etc.
 * Uses OpenAI-compatible API format.
 */

import { completeProvider, defaultSharedModel } from './shared-chat';
import { APP_URL } from '@/config/urls';
import type {
  AIProvider,
  ChatCompletionOptions,
  ChatCompletionResponse,
  EmbeddingOptions,
  EmbeddingResponse,
  ProviderConfig,
} from './types';

const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1';
const DEFAULT_MODEL = process.env.OPENROUTER_MODEL?.trim() || defaultSharedModel('openrouter');
const AVAILABILITY_TIMEOUT_MS = 5_000;

export class OpenRouterProvider implements AIProvider {
  name = 'openrouter';
  private apiKey: string;
  private model: string;
  private ownKey: boolean;

  constructor(config: ProviderConfig = {}) {
    this.ownKey = Boolean(config.apiKey);
    this.apiKey = config.apiKey || process.env.OPENROUTER_API_KEY || '';
    this.model = config.model || DEFAULT_MODEL;
  }

  async chat(options: ChatCompletionOptions): Promise<ChatCompletionResponse> {
    if (!this.apiKey) {
      throw new Error('OpenRouter API key not configured');
    }

    return completeProvider(this.name, this.model, this.apiKey, this.ownKey, options, {
      'HTTP-Referer': APP_URL,
      'X-Title': 'evig Hirn',
    });
  }

  async embed(_options: EmbeddingOptions): Promise<EmbeddingResponse> {
    // OpenRouter doesn't provide embeddings API
    throw new Error('OpenRouter does not support embeddings. Use Ollama for embeddings.');
  }

  async isAvailable(): Promise<boolean> {
    if (!this.apiKey) return false;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), AVAILABILITY_TIMEOUT_MS);

    try {
      const response = await fetch(`${OPENROUTER_API_URL}/models`, {
        headers: { Authorization: `Bearer ${this.apiKey}` },
        signal: controller.signal,
      });
      return response.ok;
    } catch {
      return false;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  getDefaultModel(): string {
    return DEFAULT_MODEL;
  }

  getDefaultEmbeddingModel(): string {
    return ''; // OpenRouter doesn't support embeddings
  }
}
