/**
 * Tests for config/service-icons.ts — icon lookup helpers.
 *
 * Mission-relevant: admins select service icons from a picker driven by
 * SERVICE_ICONS. If getIconByName returns the wrong fallback (e.g., undefined
 * instead of Wrench), the service card renders a broken icon. If isValidIconName
 * returns false for a saved icon name, the picker loses its selection.
 *
 * Behaviors locked:
 *   getIconByName
 *   - returns Wrench for null input
 *   - returns Wrench for unknown icon name
 *   - returns the matching icon for a known icon name
 *
 *   getIconLabel
 *   - returns 'Werkzeug' for null input
 *   - returns 'Unbekannt' for unknown icon name
 *   - returns the German label for a known icon name
 *
 *   getIconNames
 *   - returns an array of strings
 *   - includes all expected icon names
 *   - count matches SERVICE_ICONS size
 *
 *   isValidIconName
 *   - returns true for known icon names
 *   - returns false for unknown names
 */

jest.mock('lucide-react', () => {
  const icon = (name: string) => ({ displayName: name })
  return new Proxy({}, { get: (_t, prop) => icon(prop as string) })
})

import {
  getIconByName,
  getIconLabel,
  getIconNames,
  isValidIconName,
  SERVICE_ICONS,
} from '../service-icons'

// ============================================================================
// getIconByName
// ============================================================================

describe('getIconByName', () => {
  it('returns Wrench for null input', () => {
    const result = getIconByName(null)
    // The Wrench mock has displayName 'Wrench'
    expect((result as unknown as { displayName: string }).displayName).toBe('Wrench')
  })

  it('returns Wrench for empty string', () => {
    const result = getIconByName('')
    expect((result as unknown as { displayName: string }).displayName).toBe('Wrench')
  })

  it('returns Wrench for unknown icon name', () => {
    const result = getIconByName('NonExistentIcon')
    expect((result as unknown as { displayName: string }).displayName).toBe('Wrench')
  })

  it('returns the matching icon for a known icon name', () => {
    const result = getIconByName('HardDrive')
    expect((result as unknown as { displayName: string }).displayName).toBe('HardDrive')
  })

  it('returns Server icon for "Server"', () => {
    const result = getIconByName('Server')
    expect((result as unknown as { displayName: string }).displayName).toBe('Server')
  })

  it('returns Laptop icon for "Laptop"', () => {
    const result = getIconByName('Laptop')
    expect((result as unknown as { displayName: string }).displayName).toBe('Laptop')
  })

  it('returns the same reference as SERVICE_ICONS entry', () => {
    const result = getIconByName('Monitor')
    expect(result).toBe(SERVICE_ICONS['Monitor'].icon)
  })
})

// ============================================================================
// getIconLabel
// ============================================================================

describe('getIconLabel', () => {
  it('returns "Werkzeug" for null input', () => {
    expect(getIconLabel(null)).toBe('Werkzeug')
  })

  it('returns "Werkzeug" for empty string', () => {
    expect(getIconLabel('')).toBe('Werkzeug')
  })

  it('returns "Unbekannt" for unknown icon name', () => {
    expect(getIconLabel('SomeFakeIcon')).toBe('Unbekannt')
  })

  it('returns "Festplatte" for "HardDrive"', () => {
    expect(getIconLabel('HardDrive')).toBe('Festplatte')
  })

  it('returns "Laptop" for "Laptop"', () => {
    expect(getIconLabel('Laptop')).toBe('Laptop')
  })

  it('returns "Werkzeug/Reparatur" for "Wrench"', () => {
    expect(getIconLabel('Wrench')).toBe('Werkzeug/Reparatur')
  })

  it('returns "Sicherheit" for "Shield"', () => {
    expect(getIconLabel('Shield')).toBe('Sicherheit')
  })
})

// ============================================================================
// getIconNames
// ============================================================================

describe('getIconNames', () => {
  it('returns an array', () => {
    expect(Array.isArray(getIconNames())).toBe(true)
  })

  it('count matches SERVICE_ICONS entry count', () => {
    expect(getIconNames().length).toBe(Object.keys(SERVICE_ICONS).length)
  })

  it('includes "Wrench"', () => {
    expect(getIconNames()).toContain('Wrench')
  })

  it('includes "HardDrive"', () => {
    expect(getIconNames()).toContain('HardDrive')
  })

  it('includes "Shield"', () => {
    expect(getIconNames()).toContain('Shield')
  })

  it('all entries are non-empty strings', () => {
    for (const name of getIconNames()) {
      expect(typeof name).toBe('string')
      expect(name.length).toBeGreaterThan(0)
    }
  })
})

// ============================================================================
// isValidIconName
// ============================================================================

describe('isValidIconName', () => {
  it('returns true for "Wrench"', () => {
    expect(isValidIconName('Wrench')).toBe(true)
  })

  it('returns true for "HardDrive"', () => {
    expect(isValidIconName('HardDrive')).toBe(true)
  })

  it('returns true for all names in getIconNames()', () => {
    for (const name of getIconNames()) {
      expect(isValidIconName(name)).toBe(true)
    }
  })

  it('returns false for empty string', () => {
    expect(isValidIconName('')).toBe(false)
  })

  it('returns false for unknown name', () => {
    expect(isValidIconName('FakeIconXYZ')).toBe(false)
  })

  it('returns false for lowercase version of a valid name', () => {
    // Keys are PascalCase — case-sensitive lookup
    expect(isValidIconName('wrench')).toBe(false)
  })
})
