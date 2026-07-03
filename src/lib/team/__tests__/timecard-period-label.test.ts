import { formatTimecardPeriodLabel } from '../timecard-period-label'

describe('formatTimecardPeriodLabel', () => {
  it('collapses month periods to "Monat Jahr"', () => {
    expect(formatTimecardPeriodLabel('month', '2026-07-01', '2026-08-01')).toBe('Juli 2026')
  })

  it('never leaks the exclusive period_end into a month label', () => {
    // A July card ends 2026-08-01 (exclusive) — the label must not mention August.
    expect(formatTimecardPeriodLabel('month', '2026-07-01', '2026-08-01')).not.toContain('August')
  })

  it('renders week periods with the INCLUSIVE end date', () => {
    // Week 2026-05-25 … period_end 2026-06-01 (exclusive) → last day is 31.5.
    const label = formatTimecardPeriodLabel('week', '2026-05-25', '2026-06-01')
    expect(label).toBe('Woche 25.5.2026–31.5.2026')
  })

  it('handles a week ending at a month boundary', () => {
    const label = formatTimecardPeriodLabel('week', '2026-06-29', '2026-07-06')
    expect(label).toBe('Woche 29.6.2026–5.7.2026')
  })
})
