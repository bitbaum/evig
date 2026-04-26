/**
 * Tests for admin edit-history utilities (lib/admin/edit-utils.ts).
 *
 * These power the audit trail when admins edit workshop proposals or
 * blog submissions before approval. Stored as a JSONB array of
 * `EditHistoryEntry` rows on the underlying record.
 *
 * Correctness guarantees we lock here:
 *   1. createEditSnapshot captures ONLY fields actually changing (deep
 *      equality skips no-op updates so the audit trail isn't bloated)
 *   2. appendEditHistory tolerates null/undefined existing history
 *      (newly-created records have no prior snapshot)
 *   3. formatEditHistory uses field labels when present, falls back
 *      to raw field names otherwise
 *   4. getLastEditor returns null for empty/missing history
 *
 * Mock the logger to silence the info-log inside createEditSnapshot.
 */

jest.mock('@/lib/logger', () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() },
}))

import {
  createEditSnapshot,
  appendEditHistory,
  formatEditHistory,
  getLastEditor,
  type EditHistoryEntry,
} from '../edit-utils'

// ============================================================================
// createEditSnapshot
// ============================================================================

describe('createEditSnapshot', () => {
  it('captures previous values only for fields that actually changed', () => {
    const entry = createEditSnapshot(
      { title: 'Old', description: 'Same', status: 'pending' },
      { title: 'New', description: 'Same', status: 'pending' },
      'editor-1',
      'Anna',
    )
    expect(entry.fields_changed).toEqual(['title'])
    expect(entry.snapshot).toEqual({ title: 'Old' })
  })

  it('captures multiple changed fields', () => {
    const entry = createEditSnapshot(
      { title: 'Old', count: 1 },
      { title: 'New', count: 2 },
      'editor-1',
      'Anna',
    )
    expect(entry.fields_changed.sort()).toEqual(['count', 'title'])
    expect(entry.snapshot).toEqual({ title: 'Old', count: 1 })
  })

  it('returns an empty snapshot when nothing changed (no-op edit)', () => {
    const entry = createEditSnapshot(
      { title: 'Same' },
      { title: 'Same' },
      'editor-1',
      'Anna',
    )
    expect(entry.fields_changed).toEqual([])
    expect(entry.snapshot).toEqual({})
  })

  it('treats array order changes as a change', () => {
    const entry = createEditSnapshot(
      { tags: ['a', 'b'] },
      { tags: ['b', 'a'] },
      'editor-1',
      'Anna',
    )
    expect(entry.fields_changed).toEqual(['tags'])
    expect(entry.snapshot.tags).toEqual(['a', 'b'])
  })

  it('treats equal arrays as no change (deep equality)', () => {
    const entry = createEditSnapshot(
      { tags: ['a', 'b'] },
      { tags: ['a', 'b'] },
      'editor-1',
      'Anna',
    )
    expect(entry.fields_changed).toEqual([])
  })

  it('treats deeply equal nested objects as no change', () => {
    const entry = createEditSnapshot(
      { meta: { foo: 1, bar: { x: 2 } } },
      { meta: { foo: 1, bar: { x: 2 } } },
      'editor-1',
      'Anna',
    )
    expect(entry.fields_changed).toEqual([])
  })

  it('detects a change in a nested object value', () => {
    const entry = createEditSnapshot(
      { meta: { foo: 1 } },
      { meta: { foo: 2 } },
      'editor-1',
      'Anna',
    )
    expect(entry.fields_changed).toEqual(['meta'])
    expect(entry.snapshot.meta).toEqual({ foo: 1 })
  })

  it('treats a → null transition as a change', () => {
    const entry = createEditSnapshot(
      { description: 'Hi' },
      { description: null },
      'editor-1',
      'Anna',
    )
    expect(entry.fields_changed).toEqual(['description'])
    expect(entry.snapshot.description).toBe('Hi')
  })

  it('treats null → null as no change', () => {
    const entry = createEditSnapshot(
      { description: null },
      { description: null },
      'editor-1',
      'Anna',
    )
    expect(entry.fields_changed).toEqual([])
  })

  it('records editor identity and a valid ISO timestamp', () => {
    const before = Date.now()
    const entry = createEditSnapshot(
      { title: 'Old' },
      { title: 'New' },
      'editor-uuid-42',
      'Anna Müller',
    )
    const after = Date.now()
    expect(entry.editor_id).toBe('editor-uuid-42')
    expect(entry.editor_name).toBe('Anna Müller')
    const ts = new Date(entry.timestamp).getTime()
    expect(ts).toBeGreaterThanOrEqual(before)
    expect(ts).toBeLessThanOrEqual(after)
  })

  it('only inspects fields present in updatedFields (ignores unchanged extras on currentRecord)', () => {
    const entry = createEditSnapshot(
      { title: 'Old', secret: 'hidden' }, // currentRecord has extra field
      { title: 'New' },                    // but only title is being updated
      'editor-1',
      'Anna',
    )
    expect(entry.fields_changed).toEqual(['title'])
    expect(entry.snapshot).toEqual({ title: 'Old' })
    expect(entry.snapshot).not.toHaveProperty('secret')
  })
})

