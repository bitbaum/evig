/**
 * Tests for meeting protocol Zod schemas (lib/schemas/protocols.ts)
 *
 * Protocols are the internal coordination record for team meetings.
 * They drive AI transcript processing and action-item-to-task linking.
 * Correct validation ensures the AI pipeline receives well-formed input.
 *
 * Covers: createProtocolSchema, processTranscriptSchema, processNotesSchema,
 *         importTasksSchema, structuredNotesSchema, linkActionSchema,
 *         parsedTaskItemSchema.
 */

import {
  createProtocolSchema,
  updateProtocolSchema,
  processTranscriptSchema,
  processNotesSchema,
  importTasksSchema,
  structuredNotesSchema,
  linkActionSchema,
  parsedTaskItemSchema,
} from '../protocols'

// ============================================================================
// createProtocolSchema
// ============================================================================

describe('createProtocolSchema', () => {
  const valid = {
    title: 'Team Weekly 2026-05-12',
    meeting_date: '2026-05-12',
    meeting_type: 'team_weekly',
    visibility: 'team',
  }

  it('accepts a minimal valid protocol', () => {
    const result = createProtocolSchema.safeParse(valid)
    expect(result.success).toBe(true)
  })

  it('defaults input_method to "transcript"', () => {
    const result = createProtocolSchema.safeParse(valid)
    if (result.success) expect(result.data.input_method).toBe('transcript')
  })

  it('defaults attendees to []', () => {
    const result = createProtocolSchema.safeParse(valid)
    if (result.success) expect(result.data.attendees).toEqual([])
  })

  it('rejects empty title', () => {
    const result = createProtocolSchema.safeParse({ ...valid, title: '' })
    expect(result.success).toBe(false)
  })

  it('rejects title longer than 200 characters', () => {
    const result = createProtocolSchema.safeParse({ ...valid, title: 'x'.repeat(201) })
    expect(result.success).toBe(false)
  })

  it('rejects empty meeting_date', () => {
    const result = createProtocolSchema.safeParse({ ...valid, meeting_date: '' })
    expect(result.success).toBe(false)
  })

  it('accepts all valid meeting_types', () => {
    for (const meeting_type of ['team_weekly', 'project_review', 'retro', 'board', 'ad_hoc']) {
      const result = createProtocolSchema.safeParse({ ...valid, meeting_type })
      expect(result.success).toBe(true)
    }
  })

  it('rejects invalid meeting_type', () => {
    const result = createProtocolSchema.safeParse({ ...valid, meeting_type: 'standups' })
    expect(result.success).toBe(false)
  })

  it('accepts all valid visibility options', () => {
    for (const visibility of ['team', 'attendees']) {
      const result = createProtocolSchema.safeParse({ ...valid, visibility })
      expect(result.success).toBe(true)
    }
  })

  it('rejects invalid visibility', () => {
    const result = createProtocolSchema.safeParse({ ...valid, visibility: 'public' })
    expect(result.success).toBe(false)
  })

  it('accepts all valid input_methods', () => {
    for (const input_method of ['audio', 'transcript', 'notes', 'tasks']) {
      const result = createProtocolSchema.safeParse({ ...valid, input_method })
      expect(result.success).toBe(true)
    }
  })

  it('rejects invalid input_method', () => {
    const result = createProtocolSchema.safeParse({ ...valid, input_method: 'video' })
    expect(result.success).toBe(false)
  })

  it('rejects non-UUID in attendees array', () => {
    const result = createProtocolSchema.safeParse({
      ...valid,
      attendees: ['not-a-uuid'],
    })
    expect(result.success).toBe(false)
  })

  it('accepts valid UUID attendees', () => {
    const result = createProtocolSchema.safeParse({
      ...valid,
      attendees: ['550e8400-e29b-41d4-a716-446655440000'],
    })
    expect(result.success).toBe(true)
  })
})

