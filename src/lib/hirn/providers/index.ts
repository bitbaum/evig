/**
 * Hirn AI Provider Factory
 *
 * Creates and manages AI providers for the RAG system.
 * Handles provider selection, fallbacks, and configuration.
 */

import { db } from '@/db'
import { hirnProviderSettings } from '@/db/schema'
import { eq, and, desc, isNull, sql } from 'drizzle-orm'
import { logger } from '@/lib/logger'
import { GroqProvider } from './groq'
import { OllamaProvider } from './ollama'
import { OpenRouterProvider } from './openrouter'
import type {
  AIProvider,
  ProviderConfig,
  ProviderName,
  EmbeddingOptions,
  EmbeddingResponse,
} from './types'

export * from './types'

/**
 * Create a provider instance by name
 */
export function createProvider(name: ProviderName, config: ProviderConfig = {}): AIProvider {
  switch (name) {
    case 'ollama':
      return new OllamaProvider(config)
    case 'groq':
      return new GroqProvider(config)
    case 'openrouter':
      return new OpenRouterProvider(config)
    default:
      throw new Error(`Unknown provider: ${name}`)
  }
}

/**
 * Provider settings from database
 */
interface ProviderSettings {
  provider: ProviderName
  is_enabled: boolean
  is_default: boolean
  settings: {
    api_key?: string
    base_url?: string
    model?: string
    embedding_model?: string
    [key: string]: unknown
  }
}

/**
 * Get provider settings from database
 */
export async function getProviderSettings(
  scope: 'system' | 'user' = 'system',
  userId?: string
): Promise<ProviderSettings[]> {
  const userCondition = userId
    ? eq(hirnProviderSettings.userId, userId)
    : isNull(hirnProviderSettings.userId)

  const rows = await db
    .select({
      provider: hirnProviderSettings.provider,
      is_enabled: hirnProviderSettings.isEnabled,
      is_default: hirnProviderSettings.isDefault,
      settings: hirnProviderSettings.settings,
    })
    .from(hirnProviderSettings)
    .where(and(eq(hirnProviderSettings.scope, scope), userCondition))
    .orderBy(desc(hirnProviderSettings.isDefault), hirnProviderSettings.provider)

  return rows.map(r => ({
    provider: r.provider as ProviderName,
    is_enabled: r.is_enabled ?? true,
    is_default: r.is_default ?? false,
    settings: (r.settings ?? {}) as ProviderSettings['settings'],
  }))
}

/**
 * Get the default chat provider
 * Falls back through: user preference → system default → first available
 */
export async function getDefaultChatProvider(userId?: string): Promise<AIProvider> {
  // Try user settings first
  if (userId) {
    const userSettings = await getProviderSettings('user', userId)
    const userDefault = userSettings.find(s => s.is_default && s.is_enabled)
    if (userDefault) {
      const provider = createProvider(userDefault.provider, {
        apiKey: userDefault.settings.api_key,
        baseUrl: userDefault.settings.base_url,
        model: userDefault.settings.model,
      })
      if (await provider.isAvailable()) {
        return provider
      }
    }
  }

  // Try system settings
  const systemSettings = await getProviderSettings('system')
  const systemDefault = systemSettings.find(s => s.is_default && s.is_enabled)
  if (systemDefault) {
    const provider = createProvider(systemDefault.provider, {
      apiKey: systemDefault.settings.api_key,
      baseUrl: systemDefault.settings.base_url,
      model: systemDefault.settings.model,
    })
    if (await provider.isAvailable()) {
      return provider
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
    })
  }

  // Try any other available provider — explicit chain so the next-best
  // pick is logged. Skip the default we already tried.
  for (const settings of systemSettings.filter(s => s.is_enabled && !s.is_default)) {
    const provider = createProvider(settings.provider, {
      apiKey: settings.settings.api_key,
      baseUrl: settings.settings.base_url,
      model: settings.settings.model,
    })
    if (await provider.isAvailable()) {
      logger.warn('Using fallback chat provider — default was unavailable', {
        fallback: settings.provider,
        defaultProvider: systemDefault?.provider ?? null,
      })
      return provider
    }
  }

  // Build a more actionable error than "No available AI providers
  // configured" — the prior message led users to think the providers
  // were missing entirely, when in practice the keys were just dead.
  const tried = systemSettings.filter(s => s.is_enabled).map(s => s.provider).join(', ')
  throw new Error(
    `Kein KI-Anbieter verfügbar. Geprüft: ${tried || 'keiner'}. Aktualisiere den API-Key (z.B. GROQ_API_KEY) oder die Anbieter-Einstellungen in /admin/hirn.`,
  )
}

