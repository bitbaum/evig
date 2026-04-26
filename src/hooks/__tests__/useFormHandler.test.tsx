/**
 * Tests for useFormHandler — the SSOT generic form-state hook used by
 * 10+ admin form hooks (blog, location, service, product, workshop, …).
 *
 * Drives every admin "create or edit" page in the app. A regression
 * here breaks every admin form simultaneously.
 *
 * Behaviors locked:
 *   - updateField immutability (spreads prev, doesn't mutate)
 *   - handleSubmit preventDefault on the form event
 *   - validate gate runs before transform/apiFetch (returns early on
 *     non-null error)
 *   - transformBeforeSubmit applied to data before send
 *   - isEdit routing: URL = `${apiEndpoint}/${editId}` with editMethod
 *   - !isEdit routing: URL = apiEndpoint with createMethod
 *   - success path: setSuccess + onSuccess callback + delayed redirect
 *   - failure path: setError from result.error or fallback
 *   - exception path: caught, sets generic error message (German)
 *   - submitCustom bypasses transformBeforeSubmit (caller-supplied payload)
 *   - reset returns to initialData and clears error/success
 *   - isSubmitting true during async, false after (success or failure)
 */

const mockRouterPush = jest.fn()
const mockRouterRefresh = jest.fn()
const mockApiFetch = jest.fn()

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockRouterPush, refresh: mockRouterRefresh }),
}))

jest.mock('@/lib/api/client', () => ({
  apiFetch: (...args: unknown[]) => mockApiFetch(...args),
}))

import { renderHook, act, waitFor } from '@testing-library/react'
import { useFormHandler } from '../useFormHandler'

interface SampleData {
  name: string
  count: number
}

const initialData: SampleData = { name: '', count: 0 }

beforeEach(() => {
  mockRouterPush.mockReset()
  mockRouterRefresh.mockReset()
  mockApiFetch.mockReset()
})

// ============================================================================
// Initial state
// ============================================================================

describe('useFormHandler — initial state', () => {
  it('starts with initialData, no error, no success, not submitting', () => {
    const { result } = renderHook(() =>
      useFormHandler<SampleData>({
        initialData,
        apiEndpoint: '/api/test',
      }),
    )

    expect(result.current.data).toEqual(initialData)
    expect(result.current.error).toBe('')
    expect(result.current.success).toBe('')
    expect(result.current.isSubmitting).toBe(false)
  })
})

// ============================================================================
// updateField
// ============================================================================

describe('updateField', () => {
  it('updates a single field while preserving others', () => {
    const { result } = renderHook(() =>
      useFormHandler<SampleData>({
        initialData: { name: 'Anna', count: 5 },
        apiEndpoint: '/api/test',
      }),
    )

    act(() => {
      result.current.updateField('name', 'Bob')
    })

    expect(result.current.data).toEqual({ name: 'Bob', count: 5 })
  })

  it('does not mutate the initialData reference', () => {
    const initial = { name: 'Anna', count: 5 }
    const { result } = renderHook(() =>
      useFormHandler<SampleData>({ initialData: initial, apiEndpoint: '/api/test' }),
    )

    act(() => {
      result.current.updateField('name', 'Bob')
    })

    // initialData reference must remain unchanged
    expect(initial).toEqual({ name: 'Anna', count: 5 })
  })

  it('multiple updates compose correctly', () => {
    const { result } = renderHook(() =>
      useFormHandler<SampleData>({ initialData, apiEndpoint: '/api/test' }),
    )

    act(() => {
      result.current.updateField('name', 'Anna')
    })
    act(() => {
      result.current.updateField('count', 42)
    })

    expect(result.current.data).toEqual({ name: 'Anna', count: 42 })
  })
})

// ============================================================================
// handleSubmit — happy path (create)
// ============================================================================

describe('handleSubmit — create mode', () => {
  it('POSTs to apiEndpoint and sets success message on success', async () => {
    mockApiFetch.mockResolvedValueOnce({ success: true, data: { id: 'new-1' } })

    const { result } = renderHook(() =>
      useFormHandler<SampleData>({
        initialData: { name: 'Anna', count: 5 },
        apiEndpoint: '/api/services',
      }),
    )

    await act(async () => {
      await result.current.handleSubmit()
    })

    expect(mockApiFetch).toHaveBeenCalledWith('/api/services', {
      method: 'POST',
      body: { name: 'Anna', count: 5 },
    })
    expect(result.current.success).toBe('Erfolgreich erstellt!')
    expect(result.current.error).toBe('')
    expect(result.current.isSubmitting).toBe(false)
  })

  it('uses custom createMethod when provided (e.g. PUT for upsert)', async () => {
    mockApiFetch.mockResolvedValueOnce({ success: true })

    const { result } = renderHook(() =>
      useFormHandler<SampleData>({
        initialData,
        apiEndpoint: '/api/test',
        createMethod: 'PUT',
      }),
    )

    await act(async () => {
      await result.current.handleSubmit()
    })

    expect(mockApiFetch.mock.calls[0][1].method).toBe('PUT')
  })

  it('uses custom createSuccessMessage when provided', async () => {
    mockApiFetch.mockResolvedValueOnce({ success: true })

    const { result } = renderHook(() =>
      useFormHandler<SampleData>({
        initialData,
        apiEndpoint: '/api/test',
        createSuccessMessage: 'Workshop angelegt!',
      }),
    )

    await act(async () => {
      await result.current.handleSubmit()
    })

    expect(result.current.success).toBe('Workshop angelegt!')
  })
})

