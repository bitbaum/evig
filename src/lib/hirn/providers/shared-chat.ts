import { complete, freeChain, providerModels } from '@bitbaum/ai-kit';
import type { ChatCompletionOptions, ChatCompletionResponse } from './types';

/** Hirn owns routing and embeddings; AI Kit owns ordinary vendor HTTP behavior. */
export function sharedProvider(id: string) {
  const provider = freeChain('EVIG').find((entry) => entry.id === id);
  if (!provider) throw new Error(`Unsupported shared AI provider: ${id}`);
  return provider;
}

export function defaultSharedModel(id: string) {
  return providerModels(sharedProvider(id))[0];
}

export async function completeProvider(
  id: string,
  model: string,
  apiKey: string,
  ownKey: boolean,
  options: ChatCompletionOptions,
  extraHeaders?: Record<string, string>,
): Promise<ChatCompletionResponse> {
  const result = await complete({
    messages: options.messages,
    chain: [{ provider: { ...sharedProvider(id), keyEnv: 'HIRN_API_KEY', byok: ownKey }, model }],
    env: { HIRN_API_KEY: apiKey },
    maxTokens: options.maxTokens ?? 2048,
    temperature: options.temperature ?? 0.7,
    timeoutMs: 30_000,
    signal: options.signal,
    extraHeaders,
  });
  const raw = result.raw as {
    model?: unknown;
    usage?: { prompt_tokens?: number; completion_tokens?: number; total_tokens?: number };
  };
  const usage = raw?.usage;
  return {
    content: result.text,
    model:
      typeof raw?.model === 'string' && raw.model.trim() ? raw.model.trim() : result.link.model,
    provider: id,
    ...(usage
      ? {
          usage: {
            promptTokens: usage.prompt_tokens ?? 0,
            completionTokens: usage.completion_tokens ?? 0,
            totalTokens: usage.total_tokens ?? 0,
          },
        }
      : {}),
  };
}
