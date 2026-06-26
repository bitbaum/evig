/**
 * HR Job Applications — submit, pipeline, hire
 */

import { db } from '@/db'
import { jobApplications, jobApplicationEvents, jobPostings } from '@/db/schema/hr-vacancies'
import { users } from '@/db/schema'
import { tasks } from '@/db/schema/tasks'
import { eq, and, desc, ilike, or, count } from 'drizzle-orm'
import {
  canTransitionApplication,
} from '@/lib/domain/hr/application-transitions'
import {
  employmentTypeForRoleTrack,
  extractProfileFromTrackResponses,
} from '@/lib/domain/hr/hire'
import { canApplyToVacancy } from '@/lib/domain/hr/vacancy-transitions'
import type { HireApplicationInput, SubmitApplicationInput } from '@/lib/schemas/hr-vacancies'
import { TASK_CATEGORIES, TASK_PRIORITIES, TASK_TYPES, TASK_STATUSES } from '@/config/tasks'
import { getVacancyById, transitionVacancy } from '@/lib/services/hr-vacancies'
import {
  createTeamProfileForHire,
  findTeamProfileIdByUserId,
  promoteUserToStaff,
} from '@/lib/services/team-profiles'
import {
  APPLICATION_STATUS,
  HIREABLE_APPLICATION_STATUSES,
  type ApplicationStatus,
} from '@/config/hr-application-status'
import { VACANCY_STATUS, ONBOARDING_TASK_TEMPLATES, type RoleTrack } from '@/config/hr-vacancies'

export interface ApplicationRow {
  id: string
  job_posting_id: string
  user_id: string | null
  applicant_name: string
  applicant_email: string
  applicant_phone: string | null
  locale: string | null
  status: string
  track_responses: Record<string, unknown>
  cv_storage_key: string | null
  source: string
  admin_notes: string | null
  rejection_reason: string | null
  hired_team_profile_id: string | null
  created_at: string
  updated_at: string
  posting_title?: string
  posting_slug?: string
  role_track?: string
}

function mapApplication(
  row: typeof jobApplications.$inferSelect,
  extra?: Partial<ApplicationRow>,
): ApplicationRow {
  return {
    id: row.id,
    job_posting_id: row.jobPostingId,
    user_id: row.userId,
    applicant_name: row.applicantName,
    applicant_email: row.applicantEmail,
    applicant_phone: row.applicantPhone,
    locale: row.locale,
    status: row.status,
    track_responses: (row.trackResponses as Record<string, unknown>) ?? {},
    cv_storage_key: row.cvStorageKey,
    source: row.source,
    admin_notes: row.adminNotes,
    rejection_reason: row.rejectionReason,
    hired_team_profile_id: row.hiredTeamProfileId,
    created_at: row.createdAt ?? '',
    updated_at: row.updatedAt ?? '',
    ...extra,
  }
}

async function logEvent(
  applicationId: string,
  eventType: string,
  actorUserId: string | null,
  payload: Record<string, unknown> = {},
) {
  await db.insert(jobApplicationEvents).values({
    applicationId,
    eventType,
    actorUserId,
    payload,
  })
}

export async function submitApplication(
  postingId: string,
  data: SubmitApplicationInput,
  userId: string | null,
): Promise<{ ok: true; application: ApplicationRow } | { ok: false; error: string }> {
  const [posting] = await db.select().from(jobPostings).where(eq(jobPostings.id, postingId)).limit(1)
  if (!posting) return { ok: false, error: 'not_found' }

  if (
    !canApplyToVacancy(posting.status as import('@/config/hr-vacancies').VacancyStatus, posting.applicationDeadline)
  ) {
    return { ok: false, error: 'not_accepting' }
  }

  const [row] = await db
    .insert(jobApplications)
    .values({
      jobPostingId: postingId,
      userId,
      applicantName: data.applicant_name,
      applicantEmail: data.applicant_email.toLowerCase(),
      applicantPhone: data.applicant_phone ?? null,
      locale: data.locale ?? 'de',
      status: APPLICATION_STATUS.NEW,
      trackResponses: data.track_responses,
      cvStorageKey: data.cv_storage_key ?? null,
      source: data.source ?? 'website',
    })
    .returning()

  await logEvent(row.id, 'submitted', userId, { source: data.source })

  return {
    ok: true,
    application: mapApplication(row, {
      posting_title: posting.title,
      posting_slug: posting.slug,
      role_track: posting.roleTrack,
    }),
  }
}

export async function getApplicationById(id: string): Promise<ApplicationRow | null> {
  const rows = await db
    .select({ app: jobApplications, posting: jobPostings })
    .from(jobApplications)
    .innerJoin(jobPostings, eq(jobApplications.jobPostingId, jobPostings.id))
    .where(eq(jobApplications.id, id))
    .limit(1)

  const hit = rows[0]
  if (!hit) return null
  return mapApplication(hit.app, {
    posting_title: hit.posting.title,
    posting_slug: hit.posting.slug,
    role_track: hit.posting.roleTrack,
  })
}

export async function listApplicationsAdmin(filters: {
  status?: ApplicationStatus
  job_posting_id?: string
  search?: string
}): Promise<ApplicationRow[]> {
  const conditions = []
  if (filters.status) conditions.push(eq(jobApplications.status, filters.status))
  if (filters.job_posting_id) conditions.push(eq(jobApplications.jobPostingId, filters.job_posting_id))
  if (filters.search) {
    conditions.push(
      or(
        ilike(jobApplications.applicantName, `%${filters.search}%`),
        ilike(jobApplications.applicantEmail, `%${filters.search}%`),
      )!,
    )
  }

  const rows = await db
    .select({ app: jobApplications, posting: jobPostings })
    .from(jobApplications)
    .innerJoin(jobPostings, eq(jobApplications.jobPostingId, jobPostings.id))
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(desc(jobApplications.createdAt))

  return rows.map(({ app, posting }) =>
    mapApplication(app, {
      posting_title: posting.title,
      posting_slug: posting.slug,
      role_track: posting.roleTrack,
    }),
  )
}

