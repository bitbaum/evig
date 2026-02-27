import { z } from 'zod';
import {
  getCategoryIds,
  getSkillIds,
  URGENCY_LEVELS,
  SERVICE_TYPES,
  SWISS_CANTONS,
  BUDGET_TIERS,
} from '@/config/it-hilfe';

/**
 * IT-Hilfe Request Schema
 * SSOT for validating IT help requests
 */
export const itHilfeRequestSchema = z.object({
  categoryId: z.enum(getCategoryIds() as [string, ...string[]], {
    message: 'Ungültige Gerätekategorie',
  }),
  title: z
    .string()
    .min(10, 'Titel muss mindestens 10 Zeichen lang sein')
    .max(200, 'Titel darf maximal 200 Zeichen lang sein'),
  description: z
    .string()
    .min(20, 'Beschreibung muss mindestens 20 Zeichen lang sein')
    .max(5000, 'Beschreibung darf maximal 5000 Zeichen lang sein'),
  urgency: z.enum(
    URGENCY_LEVELS.map((u) => u.id) as [string, ...string[]],
    {
      message: 'Ungültige Dringlichkeit',
    }
  ),
  postalCode: z
    .string()
    .regex(/^\d{4}$/, 'Postleitzahl muss 4 Ziffern haben'),
  city: z
    .string()
    .min(2, 'Stadt muss mindestens 2 Zeichen lang sein')
    .max(100, 'Stadt darf maximal 100 Zeichen lang sein'),
  canton: z.enum(SWISS_CANTONS, {
    message: 'Ungültiger Kanton',
  }),
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
});

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
