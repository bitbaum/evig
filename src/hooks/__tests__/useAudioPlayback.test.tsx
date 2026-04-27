/**
 * Tests for useAudioPlayback — controls playback of a recorded audio URL.
 *
 * Mission-relevant: after a warehouse volunteer records a device description,
 * they can play it back before submitting for transcription. A regression here
 * means they can't verify the recording and lose trust in the voice workflow.
 *
 * Behaviors locked:
 *   - initial state: isPlaying=false, playbackTime=0
 *   - togglePlayback is a no-op when audioUrl is null
 *   - togglePlayback calls audio.play() and sets isPlaying=true
 *   - togglePlayback calls audio.pause() and sets isPlaying=false when already playing
 *   - resetPlayback calls audio.pause(), resets isPlaying and playbackTime
 *   - resetPlayback is safe when audioUrl is null (no crash)
 *   - ontimeupdate handler updates playbackTime from audio.currentTime
 *   - onended handler sets isPlaying=false and playbackTime=0
 *   - Audio(url) is constructed with the provided url
 *   - cleanup on unmount calls audio.pause()
 */

type MockAudioInstance = {
  play: jest.Mock
  pause: jest.Mock
  currentTime: number
  ontimeupdate: (() => void) | null
  onended: (() => void) | null
}

let mockAudioInstance: MockAudioInstance

// Set up the Audio constructor mock at module level so it's in place before
// any renderHook call creates a hook (the useEffect runs synchronously in JSDOM).
Object.defineProperty(global, 'Audio', {
  configurable: true,
  writable: true,
  value: jest.fn().mockImplementation(() => {
    mockAudioInstance = {
      play: jest.fn().mockResolvedValue(undefined),
      pause: jest.fn(),
      currentTime: 0,
      ontimeupdate: null,
      onended: null,
    }
    return mockAudioInstance
  }),
})

import { renderHook, act } from '@testing-library/react'
import { useAudioPlayback } from '../useAudioPlayback'

const MockAudio = global.Audio as jest.MockedFunction<typeof Audio>

beforeEach(() => {
  MockAudio.mockClear()
  // Reset the instance so each test gets a fresh one via its own renderHook
  mockAudioInstance = undefined as unknown as MockAudioInstance
})

// ============================================================================
// Initial state
// ============================================================================

describe('useAudioPlayback — initial state', () => {
  it('starts with isPlaying=false and playbackTime=0', () => {
    const { result } = renderHook(() => useAudioPlayback(null))
    expect(result.current.isPlaying).toBe(false)
    expect(result.current.playbackTime).toBe(0)
  })
})

// ============================================================================
// togglePlayback
// ============================================================================

describe('togglePlayback', () => {
  it('is a no-op when audioUrl is null (play is not called, isPlaying stays false)', () => {
    const { result } = renderHook(() => useAudioPlayback(null))
    act(() => {
      result.current.togglePlayback()
    })
    // No Audio instance created, no play call
    expect(result.current.isPlaying).toBe(false)
  })

  it('calls audio.play() when not already playing', async () => {
    const { result } = renderHook(() => useAudioPlayback('blob:mock-url'))
    await act(async () => {
      result.current.togglePlayback()
    })
    expect(mockAudioInstance.play).toHaveBeenCalledTimes(1)
  })

  it('sets isPlaying=true after play', async () => {
    const { result } = renderHook(() => useAudioPlayback('blob:mock-url'))
    await act(async () => {
      result.current.togglePlayback()
    })
    expect(result.current.isPlaying).toBe(true)
  })

  it('calls audio.pause() when already playing', async () => {
    const { result } = renderHook(() => useAudioPlayback('blob:mock-url'))

    // First toggle: start playing
    await act(async () => {
      result.current.togglePlayback()
    })
    expect(result.current.isPlaying).toBe(true)

    // Second toggle: pause
    act(() => {
      result.current.togglePlayback()
    })
    expect(mockAudioInstance.pause).toHaveBeenCalledTimes(1)
  })

  it('sets isPlaying=false after pause', async () => {
    const { result } = renderHook(() => useAudioPlayback('blob:mock-url'))

    await act(async () => {
      result.current.togglePlayback()
    })

    act(() => {
      result.current.togglePlayback()
    })

    expect(result.current.isPlaying).toBe(false)
  })
})

