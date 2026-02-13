import { z } from 'zod'
import { swissPostalCodeSchema } from './common'

export const UpdateProfileSchema = z.object({
  // Basic info
  first_name: z.string().max(100).optional(),
  last_name: z.string().max(100).optional(),
  company_name: z.string().max(200).optional(),

  // Public profile
  avatar_url: z.string().url('Ungültige URL').optional().or(z.literal('')),
  display_name: z.string().min(2, 'Anzeigename muss mindestens 2 Zeichen lang sein').max(50).optional(),
  bio: z.string().max(500, 'Bio darf maximal 500 Zeichen lang sein').optional(),
  profile_visibility: z.enum(['public', 'private']).optional(),

  // Contact
  phone: z.string().optional(),
  mobile: z.string().optional(),

  // Address
  address_line1: z.string().max(200).optional(),
  address_line2: z.string().max(200).optional(),
  postal_code: swissPostalCodeSchema.optional(),
  city: z.string().max(100).optional(),
  canton: z.string().max(50).optional(),
  country: z.string().max(50).optional(),

  // Privacy settings
  show_email: z.boolean().optional(),
  show_phone: z.boolean().optional(),

  // Notification preferences
  email_notifications: z.boolean().optional(),
  sms_notifications: z.boolean().optional(),
  marketplace_updates: z.boolean().optional(),
  workshop_reminders: z.boolean().optional(),

  // Legacy preferences
  preferred_language: z.string().max(10).optional(),
  newsletter_subscribed: z.boolean().optional(),
  interests: z.array(z.string()).optional(),

  // Service provider fields
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