/**
 * Get the embedding provider
 * Always uses Ollama for embeddings (local, free, 768 dimensions)
 * Falls back to OpenRouter if Ollama is unavailable
 */
export async function getEmbeddingProvider(): Promise<AIProvider> {
  // Try Ollama first (preferred for embeddings - local and free)
  const ollama = new OllamaProvider()
  if (await ollama.isAvailable()) {
    return ollama
  }

  // Try OpenRouter as fallback
  const openrouter = new OpenRouterProvider()
  if (await openrouter.isAvailable()) {
    logger.warn('Using OpenRouter for embeddings (Ollama unavailable)')
    return openrouter
  }

  throw new Error('No embedding provider available. Please start Ollama or configure OpenRouter.')
}

/**
 * Generate embeddings using the best available provider
 */
export async function generateEmbeddings(
  options: EmbeddingOptions
): Promise<EmbeddingResponse> {
  const provider = await getEmbeddingProvider()
  return provider.embed(options)
}

/**
 * Update provider settings in database
 */
export async function updateProviderSettings(
  provider: ProviderName,
  settings: Partial<ProviderSettings['settings']>,
  scope: 'system' | 'user' = 'system',
  userId?: string
): Promise<void> {
  const userCondition = userId
    ? eq(hirnProviderSettings.userId, userId)
    : isNull(hirnProviderSettings.userId)

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
      )
    )
}


/**
 * Enable or disable a provider.
 */
export async function setProviderEnabled(
  provider: ProviderName,
  isEnabled: boolean,
  scope: 'system' | 'user' = 'system',
  userId?: string
): Promise<void> {
  const userCondition = userId
    ? eq(hirnProviderSettings.userId, userId)
    : isNull(hirnProviderSettings.userId)

  await db
    .update(hirnProviderSettings)
    .set({ isEnabled, updatedAt: sql`NOW()` })
    .where(
      and(
        eq(hirnProviderSettings.provider, provider),
        eq(hirnProviderSettings.scope, scope),
        userCondition,
      )
    )
}

/**
 * Set the default provider
 */
export async function setDefaultProvider(
  provider: ProviderName,
  scope: 'system' | 'user' = 'system',
  userId?: string
): Promise<void> {
  const userCondition = userId
    ? eq(hirnProviderSettings.userId, userId)
    : isNull(hirnProviderSettings.userId)

  // First, unset all defaults for this scope
  await db
    .update(hirnProviderSettings)
    .set({ isDefault: false, updatedAt: sql`NOW()` })
    .where(and(eq(hirnProviderSettings.scope, scope), userCondition))

  // Then set the new default
  await db
    .update(hirnProviderSettings)
    .set({ isDefault: true, updatedAt: sql`NOW()` })
    .where(
      and(
        eq(hirnProviderSettings.provider, provider),
        eq(hirnProviderSettings.scope, scope),
        userCondition,
      )
    )
}

/**
 * Add a new provider configuration for a user
 */
export async function addUserProvider(
  userId: string,
  provider: ProviderName,
  settings: ProviderSettings['settings'],
  isDefault: boolean = false
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
      target: [hirnProviderSettings.scope, hirnProviderSettings.userId, hirnProviderSettings.provider],
      set: {
        settings,
        isDefault: isDefault,
        updatedAt: sql`NOW()`,
      },
    })
}
