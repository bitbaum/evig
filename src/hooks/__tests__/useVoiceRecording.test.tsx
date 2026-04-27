/**
 * Tests for useVoiceRecording — state machine for microphone-based audio capture.
 *
 * Mission-relevant: warehouse volunteers use voice recording to describe donated
 * devices without typing. A regression in the recording state machine can prevent
 * audio from being captured or cause silent data loss before transcription.
 *
 * Behaviors locked:
 *   - initial state: idle, 0 time, no error, no audioUrl
 *   - startRecording calls getUserMedia with audio constraints
 *   - startRecording transitions state to 'recording'
 *   - startRecording calls mediaRecorder.start(1000)
 *   - getUserMedia failure → state='error', errorMessage set, onError callback fires
 *   - stopRecording from recording → calls stop(), state='stopped'
 *   - stopRecording is a no-op when state='idle'
 *   - pauseRecording from recording → calls pause(), state='paused'
 *   - resumeRecording from paused → calls resume(), state='recording'
 *   - discardRecording → state='idle', audioUrl cleared
 *   - onstop fires onRecordingComplete with blob + duration
 *   - onstop creates blob and sets audioUrl
 *   - timer interval advances recordingTime
 *   - cleanup on unmount stops stream tracks
 */

// ---- Mock declarations (hoisted) ----

jest.mock('@/lib/logger', () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() },
}))

// Mock URL methods — JSDOM doesn't implement these; assign directly
URL.createObjectURL = jest.fn().mockReturnValue('blob:mock-url')
URL.revokeObjectURL = jest.fn()

// MediaRecorder mock —  we need a class whose instances we can inspect
type MockRecorderInstance = {
  start: jest.Mock
  stop: jest.Mock
  pause: jest.Mock
  resume: jest.Mock
  ondataavailable: ((event: { data: { size: number } }) => void) | null
  onstop: (() => void) | null
  mimeType: string
}

let mockMediaRecorder: MockRecorderInstance

class MockMediaRecorder {
  start: jest.Mock
  stop: jest.Mock
  pause: jest.Mock
  resume: jest.Mock
  ondataavailable: ((event: { data: { size: number } }) => void) | null
  onstop: (() => void) | null
  mimeType: string

  constructor(_stream: MediaStream, _options?: { mimeType?: string }) {
    this.start = jest.fn()
    this.stop = jest.fn()
    this.pause = jest.fn()
    this.resume = jest.fn()
    this.ondataavailable = null
    this.onstop = null
    this.mimeType = 'audio/webm'
    mockMediaRecorder = this
  }

  static isTypeSupported = jest.fn().mockReturnValue(true)
}

Object.defineProperty(global, 'MediaRecorder', {
  configurable: true,
  writable: true,
  value: MockMediaRecorder,
})

// Mock stream / track
const mockStopTrack = jest.fn()
const mockStream = {
  getTracks: jest.fn().mockReturnValue([{ stop: mockStopTrack }]),
} as unknown as MediaStream

Object.defineProperty(navigator, 'mediaDevices', {
  configurable: true,
  value: {
    getUserMedia: jest.fn().mockResolvedValue(mockStream),
  },
})

const mockGetUserMedia = navigator.mediaDevices.getUserMedia as jest.MockedFunction<
  typeof navigator.mediaDevices.getUserMedia
>

// ---- Import under test (must be after jest.mock / global setup) ----

import { renderHook, act } from '@testing-library/react'
import { useVoiceRecording } from '../useVoiceRecording'

// ============================================================================
// Setup
// ============================================================================

beforeEach(() => {
  jest.useFakeTimers()

  mockGetUserMedia.mockResolvedValue(mockStream)
  mockStopTrack.mockReset()
  mockStream.getTracks = jest.fn().mockReturnValue([{ stop: mockStopTrack }])
  ;(URL.createObjectURL as jest.Mock).mockReturnValue('blob:mock-url') // reset return value
  ;(URL.revokeObjectURL as jest.Mock).mockClear()
  MockMediaRecorder.isTypeSupported.mockReturnValue(true)
  // Reset instance ref so each test starts clean
  mockMediaRecorder = undefined as unknown as MockRecorderInstance
})

afterEach(() => {
  jest.useRealTimers()
})

// ============================================================================
// Initial state
// ============================================================================

