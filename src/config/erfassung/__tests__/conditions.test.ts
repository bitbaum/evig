/**
 * Tests for config/erfassung/conditions.ts — product condition helpers.
 *
 * Mission-relevant: condition grades determine pricing multipliers for
 * refurbished hardware. If normalizeConditionValue('very_good') returns
 * 'very_good' instead of 'like_new', a like-new laptop might be priced
 * at the 'poor' tier. If parseConditionFromText misses 'defekt', voice
 * intake fails to classify the device condition.
 *
 * Behaviors locked:
 *   getConditionByValue
 *   - returns Condition for known value
 *   - returns undefined for unknown value
 *
 *   getConditionLabel
 *   - returns German label for canonical value
 *   - returns alias label for legacy alias
 *   - falls back to raw value for unknown
 *
 *   normalizeConditionValue
 *   - returns value unchanged for canonical value
 *   - resolves alias to canonical (very_good → like_new)
 *   - returns value unchanged for unknown
 *
 *   getConditionBadge
 *   - returns label and color for canonical value
 *   - resolves alias and returns alias label + canonical color
 *   - returns label=value and gray color for unknown
 *
 *   parseConditionFromText
 *   - returns canonical value for exact German aliases (defekt, neu)
 *   - returns undefined for unrecognized text
 *   - is case-insensitive
 */

import {
  getConditionByValue,
  getConditionLabel,
  normalizeConditionValue,
  getConditionBadge,
  parseConditionFromText,
} from '../conditions'

// ============================================================================
// getConditionByValue
// ============================================================================

describe('getConditionByValue', () => {
  it('returns Condition for "new"', () => {
    const c = getConditionByValue('new')
    expect(c).toBeDefined()
    expect(c!.value).toBe('new')
  })

  it('returns Condition for "defect"', () => {
    const c = getConditionByValue('defect')
    expect(c).toBeDefined()
    expect(c!.sortOrder).toBeGreaterThan(1)
  })

  it('returns undefined for unknown value', () => {
    expect(getConditionByValue('unknown_grade')).toBeUndefined()
  })

  it('returns undefined for alias "very_good" (not canonical)', () => {
    expect(getConditionByValue('very_good')).toBeUndefined()
  })
})

// ============================================================================
// getConditionLabel
// ============================================================================

describe('getConditionLabel', () => {
  it('returns "Neu" for "new"', () => {
    expect(getConditionLabel('new')).toBe('Neu')
  })

  it('returns "Gut" for "good"', () => {
    expect(getConditionLabel('good')).toBe('Gut')
  })

  it('returns "Defekt" for "defect"', () => {
    expect(getConditionLabel('defect')).toBe('Defekt')
  })

  it('returns alias label for "excellent"', () => {
    expect(getConditionLabel('excellent')).toBe('Sehr gut')
  })

  it('returns alias label for "for_parts"', () => {
    expect(getConditionLabel('for_parts')).toBe('Für Teile')
  })

  it('falls back to raw value for completely unknown input', () => {
    expect(getConditionLabel('mystery_grade')).toBe('mystery_grade')
  })
})

// ============================================================================
// normalizeConditionValue
// ============================================================================

describe('normalizeConditionValue', () => {
  it('returns "new" unchanged (already canonical)', () => {
    expect(normalizeConditionValue('new')).toBe('new')
  })

  it('returns "like_new" unchanged (already canonical)', () => {
    expect(normalizeConditionValue('like_new')).toBe('like_new')
  })

  it('resolves "very_good" → "like_new"', () => {
    expect(normalizeConditionValue('very_good')).toBe('like_new')
  })

  it('resolves "excellent" → "like_new"', () => {
    expect(normalizeConditionValue('excellent')).toBe('like_new')
  })

  it('resolves "acceptable" → "fair"', () => {
    expect(normalizeConditionValue('acceptable')).toBe('fair')
  })

  it('resolves "for_parts" → "defect"', () => {
    expect(normalizeConditionValue('for_parts')).toBe('defect')
  })

  it('returns unknown value unchanged', () => {
    expect(normalizeConditionValue('mystery')).toBe('mystery')
  })
})

// ============================================================================
// getConditionBadge
// ============================================================================

describe('getConditionBadge', () => {
  it('returns label "Neu" and green color for "new"', () => {
    const badge = getConditionBadge('new')
    expect(badge.label).toBe('Neu')
    expect(badge.color).toContain('primary')
  })

  it('returns label "Defekt" and gray color for "defect"', () => {
    const badge = getConditionBadge('defect')
    expect(badge.label).toBe('Defekt')
    expect(badge.color).toContain('neutral')
  })

  it('resolves alias "excellent" → label "Sehr gut" with "like_new" color (primary)', () => {
    const badge = getConditionBadge('excellent')
    expect(badge.label).toBe('Sehr gut')
    expect(badge.color).toContain('primary')
  })

  it('returns raw value as label and gray for completely unknown input', () => {
    const badge = getConditionBadge('mystery_grade')
    expect(badge.label).toBe('mystery_grade')
    expect(badge.color).toContain('neutral')
  })
})

// ============================================================================
// parseConditionFromText
// ============================================================================

describe('parseConditionFromText', () => {
  it('returns "new" for "neu"', () => {
    expect(parseConditionFromText('neu')).toBe('new')
  })

  it('returns "new" for "Neu" (case-insensitive)', () => {
    expect(parseConditionFromText('Neu')).toBe('new')
  })

  it('returns "defect" for "defekt"', () => {
    expect(parseConditionFromText('defekt')).toBe('defect')
  })

  it('returns "defect" for "kaputt"', () => {
    expect(parseConditionFromText('kaputt')).toBe('defect')
  })

  it('returns "like_new" for "sehr gut"', () => {
    expect(parseConditionFromText('sehr gut')).toBe('like_new')
  })

  it('returns "good" for "gut"', () => {
    expect(parseConditionFromText('gut')).toBe('good')
  })

  it('returns "fair" for "gebraucht"', () => {
    expect(parseConditionFromText('gebraucht')).toBe('fair')
  })

  it('returns undefined for unrecognized text', () => {
    expect(parseConditionFromText('unbekannt xyz')).toBeUndefined()
  })

  it('partial match — "Das Gerät ist defekt" returns "defect"', () => {
    expect(parseConditionFromText('Das Gerät ist defekt')).toBe('defect')
  })
})
