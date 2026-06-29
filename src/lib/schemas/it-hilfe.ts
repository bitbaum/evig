import { z } from 'zod';
import {
  getCategoryIds,
  getSkillIds,
  URGENCY_LEVELS,
  SERVICE_TYPES,
  SWISS_CANTONS,
  BUDGET_TIERS,
  REQUEST_STATUSES,
  OFFER_MIN_CHARS,
  OFFER_MAX_CHARS,
} from '@/config/it-hilfe';
import { paginationSchema } from './common';

/**
 * IT-Hilfe Request Schema
 * SSOT for validating IT help requests.
 *
 * Field-shape mirrors src/db/schema/itHilfe.ts (Drizzle). Any field that
 * the create route at /api/it-hilfe/requests writes to the DB MUST be
 * declared here so it goes through Zod — never reach into the raw body.
 */
export const itHilfeRequestSchema = z.object({
  categoryId: z.enum(getCategoryIds() as [string, ...string[]], {
    message: 'Ungültige Gerätekategorie',
  }).optional(),
  /** Optional device brand string. Free text — max length mirrors DB. */
  deviceBrand: z.string().max(100, 'Marke darf maximal 100 Zeichen lang sein').optional().nullable(),
  /** Optional device model string. */
  deviceModel: z.string().max(200, 'Modell darf maximal 200 Zeichen lang sein').optional().nullable(),
  title: z
    .string()
    .min(5, 'Titel muss mindestens 5 Zeichen lang sein')
    .max(200, 'Titel darf maximal 200 Zeichen lang sein'),
  description: z
    .string()
    .max(5000, 'Beschreibung darf maximal 5000 Zeichen lang sein')
    .optional()
    .nullable(),
  urgency: z.enum(
    URGENCY_LEVELS.map((u) => u.id) as [string, ...string[]],
    {
      message: 'Ungültige Dringlichkeit',
    }
  ).optional(),
  postalCode: z
    .string()
    .regex(/^\d{4}$/, 'Postleitzahl muss 4 Ziffern haben')
    .optional()
    .nullable(),
  city: z
    .string()
    .min(2, 'Stadt muss mindestens 2 Zeichen lang sein')
    .max(100, 'Stadt darf maximal 100 Zeichen lang sein')
    .optional()
    .nullable(),
  canton: z.enum(SWISS_CANTONS, {
    message: 'Ungültiger Kanton',
  }).optional().nullable(),
  skillsNeeded: z
    .array(z.enum(getSkillIds() as [string, ...string[]]))
    .max(10, 'Maximal 10 Fähigkeiten erlaubt')
    .optional(),
  maxBudgetCents: z
    .number()
    .int('Budget muss eine ganze Zahl sein')
    .min(0, 'Budget kann nicht negativ sein')
    .max(100000, 'Budget darf maximal CHF 1000 sein')
    .nullable()
    .optional(),
  budgetTier: z
    .enum(
      BUDGET_TIERS.map((t) => t.id) as [string, ...string[]],
      {
        message: 'Ungültige Preisstufe',
      }
    )
    .optional(),
  serviceType: z
    .enum(
      SERVICE_TYPES.map((s) => s.id) as [string, ...string[]],
      {
        message: 'Ungültiger Service-Typ',
      }
    )
    .optional(),
  /** Up to 10 image URLs. URLs validated as well-formed http(s). */
  imageUrls: z.array(z.string().url('Ungültige Bild-URL')).max(10, 'Maximal 10 Bilder erlaubt').optional(),
  preferredTechnicianId: z.string().uuid('Ungültige Techniker-ID').optional().nullable(),
  /** AI-generated diagnosis text — optional companion to description. */
  aiDiagnosis: z.string().max(5000, 'AI-Diagnose darf maximal 5000 Zeichen lang sein').optional().nullable(),
  // For anonymous submissions: a logged-out visitor supplies their email
  // and the backend either finds their account or provisions a new one.
  // Required when no session is present; the route enforces this since
  // schema can't see auth state.
  submitterEmail: z
    .string()
    .email('Ungültige E-Mail-Adresse')
    .optional(),
});

// ============================================================================
// Offer Schemas
// ============================================================================

export const CreateOfferSchema = z.object({
  message: z
    .string()
    .min(OFFER_MIN_CHARS, `Nachricht muss mindestens ${OFFER_MIN_CHARS} Zeichen lang sein`)
    .max(OFFER_MAX_CHARS, `Nachricht darf maximal ${OFFER_MAX_CHARS} Zeichen lang sein`),
  estimatedTime: z.string().max(200).optional().nullable(),
  proposedCompensation: z.string().max(200).optional().nullable(),
  proposedAmountCents: z.number().int().nonnegative().max(100_000_00).optional().nullable(),
  relevantSkills: z
    .array(z.enum(getSkillIds() as [string, ...string[]]))
    .default([]),
});

