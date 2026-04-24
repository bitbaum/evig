/**
 * Tests for generateSlug in lib/utils/slug.ts
 *
 * generateSlug creates URL-safe slugs for workshops, blog posts, etc.
 * Wrong output = broken URLs in production.
 */

import { generateSlug } from '../slug'

// ============================================================================
// Basic transformations
// ============================================================================

describe('generateSlug — basic transformations', () => {
  it('lowercases ASCII text', () => {
    expect(generateSlug('Hello World')).toBe('hello-world')
  })

  it('replaces spaces with hyphens', () => {
    expect(generateSlug('one two three')).toBe('one-two-three')
  })

  it('replaces multiple spaces with a single hyphen', () => {
    expect(generateSlug('one  two   three')).toBe('one-two-three')
  })

  it('strips leading hyphens', () => {
    // Title starting with a special char
    expect(generateSlug('!Hello')).toBe('hello')
  })

  it('strips trailing hyphens', () => {
    expect(generateSlug('Hello!')).toBe('hello')
  })

  it('collapses consecutive non-alphanumeric chars to a single hyphen', () => {
    expect(generateSlug('Hello -- World')).toBe('hello-world')
  })

  it('handles empty string', () => {
    expect(generateSlug('')).toBe('')
  })

  it('preserves numeric characters', () => {
    expect(generateSlug('Workshop 2025')).toBe('workshop-2025')
  })

  it('handles already-slug text unchanged', () => {
    expect(generateSlug('hello-world')).toBe('hello-world')
  })
})

// ============================================================================
// Swiss German umlauts
// ============================================================================

describe('generateSlug — Swiss German umlaut transliteration', () => {
  it('converts ä → ae', () => {
    expect(generateSlug('Räume')).toBe('raeume')
  })

  it('converts ö → oe', () => {
    expect(generateSlug('Öl')).toBe('oel')
  })

  it('converts ü → ue', () => {
    expect(generateSlug('Überprüfen')).toBe('ueberpruefen')
  })

  it('converts uppercase Ä → ae', () => {
    expect(generateSlug('Ärger')).toBe('aerger')
  })

  it('converts uppercase Ö → oe', () => {
    expect(generateSlug('Öffentlich')).toBe('oeffentlich')
  })

  it('converts uppercase Ü → ue', () => {
    expect(generateSlug('Über')).toBe('ueber')
  })

  it('handles mixed umlauts in a phrase', () => {
    expect(generateSlug('Für Schüler und Schülerinnen')).toBe('fuer-schueler-und-schuelerinnen')
  })

  it('workshop title with umlauts becomes valid URL slug', () => {
    expect(generateSlug('Löten für Anfänger')).toBe('loeten-fuer-anfaenger')
  })
})

// ============================================================================
// Special characters and punctuation
// ============================================================================

describe('generateSlug — special characters', () => {
  it('strips apostrophes', () => {
    expect(generateSlug("It's a test")).toBe('it-s-a-test')
  })

  it('strips punctuation', () => {
    expect(generateSlug('Hello, World!')).toBe('hello-world')
  })

  it('handles slashes', () => {
    expect(generateSlug('IT/OT Security')).toBe('it-ot-security')
  })

  it('handles parentheses', () => {
    expect(generateSlug('Workshop (Fortgeschrittene)')).toBe('workshop-fortgeschrittene')
  })

  it('handles ampersands', () => {
    expect(generateSlug('Repair & Reuse')).toBe('repair-reuse')
  })
})
