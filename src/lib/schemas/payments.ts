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

// =============================================================================
// INVOICE UPDATE
// =============================================================================

export const UpdateInvoiceSchema = z.object({
  status: z.string().max(50).optional(),
  notes: z.string().max(5000).optional().nullable(),
  due_date: z.string().optional().nullable(),
  billing_address: z.record(z.string(), z.unknown()).optional().nullable(),
  shipping_address: z.record(z.string(), z.unknown()).optional().nullable(),
  payment_terms: z.string().max(500).optional().nullable(),
  line_items: z.array(z.record(z.string(), z.unknown())).optional().nullable(),
})

export type UpdateInvoiceInput = z.infer<typeof UpdateInvoiceSchema>

// =============================================================================
// REFUND ACTIONS
// =============================================================================

export const RefundActionSchema = z.object({
  action: z.enum(['approve', 'reject', 'process']),
  notes: z.string().max(2000).optional().nullable(),
})

export type RefundActionInput = z.infer<typeof RefundActionSchema>
