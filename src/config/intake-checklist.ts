/**
 * Device Intake Checklist Configuration
 *
 * SINGLE SOURCE OF TRUTH for the checklist-driven intake process.
 * Based on RevampIT's three-tier value cascade:
 *   1. Refurbishing (~60%) — full diagnostics, upgrades, Linux, QA → sell
 *   2. Ersatzteile (~25%) — disassemble, test components, catalog → reuse
 *   3. Recycling (~15%) — SWICO-certified disposal, NIST data wipe → recycle
 *
 * The checklist formalizes processes and gates marketplace publishing:
 * A device CANNOT be published until all required checklist items are completed.
 *
 * Device categories reference KATEGORIEN values from @/config/erfassung/categories.ts
 */

// =============================================================================
// INTAKE TIERS
// =============================================================================

export const INTAKE_TIERS = {
  REFURBISH: 'refurbish',
  PARTS: 'parts',
  RECYCLE: 'recycle',
} as const

export type IntakeTier = typeof INTAKE_TIERS[keyof typeof INTAKE_TIERS]

export const INTAKE_TIER_LABELS: Record<IntakeTier, string> = {
  [INTAKE_TIERS.REFURBISH]: 'Refurbishing',
  [INTAKE_TIERS.PARTS]: 'Ersatzteile',
  [INTAKE_TIERS.RECYCLE]: 'Recycling',
}

export const INTAKE_TIER_DESCRIPTIONS: Record<IntakeTier, string> = {
  [INTAKE_TIERS.REFURBISH]: 'Aufbereitung für Verkauf im Shop',
  [INTAKE_TIERS.PARTS]: 'Ausschlachtung für Ersatzteile und Komponenten',
  [INTAKE_TIERS.RECYCLE]: 'SWICO-zertifizierte Entsorgung',
}

export const INTAKE_TIER_ICONS: Record<IntakeTier, string> = {
  [INTAKE_TIERS.REFURBISH]: '🔧',
  [INTAKE_TIERS.PARTS]: '🔩',
  [INTAKE_TIERS.RECYCLE]: '♻️',
}

/**
 * Pseudo-tier for devices captured via Schnellerfassung (intake_tier NULL —
 * no checklist, publishable immediately). Used as a filter value in the
 * pipeline API/UI and for display; never stored in the database.
 */
export const QUICK_CAPTURE_TIER = 'quick' as const
export const QUICK_CAPTURE_LABEL = 'Schnellerfassung'
export const QUICK_CAPTURE_ICON = '⚡'

// =============================================================================
// CHECKLIST CATEGORIES
// =============================================================================

export const CHECKLIST_CATEGORIES = {
  INTAKE: 'intake',
  SECURITY: 'security',
  TESTING: 'testing',
  REFURBISHMENT: 'refurbishment',
  QUALITY: 'quality',
  LISTING: 'listing',
  PARTS: 'parts',
  RECYCLING: 'recycling',
} as const

export type ChecklistCategory = typeof CHECKLIST_CATEGORIES[keyof typeof CHECKLIST_CATEGORIES]

export const CHECKLIST_CATEGORY_LABELS: Record<ChecklistCategory, string> = {
  [CHECKLIST_CATEGORIES.INTAKE]: 'Eingang',
  [CHECKLIST_CATEGORIES.SECURITY]: 'Datensicherheit',
  [CHECKLIST_CATEGORIES.TESTING]: 'Hardware-Tests',
  [CHECKLIST_CATEGORIES.REFURBISHMENT]: 'Aufbereitung',
  [CHECKLIST_CATEGORIES.QUALITY]: 'Qualitätskontrolle',
  [CHECKLIST_CATEGORIES.LISTING]: 'Inserat',
  [CHECKLIST_CATEGORIES.PARTS]: 'Ersatzteile',
  [CHECKLIST_CATEGORIES.RECYCLING]: 'Recycling',
}

// =============================================================================
// CHECKLIST ITEM DEFINITIONS
// =============================================================================

