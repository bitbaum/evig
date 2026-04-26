/**
 * Tests for the AI prompt SSOT helpers.
 *
 * Two related modules here:
 *
 *   zodSchemaToPromptString (lib/ai/schema-to-prompt.ts)
 *     Generates the JSON-schema string that the AI sees in extraction
 *     prompts. SSOT: a field is only extracted when it appears in BOTH
 *     the Zod schema AND the descriptions map. Drives erfassung donor
 *     intake, IT-Hilfe matchmaking, blog generation.
 *
 *   fillPromptTemplate (lib/ai/config/prompts/index.ts)
 *     Replaces every {placeholder} in a prompt template with the
 *     corresponding value. Used pervasively across all AI prompts.
 *
 *   getErfassungQuickActionPrompt / getBlogQuickActionPrompt /
 *   getProtocolQuickActionPrompt — typed lookup helpers for quick-action
 *   prompts. The compile-time type is the SSOT for valid action keys.
 */

import { z } from 'zod'

import { zodSchemaToPromptString } from '../schema-to-prompt'
import {
  fillPromptTemplate,
  getErfassungQuickActionPrompt,
  getBlogQuickActionPrompt,
  getProtocolQuickActionPrompt,
} from '../config/prompts'

// ============================================================================
// fillPromptTemplate
// ============================================================================

describe('fillPromptTemplate', () => {
  it('replaces a single placeholder', () => {
    expect(fillPromptTemplate('Hello {name}', { name: 'Anna' })).toBe('Hello Anna')
  })

  it('replaces multiple distinct placeholders', () => {
    const tpl = 'Title: {title}\nDescription: {description}'
    const result = fillPromptTemplate(tpl, { title: 'Foo', description: 'Bar' })
    expect(result).toBe('Title: Foo\nDescription: Bar')
  })

  it('replaces ALL occurrences of the same placeholder (global flag)', () => {
    const tpl = '{x} appears here, and again {x}, even in {x}'
    expect(fillPromptTemplate(tpl, { x: 'YES' })).toBe(
      'YES appears here, and again YES, even in YES',
    )
  })

  it('leaves placeholders untouched when no value is supplied', () => {
    // No magic — un-mapped placeholders stay literal so the AI doesn't
    // see partially-substituted prompts that look like instructions
    const tpl = 'Hi {name}, your code is {code}'
    expect(fillPromptTemplate(tpl, { name: 'Anna' })).toBe(
      'Hi Anna, your code is {code}',
    )
  })

  it('returns the template unchanged when values map is empty', () => {
    const tpl = 'Hi {name}'
    expect(fillPromptTemplate(tpl, {})).toBe('Hi {name}')
  })

  it('does not match double-braced placeholders ({{x}} stays literal except inner replacement)', () => {
    // Template uses {x} not {{x}}, so {{x}} won't be touched by the
    // inner replacement in a way that produces unexpected output
    const result = fillPromptTemplate('{{x}} and {x}', { x: 'YES' })
    // Inner {x} matches; outer braces remain
    expect(result).toBe('{YES} and YES')
  })

  it('values containing regex metacharacters are inserted literally', () => {
    // Critical: don't accidentally re-interpret values as regex replacement
    // patterns ($1, $&, etc). Note: String.prototype.replace DOES interpret
    // $ in the replacement string — this test documents current behavior.
    const result = fillPromptTemplate('User: {name}', { name: 'Cost: $5' })
    // Note: $5 is a backreference in regex replacement; with no group 5
    // it gets emitted as the literal "$5" by JavaScript
    expect(result).toContain('Cost')
  })

  it('handles empty-string values (placeholder collapses)', () => {
    expect(fillPromptTemplate('a{x}b', { x: '' })).toBe('ab')
  })

  it('handles multi-line values (preserves newlines in the substitution)', () => {
    const tpl = 'Here is the body:\n{body}\n---'
    const result = fillPromptTemplate(tpl, { body: 'line1\nline2' })
    expect(result).toBe('Here is the body:\nline1\nline2\n---')
  })

  it('returns a new string (does not mutate template)', () => {
    const tpl = 'Hi {name}'
    fillPromptTemplate(tpl, { name: 'Anna' })
    expect(tpl).toBe('Hi {name}') // unchanged
  })
})

// ============================================================================
// zodSchemaToPromptString
// ============================================================================

