/**
 * Marketplace hero-state derivation tests.
 * Severity ladder: openReports > unverified > healthy.
 */

import type { Stats } from '../types'
import { __test__deriveHeroState } from '../MarketplaceAdminClient'

/**
 * Stub translator returning canonical DE strings.
 */
function makeStubTranslator() {
  const fakeT = (key: string, params?: Record<string, unknown>): string => {
    const count = (params?.count as number | undefined) ?? 0
    const active = params?.active as number | undefined
    switch (key) {
      case 'hero.kpis.active': return 'Aktiv'
      case 'hero.kpis.unverified': return 'Ungeprüft'
      case 'hero.kpis.openReports': return 'Offene Meldungen'
      case 'hero.kpis.revampit': return 'RevampIT-Inserate'
      case 'hero.urgent.headline':
        return `${count} offene ${count === 1 ? 'Meldung' : 'Meldungen'} prüfen`
      case 'hero.urgent.sub':
        return 'Gemeldete Inserate brauchen eine Entscheidung — sonst sehen sie Käufer weiter.'
      case 'hero.urgent.cta': return 'Meldungen ansehen'
      case 'hero.attention.headline':
        return `${count} ${count === 1 ? 'ungeprüftes Inserat' : 'ungeprüfte Inserate'}`
      case 'hero.attention.sub':
        return 'Neue Einträge warten auf Freischaltung — bis dahin sind sie nicht öffentlich.'
      case 'hero.attention.cta': return 'Inserate prüfen'
      case 'hero.healthy.headline': return 'Marketplace im grünen Bereich.'
      case 'hero.healthy.sub':
        return `${active} aktive Inserate, keine offenen Meldungen.`
      default: return key
    }
  }
  return fakeT as unknown as Parameters<typeof __test__deriveHeroState>[2]
}

function makeStats(overrides: Partial<Stats> = {}): Stats {
  return {
    total: 50,
    byStatus: { active: 30 },
    unverified: 0,
    verified: 30,
    openReports: 0,
    revampit: 5,
    community: 25,
    totalOrders: 0,
    revenueCents: 0,
    ...overrides,
  }
}

const onJump = jest.fn()
const t = makeStubTranslator()
beforeEach(() => jest.clearAllMocks())

describe('Marketplace deriveHeroState', () => {
  it('URGENT wins when openReports > 0 (even if unverified also > 0)', () => {
    const s = __test__deriveHeroState(
      makeStats({ openReports: 2, unverified: 4 }),
      onJump, t,
    )
    expect(s.tone).toBe('urgent')
    expect(s.headline).toContain('2 offene Meldung')
    expect(s.cta?.label).toBe('Meldungen ansehen')
  })

  it('ATTENTION when openReports === 0 + unverified > 0', () => {
    const s = __test__deriveHeroState(
      makeStats({ unverified: 7 }),
      onJump, t,
    )
    expect(s.tone).toBe('attention')
    expect(s.headline).toContain('7 ungeprüfte')
    expect(s.cta?.label).toBe('Inserate prüfen')
  })

  it('HEALTHY when all clear', () => {
    const s = __test__deriveHeroState(makeStats(), onJump, t)
    expect(s.tone).toBe('healthy')
    expect(s.headline).toMatch(/grünen Bereich/)
    expect(s.cta).toBeUndefined()
  })

  it('pluralizes "Meldung" correctly', () => {
    const singular = __test__deriveHeroState(
      makeStats({ openReports: 1 }),
      onJump, t,
    )
    expect(singular.headline).toContain('1 offene Meldung prüfen')

    const plural = __test__deriveHeroState(
      makeStats({ openReports: 3 }),
      onJump, t,
    )
    expect(plural.headline).toContain('3 offene Meldungen prüfen')
  })

  it('kpis always have the same 4 labels in order', () => {
    const s = __test__deriveHeroState(makeStats(), onJump, t)
    expect(s.kpis.map((k) => k.label)).toEqual([
      'Aktiv',
      'Ungeprüft',
      'Offene Meldungen',
      'RevampIT-Inserate',
    ])
  })

  it('onClick CTA jumps to the right tab', () => {
    const s = __test__deriveHeroState(
      makeStats({ openReports: 1 }),
      onJump, t,
    )
    if (s.cta && 'onClick' in s.cta) s.cta.onClick()
    expect(onJump).toHaveBeenCalledWith('reports')
  })

  it('unverified jumps to listings tab', () => {
    const s = __test__deriveHeroState(
      makeStats({ unverified: 1 }),
      onJump, t,
    )
    if (s.cta && 'onClick' in s.cta) s.cta.onClick()
    expect(onJump).toHaveBeenCalledWith('listings')
  })
})
