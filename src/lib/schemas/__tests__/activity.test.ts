/**
 * Tests for activity stream Zod schemas (lib/schemas/activity.ts)
 *
 * The activity stream is the internal coordination layer — team members post
 * accomplishments, milestones, and help requests. Correct validation ensures
 * the stream stays signal (not noise) and help requests are routable.
 *
 * Covers: updateCurrentFocusSchema, createActivityUpdateSchema,
 *         updateActivityUpdateSchema, createHelpRequestSchema,
 *         updateHelpRequestSchema, resolveHelpRequestSchema,
 *         activityStreamFilterSchema, helpRequestFilterSchema.
 */

import {
  updateCurrentFocusSchema,
  createActivityUpdateSchema,
  updateActivityUpdateSchema,
  createHelpRequestSchema,
  updateHelpRequestSchema,
  resolveHelpRequestSchema,
  activityStreamFilterSchema,
  helpRequestFilterSchema,
} from '../activity'

import {
  ACTIVITY_UPDATE_TYPE_OPTIONS,
  VISIBILITY_OPTIONS,
  HELP_REQUEST_URGENCY_OPTIONS,
  HELP_REQUEST_STATUS_OPTIONS,
  ACTIVITY_CATEGORY_OPTIONS,
} from '@/config/activity'

// ============================================================================
// updateCurrentFocusSchema
// ============================================================================

describe('updateCurrentFocusSchema', () => {
  it('accepts a valid focus string', () => {
    const result = updateCurrentFocusSchema.safeParse({ current_focus: 'Lager aufräumen' })
    expect(result.success).toBe(true)
  })

  it('accepts null (clearing focus)', () => {
    const result = updateCurrentFocusSchema.safeParse({ current_focus: null })
    expect(result.success).toBe(true)
  })

  it('rejects focus longer than 200 characters', () => {
    const result = updateCurrentFocusSchema.safeParse({ current_focus: 'x'.repeat(201) })
    expect(result.success).toBe(false)
  })
})

// ============================================================================
// createActivityUpdateSchema
// ============================================================================

describe('createActivityUpdateSchema', () => {
  const valid = { title: 'Shop-System migriert' }

  it('accepts minimal valid activity update', () => {
    const result = createActivityUpdateSchema.safeParse(valid)
    expect(result.success).toBe(true)
  })

  it('defaults update_type to "accomplishment"', () => {
    const result = createActivityUpdateSchema.safeParse(valid)
    if (result.success) expect(result.data.update_type).toBe('accomplishment')
  })

  it('defaults visibility to "team"', () => {
    const result = createActivityUpdateSchema.safeParse(valid)
    if (result.success) expect(result.data.visibility).toBe('team')
  })

  it('rejects empty title', () => {
    const result = createActivityUpdateSchema.safeParse({ title: '' })
    expect(result.success).toBe(false)
  })

  it('rejects title longer than 200 characters', () => {
    const result = createActivityUpdateSchema.safeParse({ title: 'x'.repeat(201) })
    expect(result.success).toBe(false)
  })

  it('accepts all valid update types', () => {
    for (const update_type of ACTIVITY_UPDATE_TYPE_OPTIONS) {
      const result = createActivityUpdateSchema.safeParse({ ...valid, update_type })
      expect(result.success).toBe(true)
    }
  })

  it('rejects invalid update type', () => {
    const result = createActivityUpdateSchema.safeParse({ ...valid, update_type: 'status_change' })
    expect(result.success).toBe(false)
  })

  it('accepts all valid visibility options', () => {
    for (const visibility of VISIBILITY_OPTIONS) {
      const result = createActivityUpdateSchema.safeParse({ ...valid, visibility })
      expect(result.success).toBe(true)
    }
  })

  it('rejects invalid visibility', () => {
    const result = createActivityUpdateSchema.safeParse({ ...valid, visibility: 'private' })
    expect(result.success).toBe(false)
  })

  it('accepts all valid categories', () => {
    for (const category of ACTIVITY_CATEGORY_OPTIONS) {
      const result = createActivityUpdateSchema.safeParse({ ...valid, category })
      expect(result.success).toBe(true)
    }
  })

  it('rejects description longer than 2000 characters', () => {
    const result = createActivityUpdateSchema.safeParse({ ...valid, description: 'x'.repeat(2001) })
    expect(result.success).toBe(false)
  })
})

