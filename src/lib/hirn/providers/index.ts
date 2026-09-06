/**
 * Hirn AI Provider Factory
 *
 * Creates and manages AI providers for the RAG system.
 * Handles provider selection, fallbacks, and configuration.
 */

import { complete, linkId, type Link, type Provider } from '@bitbaum/ai-kit';
import { db } from '@/db';
import { hirnProviderSettings } from '@/db/schema';
import { eq, and, desc, isNull, sql } from 'drizzle-orm';
import { logger } from '@/lib/logger';
import { GroqProvider } from './groq';
import { OllamaProvider } from './ollama';
import { OpenRouterProvider } from './openrouter';
import { recordLLMFailure, recordLLMSuccess } from '../health';
import type {
  AIProvider,
  ProviderConfig,
  ProviderName,
  ChatCompletionOptions,
  ChatCompletionResponse,
  EmbeddingOptions,
  EmbeddingResponse,
} from './types';

export * from './types';

/**
 * Create a provider instance by name
 */
export function createProvider(name: ProviderName, config: ProviderConfig = {}): AIProvider {
  switch (name) {
    case 'ollama':
      return new OllamaProvider(config);
    case 'groq':
      return new GroqProvider(config);
    case 'openrouter':
      return new OpenRouterProvider(config);
    default:
      throw new Error(`Unknown provider: ${name}`);
  }
}

/**
 * Provider settings from database
 */
interface ProviderSettings {
  provider: ProviderName;
  is_enabled: boolean;
  is_default: boolean;
  settings: {
    api_key?: string;
    base_url?: string;
    model?: string;
    embedding_model?: string;
    [key: string]: unknown;
  };
}

/**
 * Get provider settings from database
 */
export async function getProviderSettings(
  scope: 'system' | 'user' = 'system',
  userId?: string,
): Promise<ProviderSettings[]> {
  const userCondition = userId
    ? eq(hirnProviderSettings.userId, userId)
    : isNull(hirnProviderSettings.userId);

  const rows = await db
    .select({
      provider: hirnProviderSettings.provider,
      is_enabled: hirnProviderSettings.isEnabled,
      is_default: hirnProviderSettings.isDefault,
      settings: hirnProviderSettings.settings,
    })
    .from(hirnProviderSettings)
    .where(and(eq(hirnProviderSettings.scope, scope), userCondition))
    .orderBy(desc(hirnProviderSettings.isDefault), hirnProviderSettings.provider);

  return rows.map((r) => ({
    provider: r.provider as ProviderName,
    is_enabled: r.is_enabled ?? true,
    is_default: r.is_default ?? false,
    settings: (r.settings ?? {}) as ProviderSettings['settings'],
  }));
}

/**
 * Get the default chat provider
 * Falls back through: user preference → system default → first available
 */
export async function getDefaultChatProvider(userId?: string): Promise<AIProvider> {
  // Try user settings first
  if (userId) {
    const userSettings = await getProviderSettings('user', userId);
    const userDefault = userSettings.find((s) => s.is_default && s.is_enabled);
    if (userDefault) {
      const provider = createProvider(userDefault.provider, {
        apiKey: userDefault.settings.api_key,
        baseUrl: userDefault.settings.base_url,
        model: userDefault.settings.model,
      });
      if (await provider.isAvailable()) {
        return provider;
      }
    }
  }

  // Try system settings
  const systemSettings = await getProviderSettings('system');
  const systemDefault = systemSettings.find((s) => s.is_default && s.is_enabled);
  if (systemDefault) {
    const provider = createProvider(systemDefault.provider, {
      apiKey: systemDefault.settings.api_key,
      baseUrl: systemDefault.settings.base_url,
      model: systemDefault.settings.model,
    });
    if (await provider.isAvailable()) {
      return provider;
    }
    // Default is configured but its credentials are dead. Log loudly so
    // the failure surfaces in the app logs — the previous silent fall-
    // through to "any other enabled provider" made stale API keys look
    // like a different provider's bug (e.g. user thinks Groq is selected,
    // sees an "OpenRouter API error: 401" because Groq quietly failed
    // and OpenRouter took the call with its own bad key).
    logger.error('Default chat provider unavailable — credentials likely revoked', {
      provider: systemDefault.provider,
      hint: 'Update the API key for this provider in /admin/hirn or via env (e.g. GROQ_API_KEY).',
    });
  }

  // Try any other available provider — explicit chain so the next-best
  // pick is logged. Skip the default we already tried.
  for (const settings of systemSettings.filter((s) => s.is_enabled && !s.is_default)) {
    const provider = createProvider(settings.provider, {
      apiKey: settings.settings.api_key,
      baseUrl: settings.settings.base_url,
      model: settings.settings.model,
    });
    if (await provider.isAvailable()) {
      logger.warn('Using fallback chat provider — default was unavailable', {
        fallback: settings.provider,
        defaultProvider: systemDefault?.provider ?? null,
      });
      return provider;
    }
  }

  // Build a more actionable error than "No available AI providers
  // configured" — the prior message led users to think the providers
  // were missing entirely, when in practice the keys were just dead.
  const tried = systemSettings
    .filter((s) => s.is_enabled)
    .map((s) => s.provider)
    .join(', ');
  throw new Error(
    `Kein KI-Anbieter verfügbar. Geprüft: ${tried || 'keiner'}. Aktualisiere den API-Key (z.B. GROQ_API_KEY) oder die Anbieter-Einstellungen in /admin/hirn.`,
  );
}

