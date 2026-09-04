/**
 * AI Provider Configuration - SSOT
 *
 * Centralized provider config for all AI operations (protocol processing, extraction, etc.).
 * Cascade: Groq (cloud, free) → OpenRouter (cloud, pay-per-token) → Ollama (local).
 *
 * Each caller provides system+user prompts; this module handles provider selection,
 * timeout, fallback, and error categorization.
 */

import { logger } from '@/lib/logger';
import { db } from '@/db';
import { hirnProviderSettings } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';
import { OLLAMA_URL, APP_URL } from '@/config/urls';
import { ORG } from '@/config/org';
import { recordAIToolsFailure, recordAIToolsSuccess } from './health';
import { freeChain, usableChain, tryChain, ChainExhaustedError, type Link } from '@bitbaum/ai-kit';

// =============================================================================
// CONFIGURATION (SSOT - all AI provider settings in one place)
// =============================================================================

// ── Read the comments below before changing a model id ──────────────────────
//
// This block has now been repinned three times, and the first two repins are
// still visible in its history: Llama-4-Scout was decommissioned, so it moved
// to `llama-3.3-70b-versatile` — and Groq has since retired the entire
// llama-3.x family, so that id died too, along with every OpenRouter llama-3
// entry beside it. Four of the five ids here were dead simultaneously.
//
// Repinning is what this repo kept doing and it did not fix the class of
// problem. `callWithFallback` (the plain-text cascade below) no longer pins a
// model at all: it builds its chain from ai-kit's `freeChain`, the fleet's
// maintained, multi-model-per-vendor list, so a single retired id demotes to
// the next model or vendor instead of taking the feature down. See
// `callOpenAICompatText` / `callWithFallback`.
//
// The vision cascade (`callVisionWithFallback`, further down) is the one
// exception — ai-kit's `freeChain` carries no vision-capable free model, so it
// still pins GROQ_VISION_MODEL / OPENROUTER_VISION_MODEL by hand below.
// dotfiles/scripts/ci/model-pin-audit.mjs asks both vendors DAILY whether
// those two ids still exist, so a retirement surfaces within a day instead of
// on a user's screen. Both verified present in the live catalogue 2026-08-27.
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';

// Vision-capable models (multimodal). Groq's lineup lost vision except Qwen3
// (verified: qwen/qwen3.6-27b accepts image_url, and it is still listed);
// OpenRouter keeps a free vision model as fallback. Used by
// callVisionWithFallback so photo analysis works on prod (Ollama vision is
// local-dev only, not deployed).
//
// The OpenRouter vision id was `meta-llama/llama-3.2-11b-vision-instruct:free`,
// retired with the rest of that family. Its replacement was chosen against the
// live catalogue on three properties, not on name: `:free` with
// `pricing.prompt = 0`, `image` in its input modalities, and tool support.
const GROQ_VISION_MODEL = 'qwen/qwen3.6-27b';
const OPENROUTER_VISION_MODEL = 'google/gemma-4-26b-a4b-it:free';

const DEFAULT_TIMEOUT_MS = 60000;

interface ProviderRuntimeConfig {
  groqEnabled: boolean;
  openRouterEnabled: boolean;
  ollamaEnabled: boolean;
  groqApiKey: string;
  openRouterApiKey: string;
  ollamaUrl: string;
  ollamaModel: string;
}

interface DbProviderSettingsRow {
  provider: ProviderName;
  is_enabled: boolean;
  settings: {
    api_key?: string;
    base_url?: string;
    model?: string;
    [key: string]: unknown;
  } | null;
}

// Cache provider config to avoid a DB query on every AI call
const PROVIDER_CACHE_TTL_MS = 60_000;
let _providerCache: { config: ProviderRuntimeConfig; expiresAt: number } | null = null;

/** @internal — exposed for testing only */
export function __resetProviderCache(): void {
  _providerCache = null;
}

/** @internal — exposed for testing only */
export async function __loadProviderRuntimeConfig(): Promise<ProviderRuntimeConfig> {
  return loadProviderRuntimeConfig();
}

