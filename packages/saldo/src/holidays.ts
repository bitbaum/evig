/**
 * Public-holiday helper (optional). The engine takes holidays as an input Set,
 * so this is a convenience: deterministic Swiss holidays (fixed dates + Easter-
 * derived via Butcher's algorithm), no per-year maintenance. Bring your own set
 * for other countries/cantons.
 *
 * The built-in list is the Kanton Zürich statutory set. Half-day city customs
 * are deliberately excluded (not statutory).
 */

function easterSunday(year: number): Date {
  const a = year % 19
  const b = Math.floor(year / 100)
  const c = year % 100
  const d = Math.floor(b / 4)
  const e = b % 4
  const f = Math.floor((b + 8) / 25)
  const g = Math.floor((b - f + 1) / 3)
  const h = (19 * a + b - d - g + 15) % 30
  const i = Math.floor(c / 4)
  const k = c % 4
  const l = (32 + 2 * e + 2 * i - h - k) % 7
  const m = Math.floor((a + 11 * h + 22 * l) / 451)
  const month = Math.floor((h + l - 7 * m + 114) / 31)
  const day = ((h + l - 7 * m + 114) % 31) + 1
  return new Date(Date.UTC(year, month - 1, day))
}

function iso(d: Date): string {
  return d.toISOString().slice(0, 10)
}

function plusDays(d: Date, days: number): Date {
  const next = new Date(d)
  next.setUTCDate(next.getUTCDate() + days)
  return next
}

export interface PublicHoliday {
  date: string
  name: string
}

/** Statutory public holidays (Kanton Zürich) for one year. */
export function getPublicHolidays(year: number): PublicHoliday[] {
  const easter = easterSunday(year)
  return [
    { date: `${year}-01-01`, name: 'Neujahr' },
    { date: `${year}-01-02`, name: 'Berchtoldstag' },
    { date: iso(plusDays(easter, -2)), name: 'Karfreitag' },
    { date: iso(plusDays(easter, 1)), name: 'Ostermontag' },
    { date: `${year}-05-01`, name: 'Tag der Arbeit' },
    { date: iso(plusDays(easter, 39)), name: 'Auffahrt' },
    { date: iso(plusDays(easter, 50)), name: 'Pfingstmontag' },
    { date: `${year}-08-01`, name: 'Bundesfeier' },
    { date: `${year}-12-25`, name: 'Weihnachten' },
    { date: `${year}-12-26`, name: 'Stephanstag' },
  ]
}

/** Fast lookup set of holiday ISO dates covering [fromYear, toYear]. */
export function getHolidayDateSet(fromYear: number, toYear: number): Set<string> {
  const set = new Set<string>()
  for (let y = fromYear; y <= toYear; y++) {
    for (const h of getPublicHolidays(y)) set.add(h.date)
  }
  return set
}

export function isPublicHoliday(isoDate: string): boolean {
  const year = Number(isoDate.slice(0, 4))
  return getPublicHolidays(year).some(h => h.date === isoDate)
}
