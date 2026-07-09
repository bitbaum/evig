/**
 * Tests for useVoiceProduct — the canonical blob→product voice hook.
 *
 * Posts to /api/admin/erfassung/voice with the audio FormData and returns
 * { transcription, data, metadata } inline (promise-based, not callbacks), so
 * <VoiceEntry> can compose it with useVoiceRecording. (The old callback-based
 * useVoiceTranscription sibling was removed as a redundant duplicate.)
 *
 * Behaviors locked:
 *   - POSTs FormData with audio blob filename "recording.webm" (whisper API)
 *   - returns { transcription, data } on success
 *   - returns null on failure (sets error state)
 *   - "Unbekannter Fehler" Swiss-German fallback when error missing
 *   - "Verarbeitung fehlgeschlagen" fallback for non-Error throws
 *   - thrown Error.message preserved
 *   - clears previous error on new attempt
 *   - isProcessing lifecycle (true mid-flight, false after via finally)
 */

const mockApiFetch = jest.fn()

jest.mock('@/lib/api/client', () => ({
  apiFetch: (...args: unknown[]) => mockApiFetch.apply(null, args),
}))

jest.mock('@/lib/logger', () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() },
}))

import { renderHook, act, waitFor } from '@testing-library/react'
import { useVoiceProduct } from '../useVoiceProduct'

const mockBlob = new Blob(['fake audio'], { type: 'audio/webm' })

const okResult = {
  success: true,
  data: {
    transcription: 'Apple MacBook Pro vierzehn Zoll',
    data: { produktname: 'MacBook Pro 14"', hersteller: 'Apple' },
  },
}

beforeEach(() => {
  mockApiFetch.mockReset()
})

// ============================================================================
// Initial state
// ============================================================================

describe('useVoiceProduct — initial state', () => {
  it('starts not processing with no error', () => {
    const { result } = renderHook(() => useVoiceProduct())
    expect(result.current.isProcessing).toBe(false)
    expect(result.current.error).toBeNull()
  })
})

// ============================================================================
// Happy path
// ============================================================================

describe('processRecording — happy path', () => {
  it('POSTs to /api/admin/erfassung/voice as FormData with audio', async () => {
    mockApiFetch.mockResolvedValueOnce(okResult)
    const { result } = renderHook(() => useVoiceProduct())

    await act(async () => {
      await result.current.processRecording(mockBlob)
    })

    const [url, options] = mockApiFetch.mock.calls[0]
    expect(url).toBe('/api/admin/erfassung/voice')
    expect(options.method).toBe('POST')
    expect(options.formData).toBe(true)
    expect(options.body).toBeInstanceOf(FormData)
  })

  it('appends audio with filename "recording.webm" (whisper API contract)', async () => {
    mockApiFetch.mockResolvedValueOnce(okResult)
    const { result } = renderHook(() => useVoiceProduct())

    await act(async () => {
      await result.current.processRecording(mockBlob)
    })

    const fd = mockApiFetch.mock.calls[0][1].body as FormData
    const file = fd.get('audio') as File
    expect(file.name).toBe('recording.webm')
  })

  it('returns { transcription, data } on success', async () => {
    mockApiFetch.mockResolvedValueOnce(okResult)
    const { result } = renderHook(() => useVoiceProduct())

    let voiceResult: Awaited<ReturnType<typeof result.current.processRecording>> = null
    await act(async () => {
      voiceResult = await result.current.processRecording(mockBlob)
    })

    expect(voiceResult).toEqual({
      transcription: 'Apple MacBook Pro vierzehn Zoll',
      data: { produktname: 'MacBook Pro 14"', hersteller: 'Apple' },
    })
  })

  it('error is null after success', async () => {
    mockApiFetch.mockResolvedValueOnce(okResult)
    const { result } = renderHook(() => useVoiceProduct())

    await act(async () => {
      await result.current.processRecording(mockBlob)
    })

    expect(result.current.error).toBeNull()
  })
})

// ============================================================================
// Failure paths
// ============================================================================

describe('processRecording — failure paths', () => {
  it('success=false → returns null and sets error from result.error', async () => {
    mockApiFetch.mockResolvedValueOnce({ success: false, error: 'Audio invalid' })
    const { result } = renderHook(() => useVoiceProduct())

    let voiceResult: Awaited<ReturnType<typeof result.current.processRecording>> = undefined as never
    await act(async () => {
      voiceResult = await result.current.processRecording(mockBlob)
    })

    expect(voiceResult).toBeNull()
    expect(result.current.error).toBe('Audio invalid')
  })

  it('success=false without error → "Unbekannter Fehler" Swiss-German fallback', async () => {
    mockApiFetch.mockResolvedValueOnce({ success: false })
    const { result } = renderHook(() => useVoiceProduct())

    await act(async () => {
      await result.current.processRecording(mockBlob)
    })

    expect(result.current.error).toBe('Unbekannter Fehler')
  })

  it('success=true but data missing → returns null with fallback error (defensive guard)', async () => {
    mockApiFetch.mockResolvedValueOnce({ success: true })
    const { result } = renderHook(() => useVoiceProduct())

    let voiceResult: Awaited<ReturnType<typeof result.current.processRecording>> = undefined as never
    await act(async () => {
      voiceResult = await result.current.processRecording(mockBlob)
    })

    expect(voiceResult).toBeNull()
    expect(result.current.error).toBe('Unbekannter Fehler')
  })

  it('thrown Error → preserves message in error state', async () => {
    mockApiFetch.mockRejectedValueOnce(new Error('Network unreachable'))
    const { result } = renderHook(() => useVoiceProduct())

    await act(async () => {
      await result.current.processRecording(mockBlob)
    })

    expect(result.current.error).toBe('Network unreachable')
  })

  it('non-Error throw → "Verarbeitung fehlgeschlagen" Swiss-German fallback', async () => {
    mockApiFetch.mockRejectedValueOnce('weird non-Error throw')
    const { result } = renderHook(() => useVoiceProduct())

    await act(async () => {
      await result.current.processRecording(mockBlob)
    })

    expect(result.current.error).toBe('Verarbeitung fehlgeschlagen')
  })
})

// ============================================================================
// State management
// ============================================================================

describe('processRecording — state management', () => {
  it('clears previous error on new attempt', async () => {
    mockApiFetch
      .mockResolvedValueOnce({ success: false, error: 'first error' })
      .mockResolvedValueOnce(okResult)
    const { result } = renderHook(() => useVoiceProduct())

    await act(async () => {
      await result.current.processRecording(mockBlob)
    })
    expect(result.current.error).toBe('first error')

    await act(async () => {
      await result.current.processRecording(mockBlob)
    })
    expect(result.current.error).toBeNull()
  })

  it('isProcessing flips true mid-flight, false after success', async () => {
    let resolveRequest!: (val: unknown) => void
    mockApiFetch.mockReturnValueOnce(new Promise(r => { resolveRequest = r }))
    const { result } = renderHook(() => useVoiceProduct())

    let processPromise!: Promise<unknown>
    act(() => {
      processPromise = result.current.processRecording(mockBlob)
    })

    await waitFor(() => expect(result.current.isProcessing).toBe(true))

    await act(async () => {
      resolveRequest(okResult)
      await processPromise
    })

    expect(result.current.isProcessing).toBe(false)
  })

  it('isProcessing flips back to false even after error (finally)', async () => {
    mockApiFetch.mockRejectedValueOnce(new Error('boom'))
    const { result } = renderHook(() => useVoiceProduct())

    await act(async () => {
      await result.current.processRecording(mockBlob)
    })

    expect(result.current.isProcessing).toBe(false)
  })
})