export interface ChecklistItemConfig {
  /** Unique identifier */
  id: string
  /** Display label (Swiss German) */
  label: string
  /** Explanation of what this step involves */
  description: string
  /** Grouping category */
  category: ChecklistCategory
  /** Which tiers require this item */
  tiers: IntakeTier[]
  /** Must be completed before publishing (for refurbish tier) */
  required: boolean
  /**
   * Only show for these device categories (KATEGORIEN main values: '10'=Laptops, '20'=Desktop, etc.)
   * If undefined, show for ALL device categories.
   */
  deviceCategories?: string[]
  /**
   * Vier-Augen-Prinzip: this item should be passed by someone OTHER than the
   * person who did all the other completed required work on the device. The
   * checklist API blocks a solo sign-off UNLESS an explicit override reason
   * is written in the notes (audit trail for single-staff shifts).
   */
  requiresSecondPerson?: boolean
}

/**
 * All checklist items — SSOT
 *
 * Each item specifies which tiers and device categories it applies to.
 * The UI derives the visible checklist from this + the device's tier + category.
 */
export const CHECKLIST_ITEMS: ChecklistItemConfig[] = [
  // ---------------------------------------------------------------------------
  // INTAKE — Universal first steps (all tiers)
  // ---------------------------------------------------------------------------
  {
    id: 'visual_inspection',
    label: 'Sichtprüfung durchgeführt',
    description: 'Äusseren Zustand dokumentieren: Gehäuse, Display, Anschlüsse, Kratzer, Beschädigungen',
    category: 'intake',
    tiers: ['refurbish', 'parts', 'recycle'],
    required: true,
  },
  {
    id: 'condition_graded',
    label: 'Zustand bewertet',
    description: 'Zustandsgrad festgelegt (Neu / Wie neu / Gut / Akzeptabel / Schlecht / Defekt)',
    category: 'intake',
    tiers: ['refurbish', 'parts', 'recycle'],
    required: true,
  },
  {
    id: 'serial_noted',
    label: 'Seriennummer notiert',
    description: 'Seriennummer des Geräts erfasst (falls vorhanden)',
    category: 'intake',
    tiers: ['refurbish', 'parts', 'recycle'],
    required: false,
  },

  // ---------------------------------------------------------------------------
  // SECURITY — Data wipe (all tiers)
  // ---------------------------------------------------------------------------
  {
    id: 'data_wipe',
    label: 'Datenlöschung (NIST 800-88)',
    description: 'Sicheres Löschen aller Daten gemäss NIST 800-88 Standard. Bei SSDs: Secure Erase. Bei HDDs: Überschreiben.',
    category: 'security',
    tiers: ['refurbish', 'parts', 'recycle'],
    required: true,
    deviceCategories: ['10', '20', '40', '50'], // Laptops, Desktops, Tablets, Smartphones
  },

  // ---------------------------------------------------------------------------
  // TESTING — Hardware diagnostics (refurbish tier)
  // ---------------------------------------------------------------------------
  {
    id: 'power_test',
    label: 'Gerät startet und bootet',
    description: 'Gerät einschalten, BIOS/UEFI erreichbar, bootet vollständig',
    category: 'testing',
    tiers: ['refurbish'],
    required: true,
    deviceCategories: ['10', '20', '40', '50'], // Laptops, Desktops, Tablets, Smartphones
  },
  {
    id: 'cpu_test',
    label: 'CPU-Test bestanden',
    description: 'CPU-Stresstest durchgeführt, keine Überhitzung oder Fehler',
    category: 'testing',
    tiers: ['refurbish'],
    required: true,
    deviceCategories: ['10', '20'], // Laptops, Desktops
  },
  {
    id: 'ram_test',
    label: 'RAM-Test bestanden',
    description: 'Arbeitsspeicher mit memtest86+ oder ähnlichem getestet',
    category: 'testing',
    tiers: ['refurbish'],
    required: true,
    deviceCategories: ['10', '20'], // Laptops, Desktops
  },
  {
    id: 'storage_test',
    label: 'Speicher-Test bestanden',
    description: 'SSD/HDD Gesundheitsstatus geprüft (SMART-Werte, Lese-/Schreibtest)',
    category: 'testing',
    tiers: ['refurbish'],
    required: true,
    deviceCategories: ['10', '20', '40', '50'], // Laptops, Desktops, Tablets, Smartphones
  },
  {
    id: 'battery_test',
    label: 'Akku-Test',
    description: 'Akkukapazität messen, Ladezyklen prüfen, Mindestlaufzeit verifizieren',
    category: 'testing',
    tiers: ['refurbish'],
    required: true,
    deviceCategories: ['10', '40', '50'], // Laptops, Tablets, Smartphones
  },
  {
    id: 'display_test',
    label: 'Display-Test',
    description: 'Tote Pixel, Backlight Bleeding, Touch-Funktion, Farbdarstellung prüfen',
    category: 'testing',
    tiers: ['refurbish'],
    required: true,
    deviceCategories: ['10', '30', '40', '50'], // Laptops, Monitore, Tablets, Smartphones
  },
  {
    id: 'keyboard_test',
    label: 'Tastatur/Trackpad-Test',
    description: 'Alle Tasten und Trackpad auf Funktion testen',
    category: 'testing',
    tiers: ['refurbish'],
    required: true,
    deviceCategories: ['10'], // Laptops only
  },
  {
    id: 'ports_test',
    label: 'Anschlüsse getestet',
    description: 'USB, HDMI, Ethernet, Audio, Kartenleser — alle vorhandenen Ports testen',
    category: 'testing',
    tiers: ['refurbish'],
    required: true,
    deviceCategories: ['10', '20', '30'], // Laptops, Desktops, Monitore
  },
  {
    id: 'wifi_test',
    label: 'WLAN/Bluetooth-Test',
    description: 'WLAN-Verbindung und Bluetooth-Kopplung testen',
    category: 'testing',
    tiers: ['refurbish'],
    required: false,
    deviceCategories: ['10', '40', '50'], // Laptops, Tablets, Smartphones
  },
  {
    id: 'camera_test',
    label: 'Kamera-Test',
    description: 'Front- und Rückkamera auf Funktion prüfen',
    category: 'testing',
    tiers: ['refurbish'],
    required: false,
    deviceCategories: ['40', '50'], // Tablets, Smartphones
  },
  {
    id: 'speaker_test',
    label: 'Lautsprecher/Mikrofon-Test',
    description: 'Audio-Ausgabe und Mikrofon-Eingabe testen',
    category: 'testing',
    tiers: ['refurbish'],
    required: false,
    deviceCategories: ['10', '40', '50'], // Laptops, Tablets, Smartphones
  },
  {
    id: 'printer_test',
    label: 'Drucktest',
    description: 'Testseite drucken, Qualität prüfen, Scanner testen (falls vorhanden)',
    category: 'testing',
    tiers: ['refurbish'],
    required: true,
    deviceCategories: ['60'], // Drucker & Scanner
  },

  // ---------------------------------------------------------------------------
  // REFURBISHMENT — Upgrades and prep (refurbish tier)
  // ---------------------------------------------------------------------------
  {
    id: 'cleaning',
    label: 'Gerät gereinigt',
    description: 'Gehäuse, Tastatur, Lüfter, Anschlüsse gründlich reinigen',
    category: 'refurbishment',
    tiers: ['refurbish'],
    required: true,
  },
  {
    id: 'upgrades_applied',
    label: 'Upgrades durchgeführt',
    description: 'Falls nötig: RAM aufgerüstet, SSD eingebaut, Akku ersetzt',
    category: 'refurbishment',
    tiers: ['refurbish'],
    required: false,
    deviceCategories: ['10', '20'], // Laptops, Desktops
  },
  {
    id: 'os_installed',
    label: 'Betriebssystem installiert',
    description: 'Linux installiert (100% Open Source), alle Treiber konfiguriert, Updates eingespielt',
    category: 'refurbishment',
    tiers: ['refurbish'],
    required: true,
    deviceCategories: ['10', '20'], // Laptops, Desktops
  },

  // ---------------------------------------------------------------------------
  // QUALITY — Final checks (refurbish tier)
  // ---------------------------------------------------------------------------
  {
    id: 'final_qa',
    label: 'Qualitätskontrolle bestanden',
    description: 'Abschlusskontrolle durch eine ZWEITE Person (Vier-Augen-Prinzip): Gerät vollständig funktionsfähig, alle Tests bestanden, bereit für Verkauf',
    category: 'quality',
    tiers: ['refurbish'],
    required: true,
    requiresSecondPerson: true,
  },
  {
    id: 'warranty_label',
    label: 'Garantie-Label angebracht',
    description: '6-Monate-Garantie-Label aufgeklebt, Garantiekarte beigelegt',
    category: 'quality',
    tiers: ['refurbish'],
    required: true,
  },

  // ---------------------------------------------------------------------------
  // LISTING — Marketplace prep (refurbish tier)
  // ---------------------------------------------------------------------------
  {
    id: 'photos_taken',
    label: 'Produktfotos erstellt',
    description: 'Mindestens 3 Fotos: Vorderseite, Rückseite, Detail/Zustandsbild',
    category: 'listing',
    tiers: ['refurbish'],
    required: true,
  },
  {
    id: 'description_written',
    label: 'Beschreibung verfasst',
    description: 'Aussagekräftige Produktbeschreibung mit Spezifikationen und Zustandsdetails',
    category: 'listing',
    tiers: ['refurbish'],
    required: true,
  },
  {
    id: 'price_set',
    label: 'Preis festgelegt',
    description: 'Verkaufspreis gemäss Solidaritäts-Preismodell festgelegt',
    category: 'listing',
    tiers: ['refurbish'],
    required: true,
  },

  // ---------------------------------------------------------------------------
  // PARTS — Parts harvesting tier
  // ---------------------------------------------------------------------------
  {
    id: 'disassembly',
    label: 'Demontage durchgeführt',
    description: 'Gerät systematisch zerlegt, Komponenten separiert',
    category: 'parts',
    tiers: ['parts'],
    required: true,
  },
  {
    id: 'components_tested',
    label: 'Komponenten getestet',
    description: 'Jede ausgebaute Komponente einzeln auf Funktion geprüft',
    category: 'parts',
    tiers: ['parts'],
    required: true,
  },
  {
    id: 'components_cataloged',
    label: 'Komponenten katalogisiert',
    description: 'Funktionsfähige Teile im Inventar erfasst (RAM, SSD, Netzteil, etc.)',
    category: 'parts',
    tiers: ['parts'],
    required: true,
  },

  // ---------------------------------------------------------------------------
  // RECYCLING — Certified disposal tier
  // ---------------------------------------------------------------------------
  {
    id: 'swico_documented',
    label: 'SWICO-Dokumentation erstellt',
    description: 'Dokumentation für SWICO-zertifizierte Entsorgung vorbereitet',
    category: 'recycling',
    tiers: ['recycle'],
    required: true,
  },
  {
    id: 'handed_to_recycler',
    label: 'An Recycling-Partner übergeben',
    description: 'Gerät an zertifizierten Recycling-Partner übergeben, Übergabeprotokoll erstellt',
    category: 'recycling',
    tiers: ['recycle'],
    required: true,
  },
]

