/**
 * Tests for the XSS sanitization helpers (lib/security/sanitize.ts).
 *
 * Lightweight regex-based sanitizer (replaces isomorphic-dompurify
 * to dodge an ESM/CJS jsdom incompat on Vercel). Two exports:
 *
 *   sanitizeInput(str, { allowHtml?, maxLength? })
 *     - stripAllHtml when allowHtml=false (default)
 *     - sanitizeHtml when allowHtml=true: keeps b/i/em/strong/p/br/ul/ol/li,
 *       strips all attributes from kept tags, drops every other tag
 *     - escapes javascript: / on*= / data: across BOTH paths
 *     - trims + slices to maxLength (default 10000)
 *
 *   sanitizeObject(obj, fields[], options)
 *     - applies sanitizeInput only to listed string fields
 *     - leaves non-string fields and unlisted fields untouched
 */

import { sanitizeInput, sanitizeObject } from '../sanitize'

// ============================================================================
// sanitizeInput — default mode (allowHtml=false → strip all HTML)
// ============================================================================

describe('sanitizeInput — default (strip all HTML)', () => {
  it('passes plain text through unchanged', () => {
    expect(sanitizeInput('Hallo Welt')).toBe('Hallo Welt')
  })

  it('strips a script tag and its content boundaries', () => {
    const dirty = '<script>alert(1)</script>Hi'
    const clean = sanitizeInput(dirty)
    expect(clean).not.toContain('<script>')
    expect(clean).not.toContain('</script>')
    // Note: the regex strips tag wrappers but leaves inner text — that's by
    // design (the result still contains "alert(1)" but as plain text, not code)
    expect(clean).toContain('Hi')
  })

  it('strips an iframe', () => {
    expect(sanitizeInput('<iframe src="https://x"></iframe>ok')).toContain('ok')
    expect(sanitizeInput('<iframe>ok</iframe>')).not.toContain('<iframe>')
  })

  it('strips even allowed tags when allowHtml=false', () => {
    expect(sanitizeInput('<b>bold</b>')).toBe('bold')
    expect(sanitizeInput('<p>text</p>')).toBe('text')
  })

  it('removes javascript: URI', () => {
    expect(sanitizeInput('click javascript:alert(1) here')).not.toContain('javascript:')
  })

  it('removes on*= event handlers', () => {
    expect(sanitizeInput('foo onload=evil() bar')).not.toMatch(/onload\s*=/)
    expect(sanitizeInput('foo onclick=evil() bar')).not.toMatch(/onclick\s*=/)
    expect(sanitizeInput('foo onerror =evil() bar')).not.toMatch(/onerror\s*=/)
  })

  it('removes data: URI', () => {
    expect(sanitizeInput('img data:image/png;base64,abc')).not.toContain('data:')
  })

  it('trims leading and trailing whitespace', () => {
    expect(sanitizeInput('  hello  ')).toBe('hello')
  })

  it('truncates to default maxLength (10000)', () => {
    const long = 'x'.repeat(15000)
    expect(sanitizeInput(long).length).toBe(10000)
  })

  it('respects custom maxLength', () => {
    expect(sanitizeInput('abcdef', { maxLength: 3 })).toBe('abc')
  })

  it('returns empty string for empty input', () => {
    expect(sanitizeInput('')).toBe('')
    expect(sanitizeInput('   ')).toBe('')
  })
})

// ============================================================================
// sanitizeInput — allowHtml=true (keep allow-list, strip everything else)
// ============================================================================