async function loadProviderRuntimeConfig(): Promise<ProviderRuntimeConfig> {
  if (_providerCache && Date.now() < _providerCache.expiresAt) {
    return _providerCache.config;
  }

  const envConfig: ProviderRuntimeConfig = {
    groqEnabled: true,
    openRouterEnabled: true,
    ollamaEnabled: true,
    groqApiKey: process.env.GROQ_API_KEY || '',
    openRouterApiKey: process.env.OPENROUTER_API_KEY || '',
    ollamaUrl: OLLAMA_URL,
    ollamaModel: process.env.OLLAMA_MODEL || 'llama3.2',
  };

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
      );

    const byProvider = new Map(
      rows.map((r) => [
        r.provider as ProviderName,
        {
          provider: r.provider as ProviderName,
          is_enabled: r.isEnabled ?? true,
          settings: r.settings as DbProviderSettingsRow['settings'],
        },
      ]),
    );

    const groq = byProvider.get('groq');
    const openrouter = byProvider.get('openrouter');
    const ollama = byProvider.get('ollama');

    const resolved: ProviderRuntimeConfig = {
      groqEnabled: groq ? groq.is_enabled : envConfig.groqEnabled,
      openRouterEnabled: openrouter ? openrouter.is_enabled : envConfig.openRouterEnabled,
      ollamaEnabled: ollama ? ollama.is_enabled : envConfig.ollamaEnabled,
      // API keys: DB value takes priority, then env var fallback, then empty if disabled
      groqApiKey: groq?.is_enabled
        ? groq.settings?.api_key || envConfig.groqApiKey
        : groq
          ? ''
          : envConfig.groqApiKey,
      openRouterApiKey: openrouter?.is_enabled
        ? openrouter.settings?.api_key || envConfig.openRouterApiKey
        : openrouter
          ? ''
          : envConfig.openRouterApiKey,
      ollamaUrl: ollama?.is_enabled
        ? (ollama.settings?.base_url as string | undefined) || envConfig.ollamaUrl
        : ollama
          ? ''
          : envConfig.ollamaUrl,
      ollamaModel: ollama?.is_enabled
        ? (ollama.settings?.model as string | undefined) || envConfig.ollamaModel
        : ollama
          ? ''
          : envConfig.ollamaModel,
    };
    _providerCache = { config: resolved, expiresAt: Date.now() + PROVIDER_CACHE_TTL_MS };
    return resolved;
  } catch (error) {
    logger.warn('AI provider settings table unavailable; falling back to environment config', {
      error,
    });
    _providerCache = { config: envConfig, expiresAt: Date.now() + PROVIDER_CACHE_TTL_MS };
    return envConfig;
  }
}

// =============================================================================
// TYPES
// =============================================================================

type ProviderName = 'groq' | 'openrouter' | 'ollama';

interface ProviderResult {
  text: string;
  model: string;
  provider: ProviderName;
}

interface ProviderError {
  provider: ProviderName;
  reason: 'no_key' | 'auth' | 'rate_limit' | 'timeout' | 'network' | 'parse' | 'unknown';
  message: string;
}

export interface CallResult {
  text: string;
  model: string;
  provider: ProviderName;
  failedProviders: ProviderError[];
}

export interface CallOptions {
  systemPrompt: string;
  userPrompt: string;
  temperature?: number;
  maxTokens?: number;
  timeoutMs?: number;
}

// =============================================================================
// PROVIDER IMPLEMENTATIONS
// =============================================================================

/**
 * One attempt at one ai-kit chain link (a vendor + a free model id). Thrown
 * errors carry the same `reason` taxonomy the hand-rolled `callGroq`/
 * `callOpenRouter` used to return inline, so `onLinkFailure` below can still
 * build a `ProviderError` for `buildFailureMessage`.
 */
class ChainLinkError extends Error {
  constructor(
    readonly reason: ProviderError['reason'],
    message: string,
  ) {
    super(message);
    this.name = 'ChainLinkError';
  }
}

