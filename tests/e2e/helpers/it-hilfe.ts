import type { APIRequestContext } from '@playwright/test'
import { OFFER_MIN_CHARS } from '../../../src/config/it-hilfe'
import { csrfPost } from './api-csrf'

export interface ItHilfeRequestPayload {
  categoryId: string
  title: string
  description: string
  postalCode: string
  city: string
  canton: string
  serviceType: string
  urgency: string
  skillsNeeded: string[]
}

export function buildTestRequestPayload(overrides: Partial<ItHilfeRequestPayload> = {}): ItHilfeRequestPayload {
  return {
    categoryId: 'laptop',
    title: `E2E IT-Hilfe ${Date.now()}`,
    description: 'Automatisierter Playwright-Test — kann gelöscht werden.',
    postalCode: '8055',
    city: 'Zürich',
    canton: 'Zürich',
    serviceType: 'flexible',
    urgency: 'normal',
    skillsNeeded: ['hardware_diagnosis'],
    ...overrides,
  }
}

interface ApiEnvelope<T> {
  success: boolean
  data?: T
  error?: string
}

async function parseApi<T>(response: Awaited<ReturnType<APIRequestContext['post']>>): Promise<T> {
  const body = (await response.json()) as ApiEnvelope<T>
  if (!response.ok() || !body.success) {
    throw new Error(body.error || `API ${response.status()} ${response.url()}`)
  }
  return body.data as T
}

export async function createItHilfeRequest(
  request: APIRequestContext,
  overrides: Partial<ItHilfeRequestPayload> & { preferredTechnicianId?: string } = {},
): Promise<{ requestId: string }> {
  const { preferredTechnicianId, ...payloadOverrides } = overrides
  const payload = buildTestRequestPayload(payloadOverrides)
  const body = preferredTechnicianId
    ? { ...payload, preferredTechnicianId }
    : payload
  const response = await csrfPost(request, '/api/it-hilfe/requests', body)
  const data = await parseApi<{ requestId: string }>(response)
  if (!data.requestId) throw new Error('createItHilfeRequest: missing requestId')
  return { requestId: data.requestId }
}

export async function submitItHilfeOffer(
  request: APIRequestContext,
  requestId: string,
  message = 'E2E-Angebot: Ich kann bei diesem Problem helfen und schaue es mir gerne an.',
): Promise<{ offerId: string }> {
  if (message.length < OFFER_MIN_CHARS) {
    throw new Error(`Offer message must be at least ${OFFER_MIN_CHARS} chars`)
  }
  const response = await csrfPost(request, `/api/it-hilfe/requests/${requestId}/offers`, {
    message,
    relevantSkills: ['hardware_diagnosis'],
  })
  const data = await parseApi<{ offerId: string }>(response)
  if (!data.offerId) throw new Error('submitItHilfeOffer: missing offerId')
  return { offerId: data.offerId }
}

export async function acceptItHilfeOffer(
  request: APIRequestContext,
  requestId: string,
  offerId: string,
): Promise<void> {
  const response = await csrfPost(
    request,
    `/api/it-hilfe/requests/${requestId}/offers/${offerId}/accept`,
  )
  await parseApi(response)
}

export async function completeItHilfeRequest(
  request: APIRequestContext,
  requestId: string,
): Promise<void> {
  const response = await csrfPost(request, `/api/it-hilfe/requests/${requestId}/complete`)
  await parseApi(response)
}

export async function confirmItHilfeReview(
  request: APIRequestContext,
  requestId: string,
): Promise<void> {
  const response = await csrfPost(request, `/api/it-hilfe/requests/${requestId}/confirm-review`, {
    rating: 5,
    recommended: true,
    reviewText: 'Sehr hilfreich, danke!',
  })
  await parseApi(response)
}

export async function fetchItHilfeRequest(
  request: APIRequestContext,
  requestId: string,
): Promise<{
  status: string
  reviewedAt: string | null
  preferredTechnicianId: string | null
  preferredTechnicianName: string | null
}> {
  const response = await request.get(`/api/it-hilfe/requests/${requestId}`)
  const data = await parseApi<{
    request: {
      status: string
      reviewedAt?: string | null
      preferredTechnicianId?: string | null
      preferredTechnicianName?: string | null
    }
  }>(response)
  return {
    status: data.request.status,
    reviewedAt: data.request.reviewedAt ?? null,
    preferredTechnicianId: data.request.preferredTechnicianId ?? null,
    preferredTechnicianName: data.request.preferredTechnicianName ?? null,
  }
}

export async function getSessionUserId(request: APIRequestContext): Promise<string> {
  const response = await request.get('/api/auth/session')
  const json = (await response.json()) as { user?: { id?: string } }
  const id = json?.user?.id
  if (!id) throw new Error('Session user id missing')
  return id
}

export async function resolveTechnicianProfileIdForUser(
  request: APIRequestContext,
  userId: string,
): Promise<string> {
  const response = await request.get('/api/technicians?limit=100')
  const data = await parseApi<{
    technicians: Array<{ id: string; userId: string }>
  }>(response)
  const match = data.technicians.find(t => t.userId === userId)
  if (!match?.id) throw new Error(`No technician profile for user ${userId}`)
  return match.id
}

export async function fetchItHilfeMatches(
  request: APIRequestContext,
  requestId: string,
): Promise<Array<{ id: string; isPreferred: boolean }>> {
  const response = await request.get(`/api/it-hilfe/requests/${requestId}/matches`)
  const data = await parseApi<{ matches: Array<{ id: string; isPreferred: boolean }> }>(response)
  return data.matches ?? []
}
