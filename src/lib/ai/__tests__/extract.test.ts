/**
 * Tests for the AI extraction helpers (lib/ai/extract.ts).
 *
 * Two mission-critical pure functions used across every AI-driven form
 * flow (erfassung donor intake, IT-Hilfe matchmaking, blog generation):
 *
 *   robustJsonExtract — parses LLM responses into objects. LLMs return
 *     wildly inconsistent shapes (markdown-wrapped, unescaped newlines
 *     in strings, malformed JSON). Three-tier parser: try plain JSON,
 *     then fix literal newlines, then regex-extract key/value pairs as
 *     a last resort. A regression here silently corrupts every extracted
 *     form field. Hardening: bounded input length (ReDoS), bounded
 *     regex iterations.
 *
 *   calculateGenericConfidence — scores how confident we are that the
 *     AI's output matches the input text. Drives the per-field confidence
 *     UI (orange/red badges on low-confidence extractions).
 */

import {
  robustJsonExtract,
  calculateGenericConfidence,
} from '../extract'

// ============================================================================
// robustJsonExtract — empty/length-bound
// ============================================================================

describe('robustJsonExtract — guards', () => {
  it('returns null for empty string', () => {
    expect(robustJsonExtract('')).toBeNull()
  })

  it('returns null when no { is found', () => {
    expect(robustJsonExtract('Just some text, no JSON here.')).toBeNull()
  })

  it('does not crash on extremely large input (length bound at 100k chars)', () => {
    const huge = 'x'.repeat(200_000) + '{"key":"value"}'
    // The bound truncates to 100k chars BEFORE searching, so the JSON
    // tail is dropped — the result is null but no crash/hang
    expect(() => robustJsonExtract(huge)).not.toThrow()
  })
})

// ============================================================================
// robustJsonExtract — happy path: plain JSON
// ============================================================================

describe('robustJsonExtract — plain JSON', () => {
  it('parses a simple object', () => {
    expect(robustJsonExtract('{"title":"Hello"}')).toEqual({ title: 'Hello' })
  })

  it('parses nested objects', () => {
    expect(
      robustJsonExtract('{"user":{"name":"Anna","age":30}}'),
    ).toEqual({ user: { name: 'Anna', age: 30 } })
  })

  it('parses arrays inside objects', () => {
    expect(
      robustJsonExtract('{"tags":["a","b","c"]}'),
    ).toEqual({ tags: ['a', 'b', 'c'] })
  })

  it('extracts the FIRST {...} block when surrounded by prose', () => {
    const raw = 'Sure, here is the data:\n{"key":"value"}\nAnything else?'
    expect(robustJsonExtract(raw)).toEqual({ key: 'value' })
  })

  it('parses booleans and numbers correctly', () => {
    expect(
      robustJsonExtract('{"enabled":true,"count":42,"price":19.95}'),
    ).toEqual({ enabled: true, count: 42, price: 19.95 })
  })

  it('handles null values', () => {
    expect(robustJsonExtract('{"value":null}')).toEqual({ value: null })
  })
})

// ============================================================================
// robustJsonExtract — markdown code block stripping
// ============================================================================

describe('robustJsonExtract — markdown wrappers', () => {
  it('strips ```json ... ``` wrapper (Claude / GPT pattern)', () => {
    const raw = '```json\n{"answer":42}\n```'
    expect(robustJsonExtract(raw)).toEqual({ answer: 42 })
  })

  it('strips ``` ... ``` wrapper without language tag', () => {
    const raw = '```\n{"x":1}\n```'
    expect(robustJsonExtract(raw)).toEqual({ x: 1 })
  })

  it('handles markdown wrapper with leading/trailing prose', () => {
    const raw = 'Here you go:\n\n```json\n{"y":2}\n```\n\nAnything else?'
    expect(robustJsonExtract(raw)).toEqual({ y: 2 })
  })
})

// ============================================================================
// robustJsonExtract — newline fix in string values
// ============================================================================

describe('robustJsonExtract — literal newline repair', () => {
  it('parses JSON with a literal newline inside a string value', () => {
    // This is the second-tier path: plain JSON.parse fails on the raw
    // newline inside "description", but the newline-replacement layer
    // converts it to \n and parses successfully
    const raw = '{"description":"Line 1\nLine 2"}'
    const result = robustJsonExtract<{ description: string }>(raw)
    expect(result).not.toBeNull()
    expect(result!.description).toContain('Line 1')
    expect(result!.description).toContain('Line 2')
  })

  it('preserves multi-line content (markdown-style descriptions)', () => {
    const raw = '{"text":"# Heading\n\nParagraph text\n- bullet"}'
    const result = robustJsonExtract<{ text: string }>(raw)
    expect(result).not.toBeNull()
    expect(result!.text).toContain('Heading')
    expect(result!.text).toContain('Paragraph')
    expect(result!.text).toContain('bullet')
  })
})

// ============================================================================
// robustJsonExtract — regex fallback for malformed JSON
// ============================================================================

