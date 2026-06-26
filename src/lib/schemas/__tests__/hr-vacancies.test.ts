import { validateTrackResponses } from '@/lib/schemas/hr-vacancies'
import {
  VACANCY_TRANSITIONS,
  vacancyAcceptsApplications,
  VACANCY_STATUS,
} from '@/config/hr-vacancies'
import { canTransitionVacancy } from '@/lib/domain/hr/vacancy-transitions'
import { APPLICATION_FORWARD_TRANSITIONS } from '@/config/hr-application-status'

describe('hr-vacancies config', () => {
  it('published vacancies accept applications', () => {
    expect(vacancyAcceptsApplications(VACANCY_STATUS.PUBLISHED)).toBe(true)
    expect(vacancyAcceptsApplications(VACANCY_STATUS.FROZEN)).toBe(false)
  })

  it('validates vacancy transitions from SSOT', () => {
    expect(canTransitionVacancy(VACANCY_STATUS.DRAFT, VACANCY_STATUS.PUBLISHED)).toBe(true)
    expect(canTransitionVacancy(VACANCY_STATUS.PUBLISHED, VACANCY_STATUS.FROZEN)).toBe(true)
    expect(canTransitionVacancy(VACANCY_STATUS.FILLED, VACANCY_STATUS.DRAFT)).toBe(false)
    expect(VACANCY_TRANSITIONS.published).toContain('frozen')
  })
})

describe('validateTrackResponses', () => {
  it('validates volunteer track fields', () => {
    const result = validateTrackResponses('volunteer', {
      motivation: 'Ich möchte bei RevampIT mithelfen und Hardware reparieren.',
      hours_per_week: 8,
    })
    expect(result.success).toBe(true)
  })

  it('rejects employee track without work_permit flag', () => {
    const result = validateTrackResponses('employee', {
      motivation: 'Langjährige Erfahrung in IT-Support und Werkstatt.',
      experience_summary: '5 Jahre Support und Reparatur.',
    })
    expect(result.success).toBe(false)
  })

  it('validates intern required fields', () => {
    const result = validateTrackResponses('intern', {
      motivation: 'Praktikum im Bereich Nachhaltigkeit und IT.',
      school_program: 'Informatik HF',
      duration: '6 Monate',
      learning_goals: 'Hardware-Diagnose und Kundenkontakt.',
    })
    expect(result.success).toBe(true)
  })
})

describe('application pipeline SSOT', () => {
  it('allows forward progression from new', () => {
    expect(APPLICATION_FORWARD_TRANSITIONS.new).toContain('screening')
    expect(APPLICATION_FORWARD_TRANSITIONS.offer).toContain('hired')
  })
})
