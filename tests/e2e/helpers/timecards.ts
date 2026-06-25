import type { APIRequestContext } from '@playwright/test'
import { csrfPatch, csrfPost } from './api-csrf'

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

interface TimecardPayload {
  id: string
  status: string
  period_type: string
  period_start: string
  period_end: string
  notes?: string | null
  entries: Array<{
    work_date: string
    start_time?: string | null
    end_time?: string | null
    break_minutes?: number
    duration_minutes: number
    category?: string
    description?: string | null
    source?: string
  }>
}

export async function fetchCurrentTimecard(request: APIRequestContext): Promise<TimecardPayload> {
  const response = await request.get('/api/timecards?period_type=month')
  return parseApi<TimecardPayload>(response)
}

export async function submitTimecardForReview(request: APIRequestContext): Promise<TimecardPayload> {
  const current = await fetchCurrentTimecard(request)
  const response = await csrfPost(request, '/api/timecards', {
    period_type: current.period_type,
    period_start: current.period_start,
    period_end: current.period_end,
    notes: current.notes ?? null,
    entries: current.entries.map(entry => ({
      work_date: entry.work_date,
      start_time: entry.start_time ?? null,
      end_time: entry.end_time ?? null,
      break_minutes: entry.break_minutes ?? 0,
      duration_minutes: entry.duration_minutes,
      category: entry.category ?? 'other',
      description: entry.description ?? null,
      source: entry.source ?? 'manual',
    })),
  })
  return parseApi<TimecardPayload>(response)
}

export async function approveTimecardAsAdmin(
  request: APIRequestContext,
  timecardId: string,
  reviewNotes = 'E2E genehmigt',
): Promise<void> {
  const response = await csrfPatch(request, `/api/admin/timecards/${timecardId}`, {
    status: 'approved',
    review_notes: reviewNotes,
  })
  await parseApi(response)
}

export async function rejectTimecardAsAdmin(
  request: APIRequestContext,
  timecardId: string,
  reviewNotes = 'E2E reset',
): Promise<void> {
  const response = await csrfPatch(request, `/api/admin/timecards/${timecardId}`, {
    status: 'rejected',
    review_notes: reviewNotes,
  })
  await parseApi(response)
}

export async function resetTimecardForE2E(
  request: APIRequestContext,
): Promise<'ready' | 'already_approved'> {
  const current = await fetchCurrentTimecard(request)
  if (current.status === 'submitted') {
    await rejectTimecardAsAdmin(request, current.id)
    return 'ready'
  }
  if (current.status === 'approved') {
    return 'already_approved'
  }
  return 'ready'
}

export async function fetchLatestSubmittedTimecardId(
  request: APIRequestContext,
): Promise<string | undefined> {
  const response = await request.get('/api/admin/timecards?status=submitted&limit=5')
  const data = await parseApi<{ items?: Array<{ id: string }> }>(response)
  return data.items?.[0]?.id
}
