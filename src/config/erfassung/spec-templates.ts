/**
 * Spec Templates Configuration
 *
 * Defines technical specification field templates by category.
 * Used in: product erfassung form and marketplace sell form.
 *
 * SpecTemplate is the CONFIG type (key + optional placeholder).
 * SpecField (from schemas) is the RUNTIME type (key + value).
 * These are intentionally separate — templates define shape, not data.
 *
 * To add specs for a new category:
 *   1. Add entry using the category value as key
 *   2. List relevant spec fields with German labels
 */

import type { SpecField } from '@/types/erfassung'

/** Template definition — defines which fields exist for a category */
export interface SpecTemplate {
  key: string
  placeholder?: string
}

/**
 * Spec field templates by main category
 *
 * Keys match category values from categories.ts
 * Use 'default' for categories without specific templates
 */
export const SPEC_TEMPLATES: Record<string, SpecTemplate[]> = {
  // Laptops (10)
  '10': [
    { key: 'CPU', placeholder: 'z.B. Intel i5-8350U' },
    { key: 'RAM', placeholder: 'z.B. 16 GB' },
    { key: 'RAM-Typ', placeholder: 'z.B. DDR4' },
    { key: 'Speicher', placeholder: 'z.B. 512 GB SSD' },
    { key: 'Display', placeholder: 'z.B. 14 Zoll' },
    { key: 'Auflösung', placeholder: 'z.B. 1920x1080' },
    { key: 'Grafik', placeholder: 'z.B. Intel UHD 620' },
    { key: 'Akku', placeholder: 'z.B. 6 Stunden' },
    { key: 'Anschlüsse', placeholder: 'z.B. USB-C, HDMI, USB-A' },
    { key: 'WLAN', placeholder: 'z.B. WiFi 6' },
    { key: 'OS', placeholder: 'z.B. Ubuntu 24.04' },
  ],

  // Desktop PCs (20)
  '20': [
    { key: 'CPU', placeholder: 'z.B. Intel i5-8350U' },
    { key: 'RAM', placeholder: 'z.B. 16 GB' },
    { key: 'RAM-Typ', placeholder: 'z.B. DDR4' },
    { key: 'Speicher', placeholder: 'z.B. 512 GB SSD' },
    { key: 'Grafik', placeholder: 'z.B. Intel UHD 620' },
    { key: 'Netzteil' },
    { key: 'Gehäuse' },
    { key: 'Anschlüsse', placeholder: 'z.B. USB-C, HDMI, USB-A' },
    { key: 'OS', placeholder: 'z.B. Ubuntu 24.04' },
  ],

  // Monitore (30)
  '30': [
    { key: 'Grösse', placeholder: 'z.B. 27 Zoll' },
    { key: 'Auflösung', placeholder: 'z.B. 1920x1080' },
    { key: 'Panel', placeholder: 'z.B. IPS' },
    { key: 'Helligkeit', placeholder: 'z.B. 350 cd/m²' },
    { key: 'Kontrast' },
    { key: 'Refresh Rate', placeholder: 'z.B. 144 Hz' },
    { key: 'Reaktionszeit' },
    { key: 'Anschlüsse', placeholder: 'z.B. USB-C, HDMI, USB-A' },
    { key: 'Höhenverstellbar' },
    { key: 'VESA' },
  ],

  // Tablets (40)
  '40': [
    { key: 'Display', placeholder: 'z.B. 10.9 Zoll' },
    { key: 'Auflösung', placeholder: 'z.B. 1920x1080' },
    { key: 'Prozessor', placeholder: 'z.B. Apple M1' },
    { key: 'RAM', placeholder: 'z.B. 8 GB' },
    { key: 'Speicher', placeholder: 'z.B. 128 GB' },
    { key: 'Akku', placeholder: 'z.B. 10 Stunden' },
    { key: 'OS', placeholder: 'z.B. iPadOS 17' },
    { key: 'Kamera', placeholder: 'z.B. 12 MP' },
    { key: 'Konnektivität' },
  ],

  // Smartphones (50)
  '50': [
    { key: 'Display', placeholder: 'z.B. 6.1 Zoll' },
    { key: 'Auflösung', placeholder: 'z.B. 2556x1179' },
    { key: 'Prozessor', placeholder: 'z.B. Apple A17 Pro' },
    { key: 'RAM', placeholder: 'z.B. 8 GB' },
    { key: 'Speicher', placeholder: 'z.B. 256 GB' },
    { key: 'Akku', placeholder: 'z.B. 4422 mAh' },
    { key: 'OS', placeholder: 'z.B. Android 14' },
    { key: 'Hauptkamera', placeholder: 'z.B. 48 MP' },
    { key: 'Frontkamera', placeholder: 'z.B. 12 MP' },
    { key: 'SIM' },
  ],

  // Drucker & Scanner (60)
  '60': [
    { key: 'Typ' },
    { key: 'Druckauflösung' },
    { key: 'Geschwindigkeit' },
    { key: 'Papierformat' },
    { key: 'Duplex' },
    { key: 'Anschlüsse', placeholder: 'z.B. USB, Ethernet' },
    { key: 'WLAN', placeholder: 'z.B. WiFi 6' },
    { key: 'Scanner-Auflösung' },
  ],

  // Komponenten (70)
  '70': [
    { key: 'Typ' },
    { key: 'Kapazität' },
    { key: 'Takt' },
    { key: 'Anschluss' },
    { key: 'Formfaktor' },
    { key: 'Leistung' },
  ],

  // Peripherie (80)
  '80': [
    { key: 'Typ' },
    { key: 'Anschluss' },
    { key: 'Layout' },
    { key: 'Beleuchtung' },
    { key: 'Kabellos' },
  ],

  // Netzwerk (90)
  '90': [
    { key: 'Typ' },
    { key: 'Standard' },
    { key: 'Ports' },
    { key: 'Geschwindigkeit' },
    { key: 'PoE' },
    { key: 'WLAN', placeholder: 'z.B. WiFi 6' },
  ],

  // Default template for unknown categories
  default: [
    { key: 'Beschreibung' },
    { key: 'Zustand Details' },
  ],
}

/**
 * Get spec template for a category.
 * Returns a deep copy to avoid mutation.
 */
export function getSpecTemplate(categoryValue: string): SpecTemplate[] {
  const template = SPEC_TEMPLATES[categoryValue] ?? SPEC_TEMPLATES.default
  return template.map(field => ({ ...field }))
}

/**
 * Get spec template for a subcategory.
 * Finds parent by matching against known template keys.
 */
export function getSpecTemplateForSubcategory(subValue: string): SpecTemplate[] {
  // Try direct match first
  if (SPEC_TEMPLATES[subValue]) return getSpecTemplate(subValue)

  // Walk up: try progressively shorter prefixes (e.g. 101 → 10 → 1)
  for (let len = subValue.length - 1; len >= 1; len--) {
    const prefix = subValue.slice(0, len)
    if (SPEC_TEMPLATES[prefix]) return getSpecTemplate(prefix)
  }

  return getSpecTemplate('default')
}

/**
 * Convert a template to empty spec fields (for form initialization)
 */
export function templateToSpecFields(templates: SpecTemplate[]): SpecField[] {
  return templates.map(t => ({ key: t.key, value: '' }))
}

/**
 * Merge existing specs with template.
 * Keeps existing values, adds missing fields from template.
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
      result.push({ key: field.key, value: '' })
    }
  }

  return result
}
