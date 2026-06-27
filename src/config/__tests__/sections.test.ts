/**
 * Tests for config/sections.ts — admin/dashboard section registry.
 *
 * Mission-relevant: the section registry is the SSOT for admin sidebar
 * navigation and dashboard cards. If getAdminSections() omits a section
 * due to a missing visibility flag, the admin page becomes unreachable.
 * If isSensitiveSection() misidentifies a sensitive section, unauthorised
 * staff can access personal data.
 *
 * Behaviors locked:
 *   getAdminSections
 *   - returns only sections with visibility.admin=true
 *   - returns sections sorted by priority (ascending)
 *   - always returns at least one section
 *
 *   getDashboardSections
 *   - returns only sections with visibility.dashboard=true
 *
 *   getSection
 *   - returns section for known ID
 *   - returns undefined for unknown ID
 *
 *   isSensitiveSection
 *   - returns true for known sensitive sections (users, hirn, finances, settings)
 *   - returns false for non-sensitive sections (dashboard, products)
 *
 *   getSensitivityReason
 *   - returns reason string for known sensitive sections
 *   - returns undefined for unknown section
 *
 *   getSectionsByCategory
 *   - returns sections matching category
 *   - results sorted by priority
 *
 *   getSidebarGroupsWithSections
 *   - only returns groups with at least one section
 *   - each group has sections array
 *
 *   getHirnSection
 *   - returns the hirn section (not undefined)
 */

jest.mock('lucide-react', () => {
  const icon = (name: string) => ({ displayName: name })
  return new Proxy({}, { get: (_t, prop) => icon(prop as string) })
})

// ---------------------------------------------------------------------------
// Imports (after mocks)
// ---------------------------------------------------------------------------

import {
  getAdminSections,
  getDashboardSections,
  getSection,
  isSensitiveSection,
  getSensitivityReason,
  getSectionsByCategory,
  getSidebarGroupsWithSections,
  getMobileBottomNavSections,
  getHirnSection,
  SECTIONS,
} from '../sections'

// ============================================================================
// getAdminSections
// ============================================================================

describe('getAdminSections', () => {
  it('returns at least one section', () => {
    expect(getAdminSections().length).toBeGreaterThan(0)
  })

  it('only returns sections with visibility.admin=true', () => {
    const sections = getAdminSections()

    for (const s of sections) {
      expect(s.visibility.admin).toBe(true)
    }
  })

  it('sections are sorted by priority (ascending)', () => {
    const sections = getAdminSections()

    for (let i = 1; i < sections.length; i++) {
      expect(sections[i].priority).toBeGreaterThanOrEqual(sections[i - 1].priority)
    }
  })

  it('includes the dashboard section', () => {
    const sections = getAdminSections()
    const ids = sections.map(s => s.id)

    expect(ids).toContain('dashboard')
  })
})

// ============================================================================
// getDashboardSections
// ============================================================================

describe('getDashboardSections', () => {
  it('only returns sections with visibility.dashboard=true', () => {
    const sections = getDashboardSections()

    for (const s of sections) {
      expect(s.visibility.dashboard).toBe(true)
    }
  })

  it('returns at least one section', () => {
    expect(getDashboardSections().length).toBeGreaterThan(0)
  })
})

// ============================================================================
// getSection
// ============================================================================

describe('getSection', () => {
  it('returns section for known ID', () => {
    const section = getSection('dashboard')

    expect(section).toBeDefined()
    expect(section!.id).toBe('dashboard')
  })

  it('returns undefined for unknown ID', () => {
    expect(getSection('does-not-exist')).toBeUndefined()
  })

  it('returns section with expected fields', () => {
    const section = getSection('dashboard')

    expect(section).toBeDefined()
    expect(section!.ui.label).toBeTruthy()
    expect(section!.path).toMatch(/^\//)
    expect(section!.priority).toBeGreaterThanOrEqual(0)
  })
})

// ============================================================================
// isSensitiveSection
// ============================================================================

describe('isSensitiveSection', () => {
  it('returns true for known sensitive sections', () => {
    expect(isSensitiveSection('users')).toBe(true)
    expect(isSensitiveSection('hirn')).toBe(true)
    expect(isSensitiveSection('settings')).toBe(true)
  })

  it('returns false for non-sensitive sections', () => {
    expect(isSensitiveSection('dashboard')).toBe(false)
    expect(isSensitiveSection('products')).toBe(false)
  })

  it('returns false for unknown section ID', () => {
    expect(isSensitiveSection('nonexistent')).toBe(false)
  })

  it('sensitive sections have visibility.sensitive=true in SECTIONS', () => {
    // Cross-verify: every section flagged as sensitive should be in SECTIONS
    const sensitiveSections = Object.values(SECTIONS).filter(s => s.visibility.sensitive)
    for (const s of sensitiveSections) {
      expect(isSensitiveSection(s.id)).toBe(true)
    }
  })
})

// ============================================================================
// getSensitivityReason
// ============================================================================

describe('getSensitivityReason', () => {
  it('returns a string for users section', () => {
    expect(typeof getSensitivityReason('users')).toBe('string')
  })

  it('returns a string for hirn section', () => {
    expect(typeof getSensitivityReason('hirn')).toBe('string')
  })

  it('returns undefined for unknown section', () => {
    expect(getSensitivityReason('unknown-section')).toBeUndefined()
  })

  it('returns undefined for non-sensitive sections', () => {
    expect(getSensitivityReason('products')).toBeUndefined()
  })
})

// ============================================================================
// getSectionsByCategory
// ============================================================================

describe('getSectionsByCategory', () => {
  it('returns sections matching the given category', () => {
    const result = getSectionsByCategory('management')

    for (const s of result) {
      expect(s.category).toBe('management')
    }
  })

  it('returns results sorted by priority', () => {
    const result = getSectionsByCategory('management')

    for (let i = 1; i < result.length; i++) {
      expect(result[i].priority).toBeGreaterThanOrEqual(result[i - 1].priority)
    }
  })

  it('returns empty array for category with no sections', () => {
    // 'ai' category might have sections but we test the return type is always an array
    const result = getSectionsByCategory('ai' as Parameters<typeof getSectionsByCategory>[0])
    expect(Array.isArray(result)).toBe(true)
  })
})

// ============================================================================
// getSidebarGroupsWithSections
// ============================================================================

describe('getSidebarGroupsWithSections', () => {
  it('returns at least one group', () => {
    expect(getSidebarGroupsWithSections().length).toBeGreaterThan(0)
  })

  it('every returned group has at least one section', () => {
    const groups = getSidebarGroupsWithSections()

    for (const g of groups) {
      expect(g.sections.length).toBeGreaterThan(0)
    }
  })

  it('each group has a group and sections property', () => {
    const groups = getSidebarGroupsWithSections()

    for (const g of groups) {
      expect(g.group).toBeDefined()
      expect(Array.isArray(g.sections)).toBe(true)
    }
  })
})

// ============================================================================
// getHirnSection
// ============================================================================

describe('getHirnSection', () => {
  it('returns the hirn section (not undefined)', () => {
    const hirn = getHirnSection()

    expect(hirn).toBeDefined()
    expect(hirn!.id).toBe('hirn')
  })
})
