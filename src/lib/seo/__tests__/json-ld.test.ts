import { safeJsonLd } from '../json-ld'

describe('safeJsonLd', () => {
  it('round-trips simple data identically to JSON.parse', () => {
    const data = { name: 'Laptop', price: 100, tags: ['used', 'good'] }
    expect(JSON.parse(safeJsonLd(data))).toEqual(data)
  })

  it('escapes literal </script> so the HTML parser cannot close the tag early', () => {
    const malicious = { description: 'Test </script><script>alert(1)</script>' }
    const out = safeJsonLd(malicious)
    expect(out).not.toContain('</script>')
    expect(out).not.toContain('</')
    // Still parses back to the original string
    expect((JSON.parse(out) as typeof malicious).description).toBe(malicious.description)
  })

  it('escapes < anywhere it appears, not only before "/script"', () => {
    const data = { html: '<div>x</div>', tag: 'foo<bar>' }
    const out = safeJsonLd(data)
    expect(out).not.toContain('<')
    expect(JSON.parse(out)).toEqual(data)
  })

  it('handles empty / null / nested values', () => {
    expect(safeJsonLd({})).toBe('{}')
    expect(safeJsonLd(null)).toBe('null')
    expect(safeJsonLd({ a: { b: { c: 'ok' } } })).toBe('{"a":{"b":{"c":"ok"}}}')
  })
})
