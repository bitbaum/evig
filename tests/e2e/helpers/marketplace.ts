import type { APIRequestContext } from '@playwright/test'
import { csrfDelete, csrfPatch, csrfPost } from './api-csrf'
import {
  PAYREXX_WEBHOOK_PATH,
  isPayrexxHostedUrl,
  isPayrexxMockRedirectUrl,
} from '@/config/payrexx'

interface ApiEnvelope<T> {
  success: boolean
  data?: T
  error?: string
}

async function parseApi<T>(response: { ok: () => boolean; json: () => Promise<unknown>; status: () => number; url: () => string }): Promise<T> {
  const body = (await response.json()) as ApiEnvelope<T>
  if (!response.ok() || !body.success) {
    throw new Error(body.error || `API ${response.status()} ${response.url()}`)
  }
  return body.data as T
}

export interface TestListingPayload {
  title: string
  description: string
  price_chf: number
  category: string
  condition: string
  delivery_options: 'pickup' | 'shipping' | 'both'
  payment_mode: 'secure' | 'direct' | 'both'
  pickup_location?: string
  status: 'active' | 'draft'
}

export function buildTestListingPayload(
  overrides: Partial<TestListingPayload> = {},
): TestListingPayload {
  return {
    title: `E2E Listing ${Date.now()}`,
    description: 'Automatisierter Playwright-Test — kann gelöscht werden.',
    price_chf: 1,
    category: '99',
    condition: 'good',
    delivery_options: 'pickup',
    payment_mode: 'secure',
    pickup_location: 'Zürich',
    status: 'active',
    ...overrides,
  }
}

export async function createMarketplaceListing(
  request: APIRequestContext,
  overrides: Partial<TestListingPayload> = {},
): Promise<{ listingId: string }> {
  const payload = buildTestListingPayload(overrides)
  const response = await csrfPost(request, '/api/listings', payload)
  const data = await parseApi<{ id: string }>(response)
  if (!data.id) throw new Error('createMarketplaceListing: missing id')
  return { listingId: data.id }
}

export async function deleteMarketplaceListing(
  request: APIRequestContext,
  listingId: string,
): Promise<void> {
  const response = await csrfDelete(request, `/api/listings/${listingId}`)
  await parseApi(response)
}

export async function createMarketplaceOrder(
  request: APIRequestContext,
  listingId: string,
  deliveryMethod: 'pickup' | 'shipping' = 'pickup',
): Promise<{ orderId: string; paymentUrl: string }> {
  const response = await csrfPost(request, '/api/marketplace/orders', {
    listing_id: listingId,
    delivery_method: deliveryMethod,
    shipping_address: null,
  })
  const data = await parseApi<{ orderId: string; paymentUrl: string }>(response)
  if (!data.orderId || !data.paymentUrl) {
    throw new Error('createMarketplaceOrder: missing orderId or paymentUrl')
  }
  return data
}

export async function fetchMarketplaceOrder(
  request: APIRequestContext,
  orderId: string,
): Promise<{ status: string; listingId: string | null }> {
  const response = await request.get(`/api/marketplace/orders/${orderId}`)
  const data = await parseApi<{ status: string; listingId?: string | null }>(response)
  return { status: data.status, listingId: data.listingId ?? null }
}

export async function cancelMarketplaceOrder(
  request: APIRequestContext,
  orderId: string,
): Promise<void> {
  const response = await csrfPatch(request, `/api/marketplace/orders/${orderId}`, {
    status: 'cancelled',
  })
  await parseApi(response)
}

export async function askListingQuestion(
  request: APIRequestContext,
  listingId: string,
  question: string,
): Promise<{ id: string }> {
  const response = await csrfPost(request, `/api/listings/${listingId}/questions`, { question })
  const data = await parseApi<{ id: string }>(response)
  if (!data.id) throw new Error('askListingQuestion: missing id')
  return { id: data.id }
}

export async function answerListingQuestion(
  request: APIRequestContext,
  listingId: string,
  questionId: string,
  answer: string,
): Promise<void> {
  const response = await csrfPost(
    request,
    `/api/listings/${listingId}/questions/${questionId}/answer`,
    { answer },
  )
  await parseApi(response)
}

export async function fetchListingQuestions(
  request: APIRequestContext,
  listingId: string,
): Promise<Array<{ id: string; question: string; answer: string | null; status: string }>> {
  const response = await request.get(`/api/listings/${listingId}/questions`)
  const data = await parseApi<{ questions: Array<{ id: string; question: string; answer: string | null; status: string }> }>(response)
  return data.questions
}

export async function simulatePayrexxReservedWebhook(
  request: APIRequestContext,
  orderId: string,
  amountCents: number,
  transactionId = Math.floor(Math.random() * 900000) + 100000,
): Promise<void> {
  const secret = process.env.PAYREXX_WEBHOOK_SECRET
  if (!secret) {
    throw new Error('PAYREXX_WEBHOOK_SECRET not set — cannot simulate prod Payrexx payment')
  }

  const body = JSON.stringify({
    transaction: {
      id: transactionId,
      status: 'reserved',
      referenceId: orderId,
      amount: amountCents,
      currency: 'CHF',
    },
  })

  const { createHmac } = await import('node:crypto')
  const signature = createHmac('sha256', secret).update(body).digest('hex')

  const response = await request.fetch(PAYREXX_WEBHOOK_PATH, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'payrexx-signature': signature,
    },
    data: body,
  })

  if (!response.ok()) {
    const text = await response.text()
    throw new Error(`Payrexx webhook simulation failed: ${response.status()} ${text}`)
  }
}

export function isMockPayrexxUrl(paymentUrl: string): boolean {
  return isPayrexxMockRedirectUrl(paymentUrl)
}

export function isHostedPayrexxUrl(paymentUrl: string): boolean {
  return isPayrexxHostedUrl(paymentUrl)
}
