/**
 * Tests for AI Zod schemas (lib/schemas/ai.ts).
 *
 * AnalyzeProductSchema enforces the requirement that callers supply
 * either an inline image (base64) or an imageUrl — never neither.
 */

import { AnalyzeProductSchema } from '../ai'

describe('AnalyzeProductSchema', () => {
  it('accepts an inline image alone', () => {
    expect(AnalyzeProductSchema.safeParse({ image: 'data:image/jpeg;base64,...' }).success).toBe(true)
  })

  it('accepts an imageUrl alone', () => {
    expect(AnalyzeProductSchema.safeParse({ imageUrl: 'https://example.com/img.jpg' }).success).toBe(true)
  })

  it('accepts both together', () => {
    expect(
      AnalyzeProductSchema.safeParse({ image: 'data:...', imageUrl: 'https://example.com/img.jpg' }).success,
    ).toBe(true)
  })

  it('rejects an empty body (no image and no imageUrl)', () => {
    expect(AnalyzeProductSchema.safeParse({}).success).toBe(false)
  })

  it('rejects when both fields are explicitly null', () => {
    expect(AnalyzeProductSchema.safeParse({ image: null, imageUrl: null }).success).toBe(false)
  })

  it('defaults saveToDatabase to false', () => {
    const result = AnalyzeProductSchema.safeParse({ image: 'data:...' })
    expect(result.success).toBe(true)
    if (!result.success) return
    expect(result.data.saveToDatabase).toBe(false)
  })

  it('accepts saveToDatabase true', () => {
    const result = AnalyzeProductSchema.safeParse({ image: 'data:...', saveToDatabase: true })
    expect(result.success).toBe(true)
    if (!result.success) return
    expect(result.data.saveToDatabase).toBe(true)
  })

  it('attaches the refine error to the image path', () => {
    const result = AnalyzeProductSchema.safeParse({})
    expect(result.success).toBe(false)
    if (result.success) return
    expect(result.error.issues[0]?.path).toEqual(['image'])
  })
})