// =============================================================================
// CHECKLIST STATE TYPE (stored in JSONB)
// =============================================================================

/**
 * Verdict for a checklist item. A boolean "done" can't express the most
 * important QC outcome: the test FAILED. A fail must be recorded (with a
 * reason) and must block publishing until fixed or the device is re-tiered.
 */
export const CHECKLIST_RESULTS = {
  PASS: 'pass',
  FAIL: 'fail',
  /** Not applicable to this specific device (e.g. laptop without webcam). */
  NA: 'na',
} as const

export type ChecklistResult = typeof CHECKLIST_RESULTS[keyof typeof CHECKLIST_RESULTS]

export const CHECKLIST_RESULT_LABELS: Record<ChecklistResult, string> = {
  [CHECKLIST_RESULTS.PASS]: 'Bestanden',
  [CHECKLIST_RESULTS.FAIL]: 'Fehlgeschlagen',
  [CHECKLIST_RESULTS.NA]: 'Nicht zutreffend',
}

export interface ChecklistItemState {
  /** Verdict; null = still open. */
  result: ChecklistResult | null
  /**
   * Legacy boolean from before verdicts existed (migration 132 rewrites
   * stored rows, this field only survives in un-migrated snapshots).
   * Read via getItemResult(), never written anymore.
   */
  completed?: boolean
  completedBy: string | null
  completedAt: string | null
  notes: string
}