// ============================================================================
// handleSubmit — edit mode
// ============================================================================

describe('handleSubmit — edit mode', () => {
  it('appends editId to URL and uses PUT by default', async () => {
    mockApiFetch.mockResolvedValueOnce({ success: true })

    const { result } = renderHook(() =>
      useFormHandler<SampleData>({
        initialData: { name: 'Anna', count: 5 },
        apiEndpoint: '/api/services',
        isEdit: true,
        editId: 'svc-123',
      }),
    )

    await act(async () => {
      await result.current.handleSubmit()
    })

    expect(mockApiFetch).toHaveBeenCalledWith('/api/services/svc-123', {
      method: 'PUT',
      body: { name: 'Anna', count: 5 },
    })
    expect(result.current.success).toBe('Erfolgreich gespeichert!')
  })

  it('uses custom editMethod (e.g. PATCH for partial updates)', async () => {
    mockApiFetch.mockResolvedValueOnce({ success: true })

    const { result } = renderHook(() =>
      useFormHandler<SampleData>({
        initialData,
        apiEndpoint: '/api/test',
        isEdit: true,
        editId: 'x-1',
        editMethod: 'PATCH',
      }),
    )

    await act(async () => {
      await result.current.handleSubmit()
    })

    expect(mockApiFetch.mock.calls[0][1].method).toBe('PATCH')
  })

  it('falls back to create-mode URL if isEdit=true but editId missing', async () => {
    mockApiFetch.mockResolvedValueOnce({ success: true })

    const { result } = renderHook(() =>
      useFormHandler<SampleData>({
        initialData,
        apiEndpoint: '/api/test',
        isEdit: true,
        editId: undefined, // bug guard — should not crash
      }),
    )

    await act(async () => {
      await result.current.handleSubmit()
    })

    // URL has no /undefined suffix
    expect(mockApiFetch.mock.calls[0][0]).toBe('/api/test')
  })
})

// ============================================================================
// validate — early return
// ============================================================================

describe('handleSubmit — validation', () => {
  it('runs validate before apiFetch and short-circuits on error', async () => {
    const validate = jest.fn().mockReturnValue('Name ist erforderlich')

    const { result } = renderHook(() =>
      useFormHandler<SampleData>({
        initialData: { name: '', count: 0 },
        apiEndpoint: '/api/test',
        validate,
      }),
    )

    await act(async () => {
      await result.current.handleSubmit()
    })

    expect(validate).toHaveBeenCalledWith({ name: '', count: 0 })
    expect(mockApiFetch).not.toHaveBeenCalled()
    expect(result.current.error).toBe('Name ist erforderlich')
  })

  it('proceeds with apiFetch when validate returns null', async () => {
    const validate = jest.fn().mockReturnValue(null)
    mockApiFetch.mockResolvedValueOnce({ success: true })

    const { result } = renderHook(() =>
      useFormHandler<SampleData>({
        initialData: { name: 'Anna', count: 5 },
        apiEndpoint: '/api/test',
        validate,
      }),
    )

    await act(async () => {
      await result.current.handleSubmit()
    })

    expect(mockApiFetch).toHaveBeenCalled()
    expect(result.current.success).toBe('Erfolgreich erstellt!')
  })
})

// ============================================================================
// transformBeforeSubmit
// ============================================================================

describe('handleSubmit — transformBeforeSubmit', () => {
  it('applies transform to data before sending', async () => {
    mockApiFetch.mockResolvedValueOnce({ success: true })

    const { result } = renderHook(() =>
      useFormHandler<SampleData>({
        initialData: { name: 'anna', count: 5 },
        apiEndpoint: '/api/test',
        transformBeforeSubmit: (data) => ({
          name: data.name.toUpperCase(),
          countDoubled: data.count * 2,
        }),
      }),
    )

    await act(async () => {
      await result.current.handleSubmit()
    })

    expect(mockApiFetch.mock.calls[0][1].body).toEqual({
      name: 'ANNA',
      countDoubled: 10,
    })
  })

  it('sends raw data when transformBeforeSubmit not provided', async () => {
    mockApiFetch.mockResolvedValueOnce({ success: true })

    const { result } = renderHook(() =>
      useFormHandler<SampleData>({
        initialData: { name: 'anna', count: 5 },
        apiEndpoint: '/api/test',
      }),
    )

    await act(async () => {
      await result.current.handleSubmit()
    })

    expect(mockApiFetch.mock.calls[0][1].body).toEqual({ name: 'anna', count: 5 })
  })
})

