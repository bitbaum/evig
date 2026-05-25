/**
 * Tests for the newsletter confirmation email template.
 */

import { newsletterConfirmation } from '../templates/newsletter'

describe('newsletterConfirmation', () => {
  const CONFIRM_URL = 'https://revamp-it.ch/newsletter/confirm?token=abc123'
  const email = newsletterConfirmation(CONFIRM_URL)

  it('returns { subject, html, text }', () => {
    expect(email).toHaveProperty('subject')
    expect(email).toHaveProperty('html')
    expect(email).toHaveProperty('text')
  })

  it('html contains the confirmation URL twice (button + plain link)', () => {
    const matches = email.html.match(new RegExp(CONFIRM_URL.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'))
    expect(matches).not.toBeNull()
    expect(matches!.length).toBeGreaterThanOrEqual(2)
  })

  it('text contains the confirmation URL', () => {
    expect(email.text).toContain(CONFIRM_URL)
  })

  it('subject is in German', () => {
    expect(email.subject).toContain('bestätigen')
  })

  it('subject interpolates ORG.name (not literal "${ORG.name}")', () => {
    expect(email.subject).not.toMatch(/\$\{/)
    expect(email.subject).toMatch(/Revamp-IT|revamp-it/i)
  })
})