describe('useVoiceRecording — initial state', () => {
  it('starts idle with zero time, no error, no audioUrl', () => {
    const { result } = renderHook(() =>
      useVoiceRecording({ maxDuration: 120 }),
    )
    expect(result.current.state).toBe('idle')
    expect(result.current.recordingTime).toBe(0)
    expect(result.current.errorMessage).toBeNull()
    expect(result.current.audioUrl).toBeNull()
  })
})

// ============================================================================
// startRecording — happy path
// ============================================================================

describe('startRecording — happy path', () => {
  it('calls navigator.mediaDevices.getUserMedia with audio constraints', async () => {
    const { result } = renderHook(() =>
      useVoiceRecording({ maxDuration: 120 }),
    )

    await act(async () => {
      await result.current.startRecording()
    })

    expect(mockGetUserMedia).toHaveBeenCalledWith({
      audio: { channelCount: 1, sampleRate: 16000 },
    })
  })

  it('transitions state to "recording"', async () => {
    const { result } = renderHook(() =>
      useVoiceRecording({ maxDuration: 120 }),
    )

    await act(async () => {
      await result.current.startRecording()
    })

    expect(result.current.state).toBe('recording')
  })

  it('calls mediaRecorder.start(1000)', async () => {
    const { result } = renderHook(() =>
      useVoiceRecording({ maxDuration: 120 }),
    )

    await act(async () => {
      await result.current.startRecording()
    })

    expect(mockMediaRecorder.start).toHaveBeenCalledWith(1000)
  })
})

// ============================================================================
// startRecording — failure
// ============================================================================

describe('startRecording — failure', () => {
  it('sets state to "error" when getUserMedia rejects', async () => {
    mockGetUserMedia.mockRejectedValueOnce(new Error('Permission denied'))

    const { result } = renderHook(() =>
      useVoiceRecording({ maxDuration: 120 }),
    )

    await act(async () => {
      await result.current.startRecording()
    })

    expect(result.current.state).toBe('error')
  })

  it('sets errorMessage to "Mikrofon konnte nicht aktiviert werden"', async () => {
    mockGetUserMedia.mockRejectedValueOnce(new Error('Permission denied'))

    const { result } = renderHook(() =>
      useVoiceRecording({ maxDuration: 120 }),
    )

    await act(async () => {
      await result.current.startRecording()
    })

    expect(result.current.errorMessage).toBe('Mikrofon konnte nicht aktiviert werden')
  })

  it('fires onError callback with the error message', async () => {
    mockGetUserMedia.mockRejectedValueOnce(new Error('Permission denied'))
    const onError = jest.fn()

    const { result } = renderHook(() =>
      useVoiceRecording({ maxDuration: 120, onError }),
    )

    await act(async () => {
      await result.current.startRecording()
    })

    expect(onError).toHaveBeenCalledWith('Mikrofon konnte nicht aktiviert werden')
  })
})

// ============================================================================
// stopRecording
// ============================================================================

describe('stopRecording', () => {
  it('calls mediaRecorder.stop() from recording state', async () => {
    const { result } = renderHook(() =>
      useVoiceRecording({ maxDuration: 120 }),
    )

    await act(async () => {
      await result.current.startRecording()
    })

    act(() => {
      result.current.stopRecording()
    })

    expect(mockMediaRecorder.stop).toHaveBeenCalledTimes(1)
  })

  it('transitions state to "stopped"', async () => {
    const { result } = renderHook(() =>
      useVoiceRecording({ maxDuration: 120 }),
    )

    await act(async () => {
      await result.current.startRecording()
    })

    act(() => {
      result.current.stopRecording()
    })

    expect(result.current.state).toBe('stopped')
  })

  it('is a no-op when state is idle (does not call stop)', () => {
    const { result } = renderHook(() =>
      useVoiceRecording({ maxDuration: 120 }),
    )

    // mediaRecorder is not set when we never started, so just ensure no crash
    expect(() => {
      act(() => {
        result.current.stopRecording()
      })
    }).not.toThrow()

    expect(result.current.state).toBe('idle')
  })
})

// ============================================================================
// pauseRecording
// ============================================================================

describe('pauseRecording', () => {
  it('calls mediaRecorder.pause() from recording state', async () => {
    const { result } = renderHook(() =>
      useVoiceRecording({ maxDuration: 120 }),
    )

    await act(async () => {
      await result.current.startRecording()
    })

    act(() => {
      result.current.pauseRecording()
    })

    expect(mockMediaRecorder.pause).toHaveBeenCalledTimes(1)
  })

  it('transitions state to "paused"', async () => {
    const { result } = renderHook(() =>
      useVoiceRecording({ maxDuration: 120 }),
    )

    await act(async () => {
      await result.current.startRecording()
    })

    act(() => {
      result.current.pauseRecording()
    })

    expect(result.current.state).toBe('paused')
  })
})