async function callOpenAICompatText(
  link: Link,
  apiKey: string,
  opts: CallOptions,
): Promise<ProviderResult> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), opts.timeoutMs || DEFAULT_TIMEOUT_MS);
  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    };
    if (link.provider.id === 'openrouter') {
      headers['HTTP-Referer'] = APP_URL;
      headers['X-Title'] = ORG.name;
    }

    const response = await fetch(`${link.provider.baseUrl}/chat/completions`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        model: link.model,
        messages: [
          { role: 'system', content: opts.systemPrompt },
          { role: 'user', content: opts.userPrompt },
        ],
        temperature: opts.temperature ?? 0.3,
        max_tokens: opts.maxTokens ?? 4096,
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => '');
      if (response.status === 401 || response.status === 403) {
        throw new ChainLinkError(
          'auth',
          `API-Schlüssel ungültig oder abgelaufen (${response.status})`, // i18n-ok
        );
      }
      // 402 is OpenRouter-specific: a privacy setting or exhausted credit, not
      // a bad key — surfaced under 'auth' so buildFailureMessage still points
      // the user at the admin rather than a generic retry.
      if (response.status === 402 && link.provider.id === 'openrouter') {
        throw new ChainLinkError(
          'auth',
          'OpenRouter: Datenschutz-Einstellungen prüfen oder Guthaben kaufen (openrouter.ai/settings)',
        );
      }
      if (response.status === 429) {
        throw new ChainLinkError('rate_limit', 'Rate-Limit erreicht');
      }
      throw new ChainLinkError(
        'unknown',
        `HTTP ${response.status}: ${errorText.substring(0, 200)}`,
      );
    }

    let result: Record<string, unknown>;
    try {
      result = await response.json();
    } catch {
      throw new ChainLinkError('parse', 'Ungültige JSON-Antwort');
    }

    const text =
      (result.choices as Array<{ message?: { content?: string } }>)?.[0]?.message?.content || '';
    if (!text) throw new ChainLinkError('parse', 'Leere Antwort');

    return {
      text,
      model: `${link.provider.id}:${link.model}`,
      provider: link.provider.id as ProviderName,
    };
  } catch (error) {
    if (error instanceof ChainLinkError) throw error;
    if (error instanceof Error && error.name === 'AbortError') {
      throw new ChainLinkError(
        'timeout',
        `Zeitüberschreitung nach ${(opts.timeoutMs || DEFAULT_TIMEOUT_MS) / 1000}s`,
      );
    }
    throw new ChainLinkError('network', error instanceof Error ? error.message : 'Netzwerkfehler');
  } finally {
    clearTimeout(timeoutId);
  }
}

async function callOllama(
  opts: CallOptions,
  cfg: ProviderRuntimeConfig,
): Promise<ProviderResult | ProviderError> {
  if (!cfg.ollamaEnabled || !cfg.ollamaUrl) {
    return { provider: 'ollama', reason: 'no_key', message: 'Ollama ist deaktiviert' };
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), opts.timeoutMs || DEFAULT_TIMEOUT_MS);

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
    });

    if (!response.ok) {
      return { provider: 'ollama', reason: 'unknown', message: `HTTP ${response.status}` };
    }

    let result: Record<string, unknown>;
    try {
      result = await response.json();
    } catch {
      return { provider: 'ollama', reason: 'parse', message: 'Ungültige JSON-Antwort von Ollama' };
    }

    const text = (result.response as string) || '';
    return { text, model: `ollama:${cfg.ollamaModel}`, provider: 'ollama' };
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      return {
        provider: 'ollama',
        reason: 'timeout',
        message: `Zeitüberschreitung nach ${(opts.timeoutMs || DEFAULT_TIMEOUT_MS) / 1000}s`,
      };
    }
    return {
      provider: 'ollama',
      reason: 'network',
      message: 'Ollama nicht erreichbar (läuft der Service?)',
    };
  } finally {
    clearTimeout(timeoutId);
  }
}

