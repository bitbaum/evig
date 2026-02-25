/**
 * Category-Specific Condition Criteria
 *
 * Defines what each condition grade means for each product category.
 * "Gut" for a laptop is different from "Gut" for a monitor.
 *
 * Used in:
 * - Sell form: seller sees checklist when selecting condition
 * - Detail page: buyer sees what each grade means for the category
 *
 * SSOT: Only define criteria here. UI components derive from this config.
 */

export interface ConditionCriterion {
  /** Unique key for this criterion */
  key: string
  /** German label shown to seller/buyer */
  label: string
}

export interface CategoryConditionCriteria {
  /** KATEGORIEN category value */
  categoryValue: string
  /** Condition value (from LISTING_CONDITIONS) */
  condition: string
  /** What this condition means for this category */
  criteria: ConditionCriterion[]
}

/**
 * Condition criteria per category + condition.
 * Key format: `${categoryValue}:${condition}`
 */
const CRITERIA_MAP: Record<string, ConditionCriterion[]> = {
  // Laptops — Wie neu
  '10:like_new': [
    { key: 'no_scratches', label: 'Keine sichtbaren Kratzer oder Gebrauchsspuren' },
    { key: 'battery_90', label: 'Akku bei mindestens 90% Kapazität' },
    { key: 'display_perfect', label: 'Display ohne Pixelfehler oder Flecken' },
    { key: 'keyboard_clean', label: 'Tastatur und Trackpad einwandfrei' },
    { key: 'all_ports', label: 'Alle Anschlüsse funktionieren' },
  ],
  // Laptops — Gut
  '10:good': [
    { key: 'minor_scratches', label: 'Leichte Gebrauchsspuren am Gehäuse' },
    { key: 'battery_3h', label: 'Akku hält mindestens 3 Stunden' },
    { key: 'display_ok', label: 'Display ohne tote Pixel' },
    { key: 'keyboard_works', label: 'Tastatur voll funktionsfähig' },
    { key: 'all_ports', label: 'Alle Anschlüsse funktionieren' },
  ],
  // Laptops — Akzeptabel
  '10:fair': [
    { key: 'visible_wear', label: 'Deutliche Gebrauchsspuren am Gehäuse' },
    { key: 'battery_1h', label: 'Akku hält mindestens 1 Stunde' },
    { key: 'display_usable', label: 'Display funktionsfähig (leichte Mängel möglich)' },
    { key: 'keyboard_works', label: 'Tastatur funktionsfähig' },
  ],
  // Laptops — Schlecht
  '10:poor': [
    { key: 'heavy_wear', label: 'Starke Gehäuseschäden oder Risse' },
    { key: 'battery_weak', label: 'Akku schwach (unter 1 Stunde) oder defekt' },
    { key: 'boots', label: 'Gerät startet und ist grundsätzlich nutzbar' },
  ],

  // Desktop PCs — Gut
  '20:good': [
    { key: 'boots_stable', label: 'Startet zuverlässig und läuft stabil' },
    { key: 'fans_quiet', label: 'Lüfter funktionieren ohne ungewöhnliche Geräusche' },
    { key: 'all_ports', label: 'Alle Anschlüsse funktionieren' },
    { key: 'case_intact', label: 'Gehäuse intakt, leichte Gebrauchsspuren' },
  ],
  // Desktop PCs — Akzeptabel
  '20:fair': [
    { key: 'boots', label: 'Startet und ist grundsätzlich nutzbar' },
    { key: 'case_wear', label: 'Deutliche Gebrauchsspuren am Gehäuse' },
    { key: 'noise', label: 'Lüfter möglicherweise lauter als normal' },
  ],

  // Monitore — Gut
  '30:good': [
    { key: 'no_dead_pixels', label: 'Keine toten Pixel' },
    { key: 'even_backlight', label: 'Gleichmässige Hintergrundbeleuchtung' },
    { key: 'stand_ok', label: 'Standfuss funktioniert (Höhenverstellung etc.)' },
    { key: 'minor_scratches', label: 'Leichte Kratzer am Gehäuse möglich' },
  ],
  // Monitore — Akzeptabel
  '30:fair': [
    { key: 'display_usable', label: 'Display funktionsfähig (minimale Ungleichmässigkeiten möglich)' },
    { key: 'stand_basic', label: 'Standfuss vorhanden und stabil' },
    { key: 'visible_wear', label: 'Sichtbare Gebrauchsspuren' },
  ],

  // Smartphones — Wie neu
  '50:like_new': [
    { key: 'no_scratches', label: 'Display und Gehäuse ohne Kratzer' },
    { key: 'battery_90', label: 'Akku bei mindestens 90% Kapazität' },
    { key: 'camera_perfect', label: 'Kamera einwandfrei' },
    { key: 'all_buttons', label: 'Alle Tasten und Sensoren funktionieren' },
  ],
  // Smartphones — Gut
  '50:good': [
    { key: 'minor_scratches', label: 'Leichte Kratzer am Gehäuse (Display einwandfrei)' },
    { key: 'battery_80', label: 'Akku bei mindestens 80% Kapazität' },
    { key: 'camera_works', label: 'Kamera funktioniert' },
    { key: 'all_buttons', label: 'Alle Tasten funktionieren' },
  ],
  // Smartphones — Akzeptabel
  '50:fair': [
    { key: 'display_scratches', label: 'Leichte Kratzer auf dem Display möglich' },
    { key: 'battery_ok', label: 'Akku hält mindestens halben Tag bei normaler Nutzung' },
    { key: 'basic_functions', label: 'Telefonie, Internet und Apps funktionieren' },
  ],

  // Tablets — Gut
  '40:good': [
    { key: 'display_ok', label: 'Display ohne Risse oder tote Pixel' },
    { key: 'battery_4h', label: 'Akku hält mindestens 4 Stunden' },
    { key: 'touch_works', label: 'Touch-Funktion einwandfrei' },
    { key: 'minor_wear', label: 'Leichte Gebrauchsspuren am Gehäuse' },
  ],
}

/**
 * Get condition criteria for a category and condition.
 * Returns null if no specific criteria are defined.
 */
export function getConditionCriteria(
  categoryValue: string,
  condition: string
): ConditionCriterion[] | null {
  return CRITERIA_MAP[`${categoryValue}:${condition}`] || null
}

/**
 * Check if criteria exist for a given category (any condition).
 */
export function hasCriteriaForCategory(categoryValue: string): boolean {
  return Object.keys(CRITERIA_MAP).some(key => key.startsWith(`${categoryValue}:`))
}

/**
 * Get all conditions that have criteria for a given category.
 */
export function getConditionsWithCriteria(categoryValue: string): string[] {
  return Object.keys(CRITERIA_MAP)
    .filter(key => key.startsWith(`${categoryValue}:`))
    .map(key => key.split(':')[1])
}