// ============================================================================
// resetPlayback
// ============================================================================

describe('resetPlayback', () => {
  it('calls audio.pause()', async () => {
    const { result } = renderHook(() => useAudioPlayback('blob:mock-url'))

    // Start playing so there is an active audio instance
    await act(async () => {
      result.current.togglePlayback()
    })

    act(() => {
      result.current.resetPlayback()
    })

    expect(mockAudioInstance.pause).toHaveBeenCalled()
  })

  it('sets isPlaying=false', async () => {
    const { result } = renderHook(() => useAudioPlayback('blob:mock-url'))

    await act(async () => {
      result.current.togglePlayback()
    })

    act(() => {
      result.current.resetPlayback()
    })

    expect(result.current.isPlaying).toBe(false)
  })

  it('sets playbackTime=0', async () => {
    const { result } = renderHook(() => useAudioPlayback('blob:mock-url'))

    await act(async () => {
      result.current.togglePlayback()
    })

    // Simulate timer advancing
    act(() => {
      mockAudioInstance.currentTime = 5
      mockAudioInstance.ontimeupdate?.()
    })
    expect(result.current.playbackTime).toBe(5)

    act(() => {
      result.current.resetPlayback()
    })

    expect(result.current.playbackTime).toBe(0)
  })

  it('is safe to call when audioUrl is null (no crash)', () => {
    const { result } = renderHook(() => useAudioPlayback(null))
    expect(() => {
      act(() => {
        result.current.resetPlayback()
      })
    }).not.toThrow()
  })
})

// ============================================================================
// Event handlers set on the Audio element
// ============================================================================

describe('Audio event handlers', () => {
  it('ontimeupdate handler updates playbackTime from audio.currentTime', () => {
    const { result } = renderHook(() => useAudioPlayback('blob:mock-url'))

    act(() => {
      mockAudioInstance.currentTime = 3.7
      mockAudioInstance.ontimeupdate?.()
    })

    expect(result.current.playbackTime).toBe(3.7)
  })

  it('onended handler sets isPlaying=false', async () => {
    const { result } = renderHook(() => useAudioPlayback('blob:mock-url'))

    await act(async () => {
      result.current.togglePlayback()
    })
    expect(result.current.isPlaying).toBe(true)

    act(() => {
      mockAudioInstance.onended?.()
    })

    expect(result.current.isPlaying).toBe(false)
  })

  it('onended handler sets playbackTime=0', async () => {
    const { result } = renderHook(() => useAudioPlayback('blob:mock-url'))

    await act(async () => {
      result.current.togglePlayback()
    })

    act(() => {
      mockAudioInstance.currentTime = 10
      mockAudioInstance.ontimeupdate?.()
    })
    expect(result.current.playbackTime).toBe(10)

    act(() => {
      mockAudioInstance.onended?.()
    })

    expect(result.current.playbackTime).toBe(0)
  })
})

// ============================================================================
// Audio constructor
// ============================================================================

describe('Audio constructor', () => {
  it('constructs Audio with the provided url when effect runs', () => {
    renderHook(() => useAudioPlayback('blob:test-url'))
    expect(MockAudio).toHaveBeenCalledWith('blob:test-url')
  })
})

// ============================================================================
// Cleanup on unmount
// ============================================================================

describe('cleanup on unmount', () => {
  it('calls audio.pause() when the hook unmounts', async () => {
    const { result, unmount } = renderHook(() => useAudioPlayback('blob:mock-url'))

    // Ensure audio instance is created by triggering a play
    await act(async () => {
      result.current.togglePlayback()
    })

    const instance = mockAudioInstance
    unmount()

    expect(instance.pause).toHaveBeenCalled()
  })
})
