/**
 * Tests for remaining config utility functions.
 *
 * Covers:
 *   - marketplace.ts: formatCHF, formatPrice, formatPriceCents
 *   - team.ts: getEmploymentTypeLabel, getDepartmentLabel, getEmploymentTypeColor, getDepartmentColor
 *   - urls.ts: getVerificationUrl, getPasswordResetUrl
 *   - review-status.ts: getReviewStatusLabel, getReviewStatusBadgeColor, getReviewFilterLabel, getReviewActionLabel
 *   - workshop-registration-status.ts: getWorkshopRegistrationStatusLabel
 *   - refund.ts: getRefundStatusLabel, getRefundReasonLabel
 *   - service-categories.ts: getCategoryStyle, getCategoryBadgeClasses, getCategoryLabel
 *   - workshops.ts: getLevelBadgeClass, getCategoryNames
 */

// ============================================================================
// marketplace.ts — formatCHF, formatPrice, formatPriceCents
// ============================================================================

import {
  formatCHF,
  formatPrice,
  formatPriceCents,
} from '../marketplace'

describe('formatCHF', () => {
  it('0 → "Gratis" (not CHF 0)', () => {
    expect(formatCHF(0)).toBe('Gratis')
  })

  it('formats positive integer as CHF amount', () => {
    // Intl.NumberFormat with Swiss locale may produce "CHF 100" or "CHF\u00a0100"
    // Just verify it contains "100" and "CHF"
    const result = formatCHF(100)
    expect(result).toContain('100')
    expect(result.toLowerCase()).toContain('chf')
  })

  it('returns a string for any positive number', () => {
    expect(typeof formatCHF(50)).toBe('string')
    expect(formatCHF(50).length).toBeGreaterThan(0)
  })
})

describe('formatPrice', () => {
  it('delegates to formatCHF — 0 → "Gratis"', () => {
    expect(formatPrice(0)).toBe(formatCHF(0))
  })

  it('same result as formatCHF for positive amounts', () => {
    expect(formatPrice(150)).toBe(formatCHF(150))
  })
})

describe('formatPriceCents', () => {
  it('null → "Auf Anfrage"', () => {
    expect(formatPriceCents(null)).toBe('Auf Anfrage')
  })

  it('0 → "Kostenlos"', () => {
    expect(formatPriceCents(0)).toBe('Kostenlos')
  })

  it('whole-franc amount → "CHF N" (no decimals)', () => {
    expect(formatPriceCents(5000)).toBe('CHF 50')
  })

  it('fractional-franc amount → "CHF N.NN" (2 decimals)', () => {
    expect(formatPriceCents(4999)).toBe('CHF 49.99')
  })

  it('1 cent → "CHF 0.01"', () => {
    expect(formatPriceCents(1)).toBe('CHF 0.01')
  })

  it('100 cents → "CHF 1" (whole franc, no decimals)', () => {
    expect(formatPriceCents(100)).toBe('CHF 1')
  })

  it('always starts with "CHF " for non-null non-zero inputs', () => {
    expect(formatPriceCents(1234)).toMatch(/^CHF /)
  })
})

// ============================================================================
// team.ts — getEmploymentTypeLabel, getDepartmentLabel, *Color
// ============================================================================

import {
  getEmploymentTypeLabel,
  getDepartmentLabel,
  getEmploymentTypeColor,
  getDepartmentColor,
} from '../team'

describe('getEmploymentTypeLabel', () => {
  it('null → "Unbekannt"', () => {
    expect(getEmploymentTypeLabel(null)).toBe('Unbekannt')
  })

  it('undefined → "Unbekannt"', () => {
    expect(getEmploymentTypeLabel(undefined)).toBe('Unbekannt')
  })

  it('volunteer → "Freiwillige/r"', () => {
    expect(getEmploymentTypeLabel('volunteer')).toBe('Freiwillige/r')
  })

  it('unknown type → raw string fallback', () => {
    expect(getEmploymentTypeLabel('unknown_role')).toBe('unknown_role')
  })
})

