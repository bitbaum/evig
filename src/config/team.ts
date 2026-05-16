/**
 * Team Configuration - SSOT
 *
 * Single Source of Truth for team-related constants.
 * Used in forms, filters, and display throughout the team section.
 *
 * Following: docs/development/DEV_GUIDE.md
 */

// =============================================================================
// EMPLOYMENT TYPES
// =============================================================================

export const EMPLOYMENT_TYPES = {
  EMPLOYEE: 'employee',
  VOLUNTEER: 'volunteer',
  INTERN: 'intern',
  CONTRACTOR: 'contractor',
} as const

export type EmploymentType = typeof EMPLOYMENT_TYPES[keyof typeof EMPLOYMENT_TYPES]

export const EMPLOYMENT_TYPE_OPTIONS = Object.values(EMPLOYMENT_TYPES)

export const EMPLOYMENT_TYPE_LABELS: Record<EmploymentType, string> = {
  employee: 'Angestellte/r',
  volunteer: 'Freiwillige/r',
  intern: 'Praktikant/in',
  contractor: 'Auftragnehmer/in',
}

export const EMPLOYMENT_TYPE_COLORS: Record<EmploymentType, string> = {
  employee: 'bg-neutral-100 text-neutral-800 dark:bg-neutral-700 dark:text-neutral-300',
  volunteer: 'bg-primary-100 text-primary-800 dark:bg-primary-900/30 dark:text-primary-300',
  intern: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
  contractor: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300',
}

// =============================================================================
// DEPARTMENTS
// =============================================================================

export const DEPARTMENTS = {
  IT: 'IT',
  WERKSTATT: 'Werkstatt',
  VERWALTUNG: 'Verwaltung',
  MARKETING: 'Marketing',
  VERKAUF: 'Verkauf',
  BILDUNG: 'Bildung',
  LOGISTIK: 'Logistik',
} as const

export type Department = typeof DEPARTMENTS[keyof typeof DEPARTMENTS]

export const DEPARTMENT_OPTIONS = Object.values(DEPARTMENTS)

export const DEPARTMENT_LABELS: Record<Department, string> = {
  IT: 'IT & Technik',
  Werkstatt: 'Werkstatt & Reparatur',
  Verwaltung: 'Verwaltung & Administration',
  Marketing: 'Marketing & Kommunikation',
  Verkauf: 'Verkauf & Kundenbetreuung',
  Bildung: 'Bildung & Workshops',
  Logistik: 'Logistik & Lager',
}

export const DEPARTMENT_COLORS: Record<Department, string> = {
  IT: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300',
  Werkstatt: 'bg-warning-100 text-warning-800 dark:bg-warning-900/30 dark:text-warning-300',
  Verwaltung: 'bg-slate-100 text-slate-800 dark:bg-slate-900/30 dark:text-slate-300',
  Marketing: 'bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-300',
  Verkauf: 'bg-primary-100 text-primary-800 dark:bg-primary-900/30 dark:text-primary-300',
  Bildung: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-300',
  Logistik: 'bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-300',
}

// =============================================================================
// PREFERRED CONTACT METHODS
// =============================================================================

export const CONTACT_METHODS = {
  EMAIL: 'email',
  PHONE: 'phone',
  SLACK: 'slack',
  SIGNAL: 'signal',
} as const

export type ContactMethod = typeof CONTACT_METHODS[keyof typeof CONTACT_METHODS]

export const CONTACT_METHOD_OPTIONS = Object.values(CONTACT_METHODS)

export const CONTACT_METHOD_LABELS: Record<ContactMethod, string> = {
  email: 'E-Mail',
  phone: 'Telefon',
  slack: 'Slack',
  signal: 'Signal',
}

// =============================================================================
// SKILL SUGGESTIONS
// =============================================================================

/**
 * Suggested skills for team profiles.
 * Users can add custom skills, but these are common suggestions.
 */
