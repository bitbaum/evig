/**
 * HR Vacancies — SSOT for job postings, role tracks, and share copy.
 * Swiss German labels (ss not ß).
 */

import { DEPARTMENTS } from '@/config/team'

// ─── Role tracks (posting + application form driver) ───────────────────────

export const ROLE_TRACKS = {
  VOLUNTEER: 'volunteer',
  INTERN: 'intern',
  EMPLOYEE: 'employee',
  REINTEGRATION: 'reintegration',
  CONTRACTOR: 'contractor',
} as const

export type RoleTrack = typeof ROLE_TRACKS[keyof typeof ROLE_TRACKS]

export const ROLE_TRACK_OPTIONS = Object.values(ROLE_TRACKS)

export const ROLE_TRACK_LABELS: Record<RoleTrack, string> = {
  volunteer: 'Freiwilligenarbeit',
  intern: 'Praktikum',
  employee: 'Anstellung',
  reintegration: 'Wiedereinstieg',
  contractor: 'Auftrag / Projekt',
}

/** Maps posting track → team_profiles.employment_type on hire */
export const ROLE_TRACK_TO_EMPLOYMENT_TYPE: Record<RoleTrack, string> = {
  volunteer: 'volunteer',
  intern: 'intern',
  employee: 'employee',
  reintegration: 'intern',
  contractor: 'contractor',
}

// ─── Posting statuses ──────────────────────────────────────────────────────

export const VACANCY_STATUS = {
  DRAFT: 'draft',
  PUBLISHED: 'published',
  FROZEN: 'frozen',
  FILLED: 'filled',
  CLOSED: 'closed',
  ARCHIVED: 'archived',
} as const

export type VacancyStatus = typeof VACANCY_STATUS[keyof typeof VACANCY_STATUS]

export const VACANCY_STATUS_OPTIONS = Object.values(VACANCY_STATUS)

export const VACANCY_STATUS_LABELS: Record<VacancyStatus, string> = {
  draft: 'Entwurf',
  published: 'Veröffentlicht',
  frozen: 'Pausiert',
  filled: 'Besetzt',
  closed: 'Geschlossen',
  archived: 'Archiviert',
}

export const VACANCY_STATUS_COLORS: Record<VacancyStatus, string> = {
  draft: 'bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300',
  published: 'bg-primary-100 text-primary-800 dark:bg-primary-900/30 dark:text-primary-300',
  frozen: 'bg-warning-100 text-warning-800 dark:bg-warning-900/30 dark:text-warning-300',
  filled: 'bg-info-100 text-info-800 dark:bg-info-900/30 dark:text-info-300',
  closed: 'bg-neutral-200 text-neutral-800 dark:bg-neutral-700 dark:text-neutral-200',
  archived: 'bg-neutral-100 text-neutral-500 dark:bg-neutral-900 dark:text-neutral-500',
}

/** Valid admin transitions */
export const VACANCY_TRANSITIONS: Record<VacancyStatus, VacancyStatus[]> = {
  draft: ['published', 'archived'],
  published: ['frozen', 'filled', 'closed', 'archived'],
  frozen: ['published', 'filled', 'closed', 'archived'],
  filled: ['closed', 'archived'],
  closed: ['archived', 'draft'],
  archived: ['draft'],
}

/** Public list includes these statuses */
export const PUBLIC_VACANCY_STATUSES: VacancyStatus[] = [
  VACANCY_STATUS.PUBLISHED,
  VACANCY_STATUS.FROZEN,
  VACANCY_STATUS.FILLED,
]

export function vacancyAcceptsApplications(status: VacancyStatus): boolean {
  return status === VACANCY_STATUS.PUBLISHED
}

// ─── Application source ────────────────────────────────────────────────────

export const APPLICATION_SOURCES = {
  WEBSITE: 'website',
  REFERRAL: 'referral',
  GET_INVOLVED: 'get_involved',
  OTHER: 'other',
} as const

