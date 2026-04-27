/**
 * Tests for config/protocols.ts — meeting and protocol configuration helpers.
 *
 * Mission-relevant: Revamp-IT uses protocols (meeting minutes) for governance.
 * If getFollowUpStatusColor(null) returns undefined instead of a color class,
 * action item badges render with no styling.
 *
 * Behaviors locked:
 *   getFollowUpStatusColor
 *   - returns color for known status 'offen'
 *   - returns 'offen' fallback for null/undefined
 *   - returns 'offen' fallback for unknown status
 *
 *   MEETING_TYPE_LABELS / PROTOCOL_STATUS_LABELS / ACTION_ITEM_TYPE_LABELS
 *   - cover all keys with non-empty German labels
 *
 *   PROTOCOL_VISIBILITY_LABELS
 *   - covers intern and extern
 */

jest.mock('lucide-react', () => {
  const icon = (name: string) => ({ displayName: name })
  return new Proxy({}, { get: (_t, prop) => icon(prop as string) })
})

import {
  getFollowUpStatusColor,
  MEETING_TYPES,
  MEETING_TYPE_LABELS,
  MEETING_TYPE_COLORS,
  PROTOCOL_STATUS_LABELS,
  PROTOCOL_STATUS_COLORS,
  PROTOCOL_VISIBILITY,
  PROTOCOL_VISIBILITY_LABELS,
  ACTION_ITEM_TYPES,
  ACTION_ITEM_TYPE_LABELS,
  INPUT_METHODS,
  INPUT_METHOD_LABELS,
  FOLLOW_UP_STATUS_COLORS,
} from '../protocols'

// ============================================================================
// getFollowUpStatusColor
// ============================================================================

describe('getFollowUpStatusColor', () => {
  it('returns a color string for "offen"', () => {
    const color = getFollowUpStatusColor('offen')
    expect(typeof color).toBe('string')
    expect(color.length).toBeGreaterThan(0)
  })

  it('returns fallback (offen color) for null', () => {
    expect(getFollowUpStatusColor(null)).toBe(FOLLOW_UP_STATUS_COLORS['offen'])
  })

  it('returns fallback (offen color) for undefined', () => {
    expect(getFollowUpStatusColor(undefined)).toBe(FOLLOW_UP_STATUS_COLORS['offen'])
  })

  it('returns fallback (offen color) for unknown status', () => {
    expect(getFollowUpStatusColor('unknown_status')).toBe(FOLLOW_UP_STATUS_COLORS['offen'])
  })
})

// ============================================================================
// MEETING_TYPE_LABELS
// ============================================================================

describe('MEETING_TYPE_LABELS', () => {
  it('has German label for every MEETING_TYPES value', () => {
    for (const type of Object.values(MEETING_TYPES)) {
      const label = MEETING_TYPE_LABELS[type]
      expect(typeof label).toBe('string')
      expect(label.length).toBeGreaterThan(0)
    }
  })

  it('has color for every MEETING_TYPES value', () => {
    for (const type of Object.values(MEETING_TYPES)) {
      const color = MEETING_TYPE_COLORS[type]
      expect(typeof color).toBe('string')
      expect(color.length).toBeGreaterThan(0)
    }
  })
})

// ============================================================================
// PROTOCOL_STATUS_LABELS
// ============================================================================

describe('PROTOCOL_STATUS_LABELS', () => {
  it('has German label "Entwurf" for draft', () => {
    expect(PROTOCOL_STATUS_LABELS['draft']).toBe('Entwurf')
  })

  it('has German label "Abgeschlossen" for finalized', () => {
    expect(PROTOCOL_STATUS_LABELS['finalized']).toBe('Abgeschlossen')
  })

  it('has color class for every status', () => {
    for (const status of Object.keys(PROTOCOL_STATUS_LABELS)) {
      const color = PROTOCOL_STATUS_COLORS[status as keyof typeof PROTOCOL_STATUS_COLORS]
      expect(typeof color).toBe('string')
    }
  })
})

// ============================================================================
// PROTOCOL_VISIBILITY_LABELS
// ============================================================================

describe('PROTOCOL_VISIBILITY_LABELS', () => {
  it('has label for team', () => {
    expect(PROTOCOL_VISIBILITY_LABELS[PROTOCOL_VISIBILITY.TEAM]).toBeTruthy()
  })

  it('has label for attendees', () => {
    expect(PROTOCOL_VISIBILITY_LABELS[PROTOCOL_VISIBILITY.ATTENDEES]).toBeTruthy()
  })
})

// ============================================================================
// ACTION_ITEM_TYPE_LABELS
// ============================================================================

describe('ACTION_ITEM_TYPE_LABELS', () => {
  it('has German label for every ACTION_ITEM_TYPES value', () => {
    for (const type of Object.values(ACTION_ITEM_TYPES)) {
      const label = ACTION_ITEM_TYPE_LABELS[type]
      expect(typeof label).toBe('string')
      expect(label.length).toBeGreaterThan(0)
    }
  })
})

// ============================================================================
// INPUT_METHOD_LABELS
// ============================================================================

describe('INPUT_METHOD_LABELS', () => {
  it('has German label for every INPUT_METHODS value', () => {
    for (const method of Object.values(INPUT_METHODS)) {
      const label = INPUT_METHOD_LABELS[method]
      expect(typeof label).toBe('string')
      expect(label.length).toBeGreaterThan(0)
    }
  })

  it('has label "Audio-Aufnahme" for audio', () => {
    expect(INPUT_METHOD_LABELS[INPUT_METHODS.AUDIO]).toBe('Audio-Aufnahme')
  })
})