// ============================================================================
// appendEditHistory
// ============================================================================

describe('appendEditHistory', () => {
  const newEntry: EditHistoryEntry = {
    timestamp: '2026-01-01T00:00:00Z',
    editor_id: 'e1',
    editor_name: 'Anna',
    fields_changed: ['title'],
    snapshot: { title: 'Old' },
  }

  it('appends to an existing history array', () => {
    const existing: EditHistoryEntry[] = [{ ...newEntry, editor_id: 'e0', editor_name: 'Bo' }]
    const result = appendEditHistory(existing, newEntry)
    expect(result).toHaveLength(2)
    expect(result[0].editor_id).toBe('e0')
    expect(result[1].editor_id).toBe('e1')
  })

  it('returns a single-entry array when existing history is null', () => {
    const result = appendEditHistory(null, newEntry)
    expect(result).toEqual([newEntry])
  })

  it('returns a single-entry array when existing history is undefined', () => {
    const result = appendEditHistory(undefined, newEntry)
    expect(result).toEqual([newEntry])
  })

  it('treats non-array existing history as empty (defensive)', () => {
    const result = appendEditHistory('not-an-array' as unknown as EditHistoryEntry[], newEntry)
    expect(result).toEqual([newEntry])
  })

  it('does not mutate the existing array', () => {
    const existing: EditHistoryEntry[] = [{ ...newEntry, editor_id: 'e0' }]
    const before = existing.length
    appendEditHistory(existing, newEntry)
    expect(existing.length).toBe(before)
  })
})

// ============================================================================
// formatEditHistory
// ============================================================================

describe('formatEditHistory', () => {
  const entries: EditHistoryEntry[] = [
    {
      timestamp: '2026-03-15T14:30:00Z',
      editor_id: 'e1',
      editor_name: 'Anna',
      fields_changed: ['title', 'description'],
      snapshot: { title: 'Old', description: 'Old desc' },
    },
  ]

  it('uses field labels when provided', () => {
    const lines = formatEditHistory(entries, { title: 'Titel', description: 'Beschreibung' })
    expect(lines[0]).toContain('Titel')
    expect(lines[0]).toContain('Beschreibung')
    expect(lines[0]).toContain('Anna')
  })

  it('falls back to raw field name when label is missing', () => {
    const lines = formatEditHistory(entries, { title: 'Titel' }) // no 'description' label
    expect(lines[0]).toContain('Titel')
    expect(lines[0]).toContain('description') // raw key as fallback
  })

  it('returns one line per history entry', () => {
    const twoEntries = [...entries, { ...entries[0], editor_name: 'Bo' }]
    const lines = formatEditHistory(twoEntries, {})
    expect(lines).toHaveLength(2)
  })

  it('returns [] for empty history', () => {
    expect(formatEditHistory([], {})).toEqual([])
  })
})

// ============================================================================
// getLastEditor
// ============================================================================

describe('getLastEditor', () => {
  it('returns the name + timestamp of the last entry', () => {
    const history: EditHistoryEntry[] = [
      { timestamp: '2026-01-01T00:00:00Z', editor_id: 'e1', editor_name: 'Anna', fields_changed: [], snapshot: {} },
      { timestamp: '2026-02-01T00:00:00Z', editor_id: 'e2', editor_name: 'Bo', fields_changed: [], snapshot: {} },
    ]
    expect(getLastEditor(history)).toEqual({
      name: 'Bo',
      timestamp: '2026-02-01T00:00:00Z',
    })
  })

  it('returns null for empty history', () => {
    expect(getLastEditor([])).toBeNull()
  })

  it('returns null for null history', () => {
    expect(getLastEditor(null)).toBeNull()
  })

  it('returns null for undefined history', () => {
    expect(getLastEditor(undefined)).toBeNull()
  })

  it('returns null for non-array (defensive)', () => {
    expect(getLastEditor('not-array' as unknown as EditHistoryEntry[])).toBeNull()
  })
})
