/**
 * Intake System Zod Schemas
 *
 * Validation schemas for the unified device intake workflow.
 * Types derived from schemas (SSOT).
 */

import { z } from 'zod'
import { paginationSchema } from './common'
import { INTAKE_TIERS } from '@/config/intake-checklist'

// =============================================================================
// INTAKE CREATE — Unified donation + erfassung in one
// =============================================================================

const intakeTierSchema = z.enum([
  INTAKE_TIERS.REFURBISH,
  INTAKE_TIERS.PARTS,
  INTAKE_TIERS.RECYCLE,
])

export const IntakeCreateSchema = z.object({
  // Device info (same fields as erfassung)
  hersteller: z.string().min(1, 'Hersteller erforderlich'),
  produktname: z.string().min(1, 'Produktname erforderlich'),
  kurzbeschreibung: z.string().optional(),
  verkaufspreis: z.number().min(0).optional(),
  zustand: z.string().min(1, 'Zustand erforderlich'),
  hauptkategorie: z.string().optional(),
  unterkategorie: z.string().optional(),
  image: z.string().nullable().optional(),

  // Intake-specific
  intake_tier: intakeTierSchema,

  // Optional donation info
  is_donation: z.boolean().default(false),
  donor_name: z.string().optional(),
  donor_email: z.string().email().optional().or(z.literal('')),
  donor_notes: z.string().optional(),
  // Link to an existing donation row (set when admin opens intake from /admin/donations)
  // — prevents creating a duplicate donation for the same physical drop-off.
  existing_donation_id: z.string().uuid().optional(),
})

// =============================================================================
// INTAKE UPDATE — Edit device details
// =============================================================================

export const IntakeUpdateSchema = z.object({
  hersteller: z.string().min(1).optional(),
  produktname: z.string().min(1).optional(),
  kurzbeschreibung: z.string().optional(),
  verkaufspreis: z.number().min(0).optional(),
  zustand: z.string().optional(),
  hauptkategorie: z.string().optional(),
  unterkategorie: z.string().optional(),
  intake_tier: intakeTierSchema.optional(),
  admin_notes: z.string().optional(),
})

// =============================================================================
// CHECKLIST UPDATE — Toggle checklist items
// =============================================================================

export const ChecklistUpdateSchema = z.object({
  item_id: z.string().min(1, 'Checklist-Item-ID erforderlich'),
  completed: z.boolean(),
  notes: z.string().optional().default(''),
})

// =============================================================================
// PUBLISH — Gate behind checklist
// =============================================================================

export const IntakePublishSchema = z.object({
  price_chf: z.number().min(0, 'Preis erforderlich'),
  title: z.string().optional(),
  description: z.string().optional(),
})

// =============================================================================
// QUERY — List/filter pipeline items
// =============================================================================

export const IntakeQuerySchema = paginationSchema.extend({
  tier: z.string().optional(),
  status: z.string().optional(), // all, in_progress, ready, published
  category: z.string().optional(),
  search: z.string().optional(),
})

// =============================================================================
// DERIVED TYPES
// =============================================================================

export type IntakeCreateData = z.infer<typeof IntakeCreateSchema>
export type IntakeUpdateData = z.infer<typeof IntakeUpdateSchema>
export type ChecklistUpdateData = z.infer<typeof ChecklistUpdateSchema>
export type IntakePublishData = z.infer<typeof IntakePublishSchema>
export type IntakeQueryData = z.infer<typeof IntakeQuerySchema>
