/**
 * Donation Zod schemas
 *
 * Validation schemas derived from config (SSOT)
 * Types derived from schemas
 */

import { z } from 'zod'
import {
  DONATION_TYPES,
  DEVICE_CATEGORIES,
  DEVICE_CONDITIONS,
  PAYMENT_METHODS,
  DONATION_STATUSES,
  DROPOFF_DEVICES_MIN_CHARS,
  DROPOFF_DEVICES_MAX_CHARS,
  DONATION_NOTES_MAX_CHARS,
} from '@/config/donations'

// =============================================================================
// DERIVED ENUMS FROM CONFIG (SSOT)
// =============================================================================

const donationTypes = Object.values(DONATION_TYPES) as [string, ...string[]]
const deviceCategories = Object.values(DEVICE_CATEGORIES) as [string, ...string[]]
const deviceConditions = Object.values(DEVICE_CONDITIONS) as [string, ...string[]]
const paymentMethods = Object.values(PAYMENT_METHODS) as [string, ...string[]]
const donationStatuses = Object.values(DONATION_STATUSES) as [string, ...string[]]

// =============================================================================
// BASE SCHEMAS
// =============================================================================

/**
 * Monetary donation schema
 */
export const CreateMonetaryDonationSchema = z.object({
  donation_type: z.literal(DONATION_TYPES.MONETARY),

  // Required for monetary
  amount_cents: z.number()
    .int('Betrag muss eine ganze Zahl sein')
    .min(100, 'Mindestbetrag ist CHF 1.00'),
  currency: z.string().default('CHF'),
  payment_method: z.enum(paymentMethods).optional().nullable(),
  payment_reference: z.string().max(200).optional().nullable(),
  payment_date: z.string().datetime().optional().nullable(),

  // Optional recurring
  is_recurring: z.boolean().default(false),
  recurring_frequency: z.enum(['monthly', 'quarterly', 'yearly']).optional().nullable(),

  // User link or anonymous
  user_id: z.string().uuid().optional().nullable(),
  donor_name: z.string().max(200).optional().nullable(),
  donor_email: z.string().email().optional().nullable(),
  donor_address: z.string().max(500).optional().nullable(),

  // Receipt
  receipt_requested: z.boolean().default(false),

  // Admin notes
  notes: z.string().max(DONATION_NOTES_MAX_CHARS).optional().nullable(),
})

/**
 * Device donation schema
 */
export const CreateDeviceDonationSchema = z.object({
  donation_type: z.literal(DONATION_TYPES.DEVICE),

  // Device details (required)
  device_category: z.enum(deviceCategories, {
    message: 'Bitte wähle eine Gerätekategorie',
  }),

  // Optional device details
  device_description: z.string().max(2000).optional().nullable(),
  device_brand: z.string().max(100).optional().nullable(),
  device_model: z.string().max(100).optional().nullable(),
  device_condition: z.enum(deviceConditions).optional().nullable(),
  device_age_years: z.number().int().min(0).max(50).optional().nullable(),
  estimated_value_cents: z.number().int().min(0).optional().nullable(),

  // User link or anonymous
  user_id: z.string().uuid().optional().nullable(),
  donor_name: z.string().max(200).optional().nullable(),
  donor_email: z.string().email().optional().nullable(),
  donor_address: z.string().max(500).optional().nullable(),

  // Receipt
  receipt_requested: z.boolean().default(false),

  // Admin notes
  notes: z.string().max(DONATION_NOTES_MAX_CHARS).optional().nullable(),
})

/**
 * Discriminated union for creating any donation type
 */
export const CreateDonationSchema = z.discriminatedUnion('donation_type', [
  CreateMonetaryDonationSchema,
  CreateDeviceDonationSchema,
])

/**
 * Public donation drop-off announcement (form on /get-involved/donate).
 *
 * Different shape from CreateDeviceDonationSchema on purpose: this is an
 * *intent* form (donor says "I plan to bring you devices"), not the
 * admin-side record of a physically-received donation. We collect just
 * enough for staff to follow up — fewer required fields = higher form
 * completion vs. the full structured device-category-and-condition flow.
 *
 * preferredDate is an ISO date string (YYYY-MM-DD), validated loosely
 * because we don't gate scheduling on it — staff coordinates via email.
 */
export const DonationDropoffSchema = z.object({
  name: z.string().trim().min(2, 'Name muss mindestens 2 Zeichen haben').max(200),
  email: z.string().email('Ungültige E-Mail-Adresse'),
  phone: z.string().trim().min(3).max(30).optional(),
  preferredDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Datum im Format YYYY-MM-DD').optional(),
  devices: z
    .string()
    .trim()
    .min(DROPOFF_DEVICES_MIN_CHARS, `Bitte beschreibe, welche Geräte du bringen möchtest (mind. ${DROPOFF_DEVICES_MIN_CHARS} Zeichen)`)
    .max(DROPOFF_DEVICES_MAX_CHARS),
  notes: z.string().trim().max(DONATION_NOTES_MAX_CHARS).optional(),
})

export type DonationDropoffInput = z.infer<typeof DonationDropoffSchema>

/**
 * Schema for updating a donation
 */
export const UpdateDonationSchema = z.object({
  // Status updates
  status: z.enum(donationStatuses).optional(),
  thank_you_sent: z.boolean().optional(),
  receipt_sent: z.boolean().optional(),

  // Notes
  notes: z.string().max(DONATION_NOTES_MAX_CHARS).optional().nullable(),

  // For device donations - allow updating estimated value
  estimated_value_cents: z.number().int().min(0).optional().nullable(),

  // User link updates
  user_id: z.string().uuid().optional().nullable(),
})

/**
 * Schema for querying donations
 */
export const GetDonationsQuerySchema = z.object({
  // Filters
  donation_type: z.enum(donationTypes).optional(),
  status: z.enum(donationStatuses).optional(),
  user_id: z.string().uuid().optional(),

  // Date range
  from_date: z.string().datetime().optional(),
  to_date: z.string().datetime().optional(),

  // Pagination
  limit: z.coerce.number().int().min(1).max(100).default(20),
  offset: z.coerce.number().int().min(0).default(0),

  // Sorting
  sort_by: z.enum(['created_at', 'amount_cents', 'status']).default('created_at'),
  sort_order: z.enum(['asc', 'desc']).default('desc'),
})

// =============================================================================
// DERIVED TYPES
// =============================================================================

export type CreateMonetaryDonationInput = z.infer<typeof CreateMonetaryDonationSchema>
export type CreateDeviceDonationInput = z.infer<typeof CreateDeviceDonationSchema>
export type CreateDonationInput = z.infer<typeof CreateDonationSchema>
export type UpdateDonationInput = z.infer<typeof UpdateDonationSchema>
export type GetDonationsQuery = z.infer<typeof GetDonationsQuerySchema>
