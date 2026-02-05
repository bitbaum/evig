/**
 * Activity Stream Zod Schemas
 *
 * Validation schemas derived from config (SSOT)
 * Following dev guide: docs/development/DEV_GUIDE.md
 *
 * Created: 2026-02-05
 */

import { z } from 'zod';
import {
  ACTIVITY_UPDATE_TYPE_OPTIONS,
  VISIBILITY_OPTIONS,
  HELP_REQUEST_URGENCY_OPTIONS,
  HELP_REQUEST_STATUS_OPTIONS,
  ACTIVITY_CATEGORY_OPTIONS,
} from '@/config/activity';

/**
 * Current focus update schema
 */
export const updateCurrentFocusSchema = z.object({
  current_focus: z
    .string()
    .max(200, 'Fokus zu lang (max 200 Zeichen)')
    .nullable(),
});

/**
 * Activity update creation schema
 */
export const createActivityUpdateSchema = z.object({
  update_type: z.enum(ACTIVITY_UPDATE_TYPE_OPTIONS).default('accomplishment'),
  title: z
    .string()
    .min(1, 'Titel erforderlich')
    .max(200, 'Titel zu lang (max 200 Zeichen)'),
  description: z
    .string()
    .max(2000, 'Beschreibung zu lang')
    .optional()
    .nullable(),
  category: z.enum(ACTIVITY_CATEGORY_OPTIONS).optional().nullable(),
  visibility: z.enum(VISIBILITY_OPTIONS).default('team'),
  occurred_at: z.string().datetime().optional(),
});

/**
 * Activity update modification schema
 */
export const updateActivityUpdateSchema = createActivityUpdateSchema.partial();

/**
 * Help request creation schema
 */
export const createHelpRequestSchema = z.object({
  title: z
    .string()
    .min(1, 'Titel erforderlich')
    .max(200, 'Titel zu lang (max 200 Zeichen)'),
  description: z
    .string()
    .max(2000, 'Beschreibung zu lang')
    .optional()
    .nullable(),
  category: z.enum(ACTIVITY_CATEGORY_OPTIONS).optional().nullable(),
  urgency: z.enum(HELP_REQUEST_URGENCY_OPTIONS).default('normal'),
  requested_user_id: z.string().uuid().optional().nullable(), // null = broadcast
});

/**
 * Help request update schema
 */
export const updateHelpRequestSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(2000).optional().nullable(),
  category: z.enum(ACTIVITY_CATEGORY_OPTIONS).optional().nullable(),
  urgency: z.enum(HELP_REQUEST_URGENCY_OPTIONS).optional(),
  status: z.enum(HELP_REQUEST_STATUS_OPTIONS).optional(),
});

/**
 * Help request resolution schema
 */
export const resolveHelpRequestSchema = z.object({
  resolution_notes: z
    .string()
    .max(1000, 'Notizen zu lang')
    .optional()
    .nullable(),
});

/**
 * Activity stream filter schema
 */
export const activityStreamFilterSchema = z.object({
  user_id: z.string().uuid().optional(),
  source_type: z.string().optional(),
  category: z.enum(ACTIVITY_CATEGORY_OPTIONS).optional(),
  since: z.string().datetime().optional(),
  until: z.string().datetime().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50),
  offset: z.coerce.number().int().min(0).default(0),
});

/**
 * Help request filter schema
 */
export const helpRequestFilterSchema = z.object({
  status: z.enum(HELP_REQUEST_STATUS_OPTIONS).optional(),
  urgency: z.enum(HELP_REQUEST_URGENCY_OPTIONS).optional(),
  category: z.enum(ACTIVITY_CATEGORY_OPTIONS).optional(),
  requester_id: z.string().uuid().optional(),
  requested_user_id: z.string().uuid().optional(),
  is_broadcast: z.coerce.boolean().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50),
  offset: z.coerce.number().int().min(0).default(0),
});

/**
 * Digest filter schema
 */
export const digestFilterSchema = z.object({
  since: z.string().datetime().optional(),
  until: z.string().datetime().optional(),
  department: z.string().optional(),
});

// Derived types from schemas
export type UpdateCurrentFocusInput = z.infer<typeof updateCurrentFocusSchema>;
export type CreateActivityUpdateInput = z.infer<typeof createActivityUpdateSchema>;
export type UpdateActivityUpdateInput = z.infer<typeof updateActivityUpdateSchema>;
export type CreateHelpRequestInput = z.infer<typeof createHelpRequestSchema>;
export type UpdateHelpRequestInput = z.infer<typeof updateHelpRequestSchema>;
export type ResolveHelpRequestInput = z.infer<typeof resolveHelpRequestSchema>;
export type ActivityStreamFilter = z.infer<typeof activityStreamFilterSchema>;
export type HelpRequestFilter = z.infer<typeof helpRequestFilterSchema>;
export type DigestFilter = z.infer<typeof digestFilterSchema>;

// Validation helpers
export function validateCurrentFocus(data: unknown) {
  return updateCurrentFocusSchema.safeParse(data);
}

export function validateCreateActivityUpdate(data: unknown) {
  return createActivityUpdateSchema.safeParse(data);
}

export function validateUpdateActivityUpdate(data: unknown) {
  return updateActivityUpdateSchema.safeParse(data);
}

export function validateCreateHelpRequest(data: unknown) {
  return createHelpRequestSchema.safeParse(data);
}

export function validateUpdateHelpRequest(data: unknown) {
  return updateHelpRequestSchema.safeParse(data);
}

export function validateResolveHelpRequest(data: unknown) {
  return resolveHelpRequestSchema.safeParse(data);
}

export function validateActivityStreamFilter(data: unknown) {
  return activityStreamFilterSchema.safeParse(data);
}

export function validateHelpRequestFilter(data: unknown) {
  return helpRequestFilterSchema.safeParse(data);
}

export function validateDigestFilter(data: unknown) {
  return digestFilterSchema.safeParse(data);
}
