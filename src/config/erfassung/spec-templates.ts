/**
 * Spec Templates Configuration
 *
 * Defines technical specification field templates by category.
 * Used in: product erfassung form to pre-populate spec fields
 *
 * When user selects a category, these templates provide
 * relevant spec fields for that product type.
 *
 * To add specs for a new category:
 *   1. Add entry using the category value as key
 *   2. List relevant spec fields with German labels
 */

import type { SpecField } from '@/types/erfassung'

/**
 * Spec field templates by main category
 *
 * Keys match category values from categories.ts
 * Use 'default' for categories without specific templates
 */
export const SPEC_TEMPLATES: Record<string, SpecField[]> = {
  // Laptops (10)
  '10': [
    { key: 'CPU', value: '', placeholder: 'z.B. Intel i5-8350U' },
    { key: 'RAM', value: '', placeholder: 'z.B. 16 GB' },
    { key: 'RAM-Typ', value: '', placeholder: 'z.B. DDR4' },
    { key: 'Speicher', value: '', placeholder: 'z.B. 512 GB SSD' },
    { key: 'Display', value: '', placeholder: 'z.B. 14 Zoll' },
    { key: 'Auflösung', value: '', placeholder: 'z.B. 1920x1080' },
    { key: 'Grafik', value: '', placeholder: 'z.B. Intel UHD 620' },
    { key: 'Akku', value: '', placeholder: 'z.B. 6 Stunden' },
    { key: 'Anschlüsse', value: '', placeholder: 'z.B. USB-C, HDMI, USB-A' },
    { key: 'WLAN', value: '', placeholder: 'z.B. WiFi 6' },
    { key: 'OS', value: '', placeholder: 'z.B. Ubuntu 24.04' },
  ],

  // Desktop PCs (20)
  '20': [
    { key: 'CPU', value: '', placeholder: 'z.B. Intel i5-8350U' },
    { key: 'RAM', value: '', placeholder: 'z.B. 16 GB' },
    { key: 'RAM-Typ', value: '', placeholder: 'z.B. DDR4' },
    { key: 'Speicher', value: '', placeholder: 'z.B. 512 GB SSD' },
    { key: 'Grafik', value: '', placeholder: 'z.B. Intel UHD 620' },
    { key: 'Netzteil', value: '' },
    { key: 'Gehäuse', value: '' },
    { key: 'Anschlüsse', value: '', placeholder: 'z.B. USB-C, HDMI, USB-A' },
    { key: 'OS', value: '', placeholder: 'z.B. Ubuntu 24.04' },
  ],

  // Monitore (30)
  '30': [
    { key: 'Grösse', value: '', placeholder: 'z.B. 27 Zoll' },
    { key: 'Auflösung', value: '', placeholder: 'z.B. 1920x1080' },
    { key: 'Panel', value: '', placeholder: 'z.B. IPS' },
    { key: 'Helligkeit', value: '', placeholder: 'z.B. 350 cd/m²' },
    { key: 'Kontrast', value: '' },
    { key: 'Refresh Rate', value: '', placeholder: 'z.B. 144 Hz' },
    { key: 'Reaktionszeit', value: '' },
    { key: 'Anschlüsse', value: '', placeholder: 'z.B. USB-C, HDMI, USB-A' },
    { key: 'Höhenverstellbar', value: '' },
    { key: 'VESA', value: '' },
  ],

  // Tablets (40)
  '40': [
    { key: 'Display', value: '', placeholder: 'z.B. 14 Zoll' },
    { key: 'Auflösung', value: '', placeholder: 'z.B. 1920x1080' },
    { key: 'Prozessor', value: '', placeholder: 'z.B. Apple M1' },
    { key: 'RAM', value: '', placeholder: 'z.B. 16 GB' },
    { key: 'Speicher', value: '', placeholder: 'z.B. 512 GB SSD' },
    { key: 'Akku', value: '', placeholder: 'z.B. 6 Stunden' },
    { key: 'OS', value: '', placeholder: 'z.B. Ubuntu 24.04' },
    { key: 'Kamera', value: '', placeholder: 'z.B. 12 MP' },
    { key: 'Konnektivität', value: '' },
  ],

  // Smartphones (50)
  '50': [
    { key: 'Display', value: '', placeholder: 'z.B. 14 Zoll' },
    { key: 'Auflösung', value: '', placeholder: 'z.B. 1920x1080' },
    { key: 'Prozessor', value: '', placeholder: 'z.B. Apple M1' },
    { key: 'RAM', value: '', placeholder: 'z.B. 16 GB' },
    { key: 'Speicher', value: '', placeholder: 'z.B. 512 GB SSD' },
    { key: 'Akku', value: '', placeholder: 'z.B. 6 Stunden' },
    { key: 'OS', value: '', placeholder: 'z.B. Ubuntu 24.04' },
    { key: 'Hauptkamera', value: '', placeholder: 'z.B. 48 MP' },
    { key: 'Frontkamera', value: '', placeholder: 'z.B. 12 MP' },
    { key: 'SIM', value: '' },
  ],

  // Drucker & Scanner (60)
  '60': [
    { key: 'Typ', value: '' },
    { key: 'Druckauflösung', value: '' },
    { key: 'Geschwindigkeit', value: '' },
    { key: 'Papierformat', value: '' },
    { key: 'Duplex', value: '' },
    { key: 'Anschlüsse', value: '', placeholder: 'z.B. USB-C, HDMI, USB-A' },
    { key: 'WLAN', value: '', placeholder: 'z.B. WiFi 6' },
    { key: 'Scanner-Auflösung', value: '' },
  ],

  // Komponenten (70)
  '70': [
    { key: 'Typ', value: '' },
    { key: 'Kapazität', value: '' },
    { key: 'Takt', value: '' },
    { key: 'Anschluss', value: '' },
    { key: 'Formfaktor', value: '' },
    { key: 'Leistung', value: '' },
  ],

  // Peripherie (80)
  '80': [
    { key: 'Typ', value: '' },
    { key: 'Anschluss', value: '' },
    { key: 'Layout', value: '' },
    { key: 'Beleuchtung', value: '' },
    { key: 'Kabellos', value: '' },
  ],

  // Netzwerk (90)
  '90': [
    { key: 'Typ', value: '' },
    { key: 'Standard', value: '' },
    { key: 'Ports', value: '' },
    { key: 'Geschwindigkeit', value: '' },
    { key: 'PoE', value: '' },
    { key: 'WLAN', value: '', placeholder: 'z.B. WiFi 6' },
  ],

  // Default template for unknown categories
  default: [
    { key: 'Beschreibung', value: '' },
    { key: 'Zustand Details', value: '' },
  ],
}

/**
 * Get spec template for a category
 *
 * Returns deep copy to avoid mutation
 */
export function getSpecTemplate(categoryValue: string): SpecField[] {
  const template = SPEC_TEMPLATES[categoryValue] ?? SPEC_TEMPLATES.default
  return template.map(field => ({ ...field }))
}

/**
 * Get spec template for a subcategory
 *
 * Uses parent category's template (subcategory value starts with parent)
 */
export function getSpecTemplateForSubcategory(subValue: string): SpecField[] {
  // Subcategory 101, 102, etc. -> parent 10
  const parentValue = subValue.slice(0, -1)
  return getSpecTemplate(parentValue)
}

/**
 * Merge existing specs with template
 *
 * Keeps existing values, adds missing fields from template
 */
export function mergeWithTemplate(
  existingSpecs: SpecField[],
  categoryValue: string
): SpecField[] {
  const template = getSpecTemplate(categoryValue)
  const existingKeys = new Set(existingSpecs.map(s => s.key.toLowerCase()))

  // Keep existing specs
  const result = [...existingSpecs]

  // Add missing template fields
  for (const field of template) {
    if (!existingKeys.has(field.key.toLowerCase())) {
      result.push({ ...field })
    }
  }

  return result
}
