/**
 * Tests for detectMultipleProducts heuristic.
 *
 * Client-safe, pure function — no mocks needed.
 */

import { detectMultipleProducts } from '../detect-multi'

// ============================================================================
// detectMultipleProducts
// ============================================================================

describe('detectMultipleProducts', () => {
  it('returns false for empty text', () => {
    expect(detectMultipleProducts('')).toBe(false)
    expect(detectMultipleProducts('   ')).toBe(false)
  })

  it('returns false for single-line text', () => {
    expect(detectMultipleProducts('Dell Latitude 5540')).toBe(false)
  })

  it('detects numbered list', () => {
    expect(detectMultipleProducts(
      '1. Dell Latitude 5540\n2. HP EliteBook 840'
    )).toBe(true)
  })

  it('detects numbered list with parentheses', () => {
    expect(detectMultipleProducts(
      '1) Dell Latitude 5540\n2) HP EliteBook 840'
    )).toBe(true)
  })

  it('detects bullet point list', () => {
    expect(detectMultipleProducts(
      '- Dell Latitude 5540\n- HP EliteBook 840'
    )).toBe(true)
  })

  it('detects bullet point list with dots', () => {
    expect(detectMultipleProducts(
      '• Dell Latitude 5540\n• HP EliteBook 840'
    )).toBe(true)
  })

  it('detects CSV-like structure', () => {
    expect(detectMultipleProducts(
      'Dell;Latitude;350\nHP;EliteBook;299'
    )).toBe(true)
  })

  it('detects multiple brand mentions on separate lines', () => {
    expect(detectMultipleProducts(
      'Dell Latitude 5540 Business Laptop\nHP EliteBook 840 G7'
    )).toBe(true)
  })

  it('detects lines with price patterns', () => {
    expect(detectMultipleProducts(
      'Dell Latitude 5540 350 CHF\nHP EliteBook 840 299 CHF'
    )).toBe(true)
  })

  it('detects multiple lines with specs (numbers + length > 10)', () => {
    expect(detectMultipleProducts(
      'Laptop i7-1355U 16GB RAM 512GB SSD\nTablet Snapdragon 8 Gen 2 12GB 256GB\nDesktop Ryzen 5 32GB DDR5'
    )).toBe(true)
  })

  it('returns false for short non-product text', () => {
    expect(detectMultipleProducts('Hallo\nWelt')).toBe(false)
  })
})
