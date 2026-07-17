import {
  getIntakeAgeDays,
  getIntakeStatus,
  INTAKE_STATUS,
  INTAKE_STUCK_AFTER_DAYS,
} from '../intake-status'

describe('getIntakeStatus', () => {
  it('uses the operational precedence published > failed > ready > in progress', () => {
    expect(getIntakeStatus({
      marketplace_status: 'published',
      checklist_failed: true,
      checklist_complete: true,
    })).toBe(INTAKE_STATUS.PUBLISHED)

    expect(getIntakeStatus({
      marketplace_status: 'draft',
      checklist_failed: true,
      checklist_complete: true,
    })).toBe(INTAKE_STATUS.FAILED)

    expect(getIntakeStatus({
      marketplace_status: 'draft',
      checklist_failed: false,
      checklist_complete: true,
    })).toBe(INTAKE_STATUS.READY)

    expect(getIntakeStatus({
      marketplace_status: 'draft',
      checklist_failed: false,
      checklist_complete: false,
    })).toBe(INTAKE_STATUS.IN_PROGRESS)
  })
})

describe('getIntakeAgeDays', () => {
  const now = new Date('2026-07-16T12:00:00Z')

  it('returns complete elapsed days and never a negative age', () => {
    expect(getIntakeAgeDays('2026-07-12T11:00:00Z', now)).toBe(4)
    expect(getIntakeAgeDays('2026-07-17T11:00:00Z', now)).toBe(0)
  })

  it('uses one shared threshold for stuck-work indicators', () => {
    expect(INTAKE_STUCK_AFTER_DAYS).toBeGreaterThan(0)
  })
})