/**
 * The cloud providers, described the way `@bitbaum/ai-kit` describes a vendor.
 *
 * Ollama is deliberately absent. It speaks its own `/api/chat`, not an
 * OpenAI-compatible `/chat/completions`, so it cannot join this chain without
 * a translation layer — and it stays exactly as it was, for embeddings and as
 * the local-first option below.
 */
const CLOUD_PROVIDERS = {
  groq: {
    id: 'groq',
    baseUrl: 'https://api.groq.com/openai/v1',
    keyEnv: 'GROQ_API_KEY',
    fallbackModel: 'openai/gpt-oss-120b',
    // Free tier, stated per day. Estimated LOW on purpose: handing out shares
    // of capacity that turns out not to exist produces the exact wall the
    // rationing exists to prevent, only later in the day.
    dailyTokens: 100_000,
    routed: false,
  },
  openrouter: {
    id: 'openrouter',
    baseUrl: 'https://openrouter.ai/api/v1',
    keyEnv: 'OPENROUTER_API_KEY',
    fallbackModel: 'nvidia/nemotron-3-super-120b-a12b:free',
    dailyTokens: 50_000,
    // Routed ids: `:free` is the difference between free routing and a charge.
    routed: true,
  },
} as const;

type CloudProviderName = keyof typeof CLOUD_PROVIDERS;

function isCloud(name: ProviderName): name is CloudProviderName {
  return name === 'groq' || name === 'openrouter';
}

/**
 * Turn the admin's configured providers into a chain ai-kit can WALK.
 *
 * The DB rows already express a preference order (user default, then system
 * default, then anything else enabled). That order is worth keeping — it is a
 * human decision. What was not worth keeping is how it was acted on.
 */
function buildChatChain(
  systemSettings: ProviderSettings[],
  userDefault?: ProviderSettings,
): { chain: Link[]; env: Record<string, string | undefined> } {
  const ordered: ProviderSettings[] = [];
  const seen = new Set<ProviderName>();
  const push = (s?: ProviderSettings) => {
    if (!s || !s.is_enabled || seen.has(s.provider)) return;
    seen.add(s.provider);
    ordered.push(s);
  };

  push(userDefault);
  push(systemSettings.find((s) => s.is_default && s.is_enabled));
  for (const s of systemSettings) push(s);

  const env: Record<string, string | undefined> = {};
  const chain: Link[] = [];

  for (const settings of ordered) {
    if (!isCloud(settings.provider)) continue;
    const spec = CLOUD_PROVIDERS[settings.provider];

    // A key configured in /admin/hirn beats the environment — that is the
    // whole point of the settings screen.
    const key = settings.settings.api_key?.trim() || process.env[spec.keyEnv]?.trim();
    if (!key) continue;
    env[spec.keyEnv] = key;

    // The configured model first, then this provider's known-good default as a
    // second link. A configured id is the one most likely to have rotted — it
    // was typed once and never checked again — and a second model at the same
    // vendor costs nothing when the vendor is fine and rescues the call when
    // only that id is gone. It cannot mask an exhausted day: a DAILY 429
    // condemns the whole vendor, both links with it.
    const models = [settings.settings.model?.trim(), spec.fallbackModel].filter(
      (m, i, all): m is string => Boolean(m) && all.indexOf(m) === i,
    );

    const provider: Provider = {
      id: spec.id,
      baseUrl: settings.settings.base_url?.trim() || spec.baseUrl,
      keyEnv: spec.keyEnv,
      models,
      dailyTokens: spec.dailyTokens,
      routed: spec.routed,
    };

    for (const model of models) chain.push({ provider, model });
  }

  return { chain, env };
}

