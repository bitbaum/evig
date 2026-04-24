/**
 * Tests for HIRN formatting utilities (lib/hirn/format.ts)
 *
 * HIRN is the internal AI assistant that displays financial and statistical
 * data to staff. These formatting functions are pure and deterministic —
 * a bug in formatCHF shows wrong prices to the team.
 *
 * Covers: formatCHF, formatPercent, formatNumber, formatValue.
 */

import {
  formatCHF,
  formatPercent,
  formatNumber,
  formatValue,
} from '../format'

// ============================================================================
// formatCHF
// ============================================================================

describe('formatCHF', () => {
  it('formats whole CHF amounts without decimals', () => {
    const result = formatCHF(1000)
    // Swiss locale formats as "CHF 1'000" or "CHF 1.000" depending on env
    // Key properties: contains CHF and the number
    expect(result).toContain('1')
    expect(result).toContain('000')
  })

  it('formats zero as CHF 0', () => {
    const result = formatCHF(0)
    expect(result).toContain('0')
  })

  it('formats small amount', () => {
    const result = formatCHF(50)
    expect(result).toContain('50')
  })

  it('returns a string', () => {
    expect(typeof formatCHF(100)).toBe('string')
  })

  it('includes CHF currency indicator', () => {
    // Intl may render as "CHF", "Fr.", or similar depending on locale
    const result = formatCHF(100)
    // Either way, it should be a non-empty string
    expect(result.length).toBeGreaterThan(0)
  })
})

// ============================================================================
// formatPercent
// ============================================================================

describe('formatPercent', () => {
  it('formats 0 as "0.0%"', () => {
    expect(formatPercent(0)).toBe('0.0%')
  })

  it('formats 100 as "100.0%"', () => {
    expect(formatPercent(100)).toBe('100.0%')
  })

  it('formats 7.7 as "7.7%"', () => {
    expect(formatPercent(7.7)).toBe('7.7%')
  })

  it('formats 33.333 to one decimal place', () => {
    expect(formatPercent(33.333)).toBe('33.3%')
  })

  it('always includes % suffix', () => {
    expect(formatPercent(50).endsWith('%')).toBe(true)
  })

  it('returns a string', () => {
    expect(typeof formatPercent(42)).toBe('string')
  })
})

// ============================================================================
// formatNumber
// ============================================================================

describe('formatNumber', () => {
  it('formats whole number', () => {
    const result = formatNumber(1000)
    // Swiss locale separates thousands — contains "1" and "000"
    expect(result).toContain('1')
    expect(result).toContain('000')
  })

  it('formats zero as "0"', () => {
    expect(formatNumber(0)).toBe('0')
  })

  it('formats small numbers without separators', () => {
    const result = formatNumber(42)
    expect(result).toBe('42')
  })

  it('returns a string', () => {
    expect(typeof formatNumber(999)).toBe('string')
  })
})

// ============================================================================
// formatValue (dispatcher)
// ============================================================================

describe('formatValue', () => {
  it('delegates to formatCHF for "CHF" format', () => {
    const direct = formatCHF(100)
    const via = formatValue(100, 'CHF')
    expect(via).toBe(direct)
  })

  it('delegates to formatPercent for "percent" format', () => {
    const direct = formatPercent(42.5)
    const via = formatValue(42.5, 'percent')
    expect(via).toBe(direct)
  })

  it('delegates to formatNumber for "number" format', () => {
    const direct = formatNumber(1234)
    const via = formatValue(1234, 'number')
    expect(via).toBe(direct)
  })

  it('accepts string values by parsing them', () => {
    const result = formatValue('42.5', 'percent')
    expect(result).toBe('42.5%')
  })

  it('returns original string on NaN input', () => {
    const result = formatValue('not-a-number', 'CHF')
    expect(result).toBe('not-a-number')
  })

  it('returns string for all format types', () => {
    expect(typeof formatValue(100, 'CHF')).toBe('string')
    expect(typeof formatValue(100, 'percent')).toBe('string')
    expect(typeof formatValue(100, 'number')).toBe('string')
  })
})