export const SKILL_SUGGESTIONS = {
  technical: [
    'Hardware-Reparatur',
    'Software-Installation',
    'Linux',
    'Windows',
    'macOS',
    'Netzwerktechnik',
    'Webentwicklung',
    'Datenrettung',
    'Elektronik',
    '3D-Druck',
    'Löten',
    'Smartphone-Reparatur',
    'Laptop-Reparatur',
    'Server-Administration',
  ],
  soft: [
    'Kundenbetreuung',
    'Kommunikation',
    'Teamarbeit',
    'Problemlösung',
    'Zeitmanagement',
    'Organisation',
    'Präsentation',
    'Mentoring',
    'Konfliktlösung',
    'Projektmanagement',
  ],
  languages: [
    'Deutsch',
    'Englisch',
    'Französisch',
    'Italienisch',
    'Spanisch',
    'Portugiesisch',
    'Türkisch',
    'Arabisch',
    'Russisch',
    'Chinesisch',
  ],
} as const

export const ALL_SKILL_SUGGESTIONS = [
  ...SKILL_SUGGESTIONS.technical,
  ...SKILL_SUGGESTIONS.soft,
  ...SKILL_SUGGESTIONS.languages,
]

// =============================================================================
// EMERGENCY CONTACT RELATIONS
// =============================================================================

export const EMERGENCY_RELATIONS = {
  PARTNER: 'partner',
  PARENT: 'parent',
  SIBLING: 'sibling',
  CHILD: 'child',
  FRIEND: 'friend',
  OTHER: 'other',
} as const

export type EmergencyRelation = typeof EMERGENCY_RELATIONS[keyof typeof EMERGENCY_RELATIONS]

export const EMERGENCY_RELATION_OPTIONS = Object.values(EMERGENCY_RELATIONS)

export const EMERGENCY_RELATION_LABELS: Record<EmergencyRelation, string> = {
  partner: 'Partner/in',
  parent: 'Elternteil',
  sibling: 'Geschwister',
  child: 'Kind',
  friend: 'Freund/in',
  other: 'Andere',
}

// =============================================================================
// FORM SECTIONS
// =============================================================================

/**
 * Team profile form sections for progressive disclosure.
 * Controls which sections are expanded by default.
 */
export const TEAM_FORM_SECTIONS = {
  BASIC: 'basic',
  TALENT: 'talent',
  AVAILABILITY: 'availability',
  EMERGENCY: 'emergency',
  HR: 'hr',
} as const

export const TEAM_FORM_SECTION_LABELS = {
  basic: 'Grundinformationen',
  talent: 'Fähigkeiten & Entwicklung',
  availability: 'Verfügbarkeit & Kontakt',
  emergency: 'Notfallkontakt',
  hr: 'HR-Notizen',
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Get label for employment type
 */
export function getEmploymentTypeLabel(type: string | null | undefined): string {
  if (!type) return 'Unbekannt'
  return EMPLOYMENT_TYPE_LABELS[type as EmploymentType] || type
}

/**
 * Get label for department
 */
export function getDepartmentLabel(dept: string | null | undefined): string {
  if (!dept) return 'Nicht zugewiesen'
  return DEPARTMENT_LABELS[dept as Department] || dept
}

/**
 * Get color class for employment type badge
 */
export function getEmploymentTypeColor(type: string | null | undefined): string {
  if (!type) return 'bg-neutral-100 text-neutral-800 dark:bg-neutral-700 dark:text-neutral-300'
  return EMPLOYMENT_TYPE_COLORS[type as EmploymentType] || 'bg-neutral-100 text-neutral-800 dark:bg-neutral-700 dark:text-neutral-300'
}

/**
 * Get color class for department badge
 */
export function getDepartmentColor(dept: string | null | undefined): string {
  if (!dept) return 'bg-neutral-100 text-neutral-800 dark:bg-neutral-700 dark:text-neutral-300'
  return DEPARTMENT_COLORS[dept as Department] || 'bg-neutral-100 text-neutral-800 dark:bg-neutral-700 dark:text-neutral-300'
}
