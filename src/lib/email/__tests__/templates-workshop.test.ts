/**
 * Tests for workshop email templates.
 *
 * Pure HTML/text generators — no DB, no env vars.
 * Key assertions: dynamic values (name, title, date, URL) appear in output;
 * subject reflects the relevant action; html+text are both present.
 */

import {
  workshopRegistrationConfirmation,
  workshopRegistrationStatusUpdate,
  workshopReminder,
  workshopCancellation,
  workshopFeedbackRequest,
  workshopProposalSubmitted,
  workshopProposalApproved,
  workshopProposalRejected,
  workshopProposalChangesRequested,
} from '../templates/workshop'

const WORKSHOP_URL = 'https://revamp-it.ch/workshops/linux-intro'

// ─── workshopRegistrationConfirmation ────────────────────────────────────────

describe('workshopRegistrationConfirmation', () => {
  const email = workshopRegistrationConfirmation(
    'Anna', 'Linux Intro', '2026-05-15', 'Zürich', 0, WORKSHOP_URL
  )

  it('returns { subject, html, text }', () => {
    expect(email).toHaveProperty('subject')
    expect(email).toHaveProperty('html')
    expect(email).toHaveProperty('text')
  })

  it('subject mentions "Anmeldung" or "Workshop"', () => {
    expect(email.subject).toMatch(/Anmeldung|Workshop/i)
  })

  it('html contains the name', () => {
    expect(email.html).toContain('Anna')
  })

  it('html contains the workshop title', () => {
    expect(email.html).toContain('Linux Intro')
  })

  it('html contains the workshop date', () => {
    expect(email.html).toContain('2026-05-15')
  })

  it('html contains the workshop location', () => {
    expect(email.html).toContain('Zürich')
  })

  it('html contains the workshop URL', () => {
    expect(email.html).toContain(WORKSHOP_URL)
  })

  it('html is valid DOCTYPE string', () => {
    expect(email.html.trim().toLowerCase()).toContain('<!doctype html>')
  })

  it('text has no HTML tags', () => {
    expect(email.text).not.toContain('<div')
    expect(email.text).not.toContain('<html')
  })
})

// ─── workshopRegistrationStatusUpdate ────────────────────────────────────────

describe('workshopRegistrationStatusUpdate', () => {
  it('subject says "bestätigt" for confirmed', () => {
    const email = workshopRegistrationStatusUpdate('Kai', 'Python Workshop', '2026-05-20', 'confirmed')
    expect(email.subject).toContain('bestätigt')
  })

  it('subject says "storniert" for cancelled', () => {
    const email = workshopRegistrationStatusUpdate('Kai', 'Python Workshop', '2026-05-20', 'cancelled')
    expect(email.subject).toContain('storniert')
  })

  it('subject mentions "Warteliste" for waitlist', () => {
    const email = workshopRegistrationStatusUpdate('Kai', 'Python Workshop', '2026-05-20', 'waitlist')
    expect(email.subject).toContain('Warteliste')
  })

  it('html contains the name and workshop title', () => {
    const email = workshopRegistrationStatusUpdate('Kai', 'Python Workshop', '2026-05-20', 'confirmed')
    expect(email.html).toContain('Kai')
    expect(email.html).toContain('Python Workshop')
  })

  it('returns { subject, html, text }', () => {
    const email = workshopRegistrationStatusUpdate('X', 'Y', '2026-01-01', 'confirmed')
    expect(email).toHaveProperty('subject')
    expect(email).toHaveProperty('html')
    expect(email).toHaveProperty('text')
  })
})

// ─── workshopReminder ─────────────────────────────────────────────────────────

describe('workshopReminder', () => {
  it('returns { subject, html, text }', () => {
    const email = workshopReminder('Max', 'Reparaturkurs', '2026-06-01 10:00', 'Basel', WORKSHOP_URL)
    expect(email).toHaveProperty('subject')
    expect(email).toHaveProperty('html')
    expect(email).toHaveProperty('text')
  })

  it('html contains name and workshop title', () => {
    const email = workshopReminder('Max', 'Reparaturkurs', '2026-06-01', 'Basel', WORKSHOP_URL)
    expect(email.html).toContain('Max')
    expect(email.html).toContain('Reparaturkurs')
  })

  it('subject mentions "Erinnerung" or "Reminder"', () => {
    const email = workshopReminder('Max', 'Reparaturkurs', '2026-06-01', 'Basel', WORKSHOP_URL)
    expect(email.subject.toLowerCase()).toMatch(/erinnerung|reminder/)
  })
})

// ─── workshopCancellation ─────────────────────────────────────────────────────

