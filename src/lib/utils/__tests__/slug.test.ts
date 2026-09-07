/**
 * Tests for generateSlug in lib/utils/slug.ts
 *
 * generateSlug creates URL-safe slugs for workshops, blog posts, etc.
 * Wrong output = broken URLs in production.
 */

import { generateSlug } from '../slug';

// ============================================================================
// Basic transformations
// ============================================================================

describe('generateSlug — basic transformations', () => {
  it('lowercases ASCII text', () => {
    expect(generateSlug('Hello World')).toBe('hello-world');
  });

  it('replaces spaces with hyphens', () => {
    expect(generateSlug('one two three')).toBe('one-two-three');
  });

  it('replaces multiple spaces with a single hyphen', () => {
    expect(generateSlug('one  two   three')).toBe('one-two-three');
  });

  it('strips leading hyphens', () => {
    // Title starting with a special char
    expect(generateSlug('!Hello')).toBe('hello');
  });

  it('strips trailing hyphens', () => {
    expect(generateSlug('Hello!')).toBe('hello');
  });

  it('collapses consecutive non-alphanumeric chars to a single hyphen', () => {
    expect(generateSlug('Hello -- World')).toBe('hello-world');
  });

  it('handles empty string', () => {
    expect(generateSlug('')).toBe('');
  });

  it('preserves numeric characters', () => {
    expect(generateSlug('Workshop 2025')).toBe('workshop-2025');
  });

  it('handles already-slug text unchanged', () => {
    expect(generateSlug('hello-world')).toBe('hello-world');
  });
});

// ============================================================================
// Swiss German umlauts
// ============================================================================

describe('generateSlug — Swiss German umlaut transliteration', () => {
  it('converts ä → ae', () => {
    expect(generateSlug('Räume')).toBe('raeume');
  });

  it('converts ö → oe', () => {
    expect(generateSlug('Öl')).toBe('oel');
  });

  it('converts ü → ue', () => {
    expect(generateSlug('Überprüfen')).toBe('ueberpruefen');
  });

  it('converts uppercase Ä → ae', () => {
    expect(generateSlug('Ärger')).toBe('aerger');
  });

  it('converts uppercase Ö → oe', () => {
    expect(generateSlug('Öffentlich')).toBe('oeffentlich');
  });

  it('converts uppercase Ü → ue', () => {
    expect(generateSlug('Über')).toBe('ueber');
  });

  it('handles mixed umlauts in a phrase', () => {
    expect(generateSlug('Für Schüler und Schülerinnen')).toBe('fuer-schueler-und-schuelerinnen');
  });

  it('workshop title with umlauts becomes valid URL slug', () => {
    expect(generateSlug('Löten für Anfänger')).toBe('loeten-fuer-anfaenger');
  });
});

// ============================================================================
// Special characters and punctuation
// ============================================================================

describe('generateSlug — special characters', () => {
  it('strips apostrophes', () => {
    expect(generateSlug("It's a test")).toBe('it-s-a-test');
  });

  it('strips punctuation', () => {
    expect(generateSlug('Hello, World!')).toBe('hello-world');
  });

  it('handles slashes', () => {
    expect(generateSlug('IT/OT Security')).toBe('it-ot-security');
  });

  it('handles parentheses', () => {
    expect(generateSlug('Workshop (Fortgeschrittene)')).toBe('workshop-fortgeschrittene');
  });

  it('handles ampersands', () => {
    expect(generateSlug('Repair & Reuse')).toBe('repair-reuse');
  });
});

// ============================================================================
// The other seven locales
//
// This site serves de, fr, en, it, es, ja, ko and ru. Everything above this
// line tests ASCII and German — which is exactly how the bug survived: the
// function transliterated the author's own language and deleted the rest.
// ============================================================================

describe('generateSlug — non-German locales', () => {
  it('expands ß, which was never handled at all', () => {
    expect(generateSlug('Grüße aus Zürich')).toBe('gruesse-aus-zuerich');
    expect(generateSlug('Straße')).toBe('strasse');
  });

  it('transliterates French accents instead of deleting them', () => {
    // Previously 'caf-gen-ve'.
    expect(generateSlug('Café Genève')).toBe('cafe-geneve');
    expect(generateSlug("Réparation d'ordinateurs")).toBe('reparation-d-ordinateurs');
    expect(generateSlug('Côte façade')).toBe('cote-facade');
  });

  it('transliterates Spanish and Italian accents', () => {
    // Previously 'educaci-n-digital'.
    expect(generateSlug('Educación Digital')).toBe('educacion-digital');
    expect(generateSlug('Città però')).toBe('citta-pero');
  });

  it('NEVER returns an empty slug for a non-Latin title', () => {
    // The failure that mattered. An empty slug is a broken URL, and under a
    // unique constraint the SECOND such record cannot be saved at all.
    expect(generateSlug('Экология')).not.toBe('');
    expect(generateSlug('リサイクル')).not.toBe('');
    expect(generateSlug('재활용')).not.toBe('');
  });

  it('keeps non-Latin text rather than transliterating it away', () => {
    expect(generateSlug('Экология')).toBe('экология');
    expect(generateSlug('リサイクル')).toBe('リサイクル');
  });

  it('still expands ä to ae rather than a — ordering is load-bearing', () => {
    // NFD before the German map would give 'arzte'. This is the assertion that
    // catches anyone "simplifying" the two steps into one.
    expect(generateSlug('Ärzte und Öfen')).toBe('aerzte-und-oefen');
  });
});

describe('generateSlug — degenerate input', () => {
  it('returns a stable, non-empty token when nothing survives', () => {
    const a = generateSlug('!!!');
    expect(a).not.toBe('');
    expect(generateSlug('!!!')).toBe(a); // stable for the same input
    expect(generateSlug('???')).not.toBe(a); // distinct for different input
  });

  it('keeps empty-in / empty-out, which callers use to mean "nothing entered"', () => {
    expect(generateSlug('')).toBe('');
    expect(generateSlug('   ')).toBe('');
  });

  it('is idempotent — slugging a slug returns the same slug', () => {
    // Admin forms re-derive the suggestion as the user types; a function that
    // drifted on re-application would walk the slug away from the title.
    for (const input of ['Café Genève', 'Grüße', 'Repair Cafe', 'Экология']) {
      const once = generateSlug(input);
      expect(generateSlug(once)).toBe(once);
    }
  });

  it('leaves plain ASCII untouched, so stored slugs stay reproducible', () => {
    // Most stored slugs are ASCII. If these moved, re-deriving a slug from an
    // unchanged title would silently change a live URL.
    expect(generateSlug('Repair Cafe Zurich')).toBe('repair-cafe-zurich');
    expect(generateSlug('IT-Support 2026')).toBe('it-support-2026');
  });
});
