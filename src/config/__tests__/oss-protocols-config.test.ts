/**
 * Tests for open-source-registry.ts, protocols.ts, and report-status.ts.
 *
 * open-source-registry.ts: lookup functions and searchAlternatives — the
 * search is shown on the /services/open-source-solutions page. Correct
 * results matter for helping users find open-source alternatives.
 *
 * protocols.ts: getFollowUpStatusColor — null-safety and fallback to 'offen'
 * color for unknown statuses.
 */

// ============================================================================
// protocols.ts — getFollowUpStatusColor
// ============================================================================

import { getFollowUpStatusColor } from '../protocols'

describe('getFollowUpStatusColor', () => {
  it('null → offen (yellow) fallback', () => {
    expect(getFollowUpStatusColor(null)).toContain('yellow')
  })

  it('undefined → offen (yellow) fallback', () => {
    expect(getFollowUpStatusColor(undefined)).toContain('yellow')
  })

  it('"erledigt" → green classes', () => {
    const color = getFollowUpStatusColor('erledigt')
    expect(color).toContain('green')
  })

  it('"in Arbeit" → blue classes', () => {
    const color = getFollowUpStatusColor('in Arbeit')
    expect(color).toContain('blue')
  })

  it('"offen" → yellow classes', () => {
    const color = getFollowUpStatusColor('offen')
    expect(color).toContain('yellow')
  })

  it('unknown status → falls back to offen (yellow)', () => {
    expect(getFollowUpStatusColor('mystery_status')).toContain('yellow')
  })

  it('returns a non-empty string for all known statuses', () => {
    for (const status of ['erledigt', 'in Arbeit', 'offen']) {
      expect(getFollowUpStatusColor(status).length).toBeGreaterThan(0)
    }
  })
})

// ============================================================================
// open-source-registry.ts — category, alternative, and proprietary lookups
// ============================================================================

import {
  getCategoryById,
  getAlternativeById,
  getAlternativesByCategory,
  getProprietaryAppById,
  getAlternativesForApp,
  getAllAlternatives,
  getAllCategories,
  getAllProprietaryApps,
  searchAlternatives,
} from '../open-source-registry'

// ─── getCategoryById ──────────────────────────────────────────────────────────

describe('getCategoryById', () => {
  it('returns a category for known id "office"', () => {
    const cat = getCategoryById('office')
    expect(cat).not.toBeUndefined()
    expect(cat?.id).toBe('office')
  })

  it('returns category with label and icon', () => {
    const cat = getCategoryById('office')
    expect(cat?.label.length).toBeGreaterThan(0)
    expect(cat?.icon.length).toBeGreaterThan(0)
  })

  it('returns undefined for unknown id', () => {
    expect(getCategoryById('nonexistent')).toBeUndefined()
  })
})

// ─── getAlternativeById ───────────────────────────────────────────────────────

describe('getAlternativeById', () => {
  it('returns LibreOffice by id', () => {
    const alt = getAlternativeById('libreoffice')
    expect(alt).not.toBeUndefined()
    expect(alt?.name).toBe('LibreOffice')
  })

  it('returned alternative has required fields', () => {
    const alt = getAlternativeById('libreoffice')
    expect(alt).toHaveProperty('id')
    expect(alt).toHaveProperty('name')
    expect(alt).toHaveProperty('categoryId')
    expect(alt).toHaveProperty('tagline')
    expect(alt).toHaveProperty('description')
  })

  it('returns undefined for unknown id', () => {
    expect(getAlternativeById('totally-unknown-app')).toBeUndefined()
  })
})

// ─── getAlternativesByCategory ────────────────────────────────────────────────

describe('getAlternativesByCategory', () => {
  it('returns non-empty array for "office" category', () => {
    const alts = getAlternativesByCategory('office')
    expect(alts.length).toBeGreaterThan(0)
  })

  it('LibreOffice is in the office category', () => {
    const alts = getAlternativesByCategory('office')
    expect(alts.some(a => a.id === 'libreoffice')).toBe(true)
  })

  it('returns empty array for unknown category', () => {
    expect(getAlternativesByCategory('nonexistent_category')).toEqual([])
  })

  it('all returned alternatives have the correct categoryId', () => {
    const alts = getAlternativesByCategory('office')
    for (const alt of alts) {
      expect(alt.categoryId).toBe('office')
    }
  })
})

// ─── getProprietaryAppById ────────────────────────────────────────────────────

describe('getProprietaryAppById', () => {
  it('returns Microsoft Office (ms-office)', () => {
    const app = getProprietaryAppById('ms-office')
    expect(app).not.toBeUndefined()
    expect(app?.name).toContain('Microsoft')
  })

  it('returned app has id, name, categoryId', () => {
    const app = getProprietaryAppById('ms-office')
    expect(app).toHaveProperty('id')
    expect(app).toHaveProperty('name')
    expect(app).toHaveProperty('categoryId')
  })

  it('returns undefined for unknown id', () => {
    expect(getProprietaryAppById('ghost-app')).toBeUndefined()
  })
})

// ─── getAlternativesForApp ────────────────────────────────────────────────────