export type ChecklistState = Record<string, ChecklistItemState>

/** Fresh, untouched item state. */
export function emptyChecklistItemState(): ChecklistItemState {
  return { result: null, completedBy: null, completedAt: null, notes: '' }
}

/** Effective verdict of an item, tolerating the legacy `completed` boolean. */
export function getItemResult(state: ChecklistItemState | undefined): ChecklistResult | null {
  if (!state) return null
  if (state.result) return state.result
  return state.completed === true ? CHECKLIST_RESULTS.PASS : null
}

/** An item counts as done (for the publish gate) when it passed or doesn't apply. */
export function isItemDone(state: ChecklistItemState | undefined): boolean {
  const result = getItemResult(state)
  return result === CHECKLIST_RESULTS.PASS || result === CHECKLIST_RESULTS.NA
}

/** Normalize a stored item state to the verdict shape (for API responses). */
export function normalizeChecklistItemState(state: ChecklistItemState | undefined): ChecklistItemState {
  if (!state) return emptyChecklistItemState()
  return {
    result: getItemResult(state),
    completedBy: state.completedBy ?? null,
    completedAt: state.completedAt ?? null,
    notes: state.notes ?? '',
  }
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Get checklist items applicable to a given tier and device category.
 *
 * @param tier - The intake tier (refurbish, parts, recycle)
 * @param deviceCategory - Main category value from KATEGORIEN ('10', '20', etc.)
 * @returns Filtered checklist items, grouped by category
 */
export function getChecklistForDevice(
  tier: IntakeTier,
  deviceCategory?: string | null,
): ChecklistItemConfig[] {
  return CHECKLIST_ITEMS.filter(item => {
    // Must match tier
    if (!item.tiers.includes(tier)) return false
    // If item has device category restriction, must match
    if (item.deviceCategories && deviceCategory) {
      return item.deviceCategories.includes(deviceCategory)
    }
    // If item has device category restriction but device has no category, skip it
    if (item.deviceCategories && !deviceCategory) return false
    return true
  })
}

/**
 * Get checklist items grouped by category
 */
export function getChecklistGrouped(
  tier: IntakeTier,
  deviceCategory?: string | null,
): Record<ChecklistCategory, ChecklistItemConfig[]> {
  const items = getChecklistForDevice(tier, deviceCategory)
  const grouped: Partial<Record<ChecklistCategory, ChecklistItemConfig[]>> = {}

  for (const item of items) {
    if (!grouped[item.category]) {
      grouped[item.category] = []
    }
    grouped[item.category]!.push(item)
  }

  return grouped as Record<ChecklistCategory, ChecklistItemConfig[]>
}

/**
 * Check if all required checklist items are completed.
 *
 * @param state - Current checklist JSONB from database
 * @param tier - Device's intake tier
 * @param deviceCategory - Device's main category
 * @returns true if all required items are completed
 */
export function isChecklistComplete(
  state: ChecklistState,
  tier: IntakeTier,
  deviceCategory?: string | null,
): boolean {
  const items = getChecklistForDevice(tier, deviceCategory)
  const requiredItems = items.filter(i => i.required)

  return requiredItems.every(item => isItemDone(state[item.id]))
}

/**
 * True when any REQUIRED checklist item has a 'fail' verdict.
 * A failed required item means the device is stuck: fix and retest, or
 * change the tier (parts/recycle). Optional-item failures are recorded
 * defects but don't block the pipeline.
 */
export function hasChecklistFailure(
  state: ChecklistState,
  tier: IntakeTier,
  deviceCategory?: string | null,
): boolean {
  const items = getChecklistForDevice(tier, deviceCategory)
  return items.some(
    item => item.required && getItemResult(state[item.id]) === CHECKLIST_RESULTS.FAIL,
  )
}

/**
 * Vier-Augen-Prinzip check. A `requiresSecondPerson` item (final QA) should
 * be signed off by someone who was NOT the sole worker on the device: at
 * least one other completed required item must carry a different completedBy.
 * Also true when nothing else is done yet — there is nothing to QA.
 * The API treats a violation as blocking UNLESS the sign-off carries an
 * explicit override note (solo-shift reality; the note is the audit trail).
 */
export function violatesSecondPersonRule(
  item: ChecklistItemConfig,
  state: ChecklistState,
  tier: IntakeTier,
  deviceCategory: string | null | undefined,
  actingUserId: string,
): boolean {
  if (!item.requiresSecondPerson) return false
  const otherDoneRequired = getChecklistForDevice(tier, deviceCategory)
    .filter(i => i.required && i.id !== item.id && isItemDone(state[i.id]))
  if (otherDoneRequired.length === 0) return true
  return otherDoneRequired.every(i => state[i.id]?.completedBy === actingUserId)
}

/**
 * Checklist categories whose passed items are shown to BUYERS on the
 * marketplace listing ("Geprüft von Revamp-IT"). Intake bookkeeping
 * (visual inspection, condition grading) and listing prep (photos, price)
 * are staff process steps, not buyer-relevant test results.
 */
export const BUYER_VISIBLE_CHECK_CATEGORIES: ChecklistCategory[] = [
  CHECKLIST_CATEGORIES.TESTING,
  CHECKLIST_CATEGORIES.SECURITY,
  CHECKLIST_CATEGORIES.REFURBISHMENT,
  CHECKLIST_CATEGORIES.QUALITY,
]

/**
 * The QC results a buyer should see for a published device: every PASSED
 * item from the buyer-visible categories, in the shape the `listings.
 * condition_checks` column already uses ({key,label,checked} — same contract
 * as P2P seller-declared checks). Labels are snapshotted at publish time on
 * purpose: the listing is a historical record of what was checked then, even
 * if the checklist config evolves later.
 */
export function getBuyerVisibleChecks(
  state: ChecklistState,
  tier: IntakeTier,
  deviceCategory?: string | null,
): Array<{ key: string; label: string; checked: boolean }> {
  return getChecklistForDevice(tier, deviceCategory)
    .filter(item => BUYER_VISIBLE_CHECK_CATEGORIES.includes(item.category))
    .filter(item => getItemResult(state[item.id]) === CHECKLIST_RESULTS.PASS)
    .map(item => ({ key: item.id, label: item.label, checked: true }))
}

/**
 * Whether devices of a main category must pass the intake checklist before
 * they may be published. Derived from the checklist itself (SSOT): a category
 * requires QC when any required testing or data-security item targets it.
 * Accessory categories (components, peripherals, networking) and uncategorized
 * items stay direct-publishable via Schnellerfassung.
 */
export function requiresQualityControl(deviceCategory: string | null | undefined): boolean {
  if (!deviceCategory) return false
  return CHECKLIST_ITEMS.some(
    item =>
      item.required &&
      (item.category === CHECKLIST_CATEGORIES.TESTING || item.category === CHECKLIST_CATEGORIES.SECURITY) &&
      item.deviceCategories?.includes(deviceCategory) === true,
  )
}

/**
 * Calculate checklist progress.
 *
 * @returns { completed, total, requiredCompleted, requiredTotal, failed, percentage }
 */
export function getChecklistProgress(
  state: ChecklistState,
  tier: IntakeTier,
  deviceCategory?: string | null,
): {
  completed: number
  total: number
  requiredCompleted: number
  requiredTotal: number
  /** Items (required or optional) with a 'fail' verdict. */
  failed: number
  percentage: number
} {
  const items = getChecklistForDevice(tier, deviceCategory)
  const requiredItems = items.filter(i => i.required)

  const completed = items.filter(i => isItemDone(state[i.id])).length
  const requiredCompleted = requiredItems.filter(i => isItemDone(state[i.id])).length
  const failed = items.filter(i => getItemResult(state[i.id]) === CHECKLIST_RESULTS.FAIL).length

  return {
    completed,
    total: items.length,
    requiredCompleted,
    requiredTotal: requiredItems.length,
    failed,
    percentage: requiredItems.length > 0
      ? Math.round((requiredCompleted / requiredItems.length) * 100)
      : 100,
  }
}

/**
 * Get intake tier options for select dropdowns
 */
export function getIntakeTierOptions(): Array<{ value: IntakeTier; label: string; description: string; icon: string }> {
  return Object.values(INTAKE_TIERS).map(value => ({
    value,
    label: INTAKE_TIER_LABELS[value],
    description: INTAKE_TIER_DESCRIPTIONS[value],
    icon: INTAKE_TIER_ICONS[value],
  }))
}
