/**
 * Tests for services/presentation.ts — service icon/hero/feature/pricing config.
 *
 * Mission-relevant: getServicePresentation and getServicePricing drive what
 * staff and visitors see on the service detail pages. If getServicePresentation
 * silently returns undefined for a known slug (e.g., slug mismatch), the detail
 * page renders blank. If getServicePricing falls through to formatPriceCents
 * when an override exists, prices show the wrong value.
 *
 * Behaviors locked:
 *   getServicePresentation
 *   - returns specific config for known slugs (computer-repair-upgrades, data-recovery-transfer, etc.)
 *   - falls back to defaultPresentation for unknown slug
 *   - returned object contains icon, hero, and features
 *
 *   getServicePricing
 *   - uses pricingOverride.base when present (does NOT call formatPriceCents)
 *   - falls back to formatPriceCents(priceCents) when no override
 *   - returns details array (may be empty for fallback)
 */

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

// Lucide icons are React components — mock them as plain strings to keep tests lightweight
jest.mock('lucide-react', () => {
  const icon = (name: string) => ({ displayName: name })
  return new Proxy({}, { get: (_t, prop) => icon(prop as string) })
})

const mockFormatPriceCents = jest.fn((cents: number | null) =>
  cents === null ? 'Auf Anfrage' : `CHF ${(cents / 100).toFixed(2)}`
)

jest.mock('@/config/marketplace', () => ({
  formatPriceCents: (...args: unknown[]) => mockFormatPriceCents(...args as [number | null]),
}))

// ---------------------------------------------------------------------------
// Imports (after mocks)
// ---------------------------------------------------------------------------

import { getServicePresentation, getServicePricing, servicePresentation, defaultPresentation } from '../presentation'

// ---------------------------------------------------------------------------
// Setup
// ---------------------------------------------------------------------------

beforeEach(() => {
  jest.clearAllMocks()
})

// ============================================================================
// getServicePresentation
// ============================================================================

describe('getServicePresentation', () => {
  it('returns config for computer-repair-upgrades', () => {
    const result = getServicePresentation('computer-repair-upgrades')

    expect(result).not.toBe(defaultPresentation)
    expect(result.hero.title).toContain('Computerreparatur')
    expect(result.features.length).toBeGreaterThan(0)
    expect(result.icon).toBeDefined()
  })

  it('returns config for data-recovery-transfer', () => {
    const result = getServicePresentation('data-recovery-transfer')

    expect(result).not.toBe(defaultPresentation)
    expect(result.hero.title).toContain('Datenrettung')
  })

  it('returns config for hardware-recycling', () => {
    const result = getServicePresentation('hardware-recycling')

    expect(result).not.toBe(defaultPresentation)
    expect(result.hero.title).toContain('Hardware-Recycling')
  })

  it('returns config for linux-open-source', () => {
    const result = getServicePresentation('linux-open-source')

    expect(result).not.toBe(defaultPresentation)
    expect(result.hero.title).toContain('Linux')
  })

  it('returns config for web-design-development', () => {
    const result = getServicePresentation('web-design-development')

    expect(result).not.toBe(defaultPresentation)
    expect(result.hero.title).toContain('Webdesign')
  })

  it('returns config for consultation', () => {
    const result = getServicePresentation('consultation')

    expect(result).not.toBe(defaultPresentation)
    expect(result.hero.title).toContain('Beratung')
  })

  it('returns config for custom-build', () => {
    const result = getServicePresentation('custom-build')

    expect(result).not.toBe(defaultPresentation)
    expect(result.hero.title).toContain('Massgeschneiderter PC')
  })

  it('falls back to defaultPresentation for unknown slug', () => {
    const result = getServicePresentation('this-does-not-exist')

    expect(result).toBe(defaultPresentation)
    expect(result.hero.title).toBe('Service')
    expect(result.features).toEqual([])
  })

  it('defaultPresentation has icon, hero, and empty features', () => {
    expect(defaultPresentation.icon).toBeDefined()
    expect(defaultPresentation.hero.title).toBeDefined()
    expect(defaultPresentation.hero.subtitle).toBeDefined()
    expect(Array.isArray(defaultPresentation.features)).toBe(true)
  })

  it('all known service slugs have icon, hero, and features', () => {
    for (const [slug, config] of Object.entries(servicePresentation)) {
      expect(config.icon).toBeDefined()
      expect(config.hero.title).toBeTruthy()
      expect(Array.isArray(config.features)).toBe(true)
      expect(config.features.length).toBeGreaterThan(0)
    }
  })
})

// ============================================================================
// getServicePricing
// ============================================================================

describe('getServicePricing', () => {
  it('returns pricingOverride.base when the service has one (does not call formatPriceCents)', () => {
    const result = getServicePricing('computer-repair-upgrades', 7000)

    expect(result.base).toBe('CHF 70/Stunde + Teile')
    expect(mockFormatPriceCents).not.toHaveBeenCalled()
  })

  it('pricingOverride details are non-empty for computer-repair-upgrades', () => {
    const result = getServicePricing('computer-repair-upgrades', null)

    expect(result.details.length).toBeGreaterThan(0)
  })

  it('falls back to formatPriceCents when no pricingOverride', () => {
    // 'consultation' has no pricingOverride
    mockFormatPriceCents.mockReturnValueOnce('CHF 70.00')

    const result = getServicePricing('consultation', 7000)

    expect(mockFormatPriceCents).toHaveBeenCalledWith(7000)
    expect(result.base).toBe('CHF 70.00')
    expect(result.details).toEqual([])
  })

  it('passes null priceCents to formatPriceCents for free/on-request services', () => {
    mockFormatPriceCents.mockReturnValueOnce('Auf Anfrage')

    const result = getServicePricing('consultation', null)

    expect(mockFormatPriceCents).toHaveBeenCalledWith(null)
    expect(result.base).toBe('Auf Anfrage')
  })

  it('unknown slug falls through to formatPriceCents (no override)', () => {
    mockFormatPriceCents.mockReturnValueOnce('CHF 50.00')

    const result = getServicePricing('unknown-service', 5000)

    expect(mockFormatPriceCents).toHaveBeenCalledWith(5000)
    expect(result.base).toBe('CHF 50.00')
  })

  it('hardware-recycling override shows "Kostenlos"', () => {
    const result = getServicePricing('hardware-recycling', null)

    expect(result.base).toBe('Kostenlos')
    expect(mockFormatPriceCents).not.toHaveBeenCalled()
  })
})
