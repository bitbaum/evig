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

export async function getSessionUserId(request: APIRequestContext): Promise<string> {
  const response = await request.get('/api/auth/session')
  const json = (await response.json()) as { user?: { id?: string } }
  const id = json?.user?.id
  if (!id) throw new Error('Session user id missing')
  return id
}

export async function createServiceAppointment(
  request: APIRequestContext,
  overrides: {
    serviceSlug?: string
    description?: string
  } = {},
): Promise<{ appointmentId: string }> {
  const response = await csrfPost(request, '/api/appointments', {
    serviceSlug: overrides.serviceSlug ?? 'computer-repair-upgrades',
    description: overrides.description ?? `E2E Service-Termin ${Date.now()}`,
    urgency: 'normal',
  })
  const data = await parseApi<{ appointment: { id: string } }>(response)
  const appointmentId = data.appointment?.id
  if (!appointmentId) throw new Error('createServiceAppointment: missing appointment id')
  return { appointmentId }
}

export async function assignServiceAppointment(
  request: APIRequestContext,
  appointmentId: string,
  repairerUserId: string,
): Promise<void> {
  const response = await csrfPost(request, `/api/admin/appointments/${appointmentId}/assign`, {
    repairer_id: repairerUserId,
  })
  await parseApi(response)
}

export async function fetchServiceAppointment(
  request: APIRequestContext,
  appointmentId: string,
): Promise<{ status: string; repairer_id?: string | null }> {
  const response = await request.get(`/api/appointments/${appointmentId}`)
  const data = await parseApi<{ appointment: { status: string; repairer_id?: string | null } }>(
    response,
  )
  return data.appointment
}

export async function cancelServiceAppointment(
  request: APIRequestContext,
  appointmentId: string,
): Promise<void> {
  const response = await csrfPatch(request, `/api/appointments/${appointmentId}`, {
    action: 'cancel',
  })
  await parseApi(response)
}
