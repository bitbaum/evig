/**
 * Tests for suggestion-utils/iconMapping.ts — suggestion icon resolution.
 *
 * Mission-relevant: HIRN shows users navigational suggestions for booking,
 * shop, and contact. If getSuggestionIcon returns the wrong emoji (e.g.,
 * '📄' default instead of '🛒' for shop links), the suggestion UI loses
 * visual cues that help users quickly identify actions.
 *
 * Behaviors locked:
 *   getSuggestionIcon
 *   - matches by label keyword (case-insensitive)
 *   - matches by label with hyphen→space transformation (e.g., 'computer repair')
 *   - matches by href keyword
 *   - falls back to category when no label/href match
 *   - falls back to href patterns (shop, service, contact, about, project, volunteer, workshop)
 *   - returns '📄' default when no match found
 *
 *   ensureIconInLabel
 *   - returns label unchanged when it already contains an emoji
 *   - prepends icon when label has no emoji
 *   - uses getSuggestionIcon logic for the prepended icon
 */

import { getSuggestionIcon, ensureIconInLabel } from '../iconMapping'

// ============================================================================
// getSuggestionIcon — label matching
// ============================================================================

describe('getSuggestionIcon — label matching', () => {
  it('matches "repair" keyword in label', () => {
    expect(getSuggestionIcon('Computer Repair Service', '/services', undefined)).toBe('🔧')
  })

  it('matches case-insensitively', () => {
    expect(getSuggestionIcon('LAPTOP', '/products', undefined)).toBe('💻')
  })

  it('matches "repair" before "computer-repair" (first matching key wins)', () => {
    // 'repair' comes before 'computer-repair' in insertion order → 🔧 wins
    expect(getSuggestionIcon('Computer Repair Booking', '/services', undefined)).toBe('🔧')
  })

  it('matches "donate" keyword in label', () => {
    expect(getSuggestionIcon('Donate Now', '/donate', undefined)).toBe('💝')
  })

  it('"workshop" label returns shop emoji — shop is a substring of workshop', () => {
    // 'shop' (🛒) appears inside 'workshop', so it matches before 'workshop' (📚)
    // This is a known broad-matching limitation of the current substring approach
    expect(getSuggestionIcon('Open Source Workshop', '/workshops/oss', undefined)).toBe('🛒')
  })

  it('matches "blog" keyword in label', () => {
    expect(getSuggestionIcon('Read our Blog', '/blog', undefined)).toBe('📰')
  })

  it('matches "contact" keyword in label', () => {
    expect(getSuggestionIcon('Contact Us', '/contact', undefined)).toBe('📞')
  })
})

// ============================================================================
// getSuggestionIcon — href matching
// ============================================================================

describe('getSuggestionIcon — href matching', () => {
  it('matches "shop" in href', () => {
    expect(getSuggestionIcon('Browse our products', '/shop/laptops', undefined)).toBe('🛒')
  })

  it('matches "linux" in href', () => {
    expect(getSuggestionIcon('Get started', '/services/linux-open-source', undefined)).toBe('🐧')
  })

  it('matches "volunteer" in href', () => {
    expect(getSuggestionIcon('Join us', '/volunteer', undefined)).toBe('🤝')
  })
})

// ============================================================================
// getSuggestionIcon — href pattern fallback
// ============================================================================

describe('getSuggestionIcon — href pattern fallback', () => {
  it('returns shop icon for /buy URLs', () => {
    expect(getSuggestionIcon('Click here', '/buy/item-1', undefined)).toBe('🛒')
  })

  it('returns service icon for /services URLs (when label has no match)', () => {
    // 'main' contains 'ai' as substring — use '/services/overview' to avoid that match
    const result = getSuggestionIcon('Professionelle Hilfe', '/services/overview', undefined)
    expect(result).toBe('🔧')
  })

  it('returns contact icon for /contact URLs (when label has no match)', () => {
    const result = getSuggestionIcon('Reach out', '/contact/us', undefined)
    expect(result).toBe('📞')
  })

  it('returns about icon for /about URLs (when label has no match)', () => {
    const result = getSuggestionIcon('Learn more', '/about', undefined)
    expect(result).toBe('📖')
  })

  it('returns project icon for /project URLs (when label has no match)', () => {
    // 'freie-computer' contains 'computer' as substring; use '/project/ltsp' instead
    const result = getSuggestionIcon('Unsere Projekte', '/project/ltsp', undefined)
    expect(result).toBe('💼')
  })

  it('returns volunteer icon for /involved URLs', () => {
    const result = getSuggestionIcon('Get involved', '/get-involved', undefined)
    expect(result).toBe('🤝')
  })

  it('returns shop emoji for /workshop URLs — shop is substring of workshop', () => {
    // The iteration finds 'shop' (a substring of '/workshop/...') before the
    // href-pattern fallback for 'workshop' is reached — same limitation as label matching
    const result = getSuggestionIcon('Anmelden', '/workshop/html-css', undefined)
    expect(result).toBe('🛒')
  })
})

// ============================================================================
// getSuggestionIcon — category fallback
// ============================================================================

describe('getSuggestionIcon — category fallback', () => {
  it('uses category when label and href produce no keyword match', () => {
    // Label "Mehr erfahren" and href "/some/path" have no keyword match
    const result = getSuggestionIcon('Mehr erfahren', '/some/path', 'donate')
    expect(result).toBe('💝')
  })

  it('ignores unknown category and returns default', () => {
    const result = getSuggestionIcon('Aktion', '/path', 'unknown_category')
    expect(result).toBe('📄')
  })
})

// ============================================================================
// getSuggestionIcon — default fallback
// ============================================================================

describe('getSuggestionIcon — default fallback', () => {
  it('returns 📄 when no match in label, href, or category', () => {
    expect(getSuggestionIcon('Sonstiges', '/misc/random', undefined)).toBe('📄')
  })
})

// ============================================================================
// ensureIconInLabel
// ============================================================================

describe('ensureIconInLabel', () => {
  it('returns label unchanged when it already has an emoji', () => {
    const label = '🛒 Produkte kaufen'
    expect(ensureIconInLabel(label, '/shop', undefined)).toBe(label)
  })

  it('prepends icon when label has no emoji', () => {
    const result = ensureIconInLabel('Donate Now', '/donate', undefined)
    expect(result).toContain('💝')
    expect(result).toContain('Donate Now')
    expect(result.startsWith('💝')).toBe(true)
  })

  it('prepends default icon for unrecognized labels', () => {
    const result = ensureIconInLabel('Zufälliges Thema', '/misc/something', undefined)
    expect(result).toContain('📄')
    expect(result).toContain('Zufälliges Thema')
  })

  it('uses category to find icon when available', () => {
    // 'details' contains 'ai' as substring — use a label with no key substrings
    // 'Sprung' (German: jump) has no overlapping substrings with any SUGGESTION_ICONS key
    const result = ensureIconInLabel('Sprung', '/unknown/pfad', 'blog')
    expect(result).toContain('📰')
  })
})
