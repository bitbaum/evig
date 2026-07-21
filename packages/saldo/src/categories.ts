/**
 * Category semantics the saldo engine needs — configurable so any organisation
 * can bring its own categories. The engine only asks two things of a category:
 *
 *   1. Is it an ABSENCE, and if so is it PAID? Paid absences (holiday, sick,
 *      accident, …) fulfil the day's target like worked time; unpaid ones don't.
 *   2. Is it the "public-holiday marker" category? A manual entry with that
 *      category ON an actual calendar holiday is ignored (the holiday already
 *      reduced the target — counting both would double it).
 *
 * A sensible Swiss default is built in; pass your own via SaldoOptions.
 */

export interface AbsenceKind {
  /** Paid absence counts toward Ist; unpaid does not. */
  paid: boolean
}

export interface CategoryConfig {
  /** Category value that marks a public-holiday entry. Default 'feiertag'. */
  holidayCategory: string
  /** Return the absence kind for a category, or undefined for worked time. */
  classifyAbsence: (category: string) => AbsenceKind | undefined
}

/** Built-in Swiss absence set (paid: Ferien/Krank/Unfall/Feiertag/Militär; unpaid: Unbezahlt). */
const SWISS_PAID_ABSENCES = new Set(['ferien', 'krank', 'unfall', 'feiertag', 'militaer'])
const SWISS_UNPAID_ABSENCES = new Set(['unbezahlt'])

export const DEFAULT_CATEGORY_CONFIG: CategoryConfig = {
  holidayCategory: 'feiertag',
  classifyAbsence: (category: string): AbsenceKind | undefined => {
    if (SWISS_PAID_ABSENCES.has(category)) return { paid: true }
    if (SWISS_UNPAID_ABSENCES.has(category)) return { paid: false }
    return undefined
  },
}

/**
 * Build a CategoryConfig from a plain list of `{ value, paid }` absences — the
 * shape most apps already have. Everything not listed counts as worked time.
 */
export function categoryConfigFromAbsences(
  absences: ReadonlyArray<{ value: string; paid: boolean }>,
  holidayCategory = 'feiertag',
): CategoryConfig {
  const map = new Map(absences.map(a => [a.value, { paid: a.paid }]))
  return {
    holidayCategory,
    classifyAbsence: (category: string) => map.get(category),
  }
}
