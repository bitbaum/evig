import { z } from 'zod'
import { swissPostalCodeSchema } from './common'

export const UpdateProfileSchema = z.object({
  first_name: z.string().max(100).optional(),
  last_name: z.string().max(100).optional(),
  company_name: z.string().max(200).optional(),
  phone: z.string().optional(),
  mobile: z.string().optional(),
  address_line1: z.string().max(200).optional(),
  address_line2: z.string().max(200).optional(),
  postal_code: swissPostalCodeSchema.optional(),
  city: z.string().max(100).optional(),
  canton: z.string().max(50).optional(),
  country: z.string().max(50).optional(),
  preferred_language: z.string().max(10).optional(),
  newsletter_subscribed: z.boolean().optional(),
  interests: z.array(z.string()).optional(),
  bio: z.string().max(2000).optional(),
  website: z.string().url('Ungültige URL').optional().or(z.literal('')),
  skills: z.array(z.string()).optional(),
  expertise_areas: z.array(z.string()).optional(),
  service_radius_km: z.number().int().min(0).optional(),
  availability: z.record(z.string(), z.object({
    available: z.boolean(),
    hours: z.string().optional(),
  })).optional(),
})

export type UpdateProfileInput = z.infer<typeof UpdateProfileSchema>
