/**
 * Intake hero-state derivation tests.
 * Severity ladder: failed-QC > ready-to-publish > in-progress > empty > healthy.
 */

import { deriveIntakeHeroState } from '../IntakePipelineView'
import { INTAKE_STATUS } from '@/config/intake-status'

/**
 * Stub translator returning canonical DE strings — the function uses ICU
 * plurals via next-intl; the stub resolves the test cases without depending
 * on the next-intl runtime.
 */
function makeStubTranslator() {
  const fakeT = (key: string, params?: Record<string, unknown>): string => {
    const count = (params?.count as number | undefined) ?? 0
    const published = params?.published as number | undefined
    switch (key) {
      case 'hero.kpis.total': return 'Total'
      case 'hero.kpis.inProgress': return 'In Bearbeitung'
      case 'hero.kpis.failed': return 'Fehlgeschlagen'
      case 'hero.kpis.ready': return 'Bereit'
      case 'hero.kpis.published': return 'Publiziert'
      case 'hero.failed.headline':
        return `${count} ${count === 1 ? 'Gerät' : 'Geräte'} mit fehlgeschlagener Prüfung`
      case 'hero.failed.sub':
        return 'Entscheiden: Problem beheben und erneut prüfen, oder Stufe ändern (Ersatzteile/Recycling).'
      case 'hero.failed.cta': return 'Fehlgeschlagene anzeigen'
      case 'hero.ready.headline':
        return `${count} ${count === 1 ? 'Gerät' : 'Geräte'} bereit zum Publizieren`
      case 'hero.ready.sub':
        return 'Bereit-Geräte stehen fertig in der Pipeline. Publizieren macht sie öffentlich.'
      case 'hero.ready.cta': return 'Bereit anzeigen'
      case 'hero.inProgress.headline':
        return `${count} ${count === 1 ? 'Gerät' : 'Geräte'} in Bearbeitung`
      case 'hero.inProgress.sub':
        return 'Diagnose, Test oder Aufbereitung läuft. Status aktuell halten.'
      case 'hero.inProgress.cta': return 'In Bearbeitung anzeigen'
      case 'hero.empty.headline': return 'Pipeline ist leer'
      case 'hero.empty.sub':
        return 'Sobald ein Gerät reinkommt, taucht es hier auf. Erfasse das erste.'
      case 'hero.empty.cta': return 'Neues Gerät erfassen'
      case 'hero.healthy.headline': return 'Pipeline im grünen Bereich.'
      case 'hero.healthy.sub':
        return `${published} Geräte publiziert, nichts wartet auf Bearbeitung.`
      default: return key
    }
  }
  return fakeT as unknown as Parameters<typeof deriveIntakeHeroState>[3]
}

const onStatusFilter = jest.fn()
const onCreateNew = jest.fn()
const t = makeStubTranslator()

beforeEach(() => jest.clearAllMocks())

describe('deriveIntakeHeroState', () => {
  it('FAILED beats everything (blocked devices need a decision)', () => {
    const s = deriveIntakeHeroState(
      { total: 10, inProgress: 5, failed: 1, ready: 2, published: 2 },
      onStatusFilter,
      onCreateNew,
      t,
    )
    expect(s.tone).toBe('urgent')
    expect(s.headline).toContain('1 Gerät mit fehlgeschlagener Prüfung')
    if (s.cta && 'onClick' in s.cta) s.cta.onClick()
    expect(onStatusFilter).toHaveBeenCalledWith(INTAKE_STATUS.FAILED)
  })

  it('READY beats inProgress (ready devices are the bottleneck)', () => {
    const s = deriveIntakeHeroState(
      { total: 10, inProgress: 5, failed: 0, ready: 2, published: 3 },
      onStatusFilter,
      onCreateNew,
      t,
    )
    expect(s.tone).toBe('attention')
    expect(s.headline).toContain('2 Geräte bereit')
    expect(s.cta?.label).toContain('Bereit')
    if (s.cta && 'onClick' in s.cta) s.cta.onClick()
    expect(onStatusFilter).toHaveBeenCalledWith(INTAKE_STATUS.READY)
  })

  it('IN_PROGRESS when no ready devices but in-progress > 0', () => {
    const s = deriveIntakeHeroState(
      { total: 8, inProgress: 4, failed: 0, ready: 0, published: 4 },
      onStatusFilter,
      onCreateNew,
      t,
    )
    expect(s.tone).toBe('attention')
    expect(s.headline).toContain('4 Geräte in Bearbeitung')
    if (s.cta && 'onClick' in s.cta) s.cta.onClick()
    expect(onStatusFilter).toHaveBeenCalledWith(INTAKE_STATUS.IN_PROGRESS)
  })

  it('EMPTY when total === 0', () => {
    const s = deriveIntakeHeroState(
      { total: 0, inProgress: 0, failed: 0, ready: 0, published: 0 },
      onStatusFilter,
      onCreateNew,
      t,
    )
    expect(s.tone).toBe('empty')
    expect(s.headline).toContain('leer')
    expect(s.cta?.label).toContain('Neues Gerät')
    if (s.cta && 'onClick' in s.cta) s.cta.onClick()
    expect(onCreateNew).toHaveBeenCalled()
  })

  it('HEALTHY when only published > 0 (nothing waiting)', () => {
    const s = deriveIntakeHeroState(
      { total: 10, inProgress: 0, failed: 0, ready: 0, published: 10 },
      onStatusFilter,
      onCreateNew,
      t,
    )
    expect(s.tone).toBe('healthy')
    expect(s.headline).toMatch(/grünen Bereich/)
    expect(s.sub).toContain('10 Geräte publiziert')
    expect(s.cta).toBeUndefined()
  })

  it('pluralizes "Gerät" correctly', () => {
    const singular = deriveIntakeHeroState(
      { total: 1, inProgress: 1, failed: 0, ready: 0, published: 0 },
      onStatusFilter,
      onCreateNew,
      t,
    )
    expect(singular.headline).toContain('1 Gerät in Bearbeitung')

    const plural = deriveIntakeHeroState(
      { total: 3, inProgress: 3, failed: 0, ready: 0, published: 0 },
      onStatusFilter,
      onCreateNew,
      t,
    )
    expect(plural.headline).toContain('3 Geräte in Bearbeitung')
  })

  it('kpis always include Total + 4 status counts in order', () => {
    const s = deriveIntakeHeroState(
      { total: 5, inProgress: 1, failed: 0, ready: 2, published: 2 },
      onStatusFilter,
      onCreateNew,
      t,
    )
    expect(s.kpis.map((k) => k.label)).toEqual([
      'Total',
      'In Bearbeitung',
      'Fehlgeschlagen',
      'Bereit',
      'Publiziert',
    ])
    expect(s.kpis.map((k) => k.value)).toEqual([5, 1, 0, 2, 2])
  })
})