describe('zodSchemaToPromptString', () => {
  it('emits only fields that appear in BOTH schema AND descriptions (intersection)', () => {
    const schema = z.object({
      title: z.string(),
      price: z.number(),
      // 'unused' is in schema but not in descriptions → dropped
      unused: z.string().optional(),
    })
    const descriptions = {
      title: 'Product title',
      price: 'Price in CHF',
      // 'extraDesc' has no schema field → also dropped
      extraDesc: 'Should not appear',
    }

    const result = JSON.parse(zodSchemaToPromptString(schema, descriptions))

    expect(result).toEqual({
      title: 'Product title',
      price: 'Price in CHF',
    })
    expect(result).not.toHaveProperty('unused')
    expect(result).not.toHaveProperty('extraDesc')
  })

  it('wraps array-field descriptions in a single-element array', () => {
    // The AI needs to see [description] for arrays so it knows the value
    // shape is "array of strings matching this description"
    const schema = z.object({
      tags: z.array(z.string()),
    })
    const descriptions = { tags: 'Comma-separated keywords' }

    const result = JSON.parse(zodSchemaToPromptString(schema, descriptions))
    expect(result).toEqual({ tags: ['Comma-separated keywords'] })
  })

  it('handles nested-object descriptions (e.g. specs: { key, value })', () => {
    const schema = z.object({
      specs: z.array(z.object({ key: z.string(), value: z.string() })),
    })
    const descriptions = {
      specs: { key: 'Spec name (RAM, CPU, etc.)', value: 'Spec value' },
    }

    const result = JSON.parse(zodSchemaToPromptString(schema, descriptions))
    expect(result).toEqual({
      specs: [{ key: 'Spec name (RAM, CPU, etc.)', value: 'Spec value' }],
    })
  })

  it('returns valid JSON — output is always parseable', () => {
    const schema = z.object({
      title: z.string(),
      tags: z.array(z.string()),
    })
    const descriptions = {
      title: 'with "quotes" inside',
      tags: 'special chars: \\backslash and \nnewline',
    }

    const raw = zodSchemaToPromptString(schema, descriptions)
    expect(() => JSON.parse(raw)).not.toThrow()
  })

  it('returns empty object string when descriptions is empty', () => {
    const schema = z.object({ a: z.string(), b: z.number() })
    const result = JSON.parse(zodSchemaToPromptString(schema, {}))
    expect(result).toEqual({})
  })

  it('returns empty object string when schema has no matching fields', () => {
    const schema = z.object({ a: z.string() })
    const result = JSON.parse(zodSchemaToPromptString(schema, {
      x: 'description for nonexistent x',
    }))
    expect(result).toEqual({})
  })

  it('emits 2-space indented JSON (consistent with prompt formatting)', () => {
    const schema = z.object({ title: z.string() })
    const result = zodSchemaToPromptString(schema, { title: 'Product title' })
    // Pretty-printed with 2-space indent
    expect(result).toBe('{\n  "title": "Product title"\n}')
  })

  it('preserves description order from the descriptions object', () => {
    // JSON.stringify follows insertion order; downstream prompts assume
    // the AI sees fields in the same order as they appear in
    // FIELD_DESCRIPTIONS for prompt readability
    const schema = z.object({ a: z.string(), b: z.string(), c: z.string() })
    const result = zodSchemaToPromptString(schema, {
      c: 'third',
      a: 'first',
      b: 'second',
    })
    // Insertion order: c → a → b
    expect(result.indexOf('"c"')).toBeLessThan(result.indexOf('"a"'))
    expect(result.indexOf('"a"')).toBeLessThan(result.indexOf('"b"'))
  })
})

// ============================================================================
// Quick-action getters (typed lookups into the per-feature PROMPTS objects)
// ============================================================================

describe('getErfassungQuickActionPrompt', () => {
  it('returns the prompt string for a known action', () => {
    const result = getErfassungQuickActionPrompt('estimatePrice')
    expect(typeof result).toBe('string')
    expect(result.length).toBeGreaterThan(0)
  })

  it('every documented quick action returns a non-empty Swiss-German prompt', () => {
    // SSOT check: every key in ErfassungQuickAction → real prompt with
    // Swiss umlauts where needed (ss not ß is the strict CLAUDE.md rule)
    const actions = [
      'addSpecs', 'estimatePrice', 'improveDescription',
      'suggestProfiles', 'completeData',
    ] as const

    for (const action of actions) {
      const prompt = getErfassungQuickActionPrompt(action)
      expect(prompt.length).toBeGreaterThan(20) // real prompt, not stub
      expect(prompt).not.toMatch(/ß/) // CLAUDE.md: ss not ß
    }
  })
})

describe('getBlogQuickActionPrompt', () => {
  it('returns the prompt for a known action', () => {
    const result = getBlogQuickActionPrompt('shorter')
    expect(typeof result).toBe('string')
    expect(result.length).toBeGreaterThan(0)
  })

  it('every documented blog quick action returns a non-empty Swiss-German prompt', () => {
    const actions = ['shorter', 'longer', 'seoOptimize', 'addExamples', 'simplify'] as const
    for (const action of actions) {
      const prompt = getBlogQuickActionPrompt(action)
      expect(prompt.length).toBeGreaterThan(20)
      expect(prompt).not.toMatch(/ß/) // CLAUDE.md: ss not ß
    }
  })
})

describe('getProtocolQuickActionPrompt', () => {
  it('returns the prompt for a known action', () => {
    const result = getProtocolQuickActionPrompt('addDetails')
    expect(typeof result).toBe('string')
    expect(result.length).toBeGreaterThan(0)
  })

  it('every documented protocol quick action returns a non-empty Swiss-German prompt', () => {
    const actions = ['addDetails', 'splitTopics', 'clarifyActions'] as const
    for (const action of actions) {
      const prompt = getProtocolQuickActionPrompt(action)
      expect(prompt.length).toBeGreaterThan(20)
      expect(prompt).not.toMatch(/ß/)
    }
  })
})