function isError(result: ProviderResult | ProviderError): result is ProviderError {
  return 'reason' in result;
}

// =============================================================================
// PUBLIC API
// =============================================================================

/** ai-kit env-var prefix for this app's text chain (see ai-kit's `withEnvPrefix`). */
const AI_KIT_CHAIN_PREFIX = 'EVIG';

/**
 * An `Env` for `usableChain` that reflects the DB-resolved config, not raw
 * `process.env` — a provider disabled or re-keyed in `/admin/hirn` must drop
 * out of (or change) the chain without a redeploy, same as before this
 * migration. Everything else (e.g. an `EVIG_GROQ_MODELS` override) still
 * comes through from `process.env`.
 */
function buildChainEnv(cfg: ProviderRuntimeConfig): Record<string, string | undefined> {
  return {
    ...process.env,
    GROQ_API_KEY: cfg.groqEnabled ? cfg.groqApiKey || undefined : undefined,
    OPENROUTER_API_KEY: cfg.openRouterEnabled ? cfg.openRouterApiKey || undefined : undefined,
  };
}

/**
 * ONE link per vendor. `freeChain` lists several free models per provider,
 * but a second model at the SAME vendor draws on the same org-wide daily
 * budget — so trying it first just spends latency on a near-certain repeat
 * failure. Matches the pattern already in surf-your-life's `lib/domain/llm.ts`
 * and aoz-housing's `src/lib/ai/provider.ts`.
 */
function oneLinkPerVendor(links: Link[]): Link[] {
  const seen = new Set<string>();
  return links.filter((link) => {
    if (seen.has(link.provider.id)) return false;
    seen.add(link.provider.id);
    return true;
  });
}

/**
 * Call AI providers in cascade: Groq → OpenRouter (via ai-kit's maintained
 * `freeChain`) → Ollama (local, not part of ai-kit — see module header).
 * Returns the first successful response with info about which providers failed.
 */
export async function callWithFallback(opts: CallOptions): Promise<CallResult | null> {
  const cfg = await loadProviderRuntimeConfig();
  const chainEnv = buildChainEnv(cfg);
  const chain = oneLinkPerVendor(usableChain(freeChain(AI_KIT_CHAIN_PREFIX), chainEnv));

  const failedProviders: ProviderError[] = [];

  // Providers `usableChain` silently drops (disabled, or no key) still need to
  // show up in the failure list, same as the old callGroq/callOpenRouter did.
  if (!cfg.groqEnabled) {
    failedProviders.push({ provider: 'groq', reason: 'no_key', message: 'Groq ist deaktiviert' });
  } else if (!cfg.groqApiKey) {
    failedProviders.push({
      provider: 'groq',
      reason: 'no_key',
      message: 'GROQ_API_KEY nicht konfiguriert',
    });
  }
  if (!cfg.openRouterEnabled) {
    failedProviders.push({
      provider: 'openrouter',
      reason: 'no_key',
      message: 'OpenRouter ist deaktiviert',
    });
  } else if (!cfg.openRouterApiKey) {
    failedProviders.push({
      provider: 'openrouter',
      reason: 'no_key',
      message: 'OPENROUTER_API_KEY nicht konfiguriert',
    });
  }

  if (chain.length > 0) {
    try {
      const result = await tryChain(chain, {
        attempt: (link) => callOpenAICompatText(link, chainEnv[link.provider.keyEnv] ?? '', opts),
        onLinkFailure: (link, error) => {
          const reason = error instanceof ChainLinkError ? error.reason : 'unknown';
          const message = error instanceof Error ? error.message : String(error);
          failedProviders.push({ provider: link.provider.id as ProviderName, reason, message });
          logger.warn(`AI provider ${link.provider.id} failed`, {
            model: link.model,
            reason,
            message,
          });
        },
      });

      if (failedProviders.length > 0) {
        logger.info(`AI fallback to ${result.provider}`, {
          failedProviders: failedProviders.map((p) => `${p.provider}:${p.reason}`),
        });
      }
      recordAIToolsSuccess();
      return { text: result.text, model: result.model, provider: result.provider, failedProviders };
    } catch (error) {
      if (!(error instanceof ChainExhaustedError)) throw error;
      // Every ai-kit link failed (already recorded via onLinkFailure above) —
      // fall through to Ollama below rather than giving up.
    }
  }

  const ollamaResult = await callOllama(opts, cfg);
  if (!isError(ollamaResult)) {
    if (failedProviders.length > 0) {
      logger.info(`AI fallback to ${ollamaResult.provider}`, {
        failedProviders: failedProviders.map((p) => `${p.provider}:${p.reason}`),
      });
    }
    recordAIToolsSuccess();
    return {
      text: ollamaResult.text,
      model: ollamaResult.model,
      provider: ollamaResult.provider,
      failedProviders,
    };
  }
  failedProviders.push(ollamaResult);
  logger.warn(`AI provider ${ollamaResult.provider} failed`, {
    reason: ollamaResult.reason,
    message: ollamaResult.message,
  });

  logger.error('All AI providers failed', {
    failures: failedProviders.map((p) => ({
      provider: p.provider,
      reason: p.reason,
      message: p.message,
    })),
  });

  recordAIToolsFailure(buildFailureMessage(failedProviders));
  return null;
}