// ============================================================================
// preventDefault on form event
// ============================================================================

describe('handleSubmit — preventDefault', () => {
  it('calls preventDefault when a form event is passed', async () => {
    mockApiFetch.mockResolvedValueOnce({ success: true })
    const preventDefault = jest.fn()
    const fakeEvent = { preventDefault } as unknown as React.FormEvent

    const { result } = renderHook(() =>
      useFormHandler<SampleData>({ initialData, apiEndpoint: '/api/test' }),
    )

    await act(async () => {
      await result.current.handleSubmit(fakeEvent)
    })

    expect(preventDefault).toHaveBeenCalledTimes(1)
  })

  it('handles undefined event without crashing (programmatic submit)', async () => {
    mockApiFetch.mockResolvedValueOnce({ success: true })

    const { result } = renderHook(() =>
      useFormHandler<SampleData>({ initialData, apiEndpoint: '/api/test' }),
    )

    await act(async () => {
      await result.current.handleSubmit() // no event
    })

    expect(mockApiFetch).toHaveBeenCalled()
  })
})

// ============================================================================
// Failure paths
// ============================================================================

describe('handleSubmit — failure', () => {
  it('sets error from result.error on apiFetch failure', async () => {
    mockApiFetch.mockResolvedValueOnce({ success: false, error: 'Slug bereits vergeben' })

    const { result } = renderHook(() =>
      useFormHandler<SampleData>({ initialData, apiEndpoint: '/api/test' }),
    )

    await act(async () => {
      await result.current.handleSubmit()
    })

    expect(result.current.error).toBe('Slug bereits vergeben')
    expect(result.current.success).toBe('')
  })

  it('uses Swiss-German fallback when result.error is missing', async () => {
    mockApiFetch.mockResolvedValueOnce({ success: false })

    const { result } = renderHook(() =>
      useFormHandler<SampleData>({ initialData, apiEndpoint: '/api/test' }),
    )

    await act(async () => {
      await result.current.handleSubmit()
    })

    expect(result.current.error).toBe('Speichern fehlgeschlagen')
  })

  it('catches thrown exceptions and sets generic German error', async () => {
    mockApiFetch.mockRejectedValueOnce(new Error('Network unreachable'))

    const { result } = renderHook(() =>
      useFormHandler<SampleData>({ initialData, apiEndpoint: '/api/test' }),
    )

    await act(async () => {
      await result.current.handleSubmit()
    })

    expect(result.current.error).toBe('Ein unerwarteter Fehler ist aufgetreten')
  })

  it('isSubmitting flips back to false after failure', async () => {
    mockApiFetch.mockResolvedValueOnce({ success: false, error: 'x' })

    const { result } = renderHook(() =>
      useFormHandler<SampleData>({ initialData, apiEndpoint: '/api/test' }),
    )

    await act(async () => {
      await result.current.handleSubmit()
    })

    expect(result.current.isSubmitting).toBe(false)
  })
})

// ============================================================================
// onSuccess callback
// ============================================================================

describe('handleSubmit — onSuccess callback', () => {
  it('invokes onSuccess with response data', async () => {
    const onSuccess = jest.fn()
    mockApiFetch.mockResolvedValueOnce({ success: true, data: { id: 'new-1' } })

    const { result } = renderHook(() =>
      useFormHandler<SampleData>({
        initialData,
        apiEndpoint: '/api/test',
        onSuccess,
      }),
    )

    await act(async () => {
      await result.current.handleSubmit()
    })

    expect(onSuccess).toHaveBeenCalledWith({ id: 'new-1' })
  })

  it('does NOT invoke onSuccess when apiFetch fails', async () => {
    const onSuccess = jest.fn()
    mockApiFetch.mockResolvedValueOnce({ success: false, error: 'x' })

    const { result } = renderHook(() =>
      useFormHandler<SampleData>({
        initialData,
        apiEndpoint: '/api/test',
        onSuccess,
      }),
    )

    await act(async () => {
      await result.current.handleSubmit()
    })

    expect(onSuccess).not.toHaveBeenCalled()
  })
})

// ============================================================================
// Redirect
// ============================================================================

