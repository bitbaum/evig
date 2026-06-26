/**
 * Team Profile Validation Schemas
 *
 * Zod schemas for team profile CRUD operations.
 * Types are derived from schemas (SSOT principle).
 */

import { z } from 'zod'
import {
  EMPLOYMENT_TYPE_OPTIONS,
  DEPARTMENT_OPTIONS,
  CONTACT_METHOD_OPTIONS,
  EMERGENCY_RELATION_OPTIONS,
} from '@/config/team'

// =============================================================================
// BASE TEAM PROFILE SCHEMA
// =============================================================================

/**
 * Team profile schema for create/update operations
 */
export const teamProfileSchema = z.object({
  // Employment Information
  position: z.string().max(100).optional().nullable(),
  department: z.string().max(50).optional().nullable(),
  employment_type: z.enum(EMPLOYMENT_TYPE_OPTIONS as [string, ...string[]]).optional().nullable(),
  start_date: z.string().optional().nullable(), // ISO date string
  contract_hours: z.number().int().min(0).max(100).optional().nullable(),

  // Talent Development
  skills: z.array(z.string().max(50)).max(20).optional().default([]),
  interests: z.array(z.string().max(50)).max(10).optional().default([]),
  goals: z.string().max(2000).optional().nullable(),
  strengths: z.string().max(2000).optional().nullable(),
  development_areas: z.string().max(2000).optional().nullable(),

  // Availability & Contact
  availability: z.string().max(500).optional().nullable(),
  working_hours: z.string().max(5000).optional().nullable(),
  preferred_contact: z.enum(CONTACT_METHOD_OPTIONS as [string, ...string[]]).optional().default('email'),
  phone: z.string().max(30).optional().nullable(),

  // Emergency Contact
  emergency_contact_name: z.string().max(100).optional().nullable(),
  emergency_contact_phone: z.string().max(30).optional().nullable(),
  emergency_contact_relation: z.enum(EMERGENCY_RELATION_OPTIONS as [string, ...string[]]).optional().nullable(),

  // HR Notes (super admin only)
  hr_notes: z.string().max(5000).optional().nullable(),

  // Compensation (added migration 080). Both can coexist for hybrid
  // employment (salaried base + paid hourly overtime, etc.).
  hourly_rate_cents: z.number().int().min(0).max(1_000_000).optional().nullable(),
  salary_chf: z.union([z.number(), z.string()]).optional().nullable(),
  salary_effective_date: z.string().optional().nullable(),

  // Employment lifecycle (added migration 080)
  end_date: z.string().optional().nullable(),
  exit_reason: z.string().max(1000).optional().nullable(),

  // Swiss employment metadata (added migration 080)
  ahv_number: z.string().max(50).optional().nullable(),
  canton_tax_code: z.string().max(20).optional().nullable(),

  // Explicit work-state machine (added migration 080)
  work_state: z.enum(['active', 'on_leave', 'unavailable', 'inactive']).optional().default('active'),

  // Status (legacy boolean — new code should prefer work_state)
  is_active: z.boolean().optional().default(true),

  /** Show name/role on public About page (named leads only) */
  show_on_about: z.boolean().optional().default(false),
})

// =============================================================================
// LEAVE PERIODS + COMPENSATION HISTORY (Phase 4)
// =============================================================================

export const leavePeriodKindOptions = ['vacation', 'sick', 'parental', 'unpaid', 'military', 'other'] as const
export type LeavePeriodKind = typeof leavePeriodKindOptions[number]

export const leavePeriodSchema = z.object({
  team_profile_id: z.string().uuid(),
  starts_on: z.string().min(1, 'Startdatum erforderlich'),
  ends_on: z.string().min(1, 'Enddatum erforderlich'),
  kind: z.enum(leavePeriodKindOptions),
  notes: z.string().max(1000).optional().nullable(),
}).refine(d => d.ends_on >= d.starts_on, {
  message: 'Enddatum darf nicht vor dem Startdatum liegen',
  path: ['ends_on'],
})

