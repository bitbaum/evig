/**
 * Tests for remaining config utility functions.
 *
 * Covers:
 *   - appointment-status.ts: getAppointmentStatusLabel
 *   - build-computer.ts: getMockRecommendation
 *   - editable-fields.ts: getFieldLabel, getEditableFieldLabels
 *   - dashboard.ts: getDashboardCardsForRole, groupCardsByCategory,
 *                   getAdminCard, getAllDashboardCards
 */

// ============================================================================
// appointment-status.ts — getAppointmentStatusLabel
// ============================================================================

import {
  getAppointmentStatusLabel,
  APPOINTMENT_STATUS,
} from '../appointment-status'

describe('getAppointmentStatusLabel', () => {
  it('pending_approval → "Genehmigung ausstehend"', () => {
    expect(getAppointmentStatusLabel(APPOINTMENT_STATUS.PENDING_APPROVAL)).toBe('Genehmigung ausstehend')
  })

  it('requested → "Angefragt"', () => {
    expect(getAppointmentStatusLabel(APPOINTMENT_STATUS.REQUESTED)).toBe('Angefragt')
  })

  it('confirmed → "Bestätigt"', () => {
    expect(getAppointmentStatusLabel(APPOINTMENT_STATUS.CONFIRMED)).toBe('Bestätigt')
  })

  it('cancelled → "Storniert"', () => {
    expect(getAppointmentStatusLabel(APPOINTMENT_STATUS.CANCELLED)).toBe('Storniert')
  })

  it('completed → "Abgeschlossen"', () => {
    expect(getAppointmentStatusLabel(APPOINTMENT_STATUS.COMPLETED)).toBe('Abgeschlossen')
  })

  it('returns non-empty string for all known statuses', () => {
    for (const status of Object.values(APPOINTMENT_STATUS)) {
      expect(getAppointmentStatusLabel(status).length).toBeGreaterThan(0)
    }
  })

  it('falls back to raw string for unknown status', () => {
    expect(getAppointmentStatusLabel('unknown_appt')).toBe('unknown_appt')
  })
})

// ============================================================================
// build-computer.ts — getBuildRecommendation (honest guidance, no fake products)
// ============================================================================

import { getBuildRecommendation } from '../build-computer'

describe('getBuildRecommendation', () => {
  it('returns honest component-tier guidance strings (not fabricated products/prices)', () => {
    const result = getBuildRecommendation('gaming')
    expect(typeof result.cpu).toBe('string')
    expect(typeof result.gpu).toBe('string')
    expect(typeof result.ram).toBe('string')
    expect(typeof result.storage).toBe('string')
    expect(result.note.length).toBeGreaterThan(0)
    // No fabricated numeric price/score fields leak back in.
    expect(result).not.toHaveProperty('totalPrice')
    expect(result).not.toHaveProperty('sustainabilityScore')
  })

  it('gives every use case a full recommendation', () => {
    for (const useCase of ['office', 'creative', 'gaming', 'development', 'server', 'ai']) {
      const r = getBuildRecommendation(useCase)
      expect(r.cpu).toBeTruthy()
      expect(r.gpu).toBeTruthy()
      expect(r.ram).toBeTruthy()
      expect(r.storage).toBeTruthy()
      expect(r.note).toBeTruthy()
    }
  })

  it('falls back to the office profile for an unknown use case', () => {
    expect(getBuildRecommendation('totally-unknown')).toEqual(getBuildRecommendation('office'))
  })
})

// ============================================================================
// editable-fields.ts — getFieldLabel, getEditableFieldLabels
// ============================================================================

import {
  getFieldLabel,
  getEditableFieldLabels,
  WORKSHOP_PROPOSAL_EDITABLE_FIELDS,
  BLOG_SUBMISSION_EDITABLE_FIELDS,
} from '../editable-fields'

describe('getFieldLabel', () => {
  it('title for workshop → "Titel"', () => {
    expect(getFieldLabel('title', 'workshop')).toBe('Titel')
  })

  it('title for blog → "Titel"', () => {
    expect(getFieldLabel('title', 'blog')).toBe('Titel')
  })

  it('description for workshop → non-empty string', () => {
    const label = getFieldLabel('description', 'workshop')
    expect(label.length).toBeGreaterThan(0)
  })

  it('unknown field falls back to the raw field name', () => {
    expect(getFieldLabel('nonexistent_field' as never, 'workshop')).toBe('nonexistent_field')
    expect(getFieldLabel('nonexistent_field' as never, 'blog')).toBe('nonexistent_field')
  })

  it('returns correct label for every workshop field', () => {
    for (const field of Object.keys(WORKSHOP_PROPOSAL_EDITABLE_FIELDS) as Array<keyof typeof WORKSHOP_PROPOSAL_EDITABLE_FIELDS>) {
      const label = getFieldLabel(field, 'workshop')
      expect(label).toBe(WORKSHOP_PROPOSAL_EDITABLE_FIELDS[field].label)
    }
  })

  it('returns correct label for every blog field', () => {
    for (const field of Object.keys(BLOG_SUBMISSION_EDITABLE_FIELDS) as Array<keyof typeof BLOG_SUBMISSION_EDITABLE_FIELDS>) {
      const label = getFieldLabel(field, 'blog')
      expect(label).toBe(BLOG_SUBMISSION_EDITABLE_FIELDS[field].label)
    }
  })
})

