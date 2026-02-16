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

// =============================================================================
// CONFIGURATION (SSOT - all AI provider settings in one place)
// =============================================================================

const GROQ_API_KEY = process.env.GROQ_API_KEY || ''
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions'
const GROQ_MODEL = 'llama-3.3-70b-versatile'

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY || ''
const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions'
const OPENROUTER_MODEL = 'meta-llama/llama-3.3-70b-instruct:free'

const OLLAMA_URL = process.env.OLLAMA_URL || 'http://localhost:11434'
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'llama3.2'

const DEFAULT_TIMEOUT_MS = 30000

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

async function callGroq(opts: CallOptions): Promise<ProviderResult | ProviderError> {
  if (!GROQ_API_KEY) {
    return { provider: 'groq', reason: 'no_key', message: 'GROQ_API_KEY nicht konfiguriert' }
  }

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), opts.timeoutMs || DEFAULT_TIMEOUT_MS)

  try {
    const response = await fetch(GROQ_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${GROQ_API_KEY}`,
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

async function callOpenRouter(opts: CallOptions): Promise<ProviderResult | ProviderError> {
  if (!OPENROUTER_API_KEY) {
    return { provider: 'openrouter', reason: 'no_key', message: 'OPENROUTER_API_KEY nicht konfiguriert' }
  }

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), opts.timeoutMs || DEFAULT_TIMEOUT_MS)

  try {
    const response = await fetch(OPENROUTER_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'https://revamp-it.ch',
        'X-Title': 'RevampIT',
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

async function callOllama(opts: CallOptions): Promise<ProviderResult | ProviderError> {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), opts.timeoutMs || DEFAULT_TIMEOUT_MS)

  try {
    const response = await fetch(`${OLLAMA_URL}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: OLLAMA_MODEL,
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
    return { text, model: `ollama:${OLLAMA_MODEL}`, provider: 'ollama' }
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
  const providers: Array<(o: CallOptions) => Promise<ProviderResult | ProviderError>> = [
    callGroq,
    callOpenRouter,
    callOllama,
  ]

  const failedProviders: ProviderError[] = []

  for (const provider of providers) {
    const result = await provider(opts)

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
