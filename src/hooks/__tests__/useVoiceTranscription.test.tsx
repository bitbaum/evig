/**
 * Tests for useVoiceTranscription — submits audio for transcription
 * via POST /api/admin/erfassung/voice (multipart FormData).
 *
 * Mission-relevant: voice intake is an alternative to keyboard typing
 * for staff doing donation triage in the warehouse — they can describe
 * a device while looking at it. A regression here breaks the
 * accessibility/speed alternative to typing.
 *
 * Behaviors locked:
 *   - submitForTranscription POSTs as FormData with audio file
 *   - apiFetch called with formData: true flag
 *   - 4 callback paths fire on success: onTranscription, onTranscriptionComplete,
 *     onSuccess (in addition to setting transcribedText state)
 *   - failure → onError invoked, returns false
 *   - "Unbekannter Fehler" Swiss-German fallback when error missing
 *   - thrown error.message preserved
 *   - "Verarbeitung fehlgeschlagen" fallback for non-Error throws
 *   - isProcessing lifecycle (true mid-flight, false after via finally)
 *   - all callbacks are optional (no crash when omitted)
 */

const mockApiFetch = jest.fn()

jest.mock('@/lib/api/client', () => ({
  apiFetch: (...args: unknown[]) => mockApiFetch.apply(null, args),
}))

jest.mock('@/lib/logger', () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() },
}))

import { renderHook, act, waitFor } from '@testing-library/react'
import { useVoiceTranscription } from '../useVoiceTranscription'

const mockBlob = new Blob(['fake audio data'], { type: 'audio/webm' })

const validResponse = {
  transcription: 'Apple MacBook Pro vierzehn Zoll',
  data: { produktname: 'MacBook Pro 14"', hersteller: 'Apple' },
  metadata: { confidence: 0.92 },
}

beforeEach(() => {
  mockApiFetch.mockReset()
})

// ============================================================================
// Initial state
// ============================================================================

describe('useVoiceTranscription — initial state', () => {
  it('starts with no transcribed text and not processing', () => {
    const { result } = renderHook(() => useVoiceTranscription({}))
    expect(result.current.transcribedText).toBeNull()
    expect(result.current.isProcessing).toBe(false)
  })
})

// ============================================================================
// Happy path
// ============================================================================

describe('submitForTranscription — happy path', () => {
  it('POSTs to /api/admin/erfassung/voice with FormData containing audio', async () => {
    mockApiFetch.mockResolvedValueOnce({ success: true, data: validResponse })

    const { result } = renderHook(() => useVoiceTranscription({}))

    await act(async () => {
      await result.current.submitForTranscription(mockBlob)
    })

    expect(mockApiFetch).toHaveBeenCalledTimes(1)
    const [url, options] = mockApiFetch.mock.calls[0]
    expect(url).toBe('/api/admin/erfassung/voice')
    expect(options.method).toBe('POST')
    expect(options.formData).toBe(true)
    expect(options.body).toBeInstanceOf(FormData)
  })

  it('appends audio blob to FormData with filename "recording.webm"', async () => {
    mockApiFetch.mockResolvedValueOnce({ success: true, data: validResponse })

    const { result } = renderHook(() => useVoiceTranscription({}))

    await act(async () => {
      await result.current.submitForTranscription(mockBlob)
    })

    const fd = mockApiFetch.mock.calls[0][1].body as FormData
    const file = fd.get('audio') as File
    expect(file).toBeTruthy()
    // FormData.append(name, blob, filename) → file.name = filename
    expect(file.name).toBe('recording.webm')
  })

  it('returns true on success', async () => {
    mockApiFetch.mockResolvedValueOnce({ success: true, data: validResponse })

    const { result } = renderHook(() => useVoiceTranscription({}))

    let ok = false
    await act(async () => {
      ok = await result.current.submitForTranscription(mockBlob)
    })

    expect(ok).toBe(true)
  })

  it('sets transcribedText state from response', async () => {
    mockApiFetch.mockResolvedValueOnce({ success: true, data: validResponse })

    const { result } = renderHook(() => useVoiceTranscription({}))

    await act(async () => {
      await result.current.submitForTranscription(mockBlob)
    })

    expect(result.current.transcribedText).toBe('Apple MacBook Pro vierzehn Zoll')
  })
})

// ============================================================================
// Callback fan-out on success
// ============================================================================

describe('submitForTranscription — callbacks', () => {
  it('fires onTranscription with transcription text on success', async () => {
    mockApiFetch.mockResolvedValueOnce({ success: true, data: validResponse })
    const onTranscription = jest.fn()
    const { result } = renderHook(() => useVoiceTranscription({ onTranscription }))

    await act(async () => {
      await result.current.submitForTranscription(mockBlob)
    })

    expect(onTranscription).toHaveBeenCalledWith('Apple MacBook Pro vierzehn Zoll')
  })

  it('fires onTranscriptionComplete with data + metadata on success', async () => {
    mockApiFetch.mockResolvedValueOnce({ success: true, data: validResponse })
    const onTranscriptionComplete = jest.fn()
    const { result } = renderHook(() =>
      useVoiceTranscription({ onTranscriptionComplete }),
    )

    await act(async () => {
      await result.current.submitForTranscription(mockBlob)
    })

    expect(onTranscriptionComplete).toHaveBeenCalledWith(
      { produktname: 'MacBook Pro 14"', hersteller: 'Apple' },
      { confidence: 0.92 },
    )
  })

  it('fires onSuccess on success', async () => {
    mockApiFetch.mockResolvedValueOnce({ success: true, data: validResponse })
    const onSuccess = jest.fn()
    const { result } = renderHook(() => useVoiceTranscription({ onSuccess }))

    await act(async () => {
      await result.current.submitForTranscription(mockBlob)
    })

    expect(onSuccess).toHaveBeenCalledTimes(1)
  })

  it('omitted callbacks do NOT throw (optional)', async () => {
    mockApiFetch.mockResolvedValueOnce({ success: true, data: validResponse })

    const { result } = renderHook(() => useVoiceTranscription({}))

    // No callbacks provided — must not throw
    await expect(
      act(async () => {
        await result.current.submitForTranscription(mockBlob)
      }),
    ).resolves.not.toThrow()
  })
})

