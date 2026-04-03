/**
 * AI Provider Configuration - SSOT
 *
 * Centralized provider config for all AI operations (protocol processing, extraction, etc.).
 * Cascade: Groq (cloud, free) → OpenRouter (cloud, pay-per-token) → Ollama (local).
 *
 * Each caller provides system+user prompts; this module handles provider selection,
 * timeout, fallback, and error categorization.
 */

import { logger } from '@/lib/logger'
import { db } from '@/db'
import { hirnProviderSettings } from '@/db/schema'
import { eq, desc } from 'drizzle-orm'
import { OLLAMA_URL, APP_URL } from '@/config/urls'

// =============================================================================
// CONFIGURATION (SSOT - all AI provider settings in one place)
// =============================================================================

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions'
const GROQ_MODEL = 'llama-3.3-70b-versatile'

const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions'
const OPENROUTER_MODEL = 'meta-llama/llama-3.3-70b-instruct:free'

const DEFAULT_TIMEOUT_MS = 30000

interface ProviderRuntimeConfig {
  groqEnabled: boolean
  openRouterEnabled: boolean
  ollamaEnabled: boolean
  groqApiKey: string
  openRouterApiKey: string
  ollamaUrl: string
  ollamaModel: string
}

interface DbProviderSettingsRow {
  provider: ProviderName
  is_enabled: boolean
  settings: {
    api_key?: string
    base_url?: string
    model?: string
    [key: string]: unknown
  } | null
}

// Cache provider config to avoid a DB query on every AI call
const PROVIDER_CACHE_TTL_MS = 60_000
let _providerCache: { config: ProviderRuntimeConfig; expiresAt: number } | null = null

/** @internal — exposed for testing only */
export function __resetProviderCache(): void {
  _providerCache = null
}

/** @internal — exposed for testing only */
export async function __loadProviderRuntimeConfig(): Promise<ProviderRuntimeConfig> {
  return loadProviderRuntimeConfig()
}

async function loadProviderRuntimeConfig(): Promise<ProviderRuntimeConfig> {
  if (_providerCache && Date.now() < _providerCache.expiresAt) {
    return _providerCache.config
  }

  const envConfig: ProviderRuntimeConfig = {
    groqEnabled: true,
    openRouterEnabled: true,
    ollamaEnabled: true,
    groqApiKey: process.env.GROQ_API_KEY || '',
    openRouterApiKey: process.env.OPENROUTER_API_KEY || '',
    ollamaUrl: OLLAMA_URL,
    ollamaModel: process.env.OLLAMA_MODEL || 'llama3.2',
  }

  try {
    const rows = await db
      .selectDistinctOn([hirnProviderSettings.provider], {
        provider: hirnProviderSettings.provider,
        isEnabled: hirnProviderSettings.isEnabled,
        settings: hirnProviderSettings.settings,
      })
      .from(hirnProviderSettings)
      .where(eq(hirnProviderSettings.scope, 'system'))
      .orderBy(
        hirnProviderSettings.provider,
        desc(hirnProviderSettings.isDefault),
        desc(hirnProviderSettings.updatedAt),
      )

    const byProvider = new Map(rows.map(r => [r.provider as ProviderName, {
      provider: r.provider as ProviderName,
      is_enabled: r.isEnabled ?? true,
      settings: r.settings as DbProviderSettingsRow['settings'],
    }]))

    const groq = byProvider.get('groq')
    const openrouter = byProvider.get('openrouter')
    const ollama = byProvider.get('ollama')

    const resolved: ProviderRuntimeConfig = {
      groqEnabled: groq ? groq.is_enabled : envConfig.groqEnabled,
      openRouterEnabled: openrouter ? openrouter.is_enabled : envConfig.openRouterEnabled,
      ollamaEnabled: ollama ? ollama.is_enabled : envConfig.ollamaEnabled,
      // API keys: DB value takes priority, then env var fallback, then empty if disabled
      groqApiKey: groq?.is_enabled
        ? (groq.settings?.api_key || envConfig.groqApiKey)
        : (groq ? '' : envConfig.groqApiKey),
      openRouterApiKey: openrouter?.is_enabled
        ? (openrouter.settings?.api_key || envConfig.openRouterApiKey)
        : (openrouter ? '' : envConfig.openRouterApiKey),
      ollamaUrl: ollama?.is_enabled
        ? ((ollama.settings?.base_url as string | undefined) || envConfig.ollamaUrl)
        : (ollama ? '' : envConfig.ollamaUrl),
      ollamaModel: ollama?.is_enabled
        ? ((ollama.settings?.model as string | undefined) || envConfig.ollamaModel)
        : (ollama ? '' : envConfig.ollamaModel),
    }
    _providerCache = { config: resolved, expiresAt: Date.now() + PROVIDER_CACHE_TTL_MS }
    return resolved
  } catch (error) {
    logger.warn('AI provider settings table unavailable; falling back to environment config', { error })
    _providerCache = { config: envConfig, expiresAt: Date.now() + PROVIDER_CACHE_TTL_MS }
    return envConfig
  }
}

