import type { APIRequestContext } from '@playwright/test'
import { OFFER_MIN_CHARS } from '../../../src/config/it-hilfe'

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
    canton: 'ZH',
    serviceType: 'flexible',
    urgency: 'normal',
    skillsNeeded: ['hardware'],
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
  overrides: Partial<ItHilfeRequestPayload> = {},
): Promise<{ requestId: string }> {
  const payload = buildTestRequestPayload(overrides)
  const response = await request.post('/api/it-hilfe/requests', { data: payload })
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
  const response = await request.post(`/api/it-hilfe/requests/${requestId}/offers`, {
    data: { message, relevantSkills: ['hardware'] },
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
  const response = await request.post(
    `/api/it-hilfe/requests/${requestId}/offers/${offerId}/accept`,
  )
  await parseApi(response)
}

export async function completeItHilfeRequest(
  request: APIRequestContext,
  requestId: string,
): Promise<void> {
  const response = await request.post(`/api/it-hilfe/requests/${requestId}/complete`)
  await parseApi(response)
}

export async function confirmItHilfeReview(
  request: APIRequestContext,
  requestId: string,
): Promise<void> {
  const response = await request.post(`/api/it-hilfe/requests/${requestId}/confirm-review`, {
    data: { rating: 5, recommended: true, reviewText: 'Sehr hilfreich, danke!' },
  })
  await parseApi(response)
}

export async function fetchItHilfeRequest(
  request: APIRequestContext,
  requestId: string,
): Promise<{ status: string; reviewedAt: string | null }> {
  const response = await request.get(`/api/it-hilfe/requests/${requestId}`)
  const data = await parseApi<{ request: { status: string; reviewedAt?: string | null } }>(response)
  return { status: data.request.status, reviewedAt: data.request.reviewedAt ?? null }
}
