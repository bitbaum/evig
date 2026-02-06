/**
 * Bulk Erfassung Configuration
 *
 * Constants and config for bulk product entry.
 * Used by: BulkTable, bulk-text API, file-parser, bulk-save API
 */

/**
 * Column definition for the bulk review table
 */
export interface BulkTableColumn {
  key: keyof import('@/types/erfassung').ErfassungFormData
  label: string
  width: string
  editable?: boolean
}

/**
 * Table columns shown in the bulk review table
 */
export const BULK_TABLE_COLUMNS: BulkTableColumn[] = [
  { key: 'hersteller', label: 'Hersteller', width: '120px', editable: true },
  { key: 'produktname', label: 'Produktname', width: '200px', editable: true },
  { key: 'hauptkategorie', label: 'Kategorie', width: '120px', editable: true },
  { key: 'zustand', label: 'Zustand', width: '100px', editable: true },
  { key: 'verkaufspreis', label: 'Preis (CHF)', width: '100px', editable: true },
]

/**
 * Limits for bulk operations
 */
export const BULK_LIMITS = {
  /** Maximum products in a single bulk session */
  maxProducts: 1000,
  /** Rows per page in the review table */
  pageSize: 50,
  /** Products per AI extraction chunk */
  aiChunkSize: 15,
  /** Products per database save chunk */
  saveChunkSize: 50,
} as const

/**
 * CSV column aliases for auto-detection
 *
 * Maps common CSV column names (German + English) to ErfassungFormData field names.
 * Case-insensitive matching is applied at parse time.
 */
export const CSV_COLUMN_ALIASES: Record<string, string> = {
  // Hersteller
  'hersteller': 'hersteller',
  'marke': 'hersteller',
  'brand': 'hersteller',
  'manufacturer': 'hersteller',
  'firma': 'hersteller',

  // Produktname
  'produktname': 'produktname',
  'produkt': 'produktname',
  'modell': 'produktname',
  'model': 'produktname',
  'product': 'produktname',
  'name': 'produktname',
  'product_name': 'produktname',
  'artikel': 'produktname',

  // Kurzbeschreibung
  'kurzbeschreibung': 'kurzbeschreibung',
  'beschreibung': 'kurzbeschreibung',
  'description': 'kurzbeschreibung',

  // Preis
  'verkaufspreis': 'verkaufspreis',
  'preis': 'verkaufspreis',
  'price': 'verkaufspreis',
  'vk': 'verkaufspreis',
  'vk-preis': 'verkaufspreis',
  'chf': 'verkaufspreis',

  // Zustand
  'zustand': 'zustand',
  'condition': 'zustand',

  // Kategorie
  'hauptkategorie': 'hauptkategorie',
  'kategorie': 'hauptkategorie',
  'category': 'hauptkategorie',

  // Unterkategorie
  'unterkategorie': 'unterkategorie',
  'subcategory': 'unterkategorie',

  // Lager
  'location': 'location',
  'lagerort': 'location',
  'standort': 'location',
  'box_id': 'box_id',
  'box': 'box_id',
  'auf_lager': 'auf_lager',
  'menge': 'auf_lager',
  'anzahl': 'auf_lager',
  'quantity': 'auf_lager',

  // Dimensionen
  'laenge_mm': 'laenge_mm',
  'laenge': 'laenge_mm',
  'length': 'laenge_mm',
  'breite_mm': 'breite_mm',
  'breite': 'breite_mm',
  'width': 'breite_mm',
  'hoehe_mm': 'hoehe_mm',
  'hoehe': 'hoehe_mm',
  'height': 'hoehe_mm',
  'gewicht_kg': 'gewicht_kg',
  'gewicht': 'gewicht_kg',
  'weight': 'gewicht_kg',
}
