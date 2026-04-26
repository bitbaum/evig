/**
 * Tests for useDebounce — generic value debounce hook.
 *
 * Used by the marketplace search input (debouncedSearch) and any
 * other place where rapid input shouldn't fire a request per keystroke.
 *
 * Locks:
 *   - returns the initial value synchronously on mount
 *   - holds the previous value until <delay>ms after the last change
 *   - the LAST value wins when changes are rapid (cancellation)
 *   - delay change resets the timer with the new value
 *   - works with any type T (string, number, object, array)
 */

import { renderHook, act } from '@testing-library/react'
import { useDebounce } from '../useDebounce'

beforeEach(() => {
  jest.useFakeTimers()
})

afterEach(() => {
  jest.useRealTimers()
})

// ============================================================================
// Initial value
// ============================================================================

describe('useDebounce — initial value', () => {
  it('returns the initial value synchronously on first render', () => {
    const { result } = renderHook(() => useDebounce('hello', 300))
    expect(result.current).toBe('hello')
  })

  it('works with non-string types (number)', () => {
    const { result } = renderHook(() => useDebounce(42, 300))
    expect(result.current).toBe(42)
  })

  it('works with object types', () => {
    const obj = { name: 'Anna', age: 30 }
    const { result } = renderHook(() => useDebounce(obj, 300))
    expect(result.current).toEqual({ name: 'Anna', age: 30 })
  })
})

// ============================================================================
// Debounce behavior
// ============================================================================

describe('useDebounce — debounce timing', () => {
  it('does NOT update before delay elapses', () => {
    const { result, rerender } = renderHook(
      ({ value }: { value: string }) => useDebounce(value, 300),
      { initialProps: { value: 'first' } },
    )

    rerender({ value: 'second' })

    // Right after change — still old value
    expect(result.current).toBe('first')

    // Halfway through delay — still old value
    act(() => { jest.advanceTimersByTime(200) })
    expect(result.current).toBe('first')
  })

  it('updates exactly at the delay boundary', () => {
    const { result, rerender } = renderHook(
      ({ value }: { value: string }) => useDebounce(value, 300),
      { initialProps: { value: 'first' } },
    )

    rerender({ value: 'second' })
    act(() => { jest.advanceTimersByTime(299) })
    expect(result.current).toBe('first') // not yet

    act(() => { jest.advanceTimersByTime(1) })
    expect(result.current).toBe('second') // now updated
  })

  it('LAST value wins when changes are rapid (cancellation between)', () => {
    const { result, rerender } = renderHook(
      ({ value }: { value: string }) => useDebounce(value, 300),
      { initialProps: { value: 'a' } },
    )

    rerender({ value: 'b' })
    act(() => { jest.advanceTimersByTime(100) })
    rerender({ value: 'c' })
    act(() => { jest.advanceTimersByTime(100) })
    rerender({ value: 'd' })

    // Only "d" should ever appear after the next 300ms — "b" and "c" cancelled
    act(() => { jest.advanceTimersByTime(300) })
    expect(result.current).toBe('d')
  })

  it('does NOT fire when value reverts to a previous value before delay', () => {
    const { result, rerender } = renderHook(
      ({ value }: { value: string }) => useDebounce(value, 300),
      { initialProps: { value: 'initial' } },
    )

    rerender({ value: 'changed' })
    act(() => { jest.advanceTimersByTime(100) })

    // Revert
    rerender({ value: 'initial' })
    act(() => { jest.advanceTimersByTime(300) })

    // Final value is still "initial"
    expect(result.current).toBe('initial')
  })

  it('handles 0 delay (still asynchronous via setTimeout)', () => {
    const { result, rerender } = renderHook(
      ({ value }: { value: string }) => useDebounce(value, 0),
      { initialProps: { value: 'a' } },
    )

    rerender({ value: 'b' })
    expect(result.current).toBe('a') // setTimeout schedules even at 0ms

    act(() => { jest.advanceTimersByTime(0) })
    expect(result.current).toBe('b')
  })
})

// ============================================================================
// Delay change
// ============================================================================

describe('useDebounce — delay parameter changes', () => {
  it('changing delay resets the pending timer with the new value', () => {
    const { result, rerender } = renderHook(
      ({ value, delay }: { value: string; delay: number }) => useDebounce(value, delay),
      { initialProps: { value: 'first', delay: 300 } },
    )

    rerender({ value: 'second', delay: 1000 })
    act(() => { jest.advanceTimersByTime(300) })

    // New delay is 1000ms; 300ms is not enough
    expect(result.current).toBe('first')

    act(() => { jest.advanceTimersByTime(700) })
    expect(result.current).toBe('second')
  })
})

// ============================================================================
// Cleanup
// ============================================================================

describe('useDebounce — cleanup on unmount', () => {
  it('does not throw or leak when unmounted before delay elapses', () => {
    const { result, rerender, unmount } = renderHook(
      ({ value }: { value: string }) => useDebounce(value, 300),
      { initialProps: { value: 'first' } },
    )

    rerender({ value: 'second' })
    expect(() => unmount()).not.toThrow()

    // Advance past the delay — no warning, no crash
    act(() => { jest.advanceTimersByTime(500) })

    // Result captured before unmount stays at "first"
    expect(result.current).toBe('first')
  })
})
