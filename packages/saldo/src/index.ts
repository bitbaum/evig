/**
 * Saldo — a dependency-free time-balance engine.
 * @see BRAND for the (swappable) product name.
 */
export { BRAND, type Brand } from './brand'

export {
  computeTimeSaldo,
  computeVacationBalance,
  type SaldoInput,
  type SaldoResult,
  type SaldoOptions,
  type EmploymentPeriod,
  type TimeEntry,
  type VacationInput,
  type VacationResult,
} from './saldo'

export {
  WEEKDAY_IDS,
  type WeekdayId,
  type WeeklySchedule,
  type WeeklyScheduleDay,
  EMPTY_WEEKLY_SCHEDULE,
  STANDARD_WEEKLY_SCHEDULE,
  parseWeeklySchedule,
  serializeWeeklySchedule,
  calculateTimeRangeMinutes,
  getScheduleDayMinutes,
  getScheduleWeeklyMinutes,
  weekdayIdFromDate,
} from './schedule'

export {
  DEFAULT_CATEGORY_CONFIG,
  categoryConfigFromAbsences,
  type CategoryConfig,
  type AbsenceKind,
} from './categories'

export {
  getPublicHolidays,
  getHolidayDateSet,
  isPublicHoliday,
  type PublicHoliday,
} from './holidays'