describe('getDepartmentLabel', () => {
  it('null → "Nicht zugewiesen"', () => {
    expect(getDepartmentLabel(null)).toBe('Nicht zugewiesen')
  })

  it('undefined → "Nicht zugewiesen"', () => {
    expect(getDepartmentLabel(undefined)).toBe('Nicht zugewiesen')
  })

  it('unknown department → raw string fallback', () => {
    expect(getDepartmentLabel('secret_dept')).toBe('secret_dept')
  })
})

describe('getEmploymentTypeColor', () => {
  it('null → gray CSS class', () => {
    const color = getEmploymentTypeColor(null)
    expect(color).toContain('neutral')
  })

  it('volunteer → green CSS class', () => {
    const color = getEmploymentTypeColor('volunteer')
    expect(color).toContain('primary')
  })

  it('unknown → gray CSS class (default)', () => {
    const color = getEmploymentTypeColor('unknown_type')
    expect(color).toContain('neutral')
  })
})

describe('getDepartmentColor', () => {
  it('null → gray CSS class', () => {
    expect(getDepartmentColor(null)).toContain('neutral')
  })

  it('unknown → gray CSS class', () => {
    expect(getDepartmentColor('mystery_dept')).toContain('neutral')
  })
})

// ============================================================================
// urls.ts — getVerificationUrl, getPasswordResetUrl
// ============================================================================

import { getVerificationUrl, getPasswordResetUrl, APP_URL } from '../urls'

