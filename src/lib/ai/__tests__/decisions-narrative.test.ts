/**
 * Tests for ai/decisions-narrative.ts — AI outcome narrative generation.
 *
 * Mission-relevant: the Beschluss narrative is the official protocol text for
 * Verein decisions. If buildTallySummary formats votes incorrectly, the formal
 * record is wrong. If generateOutcomeNarrative doesn't return null on AI failure,
 * the decision-close flow throws instead of completing gracefully.
 *
 * Behaviors locked:
 *   buildTallySummary (via generateOutcomeNarrative)
 *   - 'consent': includes agree/abstain/disagree/block counts and pass/block status
 *   - 'simple_majority': includes yes/no/abstain counts and pass/reject status
 *   - 'approval'/'dot'/'score'/'ranked_choice': formats ranked top-3 with metric
 *   - default/unknown: returns total votes fallback string
 *
 *   generateOutcomeNarrative
 *   - returns trimmed AI text on success
 *   - returns null when AI result is null (all providers failed)
 *   - returns null when callWithFallback throws (non-critical, never propagates)
 */

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const mockCallWithFallback = jest.fn()

jest.mock('@/lib/ai/providers', () => ({
  callWithFallback: (...args: unknown[]) => mockCallWithFallback.apply(null, args),
}))

// BRAND_CONTEXT is a module-level constant read at import time — must be
// inlined in the factory to avoid TDZ issues during jest.mock hoisting.
jest.mock('@/lib/ai/config/prompts', () => ({
  BRAND_CONTEXT: 'Revamp-IT ist ein Schweizer Verein.',
}))

jest.mock('@/lib/schemas/decisions', () => ({}))

// ---------------------------------------------------------------------------
// Imports (after mocks)
// ---------------------------------------------------------------------------

import { generateOutcomeNarrative } from '../decisions-narrative'

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const BASE_PARAMS = {
  title: 'Neue Logo-Wahl',
  description: 'Welches Logo soll verwendet werden?',
  votingMethod: 'simple_majority',
  options: [{ id: 'o1', label: 'Ja', imageUrl: undefined }, { id: 'o2', label: 'Nein', imageUrl: undefined }],
  outcome: { totalVotes: 10, counts: { yes: 7, no: 2, abstain: 1 }, passed: true },
  outcomeSummary: null,
  participantScope: 'members',
  category: 'vorstandsbeschluss',
}

beforeEach(() => {
  jest.clearAllMocks()
  mockCallWithFallback.mockResolvedValue({ text: 'Der Vorstand hat beschlossen.', provider: 'groq', model: 'groq:llama', failedProviders: [] })
})

// ============================================================================
// generateOutcomeNarrative — AI routing
// ============================================================================

describe('generateOutcomeNarrative — AI routing', () => {
  it('returns trimmed AI text on success', async () => {
    mockCallWithFallback.mockResolvedValueOnce({ text: '  Der Beschluss wurde gefasst.  ', provider: 'groq', model: 'groq:llama', failedProviders: [] })

    const result = await generateOutcomeNarrative(BASE_PARAMS)

    expect(result).toBe('Der Beschluss wurde gefasst.')
  })

  it('returns null when AI result is null (all providers failed)', async () => {
    mockCallWithFallback.mockResolvedValueOnce(null)

    const result = await generateOutcomeNarrative(BASE_PARAMS)

    expect(result).toBeNull()
  })

  it('returns null when callWithFallback throws', async () => {
    mockCallWithFallback.mockRejectedValueOnce(new Error('AI service unavailable'))

    const result = await generateOutcomeNarrative(BASE_PARAMS)

    expect(result).toBeNull()
  })

  it('passes temperature=0.3 and maxTokens=512 to callWithFallback', async () => {
    await generateOutcomeNarrative(BASE_PARAMS)

    const callArgs = mockCallWithFallback.mock.calls[0][0]
    expect(callArgs.temperature).toBe(0.3)
    expect(callArgs.maxTokens).toBe(512)
  })
})

// ============================================================================
// buildTallySummary — format per voting method (via generateOutcomeNarrative)
// ============================================================================