export type CreateOfferInput = z.infer<typeof CreateOfferSchema>;

// ============================================================================
// Shared constants for schemas below
// ============================================================================

const requestStatusIds = REQUEST_STATUSES.map(s => s.id) as [string, ...string[]];
const urgencyIds = URGENCY_LEVELS.map(u => u.id) as [string, ...string[]];
const categoryIds = getCategoryIds() as [string, ...string[]];
const skillIds = getSkillIds() as [string, ...string[]];
const serviceTypeIds = SERVICE_TYPES.map((s) => s.id) as [string, ...string[]];

// ============================================================================
// User Update Schema
// ============================================================================

export const UpdateITHilfeRequestSchema = z.object({
  categoryId: z.enum(categoryIds, {
    message: 'Ungültige Gerätekategorie',
  }).optional(),
  deviceBrand: z.string().max(200).optional().nullable(),
  deviceModel: z.string().max(200).optional().nullable(),
  title: z.string().min(10).max(200).optional(),
  description: z.string().max(5000).optional(),
  urgency: z.enum(urgencyIds, {
    message: 'Ungültige Dringlichkeitsstufe',
  }).optional(),
  budgetAmountCents: z.number().int().min(0).max(100000).nullable().optional(),
  maxBudgetCents: z.number().int().min(0).max(100000).nullable().optional(),
  postalCode: z.string().regex(/^\d{4}$/, 'Ungültige Postleitzahl (4 Ziffern erforderlich)').optional(),
  city: z.string().max(100).optional(),
  canton: z.string().max(2).optional(),
  serviceType: z.enum(serviceTypeIds, {
    message: 'Ungültiger Service-Typ',
  }).optional(),
  skillsNeeded: z
    .array(z.enum(skillIds))
    .max(10)
    .optional(),
  imageUrls: z.array(z.string().url()).max(10).optional(),
  status: z.enum(requestStatusIds).optional(),
});

export type UpdateITHilfeRequestInput = z.infer<typeof UpdateITHilfeRequestSchema>;

// ============================================================================
// Admin Schemas
// ============================================================================

export const AdminITHilfeQuerySchema = z.object({
  status: z.enum(['all', ...requestStatusIds] as [string, ...string[]]).default('all'),
  category: z.enum(['all', ...categoryIds] as [string, ...string[]]).default('all'),
  urgency: z.enum(['all', ...urgencyIds] as [string, ...string[]]).default('all'),
  canton: z.string().optional(),
  search: z.string().max(200).optional(),
}).merge(paginationSchema);

export type AdminITHilfeQuery = z.infer<typeof AdminITHilfeQuerySchema>;

export const AdminEditRequestSchema = z.object({
  title: z.string().min(10).max(200).optional(),
  description: z.string().min(20).max(5000).optional(),
  status: z.enum(requestStatusIds).optional(),
  urgency: z.enum(urgencyIds).optional(),
  admin_notes: z.string().max(5000).optional().nullable(),
});

export type AdminEditRequestInput = z.infer<typeof AdminEditRequestSchema>;

export const AdminHelperActionSchema = z.object({
  action: z.enum(['verify', 'suspend', 'reactivate'] as const),
  admin_notes: z.string().max(2000).optional().nullable(),
});

export type AdminHelperActionInput = z.infer<typeof AdminHelperActionSchema>;

export const AdminHelpersQuerySchema = z.object({
  status: z.enum(['all', 'active', 'verified', 'suspended'] as const).default('all'),
  canton: z.string().optional(),
  skill: z.string().optional(),
}).merge(paginationSchema);

export type AdminHelpersQuery = z.infer<typeof AdminHelpersQuerySchema>;

/**
 * Helper function to validate data and return typed result
 */
export function validateAndRespond<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; errors: string[] } {
  const result = schema.safeParse(data);

  if (!result.success) {
    return {
      success: false,
      errors: result.error.issues.map((e) => `${e.path.join('.')}: ${e.message}`),
    };
  }

  return { success: true, data: result.data };
}

/**
 * Helper to format validation errors for user display
 */
export function formatValidationErrors(errors: z.ZodError): string {
  return errors.issues.map((err) => err.message).join(', ');
}
