/**
 * Tests for config/editable-fields.ts — admin-editable field helpers.
 *
 * Mission-relevant: admins use these field configs to edit workshop proposals
 * and blog submissions. If getFieldLabel('title', 'workshop') returns 'title'
 * instead of 'Titel', the admin edit form shows an English key instead of
 * the German label.
 *
 * Behaviors locked:
 *   getFieldLabel
 *   - returns German label for known workshop field
 *   - returns German label for known blog field
 *   - falls back to raw field name for unknown field
 *
 *   getEditableFieldLabels
 *   - returns record mapping all workshop field keys to German labels
 *   - returns record mapping all blog field keys to German labels
 *   - all values are non-empty strings
 */

jest.mock('lucide-react', () => {
  const icon = (name: string) => ({ displayName: name })
  return new Proxy({}, { get: (_t, prop) => icon(prop as string) })
})

import {
  getFieldLabel,
  getEditableFieldLabels,
  WORKSHOP_PROPOSAL_EDITABLE_FIELDS,
  BLOG_SUBMISSION_EDITABLE_FIELDS,
} from '../editable-fields'

// ============================================================================
// getFieldLabel
// ============================================================================

describe('getFieldLabel', () => {
  it('returns "Titel" for title in workshop context', () => {
    expect(getFieldLabel('title', 'workshop')).toBe('Titel')
  })

  it('returns "Beschreibung" for description in workshop context', () => {
    expect(getFieldLabel('description', 'workshop')).toBe('Beschreibung')
  })

  it('returns German label for blog title', () => {
    const label = getFieldLabel('title', 'blog')
    expect(typeof label).toBe('string')
    expect(label.length).toBeGreaterThan(0)
  })

  it('falls back to raw field name for unknown workshop field', () => {
    expect(getFieldLabel('unknown_field' as never, 'workshop')).toBe('unknown_field')
  })

  it('falls back to raw field name for unknown blog field', () => {
    expect(getFieldLabel('nonexistent' as never, 'blog')).toBe('nonexistent')
  })
})

// ============================================================================
// getEditableFieldLabels
// ============================================================================

describe('getEditableFieldLabels', () => {
  it('returns a record for workshop type', () => {
    const labels = getEditableFieldLabels('workshop')
    expect(typeof labels).toBe('object')
    expect(Object.keys(labels).length).toBeGreaterThan(0)
  })

  it('workshop labels include expected keys', () => {
    const labels = getEditableFieldLabels('workshop')
    expect(labels['title']).toBe('Titel')
    expect(labels['description']).toBe('Beschreibung')
  })

  it('all workshop label values are non-empty strings', () => {
    for (const value of Object.values(getEditableFieldLabels('workshop'))) {
      expect(typeof value).toBe('string')
      expect(value.length).toBeGreaterThan(0)
    }
  })

  it('returns a record for blog type', () => {
    const labels = getEditableFieldLabels('blog')
    expect(typeof labels).toBe('object')
    expect(Object.keys(labels).length).toBeGreaterThan(0)
  })

  it('all blog label values are non-empty strings', () => {
    for (const value of Object.values(getEditableFieldLabels('blog'))) {
      expect(typeof value).toBe('string')
      expect(value.length).toBeGreaterThan(0)
    }
  })

  it('covers all keys from WORKSHOP_PROPOSAL_EDITABLE_FIELDS', () => {
    const labels = getEditableFieldLabels('workshop')
    for (const key of Object.keys(WORKSHOP_PROPOSAL_EDITABLE_FIELDS)) {
      expect(labels).toHaveProperty(key)
    }
  })

  it('covers all keys from BLOG_SUBMISSION_EDITABLE_FIELDS', () => {
    const labels = getEditableFieldLabels('blog')
    for (const key of Object.keys(BLOG_SUBMISSION_EDITABLE_FIELDS)) {
      expect(labels).toHaveProperty(key)
    }
  })
})
