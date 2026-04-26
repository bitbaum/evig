/**
 * Tests for inquiry email templates (Mitmachen form).
 *
 * The inquiry form is publicly reachable, so every interpolated field
 * is attacker-controlled and must be HTML-escaped before reaching the
 * email body. Tests lock that escaping in.
 */

import { inquiryNotification, inquiryConfirmation } from '../templates/inquiry'

describe('inquiryNotification', () => {
  const email = inquiryNotification('Anna', 'anna@example.com', 'Workshop teaching', 'I would like to help.')

  it('returns { subject, html, text }', () => {
    expect(email).toHaveProperty('subject')
    expect(email).toHaveProperty('html')
    expect(email).toHaveProperty('text')
  })

  it('subject contains the topic and name', () => {
    expect(email.subject).toContain('Workshop teaching')
    expect(email.subject).toContain('Anna')
  })

  it('html contains the name, email, topic, and message', () => {
    expect(email.html).toContain('Anna')
    expect(email.html).toContain('anna@example.com')
    expect(email.html).toContain('Workshop teaching')
    expect(email.html).toContain('I would like to help.')
  })

  it('escapes HTML in every user-controlled field', () => {
    const xss = inquiryNotification(
      '<img src=x onerror=alert(1)>',
      '<svg/onload=alert(2)>@x',
      '<script>alert(3)</script>',
      '<b onclick="evil()">hi</b>',
    )
    // None of the dangerous tags should appear unescaped
    expect(xss.html).not.toMatch(/<script>alert\(3\)/)
    expect(xss.html).not.toMatch(/<img src=x onerror/)
    expect(xss.html).not.toMatch(/<svg\/onload/)
    expect(xss.html).not.toMatch(/<b onclick=/)
    // But the escaped versions should
    expect(xss.html).toContain('&lt;script&gt;')
  })

  it('preserves message line breaks as <br> in HTML', () => {
    const multiline = inquiryNotification('Bo', 'bo@x.ch', 'X', 'line1\nline2')
    expect(multiline.html).toContain('line1<br>line2')
  })
})

describe('inquiryConfirmation', () => {
  const email = inquiryConfirmation('Max', 'Reparatur')

  it('returns { subject, html, text }', () => {
    expect(email).toHaveProperty('subject')
    expect(email).toHaveProperty('html')
    expect(email).toHaveProperty('text')
  })

  it('subject contains the topic', () => {
    expect(email.subject).toContain('Reparatur')
  })

  it('html contains the recipient name and topic', () => {
    expect(email.html).toContain('Max')
    expect(email.html).toContain('Reparatur')
  })

  it('escapes HTML in name and topic', () => {
    const xss = inquiryConfirmation('<script>1</script>', '<script>2</script>')
    expect(xss.html).not.toContain('<script>1</script>')
    expect(xss.html).not.toContain('<script>2</script>')
    expect(xss.html).toContain('&lt;script&gt;')
  })
})
