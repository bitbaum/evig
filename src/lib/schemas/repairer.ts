import { z } from 'zod'
import { phoneSchema, swissPostalCodeSchema } from './common'
import { getSkillIds } from '@/config/it-hilfe'

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

// ============================================================================
// Technician Profile Schema (IT-Hilfe)
// ============================================================================

const validServiceTypes = ['remote', 'onsite', 'pickup', 'dropoff', 'flexible'] as const;

export const TechnicianProfileSchema = z.object({
  skills: z
    .array(z.enum(getSkillIds() as [string, ...string[]]))
    .default([]),
  bio: z.string().max(5000).default(''),
  hourlyRateCents: z.number().int().min(0).nullable().default(null),
  acceptsGratis: z.boolean().default(true),
  acceptsKulturlegi: z.boolean().default(true),
  serviceTypes: z
    .array(z.enum(validServiceTypes))
    .default(['flexible']),
  postalCode: z.string().max(10).default(''),
  city: z.string().max(100).default(''),
  canton: z.string().max(2).default(''),
  maxTravelKm: z.number().int().min(0).max(500).default(10),
  isActive: z.boolean().default(false),
});

export type TechnicianProfileInput = z.infer<typeof TechnicianProfileSchema>