describe('sanitizeInput — allowHtml=true', () => {
  const opts = { allowHtml: true } as const

  it('keeps each allowed tag stripped to bare form (no attributes)', () => {
    expect(sanitizeInput('<b>x</b>', opts)).toContain('<b>')
    expect(sanitizeInput('<i>x</i>', opts)).toContain('<i>')
    expect(sanitizeInput('<em>x</em>', opts)).toContain('<em>')
    expect(sanitizeInput('<strong>x</strong>', opts)).toContain('<strong>')
    expect(sanitizeInput('<p>x</p>', opts)).toContain('<p>')
    expect(sanitizeInput('<ul>x</ul>', opts)).toContain('<ul>')
    expect(sanitizeInput('<ol>x</ol>', opts)).toContain('<ol>')
    expect(sanitizeInput('<li>x</li>', opts)).toContain('<li>')
  })

  it('renders <br> as a self-closing tag', () => {
    expect(sanitizeInput('a<br>b', opts)).toContain('<br />')
  })

  it('strips every attribute from an allowed tag', () => {
    const result = sanitizeInput('<p class="evil" onclick="bad()">x</p>', opts)
    expect(result).toContain('<p>')
    expect(result).not.toContain('class=')
    expect(result).not.toContain('onclick=')
  })

  it('drops disallowed tags entirely (script, iframe, img, a, ...)', () => {
    expect(sanitizeInput('<script>x</script>', opts)).not.toContain('<script>')
    expect(sanitizeInput('<iframe>x</iframe>', opts)).not.toContain('<iframe>')
    expect(sanitizeInput('<img src=x>', opts)).not.toContain('<img')
    expect(sanitizeInput('<a href="evil">x</a>', opts)).not.toContain('<a')
  })

  it('still removes javascript:/on*=/data: even in HTML mode', () => {
    const result = sanitizeInput('<p>javascript:alert(1) onload=foo() data:abc</p>', opts)
    expect(result).not.toContain('javascript:')
    expect(result).not.toMatch(/onload\s*=/)
    expect(result).not.toContain('data:')
  })

  it('handles nested allowed tags', () => {
    const result = sanitizeInput('<p><strong><em>nested</em></strong></p>', opts)
    expect(result).toContain('<p>')
    expect(result).toContain('<strong>')
    expect(result).toContain('<em>')
    expect(result).toContain('nested')
  })

  it('lowercases tag name (case-insensitive matching)', () => {
    expect(sanitizeInput('<P>x</P>', opts)).toContain('<p>')
    expect(sanitizeInput('<STRONG>x</STRONG>', opts)).toContain('<strong>')
  })
})

// ============================================================================
// sanitizeObject — selective field sanitization
// ============================================================================

describe('sanitizeObject', () => {
  it('sanitizes only the listed fields', () => {
    const result = sanitizeObject(
      { name: '<b>Anna</b>', email: 'a@b.ch', untouched: '<i>hi</i>' },
      ['name'],
    )
    expect(result.name).toBe('Anna')         // sanitized
    expect(result.email).toBe('a@b.ch')      // not in list — unchanged
    expect(result.untouched).toBe('<i>hi</i>') // not in list — unchanged
  })

  it('sanitizes multiple listed fields', () => {
    const result = sanitizeObject(
      { a: '<b>1</b>', b: '<i>2</i>', c: 3 },
      ['a', 'b'],
    )
    expect(result.a).toBe('1')
    expect(result.b).toBe('2')
  })

  it('leaves non-string fields untouched even when listed', () => {
    const result = sanitizeObject(
      { count: 42, flag: true, name: '<b>x</b>' },
      ['count', 'flag', 'name'],
    )
    expect(result.count).toBe(42)
    expect(result.flag).toBe(true)
    expect(result.name).toBe('x')
  })

  it('returns a shallow copy (does not mutate input)', () => {
    const input = { name: '<b>x</b>' }
    const result = sanitizeObject(input, ['name'])
    expect(input.name).toBe('<b>x</b>') // unchanged
    expect(result.name).toBe('x')        // sanitized
  })

  it('passes options through to sanitizeInput (allowHtml + maxLength)', () => {
    const longBold = '<b>' + 'x'.repeat(50) + '</b>'
    const result = sanitizeObject(
      { content: longBold },
      ['content'],
      { allowHtml: true, maxLength: 20 },
    )
    // maxLength applies to the input length BEFORE sanitization (slice first),
    // so we check the result starts with the bold tag and is short
    expect(result.content).toContain('<b>')
    expect(result.content.length).toBeLessThanOrEqual(20 + '<b></b>'.length)
  })

  it('handles undefined / missing field gracefully', () => {
    const result = sanitizeObject(
      { name: 'Anna' } as Record<string, string>,
      ['email'], // not present
    )
    expect(result.name).toBe('Anna')
    expect(result.email).toBeUndefined()
  })
})
