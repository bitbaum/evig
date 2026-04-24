/**
 * Tests for pure JSON helper functions from decisions-crud.ts
 *
 * asArray and asObject are the defensive wrappers around Postgres JSONB
 * columns — they prevent crashes when the DB returns unexpected shapes.
 * Correctness here determines whether decision options and quorum configs
 * are correctly parsed throughout the decisions feature.
 */

import { asArray, asObject } from '../decisions-crud'

// ============================================================================
// asArray
// ============================================================================

describe('asArray', () => {
  it('returns the value when it is already an array', () => {
    const input = [1, 2, 3]
    expect(asArray(input, [])).toBe(input)
  })

  it('returns the value for an array of objects', () => {
    const input = [{ id: 'a', label: 'Option A' }]
    expect(asArray(input, [])).toEqual(input)
  })

  it('returns fallback for null', () => {
    expect(asArray(null, ['fallback'])).toEqual(['fallback'])
  })

  it('returns fallback for undefined', () => {
    expect(asArray(undefined, ['fallback'])).toEqual(['fallback'])
  })

  it('returns fallback for a plain object', () => {
    expect(asArray({ key: 'value' }, [])).toEqual([])
  })

  it('returns fallback for a string', () => {
    expect(asArray('not an array', [])).toEqual([])
  })

  it('returns fallback for a number', () => {
    expect(asArray(42, [])).toEqual([])
  })

  it('returns fallback for a boolean', () => {
    expect(asArray(true, [])).toEqual([])
  })

  it('returns an empty array when value is an empty array', () => {
    expect(asArray([], ['fallback'])).toEqual([])
  })

  it('preserves the fallback reference when returning it', () => {
    const fallback = ['a', 'b']
    const result = asArray(null, fallback)
    expect(result).toBe(fallback)
  })
})

// ============================================================================
// asObject
// ============================================================================

describe('asObject', () => {
  it('returns the value when it is a plain object', () => {
    const input = { type: 'percentage', value: 50 }
    expect(asObject(input, {})).toBe(input)
  })

  it('returns fallback for null', () => {
    const fallback = { type: 'percentage', value: 50 }
    expect(asObject(null, fallback)).toBe(fallback)
  })

  it('returns fallback for undefined', () => {
    const fallback = { type: 'percentage', value: 50 }
    expect(asObject(undefined, fallback)).toBe(fallback)
  })

  it('returns fallback for an array (arrays are objects in JS but not plain objects)', () => {
    const fallback = { type: 'absolute', value: 3 }
    expect(asObject(['a', 'b'], fallback)).toBe(fallback)
  })

  it('returns fallback for a string', () => {
    const fallback = { type: 'percentage', value: 50 }
    expect(asObject('not-an-object', fallback)).toBe(fallback)
  })

  it('returns fallback for a number', () => {
    const fallback = { type: 'percentage', value: 50 }
    expect(asObject(42, fallback)).toBe(fallback)
  })

  it('returns fallback for a boolean', () => {
    const fallback = { type: 'percentage', value: 50 }
    expect(asObject(false, fallback)).toBe(fallback)
  })

  it('accepts nested objects', () => {
    const input = { outer: { inner: 'value' } }
    expect(asObject(input, {})).toBe(input)
  })

  it('accepts empty object', () => {
    const input = {}
    expect(asObject(input, { type: 'percentage', value: 50 })).toBe(input)
  })
})
