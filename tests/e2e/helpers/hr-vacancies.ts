import type { APIRequestContext } from '@playwright/test'
import { VACANCY_STATUS } from '@/config/hr-vacancies'
import { csrfPost } from './api-csrf'

interface ApiEnvelope<T> {
  success: boolean
  data?: T
  error?: string
}

async function parseApi<T>(response: {
  ok: () => boolean
  json: () => Promise<unknown>
  status: () => number
  url: () => string
}): Promise<T> {
  const body = (await response.json()) as ApiEnvelope<T>
  if (!response.ok() || !body.success) {
    throw new Error(body.error || `API ${response.status()} ${response.url()}`)
  }
  return body.data as T
}

export interface VacancyCreateResult {
  id: string
  slug: string
  title: string
  status: string
}

export function buildE2EVacancyTitle(suffix = Date.now()): string {
  return `E2E HR Stelle ${suffix}`
}

export async function createVacancyDraft(
  request: APIRequestContext,
  title: string,
): Promise<VacancyCreateResult> {
  const response = await csrfPost(request, '/api/admin/hr/vacancies', {
    title,
    description: 'E2E Test-Stelle für Freiwilligenarbeit in der Werkstatt.',
    role_track: 'volunteer',
    summary: 'Automatisierter E2E-Test',
    initial_status: VACANCY_STATUS.DRAFT,
  })
  return parseApi<VacancyCreateResult>(response)
}

export async function publishVacancy(
  request: APIRequestContext,
  vacancyId: string,
): Promise<VacancyCreateResult> {
  const response = await csrfPost(request, `/api/admin/hr/vacancies/${vacancyId}/transition`, {
    status: VACANCY_STATUS.PUBLISHED,
  })
  return parseApi<VacancyCreateResult>(response)
}

export async function applyToVacancy(
  request: APIRequestContext,
  slug: string,
  applicantEmail: string,
  applicantName: string,
): Promise<{ id: string }> {
  const response = await csrfPost(request, `/api/careers/${slug}/apply`, {
    applicant_name: applicantName,
    applicant_email: applicantEmail,
    source: 'website',
    track_responses: {
      motivation: 'E2E Bewerbung — ich möchte bei RevampIT Freiwilligenarbeit leisten.',
      hours_per_week: 4,
      skills: ['Hardware'],
    },
  })
  return parseApi<{ id: string }>(response)
}

export async function hireApplication(
  request: APIRequestContext,
  applicationId: string,
): Promise<{ team_profile_id: string }> {
  const response = await csrfPost(request, `/api/admin/hr/applications/${applicationId}/hire`, {
    spawn_onboarding_tasks: false,
  })
  return parseApi<{ team_profile_id: string }>(response)
}

export async function listApplicationsForPosting(
  request: APIRequestContext,
  postingId: string,
): Promise<Array<{ id: string; applicant_email: string }>> {
  const response = await request.get(`/api/admin/hr/applications?job_posting_id=${postingId}`)
  const body = (await response.json()) as ApiEnvelope<{ applications: Array<{ id: string; applicant_email: string }> }>
  if (!response.ok() || !body.success) {
    throw new Error(body.error || 'Failed to list applications')
  }
  return body.data?.applications ?? []
}
