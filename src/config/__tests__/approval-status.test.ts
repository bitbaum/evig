/**
 * Tests for config/approval-status.ts — approval flow constants and helpers.
 *
 * Mission-relevant: approval status drives the content review workflow for
 * blog posts, products, workshop proposals, and repairer applications.
 * If getApprovalStatusBadge returns wrong styling for REJECTED, rejected
 * content appears approved in the admin UI.
 *
 * Behaviors locked:
 *   APPROVAL_STATUS
 *   - contains expected string values
 *
 *   getApprovalStatusLabel
 *   - returns Swiss-German label for each known status
 *   - returns status string itself when unknown
 *
 *   getApprovalStatusBadge
 *   - returns badge with label, color, bg for each known status
 *   - returns gray fallback badge for unknown status
 *   - fallback label is the unknown status string
 *
 *   SUBMISSION_CONTENT_TYPE_LABELS
 *   - covers all content type keys
 *
 *   BLOG_SUBMISSION_TYPE
 *   - has IDEA and DRAFT values
 */

import {
  APPROVAL_STATUS,
  APPROVAL_STATUS_LABELS,
  APPROVAL_STATUS_BADGES,
  SUBMISSION_CONTENT_TYPE,
  SUBMISSION_CONTENT_TYPE_LABELS,
  BLOG_SUBMISSION_TYPE,
  getApprovalStatusLabel,
  getApprovalStatusBadge,
} from '../approval-status'

// ============================================================================
// APPROVAL_STATUS constant shape
// ============================================================================

describe('APPROVAL_STATUS', () => {
  it('has the expected status values', () => {
    expect(APPROVAL_STATUS.PENDING).toBe('pending')
    expect(APPROVAL_STATUS.APPROVED).toBe('approved')
    expect(APPROVAL_STATUS.REJECTED).toBe('rejected')
    expect(APPROVAL_STATUS.REQUIRES_CHANGES).toBe('requires_changes')
    expect(APPROVAL_STATUS.PUBLISHED).toBe('published')
  })

  it('covers exactly 5 statuses', () => {
    expect(Object.keys(APPROVAL_STATUS)).toHaveLength(5)
  })
})

// ============================================================================
// getApprovalStatusLabel
// ============================================================================

describe('getApprovalStatusLabel', () => {
  it('returns Swiss-German label for PENDING', () => {
    expect(getApprovalStatusLabel(APPROVAL_STATUS.PENDING)).toBe('Ausstehend')
  })

  it('returns Swiss-German label for APPROVED', () => {
    expect(getApprovalStatusLabel(APPROVAL_STATUS.APPROVED)).toBe('Genehmigt')
  })

  it('returns Swiss-German label for REJECTED', () => {
    expect(getApprovalStatusLabel(APPROVAL_STATUS.REJECTED)).toBe('Abgelehnt')
  })

  it('returns Swiss-German label for REQUIRES_CHANGES', () => {
    expect(getApprovalStatusLabel(APPROVAL_STATUS.REQUIRES_CHANGES)).toBe('Änderungen erforderlich')
  })

  it('returns Swiss-German label for PUBLISHED', () => {
    expect(getApprovalStatusLabel(APPROVAL_STATUS.PUBLISHED)).toBe('Veröffentlicht')
  })

  it('returns the status string itself for unknown status', () => {
    expect(getApprovalStatusLabel('unknown_status')).toBe('unknown_status')
  })

  it('returns empty string for empty string input', () => {
    // APPROVAL_STATUS_LABELS has no empty-string key → falls through to ?? ''
    expect(getApprovalStatusLabel('')).toBe('')
  })
})

// ============================================================================
// getApprovalStatusBadge
// ============================================================================

