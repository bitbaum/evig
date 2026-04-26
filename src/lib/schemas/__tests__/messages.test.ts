/**
 * Tests for messaging Zod schemas (lib/schemas/messages.ts).
 *
 * SendMessage validates the basic message payload (recipient + content
 * with length cap). CreateConversation seeds a thread with an optional
 * initial message.
 */

import { SendMessageSchema, CreateConversationSchema } from '../messages'
import { CONVERSATION_TYPES } from '@/config/database'

const UUID = '00000000-0000-4000-8000-000000000000'
const OTHER_UUID = '11111111-1111-4111-8111-111111111111'

describe('SendMessageSchema', () => {
  const valid = { recipient_id: UUID, content: 'Hallo!' }

  it('accepts a minimal valid message and defaults the context type', () => {
    const result = SendMessageSchema.safeParse(valid)
    expect(result.success).toBe(true)
    if (!result.success) return
    expect(result.data.context_type).toBe(CONVERSATION_TYPES.APPOINTMENT)
  })

  it('rejects empty content', () => {
    expect(SendMessageSchema.safeParse({ ...valid, content: '' }).success).toBe(false)
  })

  it('caps content at 5000 characters', () => {
    expect(SendMessageSchema.safeParse({ ...valid, content: 'x'.repeat(5000) }).success).toBe(true)
    expect(SendMessageSchema.safeParse({ ...valid, content: 'x'.repeat(5001) }).success).toBe(false)
  })

  it('rejects a non-UUID recipient_id', () => {
    expect(SendMessageSchema.safeParse({ ...valid, recipient_id: 'abc' }).success).toBe(false)
  })

  it('accepts optional context_id as null', () => {
    expect(SendMessageSchema.safeParse({ ...valid, context_id: null }).success).toBe(true)
  })

  it('rejects an unknown context_type', () => {
    expect(SendMessageSchema.safeParse({ ...valid, context_type: 'octopus' }).success).toBe(false)
  })
})

describe('CreateConversationSchema', () => {
  const valid = { participantId: UUID }

  it('accepts a minimal conversation and defaults type to direct', () => {
    const result = CreateConversationSchema.safeParse(valid)
    expect(result.success).toBe(true)
    if (!result.success) return
    expect(result.data.type).toBe('direct')
  })

  it('rejects a non-UUID participantId', () => {
    expect(CreateConversationSchema.safeParse({ participantId: 'abc' }).success).toBe(false)
  })

  it('accepts optional contextId as null or a UUID', () => {
    expect(CreateConversationSchema.safeParse({ ...valid, contextId: null }).success).toBe(true)
    expect(CreateConversationSchema.safeParse({ ...valid, contextId: OTHER_UUID }).success).toBe(true)
  })

  it('caps initialMessage at 5000 characters when provided', () => {
    expect(CreateConversationSchema.safeParse({ ...valid, initialMessage: 'x'.repeat(5000) }).success).toBe(true)
    expect(CreateConversationSchema.safeParse({ ...valid, initialMessage: 'x'.repeat(5001) }).success).toBe(false)
  })

  it('rejects empty initialMessage when explicitly provided', () => {
    expect(CreateConversationSchema.safeParse({ ...valid, initialMessage: '' }).success).toBe(false)
  })

  it('caps type at 50 characters', () => {
    expect(CreateConversationSchema.safeParse({ ...valid, type: 'x'.repeat(51) }).success).toBe(false)
  })
})
