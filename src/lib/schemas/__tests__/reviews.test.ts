/**
 * Tests for review Zod schemas (lib/schemas/reviews.ts).
 *
 * Reviews are user-generated content with rating bounds and per-target
 * type enums. Schema correctness keeps malformed reviews out of the DB
 * and bounds the helpful/unhelpful vote vocabulary.
 */

import {
  CreateReviewSchema,
  GetReviewsQuerySchema,
  UpdateReviewSchema,
  ReviewVoteSchema,
  ReviewResponseSchema,
  ModerateReviewSchema,
} from '../reviews'
import { REVIEW_TARGET_TYPES } from '@/config/database'

const UUID = '00000000-0000-4000-8000-000000000000'
const TARGET_TYPE = Object.values(REVIEW_TARGET_TYPES)[0]

// ============================================================================
// CreateReviewSchema
// ============================================================================

describe('CreateReviewSchema', () => {
  const valid = {
    targetType: TARGET_TYPE,
    targetId: UUID,
    overallRating: 5,
    content: 'Great experience overall.',
  }

  it('accepts a minimal valid review', () => {
    expect(CreateReviewSchema.safeParse(valid).success).toBe(true)
  })

  it('rejects content shorter than 10 characters', () => {
    const result = CreateReviewSchema.safeParse({ ...valid, content: 'too short' })
    expect(result.success).toBe(false)
  })

  it('rejects content longer than 5000 characters', () => {
    const result = CreateReviewSchema.safeParse({ ...valid, content: 'x'.repeat(5001) })
    expect(result.success).toBe(false)
  })

  it('rejects rating below 1', () => {
    expect(CreateReviewSchema.safeParse({ ...valid, overallRating: 0 }).success).toBe(false)
  })

  it('rejects rating above 5', () => {
    expect(CreateReviewSchema.safeParse({ ...valid, overallRating: 6 }).success).toBe(false)
  })

  it('rejects fractional ratings (must be integer)', () => {
    expect(CreateReviewSchema.safeParse({ ...valid, overallRating: 4.5 }).success).toBe(false)
  })

  it('accepts each integer rating 1..5', () => {
    for (const r of [1, 2, 3, 4, 5]) {
      expect(CreateReviewSchema.safeParse({ ...valid, overallRating: r }).success).toBe(true)
    }
  })

  it('accepts optional sub-ratings as null', () => {
    const result = CreateReviewSchema.safeParse({
      ...valid,
      communicationRating: null,
      professionalismRating: null,
      qualityRating: null,
      timelinessRating: null,
      valueRating: null,
    })
    expect(result.success).toBe(true)
  })

  it('rejects an invalid sub-rating', () => {
    expect(CreateReviewSchema.safeParse({ ...valid, qualityRating: 7 }).success).toBe(false)
  })

  it('rejects a non-UUID targetId', () => {
    expect(CreateReviewSchema.safeParse({ ...valid, targetId: 'not-uuid' }).success).toBe(false)
  })

  it('caps title at 200 characters', () => {
    expect(CreateReviewSchema.safeParse({ ...valid, title: 'x'.repeat(201) }).success).toBe(false)
  })

  it('rejects an unknown targetType', () => {
    expect(CreateReviewSchema.safeParse({ ...valid, targetType: 'octopus' }).success).toBe(false)
  })
})

// ============================================================================
// GetReviewsQuerySchema
// ============================================================================

describe('GetReviewsQuerySchema', () => {
  const valid = { targetType: TARGET_TYPE, targetId: UUID }

  it('applies all defaults when only required fields are provided', () => {
    const result = GetReviewsQuerySchema.safeParse(valid)
    expect(result.success).toBe(true)
    if (!result.success) return
    expect(result.data.status).toBe('published')
    expect(result.data.limit).toBe(10)
    expect(result.data.offset).toBe(0)
    expect(result.data.sortBy).toBe('created_at')
    expect(result.data.sortOrder).toBe('desc')
  })

  it('coerces string limit/offset to numbers (URL search params)', () => {
    const result = GetReviewsQuerySchema.safeParse({ ...valid, limit: '25', offset: '50' })
    expect(result.success).toBe(true)
    if (!result.success) return
    expect(result.data.limit).toBe(25)
    expect(result.data.offset).toBe(50)
  })

  it('clamps limit to 100', () => {
    expect(GetReviewsQuerySchema.safeParse({ ...valid, limit: 101 }).success).toBe(false)
  })

  it('rejects negative offset', () => {
    expect(GetReviewsQuerySchema.safeParse({ ...valid, offset: -1 }).success).toBe(false)
  })

  it('rejects unknown sortBy', () => {
    expect(GetReviewsQuerySchema.safeParse({ ...valid, sortBy: 'price' }).success).toBe(false)
  })

  it('rejects unknown status', () => {
    expect(GetReviewsQuerySchema.safeParse({ ...valid, status: 'pending' }).success).toBe(false)
  })
})

// ============================================================================
// UpdateReviewSchema
// ============================================================================

describe('UpdateReviewSchema', () => {
  it('accepts an empty patch (all fields optional)', () => {
    expect(UpdateReviewSchema.safeParse({}).success).toBe(true)
  })

  it('still applies rating bounds when overallRating is provided', () => {
    expect(UpdateReviewSchema.safeParse({ overallRating: 6 }).success).toBe(false)
  })

  it('still applies content min length when content is provided', () => {
    expect(UpdateReviewSchema.safeParse({ content: 'short' }).success).toBe(false)
  })
})

// ============================================================================
// ReviewVoteSchema
// ============================================================================

describe('ReviewVoteSchema', () => {
  it('accepts both vote types', () => {
    expect(ReviewVoteSchema.safeParse({ voteType: 'helpful' }).success).toBe(true)
    expect(ReviewVoteSchema.safeParse({ voteType: 'unhelpful' }).success).toBe(true)
  })

  it('rejects any other vote string', () => {
    expect(ReviewVoteSchema.safeParse({ voteType: 'love' }).success).toBe(false)
  })
})

// ============================================================================
// ReviewResponseSchema
// ============================================================================

describe('ReviewResponseSchema', () => {
  it('rejects empty content', () => {
    expect(ReviewResponseSchema.safeParse({ content: '' }).success).toBe(false)
  })

  it('caps content at 2000 characters', () => {
    expect(ReviewResponseSchema.safeParse({ content: 'x'.repeat(2001) }).success).toBe(false)
    expect(ReviewResponseSchema.safeParse({ content: 'x'.repeat(2000) }).success).toBe(true)
  })
})

// ============================================================================
// ModerateReviewSchema
// ============================================================================

describe('ModerateReviewSchema', () => {
  it('accepts each valid moderation status', () => {
    for (const s of ['published', 'hidden', 'deleted']) {
      expect(ModerateReviewSchema.safeParse({ status: s }).success).toBe(true)
    }
  })

  it('rejects pending_moderation (set by system, not by moderator)', () => {
    expect(ModerateReviewSchema.safeParse({ status: 'pending_moderation' }).success).toBe(false)
  })

  it('caps moderationNote at 500 characters', () => {
    expect(ModerateReviewSchema.safeParse({ status: 'hidden', moderationNote: 'x'.repeat(501) }).success).toBe(false)
  })
})
