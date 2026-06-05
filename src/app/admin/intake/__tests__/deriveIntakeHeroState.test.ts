/**
 * Intake hero-state derivation tests.
 * Severity ladder: ready-to-publish > in-progress > empty > healthy.
 */

import { deriveIntakeHeroState } from '../IntakePipelineView'
import { INTAKE_STATUS } from '@/config/intake-status'

const onStatusFilter = jest.fn()
const onCreateNew = jest.fn()

beforeEach(() => jest.clearAllMocks())

describe('deriveIntakeHeroState', () => {
  it('READY beats inProgress (ready devices are the bottleneck)', () => {
    const s = deriveIntakeHeroState(
      { total: 10, inProgress: 5, ready: 2, published: 3 },
      onStatusFilter,
      onCreateNew,
    )
    expect(s.tone).toBe('attention')
    expect(s.headline).toContain('2 Geräte bereit')
    expect(s.cta?.label).toContain('Bereit')
    if (s.cta && 'onClick' in s.cta) s.cta.onClick()
    expect(onStatusFilter).toHaveBeenCalledWith(INTAKE_STATUS.READY)
  })

  it('IN_PROGRESS when no ready devices but in-progress > 0', () => {
    const s = deriveIntakeHeroState(
      { total: 8, inProgress: 4, ready: 0, published: 4 },
      onStatusFilter,
      onCreateNew,
    )
    expect(s.tone).toBe('attention')
    expect(s.headline).toContain('4 Geräte in Bearbeitung')
    if (s.cta && 'onClick' in s.cta) s.cta.onClick()
    expect(onStatusFilter).toHaveBeenCalledWith(INTAKE_STATUS.IN_PROGRESS)
  })

  it('EMPTY when total === 0', () => {
    const s = deriveIntakeHeroState(
      { total: 0, inProgress: 0, ready: 0, published: 0 },
      onStatusFilter,
      onCreateNew,
    )
    expect(s.tone).toBe('empty')
    expect(s.headline).toContain('leer')
    expect(s.cta?.label).toContain('Neues Gerät')
    if (s.cta && 'onClick' in s.cta) s.cta.onClick()
    expect(onCreateNew).toHaveBeenCalled()
  })

  it('HEALTHY when only published > 0 (nothing waiting)', () => {
    const s = deriveIntakeHeroState(
      { total: 10, inProgress: 0, ready: 0, published: 10 },
      onStatusFilter,
      onCreateNew,
    )
    expect(s.tone).toBe('healthy')
    expect(s.headline).toMatch(/grünen Bereich/)
    expect(s.sub).toContain('10 Geräte publiziert')
    expect(s.cta).toBeUndefined()
  })

  it('pluralizes "Gerät" correctly', () => {
    const singular = deriveIntakeHeroState(
      { total: 1, inProgress: 1, ready: 0, published: 0 },
      onStatusFilter,
      onCreateNew,
    )
    expect(singular.headline).toContain('1 Gerät in Bearbeitung')

    const plural = deriveIntakeHeroState(
      { total: 3, inProgress: 3, ready: 0, published: 0 },
      onStatusFilter,
      onCreateNew,
    )
    expect(plural.headline).toContain('3 Geräte in Bearbeitung')
  })

  it('kpis always include Total + 3 status counts in order', () => {
    const s = deriveIntakeHeroState(
      { total: 5, inProgress: 1, ready: 2, published: 2 },
      onStatusFilter,
      onCreateNew,
    )
    expect(s.kpis.map((k) => k.label)).toEqual([
      'Total',
      'In Bearbeitung',
      'Bereit',
      'Publiziert',
    ])
    expect(s.kpis.map((k) => k.value)).toEqual([5, 1, 2, 2])
  })
})
