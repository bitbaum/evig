/**
 * Tests for config/activity.ts — activity stream label and color helpers.
 *
 * Mission-relevant: the activity stream shows staff contributions and help
 * requests. If getHelpRequestStatusLabel(null) returns 'null' instead of
 * 'Offen', the default help request filter shows a broken label. If
 * getActivityCategoryLabel('it') returns 'it' instead of 'IT', the category
 * chips show untranslated keys.
 *
 * Behaviors locked:
 *   getActivityUpdateTypeLabel
 *   - returns German label for known type
 *   - returns 'Unbekannt' for null
 *   - falls back to raw value for unknown
 *
 *   getActivityUpdateTypeColor
 *   - returns CSS class for known type
 *   - returns gray fallback for null/unknown
 *
 *   getVisibilityLabel
 *   - returns German label for known visibility level
 *   - returns 'Team' for null
 *
 *   getHelpRequestUrgencyLabel / getHelpRequestUrgencyColor
 *   - return label/color for known urgency
 *   - return 'Normal'/'blue' default for null
 *
 *   getHelpRequestStatusLabel / getHelpRequestStatusColor
 *   - return label/color for known status
 *   - return 'Offen'/'yellow' default for null
 *
 *   getActivityCategoryLabel
 *   - returns German label for known category
 *   - returns 'Sonstiges' for null
 */

import {
  getActivityUpdateTypeLabel,
  getActivityUpdateTypeColor,
  getVisibilityLabel,
  getHelpRequestUrgencyLabel,
  getHelpRequestUrgencyColor,
  getHelpRequestStatusLabel,
  getHelpRequestStatusColor,
  getActivityCategoryLabel,
  ACTIVITY_UPDATE_TYPES,
  VISIBILITY_LEVELS,
  HELP_REQUEST_URGENCY,
  HELP_REQUEST_STATUSES,
  ACTIVITY_CATEGORIES,
} from '../activity'

// ============================================================================
// getActivityUpdateTypeLabel
// ============================================================================

describe('getActivityUpdateTypeLabel', () => {
  it('returns "Errungenschaft" for accomplishment', () => {
    expect(getActivityUpdateTypeLabel(ACTIVITY_UPDATE_TYPES.ACCOMPLISHMENT)).toBe('Errungenschaft')
  })

  it('returns "Meilenstein" for milestone', () => {
    expect(getActivityUpdateTypeLabel(ACTIVITY_UPDATE_TYPES.MILESTONE)).toBe('Meilenstein')
  })

  it('returns "Unbekannt" for null', () => {
    expect(getActivityUpdateTypeLabel(null)).toBe('Unbekannt')
  })

  it('falls back to raw value for unknown type', () => {
    expect(getActivityUpdateTypeLabel('custom_type')).toBe('custom_type')
  })
})

// ============================================================================
// getActivityUpdateTypeColor
// ============================================================================

describe('getActivityUpdateTypeColor', () => {
  it('returns green class for accomplishment', () => {
    expect(getActivityUpdateTypeColor(ACTIVITY_UPDATE_TYPES.ACCOMPLISHMENT)).toContain('primary')
  })

  it('returns gray fallback for null', () => {
    expect(getActivityUpdateTypeColor(null)).toContain('neutral')
  })

  it('returns gray fallback for unknown type', () => {
    expect(getActivityUpdateTypeColor('unknown')).toContain('neutral')
  })
})

// ============================================================================
// getVisibilityLabel
// ============================================================================

describe('getVisibilityLabel', () => {
  it('returns "Team" for "team"', () => {
    expect(getVisibilityLabel(VISIBILITY_LEVELS.TEAM)).toBe('Team')
  })

  it('returns "Öffentlich" for "public"', () => {
    expect(getVisibilityLabel(VISIBILITY_LEVELS.PUBLIC)).toBe('Öffentlich')
  })

  it('returns "Team" for null', () => {
    expect(getVisibilityLabel(null)).toBe('Team')
  })

  it('falls back to raw value for unknown level', () => {
    expect(getVisibilityLabel('secret')).toBe('secret')
  })
})

// ============================================================================
// getHelpRequestUrgencyLabel / getHelpRequestUrgencyColor
// ============================================================================

describe('getHelpRequestUrgencyLabel', () => {
  it('returns "Dringend" for urgent', () => {
    expect(getHelpRequestUrgencyLabel(HELP_REQUEST_URGENCY.URGENT)).toBe('Dringend')
  })

  it('returns "Normal" for null', () => {
    expect(getHelpRequestUrgencyLabel(null)).toBe('Normal')
  })

  it('falls back to raw value for unknown urgency', () => {
    expect(getHelpRequestUrgencyLabel('super_urgent')).toBe('super_urgent')
  })
})

describe('getHelpRequestUrgencyColor', () => {
  it('returns red class for urgent', () => {
    expect(getHelpRequestUrgencyColor(HELP_REQUEST_URGENCY.URGENT)).toContain('error')
  })

  it('returns blue (normal) for null', () => {
    expect(getHelpRequestUrgencyColor(null)).toContain('info')
  })
})

// ============================================================================
// getHelpRequestStatusLabel / getHelpRequestStatusColor
// ============================================================================

describe('getHelpRequestStatusLabel', () => {
  it('returns "Offen" for "open"', () => {
    expect(getHelpRequestStatusLabel(HELP_REQUEST_STATUSES.OPEN)).toBe('Offen')
  })

  it('returns "Gelöst" for "resolved"', () => {
    expect(getHelpRequestStatusLabel(HELP_REQUEST_STATUSES.RESOLVED)).toBe('Gelöst')
  })

  it('returns "Offen" for null', () => {
    expect(getHelpRequestStatusLabel(null)).toBe('Offen')
  })

  it('falls back to raw value for unknown status', () => {
    expect(getHelpRequestStatusLabel('archived')).toBe('archived')
  })
})

describe('getHelpRequestStatusColor', () => {
  it('returns green class for resolved', () => {
    expect(getHelpRequestStatusColor(HELP_REQUEST_STATUSES.RESOLVED)).toContain('primary')
  })

  it('returns yellow (open) for null', () => {
    expect(getHelpRequestStatusColor(null)).toContain('yellow')
  })
})

// ============================================================================
// getActivityCategoryLabel
// ============================================================================

describe('getActivityCategoryLabel', () => {
  it('returns "IT" for "it"', () => {
    expect(getActivityCategoryLabel(ACTIVITY_CATEGORIES.IT)).toBe('IT')
  })

  it('returns "Werkstatt" for "workshop"', () => {
    expect(getActivityCategoryLabel(ACTIVITY_CATEGORIES.WORKSHOP)).toBe('Werkstatt')
  })

  it('returns "Sonstiges" for null', () => {
    expect(getActivityCategoryLabel(null)).toBe('Sonstiges')
  })

  it('falls back to raw value for unknown category', () => {
    expect(getActivityCategoryLabel('unknown_cat')).toBe('unknown_cat')
  })
})
