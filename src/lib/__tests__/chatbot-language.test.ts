/**
 * Tests for detectLanguage and getWelcomeMessage in lib/chatbot-language.ts
 *
 * detectLanguage drives chatbot response language — wrong detection means
 * German users get English replies (bad UX). These are pure functions.
 */

// org.ts imports EXTERNAL_LINKS which may have env-dependent values.
// Mock to isolate the functions under test.
jest.mock('@/config/org', () => ({
  EXTERNAL_LINKS: {
    shopLegacy: 'https://shop.example.com',
    wiki: 'https://wiki.example.com',
  },
}))

import { detectLanguage, getWelcomeMessage } from '../chatbot-language'

// ============================================================================
// detectLanguage
// ============================================================================

describe('detectLanguage', () => {
  it('detects German from German words', () => {
    const result = detectLanguage('Ich möchte einen Computer kaufen')
    expect(result).toBe('de')
  })

  it('detects English from English words', () => {
    // Uses words from the englishWords detection list: can, you, see, the, way, out
    const result = detectLanguage('can you see the way out')
    expect(result).toBe('en')
  })

  it('returns default language for ambiguous single word', () => {
    // "test" matches neither list → default 'de'
    const result = detectLanguage('test', 'de')
    expect(result).toBe('de')
  })

  it('returns en as default when specified', () => {
    const result = detectLanguage('test', 'en')
    expect(result).toBe('en')
  })

  it('default language is de when not specified', () => {
    // "xyz" triggers no matches → falls through to defaultLang = 'de'
    const result = detectLanguage('xyz123')
    expect(result).toBe('de')
  })

  it('detects German when German words outnumber English', () => {
    // "ich", "und" → 2 German hits; "the" → 1 English hit
    const result = detectLanguage('ich und the machine')
    expect(result).toBe('de')
  })

  it('detects English when English words outnumber German', () => {
    // "the", "and", "you" → 3 English hits; "die" → 1 German hit
    const result = detectLanguage('die the and you')
    expect(result).toBe('en')
  })

  it('is case-insensitive (lowercases before scoring)', () => {
    // "ICH" → lowercased to "ich" which is in germanWords
    const result = detectLanguage('ICH')
    expect(result).toBe('de')
  })

  it('handles empty string — returns default', () => {
    expect(detectLanguage('')).toBe('de')
    expect(detectLanguage('', 'en')).toBe('en')
  })

  it('handles a realistic German IT support query', () => {
    const result = detectLanguage('Wie kann ich meinen Computer reparieren lassen?')
    expect(result).toBe('de')
  })

  it('handles a realistic English IT support query', () => {
    // "can", "you", "get", "the", "old" all appear in englishWords
    const result = detectLanguage('can you get the old computer repaired?')
    expect(result).toBe('en')
  })
})

// ============================================================================
// getWelcomeMessage
// ============================================================================

describe('getWelcomeMessage', () => {
  it('returns page-specific message for known page (de)', () => {
    const msg = getWelcomeMessage('/services', 'de')
    expect(typeof msg).toBe('string')
    expect(msg.length).toBeGreaterThan(0)
    // Should NOT be the default message
    const defaultMsg = getWelcomeMessage('/unknown-page', 'de')
    expect(msg).not.toBe(defaultMsg)
  })

  it('returns page-specific message for known page (en)', () => {
    const msg = getWelcomeMessage('/workshops', 'en')
    expect(typeof msg).toBe('string')
    expect(msg.length).toBeGreaterThan(0)
  })

  it('returns default message for unknown page', () => {
    const msg = getWelcomeMessage('/some-random-page', 'de')
    const defaultMsg = getWelcomeMessage('/', 'de') // '/' has a specific message
    // Should return the 'default' key from welcome
    expect(msg).toContain('Hallo')
  })

  it('returns German for language=de', () => {
    const msg = getWelcomeMessage('/', 'de')
    expect(msg).toMatch(/Hallo/)
  })

  it('returns English for language=en', () => {
    const msg = getWelcomeMessage('/', 'en')
    expect(msg).toMatch(/Hello/)
  })

  it('different languages return different messages for same page', () => {
    const de = getWelcomeMessage('/blog', 'de')
    const en = getWelcomeMessage('/blog', 'en')
    expect(de).not.toBe(en)
  })
})
