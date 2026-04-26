import { escapeHtml } from '../escape-html'

describe('escapeHtml', () => {
  it('passes through plain text unchanged', () => {
    expect(escapeHtml('hello world')).toBe('hello world')
    expect(escapeHtml('Über uns')).toBe('Über uns')
  })

  it('escapes the five HTML special characters', () => {
    expect(escapeHtml('<')).toBe('&lt;')
    expect(escapeHtml('>')).toBe('&gt;')
    expect(escapeHtml('&')).toBe('&amp;')
    expect(escapeHtml('"')).toBe('&quot;')
    expect(escapeHtml("'")).toBe('&#39;')
  })

  it('neutralises a script-tag injection', () => {
    expect(escapeHtml('<script>alert(1)</script>')).toBe(
      '&lt;script&gt;alert(1)&lt;/script&gt;'
    )
  })

  it('neutralises an attribute-break injection', () => {
    // " ends the surrounding attribute, then onerror= adds a new one
    expect(escapeHtml('" onerror="alert(1)')).toBe(
      '&quot; onerror=&quot;alert(1)'
    )
  })

  it('escapes & first so already-escaped entities do not double-escape unexpectedly', () => {
    // The desired sequence: & must run first, otherwise &lt; → &amp;lt;
    // round-tripping `&` should produce `&amp;`, and `&lt;` should produce
    // `&amp;lt;` (escaping the literal characters of the input)
    expect(escapeHtml('&')).toBe('&amp;')
    expect(escapeHtml('&lt;')).toBe('&amp;lt;')
  })

  it('handles empty string', () => {
    expect(escapeHtml('')).toBe('')
  })
})