describe('getApprovalStatusBadge', () => {
  it('returns badge for PENDING with yellow styling', () => {
    const badge = getApprovalStatusBadge(APPROVAL_STATUS.PENDING)
    expect(badge.label).toBe('Ausstehend')
    expect(badge.color).toContain('yellow')
    expect(badge.bg).toContain('yellow')
  })

  it('returns badge for APPROVED with green styling', () => {
    const badge = getApprovalStatusBadge(APPROVAL_STATUS.APPROVED)
    expect(badge.label).toBe('Genehmigt')
    expect(badge.color).toContain('primary')
    expect(badge.bg).toContain('primary')
  })

  it('returns badge for REJECTED with red styling', () => {
    const badge = getApprovalStatusBadge(APPROVAL_STATUS.REJECTED)
    expect(badge.label).toBe('Abgelehnt')
    expect(badge.color).toContain('error')
    expect(badge.bg).toContain('error')
  })

  it('returns badge for REQUIRES_CHANGES with orange styling', () => {
    const badge = getApprovalStatusBadge(APPROVAL_STATUS.REQUIRES_CHANGES)
    expect(badge.label).toBe('Änderungen erforderlich')
    expect(badge.color).toContain('orange')
    expect(badge.bg).toContain('orange')
  })

  it('returns badge for PUBLISHED with blue styling', () => {
    const badge = getApprovalStatusBadge(APPROVAL_STATUS.PUBLISHED)
    expect(badge.label).toBe('Veröffentlicht')
    expect(badge.color).toContain('info')
    expect(badge.bg).toContain('info')
  })

  it('returns gray fallback badge for unknown status', () => {
    const badge = getApprovalStatusBadge('mystery_status')
    expect(badge.label).toBe('mystery_status')
    expect(badge.color).toContain('neutral')
    expect(badge.bg).toContain('neutral')
  })

  it('fallback badge label is the unknown status string', () => {
    const badge = getApprovalStatusBadge('draft')
    expect(badge.label).toBe('draft')
  })
})

// ============================================================================
// APPROVAL_STATUS_LABELS completeness
// ============================================================================

describe('APPROVAL_STATUS_LABELS', () => {
  it('has a label for every APPROVAL_STATUS value', () => {
    for (const status of Object.values(APPROVAL_STATUS)) {
      expect(APPROVAL_STATUS_LABELS[status]).toBeTruthy()
    }
  })
})

// ============================================================================
// APPROVAL_STATUS_BADGES completeness
// ============================================================================

describe('APPROVAL_STATUS_BADGES', () => {
  it('has a badge for every APPROVAL_STATUS value', () => {
    for (const status of Object.values(APPROVAL_STATUS)) {
      const badge = APPROVAL_STATUS_BADGES[status]
      expect(badge).toBeDefined()
      expect(badge.label).toBeTruthy()
      expect(badge.color).toBeTruthy()
      expect(badge.bg).toBeTruthy()
    }
  })
})

// ============================================================================
// SUBMISSION_CONTENT_TYPE
// ============================================================================

describe('SUBMISSION_CONTENT_TYPE', () => {
  it('has expected type values', () => {
    expect(SUBMISSION_CONTENT_TYPE.WORKSHOP).toBe('workshop')
    expect(SUBMISSION_CONTENT_TYPE.BLOG_POST).toBe('blog_post')
    expect(SUBMISSION_CONTENT_TYPE.PRODUCT).toBe('product')
    expect(SUBMISSION_CONTENT_TYPE.SERVICE).toBe('service')
    expect(SUBMISSION_CONTENT_TYPE.LISTING).toBe('listing')
  })
})

describe('SUBMISSION_CONTENT_TYPE_LABELS', () => {
  it('has a label for every SUBMISSION_CONTENT_TYPE value', () => {
    for (const type of Object.values(SUBMISSION_CONTENT_TYPE)) {
      expect(SUBMISSION_CONTENT_TYPE_LABELS[type]).toBeTruthy()
    }
  })
})

// ============================================================================
// BLOG_SUBMISSION_TYPE
// ============================================================================

describe('BLOG_SUBMISSION_TYPE', () => {
  it('has IDEA and DRAFT values', () => {
    expect(BLOG_SUBMISSION_TYPE.IDEA).toBe('idea')
    expect(BLOG_SUBMISSION_TYPE.DRAFT).toBe('draft')
  })
})
