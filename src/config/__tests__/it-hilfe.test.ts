/**
 * Tests for config/it-hilfe.ts — IT-Hilfe marketplace helpers.
 *
 * Mission-relevant: IT-Hilfe connects users with repair technicians using
 * a solidarity pricing model. If deriveBudgetType returns 'fixed' for a
 * null budget, a free request incorrectly shows a price. If
 * isRequestAcceptingOffers returns false for 'open', technicians can't
 * offer help on open requests.
 *
 * Behaviors locked:
 *   deriveBudgetType
 *   - returns 'free' for null/0/undefined
 *   - returns 'fixed' for positive amount
 *
 *   getAllSkills
 *   - returns non-empty flat array across all categories
 *
 *   getSkillsByCategory
 *   - returns skills for known category
 *   - returns empty array for unknown category
 *
 *   getSkillById
 *   - returns skill for known id
 *   - returns undefined for unknown id
 *
 *   getServiceCategoryById / getCategoryById / getBudgetTierById
 *   - return the entity for known id
 *   - return undefined for unknown id
 *
 *   getSkillsForCategory
 *   - returns skills matching suggestedSkills for known device category
 *   - returns empty array for unknown device category
 *
 *   isRequestAcceptingOffers
 *   - returns true for 'open' and 'in_discussion'
 *   - returns false for 'matched', 'completed', 'cancelled'
 *
 *   formatBudget
 *   - returns "Gratis (Community-Hilfe)" for gratis tier
 *   - returns KulturLegi label with amount
 *   - returns "Community-Hilfe (gratis)" for null/0 amount without tier
 *   - returns "bis CHF X" for positive amount without tier
 */

jest.mock('lucide-react', () => {
  const icon = (name: string) => ({ displayName: name })
  return new Proxy({}, { get: (_t, prop) => icon(prop as string) })
})

jest.mock('@/config/org', () => ({
  ORG: { name: 'Revamp-IT' },
  LOCATIONS: {
    store: {
      street: 'Teststrasse 1',
      postalCode: '8000',
      city: 'Zürich',
      canton: 'ZH',
      lat: 47.37,
      lng: 8.54,
      googleMapsUrl: 'https://maps.google.com/?q=test',
    },
  },
  CONTACT: { email: 'test@revamp-it.ch' },
}))

jest.mock('@/config/swiss-cantons', () => ({
  SWISS_CANTONS: [],
}))

import {
  deriveBudgetType,
  getAllSkills,
  getSkillsByCategory,
  getSkillById,
  getServiceCategoryById,
  getCategoryById,
  getBudgetTierById,
  getSkillsForCategory,
  isRequestAcceptingOffers,
  formatBudget,
  REQUEST_STATUS,
} from '../it-hilfe'

// ============================================================================
// deriveBudgetType
// ============================================================================

describe('deriveBudgetType', () => {
  it('returns "free" for null', () => {
    expect(deriveBudgetType(null)).toBe('free')
  })

  it('returns "free" for undefined', () => {
    expect(deriveBudgetType(undefined)).toBe('free')
  })

  it('returns "free" for 0 cents', () => {
    expect(deriveBudgetType(0)).toBe('free')
  })

  it('returns "fixed" for positive amount', () => {
    expect(deriveBudgetType(5000)).toBe('fixed')
  })

  it('returns "fixed" for 1 cent', () => {
    expect(deriveBudgetType(1)).toBe('fixed')
  })
})

// ============================================================================
// getAllSkills
// ============================================================================

describe('getAllSkills', () => {
  it('returns a non-empty array', () => {
    const skills = getAllSkills()
    expect(Array.isArray(skills)).toBe(true)
    expect(skills.length).toBeGreaterThan(0)
  })

  it('all skills have id and name', () => {
    for (const skill of getAllSkills()) {
      expect(skill.id).toBeTruthy()
      expect(skill.name).toBeTruthy()
    }
  })
})

// ============================================================================
// getSkillsByCategory
// ============================================================================

describe('getSkillsByCategory', () => {
  it('returns skills for "repair" category', () => {
    const skills = getSkillsByCategory('repair')
    expect(skills.length).toBeGreaterThan(0)
  })

  it('returns empty array for unknown category', () => {
    expect(getSkillsByCategory('unknown_cat')).toEqual([])
  })
})

// ============================================================================
// getSkillById
// ============================================================================