describe('buildTallySummary — consent method', () => {
  const params = {
    ...BASE_PARAMS,
    votingMethod: 'consent',
    outcome: { totalVotes: 12, counts: { agree: 9, abstain: 2, disagree: 1, block: 0 }, passed: true },
  }

  it('includes agree/abstain/disagree/block counts in prompt', async () => {
    await generateOutcomeNarrative(params)

    const callArgs = mockCallWithFallback.mock.calls[0][0]
    expect(callArgs.userPrompt).toContain('Zustimmung: 9')
    expect(callArgs.userPrompt).toContain('Enthaltung: 2')
    expect(callArgs.userPrompt).toContain('Ablehnung: 1')
    expect(callArgs.userPrompt).toContain('Blockierung: 0')
  })

  it('shows "Angenommen" when passed=true', async () => {
    await generateOutcomeNarrative(params)

    const callArgs = mockCallWithFallback.mock.calls[0][0]
    expect(callArgs.userPrompt).toContain('Angenommen')
  })

  it('shows "Blockiert" when passed=false', async () => {
    await generateOutcomeNarrative({
      ...params,
      outcome: { ...params.outcome, passed: false, counts: { agree: 9, abstain: 2, disagree: 0, block: 1 } },
    })

    const callArgs = mockCallWithFallback.mock.calls[0][0]
    expect(callArgs.userPrompt).toContain('Blockiert')
  })
})

describe('buildTallySummary — simple_majority method', () => {
  it('includes yes/no/abstain counts', async () => {
    await generateOutcomeNarrative(BASE_PARAMS)

    const callArgs = mockCallWithFallback.mock.calls[0][0]
    expect(callArgs.userPrompt).toContain('Ja: 7')
    expect(callArgs.userPrompt).toContain('Nein: 2')
    expect(callArgs.userPrompt).toContain('Enthaltung: 1')
    expect(callArgs.userPrompt).toContain('Angenommen')
  })

  it('shows "Abgelehnt" when passed=false', async () => {
    await generateOutcomeNarrative({
      ...BASE_PARAMS,
      outcome: { totalVotes: 10, counts: { yes: 3, no: 7, abstain: 0 }, passed: false },
    })

    const callArgs = mockCallWithFallback.mock.calls[0][0]
    expect(callArgs.userPrompt).toContain('Abgelehnt')
  })
})

describe('buildTallySummary — ranked/approval/dot/score methods', () => {
  const rankedOutcome = {
    totalVotes: 20,
    ranked: [
      { label: 'Option A', votes: 10 },
      { label: 'Option B', votes: 7 },
      { label: 'Option C', votes: 3 },
    ],
  }

  it('formats top-3 ranked options with approval votes', async () => {
    await generateOutcomeNarrative({
      ...BASE_PARAMS,
      votingMethod: 'approval',
      outcome: rankedOutcome,
    })

    const callArgs = mockCallWithFallback.mock.calls[0][0]
    expect(callArgs.userPrompt).toContain('1. Option A: 10 Stimmen')
    expect(callArgs.userPrompt).toContain('2. Option B: 7 Stimmen')
  })

  it('uses "Punkte" unit for dot method', async () => {
    await generateOutcomeNarrative({
      ...BASE_PARAMS,
      votingMethod: 'dot',
      outcome: { totalVotes: 10, ranked: [{ label: 'A', dots: 8 }] },
    })

    const callArgs = mockCallWithFallback.mock.calls[0][0]
    expect(callArgs.userPrompt).toContain('Punkte')
  })

  it('uses "Borda-Punkte" unit for ranked_choice', async () => {
    await generateOutcomeNarrative({
      ...BASE_PARAMS,
      votingMethod: 'ranked_choice',
      outcome: { totalVotes: 5, ranked: [{ label: 'A', bordaPoints: 12 }] },
    })

    const callArgs = mockCallWithFallback.mock.calls[0][0]
    expect(callArgs.userPrompt).toContain('Borda-Punkte')
  })
})

describe('buildTallySummary — unknown method falls back to total votes', () => {
  it('outputs total votes string for unknown method', async () => {
    await generateOutcomeNarrative({
      ...BASE_PARAMS,
      votingMethod: 'some_future_method',
      outcome: { totalVotes: 15 },
    })

    const callArgs = mockCallWithFallback.mock.calls[0][0]
    expect(callArgs.userPrompt).toContain('15 Stimmen abgegeben')
  })
})
