import {
  CAPTURE_DESTINATIONS,
  CAPTURE_DESTINATION_VALUES,
  getTierForDestination,
  isChecklistDestination,
  isUntestedShopDestination,
} from '@/config/intake-workflow'
import { INTAKE_TIERS } from '@/config/intake-checklist'

describe('intake workflow SSOT', () => {
  it('exposes each destination exactly once', () => {
    expect(new Set(CAPTURE_DESTINATION_VALUES).size).toBe(CAPTURE_DESTINATION_VALUES.length)
    expect(CAPTURE_DESTINATION_VALUES).toEqual(expect.arrayContaining(Object.values(CAPTURE_DESTINATIONS)))
  })

  it.each([
    [CAPTURE_DESTINATIONS.QUALITY, INTAKE_TIERS.REFURBISH],
    [CAPTURE_DESTINATIONS.PARTS, INTAKE_TIERS.PARTS],
    [CAPTURE_DESTINATIONS.RECYCLE, INTAKE_TIERS.RECYCLE],
    [CAPTURE_DESTINATIONS.INVENTORY, undefined],
    [CAPTURE_DESTINATIONS.SHOP_UNTESTED, undefined],
  ] as const)('maps %s to its physical checklist tier', (destination, tier) => {
    expect(getTierForDestination(destination)).toBe(tier)
    expect(isChecklistDestination(destination)).toBe(tier !== undefined)
  })

  it('recognises only the explicit untested publication exception', () => {
    for (const destination of CAPTURE_DESTINATION_VALUES) {
      expect(isUntestedShopDestination(destination)).toBe(
        destination === CAPTURE_DESTINATIONS.SHOP_UNTESTED,
      )
    }
  })
})