describe('robustJsonExtract — regex fallback (malformed JSON)', () => {
  it('extracts string fields when JSON has trailing-comma issues', () => {
    // Trailing commas are invalid JSON but AIs emit them frequently.
    // Standard parse fails → newline-fix fails → regex fallback wins.
    const raw = '{"name":"Anna","email":"a@b.ch",}'
    const result = robustJsonExtract<{ name?: string; email?: string }>(raw)
    expect(result).not.toBeNull()
    expect(result!.name).toBe('Anna')
    expect(result!.email).toBe('a@b.ch')
  })

  it('extracts number fields from malformed JSON', () => {
    const raw = '{"price":19.95,"qty":3,}'
    const result = robustJsonExtract<{ price?: number; qty?: number }>(raw)
    expect(result).not.toBeNull()
    expect(result!.price).toBe(19.95)
    expect(result!.qty).toBe(3)
  })

  it('extracts boolean fields from malformed JSON', () => {
    const raw = '{"active":true,"verified":false,}'
    const result = robustJsonExtract<{ active?: boolean; verified?: boolean }>(raw)
    expect(result).not.toBeNull()
    expect(result!.active).toBe(true)
    expect(result!.verified).toBe(false)
  })

  it('extracts array fields from malformed JSON', () => {
    const raw = '{"tags":["alpha","beta","gamma"],}'
    const result = robustJsonExtract<{ tags?: string[] }>(raw)
    expect(result).not.toBeNull()
    expect(result!.tags).toEqual(['alpha', 'beta', 'gamma'])
  })

  it('decodes \\n escape sequences in extracted string fields', () => {
    // Even in regex-fallback mode we still translate \n to a newline so
    // downstream consumers see clean strings
    const raw = '{"desc":"line1\\nline2",}'
    const result = robustJsonExtract<{ desc?: string }>(raw)
    expect(result).not.toBeNull()
    expect(result!.desc).toContain('\n')
  })

  it('returns null when fallback finds no key-value pairs at all', () => {
    // Just braces with no parseable content
    const raw = '{nothing here}'
    expect(robustJsonExtract(raw)).toBeNull()
  })
})

// ============================================================================
// robustJsonExtract — generic typing
// ============================================================================

describe('robustJsonExtract — typing', () => {
  it('returns the requested generic type (compile-time only, runtime Object)', () => {
    interface Foo { name: string; age: number }
    const result = robustJsonExtract<Foo>('{"name":"Bob","age":42}')
    expect(result).toEqual({ name: 'Bob', age: 42 })
  })
})

// ============================================================================
// calculateGenericConfidence
// ============================================================================

describe('calculateGenericConfidence', () => {
  it('returns empty object for empty data', () => {
    expect(calculateGenericConfidence('input', {})).toEqual({})
  })

  it('skips null, undefined, and empty-string values', () => {
    const result = calculateGenericConfidence('input text', {
      name: null,
      email: undefined,
      desc: '',
      kept: 'value',
    })
    expect(result).not.toHaveProperty('name')
    expect(result).not.toHaveProperty('email')
    expect(result).not.toHaveProperty('desc')
    expect(result).toHaveProperty('kept')
  })

  it('caps string-field confidence at 0.95 even when every word matches', () => {
    const input = 'macbook pro repair urgent'
    const result = calculateGenericConfidence(input, {
      title: 'macbook pro repair',
    })
    expect(result.title).toBeLessThanOrEqual(0.95)
    expect(result.title).toBeGreaterThan(0.9) // strong match
  })

  it('floors at 0.5 + 0=0.5 when no word from value appears in input', () => {
    const result = calculateGenericConfidence('completely different text', {
      title: 'macbook pro repair',
    })
    // 0 of 3 words match → 0.5 + 0 = 0.5
    expect(result.title).toBe(0.5)
  })

  it('partial match → ratio between floor and cap', () => {
    const input = 'I need a macbook for school'
    const result = calculateGenericConfidence(input, {
      title: 'macbook pro repair',
    })
    // 1 of 3 words match → 0.5 + (1/3)*0.45 = 0.65
    expect(result.title).toBeCloseTo(0.65, 2)
  })

  it('strings with no significant words (all <=2 chars) → fallback 0.6', () => {
    const result = calculateGenericConfidence('whatever', {
      acronym: 'a b c',
    })
    expect(result.acronym).toBe(0.6)
  })

  it('arrays get a fixed 0.65 confidence', () => {
    const result = calculateGenericConfidence('any input', {
      tags: ['alpha', 'beta'],
    })
    expect(result.tags).toBe(0.65)
  })

  it('numbers (and other non-string non-array values) get 0.7', () => {
    const result = calculateGenericConfidence('any input', {
      price: 100,
      enabled: true,
    })
    expect(result.price).toBe(0.7)
    expect(result.enabled).toBe(0.7)
  })

  it('matches case-insensitively (input is lowercased before comparison)', () => {
    const result = calculateGenericConfidence('MacBook Pro', {
      brand: 'macbook pro',
    })
    // 2 of 2 words match (case-insensitive) → 0.5 + 1*0.45 = 0.95
    expect(result.brand).toBe(0.95)
  })

  it('filters words ≤ 2 chars before scoring (Swiss German "es", "im")', () => {
    // "es" and "im" should be ignored — "macbook" is the only significant word
    const result = calculateGenericConfidence('macbook', {
      desc: 'macbook es im',
    })
    // Only "macbook" counts → 1/1 match → 0.95
    expect(result.desc).toBe(0.95)
  })

  it('mixed types in one call all get scored independently', () => {
    const result = calculateGenericConfidence('macbook pro 13 inch', {
      title: 'macbook pro',     // string match
      tags: ['laptop'],         // array
      price: 1500,              // number
      brand: 'apple',           // string no-match
      empty: '',                // skipped
    })
    expect(result.title).toBeCloseTo(0.95, 2)
    expect(result.tags).toBe(0.65)
    expect(result.price).toBe(0.7)
    expect(result.brand).toBe(0.5) // 0 of 1 word matches
    expect(result).not.toHaveProperty('empty')
  })
})