export async function transitionApplication(
  id: string,
  newStatus: ApplicationStatus,
  actorUserId: string,
  extra?: { rejection_reason?: string; admin_notes?: string },
): Promise<{ ok: true; application: ApplicationRow } | { ok: false; error: string }> {
  const existing = await getApplicationById(id)
  if (!existing) return { ok: false, error: 'not_found' }

  const from = existing.status as ApplicationStatus
  if (!canTransitionApplication(from, newStatus)) {
    return { ok: false, error: 'invalid_transition' }
  }

  const now = new Date().toISOString()
  const patch: Partial<typeof jobApplications.$inferInsert> = {
    status: newStatus,
    updatedAt: now,
    reviewedBy: actorUserId,
    reviewedAt: now,
  }
  if (extra?.rejection_reason) patch.rejectionReason = extra.rejection_reason
  if (extra?.admin_notes !== undefined) patch.adminNotes = extra.admin_notes
  if (newStatus === APPLICATION_STATUS.WITHDRAWN) patch.withdrawnAt = now

  const [row] = await db.update(jobApplications).set(patch).where(eq(jobApplications.id, id)).returning()

  await logEvent(id, `status_${newStatus}`, actorUserId, { from, to: newStatus })

  const app = await getApplicationById(row.id)
  return app ? { ok: true, application: app } : { ok: false, error: 'update_failed' }
}

async function resolveUserForHire(
  application: ApplicationRow,
): Promise<{ ok: true; userId: string } | { ok: false; error: string }> {
  if (application.user_id) return { ok: true, userId: application.user_id }

  const [byEmail] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, application.applicant_email.toLowerCase()))
    .limit(1)

  if (byEmail) return { ok: true, userId: byEmail.id }

  const [created] = await db
    .insert(users)
    .values({
      email: application.applicant_email.toLowerCase(),
      name: application.applicant_name,
      isStaff: true,
      emailVerified: null,
    })
    .returning({ id: users.id })

  return { ok: true, userId: created.id }
}

export async function hireApplication(
  applicationId: string,
  actorUserId: string,
  options: HireApplicationInput,
): Promise<
  | { ok: true; teamProfileId: string; application: ApplicationRow }
  | { ok: false; error: string }
> {
  const application = await getApplicationById(applicationId)
  if (!application) return { ok: false, error: 'not_found' }

  if (application.status === APPLICATION_STATUS.HIRED) {
    return { ok: false, error: 'already_hired' }
  }
  const hireable = HIREABLE_APPLICATION_STATUSES
  if (!hireable.includes(application.status as ApplicationStatus)) {
    return { ok: false, error: 'invalid_status_for_hire' }
  }

  const posting = await getVacancyById(application.job_posting_id)
  if (!posting) return { ok: false, error: 'posting_not_found' }

  const userResult = await resolveUserForHire(application)
  if (!userResult.ok) return userResult

  const userId = userResult.userId

  const existingProfileId = await findTeamProfileIdByUserId(userId)
  if (existingProfileId) {
    return { ok: false, error: 'profile_exists' }
  }

  const extracted = extractProfileFromTrackResponses(
    posting.role_track,
    application.track_responses,
  )

  const { id: profileId } = await createTeamProfileForHire({
    userId,
    position: options.position ?? posting.title,
    department: posting.department,
    employmentType: employmentTypeForRoleTrack(posting.role_track),
    startDate: options.start_date ?? posting.start_date ?? null,
    contractHours: options.contract_hours ?? posting.hours_per_week ?? null,
    skills: extracted.skills,
    goals: extracted.goals,
    developmentAreas: extracted.developmentAreas,
    phone: application.applicant_phone,
  })

  await promoteUserToStaff(userId)

  const now = new Date().toISOString()
  await db
    .update(jobApplications)
    .set({
      status: APPLICATION_STATUS.HIRED,
      hiredTeamProfileId: profileId,
      reviewedBy: actorUserId,
      reviewedAt: now,
      updatedAt: now,
    })
    .where(eq(jobApplications.id, applicationId))

  await logEvent(applicationId, 'hired', actorUserId, { teamProfileId: profileId })

  if (options.spawn_onboarding_tasks !== false) {
    const templates = ONBOARDING_TASK_TEMPLATES[posting.role_track as RoleTrack] ?? []
    for (const tmpl of templates) {
      await db.insert(tasks).values({
        title: tmpl.title,
        description: tmpl.description,
        taskType: TASK_TYPES.ONE_TIME,
        category: TASK_CATEGORIES.OTHER,
        priority: TASK_PRIORITIES.NORMAL,
        assignedTo: userId,
        createdBy: actorUserId,
        currentStatus: TASK_STATUSES.REQUESTED,
      })
    }
  }

  await transitionVacancy(posting.id, VACANCY_STATUS.FILLED)

  const updated = await getApplicationById(applicationId)
  return updated
    ? { ok: true, teamProfileId: profileId, application: updated }
    : { ok: false, error: 'update_failed' }
}

export async function countApplicationsByStatus(status: ApplicationStatus): Promise<number> {
  const [row] = await db
    .select({ cnt: count() })
    .from(jobApplications)
    .where(eq(jobApplications.status, status))
  return Number(row?.cnt ?? 0)
}