describe('handleSubmit — redirect', () => {
  it('does NOT redirect when redirectTo is omitted', async () => {
    mockApiFetch.mockResolvedValueOnce({ success: true })
    jest.useFakeTimers()

    const { result } = renderHook(() =>
      useFormHandler<SampleData>({ initialData, apiEndpoint: '/api/test' }),
    )

    await act(async () => {
      await result.current.handleSubmit()
    })

    jest.runAllTimers()
    expect(mockRouterPush).not.toHaveBeenCalled()
    jest.useRealTimers()
  })

  it('redirects to redirectTo after redirectDelay (default 1000ms)', async () => {
    mockApiFetch.mockResolvedValueOnce({ success: true })
    jest.useFakeTimers()

    const { result } = renderHook(() =>
      useFormHandler<SampleData>({
        initialData,
        apiEndpoint: '/api/test',
        redirectTo: '/admin/services',
      }),
    )

    await act(async () => {
      await result.current.handleSubmit()
    })

    // Before delay → no push yet
    expect(mockRouterPush).not.toHaveBeenCalled()

    act(() => {
      jest.advanceTimersByTime(1000)
    })

    expect(mockRouterPush).toHaveBeenCalledWith('/admin/services')
    expect(mockRouterRefresh).toHaveBeenCalledTimes(1)
    jest.useRealTimers()
  })

  it('honors custom redirectDelay', async () => {
    mockApiFetch.mockResolvedValueOnce({ success: true })
    jest.useFakeTimers()

    const { result } = renderHook(() =>
      useFormHandler<SampleData>({
        initialData,
        apiEndpoint: '/api/test',
        redirectTo: '/admin/x',
        redirectDelay: 3000,
      }),
    )

    await act(async () => {
      await result.current.handleSubmit()
    })

    act(() => {
      jest.advanceTimersByTime(2999)
    })
    expect(mockRouterPush).not.toHaveBeenCalled()

    act(() => {
      jest.advanceTimersByTime(1)
    })
    expect(mockRouterPush).toHaveBeenCalled()
    jest.useRealTimers()
  })

  it('does NOT redirect on failure', async () => {
    mockApiFetch.mockResolvedValueOnce({ success: false, error: 'x' })
    jest.useFakeTimers()

    const { result } = renderHook(() =>
      useFormHandler<SampleData>({
        initialData,
        apiEndpoint: '/api/test',
        redirectTo: '/admin/x',
      }),
    )

    await act(async () => {
      await result.current.handleSubmit()
    })

    jest.runAllTimers()
    expect(mockRouterPush).not.toHaveBeenCalled()
    jest.useRealTimers()
  })
})

// ============================================================================
// submitCustom — bypasses transformBeforeSubmit
// ============================================================================

describe('submitCustom', () => {
  it('sends caller-supplied payload, ignoring data and transformBeforeSubmit', async () => {
    mockApiFetch.mockResolvedValueOnce({ success: true })

    const { result } = renderHook(() =>
      useFormHandler<SampleData>({
        initialData: { name: 'ignored', count: 0 },
        apiEndpoint: '/api/test',
        transformBeforeSubmit: () => ({ shouldNotAppear: true }),
      }),
    )

    await act(async () => {
      await result.current.submitCustom({ custom: 'payload' })
    })

    expect(mockApiFetch.mock.calls[0][1].body).toEqual({ custom: 'payload' })
  })

  it('returns true on success, false on failure', async () => {
    mockApiFetch
      .mockResolvedValueOnce({ success: true })
      .mockResolvedValueOnce({ success: false, error: 'x' })

    const { result } = renderHook(() =>
      useFormHandler<SampleData>({ initialData, apiEndpoint: '/api/test' }),
    )

    let okResult: boolean | undefined
    await act(async () => {
      okResult = await result.current.submitCustom({})
    })
    expect(okResult).toBe(true)

    let failResult: boolean | undefined
    await act(async () => {
      failResult = await result.current.submitCustom({})
    })
    expect(failResult).toBe(false)
  })
})

// ============================================================================
// reset
// ============================================================================

describe('reset', () => {
  it('restores data to initialData and clears error/success', async () => {
    const { result } = renderHook(() =>
      useFormHandler<SampleData>({
        initialData: { name: 'initial', count: 0 },
        apiEndpoint: '/api/test',
      }),
    )

    act(() => {
      result.current.updateField('name', 'changed')
      result.current.setError('something broke')
      result.current.setSuccess('something worked')
    })

    expect(result.current.data.name).toBe('changed')

    act(() => {
      result.current.reset()
    })

    expect(result.current.data).toEqual({ name: 'initial', count: 0 })
    expect(result.current.error).toBe('')
    expect(result.current.success).toBe('')
  })
})
