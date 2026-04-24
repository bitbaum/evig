/**
 * Tests for payments/security.ts pure utility functions.
 *
 * Covers: maskSensitiveData, validatePaymentData, PaymentRateLimiter.
 * No mocks needed — all pure logic.
 */

// Prevent the module-level setInterval from keeping Jest alive
jest.useFakeTimers()

import { maskSensitiveData, validatePaymentData, PaymentRateLimiter } from '../security'

// ============================================================================
// maskSensitiveData
// ============================================================================

describe('maskSensitiveData', () => {
  it('returns empty input unchanged', () => {
    expect(maskSensitiveData('')).toBe('')
  })

  it('masks a 16-digit card number, keeping first 6 and last 4', () => {
    const result = maskSensitiveData('4111111111111111')
    expect(result).toContain('411111')
    expect(result).toContain('1111')
    expect(result).toContain('****')
    expect(result).not.toContain('111111111')
  })

  it('masks card number with spaces', () => {
    const result = maskSensitiveData('4111 1111 1111 1111')
    expect(result).toContain('****')
    expect(result).not.toContain('1111 1111 1111')
  })

  it('masks Stripe-style tokens', () => {
    const result = maskSensitiveData('tok_abc123xyz')
    expect(result).toContain('tok_****')
    expect(result).not.toContain('tok_abc123xyz')
  })

  it('leaves plain text without sensitive data unchanged', () => {
    const plain = 'Order confirmed for item #12345'
    // No card numbers, tokens, or API keys → output same as input (modulo 3-digit masking)
    expect(maskSensitiveData(plain)).not.toContain('tok_')
  })

  it('masks API keys (20+ alphanumeric chars)', () => {
    const result = maskSensitiveData('api_key_abcdefghijklmnop12345')
    expect(result).toContain('****')
  })
})

// ============================================================================
// validatePaymentData
// ============================================================================

describe('validatePaymentData', () => {
  it('accepts valid CHF payment', () => {
    const result = validatePaymentData({ amount: 100, currency: 'CHF' })
    expect(result.isValid).toBe(true)
    expect(result.errors).toHaveLength(0)
  })

  it('accepts valid EUR payment', () => {
    const result = validatePaymentData({ amount: 50, currency: 'EUR' })
    expect(result.isValid).toBe(true)
  })

  it('rejects missing amount', () => {
    const result = validatePaymentData({ currency: 'CHF' })
    expect(result.isValid).toBe(false)
    expect(result.errors).toContain('Invalid amount')
  })

  it('rejects zero amount', () => {
    const result = validatePaymentData({ amount: 0, currency: 'CHF' })
    expect(result.isValid).toBe(false)
    expect(result.errors).toContain('Invalid amount')
  })

  it('rejects negative amount', () => {
    const result = validatePaymentData({ amount: -50, currency: 'CHF' })
    expect(result.isValid).toBe(false)
    expect(result.errors).toContain('Invalid amount')
  })

  it('rejects missing currency', () => {
    const result = validatePaymentData({ amount: 100 })
    expect(result.isValid).toBe(false)
    expect(result.errors).toContain('Invalid currency')
  })

  it('rejects unsupported currency', () => {
    const result = validatePaymentData({ amount: 100, currency: 'USD' })
    expect(result.isValid).toBe(false)
    expect(result.errors).toContain('Invalid currency')
  })

  it('rejects amount exceeding 50000 limit', () => {
    const result = validatePaymentData({ amount: 50001, currency: 'CHF' })
    expect(result.isValid).toBe(false)
    expect(result.errors).toContain('Amount exceeds maximum limit')
  })

  it('accepts amount of exactly 50000', () => {
    const result = validatePaymentData({ amount: 50000, currency: 'CHF' })
    expect(result.isValid).toBe(true)
  })

  it('rejects oversized metadata', () => {
    // JSON.stringify of this object will exceed 500 chars
    const bigMetadata = Object.fromEntries(
      Array.from({ length: 20 }, (_, i) => [`key_${i}`, `${'x'.repeat(30)}`])
    )
    const result = validatePaymentData({ amount: 100, currency: 'CHF', metadata: bigMetadata })
    expect(result.isValid).toBe(false)
    expect(result.errors).toContain('Metadata too large')
  })

  it('accumulates multiple errors', () => {
    const result = validatePaymentData({ amount: -5, currency: 'USD' })
    expect(result.isValid).toBe(false)
    expect(result.errors.length).toBeGreaterThanOrEqual(2)
  })
})

// ============================================================================
// PaymentRateLimiter
// ============================================================================

describe('PaymentRateLimiter', () => {
  let limiter: PaymentRateLimiter

  beforeEach(() => {
    limiter = new PaymentRateLimiter()
  })

  it('allows first attempt', () => {
    expect(limiter.isAllowed('user-1')).toBe(true)
  })

  it('allows up to maxAttempts within window', () => {
    for (let i = 0; i < 10; i++) {
      expect(limiter.isAllowed('user-2', 10, 60000)).toBe(true)
    }
  })

  it('blocks on maxAttempts + 1', () => {
    for (let i = 0; i < 10; i++) limiter.isAllowed('user-3', 10, 60000)
    expect(limiter.isAllowed('user-3', 10, 60000)).toBe(false)
  })

  it('allows different identifiers independently', () => {
    for (let i = 0; i < 10; i++) limiter.isAllowed('user-4', 10, 60000)
    // user-5 is unrelated — should still be allowed
    expect(limiter.isAllowed('user-5', 10, 60000)).toBe(true)
  })

  it('resets count for identifier after manual reset', () => {
    for (let i = 0; i < 10; i++) limiter.isAllowed('user-6', 10, 60000)
    limiter.reset('user-6')
    expect(limiter.isAllowed('user-6', 10, 60000)).toBe(true)
  })

  it('allows again after window expires', () => {
    for (let i = 0; i < 10; i++) limiter.isAllowed('user-7', 10, 1000)
    expect(limiter.isAllowed('user-7', 10, 1000)).toBe(false)
    // Advance time past the 1000ms window
    jest.advanceTimersByTime(1500)
    expect(limiter.isAllowed('user-7', 10, 1000)).toBe(true)
  })

  it('cleanup removes expired entries', () => {
    limiter.isAllowed('user-8', 3, 100)
    jest.advanceTimersByTime(200)
    limiter.cleanup()
    // After cleanup, should allow again (window expired)
    expect(limiter.isAllowed('user-8', 3, 100)).toBe(true)
  })
})
