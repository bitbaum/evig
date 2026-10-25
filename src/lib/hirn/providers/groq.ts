/**
 * Groq AI Provider
 *
 * Uses Groq's free tier for fast inference with Llama models.
 * Note: Groq doesn't provide embeddings, so we use Ollama for that.
 */

import { completeProvider, defaultSharedModel } from './shared-chat';
import type {
  AIProvider,
  ChatCompletionOptions,
  ChatCompletionResponse,
  EmbeddingOptions,
  EmbeddingResponse,
  ProviderConfig,
} from './types';

const GROQ_API_URL = 'https://api.groq.com/openai/v1';
const DEFAULT_MODEL = defaultSharedModel('groq');
const AVAILABILITY_TIMEOUT_MS = 5_000;

export class GroqProvider implements AIProvider {
  name = 'groq';
  private apiKey: string;
  private model: string;
  private ownKey: boolean;

  constructor(config: ProviderConfig = {}) {
    this.ownKey = Boolean(config.apiKey);
    this.apiKey = config.apiKey || process.env.GROQ_API_KEY || '';
    this.model = config.model || DEFAULT_MODEL;
  }

  async chat(options: ChatCompletionOptions): Promise<ChatCompletionResponse> {
    if (!this.apiKey) {
      throw new Error('Groq API key not configured');
    }

    return completeProvider(this.name, this.model, this.apiKey, this.ownKey, options);
  }

  async embed(_options: EmbeddingOptions): Promise<EmbeddingResponse> {
    // Groq doesn't provide embeddings API
    // This will be handled by the provider factory to use Ollama instead
    throw new Error('Groq does not support embeddings. Use Ollama for embeddings.');
  }

  async isAvailable(): Promise<boolean> {
    if (!this.apiKey) return false;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), AVAILABILITY_TIMEOUT_MS);

    try {
      const response = await fetch(`${GROQ_API_URL}/models`, {
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
    return ''; // Groq doesn't support embeddings
  }
}
