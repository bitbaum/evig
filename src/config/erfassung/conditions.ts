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
  return getConditionByValue(value)?.label ?? value
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