describe('workshopCancellation', () => {
  it('returns { subject, html, text }', () => {
    const email = workshopCancellation('Sara', 'Git Workshop', '2026-04-10', 'Bern', 'Zu wenig Anmeldungen')
    expect(email).toHaveProperty('subject')
    expect(email).toHaveProperty('html')
    expect(email).toHaveProperty('text')
  })

  it('html contains the name and workshop title', () => {
    const email = workshopCancellation('Sara', 'Git Workshop', '2026-04-10', 'Bern', 'Zu wenig Anmeldungen')
    expect(email.html).toContain('Sara')
    expect(email.html).toContain('Git Workshop')
  })

  it('html contains the cancellation reason', () => {
    const email = workshopCancellation('Sara', 'Git Workshop', '2026-04-10', 'Bern', 'Zu wenig Anmeldungen')
    expect(email.html).toContain('Zu wenig Anmeldungen')
  })

  it('subject contains "Absage" or "storniert" or "Cancellation"', () => {
    const email = workshopCancellation('Sara', 'Git Workshop', '2026-04-10', 'Bern', 'reason')
    expect(email.subject.toLowerCase()).toMatch(/absage|storniert|cancellation|abgesagt/)
  })
})

// ─── workshopFeedbackRequest ──────────────────────────────────────────────────

describe('workshopFeedbackRequest', () => {
  const feedbackUrl = 'https://revamp-it.ch/workshops/feedback/123'

  it('returns { subject, html, text }', () => {
    const email = workshopFeedbackRequest('Lena', 'Open Source Intro', feedbackUrl)
    expect(email).toHaveProperty('subject')
    expect(email).toHaveProperty('html')
    expect(email).toHaveProperty('text')
  })

  it('html contains the feedback URL', () => {
    expect(workshopFeedbackRequest('Lena', 'Open Source', feedbackUrl).html).toContain(feedbackUrl)
  })

  it('html contains the name', () => {
    expect(workshopFeedbackRequest('Lena', 'Open Source', feedbackUrl).html).toContain('Lena')
  })
})

// ─── workshopProposalSubmitted ────────────────────────────────────────────────

describe('workshopProposalSubmitted', () => {
  it('returns { subject, html, text }', () => {
    const email = workshopProposalSubmitted('Tom', 'Docker for Beginners', 'PROP-123')
    expect(email).toHaveProperty('subject')
    expect(email).toHaveProperty('html')
    expect(email).toHaveProperty('text')
  })

  it('html contains the workshop title', () => {
    expect(workshopProposalSubmitted('Tom', 'Docker for Beginners', 'PROP-123').html)
      .toContain('Docker for Beginners')
  })

  it('html contains the proposal ID', () => {
    expect(workshopProposalSubmitted('Tom', 'Docker for Beginners', 'PROP-123').html)
      .toContain('PROP-123')
  })

  it('subject mentions "Vorschlag" or "Proposal"', () => {
    const email = workshopProposalSubmitted('Tom', 'X', 'Y')
    expect(email.subject.toLowerCase()).toMatch(/vorschlag|proposal/)
  })
})

// ─── workshopProposalApproved ─────────────────────────────────────────────────

describe('workshopProposalApproved', () => {
  it('returns { subject, html, text }', () => {
    const email = workshopProposalApproved('Maria', 'Intro to Linux', 'https://revamp-it.ch/workshops/linux')
    expect(email).toHaveProperty('subject')
    expect(email).toHaveProperty('html')
    expect(email).toHaveProperty('text')
  })

  it('subject indicates approval', () => {
    const email = workshopProposalApproved('Maria', 'Intro to Linux', 'https://x.com')
    expect(email.subject.toLowerCase()).toMatch(/angenom|genehmigt|approved|zugelassen/)
  })

  it('html contains the name and workshop title', () => {
    const email = workshopProposalApproved('Maria', 'Intro to Linux', 'https://x.com')
    expect(email.html).toContain('Maria')
    expect(email.html).toContain('Intro to Linux')
  })
})

// ─── workshopProposalRejected ─────────────────────────────────────────────────

describe('workshopProposalRejected', () => {
  it('returns { subject, html, text }', () => {
    const email = workshopProposalRejected('Jonas', 'Blockchain 101', 'Kein Bedarf')
    expect(email).toHaveProperty('subject')
    expect(email).toHaveProperty('html')
    expect(email).toHaveProperty('text')
  })

  it('subject indicates rejection', () => {
    const email = workshopProposalRejected('Jonas', 'X', 'reason')
    expect(email.subject.toLowerCase()).toMatch(/abgelehnt|rejected/)
  })

  it('html contains the name', () => {
    expect(workshopProposalRejected('Jonas', 'Blockchain 101', 'reason').html).toContain('Jonas')
  })
})

// ─── workshopProposalChangesRequested ────────────────────────────────────────

describe('workshopProposalChangesRequested', () => {
  it('returns { subject, html, text }', () => {
    const email = workshopProposalChangesRequested('Eva', 'Kubernetes Workshop', 'Bitte Beispiele ergänzen')
    expect(email).toHaveProperty('subject')
    expect(email).toHaveProperty('html')
    expect(email).toHaveProperty('text')
  })

  it('html contains the feedback/change request text', () => {
    const email = workshopProposalChangesRequested('Eva', 'Kubernetes', 'Bitte Beispiele ergänzen')
    expect(email.html).toContain('Bitte Beispiele ergänzen')
  })

  it('html contains the name', () => {
    expect(workshopProposalChangesRequested('Eva', 'Kubernetes', 'feedback').html).toContain('Eva')
  })
})
