import { z } from 'zod'
import { TEAM_ROLES, TEAM_ACCENT_OPTIONS, GOAL_STATUS_OPTIONS } from '@/config/teams'

// Enums as tuples for z.enum (derived from config — never hand-listed)
const roles = Object.values(TEAM_ROLES) as [string, ...string[]]
const accents = TEAM_ACCENT_OPTIONS as unknown as [string, ...string[]]
const goalStatuses = GOAL_STATUS_OPTIONS as unknown as [string, ...string[]]

// ---- Team create / update ---------------------------------------------------

export const createTeamSchema = z.object({
  name: z.string().min(1, 'Name erforderlich').max(120, 'Name zu lang (max 120 Zeichen)'),
  // Optional — derived from name (ASCII) when omitted. Must be URL-safe.
  slug: z
    .string()
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug: nur Kleinbuchstaben, Zahlen und Bindestriche')
    .max(60)
    .optional(),
  purpose: z.string().max(1000, 'Beschreibung zu lang').optional().nullable(),
  mail_folders: z.array(z.string().max(200)).max(30).optional().default([]),
  accent: z.enum(accents).default('info'),
  meeting_cadence: z.string().max(120).optional().nullable(),
  is_active: z.boolean().optional().default(true),
  sort_order: z.number().int().min(0).max(9999).optional().default(0),
})

export const updateTeamSchema = createTeamSchema.partial()

export const updateTeamFocusSchema = z.object({
  current_focus: z.string().max(200, 'Fokus zu lang (max 200 Zeichen)').nullable(),
})

export type CreateTeamInput = z.infer<typeof createTeamSchema>
export type UpdateTeamInput = z.infer<typeof updateTeamSchema>

// ---- Membership -------------------------------------------------------------

export const addMembershipSchema = z.object({
  user_id: z.string().uuid('Ungültige Benutzer-ID'),
  role: z.enum(roles).default('member'),
  // When set, this is a TRANSFER: the person's live membership in from_team_id
  // is closed (left_at) before they're added to the team in the URL.
  from_team_id: z.string().uuid().optional().nullable(),
})

export const changeRoleSchema = z.object({
  role: z.enum(roles),
})

/** Move a person from one team to another (person-side action). from_team_id
 *  optional — when set, that live membership is closed (left_at) first. */
export const transferMembershipSchema = z.object({
  from_team_id: z.string().uuid().optional().nullable(),
  to_team_id: z.string().uuid('Ungültige Team-ID'),
  role: z.enum(roles).default('member'),
})

export type AddMembershipInput = z.infer<typeof addMembershipSchema>
export type ChangeRoleInput = z.infer<typeof changeRoleSchema>
export type TransferMembershipInput = z.infer<typeof transferMembershipSchema>

// ---- Goals ------------------------------------------------------------------

export const createGoalSchema = z.object({
  title: z.string().min(1, 'Titel erforderlich').max(200, 'Titel zu lang'),
  detail: z.string().max(1000, 'Beschreibung zu lang').optional().nullable(),
  status: z.enum(goalStatuses).default('open'),
  target_label: z.string().max(40, 'Zeithorizont zu lang').optional().nullable(),
  sort_order: z.number().int().min(0).max(9999).optional().default(0),
})

export const updateGoalSchema = createGoalSchema.partial()

export type CreateGoalInput = z.infer<typeof createGoalSchema>
export type UpdateGoalInput = z.infer<typeof updateGoalSchema>

// ---- Metrics ----------------------------------------------------------------
// Values arrive as numbers from the form; stored NUMERIC (string in JS).

export const createMetricSchema = z.object({
  label: z.string().min(1, 'Bezeichnung erforderlich').max(120, 'Bezeichnung zu lang'),
  current_value: z.number().finite().optional().nullable(),
  target_value: z.number().finite().optional().nullable(),
  unit: z.string().max(20, 'Einheit zu lang').optional().nullable(),
  higher_is_better: z.boolean().optional().default(true),
  sort_order: z.number().int().min(0).max(9999).optional().default(0),
})

export const updateMetricSchema = createMetricSchema.partial()

export type CreateMetricInput = z.infer<typeof createMetricSchema>
export type UpdateMetricInput = z.infer<typeof updateMetricSchema>

// ---- Coordination row shapes ------------------------------------------------

export interface TeamGoalRow {
  id: string
  team_id: string
  title: string
  detail: string | null
  status: string
  target_label: string | null
  sort_order: number
  created_at: string
  updated_at: string
}

export interface TeamMetricRow {
  id: string
  team_id: string
  label: string
  current_value: string | null
  target_value: string | null
  unit: string | null
  higher_is_better: boolean
  sort_order: number
  updated_at: string
}

// ---- Row shapes (SSOT for data returned to pages) ---------------------------

export interface TeamListItem {
  id: string
  slug: string
  name: string
  purpose: string | null
  mail_folders: string[]
  accent: string
  is_active: boolean
  sort_order: number
  member_count: number
  lead_names: string[]
  created_at: string
  updated_at: string
}

export interface TeamMemberRow {
  membership_id: string
  user_id: string
  role: string
  joined_at: string
  name: string | null
  email: string | null
  avatar_url: string | null
  position: string | null
  work_state: string | null
}

export interface TeamDetail {
  id: string
  slug: string
  name: string
  purpose: string | null
  mail_folders: string[]
  accent: string
  meeting_cadence: string | null
  current_focus: string | null
  current_focus_updated_at: string | null
  is_active: boolean
  sort_order: number
  created_at: string
  updated_at: string
}

/** A person's live team memberships — shown on their profile (teammate product). */
export interface MembershipForUser {
  membership_id: string
  team_id: string
  slug: string
  team_name: string
  accent: string
  role: string
  joined_at: string
}