// ============================================================================
// resumeRecording
// ============================================================================

describe('resumeRecording', () => {
  it('calls mediaRecorder.resume() from paused state', async () => {
    const { result } = renderHook(() =>
      useVoiceRecording({ maxDuration: 120 }),
    )

    await act(async () => {
      await result.current.startRecording()
    })
    act(() => {
      result.current.pauseRecording()
    })

    act(() => {
      result.current.resumeRecording()
    })

    expect(mockMediaRecorder.resume).toHaveBeenCalledTimes(1)
  })

  it('transitions state back to "recording"', async () => {
    const { result } = renderHook(() =>
      useVoiceRecording({ maxDuration: 120 }),
    )

    await act(async () => {
      await result.current.startRecording()
    })
    act(() => {
      result.current.pauseRecording()
    })
    act(() => {
      result.current.resumeRecording()
    })

    expect(result.current.state).toBe('recording')
  })
})

// ============================================================================
// discardRecording
// ============================================================================

describe('discardRecording', () => {
  it('resets state to "idle"', async () => {
    const { result } = renderHook(() =>
      useVoiceRecording({ maxDuration: 120 }),
    )

    await act(async () => {
      await result.current.startRecording()
    })
    act(() => {
      result.current.stopRecording()
    })
    act(() => {
      result.current.discardRecording()
    })

    expect(result.current.state).toBe('idle')
  })

  it('clears audioUrl', async () => {
    const onRecordingComplete = jest.fn()
    const { result } = renderHook(() =>
      useVoiceRecording({ maxDuration: 120, onRecordingComplete }),
    )

    await act(async () => {
      await result.current.startRecording()
    })

    // Manually fire onstop to get an audioUrl set
    act(() => {
      mockMediaRecorder.onstop?.()
    })
    expect(result.current.audioUrl).toBe('blob:mock-url')

    act(() => {
      result.current.discardRecording()
    })

    expect(result.current.audioUrl).toBeNull()
  })
})

// ============================================================================
// onstop handler
// ============================================================================

describe('onstop handler', () => {
  it('fires onRecordingComplete callback with blob and duration', async () => {
    const onRecordingComplete = jest.fn()
    const { result } = renderHook(() =>
      useVoiceRecording({ maxDuration: 120, onRecordingComplete }),
    )

    await act(async () => {
      await result.current.startRecording()
    })

    act(() => {
      mockMediaRecorder.onstop?.()
    })

    expect(onRecordingComplete).toHaveBeenCalledTimes(1)
    // First arg is a Blob, second is the duration (number)
    expect(onRecordingComplete.mock.calls[0][0]).toBeInstanceOf(Blob)
    expect(typeof onRecordingComplete.mock.calls[0][1]).toBe('number')
  })

  it('creates blob and sets audioUrl', async () => {
    const { result } = renderHook(() =>
      useVoiceRecording({ maxDuration: 120 }),
    )

    await act(async () => {
      await result.current.startRecording()
    })

    act(() => {
      mockMediaRecorder.onstop?.()
    })

    expect(URL.createObjectURL).toHaveBeenCalled()
    expect(result.current.audioUrl).toBe('blob:mock-url')
  })
})

// ============================================================================
// Timer
// ============================================================================

describe('timer', () => {
  it('advances recordingTime when timer ticks', async () => {
    const { result } = renderHook(() =>
      useVoiceRecording({ maxDuration: 120 }),
    )

    await act(async () => {
      await result.current.startRecording()
    })

    act(() => {
      jest.advanceTimersByTime(500) // 5 × 100ms ticks
    })

    // Each tick adds 0.1, so 5 ticks ≈ 0.5 (floating point; check > 0)
    expect(result.current.recordingTime).toBeGreaterThan(0)
  })
})

// ============================================================================
// Cleanup on unmount
// ============================================================================

describe('cleanup on unmount', () => {
  it('stops stream tracks when hook unmounts', async () => {
    const { result, unmount } = renderHook(() =>
      useVoiceRecording({ maxDuration: 120 }),
    )

    await act(async () => {
      await result.current.startRecording()
    })

    unmount()

    // The cleanup path calls stream.getTracks().forEach(t => t.stop())
    expect(mockStopTrack).toHaveBeenCalled()
  })
})
