/**
 * Tests for config/registration.ts and canton data from config/profile.ts.
 *
 * Behaviors locked:
 *   REGISTRATION_ROLE_LABELS
 *   - has German label for every registration role
 *   - specific known labels ('Kunde', 'Verkäufer', 'Techniker')
 *
 *   REGISTRATION_ROLE_DESCRIPTIONS
 *   - has non-empty description for every registration role
 *
 *   SWISS_CANTONS (from profile.ts)
 *   - is an array of 26 canton abbreviations
 *   - includes expected cantons (ZH, BE, GE)
 *
 *   CANTON_NAMES (from profile.ts)
 *   - has German name for every canton in SWISS_CANTONS
 *   - specific known mappings (ZH → Zürich, BE → Bern)
 */

import {
  REGISTRATION_ROLES,
  REGISTRATION_ROLE_LABELS,
  REGISTRATION_ROLE_DESCRIPTIONS,
} from '../registration'

import {
  SWISS_CANTONS,
  CANTON_NAMES,
} from '../profile'

// ============================================================================
// REGISTRATION_ROLE_LABELS
// ============================================================================

describe('REGISTRATION_ROLE_LABELS', () => {
  it('has German label for every registration role', () => {
    for (const role of REGISTRATION_ROLES) {
      const label = REGISTRATION_ROLE_LABELS[role]
      expect(typeof label).toBe('string')
      expect(label.length).toBeGreaterThan(0)
    }
  })

  it('returns "Kunde" for customer', () => {
    expect(REGISTRATION_ROLE_LABELS['customer']).toBe('Kunde')
  })

  it('returns "Verkäufer" for seller', () => {
    expect(REGISTRATION_ROLE_LABELS['seller']).toBe('Verkäufer')
  })

  it('returns "Techniker" for repairer', () => {
    expect(REGISTRATION_ROLE_LABELS['repairer']).toBe('Techniker')
  })
})

// ============================================================================
// REGISTRATION_ROLE_DESCRIPTIONS
// ============================================================================

describe('REGISTRATION_ROLE_DESCRIPTIONS', () => {
  it('has non-empty description for every registration role', () => {
    for (const role of REGISTRATION_ROLES) {
      const desc = REGISTRATION_ROLE_DESCRIPTIONS[role]
      expect(typeof desc).toBe('string')
      expect(desc.length).toBeGreaterThan(0)
    }
  })
})

// ============================================================================
// SWISS_CANTONS
// ============================================================================

describe('SWISS_CANTONS', () => {
  it('contains exactly 26 cantons', () => {
    expect(SWISS_CANTONS).toHaveLength(26)
  })

  it('includes ZH (Zürich)', () => {
    expect(SWISS_CANTONS).toContain('ZH')
  })

  it('includes BE (Bern)', () => {
    expect(SWISS_CANTONS).toContain('BE')
  })

  it('includes GE (Genf)', () => {
    expect(SWISS_CANTONS).toContain('GE')
  })

  it('all entries are 2-character uppercase strings', () => {
    for (const canton of SWISS_CANTONS) {
      expect(canton).toMatch(/^[A-Z]{2}$/)
    }
  })
})

// ============================================================================
// CANTON_NAMES
// ============================================================================

describe('CANTON_NAMES', () => {
  it('has a name for every canton in SWISS_CANTONS', () => {
    for (const canton of SWISS_CANTONS) {
      const name = CANTON_NAMES[canton]
      expect(typeof name).toBe('string')
      expect(name.length).toBeGreaterThan(0)
    }
  })

  it('maps ZH to "Zürich"', () => {
    expect(CANTON_NAMES['ZH']).toBe('Zürich')
  })

  it('maps BE to "Bern"', () => {
    expect(CANTON_NAMES['BE']).toBe('Bern')
  })

  it('maps GE to "Genf"', () => {
    expect(CANTON_NAMES['GE']).toBe('Genf')
  })
})
