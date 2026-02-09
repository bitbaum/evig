/**
 * Product Condition Configuration
 *
 * Defines condition grades for refurbished products.
 * Used in: product erfassung, pricing, display, filtering
 *
 * Based on industry-standard refurbishment grading.
 */

export interface Condition {
  /** Database value (English, lowercase) */
  value: string
  /** German display label */
  label: string
  /** Detailed German description */
  description: string
  /** Suggested price multiplier (1.0 = base price) */
  priceMultiplier: number
  /** Sort order (lower = better condition) */
  sortOrder: number
}

/**
 * Product condition options
 *
 * Order: best to worst condition
 */
export const ZUSTAND_OPTIONS: Condition[] = [
  {
    value: 'new',
    label: 'Neu',
    description: 'Originalverpackt, unbenutzt',
    priceMultiplier: 1.0,
    sortOrder: 1,
  },
  {
    value: 'like_new',
    label: 'Wie neu',
    description: 'Keine sichtbaren Gebrauchsspuren, voll funktionsfähig',
    priceMultiplier: 0.85,
    sortOrder: 2,
  },
  {
    value: 'good',
    label: 'Gut',
    description: 'Leichte Gebrauchsspuren, voll funktionsfähig',
    priceMultiplier: 0.7,
    sortOrder: 3,
  },
  {
    value: 'fair',
    label: 'Akzeptabel',
    description: 'Deutliche Gebrauchsspuren, funktionsfähig',
    priceMultiplier: 0.5,
    sortOrder: 4,
  },
  {
    value: 'poor',
    label: 'Schlecht',
    description: 'Starke Gebrauchsspuren, funktionsfähig mit Einschränkungen',
    priceMultiplier: 0.3,
    sortOrder: 5,
  },
  {
    value: 'defect',
    label: 'Defekt',
    description: 'Nicht funktionsfähig, für Ersatzteile',
    priceMultiplier: 0.1,
    sortOrder: 6,
  },
]

/**
 * Type for condition values
 */
export type ZustandValue = typeof ZUSTAND_OPTIONS[number]['value']

/**
 * Get condition by value
 */
export function getConditionByValue(value: string): Condition | undefined {
  return ZUSTAND_OPTIONS.find(c => c.value === value)
}

/**
 * Get condition label (German)
 */
export function getConditionLabel(value: string): string {
  return getConditionByValue(value)?.label ?? CONDITION_VALUE_ALIASES[value]?.label ?? value
}

/**
 * Badge style for condition display in UI
 */
export interface ConditionBadge {
  label: string
  color: string
}

const CONDITION_BADGE_COLORS: Record<string, string> = {
  new: 'bg-green-100 text-green-800',
  like_new: 'bg-blue-100 text-blue-800',
  good: 'bg-yellow-100 text-yellow-800',
  fair: 'bg-orange-100 text-orange-800',
  poor: 'bg-red-100 text-red-800',
  defect: 'bg-gray-100 text-gray-800',
}

/**
 * Aliases for legacy condition values used in different parts of the codebase
 */
const CONDITION_VALUE_ALIASES: Record<string, { canonical: string; label: string }> = {
  excellent: { canonical: 'like_new', label: 'Sehr gut' },
  very_good: { canonical: 'like_new', label: 'Sehr gut' },
  acceptable: { canonical: 'fair', label: 'Akzeptabel' },
  for_parts: { canonical: 'defect', label: 'Für Teile' },
}

/**
 * Normalize a condition value to its canonical DB form.
 * Resolves aliases (very_good → like_new, acceptable → fair, etc.)
 * and returns the value unchanged if already canonical.
 */
export function normalizeConditionValue(value: string): string {
  const canonical = getConditionByValue(value)
  if (canonical) return value
  const alias = CONDITION_VALUE_ALIASES[value]
  if (alias) return alias.canonical
  return value
}

/**
 * Get condition badge with label and Tailwind color classes
 * Supports both canonical values (new, like_new, good, fair, poor, defect)
 * and legacy aliases (excellent, very_good, acceptable)
 */
export function getConditionBadge(value: string): ConditionBadge {
  // Check canonical values first
  const condition = getConditionByValue(value)
  if (condition) {
    return { label: condition.label, color: CONDITION_BADGE_COLORS[value] || 'bg-gray-100 text-gray-800' }
  }
  // Check aliases
  const alias = CONDITION_VALUE_ALIASES[value]
  if (alias) {
    return { label: alias.label, color: CONDITION_BADGE_COLORS[alias.canonical] || 'bg-gray-100 text-gray-800' }
  }
  return { label: value, color: 'bg-gray-100 text-gray-800' }
}

/**
 * Map spoken German to condition value
 * Used by voice input to parse natural language
 */
export const CONDITION_ALIASES: Record<string, ZustandValue> = {
  // Neu
  'neu': 'new',
  'new': 'new',
  'originalverpackt': 'new',
  'ovp': 'new',

  // Wie neu
  'wie neu': 'like_new',
  'wieneu': 'like_new',
  'fast neu': 'like_new',
  'neuwertig': 'like_new',
  'sehr gut': 'like_new',

  // Gut
  'gut': 'good',
  'good': 'good',
  'ok': 'good',
  'okay': 'good',
  'in ordnung': 'good',

  // Akzeptabel
  'akzeptabel': 'fair',
  'fair': 'fair',
  'gebraucht': 'fair',
  'mittel': 'fair',
  'mittelmässig': 'fair',

  // Schlecht
  'schlecht': 'poor',
  'poor': 'poor',
  'stark gebraucht': 'poor',
  'abgenutzt': 'poor',

  // Defekt
  'defekt': 'defect',
  'kaputt': 'defect',
  'broken': 'defect',
  'funktioniert nicht': 'defect',
}

/**
 * Parse condition from text (voice input)
 */
export function parseConditionFromText(text: string): ZustandValue | undefined {
  const normalized = text.toLowerCase().trim()

  // Direct match
  if (CONDITION_ALIASES[normalized]) {
    return CONDITION_ALIASES[normalized]
  }

  // Partial match
  for (const [alias, value] of Object.entries(CONDITION_ALIASES)) {
    if (normalized.includes(alias)) {
      return value
    }
  }

  return undefined
}
