/**
 * Tests for lib/ui/uiEvents.ts — UI event bus for overlays and widgets.
 *
 * Mission-relevant: the event bus coordinates the HIRN chat panel and
 * the contextual suggestion overlay. If emit doesn't fire registered
 * handlers, clicking "Open Chat" silently does nothing for the user.
 *
 * Behaviors locked:
 *   uiEvents.on
 *   - handler is called when the matching event is emitted
 *   - returns an unsubscribe function
 *
 *   uiEvents.emit
 *   - calls all registered handlers for the event
 *   - does NOT call handlers registered for a different event
 *
 *   unsubscribe (return value of on)
 *   - calling it stops the handler from receiving future events
 *
 *   multiple subscribers
 *   - all handlers receive the event
 */

import { uiEvents } from '../ui/uiEvents'

// ============================================================================
// on / emit
// ============================================================================

describe('uiEvents.on / emit', () => {
  it('calls handler when matching event is emitted', () => {
    const handler = jest.fn()
    uiEvents.on('openChat', handler)
    uiEvents.emit('openChat')
    expect(handler).toHaveBeenCalledTimes(1)

    // cleanup
    uiEvents.on('openChat', handler)
  })

  it('does NOT call handler for a different event', () => {
    const handler = jest.fn()
    uiEvents.on('openChat', handler)
    uiEvents.emit('closeChat')
    expect(handler).not.toHaveBeenCalled()
  })

  it('calls handler multiple times when event is emitted multiple times', () => {
    const handler = jest.fn()
    uiEvents.on('openSuggestion', handler)
    uiEvents.emit('openSuggestion')
    uiEvents.emit('openSuggestion')
    expect(handler).toHaveBeenCalledTimes(2)
  })

  it('all four event names are accepted without throwing', () => {
    const events = ['openChat', 'closeChat', 'openSuggestion', 'closeSuggestion'] as const
    for (const event of events) {
      expect(() => uiEvents.emit(event)).not.toThrow()
    }
  })
})

// ============================================================================
// unsubscribe
// ============================================================================

describe('uiEvents unsubscribe', () => {
  it('unsubscribing stops handler from receiving future events', () => {
    const handler = jest.fn()
    const unsubscribe = uiEvents.on('closeChat', handler)

    uiEvents.emit('closeChat')
    expect(handler).toHaveBeenCalledTimes(1)

    unsubscribe()
    uiEvents.emit('closeChat')
    expect(handler).toHaveBeenCalledTimes(1) // still 1, not called again
  })

  it('other handlers survive unsubscribe of one', () => {
    const handler1 = jest.fn()
    const handler2 = jest.fn()
    const unsub1 = uiEvents.on('closeSuggestion', handler1)
    uiEvents.on('closeSuggestion', handler2)

    unsub1()
    uiEvents.emit('closeSuggestion')

    expect(handler1).not.toHaveBeenCalled()
    expect(handler2).toHaveBeenCalledTimes(1)
  })
})

// ============================================================================
// multiple subscribers
// ============================================================================

describe('uiEvents — multiple subscribers', () => {
  it('all registered handlers are called on emit', () => {
    const h1 = jest.fn()
    const h2 = jest.fn()
    const h3 = jest.fn()
    const u1 = uiEvents.on('openChat', h1)
    const u2 = uiEvents.on('openChat', h2)
    const u3 = uiEvents.on('openChat', h3)

    uiEvents.emit('openChat')

    expect(h1).toHaveBeenCalledTimes(1)
    expect(h2).toHaveBeenCalledTimes(1)
    expect(h3).toHaveBeenCalledTimes(1)

    // cleanup
    u1(); u2(); u3()
  })
})