describe('getVerificationUrl', () => {
  it('returns a string containing the token', () => {
    const url = getVerificationUrl('abc123')
    expect(url).toContain('abc123')
  })

  it('includes the verify-email path', () => {
    expect(getVerificationUrl('tok')).toContain('/auth/verify-email')
  })

  it('uses token as query param', () => {
    expect(getVerificationUrl('mytoken')).toContain('token=mytoken')
  })

  it('starts with the APP_URL base', () => {
    expect(getVerificationUrl('x')).toMatch(/^https?:\/\//)
  })
})

describe('getPasswordResetUrl', () => {
  it('returns a string containing the token', () => {
    expect(getPasswordResetUrl('reset123')).toContain('reset123')
  })

  it('includes the reset-password path', () => {
    expect(getPasswordResetUrl('tok')).toContain('/auth/reset-password')
  })

  it('uses token as query param', () => {
    expect(getPasswordResetUrl('mytoken')).toContain('token=mytoken')
  })
})

// ============================================================================
// review-status.ts
// ============================================================================

import {
  getReviewStatusLabel,
  getReviewStatusBadgeColor,
  getReviewFilterLabel,
  getReviewActionLabel,
  REVIEW_STATUS,
} from '../review-status'

describe('getReviewStatusLabel', () => {
  it('published → "Veröffentlicht"', () => {
    expect(getReviewStatusLabel(REVIEW_STATUS.PUBLISHED)).toBe('Veröffentlicht')
  })

  it('pending_moderation → "Wartet auf Moderation"', () => {
    expect(getReviewStatusLabel(REVIEW_STATUS.PENDING_MODERATION)).toBe('Wartet auf Moderation')
  })

  it('hidden → "Ausgeblendet"', () => {
    expect(getReviewStatusLabel(REVIEW_STATUS.HIDDEN)).toBe('Ausgeblendet')
  })

  it('deleted → "Gelöscht"', () => {
    expect(getReviewStatusLabel(REVIEW_STATUS.DELETED)).toBe('Gelöscht')
  })

  it('unknown → "Unbekannt" (not raw string)', () => {
    expect(getReviewStatusLabel('mystery')).toBe('Unbekannt')
  })
})

describe('getReviewStatusBadgeColor', () => {
  it('published → green classes', () => {
    expect(getReviewStatusBadgeColor(REVIEW_STATUS.PUBLISHED)).toContain('primary')
  })

  it('hidden → red classes', () => {
    expect(getReviewStatusBadgeColor(REVIEW_STATUS.HIDDEN)).toContain('error')
  })

  it('unknown → falls back to pending_moderation badge (orange)', () => {
    expect(getReviewStatusBadgeColor('unknown')).toContain('orange')
  })
})

describe('getReviewFilterLabel', () => {
  it('published → "Veröffentlicht"', () => {
    expect(getReviewFilterLabel(REVIEW_STATUS.PUBLISHED)).toBe('Veröffentlicht')
  })

  it('pending_moderation → "Moderation" (short label)', () => {
    expect(getReviewFilterLabel(REVIEW_STATUS.PENDING_MODERATION)).toBe('Moderation')
  })

  it('unknown → raw string', () => {
    expect(getReviewFilterLabel('my_filter')).toBe('my_filter')
  })
})

describe('getReviewActionLabel', () => {
  it('approve → "freigegeben"', () => {
    expect(getReviewActionLabel('approve')).toBe('freigegeben')
  })

  it('hide → "ausgeblendet"', () => {
    expect(getReviewActionLabel('hide')).toBe('ausgeblendet')
  })

  it('delete → "gelöscht"', () => {
    expect(getReviewActionLabel('delete')).toBe('gelöscht')
  })

  it('restore → "wiederhergestellt"', () => {
    expect(getReviewActionLabel('restore')).toBe('wiederhergestellt')
  })

  it('unknown action → "moderiert" (generic fallback)', () => {
    expect(getReviewActionLabel('unknown_action')).toBe('moderiert')
  })
})

// ============================================================================
// workshop-registration-status.ts
// ============================================================================

import {
  getWorkshopRegistrationStatusLabel,
  WORKSHOP_REGISTRATION_STATUS,
} from '../workshop-registration-status'

describe('getWorkshopRegistrationStatusLabel', () => {
  it('pending → "Ausstehend"', () => {
    expect(getWorkshopRegistrationStatusLabel(WORKSHOP_REGISTRATION_STATUS.PENDING)).toBe('Ausstehend')
  })

  it('confirmed → "Bestätigt"', () => {
    expect(getWorkshopRegistrationStatusLabel(WORKSHOP_REGISTRATION_STATUS.CONFIRMED)).toBe('Bestätigt')
  })

  it('waitlist → "Warteliste"', () => {
    expect(getWorkshopRegistrationStatusLabel(WORKSHOP_REGISTRATION_STATUS.WAITLIST)).toBe('Warteliste')
  })

  it('attended → "Teilgenommen"', () => {
    expect(getWorkshopRegistrationStatusLabel(WORKSHOP_REGISTRATION_STATUS.ATTENDED)).toBe('Teilgenommen')
  })

  it('no_show → "Nicht erschienen"', () => {
    expect(getWorkshopRegistrationStatusLabel(WORKSHOP_REGISTRATION_STATUS.NO_SHOW)).toBe('Nicht erschienen')
  })

  it('unknown → raw string', () => {
    expect(getWorkshopRegistrationStatusLabel('ghost_status')).toBe('ghost_status')
  })

  it('non-empty label for all known statuses', () => {
    for (const status of Object.values(WORKSHOP_REGISTRATION_STATUS)) {
      expect(getWorkshopRegistrationStatusLabel(status).length).toBeGreaterThan(0)
    }
  })
})

// ============================================================================
// refund.ts
// ============================================================================

import {
  getRefundStatusLabel,
  getRefundReasonLabel,
  REFUND_STATUS,
  REFUND_REASON,
} from '../refund'

describe('getRefundStatusLabel', () => {
  it('requested → "Angefragt"', () => {
    expect(getRefundStatusLabel(REFUND_STATUS.REQUESTED)).toBe('Angefragt')
  })

  it('completed → "Abgeschlossen"', () => {
    expect(getRefundStatusLabel(REFUND_STATUS.COMPLETED)).toBe('Abgeschlossen')
  })

  it('non-empty label for all known statuses', () => {
    for (const status of Object.values(REFUND_STATUS)) {
      expect(getRefundStatusLabel(status).length).toBeGreaterThan(0)
    }
  })

  it('unknown → raw string', () => {
    expect(getRefundStatusLabel('mystery_refund')).toBe('mystery_refund')
  })
})

describe('getRefundReasonLabel', () => {
  it('customer_request → "Kundenwunsch"', () => {
    expect(getRefundReasonLabel(REFUND_REASON.CUSTOMER_REQUEST)).toBe('Kundenwunsch')
  })

  it('fraud → "Betrug"', () => {
    expect(getRefundReasonLabel(REFUND_REASON.FRAUD)).toBe('Betrug')
  })

  it('non-empty label for all known reasons', () => {
    for (const reason of Object.values(REFUND_REASON)) {
      expect(getRefundReasonLabel(reason).length).toBeGreaterThan(0)
    }
  })

  it('unknown → raw string', () => {
    expect(getRefundReasonLabel('mystery_reason')).toBe('mystery_reason')
  })
})

// ============================================================================
// service-categories.ts — getCategoryStyle, getCategoryBadgeClasses, getCategoryLabel
// ============================================================================

import {
  getCategoryStyle,
  getCategoryBadgeClasses,
  getCategoryLabel,
} from '../service-categories'

describe('getCategoryStyle', () => {
  it('null → returns general fallback style with badge', () => {
    const style = getCategoryStyle(null)
    expect(style).toHaveProperty('badge')
    expect(style.badge).toHaveProperty('bg')
  })

  it('known category → returns a style with badge.bg and badge.text', () => {
    const style = getCategoryStyle('repair')
    expect(style).toHaveProperty('badge')
    expect(style.badge).toHaveProperty('bg')
    expect(style.badge).toHaveProperty('text')
  })

  it('unknown category → returns general fallback', () => {
    const style = getCategoryStyle('unknown_category')
    expect(style).toBeDefined()
    expect(style).toHaveProperty('badge')
  })
})

describe('getCategoryBadgeClasses', () => {
  it('null → returns a non-empty CSS string (fallback)', () => {
    const classes = getCategoryBadgeClasses(null)
    expect(classes.length).toBeGreaterThan(0)
    expect(classes).toContain(' ')  // joined from multiple parts
  })

  it('repair → returns CSS class string', () => {
    const classes = getCategoryBadgeClasses('repair')
    expect(classes.length).toBeGreaterThan(0)
  })
})

describe('getCategoryLabel', () => {
  it('null → "Allgemein"', () => {
    expect(getCategoryLabel(null)).toBe('Allgemein')
  })

  it('repair → "Reparatur"', () => {
    expect(getCategoryLabel('repair')).toBe('Reparatur')
  })

  it('software → "Software"', () => {
    expect(getCategoryLabel('software')).toBe('Software')
  })

  it('unknown → raw string fallback', () => {
    expect(getCategoryLabel('mystery_cat')).toBe('mystery_cat')
  })
})

// ============================================================================
// workshops.ts — getLevelBadgeClass, getCategoryNames
// ============================================================================

import {
  getLevelBadgeClass,
  getCategoryNames,
} from '../workshops'

describe('getLevelBadgeClass', () => {
  it('null → gray badge class', () => {
    expect(getLevelBadgeClass(null)).toBe('bg-neutral-100 text-neutral-800')
  })

  it('undefined → gray badge class', () => {
    expect(getLevelBadgeClass(undefined)).toBe('bg-neutral-100 text-neutral-800')
  })

  it('returns a non-empty CSS string for a known level', () => {
    // Try "beginner" or "anfänger" — common workshop levels
    const result = getLevelBadgeClass('beginner')
    expect(typeof result).toBe('string')
    expect(result.length).toBeGreaterThan(0)
  })

  it('unknown level → gray badge class', () => {
    expect(getLevelBadgeClass('expert_ninja')).toBe('bg-neutral-100 text-neutral-800')
  })
})

describe('getCategoryNames', () => {
  it('returns a non-empty array of strings', () => {
    const names = getCategoryNames()
    expect(Array.isArray(names)).toBe(true)
    expect(names.length).toBeGreaterThan(0)
  })

  it('each name is a non-empty string', () => {
    for (const name of getCategoryNames()) {
      expect(typeof name).toBe('string')
      expect(name.length).toBeGreaterThan(0)
    }
  })
})
