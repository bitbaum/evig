/**
 * Tests for tasks Zod schemas (lib/schemas/tasks.ts)
 *
 * Task management is the internal coordination layer for the RevampIT team.
 * Validation correctness ensures staff can submit and complete tasks reliably.
 *
 * Covers: createTaskSchema, taskCompletionSchema, attentionFlagSchema,
 *         taskRequestSchema, requestResponseSchema, createProjectSchema.
 */

import {
  createTaskSchema,
  updateTaskSchema,
  taskCompletionSchema,
  attentionFlagSchema,
  taskRequestSchema,
  requestResponseSchema,
  createProjectSchema,
} from '../tasks'

// ============================================================================
// createTaskSchema
// ============================================================================

describe('createTaskSchema', () => {
  const valid = {
    title: 'Drucker-Toner wechseln',
    task_type: 'one_time',
    category: 'maintenance',
  }

  it('accepts a minimal valid task', () => {
    const result = createTaskSchema.safeParse(valid)
    expect(result.success).toBe(true)
  })

  it('defaults priority to "normal"', () => {
    const result = createTaskSchema.safeParse(valid)
    if (result.success) expect(result.data.priority).toBe('normal')
  })

  it('defaults tags to []', () => {
    const result = createTaskSchema.safeParse(valid)
    if (result.success) expect(result.data.tags).toEqual([])
  })

  it('rejects empty title', () => {
    const result = createTaskSchema.safeParse({ ...valid, title: '' })
    expect(result.success).toBe(false)
  })

  it('rejects title longer than 200 characters', () => {
    const result = createTaskSchema.safeParse({ ...valid, title: 'x'.repeat(201) })
    expect(result.success).toBe(false)
  })

  it('rejects description longer than 2000 characters', () => {
    const result = createTaskSchema.safeParse({ ...valid, description: 'x'.repeat(2001) })
    expect(result.success).toBe(false)
  })

  it('accepts description of exactly 2000 characters', () => {
    const result = createTaskSchema.safeParse({ ...valid, description: 'x'.repeat(2000) })
    expect(result.success).toBe(true)
  })

  it('rejects invalid task_type', () => {
    const result = createTaskSchema.safeParse({ ...valid, task_type: 'daily' })
    expect(result.success).toBe(false)
  })

  it('accepts all valid task_types', () => {
    for (const task_type of ['one_time', 'recurring_scheduled', 'recurring_as_needed']) {
      const result = createTaskSchema.safeParse({ ...valid, task_type })
      expect(result.success).toBe(true)
    }
  })

  it('rejects invalid category', () => {
    const result = createTaskSchema.safeParse({ ...valid, category: 'gardening' })
    expect(result.success).toBe(false)
  })

  it('accepts all valid categories', () => {
    const cats = ['cleaning', 'maintenance', 'admin', 'inventory', 'it', 'kitchen', 'workshop', 'logistics', 'other']
    for (const category of cats) {
      const result = createTaskSchema.safeParse({ ...valid, category })
      expect(result.success).toBe(true)
    }
  })

  it('accepts all valid priority values', () => {
    for (const priority of ['low', 'normal', 'high', 'urgent']) {
      const result = createTaskSchema.safeParse({ ...valid, priority })
      expect(result.success).toBe(true)
    }
  })

  it('rejects invalid priority', () => {
    const result = createTaskSchema.safeParse({ ...valid, priority: 'critical' })
    expect(result.success).toBe(false)
  })

  it('rejects estimated_minutes below 1', () => {
    const result = createTaskSchema.safeParse({ ...valid, estimated_minutes: 0 })
    expect(result.success).toBe(false)
  })

  it('rejects estimated_minutes above 480 (8 hours)', () => {
    const result = createTaskSchema.safeParse({ ...valid, estimated_minutes: 481 })
    expect(result.success).toBe(false)
  })

  it('accepts estimated_minutes of 480', () => {
    const result = createTaskSchema.safeParse({ ...valid, estimated_minutes: 480 })
    expect(result.success).toBe(true)
  })

  it('rejects non-integer estimated_minutes', () => {
    const result = createTaskSchema.safeParse({ ...valid, estimated_minutes: 30.5 })
    expect(result.success).toBe(false)
  })

  it('rejects more than 10 tags', () => {
    const tags = Array.from({ length: 11 }, (_, i) => `tag${i}`)
    const result = createTaskSchema.safeParse({ ...valid, tags })
    expect(result.success).toBe(false)
  })

  it('rejects a tag longer than 50 characters', () => {
    const result = createTaskSchema.safeParse({ ...valid, tags: ['x'.repeat(51)] })
    expect(result.success).toBe(false)
  })

  it('accepts valid UUID for project_id', () => {
    const result = createTaskSchema.safeParse({
      ...valid,
      project_id: '550e8400-e29b-41d4-a716-446655440000',
    })
    expect(result.success).toBe(true)
  })

  it('rejects non-UUID project_id', () => {
    const result = createTaskSchema.safeParse({ ...valid, project_id: 'not-a-uuid' })
    expect(result.success).toBe(false)
  })
})

