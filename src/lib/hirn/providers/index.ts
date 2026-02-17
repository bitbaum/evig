/**
 * Hirn AI Provider Factory
 *
 * Creates and manages AI providers for the RAG system.
 * Handles provider selection, fallbacks, and configuration.
 */

import { query } from '@/lib/auth/db'
import { logger } from '@/lib/logger'
import { TABLE_NAMES } from '@/config/database'
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
  const result = await query<ProviderSettings>(
    `SELECT provider, is_enabled, is_default, settings
     FROM ${TABLE_NAMES.HIRN_PROVIDER_SETTINGS}
     WHERE scope = $1 AND ($2::uuid IS NULL OR user_id = $2)
     ORDER BY is_default DESC, provider`,
    [scope, userId || null]
  )
  return result.rows
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
  }

  // Try any available provider
  for (const settings of systemSettings.filter(s => s.is_enabled)) {
    const provider = createProvider(settings.provider, {
      apiKey: settings.settings.api_key,
      baseUrl: settings.settings.base_url,
      model: settings.settings.model,
    })
    if (await provider.isAvailable()) {
      logger.warn('Using fallback provider', { provider: settings.provider })
      return provider
    }
  }

  throw new Error('No available AI providers configured')
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
  await query(
    `UPDATE ${TABLE_NAMES.HIRN_PROVIDER_SETTINGS}
     SET settings = settings || $1::jsonb,
         updated_at = NOW()
     WHERE provider = $2 AND scope = $3 AND ($4::uuid IS NULL OR user_id = $4)`,
    [JSON.stringify(settings), provider, scope, userId || null]
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
  await query(
    `UPDATE ${TABLE_NAMES.HIRN_PROVIDER_SETTINGS}
     SET is_enabled = $1,
         updated_at = NOW()
     WHERE provider = $2 AND scope = $3 AND ($4::uuid IS NULL OR user_id = $4)`,
    [isEnabled, provider, scope, userId || null]
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
  // First, unset all defaults for this scope
  await query(
    `UPDATE ${TABLE_NAMES.HIRN_PROVIDER_SETTINGS}
     SET is_default = false, updated_at = NOW()
     WHERE scope = $1 AND ($2::uuid IS NULL OR user_id = $2)`,
    [scope, userId || null]
  )

  // Then set the new default
  await query(
    `UPDATE ${TABLE_NAMES.HIRN_PROVIDER_SETTINGS}
     SET is_default = true, updated_at = NOW()
     WHERE provider = $1 AND scope = $2 AND ($3::uuid IS NULL OR user_id = $3)`,
    [provider, scope, userId || null]
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
  await query(
    `INSERT INTO ${TABLE_NAMES.HIRN_PROVIDER_SETTINGS} (scope, user_id, provider, is_enabled, is_default, settings)
     VALUES ('user', $1, $2, true, $3, $4)
     ON CONFLICT (scope, user_id, provider)
     DO UPDATE SET settings = EXCLUDED.settings, is_default = EXCLUDED.is_default, updated_at = NOW()`,
    [userId, provider, isDefault, JSON.stringify(settings)]
  )
}
