/**
 * HR Vacancies — CRUD and status transitions
 */

import { db } from '@/db'
import { jobPostings, jobApplications } from '@/db/schema/hr-vacancies'
import { users } from '@/db/schema/auth'
import { eq, and, desc, ilike, or, sql, inArray, count } from 'drizzle-orm'
import { generateSlug } from '@/lib/utils/slug'
import {
  VACANCY_STATUS,
  PUBLIC_VACANCY_STATUSES,
  type VacancyStatus,
  type RoleTrack,
} from '@/config/hr-vacancies'
import { canTransitionVacancy } from '@/lib/domain/hr/vacancy-transitions'
import type { CreateVacancyInput, UpdateVacancyInput } from '@/lib/schemas/hr-vacancies'

export interface VacancyRow {
  id: string
  slug: string
  title: string
  summary: string | null
  description: string
  role_track: string
  department: string | null
  location: string | null
  remote_ok: boolean
  hours_per_week: number | null
  start_date: string | null
  application_deadline: string | null
  compensation_public_text: string | null
  status: string
  published_at: string | null
  frozen_at: string | null
  filled_at: string | null
  closed_at: string | null
  show_on_get_involved: boolean
  seo_title: string | null
  seo_description: string | null
  created_at: string
  updated_at: string
  application_count?: number
}

function mapPosting(row: typeof jobPostings.$inferSelect): VacancyRow {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    summary: row.summary,
    description: row.description,
    role_track: row.roleTrack,
    department: row.department,
    location: row.location,
    remote_ok: row.remoteOk,
    hours_per_week: row.hoursPerWeek,
    start_date: row.startDate,
    application_deadline: row.applicationDeadline,
    compensation_public_text: row.compensationPublicText,
    status: row.status,
    published_at: row.publishedAt,
    frozen_at: row.frozenAt,
    filled_at: row.filledAt,
    closed_at: row.closedAt,
    show_on_get_involved: row.showOnGetInvolved,
    seo_title: row.seoTitle,
    seo_description: row.seoDescription,
    created_at: row.createdAt ?? '',
    updated_at: row.updatedAt ?? '',
  }
}

async function uniqueSlug(base: string): Promise<string> {
  let slug = generateSlug(base)
  let suffix = 0
  while (true) {
    const candidate = suffix === 0 ? slug : `${slug}-${suffix}`
    const [existing] = await db
      .select({ id: jobPostings.id })
      .from(jobPostings)
      .where(eq(jobPostings.slug, candidate))
      .limit(1)
    if (!existing) return candidate
    suffix += 1
  }
}

export async function createVacancy(data: CreateVacancyInput, createdBy: string): Promise<VacancyRow> {
  const slug = data.slug ? generateSlug(data.slug) : await uniqueSlug(data.title)
  const initialStatus = data.initial_status ?? VACANCY_STATUS.DRAFT
  const now = new Date().toISOString()

  const [row] = await db
    .insert(jobPostings)
    .values({
      slug,
      title: data.title,
      summary: data.summary ?? null,
      description: data.description,
      roleTrack: data.role_track,
      department: data.department ?? null,
      location: data.location ?? null,
      remoteOk: data.remote_ok ?? false,
      hoursPerWeek: data.hours_per_week ?? null,
      startDate: data.start_date ?? null,
      applicationDeadline: data.application_deadline ?? null,
      compensationPublicText: data.compensation_public_text ?? null,
      status: initialStatus,
      publishedAt: initialStatus === VACANCY_STATUS.PUBLISHED ? now : null,
      createdBy,
      hiringManagerUserId: data.hiring_manager_user_id ?? null,
      showOnGetInvolved: data.show_on_get_involved ?? true,
      seoTitle: data.seo_title ?? null,
      seoDescription: data.seo_description ?? null,
    })
    .returning()

  return mapPosting(row)
}

export async function updateVacancy(
  id: string,
  data: UpdateVacancyInput,
): Promise<VacancyRow | null> {
  const patch: Partial<typeof jobPostings.$inferInsert> = { updatedAt: new Date().toISOString() }
  if (data.title !== undefined) patch.title = data.title
  if (data.slug !== undefined) patch.slug = generateSlug(data.slug)
  if (data.summary !== undefined) patch.summary = data.summary
  if (data.description !== undefined) patch.description = data.description
  if (data.role_track !== undefined) patch.roleTrack = data.role_track
  if (data.department !== undefined) patch.department = data.department
  if (data.location !== undefined) patch.location = data.location
  if (data.remote_ok !== undefined) patch.remoteOk = data.remote_ok
  if (data.hours_per_week !== undefined) patch.hoursPerWeek = data.hours_per_week
  if (data.start_date !== undefined) patch.startDate = data.start_date
  if (data.application_deadline !== undefined) patch.applicationDeadline = data.application_deadline
  if (data.compensation_public_text !== undefined) patch.compensationPublicText = data.compensation_public_text
  if (data.hiring_manager_user_id !== undefined) patch.hiringManagerUserId = data.hiring_manager_user_id
  if (data.show_on_get_involved !== undefined) patch.showOnGetInvolved = data.show_on_get_involved
  if (data.seo_title !== undefined) patch.seoTitle = data.seo_title
  if (data.seo_description !== undefined) patch.seoDescription = data.seo_description

  const [row] = await db.update(jobPostings).set(patch).where(eq(jobPostings.id, id)).returning()
  return row ? mapPosting(row) : null
}

