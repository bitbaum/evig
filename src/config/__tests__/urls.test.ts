/**
 * Tests for config/urls.ts — URL helper functions.
 *
 * Behaviors locked:
 *   getVerificationUrl
 *   - includes /auth/verify-email and token param
 *
 *   getPasswordResetUrl
 *   - includes /auth/reset-password and token param
 *
 *   APP_URL / MEILISEARCH_URL / OLLAMA_URL
 *   - are non-empty strings (fallbacks always defined)
 */

import {
  getVerificationUrl,
  getPasswordResetUrl,
  APP_URL,
  MEILISEARCH_URL,
  OLLAMA_URL,
  URLS,
} from '../urls'

describe('getVerificationUrl', () => {
  it('contains /auth/verify-email', () => {
    expect(getVerificationUrl('tok123')).toContain('/auth/verify-email')
  })

  it('contains the token as query param', () => {
    expect(getVerificationUrl('tok123')).toContain('token=tok123')
  })

  it('is an absolute URL (starts with http)', () => {
    expect(getVerificationUrl('abc')).toMatch(/^https?:\/\//)
  })
})

describe('getPasswordResetUrl', () => {
  it('contains /auth/reset-password', () => {
    expect(getPasswordResetUrl('reset456')).toContain('/auth/reset-password')
  })

  it('contains the token as query param', () => {
    expect(getPasswordResetUrl('reset456')).toContain('token=reset456')
  })

  it('is an absolute URL (starts with http)', () => {
    expect(getPasswordResetUrl('abc')).toMatch(/^https?:\/\//)
  })
})

describe('URL constants', () => {
  it('APP_URL is a non-empty string', () => {
    expect(typeof APP_URL).toBe('string')
    expect(APP_URL.length).toBeGreaterThan(0)
  })

  it('MEILISEARCH_URL is a non-empty string', () => {
    expect(typeof MEILISEARCH_URL).toBe('string')
    expect(MEILISEARCH_URL.length).toBeGreaterThan(0)
  })

  it('OLLAMA_URL is a non-empty string', () => {
    expect(typeof OLLAMA_URL).toBe('string')
    expect(OLLAMA_URL.length).toBeGreaterThan(0)
  })

  it('URLS object contains APP, MEILISEARCH, OLLAMA', () => {
    expect(URLS.APP).toBe(APP_URL)
    expect(URLS.MEILISEARCH).toBe(MEILISEARCH_URL)
    expect(URLS.OLLAMA).toBe(OLLAMA_URL)
  })
})