// ============================================================================
// taskCompletionSchema
// ============================================================================

describe('taskCompletionSchema', () => {
  it('accepts empty input (all optional)', () => {
    const result = taskCompletionSchema.safeParse({})
    expect(result.success).toBe(true)
  })

  it('accepts valid notes and duration', () => {
    const result = taskCompletionSchema.safeParse({
      notes: 'Toner ausgetauscht, läuft wieder.',
      duration_minutes: 15,
    })
    expect(result.success).toBe(true)
  })

  it('rejects notes longer than 1000 characters', () => {
    const result = taskCompletionSchema.safeParse({ notes: 'x'.repeat(1001) })
    expect(result.success).toBe(false)
  })

  it('rejects duration_minutes below 1', () => {
    const result = taskCompletionSchema.safeParse({ duration_minutes: 0 })
    expect(result.success).toBe(false)
  })

  it('rejects duration_minutes above 480', () => {
    const result = taskCompletionSchema.safeParse({ duration_minutes: 481 })
    expect(result.success).toBe(false)
  })

  it('rejects non-integer duration_minutes', () => {
    const result = taskCompletionSchema.safeParse({ duration_minutes: 30.5 })
    expect(result.success).toBe(false)
  })
})

// ============================================================================
// attentionFlagSchema
// ============================================================================

describe('attentionFlagSchema', () => {
  it('accepts empty input (message optional)', () => {
    const result = attentionFlagSchema.safeParse({})
    expect(result.success).toBe(true)
  })

  it('accepts a message', () => {
    const result = attentionFlagSchema.safeParse({ message: 'Gerät fehlt.' })
    expect(result.success).toBe(true)
  })

  it('rejects message longer than 500 characters', () => {
    const result = attentionFlagSchema.safeParse({ message: 'x'.repeat(501) })
    expect(result.success).toBe(false)
  })
})

// ============================================================================
// taskRequestSchema
// ============================================================================

describe('taskRequestSchema', () => {
  it('accepts empty input (broadcast to all)', () => {
    const result = taskRequestSchema.safeParse({})
    expect(result.success).toBe(true)
  })

  it('accepts valid UUID for requested_user_id', () => {
    const result = taskRequestSchema.safeParse({
      requested_user_id: '550e8400-e29b-41d4-a716-446655440000',
    })
    expect(result.success).toBe(true)
  })

  it('rejects non-UUID requested_user_id', () => {
    const result = taskRequestSchema.safeParse({ requested_user_id: 'not-uuid' })
    expect(result.success).toBe(false)
  })

  it('rejects message longer than 500 characters', () => {
    const result = taskRequestSchema.safeParse({ message: 'x'.repeat(501) })
    expect(result.success).toBe(false)
  })
})

// ============================================================================
// requestResponseSchema
// ============================================================================

describe('requestResponseSchema', () => {
  it('accepts accepted status', () => {
    const result = requestResponseSchema.safeParse({ status: 'accepted' })
    expect(result.success).toBe(true)
  })

  it('accepts declined status', () => {
    const result = requestResponseSchema.safeParse({ status: 'declined' })
    expect(result.success).toBe(true)
  })

  it('rejects invalid status', () => {
    const result = requestResponseSchema.safeParse({ status: 'pending' })
    expect(result.success).toBe(false)
  })

  it('rejects missing status', () => {
    const result = requestResponseSchema.safeParse({})
    expect(result.success).toBe(false)
  })

  it('accepts optional response_message', () => {
    const result = requestResponseSchema.safeParse({
      status: 'accepted',
      response_message: 'Ich mache das gerne.',
    })
    expect(result.success).toBe(true)
  })
})

// ============================================================================
// createProjectSchema
// ============================================================================

describe('createProjectSchema', () => {
  const valid = { title: 'Lagersanierung Q2' }

  it('accepts minimal valid project (title only)', () => {
    const result = createProjectSchema.safeParse(valid)
    expect(result.success).toBe(true)
  })

  it('defaults status to "planning"', () => {
    const result = createProjectSchema.safeParse(valid)
    if (result.success) expect(result.data.status).toBe('planning')
  })

  it('rejects empty title', () => {
    const result = createProjectSchema.safeParse({ ...valid, title: '' })
    expect(result.success).toBe(false)
  })

  it('rejects title longer than 200 characters', () => {
    const result = createProjectSchema.safeParse({ ...valid, title: 'x'.repeat(201) })
    expect(result.success).toBe(false)
  })

  it('rejects description longer than 2000 characters', () => {
    const result = createProjectSchema.safeParse({ ...valid, description: 'x'.repeat(2001) })
    expect(result.success).toBe(false)
  })

  it('rejects invalid status', () => {
    const result = createProjectSchema.safeParse({ ...valid, status: 'archived' })
    expect(result.success).toBe(false)
  })
})