export async function getVacancyById(id: string): Promise<VacancyRow | null> {
  const [row] = await db.select().from(jobPostings).where(eq(jobPostings.id, id)).limit(1)
  return row ? mapPosting(row) : null
}

export async function getVacancyBySlug(slug: string): Promise<VacancyRow | null> {
  const [row] = await db.select().from(jobPostings).where(eq(jobPostings.slug, slug)).limit(1)
  return row ? mapPosting(row) : null
}

export async function listVacanciesAdmin(filters: {
  status?: VacancyStatus
  role_track?: RoleTrack
  department?: string
  search?: string
}): Promise<VacancyRow[]> {
  const conditions = []
  if (filters.status) conditions.push(eq(jobPostings.status, filters.status))
  if (filters.role_track) conditions.push(eq(jobPostings.roleTrack, filters.role_track))
  if (filters.department) conditions.push(eq(jobPostings.department, filters.department))
  if (filters.search) {
    conditions.push(
      or(
        ilike(jobPostings.title, `%${filters.search}%`),
        ilike(jobPostings.slug, `%${filters.search}%`),
      )!,
    )
  }

  const rows = await db
    .select()
    .from(jobPostings)
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(desc(jobPostings.updatedAt))

  const counts = await db
    .select({
      postingId: jobApplications.jobPostingId,
      cnt: count(),
    })
    .from(jobApplications)
    .groupBy(jobApplications.jobPostingId)

  const countMap = new Map(counts.map((c) => [c.postingId, Number(c.cnt)]))

  return rows.map((r) => ({ ...mapPosting(r), application_count: countMap.get(r.id) ?? 0 }))
}

export async function listPublicVacancies(filters: {
  role_track?: RoleTrack
  department?: string
}): Promise<VacancyRow[]> {
  const conditions = [inArray(jobPostings.status, [...PUBLIC_VACANCY_STATUSES])]
  if (filters.role_track) conditions.push(eq(jobPostings.roleTrack, filters.role_track))
  if (filters.department) conditions.push(eq(jobPostings.department, filters.department))

  const rows = await db
    .select()
    .from(jobPostings)
    .where(and(...conditions))
    .orderBy(desc(jobPostings.publishedAt))

  return rows.map(mapPosting)
}

export async function transitionVacancy(
  id: string,
  newStatus: VacancyStatus,
): Promise<{ ok: true; vacancy: VacancyRow } | { ok: false; error: string }> {
  const existing = await getVacancyById(id)
  if (!existing) return { ok: false, error: 'not_found' }

  const from = existing.status as VacancyStatus
  if (!canTransitionVacancy(from, newStatus)) {
    return { ok: false, error: 'invalid_transition' }
  }

  const now = new Date().toISOString()
  const patch: Partial<typeof jobPostings.$inferInsert> = {
    status: newStatus,
    updatedAt: now,
  }
  if (newStatus === VACANCY_STATUS.PUBLISHED && !existing.published_at) {
    patch.publishedAt = now
  }
  if (newStatus === VACANCY_STATUS.FROZEN) patch.frozenAt = now
  if (newStatus === VACANCY_STATUS.FILLED) patch.filledAt = now
  if (newStatus === VACANCY_STATUS.CLOSED) patch.closedAt = now

  const [row] = await db.update(jobPostings).set(patch).where(eq(jobPostings.id, id)).returning()
  return row ? { ok: true, vacancy: mapPosting(row) } : { ok: false, error: 'update_failed' }
}

export async function duplicateVacancy(id: string, createdBy: string): Promise<VacancyRow | null> {
  const source = await getVacancyById(id)
  if (!source) return null

  return createVacancy(
    {
      title: `${source.title} (Kopie)`,
      description: source.description,
      summary: source.summary ?? undefined,
      role_track: source.role_track as RoleTrack,
      department: source.department ?? undefined,
      location: source.location ?? undefined,
      remote_ok: source.remote_ok,
      hours_per_week: source.hours_per_week ?? undefined,
      start_date: source.start_date ?? undefined,
      application_deadline: source.application_deadline ?? undefined,
      compensation_public_text: source.compensation_public_text ?? undefined,
      show_on_get_involved: source.show_on_get_involved,
      seo_title: source.seo_title ?? undefined,
      seo_description: source.seo_description ?? undefined,
      initial_status: VACANCY_STATUS.DRAFT,
    },
    createdBy,
  )
}

export async function countPendingApplications(): Promise<number> {
  const [row] = await db
    .select({ cnt: count() })
    .from(jobApplications)
    .where(eq(jobApplications.status, 'new'))
  return Number(row?.cnt ?? 0)
}

export async function getAboutLeaders(): Promise<
  Array<{ id: string; name: string | null; position: string | null; department: string | null }>
> {
  const { teamProfiles } = await import('@/db/schema/team')
  const rows = await db
    .select({
      id: teamProfiles.id,
      name: users.name,
      position: teamProfiles.position,
      department: teamProfiles.department,
    })
    .from(teamProfiles)
    .innerJoin(users, eq(teamProfiles.userId, users.id))
    .where(eq(teamProfiles.showOnAbout, true))
    .limit(12)

  return rows
}