export type LeavePeriodInput = z.infer<typeof leavePeriodSchema>

export const compensationHistorySchema = z.object({
  team_profile_id: z.string().uuid(),
  hourly_rate_cents: z.number().int().min(0).max(1_000_000).optional().nullable(),
  salary_chf: z.union([z.number(), z.string()]).optional().nullable(),
  effective_date: z.string().min(1, 'Wirksamkeitsdatum erforderlich'),
  reason: z.string().max(500).optional().nullable(),
}).refine(d => d.hourly_rate_cents != null || d.salary_chf != null, {
  message: 'Mindestens ein Betrag (Stundenlohn oder Gehalt) ist erforderlich',
  path: ['hourly_rate_cents'],
})

export type CompensationHistoryInput = z.infer<typeof compensationHistorySchema>

export type TeamProfileInput = z.infer<typeof teamProfileSchema>

// =============================================================================
// CREATE TEAM PROFILE SCHEMA
// =============================================================================

/**
 * Schema for creating a new team profile
 * Requires user_id
 */
export const createTeamProfileSchema = teamProfileSchema.extend({
  user_id: z.string().uuid('Ungültige Benutzer-ID'),
})

export type CreateTeamProfileInput = z.infer<typeof createTeamProfileSchema>

// =============================================================================
// UPDATE TEAM PROFILE SCHEMA
// =============================================================================

/**
 * Schema for updating an existing team profile
 * All fields optional (partial update)
 */
export const updateTeamProfileSchema = teamProfileSchema.partial()

export type UpdateTeamProfileInput = z.infer<typeof updateTeamProfileSchema>

// =============================================================================
// TEAM PROFILE RESPONSE TYPE
// =============================================================================

/**
 * Full team profile type as returned from database
 */
export interface TeamProfile {
  id: string
  user_id: string
  position: string | null
  department: string | null
  employment_type: string | null
  start_date: string | null
  contract_hours: number | null
  skills: string[]
  interests: string[]
  goals: string | null
  strengths: string | null
  development_areas: string | null
  availability: string | null
  working_hours: string | null
  preferred_contact: string
  phone: string | null
  emergency_contact_name: string | null
  emergency_contact_phone: string | null
  emergency_contact_relation: string | null
  hr_notes: string | null
  current_focus: string | null
  current_focus_updated_at: string | null
  // Phase 4 — compensation + employment lifecycle (migration 080)
  hourly_rate_cents: number | null
  salary_chf: string | number | null
  salary_effective_date: string | null
  end_date: string | null
  exit_reason: string | null
  ahv_number: string | null
  canton_tax_code: string | null
  work_state: string
  is_active: boolean
  show_on_about: boolean
  created_at: string
  updated_at: string
}

/**
 * Team profile with user info (joined query result)
 */
export interface TeamProfileWithUser extends TeamProfile {
  user_name: string | null
  user_email: string
}

// =============================================================================
// FILTER SCHEMAS
// =============================================================================

/**
 * Query parameters for filtering team profiles
 */
export const teamProfileFilterSchema = z.object({
  department: z.string().optional(),
  employment_type: z.string().optional(),
  is_active: z.enum(['true', 'false', 'all']).optional().default('all'),
  search: z.string().max(100).optional(),
})

export type TeamProfileFilter = z.infer<typeof teamProfileFilterSchema>

// =============================================================================
// VALIDATION HELPERS
// =============================================================================

/**
 * Validate team profile input
 */
export function validateTeamProfile(data: unknown) {
  return teamProfileSchema.safeParse(data)
}

/**
 * Validate create team profile input
 */
export function validateCreateTeamProfile(data: unknown) {
  return createTeamProfileSchema.safeParse(data)
}

/**
 * Validate update team profile input
 */
export function validateUpdateTeamProfile(data: unknown) {
  return updateTeamProfileSchema.safeParse(data)
}
