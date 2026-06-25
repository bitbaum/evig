import type { APIRequestContext } from '@playwright/test'
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

export function buildTestWorkshopProposalPayload(
  overrides: Record<string, unknown> = {},
): Record<string, unknown> {
  const stamp = Date.now()
  return {
    title: `E2E Workshop-Vorschlag ${stamp}`,
    description: 'Automatisierter Playwright-Test — kann abgelehnt oder gelöscht werden.',
    shortDescription: 'Kurzbeschreibung für E2E-Test',
    category: 'linux',
    durationHours: 2,
    level: 'beginner',
    maxParticipants: 12,
    minParticipants: 3,
    pricePerPerson: 0,
    learningObjectives: ['Terminal bedienen', 'Grundlagen Open Source'],
    locationType: 'online',
    termsAccepted: true,
    ...overrides,
  }
}

export async function submitWorkshopProposal(
  request: APIRequestContext,
  overrides: Record<string, unknown> = {},
): Promise<{ proposalId: string; title: string }> {
  const payload = buildTestWorkshopProposalPayload(overrides)
  const response = await csrfPost(request, '/api/workshops/propose', payload)
  const data = await parseApi<{ proposalId: string }>(response)
  if (!data.proposalId) throw new Error('submitWorkshopProposal: missing proposalId')
  return { proposalId: data.proposalId, title: String(payload.title) }
}

export async function reviewWorkshopProposal(
  request: APIRequestContext,
  proposalId: string,
  action: 'approve' | 'reject' | 'require_changes',
  reviewNotes = '',
): Promise<void> {
  const response = await csrfPost(
    request,
    `/api/admin/workshops/proposals/${proposalId}/approve`,
    { action, review_notes: reviewNotes },
  )
  await parseApi(response)
}

export async function fetchWorkshopProposalAdmin(
  request: APIRequestContext,
  proposalId: string,
): Promise<{ status: string; title: string }> {
  const response = await request.get(`/api/admin/workshops/proposals/${proposalId}`)
  const data = await parseApi<{ proposal: { status: string; title: string } }>(response)
  return data.proposal
}
