/**
 * Tests for config/dashboard.ts — dashboard card filtering and grouping helpers.
 *
 * Mission-relevant: the user dashboard shows different cards based on role.
 * If getDashboardCardsForRole('seller') returns no cards, sellers see an
 * empty dashboard. If getAllDashboardCards skips the admin card for staff,
 * staff can't reach the admin area.
 *
 * Behaviors locked:
 *   getDashboardCardsForRole
 *   - returns cards for a regular user (no role required cards included)
 *   - cards with no requiredRole are always included
 *
 *   groupCardsByCategory
 *   - returns a Map with all categories initialized
 *   - cards are placed in correct category bucket
 *   - cards within a category are sorted by priority
 *
 *   getAdminCard
 *   - returns a card with href '/admin' and category 'admin'
 *
 *   getAllDashboardCards
 *   - includes admin card for staff users
 *   - excludes admin card for non-staff users
 */

jest.mock('lucide-react', () => {
  const icon = (name: string) => ({ displayName: name })
  return new Proxy({}, { get: (_t, prop) => icon(prop as string) })
})

import {
  getDashboardCardsForRole,
  groupCardsByCategory,
  getAdminCard,
  getAllDashboardCards,
  DASHBOARD_CARDS,
} from '../dashboard'

// ============================================================================
// getDashboardCardsForRole
// ============================================================================

describe('getDashboardCardsForRole', () => {
  it('returns an array', () => {
    expect(Array.isArray(getDashboardCardsForRole())).toBe(true)
  })

  it('all returned cards have required shape', () => {
    const cards = getDashboardCardsForRole()
    for (const card of cards) {
      expect(card.id).toBeTruthy()
      expect(card.href).toBeTruthy()
      expect(card.category).toBeTruthy()
      expect(typeof card.priority).toBe('number')
    }
  })

  it('cards without requiredRole are included for a user with no roles', () => {
    const cards = getDashboardCardsForRole(null, {})
    const unrestricted = DASHBOARD_CARDS.filter(c => !c.requiredRole)
    expect(cards.length).toBeGreaterThanOrEqual(unrestricted.length)
  })

  it('cards with requiredRole seller are included for seller user', () => {
    const cards = getDashboardCardsForRole(null, { communityRoles: ['seller'] })
    const sellerCards = DASHBOARD_CARDS.filter(c => c.requiredRole === 'seller')
    for (const sc of sellerCards) {
      expect(cards.some(c => c.id === sc.id)).toBe(true)
    }
  })
})

// ============================================================================
// groupCardsByCategory
// ============================================================================

describe('groupCardsByCategory', () => {
  it('returns a Map', () => {
    const grouped = groupCardsByCategory(DASHBOARD_CARDS)
    expect(grouped instanceof Map).toBe(true)
  })

  it('all cards appear in their correct category bucket', () => {
    const grouped = groupCardsByCategory(DASHBOARD_CARDS)
    for (const card of DASHBOARD_CARDS) {
      const bucket = grouped.get(card.category)
      expect(bucket).toBeDefined()
      expect(bucket!.some(c => c.id === card.id)).toBe(true)
    }
  })

  it('cards within each category are sorted by priority ascending', () => {
    const grouped = groupCardsByCategory(DASHBOARD_CARDS)
    for (const [, cards] of grouped) {
      for (let i = 1; i < cards.length; i++) {
        expect(cards[i].priority).toBeGreaterThanOrEqual(cards[i - 1].priority)
      }
    }
  })
})

// ============================================================================
// getAdminCard
// ============================================================================

describe('getAdminCard', () => {
  it('returns a card pointing to /admin', () => {
    expect(getAdminCard().href).toBe('/admin')
  })

  it('has category "admin"', () => {
    expect(getAdminCard().category).toBe('admin')
  })

  it('has id "admin"', () => {
    expect(getAdminCard().id).toBe('admin')
  })
})

// ============================================================================
// getAllDashboardCards
// ============================================================================

describe('getAllDashboardCards', () => {
  it('includes admin card for staff users', () => {
    const cards = getAllDashboardCards({ isStaff: true })
    expect(cards.some(c => c.id === 'admin')).toBe(true)
  })

  it('includes admin card for super admin users', () => {
    const cards = getAllDashboardCards({ isSuperAdmin: true })
    expect(cards.some(c => c.id === 'admin')).toBe(true)
  })

  it('excludes admin card for non-staff users', () => {
    const cards = getAllDashboardCards({ isStaff: false, isSuperAdmin: false })
    expect(cards.some(c => c.id === 'admin')).toBe(false)
  })
})
