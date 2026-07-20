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
import { ORG } from '@/config/org'

// =============================================================================
// CONFIGURATION (SSOT - all AI provider settings in one place)
// =============================================================================

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions'
const GROQ_MODEL = 'llama-3.3-70b-versatile'
// Fallback for large prompts. Groq decommissioned Llama-4-Scout (404
// model_not_found), so fall back to the versatile 128k model — a dead model id
// here silently broke the large-prompt retry path.
const GROQ_LARGE_CONTEXT_MODEL = 'llama-3.3-70b-versatile'

const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions'
const OPENROUTER_MODEL = 'meta-llama/llama-3.3-70b-instruct:free'

// Vision-capable models (multimodal). Groq RETIRED Llama-4-Scout — its whole
// lineup lost vision except Qwen3 (verified: qwen/qwen3.6-27b accepts image_url);
// OpenRouter keeps a free vision model as fallback. Used by callVisionWithFallback
// so photo analysis works on prod (Ollama vision is local-dev only, not deployed).
const GROQ_VISION_MODEL = 'qwen/qwen3.6-27b'
const OPENROUTER_VISION_MODEL = 'meta-llama/llama-3.2-11b-vision-instruct:free'

const DEFAULT_TIMEOUT_MS = 60000

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

async function callGroqWithModel(
  model: string,
  opts: CallOptions,
  cfg: ProviderRuntimeConfig,
  signal: AbortSignal,
): Promise<{ ok: true; text: string } | { ok: false; tooLarge: boolean; errorText: string; status: number }> {
  const response = await fetch(GROQ_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${cfg.groqApiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: opts.systemPrompt },
        { role: 'user', content: opts.userPrompt },
      ],
      temperature: opts.temperature ?? 0.3,
      max_tokens: opts.maxTokens ?? 4096,
    }),
    signal,
  })

  if (!response.ok) {
    const errorText = await response.text().catch(() => '')
    // Groq returns 413 or 429 with "Request too large" when the prompt exceeds the model's rate limit
    const tooLarge = (response.status === 413) ||
      (response.status === 429 && errorText.includes('Request too large'))
    return { ok: false, tooLarge, errorText, status: response.status }
  }

  let result: Record<string, unknown>
  try {
    result = await response.json()
  } catch {
    return { ok: false, tooLarge: false, errorText: 'Ungültige JSON-Antwort', status: 200 }
  }

  const text = (result.choices as Array<{ message?: { content?: string } }>)?.[0]?.message?.content || ''
  return { ok: true, text }
}

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
    const primary = await callGroqWithModel(GROQ_MODEL, opts, cfg, controller.signal)

    if (primary.ok) {
      return { text: primary.text, model: `groq:${GROQ_MODEL}`, provider: 'groq' }
    }

    // Primary model hit token limit → retry with large-context model transparently
    if (primary.tooLarge) {
      logger.info('Groq primary model token limit hit, retrying with large-context model', {
        primaryModel: GROQ_MODEL,
        fallbackModel: GROQ_LARGE_CONTEXT_MODEL,
      })
      const fallback = await callGroqWithModel(GROQ_LARGE_CONTEXT_MODEL, opts, cfg, controller.signal)
      if (fallback.ok) {
        return { text: fallback.text, model: `groq:${GROQ_LARGE_CONTEXT_MODEL}`, provider: 'groq' }
      }
      return { provider: 'groq', reason: 'rate_limit', message: `Anfrage zu gross für alle Groq-Modelle: ${fallback.errorText.substring(0, 200)}` }
    }

    if (primary.status === 401 || primary.status === 403) {
      return { provider: 'groq', reason: 'auth', message: `API-Schlüssel ungültig oder abgelaufen (${primary.status})` }
    }
    if (primary.status === 429) {
      return { provider: 'groq', reason: 'rate_limit', message: 'Rate-Limit erreicht' }
    }
    return { provider: 'groq', reason: 'unknown', message: `HTTP ${primary.status}: ${primary.errorText.substring(0, 200)}` }
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
        'X-Title': ORG.name,
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

export interface VisionCallOptions {
  prompt: string
  /** Full data URL: `data:image/jpeg;base64,...` */
  imageDataUrl: string
  temperature?: number
  maxTokens?: number
  timeoutMs?: number
}