export interface VisionCallOptions {
  prompt: string;
  /** Full data URL: `data:image/jpeg;base64,...` */
  imageDataUrl: string;
  temperature?: number;
  maxTokens?: number;
  timeoutMs?: number;
}

/** OpenAI-compatible vision call (Groq + OpenRouter share this shape). */
async function callOpenAICompatVision(
  provider: 'groq' | 'openrouter',
  url: string,
  apiKey: string,
  model: string,
  opts: VisionCallOptions,
): Promise<ProviderResult | ProviderError> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), opts.timeoutMs || DEFAULT_TIMEOUT_MS);
  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    };
    if (provider === 'openrouter') {
      headers['HTTP-Referer'] = APP_URL;
      headers['X-Title'] = ORG.name;
    }
    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        model,
        messages: [
          {
            role: 'user',
            content: [
              { type: 'text', text: opts.prompt },
              { type: 'image_url', image_url: { url: opts.imageDataUrl } },
            ],
          },
        ],
        temperature: opts.temperature ?? 0.3,
        // Headroom for reasoning vision models (Qwen3 emits <think> before the
        // JSON) — too low a ceiling truncates the answer before the JSON block.
        max_tokens: opts.maxTokens ?? 4096,
      }),
      signal: controller.signal,
    });
    if (!response.ok) {
      const errorText = await response.text().catch(() => '');
      const reason: ProviderError['reason'] =
        response.status === 401 || response.status === 403
          ? 'auth'
          : response.status === 429
            ? 'rate_limit'
            : 'unknown';
      return {
        provider,
        reason,
        message: `HTTP ${response.status}: ${errorText.substring(0, 200)}`,
      };
    }
    const result = (await response.json().catch(() => null)) as {
      choices?: Array<{ message?: { content?: string } }>;
    } | null;
    const text = result?.choices?.[0]?.message?.content || '';
    if (!text) return { provider, reason: 'parse', message: 'Leere Vision-Antwort' };
    return { text, model, provider };
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      return {
        provider,
        reason: 'timeout',
        message: `Zeitüberschreitung nach ${(opts.timeoutMs || DEFAULT_TIMEOUT_MS) / 1000}s`,
      };
    }
    return {
      provider,
      reason: 'network',
      message: error instanceof Error ? error.message : 'Netzwerkfehler',
    };
  } finally {
    clearTimeout(timeoutId);
  }
}

