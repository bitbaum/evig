import { sanitizeReturnTo } from '../safe-redirect'

const FALLBACK = '/dashboard'

describe('sanitizeReturnTo', () => {
  describe('rejects unsafe inputs', () => {
    test.each([
      ['null', null],
      ['undefined', undefined],
      ['empty string', ''],
      ['absolute https URL', 'https://evil.com'],
      ['absolute http URL', 'http://evil.com/path'],
      ['javascript: scheme', 'javascript:alert(1)'],
      ['data: scheme', 'data:text/html,<script>alert(1)</script>'],
      ['mailto: scheme', 'mailto:victim@example.com'],
      ['protocol-relative', '//evil.com'],
      ['protocol-relative deep', '//evil.com/path?x=1'],
      ['backslash variant', '/\\evil.com'],
      ['leading backslash', '\\\\evil.com'],
      ['no leading slash', 'dashboard'],
      ['CR injection', '/dashboard\r\nLocation: //evil.com'],
      ['LF injection', '/dashboard\n//evil.com'],
      ['TAB injection', '/\tdashboard'],
      ['NUL byte', '/\x00//evil.com'],
    ])('returns fallback for %s', (_label, input) => {
      expect(sanitizeReturnTo(input as string | null | undefined, FALLBACK)).toBe(FALLBACK)
    })
  })

  describe('passes safe inputs through', () => {
    test.each([
      ['root', '/'],
      ['simple path', '/dashboard'],
      ['nested path', '/admin/intake'],
      ['path with query', '/admin/erfassung?edit=abc'],
      ['path with hash', '/profile#settings'],
      ['locale-prefixed', '/de/about'],
    ])('keeps %s', (_label, input) => {
      expect(sanitizeReturnTo(input, FALLBACK)).toBe(input)
    })
  })
})
