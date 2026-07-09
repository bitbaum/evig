import { z } from 'zod'
import { getSkillIds } from '@/config/it-hilfe'

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
