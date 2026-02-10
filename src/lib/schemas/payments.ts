import { z } from 'zod'
import { uuidSchema } from './common'

export const CreatePaymentIntentSchema = z.object({
  amount: z.number().positive('Betrag muss positiv sein'),
  currency: z.enum(['CHF', 'EUR']).default('CHF'),
  orderId: uuidSchema.optional().nullable(),
  serviceAppointmentId: uuidSchema.optional().nullable(),
  workshopRegistrationId: uuidSchema.optional().nullable(),
  description: z.string().optional(),
  escrowEnabled: z.boolean().default(false),
  autoReleaseDays: z.number().int().min(1).max(90).default(7),
  includeVAT: z.boolean().default(true),
  businessType: z.enum(['service', 'product', 'digital']).default('service'),
})

export type CreatePaymentIntentInput = z.infer<typeof CreatePaymentIntentSchema>

export const RefundSchema = z.object({
  transactionId: uuidSchema,
  amount: z.number().positive('Betrag muss positiv sein'),
  reason: z.string().min(1, 'Grund ist erforderlich'),
  reasonDetails: z.string().optional().nullable(),
  customerNotes: z.string().optional().nullable(),
})

export type RefundInput = z.infer<typeof RefundSchema>

export const EscrowReleaseSchema = z.object({
  amount: z.number().positive('Betrag muss positiv sein'),
  reason: z.string().optional(),
  releaseType: z.enum(['full', 'partial']).default('full'),
})

export type EscrowReleaseInput = z.infer<typeof EscrowReleaseSchema>
