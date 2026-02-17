import { processProtocolTranscript } from '@/lib/ai/protocol-processing'

jest.mock('@/lib/ai/providers', () => ({
  callWithFallback: jest.fn(),
  extractJson: jest.fn(),
  buildFailureMessage: jest.fn(() => 'fallback used'),
}))

const { callWithFallback, extractJson } = jest.requireMock('@/lib/ai/providers') as {
  callWithFallback: jest.Mock
  extractJson: jest.Mock
}

describe('processProtocolTranscript', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('returns explicit NO_PROVIDER failure when no provider responds', async () => {
    callWithFallback.mockResolvedValue(null)

    const result = await processProtocolTranscript('prompt')

    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.failure.code).toBe('NO_PROVIDER')
      expect(result.failure.retryable).toBe(true)
    }
  })

  it('returns INVALID_JSON when provider response has no JSON', async () => {
    callWithFallback.mockResolvedValue({
      text: 'nope',
      model: 'groq:test',
      provider: 'groq',
      failedProviders: [],
    })
    extractJson.mockReturnValue(null)

    const result = await processProtocolTranscript('prompt')

    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.failure.code).toBe('INVALID_JSON')
    }
  })

  it('returns success with validated notes', async () => {
    callWithFallback.mockResolvedValue({
      text: '{"ok":true}',
      model: 'groq:test',
      provider: 'groq',
      failedProviders: [],
    })
    extractJson.mockReturnValue({
      summary: 's',
      detected_attendees: [],
      topics: [],
      action_items: [],
      follow_ups: [],
    })

    const result = await processProtocolTranscript('prompt')

    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.result.model).toBe('groq:test')
      expect(result.result.notes.summary).toBe('s')
    }
  })
})
