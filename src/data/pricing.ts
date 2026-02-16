/**
 * Pricing Configuration — SSOT
 *
 * All pricing constants used across services.
 * Import from here instead of hardcoding in components or service definitions.
 *
 * Values are synced with org_numbers table (economic category).
 */

import { getDefaultNumeric } from '@/lib/org-numbers'

// Core pricing constants (from org-numbers defaults)
export const HOURLY_RATE = getDefaultNumeric('hourly_rate_chf')
export const ASSESSMENT_FEE = getDefaultNumeric('assessment_fee_chf')

// Formatted strings for display (German)
export const HOURLY_RATE_DISPLAY = `CHF ${HOURLY_RATE}/Stunde`
export const ASSESSMENT_FEE_DISPLAY = `CHF ${ASSESSMENT_FEE} Bewertungsgebühr`

/**
 * Data recovery media pricing (German)
 */
export const MEDIA_PRICES = [
  'Disketten (3.5" und 5.25"): CHF 10 pro Diskette',
  'ZIP/Syquest/EZ Drive/Jazz: CHF 20 pro Diskette',
  'MO-Laufwerke (3.5"-5.25"): CHF 30 pro Diskette',
  'Festplatten: CHF 40 pro Festplatte',
  'Bandlaufwerke: CHF 50 pro Band',
  'VHS/Schallplatten: Preis auf Anfrage',
] as const
