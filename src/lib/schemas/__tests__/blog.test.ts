/**
 * Tests for blog Zod schemas (lib/schemas/blog.ts).
 *
 * Blog submission is publicly reachable — every field is attacker-
 * controlled. The schema is the last line of defense before the
 * submission record reaches the DB.
 */

import { BlogSubmissionSchema } from '../blog'

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