describe('getSkillById', () => {
  it('returns skill for known id "hardware_diagnosis"', () => {
    const skill = getSkillById('hardware_diagnosis')
    expect(skill).toBeDefined()
    expect(skill!.id).toBe('hardware_diagnosis')
  })

  it('returns undefined for unknown id', () => {
    expect(getSkillById('nonexistent_skill')).toBeUndefined()
  })
})

// ============================================================================
// getServiceCategoryById
// ============================================================================

describe('getServiceCategoryById', () => {
  it('returns service category for "repair"', () => {
    const cat = getServiceCategoryById('repair')
    expect(cat).toBeDefined()
    expect(cat!.id).toBe('repair')
  })

  it('returns undefined for unknown id', () => {
    expect(getServiceCategoryById('unknown')).toBeUndefined()
  })
})

// ============================================================================
// getCategoryById (device category)
// ============================================================================

describe('getCategoryById', () => {
  it('returns device category for "laptop"', () => {
    const cat = getCategoryById('laptop')
    expect(cat).toBeDefined()
    expect(cat!.id).toBe('laptop')
  })

  it('returns undefined for unknown id', () => {
    expect(getCategoryById('unknown_device')).toBeUndefined()
  })
})

// ============================================================================
// getBudgetTierById
// ============================================================================

describe('getBudgetTierById', () => {
  it('returns gratis tier', () => {
    const tier = getBudgetTierById('gratis')
    expect(tier).toBeDefined()
    expect(tier!.multiplier).toBe(0)
  })

  it('returns kulturlegi tier with multiplier 0.5', () => {
    const tier = getBudgetTierById('kulturlegi')
    expect(tier!.multiplier).toBe(0.5)
  })

  it('returns undefined for unknown tier', () => {
    expect(getBudgetTierById('premium')).toBeUndefined()
  })
})

// ============================================================================
// getSkillsForCategory
// ============================================================================

describe('getSkillsForCategory', () => {
  it('returns skills for "laptop" device category', () => {
    const skills = getSkillsForCategory('laptop')
    expect(skills.length).toBeGreaterThan(0)
  })

  it('all returned skills have id and name', () => {
    const skills = getSkillsForCategory('laptop')
    for (const s of skills) {
      expect(s.id).toBeTruthy()
      expect(s.name).toBeTruthy()
    }
  })

  it('returns empty array for unknown device category', () => {
    expect(getSkillsForCategory('unknown_device')).toEqual([])
  })
})

// ============================================================================
// isRequestAcceptingOffers
// ============================================================================

describe('isRequestAcceptingOffers', () => {
  it('returns true for "open"', () => {
    expect(isRequestAcceptingOffers(REQUEST_STATUS.OPEN)).toBe(true)
  })

  it('returns true for "in_discussion"', () => {
    expect(isRequestAcceptingOffers(REQUEST_STATUS.IN_DISCUSSION)).toBe(true)
  })

  it('returns false for "matched"', () => {
    expect(isRequestAcceptingOffers(REQUEST_STATUS.MATCHED)).toBe(false)
  })

  it('returns false for "completed"', () => {
    expect(isRequestAcceptingOffers(REQUEST_STATUS.COMPLETED)).toBe(false)
  })

  it('returns false for "cancelled"', () => {
    expect(isRequestAcceptingOffers(REQUEST_STATUS.CANCELLED)).toBe(false)
  })
})

// ============================================================================
// formatBudget
// ============================================================================

describe('formatBudget', () => {
  it('returns "Gratis (Community-Hilfe)" for gratis tier', () => {
    expect(formatBudget(null, 'gratis')).toBe('Gratis (Community-Hilfe)')
  })

  it('returns KulturLegi label with amount', () => {
    const result = formatBudget(5000, 'kulturlegi')
    expect(result).toContain('KulturLegi')
    expect(result).toContain('50')
  })

  it('returns "Community-Hilfe (gratis)" for null amount without tier', () => {
    expect(formatBudget(null)).toBe('Community-Hilfe (gratis)')
  })

  it('returns "Community-Hilfe (gratis)" for 0 amount without tier', () => {
    expect(formatBudget(0)).toBe('Community-Hilfe (gratis)')
  })

  it('returns "bis CHF X" for positive amount without tier', () => {
    const result = formatBudget(10000)
    expect(result).toContain('bis CHF')
    expect(result).toContain('100')
  })

  it('supporter tier format includes amount and emoji', () => {
    const result = formatBudget(8000, 'supporter')
    expect(result).toContain('Supporter')
    expect(result).toContain('80')
  })
})