/** Ollama vision (local dev only — /api/generate with images). */
async function callOllamaVision(
  cfg: ProviderRuntimeConfig,
  opts: VisionCallOptions,
): Promise<ProviderResult | ProviderError> {
  const model = process.env.OLLAMA_VISION_MODEL || 'llama3.2-vision';
  const base64 = opts.imageDataUrl.replace(/^data:image\/\w+;base64,/, '');
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), opts.timeoutMs || DEFAULT_TIMEOUT_MS);
  try {
    const response = await fetch(`${cfg.ollamaUrl}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model,
        prompt: opts.prompt,
        images: [base64],
        stream: false,
        options: { temperature: opts.temperature ?? 0.3 },
      }),
      signal: controller.signal,
    });
    if (!response.ok)
      return { provider: 'ollama', reason: 'unknown', message: `HTTP ${response.status}` };
    const result = (await response.json().catch(() => null)) as { response?: string } | null;
    const text = result?.response || '';
    if (!text) return { provider: 'ollama', reason: 'parse', message: 'Leere Antwort' };
    return { text, model: `ollama:${model}`, provider: 'ollama' };
  } catch {
    return { provider: 'ollama', reason: 'network', message: 'Ollama nicht erreichbar' };
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Vision cascade: Groq (Llama 4 Scout) → OpenRouter (free vision) → Ollama
 * (local dev). Fixes photo analysis on prod, where Ollama isn't deployed.
 */
export async function callVisionWithFallback(opts: VisionCallOptions): Promise<CallResult | null> {
  const cfg = await loadProviderRuntimeConfig();
  const failed: ProviderError[] = [];

  const attempts: Array<() => Promise<ProviderResult | ProviderError>> = [];
  if (cfg.groqEnabled && cfg.groqApiKey) {
    attempts.push(() =>
      callOpenAICompatVision('groq', GROQ_API_URL, cfg.groqApiKey, GROQ_VISION_MODEL, opts),
    );
  }
  if (cfg.openRouterEnabled && cfg.openRouterApiKey) {
    attempts.push(() =>
      callOpenAICompatVision(
        'openrouter',
        OPENROUTER_API_URL,
        cfg.openRouterApiKey,
        OPENROUTER_VISION_MODEL,
        opts,
      ),
    );
  }
  if (cfg.ollamaEnabled && cfg.ollamaUrl) {
    attempts.push(() => callOllamaVision(cfg, opts));
  }

  for (const attempt of attempts) {
    const result = await attempt();
    if (isError(result)) {
      failed.push(result);
      logger.warn(`Vision provider ${result.provider} failed`, {
        reason: result.reason,
        message: result.message,
      });
      continue;
    }
    if (failed.length > 0)
      logger.info(`Vision fallback to ${result.provider}`, {
        failed: failed.map((p) => `${p.provider}:${p.reason}`),
      });
    recordAIToolsSuccess();
    return {
      text: result.text,
      model: result.model,
      provider: result.provider,
      failedProviders: failed,
    };
  }
  logger.error('All vision providers failed', {
    failures: failed.map((p) => ({ provider: p.provider, reason: p.reason })),
  });
  recordAIToolsFailure(buildFailureMessage(failed));
  return null;
}

/**
 * Extract JSON from AI response text using a regex pattern.
 */
export function extractJson(text: string, pattern: RegExp): unknown | null {
  const match = text.match(pattern);
  if (!match) return null;

  try {
    return JSON.parse(match[0]);
  } catch {
    return null;
  }
}

/**
 * Build a human-readable error message from failed providers.
 */
export function buildFailureMessage(failedProviders: ProviderError[]): string {
  if (failedProviders.length === 0) {
    return 'KI-Service nicht verfügbar.';
  }

  const authFailed = failedProviders.some((p) => p.reason === 'auth');
  if (authFailed) {
    return 'KI-Service: API-Schlüssel ungültig oder abgelaufen. Bitte Administrator kontaktieren.';
  }

  const allNetwork = failedProviders.every((p) => p.reason === 'network' || p.reason === 'no_key');
  if (allNetwork) {
    return 'Kein KI-Service erreichbar. Bitte prüfe die Konfiguration.';
  }

  return 'KI-Verarbeitung fehlgeschlagen. Bitte später erneut versuchen.';
}