/**
 * Select a chat provider and generate a completion in one step.
 *
 * WHAT CHANGED, AND WHY IT WAS WRONG BEFORE.
 *
 * This used to call `getDefaultChatProvider()` — which picks ONE provider by
 * asking each candidate `isAvailable()`, a `GET /models` probe — and then call
 * `.chat()` on it exactly once. The shape looked like a fallback chain and was
 * not one, in the way that is hardest to see: it advanced on a signal
 * unrelated to the failure it needed to survive. "Can I list your models?" and
 * "can this model answer right now?" are different questions, and a 429, a
 * retired model id, or an empty completion on the real call was terminal — the
 * next provider was never tried, because the first had already passed its
 * audition.
 *
 * It also cost an extra round trip before every single chat, to answer a
 * question the chat itself was about to answer properly.
 *
 * `complete()` walks the real calls, and brings the three judgements this file
 * got wrong (measured across the fleet 2026-09-06, 9 of 12 hand-rolled clients
 * share them):
 *
 *   - an empty HTTP 200 is a FAILURE, not an answer. This file returned
 *     `choices?.[0]?.message?.content || ''` — a reasoning model that spends
 *     its budget thinking, or a vendor having a moment, produced an empty
 *     string that was handed to the user as the assistant's reply.
 *   - a DAILY 429 condemns that whole vendor for the walk, instead of trying
 *     its other models against the same exhausted org-wide budget.
 *   - a SIZE 429 ends the walk instead of demoting to a model with a SMALLER
 *     ceiling, which is strictly worse.
 *
 * Plus a deadline per link, so a vendor that accepts the connection and never
 * answers is abandoned rather than holding the request open forever.
 *
 * Ollama is not in the chain (it is not OpenAI-compatible), so when it is the
 * configured default it is still tried first, on its own path.
 */
