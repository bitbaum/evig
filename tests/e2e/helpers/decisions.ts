import type { APIRequestContext } from '@playwright/test'
import { DECISION_STATUS } from '@/config/decisions'
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

export interface DecisionCreateResult {
  id: string
  title: string
  status: string
}

export interface DecisionDetail {
  id: string
  title: string
  description: string
  status: string
  votingMethod: string
  voteCount: number
  hasUserVoted: boolean
  outcomeSummary: string | null
}

export function buildE2EDecisionTitle(suffix = Date.now()): string {
  return `E2E Entscheid ${suffix}`
}

export function buildE2EDecisionDescription(): string {
  return 'Automatisierter E2E-Test: Sense-Check mit einfacher Mehrheit und Quorum 1.'
}

export async function createDecision(
  request: APIRequestContext,
  title: string,
  description = buildE2EDecisionDescription(),
): Promise<DecisionCreateResult> {
  const response = await csrfPost(request, '/api/decisions', {
    title,
    description,
    decisionType: 'sense_check',
    votingMethod: 'simple_majority',
    initialStatus: DECISION_STATUS.VOTING,
    quorum: { type: 'absolute', value: 1 },
    blindVoting: false,
    participantScope: 'all_staff',
  })
  return parseApi<DecisionCreateResult>(response)
}

export async function fetchDecision(
  request: APIRequestContext,
  decisionId: string,
): Promise<DecisionDetail> {
  const response = await request.get(`/api/decisions/${decisionId}`)
  return parseApi<DecisionDetail>(response)
}

export async function submitSimpleMajorityVote(
  request: APIRequestContext,
  decisionId: string,
  response: 'yes' | 'no' | 'abstain' = 'yes',
): Promise<void> {
  const apiResponse = await csrfPost(request, `/api/decisions/${decisionId}/votes`, { response })
  await parseApi(apiResponse)
}

export async function closeDecision(
  request: APIRequestContext,
  decisionId: string,
  outcomeSummary: string,
): Promise<void> {
  const response = await csrfPost(request, `/api/decisions/${decisionId}/transition`, {
    status: DECISION_STATUS.CLOSED,
    outcomeSummary,
  })
  await parseApi(response)
}

export async function tryCloseDecision(
  request: APIRequestContext,
  decisionId: string,
  outcomeSummary = 'E2E Abschluss',
): Promise<{ ok: boolean; status: number; error?: string }> {
  const response = await csrfPost(request, `/api/decisions/${decisionId}/transition`, {
    status: DECISION_STATUS.CLOSED,
    outcomeSummary,
  })
  const body = (await response.json()) as ApiEnvelope<unknown>
  return {
    ok: response.ok() && body.success === true,
    status: response.status(),
    error: body.error,
  }
}

export { DECISION_STATUS }
