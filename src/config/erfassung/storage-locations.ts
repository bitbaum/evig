/**
 * Storage locations — SSOT for WHERE a physical product sits.
 *
 * KINDS live here (config); the actual location INSTANCES live in the
 * `storage_locations` table (runtime-addable). A product references one
 * instance via `inventory_items.storage_location_id`.
 *
 * This is distinct from the `locations` table (public workshop/service VENUES
 * with address/geo/capacity/approval) — do not conflate the two.
 *
 * Client-safe: labels/kinds only, no icons, so it can be imported on both the
 * server (API validation) and the client (erfassung Select) without dragging a
 * function across the RSC boundary.
 */

export const STORAGE_LOCATION_KINDS = {
  MAIN_STORAGE: 'main_storage',
  SHOP: 'shop',
  SECONDARY_STORAGE: 'secondary_storage',
  MEMBER_POSSESSION: 'member_possession',
  OTHER: 'other',
} as const

export type StorageLocationKind =
  typeof STORAGE_LOCATION_KINDS[keyof typeof STORAGE_LOCATION_KINDS]

export const STORAGE_LOCATION_KIND_OPTIONS = Object.values(STORAGE_LOCATION_KINDS)

export const STORAGE_LOCATION_KIND_LABELS: Record<StorageLocationKind, string> = {
  main_storage: 'Hauptlager',
  shop: 'Laden',
  secondary_storage: 'Nebenlager',
  member_possession: 'Bei Teammitglied',
  other: 'Andere',
}

export function isStorageLocationKind(value: string): value is StorageLocationKind {
  return (STORAGE_LOCATION_KIND_OPTIONS as readonly string[]).includes(value)
}

export function getStorageLocationKindLabel(kind: string | null | undefined): string {
  if (!kind) return STORAGE_LOCATION_KIND_LABELS.other
  return STORAGE_LOCATION_KIND_LABELS[kind as StorageLocationKind] ?? kind
}

/** Default seed rows created by migration 117 — kept here so tests/UI agree. */
export const STORAGE_LOCATION_SEEDS: ReadonlyArray<{ name: string; kind: StorageLocationKind }> = [
  { name: 'Hauptlager', kind: STORAGE_LOCATION_KINDS.MAIN_STORAGE },
  { name: 'Laden', kind: STORAGE_LOCATION_KINDS.SHOP },
  { name: 'Nebenlager', kind: STORAGE_LOCATION_KINDS.SECONDARY_STORAGE },
]
