/**
 * Tests for IT-Hilfe, marketplace, invoice, and location status config functions.
 *
 * it-hilfe.ts has the most logic: deriveBudgetType (null/0/positive/negative),
 * formatBudget (tier-aware CHF formatting), isRequestAcceptingOffers (status
 * predicate), and skill/category/status lookup utilities.
 *
 * marketplace-status.ts, invoice-status.ts, location-status.ts are simpler
 * label lookups with fallback to raw string — included for completeness.
 */

// ============================================================================
// it-hilfe.ts
// ============================================================================

import {
  deriveBudgetType,
  isRequestAcceptingOffers,
  formatBudget,
  getAllSkills,
  getSkillById,
  getSkillIds,
  getSkillsByCategory,
  getSkillsForCategory,
  getSkillsGroupedByCategory,
  getBudgetTierById,
  getUrgencyById,
  getServiceCategoryById,
  getCategoryById,
  getCategoryIds,
  getRequestStatusById,
  getOfferStatusById,
  REQUEST_STATUS,
  OFFER_STATUS,
} from '../it-hilfe'

// ─── deriveBudgetType ─────────────────────────────────────────────────────────

describe('deriveBudgetType', () => {
  it('positive amount → "fixed"', () => {
    expect(deriveBudgetType(5000)).toBe('fixed')
  })

  it('1 cent → "fixed"', () => {
    expect(deriveBudgetType(1)).toBe('fixed')
  })

  it('null → "free"', () => {
    expect(deriveBudgetType(null)).toBe('free')
  })

  it('undefined → "free"', () => {
    expect(deriveBudgetType(undefined)).toBe('free')
  })

  it('0 → "free" (zero is not > 0)', () => {
    expect(deriveBudgetType(0)).toBe('free')
  })

  it('negative amount → "free" (negative is not > 0)', () => {
    expect(deriveBudgetType(-100)).toBe('free')
  })

  it('large positive → "fixed"', () => {
    expect(deriveBudgetType(100000)).toBe('fixed')
  })
})

// ─── isRequestAcceptingOffers ─────────────────────────────────────────────────

describe('isRequestAcceptingOffers', () => {
  it('open → accepts offers', () => {
    expect(isRequestAcceptingOffers(REQUEST_STATUS.OPEN)).toBe(true)
  })

  it('matched → does NOT accept offers', () => {
    expect(isRequestAcceptingOffers(REQUEST_STATUS.MATCHED)).toBe(false)
  })

  it('completed → does NOT accept offers', () => {
    expect(isRequestAcceptingOffers(REQUEST_STATUS.COMPLETED)).toBe(false)
  })

  it('cancelled → does NOT accept offers', () => {
    expect(isRequestAcceptingOffers(REQUEST_STATUS.CANCELLED)).toBe(false)
  })

  it('unknown status → does NOT accept offers', () => {
    expect(isRequestAcceptingOffers('draft')).toBe(false)
  })
})

// ─── formatBudget ─────────────────────────────────────────────────────────────

describe('formatBudget', () => {
  it('null amount without tier → "Community-Hilfe (gratis)"', () => {
    expect(formatBudget(null)).toBe('Community-Hilfe (gratis)')
  })

  it('0 amount without tier → "Community-Hilfe (gratis)"', () => {
    expect(formatBudget(0)).toBe('Community-Hilfe (gratis)')
  })

  it('positive amount without tier → "bis CHF N"', () => {
    expect(formatBudget(5000)).toBe('bis CHF 50')
  })

  it('positive amount without tier uses toFixed(0) — no decimals', () => {
    expect(formatBudget(7550)).toBe('bis CHF 76')
  })

  it('gratis tier → "Gratis (Community-Hilfe)" regardless of amount', () => {
    expect(formatBudget(null, 'gratis')).toBe('Gratis (Community-Hilfe)')
    expect(formatBudget(5000, 'gratis')).toBe('Gratis (Community-Hilfe)')
  })

  it('kulturlegi tier with amount → "bis CHF N (KulturLegi)"', () => {
    expect(formatBudget(3000, 'kulturlegi')).toBe('bis CHF 30 (KulturLegi)')
  })

  it('kulturlegi tier with null amount → falls back to "Community-Hilfe (gratis)"', () => {
    // tier found but maxBudgetCents is falsy → skips kulturlegi branch
    expect(formatBudget(null, 'kulturlegi')).toBe('Community-Hilfe (gratis)')
  })

  it('supporter tier with amount → "ab CHF N (Supporter 💚)"', () => {
    expect(formatBudget(10000, 'supporter')).toBe('ab CHF 100 (Supporter 💚)')
  })

  it('unknown tier falls through to amount-based formatting', () => {
    expect(formatBudget(5000, 'unknown_tier')).toBe('bis CHF 50')
  })
})

// ─── Skill lookup functions ───────────────────────────────────────────────────

