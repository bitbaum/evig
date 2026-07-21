import { test } from 'node:test'
import assert from 'node:assert/strict'
import { computeTimeSaldo, computeVacationBalance } from '../src/saldo'
import { parseWeeklySchedule, serializeWeeklySchedule, EMPTY_WEEKLY_SCHEDULE } from '../src/schedule'
import { getPublicHolidays, getHolidayDateSet } from '../src/holidays'

// Mon/Tue/Wed, 8h/day (like a 60% 24h-over-3-days case).
function moDiMiSchedule() {
  const s = parseWeeklySchedule(serializeWeeklySchedule(EMPTY_WEEKLY_SCHEDULE))
  for (const day of ['monday', 'tuesday', 'wednesday'] as const) {
    s.days[day] = { ...s.days[day], enabled: true, start: '08:00', end: '17:00', break_minutes: 60 }
  }
  return s
}
const PERIOD_60 = [{ validFrom: '2026-07-01', weeklyMinutes: 24 * 60 }]

test('SMALL-Time July example: no entries → saldo −56h to date', () => {
  const r = computeTimeSaldo({
    openingMinutes: 0, openingDate: null, periods: PERIOD_60,
    schedule: moDiMiSchedule(), entries: [], holidays: getHolidayDateSet(2026, 2026), today: '2026-07-17',
  })
  assert.ok(r)
  assert.equal(r!.saldoMinutes, -56 * 60)
  assert.equal(r!.monthSollMinutes, 56 * 60)
  assert.equal(r!.monthIstMinutes, 0)
})

test('worked scheduled days balance to zero; extra day goes positive', () => {
  const entries = ['2026-07-01', '2026-07-06', '2026-07-07', '2026-07-08', '2026-07-13', '2026-07-14', '2026-07-15']
    .map(d => ({ work_date: d, duration_minutes: 480, category: 'admin' }))
  const base = { openingMinutes: 0, openingDate: null, periods: PERIOD_60, schedule: moDiMiSchedule(), holidays: new Set<string>(), today: '2026-07-17' }
  assert.equal(computeTimeSaldo({ ...base, entries })!.saldoMinutes, 0)
  const extra = [...entries, { work_date: '2026-07-02', duration_minutes: 480, category: 'repair' }]
  assert.equal(computeTimeSaldo({ ...base, entries: extra })!.saldoMinutes, 480)
})

test('paid absence fulfils Soll, unpaid does not', () => {
  const base = { openingMinutes: 0, openingDate: null, periods: PERIOD_60, schedule: moDiMiSchedule(), holidays: new Set<string>(), today: '2026-07-01' }
  assert.equal(computeTimeSaldo({ ...base, entries: [{ work_date: '2026-07-01', duration_minutes: 480, category: 'krank' }] })!.saldoMinutes, 0)
  assert.equal(computeTimeSaldo({ ...base, entries: [{ work_date: '2026-07-01', duration_minutes: 480, category: 'unbezahlt' }] })!.saldoMinutes, -480)
})

test('a public holiday on a scheduled day reduces Soll and ignores a manual Feiertag entry', () => {
  const holidays = getHolidayDateSet(2026, 2026)
  const base = { openingMinutes: 0, openingDate: null, periods: [{ validFrom: '2026-01-01', weeklyMinutes: 2400 }], schedule: parseWeeklySchedule(null), holidays, today: '2026-01-02' }
  assert.equal(computeTimeSaldo({ ...base, entries: [] })!.saldoMinutes, 0)
  assert.equal(computeTimeSaldo({ ...base, entries: [{ work_date: '2026-01-01', duration_minutes: 480, category: 'feiertag' }] })!.saldoMinutes, 0)
})

test('honours the opening balance and start date', () => {
  const r = computeTimeSaldo({
    openingMinutes: -37 * 60, openingDate: '2026-07-16', periods: PERIOD_60,
    schedule: moDiMiSchedule(), entries: [], holidays: new Set<string>(), today: '2026-07-17',
  })
  assert.equal(r!.saldoMinutes, -37 * 60)
})

