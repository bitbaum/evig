/**
 * Tests for seller-application email templates.
 */

import { sellerApplicationSubmitted } from '../templates/sellers'

describe('sellerApplicationSubmitted', () => {
  const email = sellerApplicationSubmitted('Anna', 'APP-42')

  it('returns { subject, html, text }', () => {
    expect(email).toHaveProperty('subject')
    expect(email).toHaveProperty('html')
    expect(email).toHaveProperty('text')
  })

  it('html contains the applicant name', () => {
    expect(email.html).toContain('Anna')
  })

  it('html contains the application ID', () => {
    expect(email.html).toContain('APP-42')
  })

  it('text contains the applicant name and application ID', () => {
    expect(email.text).toContain('Anna')
    expect(email.text).toContain('APP-42')
  })

  it('escapes HTML in user-controlled fields (XSS prevention)', () => {
    const malicious = sellerApplicationSubmitted('<script>alert(1)</script>', 'APP-1')
    expect(malicious.html).not.toContain('<script>alert(1)</script>')
    expect(malicious.html).toContain('&lt;script&gt;')
  })
})
