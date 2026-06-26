import {
  VACANCY_TRANSITIONS,
  VACANCY_STATUS,
  vacancyAcceptsApplications,
  type VacancyStatus,
} from '@/config/hr-vacancies'

export function canTransitionVacancy(from: VacancyStatus, to: VacancyStatus): boolean {
  return VACANCY_TRANSITIONS[from]?.includes(to) ?? false
}

export function canApplyToVacancy(status: VacancyStatus, deadline: string | null | undefined): boolean {
  if (!vacancyAcceptsApplications(status)) return false
  if (!deadline) return true
  return new Date(deadline) > new Date()
}

export function publicVacancyBadge(status: VacancyStatus): string | null {
  if (status === VACANCY_STATUS.FROZEN) return 'Bewerbung pausiert'
  if (status === VACANCY_STATUS.FILLED) return 'Besetzt'
  return null
}