// ============================================================================
// processTranscriptSchema
// ============================================================================

describe('processTranscriptSchema', () => {
  it('accepts a valid transcript (50+ chars)', () => {
    const result = processTranscriptSchema.safeParse({
      raw_transcript: 'Meeting started. First topic: server upgrade. Decision: yes. Action: order next week.',
    })
    expect(result.success).toBe(true)
  })

  it('rejects transcript shorter than 50 characters', () => {
    const result = processTranscriptSchema.safeParse({
      raw_transcript: 'Too short',
    })
    expect(result.success).toBe(false)
  })

  it('accepts transcript of exactly 50 characters', () => {
    const result = processTranscriptSchema.safeParse({
      raw_transcript: 'x'.repeat(50),
    })
    expect(result.success).toBe(true)
  })

  it('rejects transcript longer than 100000 characters', () => {
    const result = processTranscriptSchema.safeParse({
      raw_transcript: 'x'.repeat(100001),
    })
    expect(result.success).toBe(false)
  })

  it('rejects missing raw_transcript', () => {
    const result = processTranscriptSchema.safeParse({})
    expect(result.success).toBe(false)
  })
})

// ============================================================================
// processNotesSchema
// ============================================================================

describe('processNotesSchema', () => {
  it('accepts valid notes (20+ chars)', () => {
    const result = processNotesSchema.safeParse({
      content: 'Beschluss: Server wird bestellt. Verantwortlich: Andreas.',
    })
    expect(result.success).toBe(true)
  })

  it('rejects notes shorter than 20 characters', () => {
    const result = processNotesSchema.safeParse({ content: 'Zu kurz.' })
    expect(result.success).toBe(false)
  })

  it('rejects notes longer than 100000 characters', () => {
    const result = processNotesSchema.safeParse({ content: 'x'.repeat(100001) })
    expect(result.success).toBe(false)
  })

  it('rejects missing content', () => {
    const result = processNotesSchema.safeParse({})
    expect(result.success).toBe(false)
  })
})

// ============================================================================
// importTasksSchema
// ============================================================================

describe('importTasksSchema', () => {
  it('accepts valid task list (10+ chars)', () => {
    const result = importTasksSchema.safeParse({
      content: '- Server bestellen\n- Büro aufräumen',
    })
    expect(result.success).toBe(true)
  })

  it('rejects content shorter than 10 characters', () => {
    const result = importTasksSchema.safeParse({ content: 'Short' })
    expect(result.success).toBe(false)
  })

  it('rejects content longer than 50000 characters', () => {
    const result = importTasksSchema.safeParse({ content: 'x'.repeat(50001) })
    expect(result.success).toBe(false)
  })
})

// ============================================================================
// structuredNotesSchema
// ============================================================================

describe('structuredNotesSchema', () => {
  it('accepts empty object and applies defaults', () => {
    const result = structuredNotesSchema.safeParse({})
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.summary).toBe('')
      expect(result.data.detected_attendees).toEqual([])
      expect(result.data.topics).toEqual([])
      expect(result.data.action_items).toEqual([])
      expect(result.data.follow_ups).toEqual([])
    }
  })

  it('accepts full structured notes', () => {
    const result = structuredNotesSchema.safeParse({
      summary: 'Produktives Meeting.',
      detected_attendees: ['Andreas', 'Georgy'],
      topics: [{
        id: 'topic-1',
        title: 'Server-Upgrade',
        discussion: 'Brauchen mehr RAM.',
        outcome: 'Genehmigt.',
      }],
      action_items: [{
        id: 'action-1',
        description: 'Server bestellen',
        assigned_to_name: 'Andreas',
        assigned_to_id: null,
        due_hint: 'nächste Woche',
        item_type: 'task',
        topic_id: 'topic-1',
        priority_hint: 'high',
      }],
      follow_ups: [{
        description: 'Budget bestätigen',
        status: 'offen',
      }],
    })
    expect(result.success).toBe(true)
  })

  it('rejects invalid action item item_type', () => {
    const result = structuredNotesSchema.safeParse({
      action_items: [{
        id: 'action-1',
        description: 'Do something',
        item_type: 'meeting', // invalid
      }],
    })
    expect(result.success).toBe(false)
  })

  it('rejects invalid priority_hint', () => {
    const result = structuredNotesSchema.safeParse({
      action_items: [{
        id: 'action-1',
        description: 'Do something',
        priority_hint: 'critical', // invalid
      }],
    })
    expect(result.success).toBe(false)
  })

  it('defaults action_item item_type to "info"', () => {
    const result = structuredNotesSchema.safeParse({
      action_items: [{
        id: 'action-1',
        description: 'Something',
      }],
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.action_items[0].item_type).toBe('info')
    }
  })
})

