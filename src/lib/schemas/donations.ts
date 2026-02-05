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
  notes: z.string().max(2000).optional().nullable(),
})

/**
 * Device donation schema
 */
export const CreateDeviceDonationSchema = z.object({
  donation_type: z.literal(DONATION_TYPES.DEVICE),

  // Device details (required)
  device_category: z.enum(deviceCategories, {
    message: 'Bitte wählen Sie eine Gerätekategorie',
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
  notes: z.string().max(2000).optional().nullable(),
})

/**
 * Discriminated union for creating any donation type
 */
export const CreateDonationSchema = z.discriminatedUnion('donation_type', [
  CreateMonetaryDonationSchema,
  CreateDeviceDonationSchema,
])

/**
 * Schema for updating a donation
 */
export const UpdateDonationSchema = z.object({
  // Status updates
  status: z.enum(donationStatuses).optional(),
  thank_you_sent: z.boolean().optional(),
  receipt_sent: z.boolean().optional(),

  // Notes
  notes: z.string().max(2000).optional().nullable(),

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
