import { INTAKE_TIERS, type IntakeTier } from '@/config/intake-checklist'

/**
 * Capture destinations — SSOT for the one decision made after product data
 * has been entered and reviewed.
 *
 * Input channels (text, photo, file, speech) are deliberately NOT workflow
 * modes. They all produce the same product record; only the destination below
 * changes what the system does with that record.
 */
export const CAPTURE_DESTINATIONS = {
  QUALITY: 'quality',
  INVENTORY: 'inventory',
  SHOP_UNTESTED: 'shop_untested',
  PARTS: 'parts',
  RECYCLE: 'recycle',
} as const

export type CaptureDestination =
  (typeof CAPTURE_DESTINATIONS)[keyof typeof CAPTURE_DESTINATIONS]

export const CAPTURE_DESTINATION_VALUES = Object.values(CAPTURE_DESTINATIONS) as [
  CaptureDestination,
  ...CaptureDestination[],
]

/** The physical processing tier, when the destination needs a checklist. */
export function getTierForDestination(destination: CaptureDestination): IntakeTier | undefined {
  switch (destination) {
    case CAPTURE_DESTINATIONS.QUALITY:
      return INTAKE_TIERS.REFURBISH
    case CAPTURE_DESTINATIONS.PARTS:
      return INTAKE_TIERS.PARTS
    case CAPTURE_DESTINATIONS.RECYCLE:
      return INTAKE_TIERS.RECYCLE
    default:
      return undefined
  }
}

export function isChecklistDestination(destination: CaptureDestination): boolean {
  return getTierForDestination(destination) !== undefined
}

export function isUntestedShopDestination(destination: CaptureDestination): boolean {
  return destination === CAPTURE_DESTINATIONS.SHOP_UNTESTED
}