describe('getAlternativesForApp', () => {
  it('returns alternatives for ms-office (e.g. LibreOffice)', () => {
    const alts = getAlternativesForApp('ms-office')
    expect(alts.length).toBeGreaterThan(0)
    expect(alts.some(a => a.id === 'libreoffice')).toBe(true)
  })

  it('returns empty array for unknown app', () => {
    expect(getAlternativesForApp('nonexistent-app')).toEqual([])
  })

  it('each result replaces the given app', () => {
    const alts = getAlternativesForApp('ms-office')
    for (const alt of alts) {
      expect(alt.replaces.some(r => r.appId === 'ms-office')).toBe(true)
    }
  })
})

// ─── getAllAlternatives ────────────────────────────────────────────────────────

describe('getAllAlternatives', () => {
  it('returns a non-empty array', () => {
    expect(getAllAlternatives().length).toBeGreaterThan(0)
  })

  it('each entry has id, name, categoryId', () => {
    for (const alt of getAllAlternatives().slice(0, 5)) {
      expect(alt).toHaveProperty('id')
      expect(alt).toHaveProperty('name')
      expect(alt).toHaveProperty('categoryId')
    }
  })
})

// ─── getAllCategories ─────────────────────────────────────────────────────────

describe('getAllCategories', () => {
  it('returns a non-empty array', () => {
    expect(getAllCategories().length).toBeGreaterThan(0)
  })

  it('includes "office" category', () => {
    expect(getAllCategories().some(c => c.id === 'office')).toBe(true)
  })

  it('categories are sorted by order (ascending)', () => {
    const cats = getAllCategories()
    for (let i = 1; i < cats.length; i++) {
      expect(cats[i].order).toBeGreaterThanOrEqual(cats[i - 1].order)
    }
  })

  it('each category has id, label, icon, order', () => {
    for (const cat of getAllCategories()) {
      expect(cat).toHaveProperty('id')
      expect(cat).toHaveProperty('label')
      expect(cat).toHaveProperty('icon')
      expect(cat).toHaveProperty('order')
    }
  })
})

// ─── getAllProprietaryApps ────────────────────────────────────────────────────

describe('getAllProprietaryApps', () => {
  it('returns a non-empty array', () => {
    expect(getAllProprietaryApps().length).toBeGreaterThan(0)
  })

  it('includes ms-office', () => {
    expect(getAllProprietaryApps().some(a => a.id === 'ms-office')).toBe(true)
  })
})

// ─── searchAlternatives ───────────────────────────────────────────────────────

describe('searchAlternatives', () => {
  it('empty string → returns all alternatives', () => {
    const all = getAllAlternatives()
    const results = searchAlternatives('')
    expect(results.length).toBe(all.length)
  })

  it('whitespace-only → returns all alternatives', () => {
    const all = getAllAlternatives()
    expect(searchAlternatives('   ').length).toBe(all.length)
  })

  it('"LibreOffice" → finds LibreOffice by name', () => {
    const results = searchAlternatives('LibreOffice')
    expect(results.some(r => r.id === 'libreoffice')).toBe(true)
  })

  it('search is case-insensitive', () => {
    const lower = searchAlternatives('libreoffice')
    const upper = searchAlternatives('LIBREOFFICE')
    expect(lower.length).toBe(upper.length)
    expect(lower.length).toBeGreaterThan(0)
  })

  it('no match → returns empty array', () => {
    const results = searchAlternatives('xyzzy-no-match-guaranteed')
    expect(results).toEqual([])
  })

  it('partial match works — "libre" finds LibreOffice', () => {
    const results = searchAlternatives('libre')
    expect(results.some(r => r.id === 'libreoffice')).toBe(true)
  })

  it('returns only alternatives matching the query (not all)', () => {
    const all = getAllAlternatives()
    const results = searchAlternatives('libreoffice')
    expect(results.length).toBeLessThan(all.length)
  })

  it('results array is a subset of all alternatives', () => {
    const allIds = new Set(getAllAlternatives().map(a => a.id))
    for (const result of searchAlternatives('linux')) {
      expect(allIds.has(result.id)).toBe(true)
    }
  })
})

// ============================================================================
// report-status.ts — getReportStatusLabel
// ============================================================================

import {
  getReportStatusLabel,
  REPORT_STATUS,
} from '../report-status'

describe('getReportStatusLabel', () => {
  it('pending → "Ausstehend"', () => {
    expect(getReportStatusLabel(REPORT_STATUS.PENDING)).toBe('Ausstehend')
  })

  it('reviewed → "Überprüft" (umlaut check)', () => {
    expect(getReportStatusLabel(REPORT_STATUS.REVIEWED)).toBe('Überprüft')
  })

  it('resolved → "Gelöst" (umlaut check)', () => {
    expect(getReportStatusLabel(REPORT_STATUS.RESOLVED)).toBe('Gelöst')
  })

  it('archived → "Archiviert"', () => {
    expect(getReportStatusLabel(REPORT_STATUS.ARCHIVED)).toBe('Archiviert')
  })

  it('non-empty label for all known statuses', () => {
    for (const status of Object.values(REPORT_STATUS)) {
      expect(getReportStatusLabel(status).length).toBeGreaterThan(0)
    }
  })

  it('unknown → raw string fallback', () => {
    expect(getReportStatusLabel('ghost_report')).toBe('ghost_report')
  })
})
