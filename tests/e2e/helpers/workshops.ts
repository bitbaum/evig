import type { APIRequestContext } from '@playwright/test'
import { WORKSHOP_INSTANCE_STATUS } from '@/config/workshops'
import { csrfPatch, csrfPost } from './api-csrf'

interface ApiEnvelope<T> {
  success: boolean
  data?: T
  error?: string
}

export interface WorkshopWithInstances {
  slug: string
  title: string
  price_cents: number
  instances: Array<{
    id: string
    status: string
    current_participants: number
    max_participants: number
  }>
  user_registered?: boolean
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

export async function listWorkshopsWithInstances(
  request: APIRequestContext,
): Promise<WorkshopWithInstances[]> {
  const response = await request.get('/api/workshops?include=instances&active=true')
  return parseApi<WorkshopWithInstances[]>(response)
}

export function pickFreeWorkshopWithCapacity(
  workshops: WorkshopWithInstances[],
): WorkshopWithInstances | null {
  for (const workshop of workshops) {
    if (workshop.price_cents > 0) continue
    const open = workshop.instances?.find(
      inst =>
        inst.status === WORKSHOP_INSTANCE_STATUS.SCHEDULED &&
        inst.current_participants < inst.max_participants,
    )
    if (open) return workshop
  }
  return null
}

export function pickPaidWorkshopWithCapacity(
  workshops: WorkshopWithInstances[],
): WorkshopWithInstances | null {
  for (const workshop of workshops) {
    if (workshop.price_cents <= 0) continue
    const open = workshop.instances?.find(
      inst =>
        inst.status === WORKSHOP_INSTANCE_STATUS.SCHEDULED &&
        inst.current_participants < inst.max_participants,
    )
    if (open) return workshop
  }
  return null
}

export async function registerForFreeWorkshop(
  request: APIRequestContext,
  workshopSlug: string,
): Promise<{ registrationId: string }> {
  const response = await csrfPost(request, '/api/workshops/register', { workshopSlug })
  const data = await parseApi<{ registrationId: string }>(response)
  if (!data.registrationId) throw new Error('registerForFreeWorkshop: missing registrationId')
  return { registrationId: data.registrationId }
}

export async function cancelWorkshopRegistration(
  request: APIRequestContext,
  registrationId: string,
): Promise<void> {
  const response = await csrfPatch(request, `/api/workshops/registrations/${registrationId}`, {})
  await parseApi(response)
}

export async function getRegistrationForInstance(
  request: APIRequestContext,
  instanceId: string,
): Promise<{ registered: boolean; registration?: { id: string } }> {
  const response = await request.get(`/api/workshops/registration/${instanceId}`)
  return parseApi(response)
}