/** OpenAI-compatible vision call (Groq + OpenRouter share this shape). */
async function callOpenAICompatVision(
  provider: 'groq' | 'openrouter',
  url: string,
  apiKey: string,
  model: string,
  opts: VisionCallOptions,
): Promise<ProviderResult | ProviderError> {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), opts.timeoutMs || DEFAULT_TIMEOUT_MS)
  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    }
    if (provider === 'openrouter') {
      headers['HTTP-Referer'] = APP_URL
      headers['X-Title'] = ORG.name
    }
    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        model,
        messages: [{
          role: 'user',
          content: [
            { type: 'text', text: opts.prompt },
            { type: 'image_url', image_url: { url: opts.imageDataUrl } },
          ],
        }],
        temperature: opts.temperature ?? 0.3,
        // Headroom for reasoning vision models (Qwen3 emits <think> before the
        // JSON) — too low a ceiling truncates the answer before the JSON block.
        max_tokens: opts.maxTokens ?? 4096,
      }),
      signal: controller.signal,
    })
    if (!response.ok) {
      const errorText = await response.text().catch(() => '')
      const reason: ProviderError['reason'] =
        response.status === 401 || response.status === 403 ? 'auth'
        : response.status === 429 ? 'rate_limit' : 'unknown'
      return { provider, reason, message: `HTTP ${response.status}: ${errorText.substring(0, 200)}` }
    }
    const result = await response.json().catch(() => null) as { choices?: Array<{ message?: { content?: string } }> } | null
    const text = result?.choices?.[0]?.message?.content || ''
    if (!text) return { provider, reason: 'parse', message: 'Leere Vision-Antwort' }
    return { text, model, provider }
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      return { provider, reason: 'timeout', message: `Zeitüberschreitung nach ${(opts.timeoutMs || DEFAULT_TIMEOUT_MS) / 1000}s` }
    }
    return { provider, reason: 'network', message: error instanceof Error ? error.message : 'Netzwerkfehler' }
  } finally {
    clearTimeout(timeoutId)
  }
}

/** Ollama vision (local dev only — /api/generate with images). */
async function callOllamaVision(cfg: ProviderRuntimeConfig, opts: VisionCallOptions): Promise<ProviderResult | ProviderError> {
  const model = process.env.OLLAMA_VISION_MODEL || 'llama3.2-vision'
  const base64 = opts.imageDataUrl.replace(/^data:image\/\w+;base64,/, '')
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), opts.timeoutMs || DEFAULT_TIMEOUT_MS)
  try {
    const response = await fetch(`${cfg.ollamaUrl}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model, prompt: opts.prompt, images: [base64], stream: false, options: { temperature: opts.temperature ?? 0.3 } }),
      signal: controller.signal,
    })
    if (!response.ok) return { provider: 'ollama', reason: 'unknown', message: `HTTP ${response.status}` }
    const result = await response.json().catch(() => null) as { response?: string } | null
    const text = result?.response || ''
    if (!text) return { provider: 'ollama', reason: 'parse', message: 'Leere Antwort' }
    return { text, model: `ollama:${model}`, provider: 'ollama' }
  } catch {
    return { provider: 'ollama', reason: 'network', message: 'Ollama nicht erreichbar' }
  } finally {
    clearTimeout(timeoutId)
  }
}

/**
 * Vision cascade: Groq (Llama 4 Scout) → OpenRouter (free vision) → Ollama
 * (local dev). Fixes photo analysis on prod, where Ollama isn't deployed.
 */
export async function callVisionWithFallback(opts: VisionCallOptions): Promise<CallResult | null> {
  const cfg = await loadProviderRuntimeConfig()
  const failed: ProviderError[] = []

  const attempts: Array<() => Promise<ProviderResult | ProviderError>> = []
  if (cfg.groqEnabled && cfg.groqApiKey) {
    attempts.push(() => callOpenAICompatVision('groq', GROQ_API_URL, cfg.groqApiKey, GROQ_VISION_MODEL, opts))
  }
  if (cfg.openRouterEnabled && cfg.openRouterApiKey) {
    attempts.push(() => callOpenAICompatVision('openrouter', OPENROUTER_API_URL, cfg.openRouterApiKey, OPENROUTER_VISION_MODEL, opts))
  }
  if (cfg.ollamaEnabled && cfg.ollamaUrl) {
    attempts.push(() => callOllamaVision(cfg, opts))
  }

  for (const attempt of attempts) {
    const result = await attempt()
    if (isError(result)) {
      failed.push(result)
      logger.warn(`Vision provider ${result.provider} failed`, { reason: result.reason, message: result.message })
      continue
    }
    if (failed.length > 0) logger.info(`Vision fallback to ${result.provider}`, { failed: failed.map(p => `${p.provider}:${p.reason}`) })
    return { text: result.text, model: result.model, provider: result.provider, failedProviders: failed }
  }
  logger.error('All vision providers failed', { failures: failed.map(p => ({ provider: p.provider, reason: p.reason })) })
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
    return 'Kein KI-Service erreichbar. Bitte prüfe die Konfiguration.'
  }

  return 'KI-Verarbeitung fehlgeschlagen. Bitte später erneut versuchen.'
}
