/**
 * Intake System Zod Schemas
 *
 * Validation schemas for the unified device intake workflow.
 * Types derived from schemas (SSOT).
 */

import { z } from 'zod'
import { paginationSchema } from './common'
import { INTAKE_TIERS, CHECKLIST_RESULTS } from '@/config/intake-checklist'
import {
  CAPTURE_DESTINATIONS,
  CAPTURE_DESTINATION_VALUES,
} from '@/config/intake-workflow'
import { ERROR_MESSAGES } from '@/config/error-messages'
import { erfassungPayloadSchema } from './erfassung'

// =============================================================================
// INTAKE CREATE — Unified donation + erfassung in one
// =============================================================================

const intakeTierSchema = z.enum([
  INTAKE_TIERS.REFURBISH,
  INTAKE_TIERS.PARTS,
  INTAKE_TIERS.RECYCLE,
])

export const IntakeCreateSchema = erfassungPayloadSchema.omit({ action: true, publish: true }).extend({
  // Intake can be created before a price is known. Every other product field
  // comes from erfassungPayloadSchema so the two historical entry doors can
  // no longer drift.
  verkaufspreis: z.number().min(0).optional(),
  // One outcome decision after the product data has been reviewed. The
  // legacy intake_tier stays accepted so labels/bookmarks and older clients
  // keep working during the route consolidation.
  destination: z.enum(CAPTURE_DESTINATION_VALUES).optional(),
  intake_tier: intakeTierSchema.optional(),
  qc_skip_reason: z.string().trim().max(500).optional(),

  // Optional donation info
  is_donation: z.boolean().default(false),
  donor_name: z.string().optional(),
  donor_email: z.string().email().optional().or(z.literal('')),
  donor_notes: z.string().optional(),
  // Link to an existing donation row (set when admin opens intake from /admin/donations)
  // — prevents creating a duplicate donation for the same physical drop-off.
  existing_donation_id: z.string().uuid().optional(),
})
  .refine(data => Boolean(data.destination || data.intake_tier), {
    message: 'Ziel für das Produkt erforderlich',
    path: ['destination'],
  })
  .refine(
    data => data.destination !== CAPTURE_DESTINATIONS.SHOP_UNTESTED ||
      Boolean(data.qc_skip_reason && data.qc_skip_reason.length >= 10),
    {
      message: 'Für eine Veröffentlichung ohne Prüfung ist eine Begründung mit mindestens 10 Zeichen erforderlich',
      path: ['qc_skip_reason'],
    },
  )
  .refine(
    data => data.destination !== CAPTURE_DESTINATIONS.SHOP_UNTESTED ||
      Boolean(data.verkaufspreis && data.verkaufspreis > 0),
    {
      message: 'Für eine direkte Veröffentlichung ist ein Verkaufspreis grösser als null erforderlich',
      path: ['verkaufspreis'],
    },
  )

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
// CHECKLIST UPDATE — Set a verdict on a checklist item
// =============================================================================

export const ChecklistUpdateSchema = z
  .object({
    item_id: z.string().min(1, 'Checklist-Item-ID erforderlich'),
    /** pass | fail | na; null resets the item to open. */
    result: z
      .enum([CHECKLIST_RESULTS.PASS, CHECKLIST_RESULTS.FAIL, CHECKLIST_RESULTS.NA])
      .nullable(),
    notes: z.string().optional().default(''),
    /** Explicit, audited exception for a solo shift. Never inferred from notes. */
    second_person_override: z.boolean().optional().default(false),
  })
  .refine(
    data => data.result !== CHECKLIST_RESULTS.FAIL || data.notes.trim().length > 0,
    { message: ERROR_MESSAGES.INTAKE_FAIL_NOTES_REQUIRED, path: ['notes'] },
  )
  .refine(
    data => !data.second_person_override || data.notes.trim().length >= 10,
    { message: ERROR_MESSAGES.INTAKE_SECOND_PERSON_OVERRIDE_REASON_REQUIRED, path: ['notes'] },
  )

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
