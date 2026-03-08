import { z } from 'zod'
import { uuidSchema } from './common'
import { CONVERSATION_TYPES } from '@/config/database'

const conversationTypeValues = Object.values(CONVERSATION_TYPES) as [string, ...string[]]

export const SendMessageSchema = z.object({
  recipient_id: uuidSchema,
  content: z.string().min(1, 'Nachricht darf nicht leer sein').max(5000, 'Nachricht darf maximal 5000 Zeichen lang sein'),
  context_id: uuidSchema.optional().nullable(),
  context_type: z.enum(conversationTypeValues).default(CONVERSATION_TYPES.APPOINTMENT),
})

export type SendMessageInput = z.infer<typeof SendMessageSchema>

export const CreateConversationSchema = z.object({
  participantId: uuidSchema,
  type: z.string().max(50).default('direct'),
  contextId: uuidSchema.optional().nullable(),
  initialMessage: z.string().min(1).max(5000).optional(),
})

export type CreateConversationInput = z.infer<typeof CreateConversationSchema>
