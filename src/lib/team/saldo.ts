/**
 * Zeitsaldo / Feriensaldo — thin adapter over the standalone `saldo-engine`
 * package (packages/saldo). The accounting core lives there, dependency-free
 * and separately tested; this file only wires it to THIS app's category SSOT
 * (`@/config/timecards`) so paid/unpaid absences and the holiday marker match
 * what the rest of the app uses.
 */

import {
  computeTimeSaldo as engineComputeTimeSaldo,
  categoryConfigFromAbsences,
  type SaldoInput,
} from 'saldo-engine'
import { TIMECARD_ABSENCE_TYPES, TIMECARD_ENTRY_CATEGORIES } from '@/config/timecards'

// App categories drive the engine — one SSOT for what counts as a paid absence.
const CATEGORY_CONFIG = categoryConfigFromAbsences(
  TIMECARD_ABSENCE_TYPES.map(a => ({ value: a.value, paid: a.paid })),
  TIMECARD_ENTRY_CATEGORIES.FEIERTAG,
)

/** Running Zeitsaldo for one person. Null when there's no Pensum on file. */
export function computeTimeSaldo(input: SaldoInput) {
  return engineComputeTimeSaldo(input, { categories: CATEGORY_CONFIG })
}

export { computeVacationBalance } from 'saldo-engine'
export type {
  SaldoInput,
  SaldoResult,
  VacationInput,
  VacationResult,
  EmploymentPeriod as SaldoEmploymentPeriod,
  TimeEntry as SaldoEntry,
} from 'saldo-engine'
