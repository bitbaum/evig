import { z } from 'zod'
import { uuidSchema, paginationSchema } from './common'
import { APPOINTMENT_ROLES } from '@/config/database'

const appointmentRoleValues = Object.values(APPOINTMENT_ROLES) as [string, ...string[]]

export const CreateAppointmentSchema = z.object({
  repairer_id: uuidSchema.optional().nullable(),
  repairer_profile_id: uuidSchema.optional().nullable(),
  service_type_id: uuidSchema.optional().nullable(),
  serviceSlug: z.string().optional().nullable(),
  description: z.string().min(1, 'Beschreibung ist erforderlich').max(2000, 'Beschreibung darf maximal 2000 Zeichen lang sein'),
  device_info: z.string().optional().nullable(),
  preferred_date: z.string().datetime({ offset: true }).optional().nullable(),
  preferredDate: z.string().datetime({ offset: true }).optional().nullable(),
  urgency: z.enum(['normal', 'urgent', 'emergency']).default('normal'),
  is_home_visit: z.boolean().default(false),
  visit_address: z.string().optional().nullable(),
  visit_city: z.string().optional().nullable(),
}).refine(
  (data) => {
    if (data.is_home_visit) {
      return !!data.visit_address && !!data.visit_city
    }
    return true
  },
  { message: 'Adresse und Stadt sind für Hausbesuche erforderlich', path: ['visit_address'] }
)

export type CreateAppointmentInput = z.infer<typeof CreateAppointmentSchema>

export const GetAppointmentsQuerySchema = paginationSchema.extend({
  role: z.enum(appointmentRoleValues).default(APPOINTMENT_ROLES.CUSTOMER),
  status: z.string().optional().nullable(),
  limit: z.coerce.number().int().min(1).max(100).default(50),
})

export type GetAppointmentsQuery = z.infer<typeof GetAppointmentsQuerySchema>

export const BookWithPaymentSchema = z.object({
  serviceSlug: z.string().min(1, 'Service-Slug ist erforderlich'),
  description: z.string().optional().nullable(),
  urgency: z.enum(['normal', 'urgent', 'emergency']).default('normal'),
  deviceInfo: z.string().optional().nullable(),
  preferredDate: z.string().datetime({ offset: true }).optional().nullable(),
  preferredTimeSlots: z.array(z.string()).optional().nullable(),
  useEscrow: z.boolean().default(true),
  autoReleaseDays: z.number().int().min(1).max(90).optional(),
})

export type BookWithPaymentInput = z.infer<typeof BookWithPaymentSchema>

// --- Appointment action schemas (for PATCH /api/appointments/[id]) ---

const AcceptActionSchema = z.object({ action: z.literal('accept') })
const RejectActionSchema = z.object({ action: z.literal('reject') })
const ApproveQuoteActionSchema = z.object({ action: z.literal('approve_quote') })
const RejectQuoteActionSchema = z.object({ action: z.literal('reject_quote') })
const CancelActionSchema = z.object({ action: z.literal('cancel') })

const QuoteActionSchema = z.object({
  action: z.literal('quote'),
  quoted_price_chf: z.number().positive('Preis muss positiv sein'),
  diagnosis_notes: z.string().optional(),
})

const StartActionSchema = z.object({
  action: z.literal('start'),
  confirmed_date: z.string().datetime({ offset: true }).optional(),
})

const CompleteActionSchema = z.object({
  action: z.literal('complete'),
  completion_notes: z.string().optional(),
})

const UpdateActionSchema = z.object({
  action: z.literal('update'),
  description: z.string().max(2000).optional(),
  preferred_date: z.string().datetime({ offset: true }).optional(),
})

const RateActionSchema = z.object({
  action: z.literal('rate'),
  customer_rating: z.number().int().min(1).max(5),
  customer_review: z.string().max(2000).optional(),
})

export const AppointmentActionSchema = z.discriminatedUnion('action', [
  AcceptActionSchema,
  RejectActionSchema,
  QuoteActionSchema,
  ApproveQuoteActionSchema,
  RejectQuoteActionSchema,
  StartActionSchema,
  CompleteActionSchema,
  UpdateActionSchema,
  CancelActionSchema,
  RateActionSchema,
])

export type AppointmentActionInput = z.infer<typeof AppointmentActionSchema>

// --- Pay for appointment ---

export const PayAppointmentSchema = z.object({
  useEscrow: z.boolean().default(true),
  autoReleaseDays: z.number().int().min(1).max(90).default(7),
  paymentType: z.enum(['full', 'deposit', 'remaining']).default('full'),
  customAmount: z.union([z.string(), z.number()]).optional().nullable(),
})

export type PayAppointmentInput = z.infer<typeof PayAppointmentSchema>
