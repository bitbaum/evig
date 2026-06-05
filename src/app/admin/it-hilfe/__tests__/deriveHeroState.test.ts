/**
 * IT-Hilfe hero-state derivation tests.
 * Pure function — exercises every branch of the prioritization ladder.
 *
 * Why these tests matter: the hero is the ONE thing an admin reads on
 * the landing. Wrong tone / wrong CTA = wrong action taken first.
 */

import type { Stats } from '../types'

// The helper is exported from the client component file under
// __test__deriveHeroState. Importing the file pulls in React/use client,
// but the function itself is pure — the export survives.
import { __test__deriveHeroState } from '../ITHilfeAdminClient'

function makeStats(overrides: Partial<Stats> = {}): Stats {
  return {
    total: 10,
    byStatus: { open: 0 },
    byUrgency: { urgent: 0 },
    activeHelpers: 5,
    verifiedHelpers: 3,
    totalOffers: 12,
    resolutionRate: 80,
    ...overrides,
  }
}

const onJump = jest.fn()
beforeEach(() => jest.clearAllMocks())

describe('IT-Hilfe deriveHeroState', () => {
  it('URGENT wins when urgent requests > 0 (even if other conditions also true)', () => {
    const s = __test__deriveHeroState(
      makeStats({ byUrgency: { urgent: 2 }, byStatus: { open: 5 }, activeHelpers: 0 }),
      onJump,
    )
    expect(s.tone).toBe('urgent')
    expect(s.headline).toContain('2 dringende')
    expect(s.cta?.label).toBe('Dringende anzeigen')
  })

  it('ATTENTION (no techniker) when openRequests > 0 + activeHelpers === 0', () => {
    const s = __test__deriveHeroState(
      makeStats({ byStatus: { open: 3 }, activeHelpers: 0 }),
      onJump,
    )
    expect(s.tone).toBe('attention')
    expect(s.headline).toContain('keine aktiven Techniker')
    expect(s.cta?.label).toBe('Bewerbungen prüfen')
    // Linked CTA, not onClick
    expect(s.cta && 'href' in s.cta).toBe(true)
  })

  it('ATTENTION (techniker available) when openRequests > 0 + activeHelpers > 0', () => {
    const s = __test__deriveHeroState(
      makeStats({ byStatus: { open: 4 }, activeHelpers: 3 }),
      onJump,
    )
    expect(s.tone).toBe('attention')
    expect(s.headline).toContain('4 offene')
    expect(s.cta?.label).toBe('Anfragen ansehen')
  })

  it('EMPTY when 0 open + 0 active techniker', () => {
    const s = __test__deriveHeroState(
      makeStats({ activeHelpers: 0 }),
      onJump,
    )
    expect(s.tone).toBe('empty')
    expect(s.headline).toContain('keine aktiven Techniker')
    expect(s.cta && 'href' in s.cta).toBe(true)
  })

  it('HEALTHY when 0 open + active techniker exist', () => {
    const s = __test__deriveHeroState(
      makeStats({ resolutionRate: 92, total: 25 }),
      onJump,
    )
    expect(s.tone).toBe('healthy')
    expect(s.headline).toMatch(/grünen Bereich/)
    expect(s.sub).toMatch(/25 Anfragen.*92%/)
    expect(s.cta).toBeUndefined()
  })

  it('pluralizes "Anfrage" correctly (1 = singular, >1 = plural)', () => {
    const singular = __test__deriveHeroState(
      makeStats({ byUrgency: { urgent: 1 } }),
      onJump,
    )
    expect(singular.headline).toContain('1 dringende Anfrage warten')

    const plural = __test__deriveHeroState(
      makeStats({ byUrgency: { urgent: 5 } }),
      onJump,
    )
    expect(plural.headline).toContain('5 dringende Anfragen warten')
  })

  it('kpis always includes the same 4 fields in the same order', () => {
    const s = __test__deriveHeroState(makeStats(), onJump)
    expect(s.kpis.map((k) => k.label)).toEqual([
      'Offen',
      'Aktive Techniker',
      'Verifiziert',
      'Lösungsrate',
    ])
  })

  it('onClick CTA invokes the passed jump function', () => {
    const s = __test__deriveHeroState(
      makeStats({ byUrgency: { urgent: 1 } }),
      onJump,
    )
    expect(s.cta && 'onClick' in s.cta).toBe(true)
    if (s.cta && 'onClick' in s.cta) s.cta.onClick()
    expect(onJump).toHaveBeenCalledTimes(1)
  })
})
