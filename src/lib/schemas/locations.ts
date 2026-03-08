import { z } from 'zod'
import { swissPostalCodeSchema } from './common'

// --- Create Location ---

export const CreateLocationSchema = z.object({
  name: z.string().min(1, 'Name ist erforderlich').max(200),
  type: z.string().min(1, 'Typ ist erforderlich'),
  description: z.string().max(5000).optional().nullable(),
  address_line1: z.string().max(300).optional().nullable(),
  address_line2: z.string().max(300).optional().nullable(),
  postal_code: swissPostalCodeSchema.optional().nullable(),
  city: z.string().min(1, 'Stadt ist erforderlich').max(200),
  canton: z.string().max(50).optional().nullable(),
  country: z.string().max(100).default('Switzerland'),
  latitude: z.number().min(-90).max(90).optional().nullable(),
  longitude: z.number().min(-180).max(180).optional().nullable(),
  max_capacity: z.number().int().positive().optional().nullable(),
  facilities: z.array(z.string()).default([]),
  contact_name: z.string().max(200).optional().nullable(),
  contact_phone: z.string().max(50).optional().nullable(),
  contact_email: z.string().email('Ungültige E-Mail-Adresse').max(254).optional().nullable(),
}).refine(
  (data) => {
    // Both coordinates must be provided together or not at all
    const hasLat = data.latitude != null
    const hasLng = data.longitude != null
    return hasLat === hasLng
  },
  { message: 'Beide Koordinaten (Breitengrad und Längengrad) müssen angegeben werden', path: ['latitude'] }
)

export type CreateLocationInput = z.infer<typeof CreateLocationSchema>

// --- Update Location ---

export const UpdateLocationSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  description: z.string().max(5000).optional().nullable(),
  address_line1: z.string().max(300).optional().nullable(),
  address_line2: z.string().max(300).optional().nullable(),
  postal_code: swissPostalCodeSchema.optional().nullable(),
  city: z.string().min(1).max(200).optional(),
  canton: z.string().max(50).optional().nullable(),
  country: z.string().max(100).optional(),
  latitude: z.number().min(-90).max(90).optional().nullable(),
  longitude: z.number().min(-180).max(180).optional().nullable(),
  max_capacity: z.number().int().positive().optional().nullable(),
  facilities: z.array(z.string()).optional(),
  accessibility_info: z.record(z.string(), z.unknown()).optional().nullable(),
  contact_name: z.string().max(200).optional().nullable(),
  contact_phone: z.string().max(50).optional().nullable(),
  contact_email: z.string().email('Ungültige E-Mail-Adresse').max(254).optional().nullable(),
})

export type UpdateLocationInput = z.infer<typeof UpdateLocationSchema>

// --- Approve/Reject Location ---

export const ApproveLocationSchema = z.object({
  action: z.enum(['approve', 'reject', 'suspend', 'reinstate']),
  review_notes: z.string().max(5000).optional().nullable(),
  required_changes: z.array(z.string()).optional().default([]),
})

export type ApproveLocationInput = z.infer<typeof ApproveLocationSchema>

// --- Create Location Booking ---

export const CreateLocationBookingSchema = z.object({
  event_type: z.enum(['workshop', 'repair', 'meeting', 'other']),
  event_id: z.string().uuid().optional().nullable(),
  title: z.string().min(1, 'Titel ist erforderlich').max(300),
  description: z.string().max(5000).optional().nullable(),
  start_time: z.string().min(1, 'Startzeit ist erforderlich'),
  end_time: z.string().min(1, 'Endzeit ist erforderlich'),
  expected_attendees: z.number().int().positive().optional().nullable(),
  special_requirements: z.string().max(2000).optional().nullable(),
})

export type CreateLocationBookingInput = z.infer<typeof CreateLocationBookingSchema>
