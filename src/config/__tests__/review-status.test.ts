/**
 * Tests for config/review-status.ts — review moderation status helpers.
 *
 * Mission-relevant: reviews appear on shop products. If getReviewStatusLabel
 * returns 'Unbekannt' for a known status, moderators lose context. If
 * getReviewStatusBadgeColor falls back to the wrong badge for 'deleted',
 * hidden/deleted reviews may look published.
 *
 * Behaviors locked:
 *   getReviewStatusLabel
 *   - returns German label for all known statuses
 *   - returns 'Unbekannt' for unknown status
 *
 *   getReviewStatusBadgeColor
 *   - returns CSS class for known statuses
 *   - falls back to the pending_moderation badge for unknown status
 *
 *   getReviewFilterLabel
 *   - returns short label for known statuses
 *   - falls back to raw status for unknown
 *
 *   getReviewActionLabel
 *   - returns past-tense label for known actions
 *   - falls back to 'moderiert' for unknown action
 */

import {
  REVIEW_STATUS,
  getReviewStatusLabel,
  getReviewStatusBadgeColor,
  getReviewFilterLabel,
  getReviewActionLabel,
} from '../review-status'

// ============================================================================
// getReviewStatusLabel
// ============================================================================

describe('getReviewStatusLabel', () => {
  it('returns "Veröffentlicht" for published', () => {
    expect(getReviewStatusLabel(REVIEW_STATUS.PUBLISHED)).toBe('Veröffentlicht')
  })

  it('returns "Wartet auf Moderation" for pending_moderation', () => {
    expect(getReviewStatusLabel(REVIEW_STATUS.PENDING_MODERATION)).toBe('Wartet auf Moderation')
  })

  it('returns "Ausgeblendet" for hidden', () => {
    expect(getReviewStatusLabel(REVIEW_STATUS.HIDDEN)).toBe('Ausgeblendet')
  })

  it('returns "Gelöscht" for deleted', () => {
    expect(getReviewStatusLabel(REVIEW_STATUS.DELETED)).toBe('Gelöscht')
  })

  it('returns "Unbekannt" for unknown status', () => {
    expect(getReviewStatusLabel('nonexistent_status')).toBe('Unbekannt')
  })
})

// ============================================================================
// getReviewStatusBadgeColor
// ============================================================================

describe('getReviewStatusBadgeColor', () => {
  it('returns green badge for published', () => {
    expect(getReviewStatusBadgeColor(REVIEW_STATUS.PUBLISHED)).toContain('primary')
  })

  it('returns orange badge for pending_moderation', () => {
    expect(getReviewStatusBadgeColor(REVIEW_STATUS.PENDING_MODERATION)).toContain('orange')
  })

  it('returns red badge for hidden', () => {
    expect(getReviewStatusBadgeColor(REVIEW_STATUS.HIDDEN)).toContain('error')
  })

  it('returns gray badge for deleted', () => {
    expect(getReviewStatusBadgeColor(REVIEW_STATUS.DELETED)).toContain('neutral')
  })

  it('falls back to pending_moderation badge (orange) for unknown status', () => {
    const fallback = getReviewStatusBadgeColor('unknown')
    const pendingColor = getReviewStatusBadgeColor(REVIEW_STATUS.PENDING_MODERATION)
    expect(fallback).toBe(pendingColor)
  })
})

// ============================================================================
// getReviewFilterLabel
// ============================================================================

describe('getReviewFilterLabel', () => {
  it('returns "Veröffentlicht" for published', () => {
    expect(getReviewFilterLabel(REVIEW_STATUS.PUBLISHED)).toBe('Veröffentlicht')
  })

  it('returns "Moderation" for pending_moderation', () => {
    expect(getReviewFilterLabel(REVIEW_STATUS.PENDING_MODERATION)).toBe('Moderation')
  })

  it('returns "Ausgeblendet" for hidden', () => {
    expect(getReviewFilterLabel(REVIEW_STATUS.HIDDEN)).toBe('Ausgeblendet')
  })

  it('returns "Gelöscht" for deleted', () => {
    expect(getReviewFilterLabel(REVIEW_STATUS.DELETED)).toBe('Gelöscht')
  })

  it('falls back to raw status for unknown', () => {
    expect(getReviewFilterLabel('raw_value')).toBe('raw_value')
  })
})

// ============================================================================
// getReviewActionLabel
// ============================================================================

describe('getReviewActionLabel', () => {
  it('returns "freigegeben" for approve', () => {
    expect(getReviewActionLabel('approve')).toBe('freigegeben')
  })

  it('returns "ausgeblendet" for hide', () => {
    expect(getReviewActionLabel('hide')).toBe('ausgeblendet')
  })

  it('returns "gelöscht" for delete', () => {
    expect(getReviewActionLabel('delete')).toBe('gelöscht')
  })

  it('returns "wiederhergestellt" for restore', () => {
    expect(getReviewActionLabel('restore')).toBe('wiederhergestellt')
  })

  it('returns "als Spam markiert" for flag_spam', () => {
    expect(getReviewActionLabel('flag_spam')).toBe('als Spam markiert')
  })

  it('returns "als unangemessen markiert" for flag_inappropriate', () => {
    expect(getReviewActionLabel('flag_inappropriate')).toBe('als unangemessen markiert')
  })

  it('returns "moderiert" for unknown action', () => {
    expect(getReviewActionLabel('unknown_action')).toBe('moderiert')
  })
})
