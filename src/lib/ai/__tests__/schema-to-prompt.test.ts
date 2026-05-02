/**
 * Tests for lib/ai/schema-to-prompt.ts — Zod schema → AI prompt string generator.
 *
 * Mission-relevant: this is the SSOT mechanism that prevents AI extraction drift.
 * If zodSchemaToPromptString silently drops fields or mistreats arrays, the AI
 * extraction prompt becomes out-of-sync with the actual Zod schema — meaning
 * extracted data won't match the expected types, causing silent data loss in
 * the erfassung bulk-import flow.
 *
 * Behaviors locked:
 *   - string field: included as plain string description
 *   - array field: included as single-element array wrapping the description
 *   - field in descriptions but NOT in schema: excluded
 *   - field in schema but NOT in descriptions: excluded (allowlist)
 *   - nested object description for array field: wrapped in array
 *   - returns valid JSON string
 *   - empty descriptions produces empty object "{}"
 */

import { z } from 'zod'
import { zodSchemaToPromptString } from '../schema-to-prompt'

// ============================================================================
// Helpers
// ============================================================================

function parsed(result: string): Record<string, unknown> {
  return JSON.parse(result)
}

// ============================================================================
// Basic field types
// ============================================================================

describe('zodSchemaToPromptString — basic field types', () => {
  it('includes a string field as a plain string description', () => {
    const schema = z.object({ name: z.string() })
    const result = zodSchemaToPromptString(schema, { name: 'Vollständiger Name' })
    expect(parsed(result).name).toBe('Vollständiger Name')
  })

  it('includes a number field as a plain string description', () => {
    const schema = z.object({ price: z.number() })
    const result = zodSchemaToPromptString(schema, { price: 'Preis in CHF' })
    expect(parsed(result).price).toBe('Preis in CHF')
  })

  it('includes an array field wrapped in a single-element array', () => {
    const schema = z.object({ tags: z.array(z.string()) })
    const result = zodSchemaToPromptString(schema, { tags: 'Tag-Bezeichnung' })
    const obj = parsed(result)
    expect(Array.isArray(obj.tags)).toBe(true)
    expect((obj.tags as string[])[0]).toBe('Tag-Bezeichnung')
  })

  it('wraps nested object description in array for array field', () => {
    const schema = z.object({
      specs: z.array(z.object({ key: z.string(), value: z.string() })),
    })
    const result = zodSchemaToPromptString(schema, {
      specs: { key: 'Spec-Name', value: 'Spec-Wert' },
    })
    const obj = parsed(result)
    expect(Array.isArray(obj.specs)).toBe(true)
    expect((obj.specs as Record<string, string>[])[0]).toEqual({ key: 'Spec-Name', value: 'Spec-Wert' })
  })
})

// ============================================================================
// Allowlist behavior
// ============================================================================

describe('zodSchemaToPromptString — allowlist filtering', () => {
  it('excludes fields present in descriptions but absent from schema', () => {
    const schema = z.object({ name: z.string() })
    const result = zodSchemaToPromptString(schema, {
      name: 'Name',
      ghost: 'Not in schema',
    })
    const obj = parsed(result)
    expect('ghost' in obj).toBe(false)
    expect('name' in obj).toBe(true)
  })

  it('excludes schema fields not listed in descriptions', () => {
    const schema = z.object({ name: z.string(), internal: z.string() })
    const result = zodSchemaToPromptString(schema, { name: 'Name' })
    const obj = parsed(result)
    expect('internal' in obj).toBe(false)
  })

  it('returns empty object when descriptions is empty', () => {
    const schema = z.object({ name: z.string() })
    const result = zodSchemaToPromptString(schema, {})
    expect(parsed(result)).toEqual({})
  })

  it('returns empty object when schema has no shape keys matching descriptions', () => {
    const schema = z.object({ x: z.string() })
    const result = zodSchemaToPromptString(schema, { y: 'not in schema' })
    expect(parsed(result)).toEqual({})
  })
})

// ============================================================================
// Output format
// ============================================================================

describe('zodSchemaToPromptString — output format', () => {
  it('returns a valid JSON string', () => {
    const schema = z.object({ hersteller: z.string(), specs: z.array(z.string()) })
    const result = zodSchemaToPromptString(schema, {
      hersteller: 'Hersteller',
      specs: 'Spezifikation',
    })
    expect(() => JSON.parse(result)).not.toThrow()
  })

  it('handles multiple fields in order of descriptions', () => {
    const schema = z.object({
      a: z.string(),
      b: z.string(),
      c: z.string(),
    })
    const result = zodSchemaToPromptString(schema, {
      a: 'Alpha',
      b: 'Beta',
      c: 'Gamma',
    })
    const obj = parsed(result)
    expect(obj.a).toBe('Alpha')
    expect(obj.b).toBe('Beta')
    expect(obj.c).toBe('Gamma')
  })
})

// ============================================================================
// Integration: real erfassung-like schema
// ============================================================================

describe('zodSchemaToPromptString — erfassung-like schema', () => {
  const schema = z.object({
    hersteller: z.string(),
    produktname: z.string(),
    verkaufspreis: z.string(),
    specs: z.array(z.object({ key: z.string(), value: z.string() })),
    internal_id: z.string(),
  })

  const descriptions = {
    hersteller: 'Herstellername (Dell, Lenovo, HP, Apple, etc.)',
    produktname: 'Produktname / Modellbezeichnung',
    verkaufspreis: 'Verkaufspreis in CHF',
    specs: { key: 'Spec-Name (CPU, RAM, Speicher)', value: 'Spec-Wert' },
    // internal_id intentionally omitted → allowlist excludes it
  }

  it('produces all expected keys', () => {
    const result = zodSchemaToPromptString(schema, descriptions)
    const obj = parsed(result)
    expect(Object.keys(obj).sort()).toEqual(['hersteller', 'produktname', 'specs', 'verkaufspreis'])
  })

  it('excludes internal_id (not in descriptions)', () => {
    const result = zodSchemaToPromptString(schema, descriptions)
    expect('internal_id' in parsed(result)).toBe(false)
  })

  it('produces correct specs shape', () => {
    const result = zodSchemaToPromptString(schema, descriptions)
    const obj = parsed(result)
    const specs = obj.specs as Record<string, string>[]
    expect(Array.isArray(specs)).toBe(true)
    expect(specs[0].key).toBe('Spec-Name (CPU, RAM, Speicher)')
    expect(specs[0].value).toBe('Spec-Wert')
  })
})
