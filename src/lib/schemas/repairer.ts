import { z } from 'zod'
import { phoneSchema, swissPostalCodeSchema } from './common'

export const RepairerApplicationSchema = z.object({
  businessType: z.string().min(1, 'Geschäftstyp ist erforderlich'),
  businessName: z.string().optional().nullable(),
  description: z.string().min(1, 'Beschreibung ist erforderlich'),
  yearsExperience: z.coerce.number().int().min(0).default(0),
  phone: phoneSchema,
  website: z.string().url('Ungültige URL').optional().nullable().or(z.literal('')),
  address: z.string().min(1, 'Adresse ist erforderlich'),
  city: z.string().min(1, 'Stadt ist erforderlich'),
  postalCode: swissPostalCodeSchema,
  serviceRadius: z.coerce.number().int().min(0).default(30),
  remoteServices: z.coerce.boolean().default(false),
  hourlyRate: z.coerce.number().positive().optional().nullable(),
  emergencyFee: z.coerce.number().positive().optional().nullable(),
  homeVisitFee: z.coerce.number().positive().optional().nullable(),
  servicesOffered: z.array(z.string()).min(1, 'Mindestens ein Service muss angegeben werden'),
  specializations: z.array(z.string()).default([]),
  certifications: z.array(z.string()).default([]),
  insuranceInfo: z.string().optional().nullable(),
  termsAccepted: z.literal(true, { error: 'AGB müssen akzeptiert werden' }),
})

export type RepairerApplicationInput = z.infer<typeof RepairerApplicationSchema>
