/**
 * Tests for ai/config/prompts/index.ts — fillPromptTemplate utility.
 *
 * Mission-relevant: AI prompts use {fieldName} placeholders filled at
 * runtime with user/context data (product names, languages, context
 * snippets). If fillPromptTemplate skips a placeholder, the AI receives
 * literal "{produktname}" instead of the actual product name.
 *
 * Behaviors locked:
 *   fillPromptTemplate
 *   - replaces a single placeholder
 *   - replaces multiple distinct placeholders
 *   - replaces all occurrences of a repeated placeholder
 *   - leaves unknown placeholders untouched
 *   - handles empty values map (no substitutions)
 *   - does not modify template when no placeholders match
 *   - handles special regex characters in values without throwing
 */

import { fillPromptTemplate } from '../config/prompts'

// ============================================================================
// Basic substitution
// ============================================================================

describe('fillPromptTemplate', () => {
  it('replaces a single placeholder', () => {
    const result = fillPromptTemplate('Hallo {name}!', { name: 'Hans' })
    expect(result).toBe('Hallo Hans!')
  })

  it('replaces multiple distinct placeholders', () => {
    const result = fillPromptTemplate(
      'Produkt: {product}, Sprache: {language}',
      { product: 'ThinkPad T14', language: 'Deutsch' },
    )
    expect(result).toBe('Produkt: ThinkPad T14, Sprache: Deutsch')
  })

  it('replaces all occurrences of a repeated placeholder', () => {
    const result = fillPromptTemplate(
      'Name: {name}. Hallo {name}.',
      { name: 'Petra' },
    )
    expect(result).toBe('Name: Petra. Hallo Petra.')
  })

  it('leaves placeholders untouched when no matching key exists', () => {
    const result = fillPromptTemplate(
      'Kontext: {context}',
      { language: 'Deutsch' }, // 'context' key not provided
    )
    expect(result).toBe('Kontext: {context}')
  })

  it('returns template unchanged when values map is empty', () => {
    const template = 'Gib mir {data} zurück.'
    const result = fillPromptTemplate(template, {})
    expect(result).toBe(template)
  })

  it('returns template unchanged when no placeholders exist', () => {
    const template = 'Kein Platzhalter hier.'
    const result = fillPromptTemplate(template, { name: 'Hans' })
    expect(result).toBe(template)
  })

  it('handles empty string value (replaces placeholder with empty string)', () => {
    const result = fillPromptTemplate('Wert: {val}', { val: '' })
    expect(result).toBe('Wert: ')
  })

  it('handles value with special regex characters without throwing', () => {
    // Dollar sign, backslash, parentheses are regex-special
    expect(() =>
      fillPromptTemplate('{x}', { x: '$100 (approx.)' })
    ).not.toThrow()
  })

  it('handles multiline template', () => {
    const template = 'Zeile 1: {a}\nZeile 2: {b}'
    const result = fillPromptTemplate(template, { a: 'Alpha', b: 'Beta' })
    expect(result).toBe('Zeile 1: Alpha\nZeile 2: Beta')
  })
})
