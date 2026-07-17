/**
 * Guard: `registryExtract` substitutes ONLY {currentData} and {instruction}
 * in refine mode. Any other single-word placeholder stays unfilled and the
 * model silently receives the literal "{placeholder}" — the bug that shipped
 * as {currentProduct} in the erfassung refine template. This test ends the
 * class for every current and future registry entry.
 */
import { FORM_AI_REGISTRY } from '@/lib/ai/config/prompts'

const SUPPORTED = new Set(['currentData', 'instruction'])

describe('FORM_AI_REGISTRY refine templates', () => {
  const withRefine = Object.entries(FORM_AI_REGISTRY)
    .filter(([, config]) => typeof config.refine === 'string')
    .map(([formType, config]) => [formType, config.refine as string] as const)

  it('has at least one refine-capable form (sanity)', () => {
    expect(withRefine.length).toBeGreaterThan(0)
  })

  it.each(withRefine)('%s uses only supported refine placeholders', (_formType, template) => {
    const placeholders = [...template.matchAll(/\{(\w+)\}/g)].map(m => m[1])
    const unsupported = placeholders.filter(p => !SUPPORTED.has(p))
    expect(unsupported).toEqual([])
  })

  it.each(withRefine)('%s references the current data', (_formType, template) => {
    expect(template).toContain('{currentData}')
  })
})
