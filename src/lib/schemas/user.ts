import { z } from 'zod'
import { swissPostalCodeSchema } from './common'

// NOTE: empty profile columns come back from GET /api/user/profile as `null`, so
// every optional field must also accept `null` (= "empty/cleared") — otherwise
// loading a sparse profile and clicking Save fails validation on every null field
// ("Validierungsfehler"). `.nullish()` = nullable + optional.
export const UpdateProfileSchema = z.object({
  // Basic info
  first_name: z.string().max(100).nullish(),
  last_name: z.string().max(100).nullish(),
  company_name: z.string().max(200).nullish(),

  // Public profile
  avatar_url: z.string().url('Ungültige URL').or(z.literal('')).nullish(),
  display_name: z.string().min(2, 'Anzeigename muss mindestens 2 Zeichen lang sein').max(50).or(z.literal('')).nullish(),
  bio: z.string().max(500, 'Bio darf maximal 500 Zeichen lang sein').nullish(),
  profile_visibility: z.enum(['public', 'private']).nullish(),

  // Contact
  phone: z.string().nullish(),
  mobile: z.string().nullish(),

  // Address
  address_line1: z.string().max(200).nullish(),
  address_line2: z.string().max(200).nullish(),
  postal_code: swissPostalCodeSchema.or(z.literal('')).nullish(),
  city: z.string().max(100).nullish(),
  canton: z.string().max(50).nullish(),
  country: z.string().max(50).nullish(),

  // Privacy settings
  show_email: z.boolean().nullish(),
  show_phone: z.boolean().nullish(),

  // Notification preferences
  email_notifications: z.boolean().nullish(),
  sms_notifications: z.boolean().nullish(),
  marketplace_updates: z.boolean().nullish(),
  workshop_reminders: z.boolean().nullish(),

  // Legacy preferences
  preferred_language: z.string().max(10).nullish(),
  newsletter_subscribed: z.boolean().nullish(),
  interests: z.array(z.string()).nullish(),

  // Service provider fields
  website: z.string().url('Ungültige URL').or(z.literal('')).nullish(),
  skills: z.array(z.string()).nullish(),
  expertise_areas: z.array(z.string()).nullish(),
  service_radius_km: z.number().int().min(0).nullish(),
  availability: z.record(z.string(), z.object({
    available: z.boolean(),
    hours: z.string().optional(),
  })).nullish(),
})

export type UpdateProfileInput = z.infer<typeof UpdateProfileSchema>