export type ApplicationSource = typeof APPLICATION_SOURCES[keyof typeof APPLICATION_SOURCES]

export const APPLICATION_SOURCE_OPTIONS = Object.values(APPLICATION_SOURCES)

export const APPLICATION_SOURCE_LABELS: Record<ApplicationSource, string> = {
  website: 'Website',
  referral: 'Empfehlung',
  get_involved: 'Mitmachen-Seite',
  other: 'Sonstiges',
}

export function getApplicationSourceLabel(source: string): string {
  return APPLICATION_SOURCE_LABELS[source as ApplicationSource] ?? source
}

// ─── Legal / UX copy (Swiss German) ────────────────────────────────────────

export const HR_TRACK_DISCLAIMERS: Partial<Record<RoleTrack, string>> = {
  volunteer:
    'Freiwilligenarbeit ist unentgeltlich und begründet kein Arbeitsverhältnis im Sinne des OR.',
  intern:
    'Praktikumsstellen unterliegen den Vereinbarungen zwischen RevampIT, Praktikant/in und ggf. Bildungsinstitution.',
  reintegration:
    'Unser Wiedereinstiegsprogramm unterstützt Menschen beim Wiederanfang in der IT — in einem respektvollen, strukturierten Rahmen.',
}

export const HR_APPLY_FOOTER =
  'Mit dem Absenden erklärst du dich einverstanden, dass wir deine Angaben zur Bearbeitung der Bewerbung speichern. Details: Datenschutzerklärung.'

export const HR_APPLICATION_RETENTION_DAYS = 365

// ─── Share templates ─────────────────────────────────────────────────────────

export function buildVacancyShareText(title: string, publicUrl: string): string {
  return `Offene Stelle bei RevampIT: ${title}\n${publicUrl}`
}

export function buildVacancyShareLinkedIn(title: string, publicUrl: string): string {
  return `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(publicUrl)}`
}

// ─── Onboarding task templates (phase 4) ───────────────────────────────────

export interface OnboardingTaskTemplate {
  title: string
  description: string
  category: string
}

export const ONBOARDING_TASK_TEMPLATES: Record<RoleTrack, OnboardingTaskTemplate[]> = {
  volunteer: [
    { title: 'Willkommen im Team', description: 'Kurzes Kennenlernen und Zugang zu Tools klären.', category: 'other' },
    { title: 'Erste Schicht planen', description: 'Verfügbarkeit mit Team abstimmen.', category: 'other' },
  ],
  intern: [
    { title: 'Onboarding-Checkliste', description: 'Lernziele und Betreuungsperson festhalten.', category: 'other' },
    { title: 'Werkstatt-Rundgang', description: 'Sicherheit und Abläufe vor Ort.', category: 'other' },
  ],
  employee: [
    { title: 'Arbeitsvertrag & Zugänge', description: 'Vertrag, E-Mail, Admin-Berechtigungen.', category: 'other' },
    { title: 'Erste Woche Planung', description: 'Einarbeitung mit Vorgesetzter.', category: 'other' },
  ],
  reintegration: [
    { title: 'Wiedereinstieg Gespräch', description: 'Erwartungen, Tempo und Unterstützung klären.', category: 'other' },
    { title: 'Buddy zuweisen', description: 'Ansprechperson für erste 90 Tage.', category: 'other' },
  ],
  contractor: [
    { title: 'Projekt-Kickoff', description: 'Scope, Lieferobjekte und Kommunikation.', category: 'other' },
  ],
}

export { DEPARTMENT_OPTIONS } from '@/config/team'

export function getRoleTrackLabel(track: string): string {
  return ROLE_TRACK_LABELS[track as RoleTrack] ?? track
}

export function getVacancyStatusLabel(status: string): string {
  return VACANCY_STATUS_LABELS[status as VacancyStatus] ?? status
}
