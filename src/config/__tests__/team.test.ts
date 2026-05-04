/**
 * Tests for config/team.ts — team member label and color helpers.
 *
 * Mission-relevant: employment type and department badges appear on the
 * admin team page. If getEmploymentTypeLabel(null) returns 'null' instead
 * of 'Unbekannt', staff profiles show a broken badge. getDepartmentLabel
 * drives the department filter — a wrong label breaks filtering.
 *
 * Behaviors locked:
 *   getEmploymentTypeLabel
 *   - returns German label for known type
 *   - returns 'Unbekannt' for null/undefined
 *   - falls back to raw value for unknown type
 *
 *   getDepartmentLabel
 *   - returns German label for known department
 *   - returns 'Nicht zugewiesen' for null/undefined
 *   - falls back to raw value for unknown department
 *
 *   getEmploymentTypeColor
 *   - returns color class for known type
 *   - returns gray fallback for null/unknown
 *
 *   getDepartmentColor
 *   - returns color class for known department
 *   - returns gray fallback for null/unknown
 */

import {
  getEmploymentTypeLabel,
  getDepartmentLabel,
  getEmploymentTypeColor,
  getDepartmentColor,
  EMPLOYMENT_TYPES,
  DEPARTMENTS,
} from '../team'

// ============================================================================
// getEmploymentTypeLabel
// ============================================================================

describe('getEmploymentTypeLabel', () => {
  it('returns "Angestellte/r" for employee', () => {
    expect(getEmploymentTypeLabel(EMPLOYMENT_TYPES.EMPLOYEE)).toBe('Angestellte/r')
  })

  it('returns "Freiwillige/r" for volunteer', () => {
    expect(getEmploymentTypeLabel(EMPLOYMENT_TYPES.VOLUNTEER)).toBe('Freiwillige/r')
  })

  it('returns "Praktikant/in" for intern', () => {
    expect(getEmploymentTypeLabel(EMPLOYMENT_TYPES.INTERN)).toBe('Praktikant/in')
  })

  it('returns "Auftragnehmer/in" for contractor', () => {
    expect(getEmploymentTypeLabel(EMPLOYMENT_TYPES.CONTRACTOR)).toBe('Auftragnehmer/in')
  })

  it('returns "Unbekannt" for null', () => {
    expect(getEmploymentTypeLabel(null)).toBe('Unbekannt')
  })

  it('returns "Unbekannt" for undefined', () => {
    expect(getEmploymentTypeLabel(undefined)).toBe('Unbekannt')
  })

  it('falls back to raw value for unknown type', () => {
    expect(getEmploymentTypeLabel('freelancer')).toBe('freelancer')
  })
})

// ============================================================================
// getDepartmentLabel
// ============================================================================

describe('getDepartmentLabel', () => {
  it('returns "IT & Technik" for IT', () => {
    expect(getDepartmentLabel(DEPARTMENTS.IT)).toBe('IT & Technik')
  })

  it('returns "Werkstatt & Reparatur" for Werkstatt', () => {
    expect(getDepartmentLabel(DEPARTMENTS.WERKSTATT)).toBe('Werkstatt & Reparatur')
  })

  it('returns "Bildung & Workshops" for Bildung', () => {
    expect(getDepartmentLabel(DEPARTMENTS.BILDUNG)).toBe('Bildung & Workshops')
  })

  it('returns "Nicht zugewiesen" for null', () => {
    expect(getDepartmentLabel(null)).toBe('Nicht zugewiesen')
  })

  it('returns "Nicht zugewiesen" for undefined', () => {
    expect(getDepartmentLabel(undefined)).toBe('Nicht zugewiesen')
  })

  it('falls back to raw value for unknown department', () => {
    expect(getDepartmentLabel('Buchhaltung')).toBe('Buchhaltung')
  })
})

// ============================================================================
// getEmploymentTypeColor
// ============================================================================

describe('getEmploymentTypeColor', () => {
  it('returns blue class for employee', () => {
    expect(getEmploymentTypeColor(EMPLOYMENT_TYPES.EMPLOYEE)).toContain('info')
  })

  it('returns green class for volunteer', () => {
    expect(getEmploymentTypeColor(EMPLOYMENT_TYPES.VOLUNTEER)).toContain('primary')
  })

  it('returns gray fallback for null', () => {
    expect(getEmploymentTypeColor(null)).toContain('neutral')
  })

  it('returns gray fallback for unknown type', () => {
    expect(getEmploymentTypeColor('unknown_type')).toContain('neutral')
  })
})

// ============================================================================
// getDepartmentColor
// ============================================================================

describe('getDepartmentColor', () => {
  it('returns indigo class for IT', () => {
    expect(getDepartmentColor(DEPARTMENTS.IT)).toContain('indigo')
  })

  it('returns amber class for Werkstatt', () => {
    expect(getDepartmentColor(DEPARTMENTS.WERKSTATT)).toContain('warning')
  })

  it('returns gray fallback for null', () => {
    expect(getDepartmentColor(null)).toContain('neutral')
  })

  it('returns gray fallback for unknown department', () => {
    expect(getDepartmentColor('unknown_dept')).toContain('neutral')
  })
})
