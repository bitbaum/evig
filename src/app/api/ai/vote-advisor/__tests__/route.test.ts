/**
 * @jest-environment node
 *
 * Tests for POST /api/ai/vote-advisor
 *
 * Behaviors locked:
 *   POST - 400 (invalid JSON), 400 (missing required fields),
 *          503 (AI service unavailable), 200 (analysis returned)
 *
 * No auth required — public endpoint.
 */

const mockCallWithFallback = jest.fn()
jest.mock('@/lib/ai/providers', () => ({
  callWithFallback: (...args: unknown[]) => mockCallWithFallback(...args),
}))

jest.mock('@/lib/ai/config/prompts', () => ({
  VOTING_ADVISOR_PROMPTS: {
    system: 'You are a voting advisor.',
    advise: 'Title: {title}\nDesc: {description}\nBackground: {background}\nMethod: {votingMethod} ({votingMethodExplanation})\nOptions: {options}\nQuestion: {question}',
  },
  VOTING_METHOD_LABELS: {
    'simple_majority': 'Einfache Mehrheit',
    'consensus': 'Konsens',
  },
  VOTING_METHOD_EXPLANATIONS: {
    'simple_majority': 'Die meisten Stimmen gewinnen.',
    'consensus': 'Alle müssen zustimmen.',
  },
}))

jest.mock('@/lib/api/helpers', () => {
  const { NextResponse } = jest.requireActual('next/server')
  return {
    apiSuccess: (data: unknown, status = 200) => NextResponse.json({ success: true, data }, { status }),
    apiError: (_err: unknown, msg: string, status = 500) => NextResponse.json({ success: false, error: msg }, { status }),
    apiBadRequest: (msg: string, details?: unknown) => NextResponse.json({ success: false, error: msg, details }, { status: 400 }),
    apiRateLimited: (msg = 'Rate limited') => NextResponse.json({ success: false, error: msg }, { status: 429 }),
  }
})

// Rate limiters use real module-level LRU state that persists across tests in
// the suite — without mocking, the per-IP limit (5/hour) trips after a handful
// of cases and short-circuits the route. Mock them to always allow.
const mockVoteAdvisorIp = jest.fn((..._args: unknown[]) => true)
const mockVoteAdvisorGlobal = jest.fn((..._args: unknown[]) => true)
jest.mock('@/lib/security/rate-limit', () => ({
  rateLimiters: {
    voteAdvisorIp: (...args: unknown[]) => mockVoteAdvisorIp(...args),
    voteAdvisorGlobal: (...args: unknown[]) => mockVoteAdvisorGlobal(...args),
  },
  getClientIdentifier: () => 'test-client',
}))

jest.mock('@/config/error-messages', () => ({
  ERROR_MESSAGES: { INVALID_REQUEST: 'Ungültige Anfrage' },
}))

jest.mock('@/lib/logger', () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() },
}))

import { NextRequest } from 'next/server'
import { POST } from '../route'

const MOCK_AI_RESULT = {
  text: 'This proposal would increase the budget by 20%. Option 1 maintains the status quo, Option 2 increases funding.',
  model: 'groq/llama3',
}

const VALID_BODY = {
  title: 'Budget Proposal 2026',
  description: 'Should we increase the IT budget by 20% for the next fiscal year?',
  votingMethod: 'simple_majority',
  question: 'What does this budget increase mean for our organization?',
}

function makeRequest(body: unknown) {
  return new NextRequest('http://localhost/api/ai/vote-advisor', {
    method: 'POST',
    body: typeof body === 'string' ? body : JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  })
}

beforeEach(() => {
  jest.resetAllMocks()
  mockCallWithFallback.mockResolvedValue(MOCK_AI_RESULT)
  mockVoteAdvisorIp.mockReturnValue(true)
  mockVoteAdvisorGlobal.mockReturnValue(true)
})

// ============================================================================
// Validation — JSON parsing
// ============================================================================

describe('POST /api/ai/vote-advisor — invalid JSON', () => {
  it('returns 400 when body is not valid JSON', async () => {
    const req = makeRequest('not-valid-json{')
    const response = await POST(req)
    expect(response.status).toBe(400)
    const body = await response.json()
    expect(body.error).toBeDefined()
  })
})

// ============================================================================
// Validation — schema
// ============================================================================

