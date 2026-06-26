import { z } from 'zod'
import {
  ROLE_TRACK_OPTIONS,
  VACANCY_STATUS_OPTIONS,
  APPLICATION_SOURCE_OPTIONS,
  VACANCY_STATUS,
} from '@/config/hr-vacancies'
import { APPLICATION_STATUS_OPTIONS } from '@/config/hr-application-status'
import { DEPARTMENT_OPTIONS } from '@/config/team'

const roleTrackSchema = z.enum(ROLE_TRACK_OPTIONS as unknown as [string, ...string[]])
const vacancyStatusSchema = z.enum(VACANCY_STATUS_OPTIONS as unknown as [string, ...string[]])
const applicationStatusSchema = z.enum(APPLICATION_STATUS_OPTIONS as unknown as [string, ...string[]])
const applicationSourceSchema = z.enum(APPLICATION_SOURCE_OPTIONS as unknown as [string, ...string[]])

export const createVacancySchema = z.object({
  title: z.string().min(1).max(200),
  slug: z.string().min(1).max(200).optional(),
  summary: z.string().max(500).optional().nullable(),
  description: z.string().min(1),
  role_track: roleTrackSchema,
  department: z.enum(DEPARTMENT_OPTIONS as unknown as [string, ...string[]]).optional().nullable(),
  location: z.string().max(200).optional().nullable(),
  remote_ok: z.boolean().optional().default(false),
  hours_per_week: z.number().int().min(1).max(80).optional().nullable(),
  start_date: z.string().optional().nullable(),
  application_deadline: z.string().datetime().optional().nullable(),
  compensation_public_text: z.string().max(1000).optional().nullable(),
  hiring_manager_user_id: z.string().uuid().optional().nullable(),
  show_on_get_involved: z.boolean().optional().default(true),
  seo_title: z.string().max(200).optional().nullable(),
  seo_description: z.string().max(500).optional().nullable(),
  initial_status: z.enum([VACANCY_STATUS.DRAFT, VACANCY_STATUS.PUBLISHED] as const).optional(),
})

export const updateVacancySchema = createVacancySchema.partial().omit({ initial_status: true })

export const transitionVacancySchema = z.object({
  status: vacancyStatusSchema,
})

export const vacancyFilterSchema = z.object({
  status: vacancyStatusSchema.optional(),
  role_track: roleTrackSchema.optional(),
  department: z.string().optional(),
  search: z.string().optional(),
})

const baseTrackResponses = z.object({
  motivation: z.string().min(20).max(5000),
  availability: z.string().max(500).optional(),
  skills: z.array(z.string().max(50)).max(20).optional().default([]),
  start_date_preference: z.string().optional(),
})

export const volunteerTrackSchema = baseTrackResponses.extend({
  hours_per_week: z.number().int().min(1).max(40).optional(),
})

export const internTrackSchema = baseTrackResponses.extend({
  school_program: z.string().min(2).max(200),
  duration: z.string().min(2).max(200),
  learning_goals: z.string().min(10).max(2000),
})

export const employeeTrackSchema = baseTrackResponses.extend({
  experience_summary: z.string().min(10).max(3000),
  notice_period: z.string().max(200).optional(),
  work_permit: z.boolean(),
  work_permit_detail: z.string().max(500).optional(),
  salary_expectation: z.string().max(200).optional(),
  cv_url: z.string().url().optional().or(z.literal('')),
})

export const reintegrationTrackSchema = baseTrackResponses.extend({
  situation: z.string().min(10).max(2000),
  support_needs: z.string().max(2000).optional(),
})

export const contractorTrackSchema = baseTrackResponses.extend({
  portfolio_url: z.string().url().optional().or(z.literal('')),
  rate_range: z.string().max(200).optional(),
  project_interest: z.string().min(10).max(2000),
})

export const submitApplicationSchema = z.object({
  applicant_name: z.string().min(2).max(200),
  applicant_email: z.string().email().max(320),
  applicant_phone: z.string().max(50).optional(),
  locale: z.string().max(10).optional().default('de'),
  source: applicationSourceSchema.optional().default('website'),
  track_responses: z.record(z.string(), z.unknown()),
  cv_storage_key: z.string().max(500).optional(),
})

export const transitionApplicationSchema = z.object({
  status: applicationStatusSchema,
  rejection_reason: z.string().max(2000).optional(),
  admin_notes: z.string().max(5000).optional(),
})

export const hireApplicationSchema = z.object({
  position: z.string().max(100).optional(),
  start_date: z.string().optional(),
  contract_hours: z.number().int().min(0).max(100).optional(),
  spawn_onboarding_tasks: z.boolean().optional().default(true),
})

export type CreateVacancyInput = z.infer<typeof createVacancySchema>
export type UpdateVacancyInput = z.infer<typeof updateVacancySchema>
export type SubmitApplicationInput = z.infer<typeof submitApplicationSchema>
export type HireApplicationInput = z.infer<typeof hireApplicationSchema>

export function validateTrackResponses(
  roleTrack: string,
  responses: Record<string, unknown>,
): { success: true; data: Record<string, unknown> } | { success: false; error: string } {
  const schemas: Record<string, z.ZodType<Record<string, unknown>>> = {
    volunteer: volunteerTrackSchema,
    intern: internTrackSchema,
    employee: employeeTrackSchema,
    reintegration: reintegrationTrackSchema,
    contractor: contractorTrackSchema,
  }
  const schema = schemas[roleTrack]
  if (!schema) return { success: false, error: 'Unbekannter Rollentyp' }
  const parsed = schema.safeParse(responses)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? 'Ungültige Angaben' }
  }
  return { success: true, data: parsed.data as Record<string, unknown> }
}
