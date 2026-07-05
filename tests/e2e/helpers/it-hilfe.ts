import type { APIRequestContext } from '@playwright/test'
import { OFFER_MIN_CHARS } from '../../../src/config/it-hilfe'
import { signOfferAcceptToken } from '../../../src/lib/it-hilfe/offer-accept-tokens'
import { csrfDelete, csrfPost, csrfPut } from './api-csrf'

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
  const contentType = response.headers()['content-type'] ?? ''
  const text = await response.text()
  if (!contentType.includes('json')) {
    throw new Error(
      `API ${response.status()} ${response.url()} returned non-JSON (${contentType}): ${text.slice(0, 120)}`,
    )
  }
  const body = JSON.parse(text) as ApiEnvelope<T>
  if (!response.ok() || !body.success) {
    throw new Error(body.error || `API ${response.status()} ${response.url()}`)
  }
  return body.data as T
}

async function withDevCompileRetry<T>(
  action: () => Promise<Awaited<ReturnType<APIRequestContext['post']>>>,
): Promise<T> {
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      return await parseApi<T>(await action())
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      const isDevCompileMiss = message.includes('returned non-JSON') && message.includes('404')
      if (attempt === 0 && isDevCompileMiss) {
        await new Promise(resolve => setTimeout(resolve, 3000))
        continue
      }
      throw error
    }
  }
  throw new Error('withDevCompileRetry: unreachable')
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

/** Signed one-tap accept URL (same token as emailed to request owner). */
export function buildOfferAcceptMagicLink(offerId: string): string {
  const token = signOfferAcceptToken(offerId)
  return `/it-hilfe/accept?token=${encodeURIComponent(token)}`
}

/** Guest one-tap accept (same POST as AcceptButton on /it-hilfe/accept). */
export async function acceptItHilfeOfferViaMagicLink(
  request: APIRequestContext,
  offerId: string,
): Promise<{ requestId: string }> {
  const response = await request.post('/api/it-hilfe/accept-offer-via-token', {
    data: { token: signOfferAcceptToken(offerId) },
  })
  const data = await parseApi<{ requestId: string; helperId: string }>(response)
  return { requestId: data.requestId }
}

export async function withdrawItHilfeOffer(
  request: APIRequestContext,
  requestId: string,
  offerId: string,
): Promise<void> {
  const response = await csrfDelete(request, `/api/it-hilfe/requests/${requestId}/offers/${offerId}`)
  await parseApi(response)
}

export async function updateItHilfeRequest(
  request: APIRequestContext,
  requestId: string,
  overrides: Partial<ItHilfeRequestPayload>,
): Promise<void> {
  const response = await csrfPut(request, `/api/it-hilfe/requests/${requestId}`, overrides)
  await parseApi(response)
}

export async function fetchItHilfeOffers(
  request: APIRequestContext,
  requestId: string,
): Promise<Array<{ id: string; status: string }>> {
  const response = await request.get(`/api/it-hilfe/requests/${requestId}/offers`)
  const data = await parseApi<{ offers: Array<{ id: string; status: string }> }>(response)
  return data.offers ?? []
}

export async function acceptItHilfeOffer(
  request: APIRequestContext,
  requestId: string,
  offerId: string,
): Promise<void> {
  await withDevCompileRetry(() =>
    csrfPost(request, `/api/it-hilfe/requests/${requestId}/offers/${offerId}/accept`),
  )
}

export async function completeItHilfeRequest(
  request: APIRequestContext,
  requestId: string,
): Promise<void> {
  await withDevCompileRetry(() =>
    csrfPost(request, `/api/it-hilfe/requests/${requestId}/complete`),
  )
}

export async function confirmItHilfeReview(
  request: APIRequestContext,
  requestId: string,
): Promise<void> {
  await withDevCompileRetry(() =>
    csrfPost(request, `/api/it-hilfe/requests/${requestId}/confirm-review`, {
      rating: 5,
      recommended: true,
      reviewText: 'Sehr hilfreich, danke!',
    }),
  )
}

export async function fetchItHilfeRequest(
  request: APIRequestContext,
  requestId: string,
): Promise<{
  status: string
  title: string
  reviewedAt: string | null
  preferredTechnicianId: string | null
  preferredTechnicianName: string | null
}> {
  const response = await request.get(`/api/it-hilfe/requests/${requestId}`)
  const data = await parseApi<{
    request: {
      status: string
      title?: string
      reviewedAt?: string | null
      preferredTechnicianId?: string | null
      preferredTechnicianName?: string | null
    }
  }>(response)
  return {
    status: data.request.status,
    title: data.request.title ?? '',
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
