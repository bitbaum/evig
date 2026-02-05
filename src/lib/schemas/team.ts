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
  working_hours: z.string().max(200).optional().nullable(),
  preferred_contact: z.enum(CONTACT_METHOD_OPTIONS as [string, ...string[]]).optional().default('email'),
  phone: z.string().max(30).optional().nullable(),

  // Emergency Contact
  emergency_contact_name: z.string().max(100).optional().nullable(),
  emergency_contact_phone: z.string().max(30).optional().nullable(),
  emergency_contact_relation: z.enum(EMERGENCY_RELATION_OPTIONS as [string, ...string[]]).optional().nullable(),

  // HR Notes (super admin only)
  hr_notes: z.string().max(5000).optional().nullable(),

  // Status
  is_active: z.boolean().optional().default(true),
})

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
  is_active: boolean
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