// ============================================================================
// updateActivityUpdateSchema (partial)
// ============================================================================

describe('updateActivityUpdateSchema', () => {
  it('accepts empty update (all optional)', () => {
    const result = updateActivityUpdateSchema.safeParse({})
    expect(result.success).toBe(true)
  })

  it('accepts partial update with just title', () => {
    const result = updateActivityUpdateSchema.safeParse({ title: 'Updated title' })
    expect(result.success).toBe(true)
  })

  it('still validates fields that are provided', () => {
    const result = updateActivityUpdateSchema.safeParse({ visibility: 'secret' })
    expect(result.success).toBe(false)
  })
})

// ============================================================================
// createHelpRequestSchema
// ============================================================================

describe('createHelpRequestSchema', () => {
  const valid = { title: 'Drucker reagiert nicht' }

  it('accepts minimal valid help request', () => {
    const result = createHelpRequestSchema.safeParse(valid)
    expect(result.success).toBe(true)
  })

  it('defaults urgency to "normal"', () => {
    const result = createHelpRequestSchema.safeParse(valid)
    if (result.success) expect(result.data.urgency).toBe('normal')
  })

  it('rejects empty title', () => {
    const result = createHelpRequestSchema.safeParse({ title: '' })
    expect(result.success).toBe(false)
  })

  it('accepts all valid urgency levels', () => {
    for (const urgency of HELP_REQUEST_URGENCY_OPTIONS) {
      const result = createHelpRequestSchema.safeParse({ ...valid, urgency })
      expect(result.success).toBe(true)
    }
  })

  it('rejects invalid urgency', () => {
    const result = createHelpRequestSchema.safeParse({ ...valid, urgency: 'critical' })
    expect(result.success).toBe(false)
  })

  it('accepts valid UUID for requested_user_id (direct request)', () => {
    const result = createHelpRequestSchema.safeParse({
      ...valid,
      requested_user_id: '550e8400-e29b-41d4-a716-446655440000',
    })
    expect(result.success).toBe(true)
  })

  it('accepts null requested_user_id (broadcast)', () => {
    const result = createHelpRequestSchema.safeParse({ ...valid, requested_user_id: null })
    expect(result.success).toBe(true)
  })

  it('rejects non-UUID requested_user_id', () => {
    const result = createHelpRequestSchema.safeParse({ ...valid, requested_user_id: 'not-uuid' })
    expect(result.success).toBe(false)
  })
})

// ============================================================================
// updateHelpRequestSchema
// ============================================================================

describe('updateHelpRequestSchema', () => {
  it('accepts empty update (all optional)', () => {
    const result = updateHelpRequestSchema.safeParse({})
    expect(result.success).toBe(true)
  })

  it('accepts valid status update', () => {
    for (const status of HELP_REQUEST_STATUS_OPTIONS) {
      const result = updateHelpRequestSchema.safeParse({ status })
      expect(result.success).toBe(true)
    }
  })

  it('rejects invalid status', () => {
    const result = updateHelpRequestSchema.safeParse({ status: 'closed' })
    expect(result.success).toBe(false)
  })

  it('rejects invalid urgency', () => {
    const result = updateHelpRequestSchema.safeParse({ urgency: 'extreme' })
    expect(result.success).toBe(false)
  })
})

// ============================================================================
// resolveHelpRequestSchema
// ============================================================================

