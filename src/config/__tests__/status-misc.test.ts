/**
 * Tests for miscellaneous status config helpers:
 *   - config/document-status.ts
 *   - config/certification-status.ts
 *   - config/report-status.ts
 *   - config/location-status.ts
 *   - config/membership-status.ts
 *   - config/repairer-status.ts
 *
 * Behaviors locked:
 *   getDocumentStatusBadge / getCertificationStatusBadge
 *   - return badge with label and colors for known status
 *   - return gray fallback badge for unknown status
 *
 *   getReportStatusLabel / getLocationStatusLabel
 *   - return German label for known status
 *   - fall back to raw value for unknown status
 *
 *   MEMBERSHIP_APPLICATION_STATUS_LABELS / MEMBERSHIP_TYPE_LABELS
 *   - have non-empty German labels for all values
 *
 *   REPAIRER_STATUS_LABELS
 *   - has non-empty German label for every repairer status
 */

import {
  getDocumentStatusBadge,
  DOCUMENT_STATUS,
  DOCUMENT_STATUS_LABELS,
} from '../document-status'

import {
  getCertificationStatusBadge,
  CERTIFICATION_STATUS,
  CERTIFICATION_STATUS_LABELS,
} from '../certification-status'

import {
  getReportStatusLabel,
  REPORT_STATUS,
} from '../report-status'

import {
  getLocationStatusLabel,
  LOCATION_STATUS,
} from '../location-status'

import {
  MEMBERSHIP_APPLICATION_STATUS,
  MEMBERSHIP_APPLICATION_STATUS_LABELS,
  MEMBERSHIP_TYPE,
  MEMBERSHIP_TYPE_LABELS,
} from '../membership-status'

import {
  REPAIRER_STATUS,
  REPAIRER_STATUS_LABELS,
} from '../repairer-status'

// ============================================================================
// getDocumentStatusBadge
// ============================================================================

describe('getDocumentStatusBadge', () => {
  it('returns badge with green color for approved', () => {
    const badge = getDocumentStatusBadge(DOCUMENT_STATUS.APPROVED)
    expect(badge.label).toBe(DOCUMENT_STATUS_LABELS.approved)
    expect(badge.bg).toContain('primary')
    expect(badge.color).toContain('primary')
  })

  it('returns badge for pending (gray)', () => {
    const badge = getDocumentStatusBadge(DOCUMENT_STATUS.PENDING)
    expect(badge.bg).toContain('neutral')
  })

  it('returns gray fallback badge for unknown status', () => {
    const badge = getDocumentStatusBadge('unknown_doc_status')
    expect(badge.label).toBe('unknown_doc_status')
    expect(badge.bg).toContain('neutral')
    expect(badge.color).toContain('neutral')
  })
})

// ============================================================================
// getCertificationStatusBadge
// ============================================================================

describe('getCertificationStatusBadge', () => {
  it('returns badge for verified status', () => {
    const badge = getCertificationStatusBadge(CERTIFICATION_STATUS.VERIFIED)
    expect(badge.label).toBe(CERTIFICATION_STATUS_LABELS.verified)
    expect(badge.bg).toContain('primary')
  })

  it('returns gray fallback badge for unknown status', () => {
    const badge = getCertificationStatusBadge('unknown_cert_status')
    expect(badge.label).toBe('unknown_cert_status')
    expect(badge.bg).toContain('neutral')
  })
})

// ============================================================================
// getReportStatusLabel
// ============================================================================

describe('getReportStatusLabel', () => {
  it('returns "Ausstehend" for pending', () => {
    expect(getReportStatusLabel(REPORT_STATUS.PENDING)).toBe('Ausstehend')
  })

  it('returns "Gelöst" for resolved', () => {
    expect(getReportStatusLabel(REPORT_STATUS.RESOLVED)).toBe('Gelöst')
  })

  it('falls back to raw value for unknown status', () => {
    expect(getReportStatusLabel('unknown_report_status')).toBe('unknown_report_status')
  })
})

// ============================================================================
// getLocationStatusLabel
// ============================================================================

describe('getLocationStatusLabel', () => {
  it('returns "Genehmigt" for approved', () => {
    expect(getLocationStatusLabel(LOCATION_STATUS.APPROVED)).toBe('Genehmigt')
  })

  it('returns "Suspendiert" for suspended', () => {
    expect(getLocationStatusLabel(LOCATION_STATUS.SUSPENDED)).toBe('Suspendiert')
  })

  it('falls back to raw value for unknown status', () => {
    expect(getLocationStatusLabel('unknown_location_status')).toBe('unknown_location_status')
  })
})

// ============================================================================
// MEMBERSHIP_APPLICATION_STATUS_LABELS
// ============================================================================

describe('MEMBERSHIP_APPLICATION_STATUS_LABELS', () => {
  it('has non-empty German label for every membership application status', () => {
    for (const status of Object.values(MEMBERSHIP_APPLICATION_STATUS)) {
      const label = MEMBERSHIP_APPLICATION_STATUS_LABELS[status]
      expect(typeof label).toBe('string')
      expect(label.length).toBeGreaterThan(0)
    }
  })
})

describe('MEMBERSHIP_TYPE_LABELS', () => {
  it('has non-empty German label for every membership type', () => {
    for (const type of Object.values(MEMBERSHIP_TYPE)) {
      const label = MEMBERSHIP_TYPE_LABELS[type]
      expect(typeof label).toBe('string')
      expect(label.length).toBeGreaterThan(0)
    }
  })
})

// ============================================================================
// REPAIRER_STATUS_LABELS
// ============================================================================

describe('REPAIRER_STATUS_LABELS', () => {
  it('has non-empty German label for every repairer status', () => {
    for (const status of Object.values(REPAIRER_STATUS)) {
      const label = REPAIRER_STATUS_LABELS[status]
      expect(typeof label).toBe('string')
      expect(label.length).toBeGreaterThan(0)
    }
  })

  it('has label for active status', () => {
    expect(REPAIRER_STATUS_LABELS[REPAIRER_STATUS.ACTIVE]).toBeTruthy()
  })
})
