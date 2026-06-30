/**
 * Tests for config/payrexx.ts — env keys, readiness checks, URL helpers.
 */

import {
  PAYREXX_ENV,
  PAYREXX_SETUP_MESSAGE,
  isPayrexxCheckoutUnavailable,
  isPayrexxConfigured,
  isPayrexxHostedUrl,
  isPayrexxMockRedirectUrl,
} from '@/config/payrexx'

const ORIGINAL_ENV = process.env

beforeEach(() => {
  process.env = { ...ORIGINAL_ENV }
  delete process.env[PAYREXX_ENV.INSTANCE]
  delete process.env[PAYREXX_ENV.API_SECRET]
  delete process.env[PAYREXX_ENV.WEBHOOK_SECRET]
})

afterAll(() => {
  process.env = ORIGINAL_ENV
})

describe('isPayrexxConfigured', () => {
  it('returns false when instance or secret missing', () => {
    expect(isPayrexxConfigured()).toBe(false)

    process.env[PAYREXX_ENV.INSTANCE] = 'demo'
    expect(isPayrexxConfigured()).toBe(false)

    delete process.env[PAYREXX_ENV.INSTANCE]
    process.env[PAYREXX_ENV.API_SECRET] = 'secret'
    expect(isPayrexxConfigured()).toBe(false)
  })

  it('returns true when instance and API secret are set', () => {
    process.env[PAYREXX_ENV.INSTANCE] = 'demo'
    process.env[PAYREXX_ENV.API_SECRET] = 'secret'
    expect(isPayrexxConfigured()).toBe(true)
  })
})

describe('isPayrexxCheckoutUnavailable', () => {
  // NOTE: the top-level beforeEach reassigns `process.env` to a fresh object
  // before every test. Capturing `const env = process.env` here (at collection
  // time) would freeze a stale reference to the ORIGINAL object, so writes to
  // it never reach the copy the code under test reads — write to the live
  // `process.env` via this helper instead. The cast is needed because Node's
  // types declare NODE_ENV read-only.
  const setNodeEnv = (value: string | undefined) => {
    ;(process.env as Record<string, string | undefined>).NODE_ENV = value
  }
  const originalNodeEnv = process.env.NODE_ENV

  afterEach(() => {
    setNodeEnv(originalNodeEnv)
  })

  it('is false in non-production even without credentials', () => {
    setNodeEnv('development')
    expect(isPayrexxCheckoutUnavailable()).toBe(false)
  })

  it('is true in production without credentials', () => {
    setNodeEnv('production')
    expect(isPayrexxCheckoutUnavailable()).toBe(true)
  })

  it('is false in production when configured', () => {
    setNodeEnv('production')
    process.env[PAYREXX_ENV.INSTANCE] = 'demo'
    process.env[PAYREXX_ENV.API_SECRET] = 'secret'
    expect(isPayrexxCheckoutUnavailable()).toBe(false)
  })
})

describe('URL helpers', () => {
  it('detects hosted Payrexx URLs', () => {
    expect(isPayrexxHostedUrl('https://demo.payrexx.com/pay/123')).toBe(true)
    expect(isPayrexxHostedUrl('https://example.com/pay')).toBe(false)
  })

  it('detects dev mock redirect path', () => {
    expect(isPayrexxMockRedirectUrl('/api/payments/payrexx-mock-redirect?ref=1')).toBe(true)
    expect(isPayrexxMockRedirectUrl('https://payrexx.com/pay')).toBe(false)
  })
})

describe('PAYREXX_SETUP_MESSAGE', () => {
  it('mentions Payrexx for user-facing not-ready state', () => {
    expect(PAYREXX_SETUP_MESSAGE).toMatch(/Payrexx/i)
  })
})
