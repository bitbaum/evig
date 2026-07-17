import { computeTimeSaldo, computeVacationBalance } from '@/lib/team/saldo'
import { parseWeeklySchedule, serializeWeeklySchedule, EMPTY_WEEKLY_SCHEDULE } from '@/lib/team/schedule'
import { getPublicHolidays, getHolidayDateSet } from '@/config/holidays'

// Mon/Tue/Wed schedule, like the real-world 60% case (24h over 3 days = 8h/day).
function moDiMiSchedule() {
  const s = parseWeeklySchedule(serializeWeeklySchedule(EMPTY_WEEKLY_SCHEDULE))
  for (const day of ['monday', 'tuesday', 'wednesday'] as const) {
    s.days[day] = { ...s.days[day], enabled: true, start: '08:00', end: '17:00', break_minutes: 60 }
  }
  return s
}

const PERIOD_60 = [{ validFrom: '2026-07-01', weeklyMinutes: 24 * 60 }]

describe('computeTimeSaldo', () => {
  it('reproduces the SMALL-Time July example: no entries → saldo −56h to date', () => {
    // Through 2026-07-17, scheduled Mo/Di/Mi days elapsed: 1., 6., 7., 8., 13., 14., 15. = 7 × 8h.
    const result = computeTimeSaldo({
      openingMinutes: 0,
      openingDate: null,
      periods: PERIOD_60,
      schedule: moDiMiSchedule(),
      entries: [],
      holidays: getHolidayDateSet(2026, 2026),
      today: '2026-07-17',
    })
    expect(result).not.toBeNull()
    expect(result!.saldoMinutes).toBe(-56 * 60)
    expect(result!.monthSollMinutes).toBe(56 * 60)
    expect(result!.monthIstMinutes).toBe(0)
  })

  it('worked scheduled days balance to zero; extra day goes positive', () => {
    const entries = ['2026-07-01', '2026-07-06', '2026-07-07', '2026-07-08', '2026-07-13', '2026-07-14', '2026-07-15']
      .map(d => ({ work_date: d, duration_minutes: 480, category: 'admin' }))
    const base = {
      openingMinutes: 0,
      openingDate: null,
      periods: PERIOD_60,
      schedule: moDiMiSchedule(),
      holidays: new Set<string>(),
      today: '2026-07-17',
    }
    expect(computeTimeSaldo({ ...base, entries })!.saldoMinutes).toBe(0)
    // Worked an unscheduled Thursday on top → +8h.
    const extra = [...entries, { work_date: '2026-07-02', duration_minutes: 480, category: 'repair' }]
    expect(computeTimeSaldo({ ...base, entries: extra })!.saldoMinutes).toBe(480)
  })

  it('paid absence fulfils Soll, unpaid does not', () => {
    const base = {
      openingMinutes: 0,
      openingDate: null,
      periods: PERIOD_60,
      schedule: moDiMiSchedule(),
      holidays: new Set<string>(),
      today: '2026-07-01', // one scheduled day
    }
    const paid = computeTimeSaldo({ ...base, entries: [{ work_date: '2026-07-01', duration_minutes: 480, category: 'krank' }] })
    expect(paid!.saldoMinutes).toBe(0)
    const unpaid = computeTimeSaldo({ ...base, entries: [{ work_date: '2026-07-01', duration_minutes: 480, category: 'unbezahlt' }] })
    expect(unpaid!.saldoMinutes).toBe(-480)
  })

  it('a public holiday on a scheduled day reduces Soll and ignores a manual Feiertag entry', () => {
    // 2026-01-01 (Neujahr) is a Thursday; use a Mon–Fri schedule via empty template fallback.
    const holidays = getHolidayDateSet(2026, 2026)
    const base = {
      openingMinutes: 0,
      openingDate: null,
      periods: [{ validFrom: '2026-01-01', weeklyMinutes: 2400 }], // 40h Mo–Fr → 8h/day
      schedule: parseWeeklySchedule(null), // empty → Mon–Fri fallback
      holidays,
      today: '2026-01-02', // Do (Neujahr) + Fr (Berchtoldstag) — both ZH holidays
    }
    const none = computeTimeSaldo({ ...base, entries: [] })
    expect(none!.saldoMinutes).toBe(0) // both days are holidays → no Soll
    // A habit-entry «Feiertag 8h» on the holiday must NOT double-count.
    const habit = computeTimeSaldo({ ...base, entries: [{ work_date: '2026-01-01', duration_minutes: 480, category: 'feiertag' }] })
    expect(habit!.saldoMinutes).toBe(0)
  })

  it('honours the opening balance and start date', () => {
    const result = computeTimeSaldo({
      openingMinutes: -37 * 60,
      openingDate: '2026-07-16', // cutover; 16.= Do (not scheduled), 17. = Fr (not scheduled)
      periods: PERIOD_60,
      schedule: moDiMiSchedule(),
      entries: [],
      holidays: new Set<string>(),
      today: '2026-07-17',
    })
    expect(result!.saldoMinutes).toBe(-37 * 60)
  })

  it('applies a Pensum change from its valid_from date', () => {
    const result = computeTimeSaldo({
      openingMinutes: 0,
      openingDate: null,
      periods: [
        { validFrom: '2026-07-01', weeklyMinutes: 24 * 60 },
        { validFrom: '2026-07-13', weeklyMinutes: 48 * 60 }, // doubled
      ],
      schedule: moDiMiSchedule(),
      entries: [],
      holidays: new Set<string>(),
      today: '2026-07-15',
    })
    // Week 1: 1.7 (Mi) 8h + 6./7./8. (24h) at 8h/day = 4 days × 8h = 32h.
    // 13./14./15. at 16h/day = 48h. Total Soll 80h → saldo −80h.
    expect(result!.saldoMinutes).toBe(-80 * 60)
  })

  it('returns null without employment periods', () => {
    expect(computeTimeSaldo({
      openingMinutes: 0, openingDate: null, periods: [],
      schedule: moDiMiSchedule(), entries: [], holidays: new Set(), today: '2026-07-17',
    })).toBeNull()
  })
})

describe('computeVacationBalance', () => {
  it('pro-rates the default entitlement by Pensum (60% → 12 days)', () => {
    const r = computeVacationBalance({ entitlementDays: null, carryoverDays: 0, weeklyMinutes: 1440, takenDays: 1 })
    expect(r.entitlementDays).toBe(12)
    expect(r.balanceDays).toBe(11)
    expect(r.isEstimated).toBe(true)
  })

  it('uses the HR entitlement row incl. carryover when present', () => {
    const r = computeVacationBalance({ entitlementDays: 25, carryoverDays: 2.5, weeklyMinutes: 2400, takenDays: 10 })
    expect(r.balanceDays).toBe(17.5)
    expect(r.isEstimated).toBe(false)
  })
})

describe('holidays config', () => {
  it('computes Easter-derived ZH holidays for 2026', () => {
    const dates = new Map(getPublicHolidays(2026).map(h => [h.name, h.date]))
    expect(dates.get('Karfreitag')).toBe('2026-04-03')
    expect(dates.get('Ostermontag')).toBe('2026-04-06')
    expect(dates.get('Auffahrt')).toBe('2026-05-14')
    expect(dates.get('Pfingstmontag')).toBe('2026-05-25')
  })
})
