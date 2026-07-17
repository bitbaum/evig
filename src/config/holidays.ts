/**
 * Public holidays — SSOT (Kanton Zürich).
 *
 * Used by the Saldo engine: a holiday on a scheduled workday reduces the
 * Soll for that day, so nobody has to enter a «Feiertag» row by hand and
 * the balance stays correct with zero clicks.
 *
 * Deterministic: fixed dates + Easter-derived dates (Gauss/Butcher
 * algorithm), so no per-year maintenance. Half-day customs (Sechseläuten,
 * Knabenschiessen) are deliberately excluded — they are city-of-Zürich
 * afternoon customs, not statutory cantonal holidays.
 */

/** Butcher's algorithm — Easter Sunday (Gregorian) for a given year. */
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
  const month = Math.floor((h + l - 7 * m + 114) / 31) // 3=March, 4=April
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
  /** ISO date (YYYY-MM-DD). */
  date: string
  /** Canonical German name (official correspondence language). */
  name: string
}

/** Statutory public holidays, Kanton Zürich, for one year. */
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
