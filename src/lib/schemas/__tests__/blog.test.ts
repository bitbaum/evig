/**
 * Tests for blog Zod schemas (lib/schemas/blog.ts).
 *
 * Blog submission is publicly reachable — every field is attacker-
 * controlled. The schema is the last line of defense before the
 * submission record reaches the DB.
 */

import { BlogSubmissionSchema, BlogTranslationSchema, BlogTranslationsSchema } from '../blog'

const valid = {
  name: 'Anna',
  email: 'anna@example.com',
  title: 'Mein erster Linux-Setup',
  content: 'Hier ist meine Anleitung...',
}

describe('BlogSubmissionSchema', () => {
  it('accepts a minimal valid submission and applies defaults', () => {
    const result = BlogSubmissionSchema.safeParse(valid)
    expect(result.success).toBe(true)
    if (!result.success) return
    expect(result.data.submissionType).toBe('draft')
    expect(result.data.tags).toEqual([])
  })

  it('rejects empty name', () => {
    expect(BlogSubmissionSchema.safeParse({ ...valid, name: '' }).success).toBe(false)
  })

  it('rejects invalid email', () => {
    expect(BlogSubmissionSchema.safeParse({ ...valid, email: 'not-an-email' }).success).toBe(false)
  })

  it('rejects empty title', () => {
    expect(BlogSubmissionSchema.safeParse({ ...valid, title: '' }).success).toBe(false)
  })

  it('caps title at 200 characters', () => {
    expect(BlogSubmissionSchema.safeParse({ ...valid, title: 'x'.repeat(200) }).success).toBe(true)
    expect(BlogSubmissionSchema.safeParse({ ...valid, title: 'x'.repeat(201) }).success).toBe(false)
  })

  it('rejects empty content', () => {
    expect(BlogSubmissionSchema.safeParse({ ...valid, content: '' }).success).toBe(false)
  })

  it('accepts optional category as null or undefined', () => {
    expect(BlogSubmissionSchema.safeParse({ ...valid, category: null }).success).toBe(true)
    expect(BlogSubmissionSchema.safeParse({ ...valid, category: undefined }).success).toBe(true)
  })

  it('accepts an array of tags', () => {
    const result = BlogSubmissionSchema.safeParse({ ...valid, tags: ['linux', 'open-source'] })
    expect(result.success).toBe(true)
    if (!result.success) return
    expect(result.data.tags).toEqual(['linux', 'open-source'])
  })

  it('overrides default submissionType when provided', () => {
    const result = BlogSubmissionSchema.safeParse({ ...valid, submissionType: 'idea' })
    expect(result.success).toBe(true)
    if (!result.success) return
    expect(result.data.submissionType).toBe('idea')
  })
})

describe('BlogTranslationSchema', () => {
  const validT = { locale: 'en', title: 'Open vs closed social media', content: 'Full body...' }

  it('accepts a valid translation', () => {
    expect(BlogTranslationSchema.safeParse(validT).success).toBe(true)
  })

  it('rejects the German base locale — the base is not a translation (SSOT)', () => {
    expect(BlogTranslationSchema.safeParse({ ...validT, locale: 'de' }).success).toBe(false)
  })

  it('rejects an unknown locale', () => {
    expect(BlogTranslationSchema.safeParse({ ...validT, locale: 'zz' }).success).toBe(false)
  })

  it('requires title and content', () => {
    expect(BlogTranslationSchema.safeParse({ ...validT, title: '' }).success).toBe(false)
    expect(BlogTranslationSchema.safeParse({ ...validT, content: '' }).success).toBe(false)
  })

  it('allows excerpt and seo fields to be null or omitted', () => {
    expect(
      BlogTranslationSchema.safeParse({ ...validT, excerpt: null, seoTitle: null, seoDescription: null }).success,
    ).toBe(true)
    expect(BlogTranslationSchema.safeParse(validT).success).toBe(true)
  })
})

describe('BlogTranslationsSchema', () => {
  it('accepts an empty array', () => {
    expect(BlogTranslationsSchema.safeParse([]).success).toBe(true)
  })

  it('accepts multiple distinct locales', () => {
    const result = BlogTranslationsSchema.safeParse([
      { locale: 'en', title: 'A', content: 'a' },
      { locale: 'fr', title: 'B', content: 'b' },
    ])
    expect(result.success).toBe(true)
  })

  it('rejects a duplicated locale', () => {
    const result = BlogTranslationsSchema.safeParse([
      { locale: 'en', title: 'A', content: 'a' },
      { locale: 'en', title: 'B', content: 'b' },
    ])
    expect(result.success).toBe(false)
  })
})
