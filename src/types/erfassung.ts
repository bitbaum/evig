/**
 * Erfassung Types
 *
 * Type definitions for product data entry (Erfassung).
 * Used by: erfassung page, voice API, voice component
 *
 * For configuration constants, see: @/config/erfassung
 */

/**
 * Spec field for technical specifications
 */
export interface SpecField {
  key: string
  value: string
}

/**
 * Full form data for product entry
 */
export interface ErfassungFormData {
  // Basic info
  hersteller: string
  produktname: string
  kurzbeschreibung: string

  // Technical specs (dynamic)
  specs: SpecField[]

  // Physical dimensions
  laenge_mm: string
  breite_mm: string
  hoehe_mm: string
  gewicht_kg: string

  // Inventory
  verkaufspreis: string
  zustand: string
  location: string
  box_id: string
  auf_lager: string

  // Category
  hauptkategorie: string
  unterkategorie: string

  // Customer profiles
  kundenprofile: string[]

  // Image (base64 or URL)
  image: string | null
}

/**
 * Voice input result - subset of form data
 */
export interface VoiceProductData {
  hersteller: string
  produktname: string
  kurzbeschreibung: string
  specs: SpecField[]
  verkaufspreis: string
  zustand: string
  hauptkategorie: string
  unterkategorie: string
  kundenprofile: string[]
  bemerkungen?: string
}

/**
 * Default form state
 */
export const DEFAULT_FORM_DATA: ErfassungFormData = {
  hersteller: '',
  produktname: '',
  kurzbeschreibung: '',
  specs: [{ key: '', value: '' }],
  laenge_mm: '',
  breite_mm: '',
  hoehe_mm: '',
  gewicht_kg: '',
  verkaufspreis: '',
  zustand: 'good',
  location: '',
  box_id: '',
  auf_lager: '1',
  hauptkategorie: '',
  unterkategorie: '',
  kundenprofile: [],
  image: null,
}