// =============================================================================
// TYPES
// =============================================================================

type ProviderName = 'groq' | 'openrouter' | 'ollama'

interface ProviderResult {
  text: string
  model: string
  provider: ProviderName
}

interface ProviderError {
  provider: ProviderName
  reason: 'no_key' | 'auth' | 'rate_limit' | 'timeout' | 'network' | 'parse' | 'unknown'
  message: string
}

export interface CallResult {
  text: string
  model: string
  provider: ProviderName
  failedProviders: ProviderError[]
}

export interface CallOptions {
  systemPrompt: string
  userPrompt: string
  temperature?: number
  maxTokens?: number
  timeoutMs?: number
}

// =============================================================================
// PROVIDER IMPLEMENTATIONS
// =============================================================================

async function callGroq(opts: CallOptions, cfg: ProviderRuntimeConfig): Promise<ProviderResult | ProviderError> {
  if (!cfg.groqEnabled) {
    return { provider: 'groq', reason: 'no_key', message: 'Groq ist deaktiviert' }
  }

  if (!cfg.groqApiKey) {
    return { provider: 'groq', reason: 'no_key', message: 'GROQ_API_KEY nicht konfiguriert' }
  }

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), opts.timeoutMs || DEFAULT_TIMEOUT_MS)

  try {
    const response = await fetch(GROQ_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${cfg.groqApiKey}`,
      },
      body: JSON.stringify({
        model: GROQ_MODEL,
        messages: [
          { role: 'system', content: opts.systemPrompt },
          { role: 'user', content: opts.userPrompt },
        ],
        temperature: opts.temperature ?? 0.3,
        max_tokens: opts.maxTokens ?? 4096,
      }),
      signal: controller.signal,
    })

    if (!response.ok) {
      const errorText = await response.text().catch(() => '')
      if (response.status === 401 || response.status === 403) {
        return { provider: 'groq', reason: 'auth', message: `API-Schlüssel ungültig oder abgelaufen (${response.status})` }
      }
      if (response.status === 429) {
        return { provider: 'groq', reason: 'rate_limit', message: 'Rate-Limit erreicht' }
      }
      return { provider: 'groq', reason: 'unknown', message: `HTTP ${response.status}: ${errorText.substring(0, 200)}` }
    }

    let result: Record<string, unknown>
    try {
      result = await response.json()
    } catch {
      return { provider: 'groq', reason: 'parse', message: 'Ungültige JSON-Antwort von Groq' }
    }

    const text = (result.choices as Array<{ message?: { content?: string } }>)?.[0]?.message?.content || ''
    return { text, model: `groq:${GROQ_MODEL}`, provider: 'groq' }
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      return { provider: 'groq', reason: 'timeout', message: `Zeitüberschreitung nach ${(opts.timeoutMs || DEFAULT_TIMEOUT_MS) / 1000}s` }
    }
    return { provider: 'groq', reason: 'network', message: error instanceof Error ? error.message : 'Netzwerkfehler' }
  } finally {
    clearTimeout(timeoutId)
  }
}

async function callOpenRouter(opts: CallOptions, cfg: ProviderRuntimeConfig): Promise<ProviderResult | ProviderError> {
  if (!cfg.openRouterEnabled) {
    return { provider: 'openrouter', reason: 'no_key', message: 'OpenRouter ist deaktiviert' }
  }

  if (!cfg.openRouterApiKey) {
    return { provider: 'openrouter', reason: 'no_key', message: 'OPENROUTER_API_KEY nicht konfiguriert' }
  }

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), opts.timeoutMs || DEFAULT_TIMEOUT_MS)

  try {
    const response = await fetch(OPENROUTER_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${cfg.openRouterApiKey}`,
        'HTTP-Referer': APP_URL,
        'X-Title': 'Revamp-IT',
      },
      body: JSON.stringify({
        model: OPENROUTER_MODEL,
        messages: [
          { role: 'system', content: opts.systemPrompt },
          { role: 'user', content: opts.userPrompt },
        ],
        temperature: opts.temperature ?? 0.3,
        max_tokens: opts.maxTokens ?? 4096,
      }),
      signal: controller.signal,
    })

    if (!response.ok) {
      const errorText = await response.text().catch(() => '')
      if (response.status === 401 || response.status === 403) {
        return { provider: 'openrouter', reason: 'auth', message: `API-Schlüssel ungültig (${response.status})` }
      }
      if (response.status === 402) {
        return { provider: 'openrouter', reason: 'auth', message: 'OpenRouter: Datenschutz-Einstellungen prüfen oder Guthaben kaufen (openrouter.ai/settings)' }
      }
      if (response.status === 429) {
        return { provider: 'openrouter', reason: 'rate_limit', message: 'Rate-Limit erreicht' }
      }
      return { provider: 'openrouter', reason: 'unknown', message: `HTTP ${response.status}: ${errorText.substring(0, 200)}` }
    }

    let result: Record<string, unknown>
    try {
      result = await response.json()
    } catch {
      return { provider: 'openrouter', reason: 'parse', message: 'Ungültige JSON-Antwort von OpenRouter' }
    }

    const text = (result.choices as Array<{ message?: { content?: string } }>)?.[0]?.message?.content || ''
    return { text, model: `openrouter:${OPENROUTER_MODEL}`, provider: 'openrouter' }
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      return { provider: 'openrouter', reason: 'timeout', message: `Zeitüberschreitung nach ${(opts.timeoutMs || DEFAULT_TIMEOUT_MS) / 1000}s` }
    }
    return { provider: 'openrouter', reason: 'network', message: error instanceof Error ? error.message : 'Netzwerkfehler' }
  } finally {
    clearTimeout(timeoutId)
  }
}

