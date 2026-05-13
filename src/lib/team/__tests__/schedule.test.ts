import {
  WEEKDAY_IDS,
  applyStandardSchedule,
  buildTimecardEntriesFromSchedule,
  buildTimecardEntriesForMonth,
  getScheduleWeeklyMinutes,
  parseWeeklySchedule,
  serializeWeeklySchedule,
  summarizeWeeklySchedule,
} from '../schedule'

describe('weekly schedule helpers', () => {
  it('returns an empty schedule for legacy free text', () => {
    const schedule = parseWeeklySchedule('Mo-Fr 9-17 Uhr')
    expect(WEEKDAY_IDS.every(day => schedule.days[day].enabled === false)).toBe(true)
  })

  it('serializes and parses a standard weekly schedule', () => {
    const schedule = parseWeeklySchedule(applyStandardSchedule())
    expect(schedule.days.monday.enabled).toBe(true)
    expect(schedule.days.friday.enabled).toBe(true)
    expect(schedule.days.saturday.enabled).toBe(false)
    expect(serializeWeeklySchedule(schedule)).toContain('"version":1')
  })

  it('calculates weekly minutes after breaks', () => {
    const schedule = parseWeeklySchedule(applyStandardSchedule())
    expect(getScheduleWeeklyMinutes(schedule)).toBe(5 * 7 * 60)
  })

  it('summarizes enabled days and weekly duration', () => {
    const schedule = parseWeeklySchedule(applyStandardSchedule())
    expect(summarizeWeeklySchedule(schedule)).toBe('Mo, Di, Mi, Do, Fr · 35 Std./Woche')
  })

  it('builds one template timecard entry per enabled schedule day', () => {
    const schedule = parseWeeklySchedule(applyStandardSchedule())
    const entries = buildTimecardEntriesFromSchedule(schedule, '2026-05-11')

    expect(entries).toHaveLength(5)
    expect(entries[0]).toEqual({
      work_date: '2026-05-11',
      start_time: '09:00',
      end_time: '17:00',
      break_minutes: 60,
      duration_minutes: 420,
      category: 'admin',
      description: 'Aus offiziellem Standardschedule',
      source: 'template',
    })
    expect(entries[4].work_date).toBe('2026-05-15')
  })

  it('builds a full month of schedule entries', () => {
    const schedule = parseWeeklySchedule(applyStandardSchedule())
    const entries = buildTimecardEntriesForMonth(schedule, new Date('2026-05-15T00:00:00.000Z'))
    expect(entries[0].work_date).toBe('2026-05-01')
    expect(entries).toHaveLength(21)
  })
})
