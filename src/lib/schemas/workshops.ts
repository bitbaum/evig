import { z } from 'zod'
import { uuidSchema } from './common'

export const WorkshopRegistrationSchema = z.object({
  workshopSlug: z.string().min(1, 'Workshop-Slug ist erforderlich'),
})

export type WorkshopRegistrationInput = z.infer<typeof WorkshopRegistrationSchema>

export const WorkshopProposalSchema = z.object({
  title: z.string().min(1, 'Titel ist erforderlich').max(200),
  description: z.string().min(1, 'Beschreibung ist erforderlich'),
  shortDescription: z.string().min(1, 'Kurzbeschreibung ist erforderlich').max(500),
  category: z.string().min(1, 'Kategorie ist erforderlich'),
  durationHours: z.coerce.number().positive('Dauer muss positiv sein'),
  level: z.string().min(1, 'Niveau ist erforderlich'),
  maxParticipants: z.coerce.number().int().min(1, 'Mindestens 1 Teilnehmer'),
  minParticipants: z.coerce.number().int().min(1, 'Mindestens 1 Teilnehmer'),
  pricePerPerson: z.coerce.number().min(0, 'Preis darf nicht negativ sein'),
  prerequisites: z.string().optional().nullable(),
  learningObjectives: z.array(z.string()).min(1, 'Mindestens ein Lernziel ist erforderlich'),
  targetAudience: z.string().optional().nullable(),
  materialsProvided: z.string().optional().nullable(),
  materialsRequired: z.string().optional().nullable(),
  locationType: z.string().optional().nullable(),
  selectedLocationId: uuidSchema.optional().nullable(),
  proposedLocation: z.string().optional().nullable(),
  proposedDate: z.string().optional().nullable(),
  proposedTime: z.string().optional().nullable(),
  specialRequirements: z.string().optional().nullable(),
  termsAccepted: z.literal(true, { error: 'AGB müssen akzeptiert werden' }),
})

export type WorkshopProposalInput = z.infer<typeof WorkshopProposalSchema>

export const WorkshopRegisterWithPaymentSchema = z.object({
  instanceId: uuidSchema.optional().nullable(),
  useEscrow: z.boolean().default(false),
})

export type WorkshopRegisterWithPaymentInput = z.infer<typeof WorkshopRegisterWithPaymentSchema>