describe('resolveHelpRequestSchema', () => {
  it('accepts empty object (notes optional)', () => {
    const result = resolveHelpRequestSchema.safeParse({})
    expect(result.success).toBe(true)
  })

  it('accepts resolution notes', () => {
    const result = resolveHelpRequestSchema.safeParse({
      resolution_notes: 'Druckertreiber neu installiert — Problem behoben.',
    })
    expect(result.success).toBe(true)
  })

  it('rejects resolution_notes longer than 1000 characters', () => {
    const result = resolveHelpRequestSchema.safeParse({
      resolution_notes: 'x'.repeat(1001),
    })
    expect(result.success).toBe(false)
  })

  it('accepts null resolution_notes', () => {
    const result = resolveHelpRequestSchema.safeParse({ resolution_notes: null })
    expect(result.success).toBe(true)
  })
})

// ============================================================================
// activityStreamFilterSchema
// ============================================================================

describe('activityStreamFilterSchema', () => {
  it('accepts empty query (all defaults)', () => {
    const result = activityStreamFilterSchema.safeParse({})
    expect(result.success).toBe(true)
  })

  it('defaults limit to 50', () => {
    const result = activityStreamFilterSchema.safeParse({})
    if (result.success) expect(result.data.limit).toBe(50)
  })

  it('defaults offset to 0', () => {
    const result = activityStreamFilterSchema.safeParse({})
    if (result.success) expect(result.data.offset).toBe(0)
  })

  it('rejects limit above 100', () => {
    const result = activityStreamFilterSchema.safeParse({ limit: 101 })
    expect(result.success).toBe(false)
  })

  it('rejects limit below 1', () => {
    const result = activityStreamFilterSchema.safeParse({ limit: 0 })
    expect(result.success).toBe(false)
  })

  it('coerces string limit to number', () => {
    const result = activityStreamFilterSchema.safeParse({ limit: '25' })
    expect(result.success).toBe(true)
    if (result.success) expect(result.data.limit).toBe(25)
  })

  it('accepts valid UUID user_id', () => {
    const result = activityStreamFilterSchema.safeParse({
      user_id: '550e8400-e29b-41d4-a716-446655440000',
    })
    expect(result.success).toBe(true)
  })

  it('rejects non-UUID user_id', () => {
    const result = activityStreamFilterSchema.safeParse({ user_id: 'not-uuid' })
    expect(result.success).toBe(false)
  })

  it('accepts valid category filter', () => {
    for (const category of ACTIVITY_CATEGORY_OPTIONS) {
      const result = activityStreamFilterSchema.safeParse({ category })
      expect(result.success).toBe(true)
    }
  })
})

// ============================================================================
// helpRequestFilterSchema
// ============================================================================

describe('helpRequestFilterSchema', () => {
  it('accepts empty query (all defaults)', () => {
    const result = helpRequestFilterSchema.safeParse({})
    expect(result.success).toBe(true)
  })

  it('defaults limit to 50', () => {
    const result = helpRequestFilterSchema.safeParse({})
    if (result.success) expect(result.data.limit).toBe(50)
  })

  it('accepts valid status filter', () => {
    for (const status of HELP_REQUEST_STATUS_OPTIONS) {
      const result = helpRequestFilterSchema.safeParse({ status })
      expect(result.success).toBe(true)
    }
  })

  it('rejects invalid status filter', () => {
    const result = helpRequestFilterSchema.safeParse({ status: 'pending' })
    expect(result.success).toBe(false)
  })

  it('accepts valid urgency filter', () => {
    for (const urgency of HELP_REQUEST_URGENCY_OPTIONS) {
      const result = helpRequestFilterSchema.safeParse({ urgency })
      expect(result.success).toBe(true)
    }
  })

  it('rejects invalid urgency filter', () => {
    const result = helpRequestFilterSchema.safeParse({ urgency: 'extreme' })
    expect(result.success).toBe(false)
  })

  it('coerces string is_broadcast', () => {
    const result = helpRequestFilterSchema.safeParse({ is_broadcast: 'true' })
    expect(result.success).toBe(true)
    if (result.success) expect(result.data.is_broadcast).toBe(true)
  })
})
