/**
 * Tests for src/lib/erfassung/detect-multi.ts — detectMultipleProducts
 *
 * This function is called client-side during erfassung (product registration)
 * to warn the user when they paste multiple products into a single field.
 * It must be 100% pure (no imports beyond JS builtins) so it's safe for
 * 'use client' components.
 *
 * Critical cases:
 *   - Single product → false (no false positives on normal descriptions)
 *   - Numbered list → true
 *   - Bullet list → true
 *   - Multiple brand names → true
 *   - Empty/trivial input → false
 */

import { detectMultipleProducts } from '../erfassung/detect-multi'

// ─── Edge cases ───────────────────────────────────────────────────────────────

describe('detectMultipleProducts — empty/trivial inputs', () => {
  it('empty string → false', () => {
    expect(detectMultipleProducts('')).toBe(false)
  })

  it('whitespace-only → false', () => {
    expect(detectMultipleProducts('   \n\n  ')).toBe(false)
  })

  it('single word → false', () => {
    expect(detectMultipleProducts('Laptop')).toBe(false)
  })

  it('single product description → false', () => {
    const single = 'Dell Latitude 5520, Intel Core i5, 8GB RAM, 256GB SSD'
    expect(detectMultipleProducts(single)).toBe(false)
  })
})

// ─── Numbered lists ───────────────────────────────────────────────────────────

describe('detectMultipleProducts — numbered list patterns', () => {
  it('two numbered items (N.) → true', () => {
    const text = '1. Dell Latitude 5520 i5 8GB\n2. HP EliteBook 840 i7 16GB'
    expect(detectMultipleProducts(text)).toBe(true)
  })

  it('two numbered items (N)) → true', () => {
    const text = '1) ThinkPad T480 16GB SSD\n2) Lenovo IdeaPad 512GB'
    expect(detectMultipleProducts(text)).toBe(true)
  })

  it('single numbered item → false', () => {
    const text = '1. Dell Latitude 5520 Intel Core i5 8GB RAM'
    expect(detectMultipleProducts(text)).toBe(false)
  })
})

// ─── Bullet lists ─────────────────────────────────────────────────────────────

describe('detectMultipleProducts — bullet point patterns', () => {
  it('two dash bullets → true', () => {
    const text = '- Dell Latitude 5520 i5 8GB\n- HP ProBook 450 i7 16GB'
    expect(detectMultipleProducts(text)).toBe(true)
  })

  it('two • bullets → true', () => {
    const text = '• ThinkPad X1 Carbon 16GB\n• MacBook Air M2 8GB'
    expect(detectMultipleProducts(text)).toBe(true)
  })

  it('two * bullets → true', () => {
    const text = '* ASUS ZenBook 14 i5\n* Acer Aspire 5 Ryzen 5'
    expect(detectMultipleProducts(text)).toBe(true)
  })

  it('single bullet item → false', () => {
    const text = '- Dell Latitude 5520 Intel Core i5 8GB RAM 256GB SSD'
    expect(detectMultipleProducts(text)).toBe(false)
  })
})

// ─── Multiple brand names ─────────────────────────────────────────────────────

describe('detectMultipleProducts — multiple brand mentions', () => {
  it('two lines each with a known brand → true', () => {
    const text = 'Dell Latitude 5520 i5 8GB SSD\nHP EliteBook 840 G7 16GB'
    expect(detectMultipleProducts(text)).toBe(true)
  })

  it('ThinkPad + Lenovo on separate lines → true', () => {
    const text = 'ThinkPad T480 i7 16GB 512GB\nLenovo IdeaPad 5 Ryzen 5'
    expect(detectMultipleProducts(text)).toBe(true)
  })

  it('Apple MacBook on two lines → true', () => {
    const text = 'Apple MacBook Pro 14" M3 16GB\nMacBook Air M2 8GB 256GB'
    expect(detectMultipleProducts(text)).toBe(true)
  })

  it('single line with brand → false', () => {
    const text = 'Dell Latitude 5520 Intel Core i5 11th gen 8GB RAM 256GB SSD'
    expect(detectMultipleProducts(text)).toBe(false)
  })
})

// ─── Price patterns ───────────────────────────────────────────────────────────

describe('detectMultipleProducts — price patterns', () => {
  it('two lines ending with CHF amounts → true', () => {
    const text = 'Laptop Dell i5 8GB 250 CHF\nHP EliteBook i7 16GB 350 CHF'
    expect(detectMultipleProducts(text)).toBe(true)
  })

  it('two lines ending with ".-" amounts → true', () => {
    const text = 'Laptop Acer Aspire 5 180.-\nASUS VivoBook 15 220.-'
    expect(detectMultipleProducts(text)).toBe(true)
  })
})

// ─── CSV / delimiter structure ────────────────────────────────────────────────

describe('detectMultipleProducts — CSV-like structure', () => {
  it('two comma-delimited lines with 2+ commas each → true', () => {
    const text = 'Dell,Latitude,i5,8GB,256GB\nHP,EliteBook,i7,16GB,512GB'
    expect(detectMultipleProducts(text)).toBe(true)
  })

  it('two semicolon-delimited lines → true', () => {
    const text = 'Dell;Latitude;i5;8GB\nHP;EliteBook;i7;16GB'
    expect(detectMultipleProducts(text)).toBe(true)
  })
})

// ─── Returns boolean ─────────────────────────────────────────────────────────

describe('detectMultipleProducts — return type', () => {
  it('always returns a boolean', () => {
    expect(typeof detectMultipleProducts('')).toBe('boolean')
    expect(typeof detectMultipleProducts('some text')).toBe('boolean')
    expect(typeof detectMultipleProducts('1. a\n2. b')).toBe('boolean')
  })
})
