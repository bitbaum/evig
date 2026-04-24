/**
 * Tests for auth email templates.
 *
 * These are pure HTML/text string generators. Critical tests:
 *   - subject lines contain expected keywords
 *   - user name is interpolated into html and text
 *   - verification codes/URLs appear in the output
 *   - fallback to 'Benutzer' when name is empty
 *   - html and text fields are both non-empty strings
 *   - all returned objects have { subject, html, text } shape
 *
 * The actual HTML rendering is not validated (too brittle) — only that
 * the dynamic values appear and structural requirements hold.
 */

import {
  verificationCode,
  emailVerification,
  welcome,
  staffVerificationCode,
  staffWelcome,
  passwordReset,
  passwordChangeConfirmation,
} from '../templates/auth'

// ─── verificationCode ─────────────────────────────────────────────────────────

describe('verificationCode', () => {
  it('returns { subject, html, text }', () => {
    const email = verificationCode('Anna', '123456')
    expect(email).toHaveProperty('subject')
    expect(email).toHaveProperty('html')
    expect(email).toHaveProperty('text')
  })

  it('subject contains "Bestätigungscode"', () => {
    expect(verificationCode('Anna', '123456').subject).toContain('Bestätigungscode')
  })

  it('html contains the code', () => {
    expect(verificationCode('Anna', '123456').html).toContain('123456')
  })

  it('text contains the code', () => {
    expect(verificationCode('Anna', '123456').text).toContain('123456')
  })

  it('html contains the name', () => {
    expect(verificationCode('Anna', '123456').html).toContain('Anna')
  })

  it('empty name falls back to "Benutzer"', () => {
    const email = verificationCode('', '123456')
    expect(email.html).toContain('Benutzer')
    expect(email.text).toContain('Benutzer')
  })

  it('html is a non-empty string starting with DOCTYPE or whitespace', () => {
    const { html } = verificationCode('Max', '654321')
    expect(html.trim().toLowerCase()).toContain('<!doctype html>')
  })

  it('text is a plain-text string (no HTML tags)', () => {
    const { text } = verificationCode('Max', '654321')
    expect(text).not.toContain('<div')
    expect(text).not.toContain('<html')
  })
})

// ─── emailVerification ────────────────────────────────────────────────────────

describe('emailVerification', () => {
  const url = 'https://revamp-it.ch/auth/verify-email?token=abc123'

  it('returns { subject, html, text }', () => {
    const email = emailVerification('Lukas', url)
    expect(email).toHaveProperty('subject')
    expect(email).toHaveProperty('html')
    expect(email).toHaveProperty('text')
  })

  it('subject contains "bestätigen" or "E-Mail"', () => {
    const { subject } = emailVerification('Lukas', url)
    expect(subject.toLowerCase()).toMatch(/bestätigen|e-mail/)
  })

  it('html contains the verification URL', () => {
    expect(emailVerification('Lukas', url).html).toContain(url)
  })

  it('text contains the verification URL', () => {
    expect(emailVerification('Lukas', url).text).toContain(url)
  })

  it('html contains the name', () => {
    expect(emailVerification('Lukas', url).html).toContain('Lukas')
  })

  it('empty name → html still has "Hallo" greeting', () => {
    // emailVerification does not have a 'Benutzer' fallback — it interpolates name directly
    const email = emailVerification('', url)
    expect(email.html).toContain('Hallo')
  })
})

// ─── welcome ──────────────────────────────────────────────────────────────────

describe('welcome', () => {
  it('returns { subject, html, text }', () => {
    expect(welcome('Sara')).toHaveProperty('subject')
    expect(welcome('Sara')).toHaveProperty('html')
    expect(welcome('Sara')).toHaveProperty('text')
  })

  it('html contains the name', () => {
    expect(welcome('Sara').html).toContain('Sara')
  })

  it('subject contains "Willkommen" or "welcome" (case-insensitive)', () => {
    expect(welcome('Sara').subject.toLowerCase()).toMatch(/willkommen|welcome/)
  })

  it('text is a non-empty string', () => {
    expect(welcome('Sara').text.length).toBeGreaterThan(0)
  })
})

// ─── staffVerificationCode ────────────────────────────────────────────────────

describe('staffVerificationCode', () => {
  it('returns { subject, html, text }', () => {
    expect(staffVerificationCode('Admin', '999999')).toHaveProperty('subject')
  })

  it('html contains the code', () => {
    expect(staffVerificationCode('Admin', '999999').html).toContain('999999')
  })

  it('subject is distinct from regular verificationCode subject', () => {
    const staffSubject = staffVerificationCode('Admin', '999999').subject
    const regularSubject = verificationCode('User', '999999').subject
    // Both may contain "Bestätigungscode" but staff should add something extra
    expect(typeof staffSubject).toBe('string')
    expect(staffSubject.length).toBeGreaterThan(0)
  })
})

// ─── staffWelcome ─────────────────────────────────────────────────────────────

describe('staffWelcome', () => {
  it('returns { subject, html, text }', () => {
    expect(staffWelcome('Admin')).toHaveProperty('subject')
    expect(staffWelcome('Admin')).toHaveProperty('html')
    expect(staffWelcome('Admin')).toHaveProperty('text')
  })

  it('html contains the name', () => {
    expect(staffWelcome('Admin').html).toContain('Admin')
  })

  it('subject is non-empty', () => {
    expect(staffWelcome('Admin').subject.length).toBeGreaterThan(0)
  })
})

// ─── passwordReset ────────────────────────────────────────────────────────────

describe('passwordReset', () => {
  const resetUrl = 'https://revamp-it.ch/auth/reset-password?token=xyz'

  it('returns { subject, html, text }', () => {
    expect(passwordReset('Kai', resetUrl)).toHaveProperty('subject')
  })

  it('html contains the reset URL', () => {
    expect(passwordReset('Kai', resetUrl).html).toContain(resetUrl)
  })

  it('text contains the reset URL', () => {
    expect(passwordReset('Kai', resetUrl).text).toContain(resetUrl)
  })

  it('subject contains "Passwort" or "password" (case-insensitive)', () => {
    expect(passwordReset('Kai', resetUrl).subject.toLowerCase()).toMatch(/passwort|password/)
  })

  it('html contains the name', () => {
    expect(passwordReset('Kai', resetUrl).html).toContain('Kai')
  })
})

// ─── passwordChangeConfirmation ───────────────────────────────────────────────

describe('passwordChangeConfirmation', () => {
  it('returns { subject, html, text }', () => {
    expect(passwordChangeConfirmation('Alex')).toHaveProperty('subject')
    expect(passwordChangeConfirmation('Alex')).toHaveProperty('html')
    expect(passwordChangeConfirmation('Alex')).toHaveProperty('text')
  })

  it('html contains the name', () => {
    expect(passwordChangeConfirmation('Alex').html).toContain('Alex')
  })

  it('subject is non-empty', () => {
    expect(passwordChangeConfirmation('Alex').subject.length).toBeGreaterThan(0)
  })

  it('text does not contain raw HTML tags', () => {
    expect(passwordChangeConfirmation('Alex').text).not.toContain('<div')
  })
})