// ============================================================================
// linkActionSchema
// ============================================================================

describe('linkActionSchema', () => {
  it('accepts task link type with task_data', () => {
    const result = linkActionSchema.safeParse({
      action_item_id: 'action-1',
      link_type: 'task',
      task_data: {
        title: 'Server bestellen',
      },
    })
    expect(result.success).toBe(true)
  })

  it('accepts decision link type with decision_data', () => {
    const result = linkActionSchema.safeParse({
      action_item_id: 'action-1',
      link_type: 'decision',
      decision_data: {
        title: 'Server-Budget genehmigen?',
        description: 'Sollen wir den neuen Server kaufen?',
      },
    })
    expect(result.success).toBe(true)
  })

  it('rejects empty action_item_id', () => {
    const result = linkActionSchema.safeParse({
      action_item_id: '',
      link_type: 'task',
    })
    expect(result.success).toBe(false)
  })

  it('rejects invalid link_type', () => {
    const result = linkActionSchema.safeParse({
      action_item_id: 'action-1',
      link_type: 'comment',
    })
    expect(result.success).toBe(false)
  })

  it('rejects missing action_item_id', () => {
    const result = linkActionSchema.safeParse({ link_type: 'task' })
    expect(result.success).toBe(false)
  })

  it('task_data title rejects empty string', () => {
    const result = linkActionSchema.safeParse({
      action_item_id: 'action-1',
      link_type: 'task',
      task_data: { title: '' },
    })
    expect(result.success).toBe(false)
  })

  it('task_data title rejects over 200 characters', () => {
    const result = linkActionSchema.safeParse({
      action_item_id: 'action-1',
      link_type: 'task',
      task_data: { title: 'x'.repeat(201) },
    })
    expect(result.success).toBe(false)
  })
})

// ============================================================================
// parsedTaskItemSchema
// ============================================================================

describe('parsedTaskItemSchema', () => {
  it('accepts minimal valid task item', () => {
    const result = parsedTaskItemSchema.safeParse({ description: 'Aufräumen' })
    expect(result.success).toBe(true)
  })

  it('defaults priority to "normal"', () => {
    const result = parsedTaskItemSchema.safeParse({ description: 'Aufräumen' })
    if (result.success) expect(result.data.priority).toBe('normal')
  })

  it('defaults assigned_to_name to null', () => {
    const result = parsedTaskItemSchema.safeParse({ description: 'Aufräumen' })
    if (result.success) expect(result.data.assigned_to_name).toBeNull()
  })

  it('rejects empty description', () => {
    const result = parsedTaskItemSchema.safeParse({ description: '' })
    expect(result.success).toBe(false)
  })

  it('accepts all valid priority values', () => {
    for (const priority of ['low', 'normal', 'high']) {
      const result = parsedTaskItemSchema.safeParse({ description: 'Task', priority })
      expect(result.success).toBe(true)
    }
  })

  it('rejects invalid priority', () => {
    const result = parsedTaskItemSchema.safeParse({ description: 'Task', priority: 'urgent' })
    expect(result.success).toBe(false)
  })
})
