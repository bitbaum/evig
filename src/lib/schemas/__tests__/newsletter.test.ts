/**
 * Tests for newsletter Zod schemas (lib/schemas/newsletter.ts).
 *
 * Newsletter subscription is a simple form but the email transform
 * (lowercase + trim) and the token-length bounds are easy to break
 * silently — these tests lock both.
 */

import {
  NewsletterSubscribeSchema,
  NewsletterConfirmSchema,
  NewsletterUnsubscribeSchema,
} from '../newsletter'

// ============================================================================
// NewsletterSubscribeSchema
// ============================================================================

describe('NewsletterSubscribeSchema', () => {
  it('accepts a valid email', () => {
    const result = NewsletterSubscribeSchema.safeParse({ email: 'anna@example.com' })
    expect(result.success).toBe(true)
  })

  it('rejects an invalid email', () => {
    expect(NewsletterSubscribeSchema.safeParse({ email: 'not-an-email' }).success).toBe(false)
  })

  it('lowercases the email after parse', () => {
    const result = NewsletterSubscribeSchema.safeParse({ email: 'ANNA@Example.COM' })
    expect(result.success).toBe(true)
    if (!result.success) return
    expect(result.data.email).toBe('anna@example.com')
  })

  it('rejects whitespace-padded email (Zod email() runs before transform)', () => {
    // Documents a subtle quirk: `.email()` validates BEFORE `.transform()`,
    // so the trim never gets a chance to normalize a padded address. Callers
    // who want whitespace tolerance must trim before calling safeParse.
    expect(NewsletterSubscribeSchema.safeParse({ email: '  anna@example.com  ' }).success).toBe(false)
  })

  it('rejects a missing email field', () => {
    expect(NewsletterSubscribeSchema.safeParse({}).success).toBe(false)
  })

  it('accepts an optional name and trims it', () => {
    const result = NewsletterSubscribeSchema.safeParse({ email: 'anna@example.com', name: '  Anna Müller  ' })
    expect(result.success).toBe(true)
    if (!result.success) return
    expect(result.data.name).toBe('Anna Müller')
  })

  it('rejects a name longer than 100 chars', () => {
    expect(NewsletterSubscribeSchema.safeParse({ email: 'a@b.com', name: 'x'.repeat(101) }).success).toBe(false)
  })

  it('accepts an optional source and trims it', () => {
    const result = NewsletterSubscribeSchema.safeParse({ email: 'anna@example.com', source: ' footer ' })
    expect(result.success).toBe(true)
    if (!result.success) return
    expect(result.data.source).toBe('footer')
  })

  it('rejects a source longer than 50 chars', () => {
    expect(NewsletterSubscribeSchema.safeParse({ email: 'a@b.com', source: 'x'.repeat(51) }).success).toBe(false)
  })
})

// ============================================================================
// NewsletterConfirmSchema
// ============================================================================

describe('NewsletterConfirmSchema', () => {
  it('accepts a token at the minimum length (32)', () => {
    const result = NewsletterConfirmSchema.safeParse({ token: 'a'.repeat(32) })
    expect(result.success).toBe(true)
  })

  it('accepts a token at the maximum length (128)', () => {
    const result = NewsletterConfirmSchema.safeParse({ token: 'a'.repeat(128) })
    expect(result.success).toBe(true)
  })

  it('rejects a token shorter than 32 chars', () => {
    expect(NewsletterConfirmSchema.safeParse({ token: 'a'.repeat(31) }).success).toBe(false)
  })

  it('rejects a token longer than 128 chars', () => {
    expect(NewsletterConfirmSchema.safeParse({ token: 'a'.repeat(129) }).success).toBe(false)
  })
})

// ============================================================================
// NewsletterUnsubscribeSchema
// ============================================================================

describe('NewsletterUnsubscribeSchema', () => {
  it('accepts an email-only request (token optional)', () => {
    const result = NewsletterUnsubscribeSchema.safeParse({ email: 'bo@example.com' })
    expect(result.success).toBe(true)
  })

  it('also lowercases the unsubscribe email', () => {
    const result = NewsletterUnsubscribeSchema.safeParse({ email: 'BO@Example.com' })
    expect(result.success).toBe(true)
    if (!result.success) return
    expect(result.data.email).toBe('bo@example.com')
  })

  it('accepts an email + token request', () => {
    const result = NewsletterUnsubscribeSchema.safeParse({ email: 'bo@example.com', token: 'anything' })
    expect(result.success).toBe(true)
  })
})
