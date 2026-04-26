/**
 * Tests for the pure exports of lib/ai/providers.ts.
 *
 * The provider runtime config + cache loading is already covered by
 * provider-config.test.ts. This file covers the two pure helpers used
 * by every AI consumer:
 *
 *   extractJson(text, pattern) — first-match JSON.parse with fallback
 *     to null on parse failure. Used by extractWithFallback (legacy
 *     extraction path) — sibling of robustJsonExtract in lib/ai/extract.ts
 *     but simpler/single-tier (no markdown stripping, no regex fallback).
 *
 *   buildFailureMessage(failedProviders) — Swiss-German user-facing
 *     error string when the AI cascade exhausts. Categorizes the
 *     failure by reason (auth → admin contact, network/no_key → check
 *     config, otherwise → generic retry message).
 */

// Mock the heavy deps so we can import providers.ts without booting Drizzle
jest.mock('@/db', () => ({ db: {} }))
jest.mock('@/db/schema', () => ({ hirnProviderSettings: {} }))
jest.mock('drizzle-orm', () => ({
  eq: jest.fn(),
  desc: jest.fn(),
}))
jest.mock('@/config/urls', () => ({
  OLLAMA_URL: 'http://localhost:11434',
  APP_URL: 'http://localhost:3000',
}))
jest.mock('@/lib/logger', () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() },
}))

import { extractJson, buildFailureMessage } from '../providers'

// Re-derive the ProviderError type from buildFailureMessage's parameter
// shape — we don't need the actual type export, just the shape
type FailureReason = 'no_key' | 'auth' | 'rate_limit' | 'timeout' | 'network' | 'parse' | 'unknown'
type ProviderName = 'groq' | 'openrouter' | 'ollama'
interface ProviderError {
  provider: ProviderName
  reason: FailureReason
  message: string
}

function err(provider: ProviderName, reason: FailureReason, message = 'failed'): ProviderError {
  return { provider, reason, message }
}

// ============================================================================
// extractJson
// ============================================================================

describe('extractJson', () => {
  it('returns null when the pattern does not match', () => {
    expect(extractJson('no JSON here', /\{[\s\S]*\}/)).toBeNull()
  })

  it('returns null for empty string', () => {
    expect(extractJson('', /\{[\s\S]*\}/)).toBeNull()
  })

  it('parses an object match into a real JS object', () => {
    expect(extractJson('{"x":1}', /\{[\s\S]*\}/)).toEqual({ x: 1 })
  })

  it('extracts the first {…} block from prose', () => {
    const text = 'Here you go: {"answer":42} — anything else?'
    expect(extractJson(text, /\{[\s\S]*?\}/)).toEqual({ answer: 42 })
  })

  it('returns null when the matched substring is not valid JSON', () => {
    // Pattern matches but JSON.parse throws — must NOT propagate
    expect(extractJson('{not valid json}', /\{[\s\S]*\}/)).toBeNull()
  })

  it('honors the caller-supplied pattern (e.g. array pattern)', () => {
    expect(extractJson('list: [1,2,3]', /\[[\s\S]*\]/)).toEqual([1, 2, 3])
  })

  it('parses nested objects', () => {
    const text = '{"user":{"name":"Anna","age":30}}'
    expect(extractJson(text, /\{[\s\S]*\}/)).toEqual({
      user: { name: 'Anna', age: 30 },
    })
  })

  it('parses booleans, numbers, and null inside the JSON', () => {
    const text = '{"active":true,"count":7,"missing":null}'
    expect(extractJson(text, /\{[\s\S]*\}/)).toEqual({
      active: true,
      count: 7,
      missing: null,
    })
  })

  it('returns the FIRST match when multiple JSON blocks exist (non-greedy pattern)', () => {
    const text = '{"first":1} ignored {"second":2}'
    expect(extractJson(text, /\{[\s\S]*?\}/)).toEqual({ first: 1 })
  })
})

// ============================================================================
// buildFailureMessage
// ============================================================================

describe('buildFailureMessage', () => {
  it('returns the generic "not available" message for empty input', () => {
    // Edge: shouldn't happen in practice (someone always failed), but
    // it documents that the function is total
    expect(buildFailureMessage([])).toBe('KI-Service nicht verfügbar.')
  })

  it('"auth" failure wins over everything else (returns admin-contact message)', () => {
    // Mixed failures with at least one auth → user must be told to
    // contact admin, not retry. An expired API key won't fix itself.
    const result = buildFailureMessage([
      err('groq', 'auth'),
      err('openrouter', 'rate_limit'),
      err('ollama', 'network'),
    ])
    expect(result).toContain('API-Schlüssel ungültig oder abgelaufen')
    expect(result).toContain('Administrator')
  })

  it('single auth failure → admin-contact message', () => {
    const result = buildFailureMessage([err('groq', 'auth')])
    expect(result).toContain('API-Schlüssel')
  })

  it('all-network failure → "check configuration" message', () => {
    // Every provider failed for network reasons — likely deployment
    // misconfig, retry won't help
    const result = buildFailureMessage([
      err('groq', 'network'),
      err('openrouter', 'network'),
      err('ollama', 'no_key'), // no_key counts as network/config
    ])
    expect(result).toContain('Kein KI-Service erreichbar')
    expect(result).toContain('Konfiguration')
  })

  it('all-no_key failure (no env vars set anywhere) → "check configuration"', () => {
    const result = buildFailureMessage([
      err('groq', 'no_key'),
      err('openrouter', 'no_key'),
      err('ollama', 'no_key'),
    ])
    expect(result).toContain('Konfiguration')
  })

  it('mixed network + parse → generic "try again later" (parse is not a config issue)', () => {
    const result = buildFailureMessage([
      err('groq', 'parse'),
      err('openrouter', 'network'),
    ])
    expect(result).toContain('später erneut')
  })

  it('rate-limit failures fall through to the generic retry message', () => {
    const result = buildFailureMessage([
      err('groq', 'rate_limit'),
      err('openrouter', 'rate_limit'),
    ])
    expect(result).toContain('später erneut')
  })

  it('timeout failures fall through to the generic retry message', () => {
    const result = buildFailureMessage([
      err('groq', 'timeout'),
      err('openrouter', 'timeout'),
    ])
    expect(result).toContain('später erneut')
  })

  it('Swiss-German messages use proper umlauts (verfügbar/Schlüssel/später, no ß or ASCII subs)', () => {
    // CLAUDE.md rule #4 — guard against ASCII umlaut substitution
    expect(buildFailureMessage([])).toContain('verfügbar')
    expect(buildFailureMessage([err('groq', 'auth')])).toContain('Schlüssel')
    expect(buildFailureMessage([err('groq', 'timeout')])).toContain('später')

    // Negative checks — none should contain ASCII substitutes
    const all = [
      buildFailureMessage([]),
      buildFailureMessage([err('groq', 'auth')]),
      buildFailureMessage([err('groq', 'network'), err('openrouter', 'no_key')]),
      buildFailureMessage([err('groq', 'rate_limit')]),
    ].join(' ')
    expect(all).not.toMatch(/ß|verfuegbar|Schluessel|spaeter|ueber/)
  })
})