describe('getAllSkills', () => {
  it('returns a non-empty array', () => {
    const skills = getAllSkills()
    expect(Array.isArray(skills)).toBe(true)
    expect(skills.length).toBeGreaterThan(0)
  })

  it('each skill has id, name, description', () => {
    for (const skill of getAllSkills().slice(0, 5)) {
      expect(skill).toHaveProperty('id')
      expect(skill).toHaveProperty('name')
      expect(skill).toHaveProperty('description')
    }
  })
})

describe('getSkillById', () => {
  it('returns a skill for a known ID', () => {
    const skill = getSkillById('hardware_diagnosis')
    expect(skill).not.toBeUndefined()
    expect(skill?.id).toBe('hardware_diagnosis')
  })

  it('returns undefined for unknown ID', () => {
    expect(getSkillById('nonexistent_skill')).toBeUndefined()
  })
})

describe('getSkillIds', () => {
  it('returns array of string IDs', () => {
    const ids = getSkillIds()
    expect(ids.length).toBeGreaterThan(0)
    for (const id of ids) {
      expect(typeof id).toBe('string')
    }
  })

  it('contains known skill ID "hardware_diagnosis"', () => {
    expect(getSkillIds()).toContain('hardware_diagnosis')
  })

  it('length matches getAllSkills()', () => {
    expect(getSkillIds().length).toBe(getAllSkills().length)
  })
})

describe('getSkillsByCategory', () => {
  it('returns non-empty array for a known category', () => {
    const skills = getSkillsByCategory('repair')
    expect(skills.length).toBeGreaterThan(0)
  })

  it('returns empty array for unknown category', () => {
    expect(getSkillsByCategory('nonexistent_category')).toEqual([])
  })

  it('each returned skill has id and name', () => {
    for (const skill of getSkillsByCategory('repair')) {
      expect(skill).toHaveProperty('id')
      expect(skill).toHaveProperty('name')
    }
  })
})

describe('getSkillsGroupedByCategory', () => {
  it('returns a non-empty array', () => {
    const grouped = getSkillsGroupedByCategory()
    expect(grouped.length).toBeGreaterThan(0)
  })

  it('each entry has category and skills array', () => {
    for (const entry of getSkillsGroupedByCategory()) {
      expect(entry).toHaveProperty('category')
      expect(entry).toHaveProperty('skills')
      expect(Array.isArray(entry.skills)).toBe(true)
    }
  })
})

// ─── Status/tier lookup functions ─────────────────────────────────────────────

describe('getBudgetTierById', () => {
  it('returns gratis tier', () => {
    const tier = getBudgetTierById('gratis')
    expect(tier).not.toBeUndefined()
    expect(tier?.id).toBe('gratis')
  })

  it('returns kulturlegi tier', () => {
    expect(getBudgetTierById('kulturlegi')?.id).toBe('kulturlegi')
  })

  it('returns undefined for unknown tier', () => {
    expect(getBudgetTierById('crypto_tier')).toBeUndefined()
  })
})

describe('getUrgencyById', () => {
  it('returns a result for "normal"', () => {
    const urgency = getUrgencyById('normal')
    expect(urgency).not.toBeUndefined()
  })

  it('returns undefined for unknown urgency', () => {
    expect(getUrgencyById('apocalyptic')).toBeUndefined()
  })
})

describe('getServiceCategoryById', () => {
  it('returns "repair" service category', () => {
    const cat = getServiceCategoryById('repair')
    expect(cat).not.toBeUndefined()
    expect(cat?.id).toBe('repair')
  })

  it('returns undefined for unknown category', () => {
    expect(getServiceCategoryById('unknown')).toBeUndefined()
  })
})

describe('getCategoryIds', () => {
  it('returns a non-empty array of strings', () => {
    const ids = getCategoryIds()
    expect(ids.length).toBeGreaterThan(0)
    for (const id of ids) {
      expect(typeof id).toBe('string')
    }
  })
})

describe('getRequestStatusById', () => {
  it('returns status for "open"', () => {
    const status = getRequestStatusById('open')
    expect(status).not.toBeUndefined()
    expect(status?.id).toBe('open')
  })

  it('returns undefined for unknown status', () => {
    expect(getRequestStatusById('limbo')).toBeUndefined()
  })
})

describe('getOfferStatusById', () => {
  it('returns status for "pending"', () => {
    expect(getOfferStatusById(OFFER_STATUS.PENDING)?.id).toBe('pending')
  })

  it('returns status for "accepted"', () => {
    expect(getOfferStatusById(OFFER_STATUS.ACCEPTED)?.id).toBe('accepted')
  })

  it('returns undefined for unknown', () => {
    expect(getOfferStatusById('ghost')).toBeUndefined()
  })
})

// ============================================================================
// marketplace-status.ts
// ============================================================================

import {
  getMarketplaceStatusLabel,
  getMarketplaceStatusBadgeColor,
  getProductStatusLabel,
  getProductStatusBadgeColor,
  MARKETPLACE_STATUS,
  PRODUCT_STATUS,
} from '../marketplace-status'