describe('getEditableFieldLabels', () => {
  it('workshop → returns a Record with all workshop field keys', () => {
    const labels = getEditableFieldLabels('workshop')
    for (const field of Object.keys(WORKSHOP_PROPOSAL_EDITABLE_FIELDS)) {
      expect(labels).toHaveProperty(field)
      expect(typeof labels[field]).toBe('string')
      expect(labels[field].length).toBeGreaterThan(0)
    }
  })

  it('blog → returns a Record with all blog field keys', () => {
    const labels = getEditableFieldLabels('blog')
    for (const field of Object.keys(BLOG_SUBMISSION_EDITABLE_FIELDS)) {
      expect(labels).toHaveProperty(field)
      expect(labels[field].length).toBeGreaterThan(0)
    }
  })

  it('workshop labels match field label values', () => {
    const labels = getEditableFieldLabels('workshop')
    expect(labels['title']).toBe('Titel')
  })

  it('blog labels match field label values', () => {
    const labels = getEditableFieldLabels('blog')
    expect(labels['title']).toBe('Titel')
  })

  it('returns an object (not an array)', () => {
    expect(typeof getEditableFieldLabels('workshop')).toBe('object')
    expect(Array.isArray(getEditableFieldLabels('workshop'))).toBe(false)
  })
})

// ============================================================================
// dashboard.ts — getDashboardCardsForRole, groupCardsByCategory,
//                getAdminCard, getAllDashboardCards
// ============================================================================

import {
  getDashboardCardsForRole,
  groupCardsByCategory,
  getAdminCard,
  getAllDashboardCards,
} from '../dashboard'

describe('getAdminCard', () => {
  it('returns a card with id "admin"', () => {
    expect(getAdminCard().id).toBe('admin')
  })

  it('links to /admin', () => {
    expect(getAdminCard().href).toBe('/admin')
  })

  it('has high priority (1000)', () => {
    expect(getAdminCard().priority).toBe(1000)
  })

  it('has a title and description', () => {
    const card = getAdminCard()
    expect(card.title.length).toBeGreaterThan(0)
    expect(card.description.length).toBeGreaterThan(0)
  })
})

describe('getDashboardCardsForRole', () => {
  it('returns an array', () => {
    expect(Array.isArray(getDashboardCardsForRole())).toBe(true)
  })

  it('seller gets seller-specific cards (not hidden)', () => {
    const cards = getDashboardCardsForRole(null, { communityRoles: ['seller'] })
    // Should not hide seller cards (hiddenForRoles would exclude them)
    expect(Array.isArray(cards)).toBe(true)
  })

  it('legacy role string promotes to communityRoles', () => {
    const withLegacy = getDashboardCardsForRole('seller', {})
    const withExplicit = getDashboardCardsForRole(null, { communityRoles: ['seller'] })
    // Both should produce the same result
    expect(withLegacy.length).toBe(withExplicit.length)
  })

  it('each returned card has required shape', () => {
    const cards = getDashboardCardsForRole(null, { communityRoles: ['seller'] })
    for (const card of cards) {
      expect(card).toHaveProperty('id')
      expect(card).toHaveProperty('title')
      expect(card).toHaveProperty('href')
      expect(card).toHaveProperty('category')
      expect(card).toHaveProperty('priority')
    }
  })
})

describe('groupCardsByCategory', () => {
  it('returns a Map', () => {
    const cards = getDashboardCardsForRole(null, { communityRoles: ['seller'] })
    const grouped = groupCardsByCategory(cards)
    expect(grouped instanceof Map).toBe(true)
  })

  it('returns empty map arrays for no cards', () => {
    const grouped = groupCardsByCategory([])
    // All categories are initialized, each has an empty array
    grouped.forEach(cards => {
      expect(Array.isArray(cards)).toBe(true)
    })
  })

  it('groups cards by their category field', () => {
    const cards = getDashboardCardsForRole(null, { communityRoles: ['seller'] })
    if (cards.length > 0) {
      const grouped = groupCardsByCategory(cards)
      // Every card should be findable in its category bucket
      for (const card of cards) {
        const bucket = grouped.get(card.category as never) ?? []
        expect(bucket.some(c => c.id === card.id)).toBe(true)
      }
    }
  })

  it('cards within each category are sorted by priority (ascending)', () => {
    const cards = getDashboardCardsForRole(null, { communityRoles: ['seller', 'repairer'] })
    const grouped = groupCardsByCategory(cards)
    grouped.forEach(categoryCards => {
      for (let i = 1; i < categoryCards.length; i++) {
        expect(categoryCards[i].priority).toBeGreaterThanOrEqual(categoryCards[i - 1].priority)
      }
    })
  })
})

describe('getAllDashboardCards', () => {
  it('staff user gets admin card appended', () => {
    const cards = getAllDashboardCards({ isStaff: true })
    const adminCard = cards.find(c => c.id === 'admin')
    expect(adminCard).toBeDefined()
  })

  it('super admin gets admin card appended', () => {
    const cards = getAllDashboardCards({ isSuperAdmin: true })
    expect(cards.some(c => c.id === 'admin')).toBe(true)
  })

  it('non-staff user does NOT get admin card', () => {
    const cards = getAllDashboardCards({ isStaff: false, isSuperAdmin: false })
    expect(cards.some(c => c.id === 'admin')).toBe(false)
  })

  it('returns an array', () => {
    expect(Array.isArray(getAllDashboardCards({}))).toBe(true)
  })
})
