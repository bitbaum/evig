/**
 * Tests for the generic notification email template.
 *
 * Both fields can carry user-supplied previews (e.g. marketplace
 * messages), so HTML escaping is mandatory.
 */

import { notificationEmail } from '../templates/notification'

describe('notificationEmail', () => {
  const email = notificationEmail('Neue Nachricht', 'Du hast eine neue Nachricht erhalten')

  it('returns { subject, html, text }', () => {
    expect(email).toHaveProperty('subject')
    expect(email).toHaveProperty('html')
    expect(email).toHaveProperty('text')
  })

  it('uses the title as the subject', () => {
    expect(email.subject).toBe('Neue Nachricht')
  })

  it('html contains both title and content', () => {
    expect(email.html).toContain('Neue Nachricht')
    expect(email.html).toContain('Du hast eine neue Nachricht erhalten')
  })

  it('html links to the dashboard', () => {
    expect(email.html).toContain('/dashboard')
  })

  it('text contains both title and content', () => {
    expect(email.text).toContain('Neue Nachricht')
    expect(email.text).toContain('Du hast eine neue Nachricht erhalten')
  })

  it('escapes HTML in both title and content', () => {
    const xss = notificationEmail('<script>alert(1)</script>', '<img src=x onerror=alert(2)>')
    expect(xss.html).not.toContain('<script>alert(1)</script>')
    expect(xss.html).not.toContain('<img src=x onerror=alert(2)>')
    expect(xss.html).toContain('&lt;script&gt;')
    expect(xss.html).toContain('&lt;img')
  })
})