describe('POST /api/ai/vote-advisor — validation', () => {
  it('returns 400 when title is missing', async () => {
    const req = makeRequest({ ...VALID_BODY, title: undefined })
    const response = await POST(req)
    expect(response.status).toBe(400)
  })

  it('returns 400 when description is missing', async () => {
    const req = makeRequest({ ...VALID_BODY, description: undefined })
    const response = await POST(req)
    expect(response.status).toBe(400)
  })

  it('returns 400 when question is missing', async () => {
    const req = makeRequest({ ...VALID_BODY, question: undefined })
    const response = await POST(req)
    expect(response.status).toBe(400)
  })

  it('returns 400 when votingMethod is missing', async () => {
    const req = makeRequest({ ...VALID_BODY, votingMethod: undefined })
    const response = await POST(req)
    expect(response.status).toBe(400)
  })

  it('returns 400 when title is empty', async () => {
    const req = makeRequest({ ...VALID_BODY, title: '' })
    const response = await POST(req)
    expect(response.status).toBe(400)
  })

  it('returns 400 when question is too long (over 500 chars)', async () => {
    const req = makeRequest({ ...VALID_BODY, question: 'q'.repeat(501) })
    const response = await POST(req)
    expect(response.status).toBe(400)
  })
})

// ============================================================================
// AI service unavailable
// ============================================================================

describe('POST /api/ai/vote-advisor — service unavailable', () => {
  it('returns 503 when AI fallback chain returns null/undefined', async () => {
    mockCallWithFallback.mockResolvedValueOnce(null)
    const req = makeRequest(VALID_BODY)
    const response = await POST(req)
    expect(response.status).toBe(503)
    const body = await response.json()
    expect(body.success).toBe(false)
    expect(body.error).toBeDefined()
  })
})

// ============================================================================
// Success
// ============================================================================

describe('POST /api/ai/vote-advisor — success', () => {
  it('returns 200 with analysis and model from AI', async () => {
    const req = makeRequest(VALID_BODY)
    const response = await POST(req)
    expect(response.status).toBe(200)
    const body = await response.json()
    expect(body.success).toBe(true)
    expect(body.data.analysis).toBe(MOCK_AI_RESULT.text)
    expect(body.data.model).toBe(MOCK_AI_RESULT.model)
  })

  it('calls callWithFallback with system and user prompts', async () => {
    const req = makeRequest(VALID_BODY)
    await POST(req)
    expect(mockCallWithFallback).toHaveBeenCalledWith(
      expect.objectContaining({
        systemPrompt: 'You are a voting advisor.',
        maxTokens: 512,
        temperature: 0.3,
      })
    )
  })

  it('includes voting method label in the prompt', async () => {
    const req = makeRequest({ ...VALID_BODY, votingMethod: 'simple_majority' })
    await POST(req)
    const callArgs = mockCallWithFallback.mock.calls[0][0]
    expect(callArgs.userPrompt).toContain('Einfache Mehrheit')
  })

  it('handles optional background field', async () => {
    const req = makeRequest({ ...VALID_BODY, background: 'Previous budget was CHF 50,000.' })
    const response = await POST(req)
    expect(response.status).toBe(200)
    const callArgs = mockCallWithFallback.mock.calls[0][0]
    expect(callArgs.userPrompt).toContain('Previous budget was CHF 50,000.')
  })

  it('handles optional options array', async () => {
    const req = makeRequest({
      ...VALID_BODY,
      options: [
        { label: 'Option A', description: 'Keep current budget' },
        { label: 'Option B', description: 'Increase by 20%' },
      ],
    })
    const response = await POST(req)
    expect(response.status).toBe(200)
    const callArgs = mockCallWithFallback.mock.calls[0][0]
    expect(callArgs.userPrompt).toContain('Option A')
    expect(callArgs.userPrompt).toContain('Option B')
  })

  it('uses unknown voting method label verbatim when not in VOTING_METHOD_LABELS', async () => {
    const req = makeRequest({ ...VALID_BODY, votingMethod: 'ranked_choice' })
    const response = await POST(req)
    expect(response.status).toBe(200)
    const callArgs = mockCallWithFallback.mock.calls[0][0]
    expect(callArgs.userPrompt).toContain('ranked_choice')
  })
})

// ============================================================================
// Error handling
// ============================================================================

describe('POST /api/ai/vote-advisor — error handling', () => {
  it('returns 500 when callWithFallback throws', async () => {
    mockCallWithFallback.mockRejectedValueOnce(new Error('Network error'))
    const req = makeRequest(VALID_BODY)
    const response = await POST(req)
    expect(response.status).toBe(500)
  })
})