export async function getChatResponse(
  options: ChatCompletionOptions,
  userId?: string,
): Promise<ChatCompletionResponse> {
  try {
    const systemSettings = await getProviderSettings('system');
    const userSettings = userId ? await getProviderSettings('user', userId) : [];
    const userDefault = userSettings.find((s) => s.is_default && s.is_enabled);

    // Ollama cannot join the chain, so honour it the only way available: if it
    // is the explicit default, try it first and fall through to the cloud
    // chain when it is not running.
    const localFirst = userDefault ?? systemSettings.find((s) => s.is_default && s.is_enabled);
    if (localFirst?.provider === 'ollama' && localFirst.is_enabled) {
      try {
        const ollama = createProvider('ollama', {
          baseUrl: localFirst.settings.base_url,
          model: localFirst.settings.model,
        });
        const response = await ollama.chat(options);
        if (response.content.trim() !== '') {
          recordLLMSuccess();
          return response;
        }
        logger.warn('Ollama returned an empty completion — falling through to the cloud chain');
      } catch (error) {
        logger.warn('Ollama unavailable — falling through to the cloud chain', {
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }

    const { chain, env } = buildChatChain(systemSettings, userDefault);
    if (chain.length === 0) {
      const tried = systemSettings
        .filter((s) => s.is_enabled)
        .map((s) => s.provider)
        .join(', ');
      throw new Error(
        `Kein KI-Anbieter verfügbar. Geprüft: ${tried || 'keiner'}. Aktualisiere den API-Key (z.B. GROQ_API_KEY) oder die Anbieter-Einstellungen in /admin/hirn.`,
      );
    }

    const result = await complete({
      chain,
      env,
      messages: options.messages,
      temperature: options.temperature ?? 0.7,
      // Generous on purpose: the chain leads with reasoning models, which spend
      // this budget thinking before emitting a visible token, and an empty
      // completion is now correctly treated as a failure. A mean budget would
      // walk the whole chain and report every link broken.
      maxTokens: options.maxTokens ?? 2048,
      onLinkFailure: (link, error) => {
        logger.warn('Hirn chat link failed — trying the next', {
          link: linkId(link),
          error: error.message,
        });
      },
    });

    const usage = (result.raw as { usage?: Record<string, number> } | undefined)?.usage;

    recordLLMSuccess();
    return {
      content: result.text,
      usage: usage
        ? {
            promptTokens: usage.prompt_tokens ?? 0,
            completionTokens: usage.completion_tokens ?? 0,
            totalTokens: usage.total_tokens ?? 0,
          }
        : undefined,
      model: result.link.model,
      provider: result.link.provider.id,
    };
  } catch (error) {
    recordLLMFailure(error);
    throw error;
  }
}

/**
 * The chat chain as it stands RIGHT NOW, for the liveness probe.
 *
 * Deliberately re-read from the database on every call rather than cached: an
 * admin who changes the provider in /admin/hirn and then probes must be told
 * about the configuration they just saved, not the one this process started
 * with. `createAiHealthHandler` calls this only when a probe actually runs —
 * never on a cache hit — so a monitor polling the route does not also poll
 * Postgres.
 *
 * Keys are resolved into the returned `env`, so the probe walks exactly the
 * links a real chat would, with exactly the same credentials.
 */
export async function currentChatChain(): Promise<{
  chain: Link[];
  env: Record<string, string | undefined>;
}> {
  return buildChatChain(await getProviderSettings('system'));
}

/**
 * Get the embedding provider
 * Always uses Ollama for embeddings (local, free, 768 dimensions)
 * Falls back to OpenRouter if Ollama is unavailable
 */
export async function getEmbeddingProvider(): Promise<AIProvider> {
  // Try Ollama first (preferred for embeddings - local and free)
  const ollama = new OllamaProvider();
  if (await ollama.isAvailable()) {
    return ollama;
  }

  // Try OpenRouter as fallback
  const openrouter = new OpenRouterProvider();
  if (await openrouter.isAvailable()) {
    logger.warn('Using OpenRouter for embeddings (Ollama unavailable)');
    return openrouter;
  }

  throw new Error('No embedding provider available. Please start Ollama or configure OpenRouter.');
}

/**
 * Generate embeddings using the best available provider
 */
export async function generateEmbeddings(options: EmbeddingOptions): Promise<EmbeddingResponse> {
  const provider = await getEmbeddingProvider();
  return provider.embed(options);
}

/**
 * Update provider settings in database
 */
export async function updateProviderSettings(
  provider: ProviderName,
  settings: Partial<ProviderSettings['settings']>,
  scope: 'system' | 'user' = 'system',
  userId?: string,
): Promise<void> {
  const userCondition = userId
    ? eq(hirnProviderSettings.userId, userId)
    : isNull(hirnProviderSettings.userId);

  await db
    .update(hirnProviderSettings)
    .set({
      settings: sql`${hirnProviderSettings.settings} || ${JSON.stringify(settings)}::jsonb`,
      updatedAt: sql`NOW()`,
    })
    .where(
      and(
        eq(hirnProviderSettings.provider, provider),
        eq(hirnProviderSettings.scope, scope),
        userCondition,
      ),
    );
}

/**
 * Enable or disable a provider.
 */
export async function setProviderEnabled(
  provider: ProviderName,
  isEnabled: boolean,
  scope: 'system' | 'user' = 'system',
  userId?: string,
): Promise<void> {
  const userCondition = userId
    ? eq(hirnProviderSettings.userId, userId)
    : isNull(hirnProviderSettings.userId);

  await db
    .update(hirnProviderSettings)
    .set({ isEnabled, updatedAt: sql`NOW()` })
    .where(
      and(
        eq(hirnProviderSettings.provider, provider),
        eq(hirnProviderSettings.scope, scope),
        userCondition,
      ),
    );
}

/**
 * Set the default provider
 */
export async function setDefaultProvider(
  provider: ProviderName,
  scope: 'system' | 'user' = 'system',
  userId?: string,
): Promise<void> {
  const userCondition = userId
    ? eq(hirnProviderSettings.userId, userId)
    : isNull(hirnProviderSettings.userId);

  // First, unset all defaults for this scope
  await db
    .update(hirnProviderSettings)
    .set({ isDefault: false, updatedAt: sql`NOW()` })
    .where(and(eq(hirnProviderSettings.scope, scope), userCondition));

  // Then set the new default
  await db
    .update(hirnProviderSettings)
    .set({ isDefault: true, updatedAt: sql`NOW()` })
    .where(
      and(
        eq(hirnProviderSettings.provider, provider),
        eq(hirnProviderSettings.scope, scope),
        userCondition,
      ),
    );
}

/**
 * Add a new provider configuration for a user
 */
export async function addUserProvider(
  userId: string,
  provider: ProviderName,
  settings: ProviderSettings['settings'],
  isDefault: boolean = false,
): Promise<void> {
  await db
    .insert(hirnProviderSettings)
    .values({
      scope: 'user',
      userId,
      provider,
      isEnabled: true,
      isDefault: isDefault,
      settings,
    })
    .onConflictDoUpdate({
      target: [
        hirnProviderSettings.scope,
        hirnProviderSettings.userId,
        hirnProviderSettings.provider,
      ],
      set: {
        settings,
        isDefault: isDefault,
        updatedAt: sql`NOW()`,
      },
    });
}
