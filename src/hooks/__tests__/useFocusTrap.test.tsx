/**
 * Tests for useFocusTrap — accessible focus management for overlays.
 *
 * Used by Modal and the marketplace CartDrawer. A broken trap is a real
 * keyboard/screen-reader accessibility defect (WCAG 2.4.3), so the
 * behaviors are locked here:
 *
 *   - moves focus into the container when activated (first focusable)
 *   - falls back to the container itself when it has no focusable child
 *   - calls onEscape when Escape is pressed (only while active)
 *   - Tab from the last focusable wraps to the first; Shift+Tab from the
 *     first wraps to the last
 *   - restores focus to the previously-focused element on deactivation
 */

import { renderHook } from '@testing-library/react'
import { useRef, type RefObject } from 'react'
import { useFocusTrap } from '../useFocusTrap'

/**
 * Render the hook with its returned ref attached to a real DOM container so
 * focus/keyboard behavior can be exercised. The container is appended to
 * document.body (jsdom) and torn down after each test.
 */
function setup(active: boolean, onEscape?: () => void, html = '') {
  const container = document.createElement('div')
  container.tabIndex = -1
  container.innerHTML = html
  document.body.appendChild(container)

  const view = renderHook(
    ({ active }: { active: boolean }) => {
      const ref = useFocusTrap<HTMLDivElement>(active, onEscape) as RefObject<HTMLDivElement | null>
      // Attach the hook's ref to our pre-built container.
      ;(ref as { current: HTMLDivElement | null }).current = container
      return ref
    },
    { initialProps: { active } },
  )
  return { container, view }
}

afterEach(() => {
  document.body.innerHTML = ''
})

describe('useFocusTrap', () => {
  it('moves focus to the first focusable element when activated', () => {
    const { container } = setup(true, undefined, '<button id="a">A</button><button id="b">B</button>')
    const first = container.querySelector<HTMLButtonElement>('#a')!
    expect(document.activeElement).toBe(first)
  })

  it('focuses the container itself when there is no focusable child', () => {
    const { container } = setup(true, undefined, '<p>no focusables here</p>')
    expect(document.activeElement).toBe(container)
  })

  it('calls onEscape when Escape is pressed while active', () => {
    const onEscape = jest.fn()
    setup(true, onEscape, '<button>A</button>')
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
    expect(onEscape).toHaveBeenCalledTimes(1)
  })

  it('does NOT call onEscape when inactive', () => {
    const onEscape = jest.fn()
    setup(false, onEscape, '<button>A</button>')
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
    expect(onEscape).not.toHaveBeenCalled()
  })

  it('wraps Tab from the last focusable back to the first', () => {
    const { container } = setup(true, undefined, '<button id="a">A</button><button id="b">B</button>')
    const first = container.querySelector<HTMLButtonElement>('#a')!
    const last = container.querySelector<HTMLButtonElement>('#b')!
    last.focus()
    const e = new KeyboardEvent('keydown', { key: 'Tab', bubbles: true, cancelable: true })
    document.dispatchEvent(e)
    expect(e.defaultPrevented).toBe(true)
    expect(document.activeElement).toBe(first)
  })

  it('wraps Shift+Tab from the first focusable back to the last', () => {
    const { container } = setup(true, undefined, '<button id="a">A</button><button id="b">B</button>')
    const first = container.querySelector<HTMLButtonElement>('#a')!
    const last = container.querySelector<HTMLButtonElement>('#b')!
    first.focus()
    const e = new KeyboardEvent('keydown', { key: 'Tab', shiftKey: true, bubbles: true, cancelable: true })
    document.dispatchEvent(e)
    expect(e.defaultPrevented).toBe(true)
    expect(document.activeElement).toBe(last)
  })

  it('restores focus to the previously-focused element on deactivation', () => {
    // A trigger button outside the trap that "opened" the overlay.
    const trigger = document.createElement('button')
    trigger.id = 'trigger'
    document.body.appendChild(trigger)
    trigger.focus()
    expect(document.activeElement).toBe(trigger)

    const { view } = setup(true, undefined, '<button id="a">A</button>')
    // Focus moved into the trap.
    expect(document.activeElement).not.toBe(trigger)

    view.rerender({ active: false })
    expect(document.activeElement).toBe(trigger)
  })
})