describe('getMarketplaceStatusLabel', () => {
  it('published → "Veröffentlicht"', () => {
    expect(getMarketplaceStatusLabel(MARKETPLACE_STATUS.PUBLISHED)).toBe('Veröffentlicht')
  })

  it('draft → "Entwurf"', () => {
    expect(getMarketplaceStatusLabel(MARKETPLACE_STATUS.DRAFT)).toBe('Entwurf')
  })

  it('unknown → raw string', () => {
    expect(getMarketplaceStatusLabel('mystery')).toBe('mystery')
  })
})

describe('getMarketplaceStatusBadgeColor', () => {
  it('published → green CSS classes', () => {
    expect(getMarketplaceStatusBadgeColor(MARKETPLACE_STATUS.PUBLISHED)).toContain('primary')
  })

  it('draft → warning CSS classes', () => {
    expect(getMarketplaceStatusBadgeColor(MARKETPLACE_STATUS.DRAFT)).toContain('warning')
  })

  it('unknown → gray fallback', () => {
    expect(getMarketplaceStatusBadgeColor('unknown')).toContain('neutral')
  })
})

describe('getProductStatusLabel', () => {
  it('approved → "Freigegeben" (not "Genehmigt")', () => {
    // Product-specific label — distinguishes from generic approval flow
    expect(getProductStatusLabel(PRODUCT_STATUS.APPROVED)).toBe('Freigegeben')
  })

  it('pending_review → "Zur Prüfung"', () => {
    expect(getProductStatusLabel(PRODUCT_STATUS.PENDING_REVIEW)).toBe('Zur Prüfung')
  })

  it('unknown → raw string', () => {
    expect(getProductStatusLabel('ghost')).toBe('ghost')
  })
})

describe('getProductStatusBadgeColor', () => {
  it('approved → primary CSS classes', () => {
    expect(getProductStatusBadgeColor(PRODUCT_STATUS.APPROVED)).toContain('primary')
  })

  it('unknown → gray fallback', () => {
    expect(getProductStatusBadgeColor('xyz')).toContain('neutral')
  })
})

// ============================================================================
// invoice-status.ts
// ============================================================================

import {
  getInvoiceStatusLabel,
  INVOICE_STATUS,
} from '../invoice-status'

describe('getInvoiceStatusLabel', () => {
  it('draft → "Entwurf"', () => {
    expect(getInvoiceStatusLabel(INVOICE_STATUS.DRAFT)).toBe('Entwurf')
  })

  it('sent → "Versendet"', () => {
    expect(getInvoiceStatusLabel(INVOICE_STATUS.SENT)).toBe('Versendet')
  })

  it('paid → "Bezahlt"', () => {
    expect(getInvoiceStatusLabel(INVOICE_STATUS.PAID)).toBe('Bezahlt')
  })

  it('overdue → "Überfällig" (proper umlaut, not "Ueberfaellig")', () => {
    expect(getInvoiceStatusLabel(INVOICE_STATUS.OVERDUE)).toBe('Überfällig')
  })

  it('cancelled → "Storniert"', () => {
    expect(getInvoiceStatusLabel(INVOICE_STATUS.CANCELLED)).toBe('Storniert')
  })

  it('non-empty label for all known statuses', () => {
    for (const status of Object.values(INVOICE_STATUS)) {
      expect(getInvoiceStatusLabel(status).length).toBeGreaterThan(0)
    }
  })

  it('unknown → raw string', () => {
    expect(getInvoiceStatusLabel('mystery_invoice')).toBe('mystery_invoice')
  })
})

// ============================================================================
// location-status.ts
// ============================================================================

import {
  getLocationStatusLabel,
  LOCATION_STATUS,
} from '../location-status'

describe('getLocationStatusLabel', () => {
  it('pending → "Ausstehend"', () => {
    expect(getLocationStatusLabel(LOCATION_STATUS.PENDING)).toBe('Ausstehend')
  })

  it('approved → "Genehmigt"', () => {
    expect(getLocationStatusLabel(LOCATION_STATUS.APPROVED)).toBe('Genehmigt')
  })

  it('rejected → "Abgelehnt"', () => {
    expect(getLocationStatusLabel(LOCATION_STATUS.REJECTED)).toBe('Abgelehnt')
  })

  it('suspended → "Suspendiert"', () => {
    expect(getLocationStatusLabel(LOCATION_STATUS.SUSPENDED)).toBe('Suspendiert')
  })

  it('non-empty label for all known statuses', () => {
    for (const status of Object.values(LOCATION_STATUS)) {
      expect(getLocationStatusLabel(status).length).toBeGreaterThan(0)
    }
  })

  it('unknown → raw string', () => {
    expect(getLocationStatusLabel('atlantis_status')).toBe('atlantis_status')
  })
})