// ============================================================================
// Failure paths
// ============================================================================

describe('submitForTranscription — failure paths', () => {
  it('returns false and fires onError when result.success is false', async () => {
    mockApiFetch.mockResolvedValueOnce({ success: false, error: 'Audio too long' })
    const onError = jest.fn()
    const { result } = renderHook(() => useVoiceTranscription({ onError }))

    let ok = true
    await act(async () => {
      ok = await result.current.submitForTranscription(mockBlob)
    })

    expect(ok).toBe(false)
    expect(onError).toHaveBeenCalledWith('Audio too long')
  })

  it('uses "Unbekannter Fehler" Swiss-German fallback when error missing', async () => {
    mockApiFetch.mockResolvedValueOnce({ success: false })
    const onError = jest.fn()
    const { result } = renderHook(() => useVoiceTranscription({ onError }))

    await act(async () => {
      await result.current.submitForTranscription(mockBlob)
    })

    expect(onError).toHaveBeenCalledWith('Unbekannter Fehler')
  })

  it('returns false when result.data is missing (defensive guard)', async () => {
    // Defensive: success=true but data is null/undefined
    mockApiFetch.mockResolvedValueOnce({ success: true })
    const onError = jest.fn()
    const { result } = renderHook(() => useVoiceTranscription({ onError }))

    let ok = true
    await act(async () => {
      ok = await result.current.submitForTranscription(mockBlob)
    })

    expect(ok).toBe(false)
    expect(onError).toHaveBeenCalled()
  })

  it('thrown Error → preserves message in onError callback', async () => {
    mockApiFetch.mockRejectedValueOnce(new Error('Network unreachable'))
    const onError = jest.fn()
    const { result } = renderHook(() => useVoiceTranscription({ onError }))

    await act(async () => {
      await result.current.submitForTranscription(mockBlob)
    })

    expect(onError).toHaveBeenCalledWith('Network unreachable')
  })

  it('non-Error throw → "Verarbeitung fehlgeschlagen" Swiss-German fallback', async () => {
    mockApiFetch.mockRejectedValueOnce('weird non-Error throw')
    const onError = jest.fn()
    const { result } = renderHook(() => useVoiceTranscription({ onError }))

    await act(async () => {
      await result.current.submitForTranscription(mockBlob)
    })

    expect(onError).toHaveBeenCalledWith('Verarbeitung fehlgeschlagen')
  })

  it('does NOT call success callbacks on failure', async () => {
    mockApiFetch.mockResolvedValueOnce({ success: false, error: 'x' })
    const onTranscription = jest.fn()
    const onTranscriptionComplete = jest.fn()
    const onSuccess = jest.fn()

    const { result } = renderHook(() =>
      useVoiceTranscription({ onTranscription, onTranscriptionComplete, onSuccess }),
    )

    await act(async () => {
      await result.current.submitForTranscription(mockBlob)
    })

    expect(onTranscription).not.toHaveBeenCalled()
    expect(onTranscriptionComplete).not.toHaveBeenCalled()
    expect(onSuccess).not.toHaveBeenCalled()
  })
})

// ============================================================================
// isProcessing lifecycle
// ============================================================================

describe('isProcessing lifecycle', () => {
  it('flips true mid-flight, false after success', async () => {
    let resolveRequest!: (val: unknown) => void
    mockApiFetch.mockReturnValueOnce(new Promise(r => { resolveRequest = r }))

    const { result } = renderHook(() => useVoiceTranscription({}))

    let submitPromise!: Promise<unknown>
    act(() => {
      submitPromise = result.current.submitForTranscription(mockBlob)
    })

    await waitFor(() => expect(result.current.isProcessing).toBe(true))

    await act(async () => {
      resolveRequest({ success: true, data: validResponse })
      await submitPromise
    })

    expect(result.current.isProcessing).toBe(false)
  })

  it('flips back to false even after error (finally block)', async () => {
    mockApiFetch.mockRejectedValueOnce(new Error('boom'))

    const { result } = renderHook(() => useVoiceTranscription({}))

    await act(async () => {
      await result.current.submitForTranscription(mockBlob)
    })

    expect(result.current.isProcessing).toBe(false)
  })
})

// ============================================================================
// setTranscribedText
// ============================================================================

describe('setTranscribedText', () => {
  it('externally sets transcribedText (caller can clear or override)', () => {
    const { result } = renderHook(() => useVoiceTranscription({}))

    act(() => {
      result.current.setTranscribedText('manual override')
    })

    expect(result.current.transcribedText).toBe('manual override')

    act(() => {
      result.current.setTranscribedText(null)
    })

    expect(result.current.transcribedText).toBeNull()
  })
})
