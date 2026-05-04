/**
 * Tests for config/marketplace-status.ts — marketplace and product status helpers.
 *
 * Mission-relevant: product listing status drives what buyers see in the shop.
 * If getMarketplaceStatusLabel('published') returns the raw key instead of
 * 'Veröffentlicht', the admin UI loses its German labels. If
 * getProductStatusBadgeColor returns the wrong CSS class for 'rejected',
 * a red badge might appear green — misleading moderators.
 *
 * Behaviors locked:
 *   getMarketplaceStatusLabel
 *   - returns German label for known status
 *   - falls back to the raw status string for unknown status
 *
 *   getMarketplaceStatusBadgeColor
 *   - returns badge CSS class for known status
 *   - falls back to gray for unknown status
 *
 *   getProductStatusLabel
 *   - returns German label for known product status
 *   - falls back to the raw status string for unknown status
 *
 *   getProductStatusBadgeColor
 *   - returns badge CSS class for known product status
 *   - falls back to gray for unknown status
 */

import {
  MARKETPLACE_STATUS,
  PRODUCT_STATUS,
  getMarketplaceStatusLabel,
  getMarketplaceStatusBadgeColor,
  getProductStatusLabel,
  getProductStatusBadgeColor,
} from '../marketplace-status'

// ============================================================================
// getMarketplaceStatusLabel
// ============================================================================

describe('getMarketplaceStatusLabel', () => {
  it('returns "Veröffentlicht" for published', () => {
    expect(getMarketplaceStatusLabel(MARKETPLACE_STATUS.PUBLISHED)).toBe('Veröffentlicht')
  })

  it('returns "Entwurf" for draft', () => {
    expect(getMarketplaceStatusLabel(MARKETPLACE_STATUS.DRAFT)).toBe('Entwurf')
  })

  it('falls back to the raw status string for unknown status', () => {
    expect(getMarketplaceStatusLabel('unknown_status')).toBe('unknown_status')
  })

  it('falls back to empty string when status is empty string', () => {
    expect(getMarketplaceStatusLabel('')).toBe('')
  })
})

// ============================================================================
// getMarketplaceStatusBadgeColor
// ============================================================================

describe('getMarketplaceStatusBadgeColor', () => {
  it('returns green badge for published', () => {
    const color = getMarketplaceStatusBadgeColor(MARKETPLACE_STATUS.PUBLISHED)
    expect(color).toContain('primary')
  })

  it('returns warning badge for draft', () => {
    const color = getMarketplaceStatusBadgeColor(MARKETPLACE_STATUS.DRAFT)
    expect(color).toContain('warning')
  })

  it('falls back to gray for unknown status', () => {
    const color = getMarketplaceStatusBadgeColor('unknown_status')
    expect(color).toContain('neutral')
  })
})

// ============================================================================
// getProductStatusLabel
// ============================================================================

describe('getProductStatusLabel', () => {
  it('returns "Freigegeben" for approved', () => {
    expect(getProductStatusLabel(PRODUCT_STATUS.APPROVED)).toBe('Freigegeben')
  })

  it('returns "Zur Prüfung" for pending_review', () => {
    expect(getProductStatusLabel(PRODUCT_STATUS.PENDING_REVIEW)).toBe('Zur Prüfung')
  })

  it('returns "Abgelehnt" for rejected', () => {
    expect(getProductStatusLabel(PRODUCT_STATUS.REJECTED)).toBe('Abgelehnt')
  })

  it('falls back to raw status string for unknown status', () => {
    expect(getProductStatusLabel('some_new_status')).toBe('some_new_status')
  })
})

// ============================================================================
// getProductStatusBadgeColor
// ============================================================================

describe('getProductStatusBadgeColor', () => {
  it('returns blue badge for approved', () => {
    const color = getProductStatusBadgeColor(PRODUCT_STATUS.APPROVED)
    expect(color).toContain('info')
  })

  it('returns orange badge for pending_review', () => {
    const color = getProductStatusBadgeColor(PRODUCT_STATUS.PENDING_REVIEW)
    expect(color).toContain('orange')
  })

  it('returns red badge for rejected', () => {
    const color = getProductStatusBadgeColor(PRODUCT_STATUS.REJECTED)
    expect(color).toContain('error')
  })

  it('falls back to gray for unknown status', () => {
    const color = getProductStatusBadgeColor('unknown_status')
    expect(color).toContain('neutral')
  })
})