async function callOllama(opts: CallOptions, cfg: ProviderRuntimeConfig): Promise<ProviderResult | ProviderError> {
  if (!cfg.ollamaEnabled || !cfg.ollamaUrl) {
    return { provider: 'ollama', reason: 'no_key', message: 'Ollama ist deaktiviert' }
  }

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), opts.timeoutMs || DEFAULT_TIMEOUT_MS)

  try {
    const response = await fetch(`${cfg.ollamaUrl}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: cfg.ollamaModel,
        prompt: `${opts.systemPrompt}\n\n${opts.userPrompt}`,
        stream: false,
        options: {
          temperature: opts.temperature ?? 0.3,
          num_predict: opts.maxTokens ?? 4096,
        },
      }),
      signal: controller.signal,
    })

    if (!response.ok) {
      return { provider: 'ollama', reason: 'unknown', message: `HTTP ${response.status}` }
    }

    let result: Record<string, unknown>
    try {
      result = await response.json()
    } catch {
      return { provider: 'ollama', reason: 'parse', message: 'Ungültige JSON-Antwort von Ollama' }
    }

    const text = (result.response as string) || ''
    return { text, model: `ollama:${cfg.ollamaModel}`, provider: 'ollama' }
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      return { provider: 'ollama', reason: 'timeout', message: `Zeitüberschreitung nach ${(opts.timeoutMs || DEFAULT_TIMEOUT_MS) / 1000}s` }
    }
    return { provider: 'ollama', reason: 'network', message: 'Ollama nicht erreichbar (läuft der Service?)' }
  } finally {
    clearTimeout(timeoutId)
  }
}

function isError(result: ProviderResult | ProviderError): result is ProviderError {
  return 'reason' in result
}

// =============================================================================
// PUBLIC API
// =============================================================================

/**
 * Call AI providers in cascade: Groq → OpenRouter → Ollama.
 * Returns the first successful response with info about which providers failed.
 */
export async function callWithFallback(opts: CallOptions): Promise<CallResult | null> {
  const cfg = await loadProviderRuntimeConfig()

  const providers: Array<(o: CallOptions, c: ProviderRuntimeConfig) => Promise<ProviderResult | ProviderError>> = [
    callGroq,
    callOpenRouter,
    callOllama,
  ]

  const failedProviders: ProviderError[] = []

  for (const provider of providers) {
    const result = await provider(opts, cfg)

    if (isError(result)) {
      failedProviders.push(result)
      logger.warn(`AI provider ${result.provider} failed`, {
        reason: result.reason,
        message: result.message,
      })
      continue
    }

    if (failedProviders.length > 0) {
      logger.info(`AI fallback to ${result.provider}`, {
        failedProviders: failedProviders.map(p => `${p.provider}:${p.reason}`),
      })
    }

    return {
      text: result.text,
      model: result.model,
      provider: result.provider,
      failedProviders,
    }
  }

  logger.error('All AI providers failed', {
    failures: failedProviders.map(p => ({ provider: p.provider, reason: p.reason, message: p.message })),
  })

  return null
}

/**
 * Extract JSON from AI response text using a regex pattern.
 */
export function extractJson(text: string, pattern: RegExp): unknown | null {
  const match = text.match(pattern)
  if (!match) return null

  try {
    return JSON.parse(match[0])
  } catch {
    return null
  }
}

/**
 * Build a human-readable error message from failed providers.
 */
export function buildFailureMessage(failedProviders: ProviderError[]): string {
  if (failedProviders.length === 0) {
    return 'KI-Service nicht verfügbar.'
  }

  const authFailed = failedProviders.some(p => p.reason === 'auth')
  if (authFailed) {
    return 'KI-Service: API-Schlüssel ungültig oder abgelaufen. Bitte Administrator kontaktieren.'
  }

  const allNetwork = failedProviders.every(p => p.reason === 'network' || p.reason === 'no_key')
  if (allNetwork) {
    return 'Kein KI-Service erreichbar. Bitte prüfen Sie die Konfiguration.'
  }

  return 'KI-Verarbeitung fehlgeschlagen. Bitte später erneut versuchen.'
}