test('applies a Pensum change from its valid_from date', () => {
  const r = computeTimeSaldo({
    openingMinutes: 0, openingDate: null,
    periods: [{ validFrom: '2026-07-01', weeklyMinutes: 24 * 60 }, { validFrom: '2026-07-13', weeklyMinutes: 48 * 60 }],
    schedule: moDiMiSchedule(), entries: [], holidays: new Set<string>(), today: '2026-07-15',
  })
  assert.equal(r!.saldoMinutes, -80 * 60)
})

test('a report month BEFORE the opening date still shows real month Soll/Ist (no fake 0)', () => {
  const schedule = parseWeeklySchedule(serializeWeeklySchedule(EMPTY_WEEKLY_SCHEDULE))
  for (const day of ['monday', 'tuesday', 'wednesday'] as const) {
    schedule.days[day] = { ...schedule.days[day], enabled: true, start: '10:00', end: '18:00', break_minutes: 60 }
  }
  const entries = ['2026-06-01', '2026-06-02', '2026-06-03'].map(d => ({ work_date: d, duration_minutes: 420, category: 'admin' }))
  const r = computeTimeSaldo({
    openingMinutes: 0, openingDate: '2026-07-01',
    periods: [{ validFrom: '2024-03-01', weeklyMinutes: 21 * 60 }],
    schedule, entries, holidays: new Set<string>(), today: '2026-06-03',
  })
  assert.equal(r!.monthSollMinutes, 3 * 420)
  assert.equal(r!.monthIstMinutes, 3 * 420)
  assert.equal(r!.monthSaldoMinutes, 0)
  assert.equal(r!.saldoMinutes, 0)
})

test('returns null without employment periods', () => {
  assert.equal(computeTimeSaldo({ openingMinutes: 0, openingDate: null, periods: [], schedule: moDiMiSchedule(), entries: [], holidays: new Set(), today: '2026-07-17' }), null)
})

test('custom category config: a bespoke unpaid category is excluded', () => {
  const base = { openingMinutes: 0, openingDate: null, periods: PERIOD_60, schedule: moDiMiSchedule(), holidays: new Set<string>(), today: '2026-07-01' }
  const opts = { categories: { holidayCategory: 'holiday', classifyAbsence: (c: string) => (c === 'sabbatical' ? { paid: false } : undefined) } }
  assert.equal(computeTimeSaldo({ ...base, entries: [{ work_date: '2026-07-01', duration_minutes: 480, category: 'sabbatical' }] }, opts)!.saldoMinutes, -480)
})

test('vacation: pro-rates the default entitlement by Pensum (60% → 12 days)', () => {
  const r = computeVacationBalance({ entitlementDays: null, carryoverDays: 0, weeklyMinutes: 1440, takenDays: 1 })
  assert.equal(r.entitlementDays, 12)
  assert.equal(r.balanceDays, 11)
  assert.equal(r.isEstimated, true)
})

test('vacation: uses an explicit entitlement incl. carryover', () => {
  const r = computeVacationBalance({ entitlementDays: 25, carryoverDays: 2.5, weeklyMinutes: 2400, takenDays: 10 })
  assert.equal(r.balanceDays, 17.5)
  assert.equal(r.isEstimated, false)
})

test('holidays: Easter-derived ZH holidays for 2026', () => {
  const dates = new Map(getPublicHolidays(2026).map(h => [h.name, h.date]))
  assert.equal(dates.get('Karfreitag'), '2026-04-03')
  assert.equal(dates.get('Ostermontag'), '2026-04-06')
  assert.equal(dates.get('Auffahrt'), '2026-05-14')
  assert.equal(dates.get('Pfingstmontag'), '2026-05-25')
})
