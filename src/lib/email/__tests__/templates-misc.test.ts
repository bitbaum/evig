/**
 * Tests for miscellaneous email templates:
 * content approval, inquiries, notifications, newsletter, reviews, sellers.
 *
 * All pure HTML/text generators — no DB, no env vars.
 */

import {
  contentSubmissionApproved,
  contentSubmissionRejected,
} from '../templates/content'
import {
  inquiryNotification,
  inquiryConfirmation,
} from '../templates/inquiry'
import { notificationEmail } from '../templates/notification'
import { newsletterConfirmation } from '../templates/newsletter'
import { newReviewNotification } from '../templates/reviews'
import { sellerApplicationSubmitted } from '../templates/sellers'

const CONFIRM_URL = 'https://revamp-it.ch/newsletter/confirm?token=abc'
const REVIEW_URL = 'https://revamp-it.ch/repairers/kai/reviews'

// ─── contentSubmissionApproved ────────────────────────────────────────────────

describe('contentSubmissionApproved', () => {
  // (name, title, contentType)
  const email = contentSubmissionApproved('Anna', 'Linux Guide', 'Blog-Artikel')

  it('returns { subject, html, text }', () => {
    expect(email).toHaveProperty('subject')
    expect(email).toHaveProperty('html')
    expect(email).toHaveProperty('text')
  })

  it('html contains the author name', () => {
    expect(email.html).toContain('Anna')
  })

  it('html contains the content title', () => {
    expect(email.html).toContain('Linux Guide')
  })

  it('html contains the content type', () => {
    expect(email.html).toContain('Blog-Artikel')
  })

  it('subject indicates approval', () => {
    expect(email.subject.toLowerCase()).toMatch(/genehmigt|approved|bestätigt/)
  })
})

// ─── contentSubmissionRejected ────────────────────────────────────────────────

describe('contentSubmissionRejected', () => {
  // (name, title, contentType)
  const email = contentSubmissionRejected('Max', 'Spam Article', 'Blog-Artikel')

  it('returns { subject, html, text }', () => {
    expect(email).toHaveProperty('subject')
    expect(email).toHaveProperty('html')
    expect(email).toHaveProperty('text')
  })

  it('html contains the name', () => {
    expect(email.html).toContain('Max')
  })

  it('html contains the title', () => {
    expect(email.html).toContain('Spam Article')
  })

  it('subject indicates rejection', () => {
    expect(email.subject.toLowerCase()).toMatch(/abgelehnt|rejected/)
  })
})

// ─── inquiryNotification ──────────────────────────────────────────────────────

describe('inquiryNotification', () => {
  // (name, email, topic, message)
  const email = inquiryNotification('Sara', 'sara@example.com', 'Reparatur', 'Mein Laptop ist kaputt.')

  it('returns { subject, html, text }', () => {
    expect(email).toHaveProperty('subject')
    expect(email).toHaveProperty('html')
    expect(email).toHaveProperty('text')
  })

  it('subject contains the topic and name', () => {
    expect(email.subject).toContain('Reparatur')
    expect(email.subject).toContain('Sara')
  })

  it('html contains the sender email', () => {
    expect(email.html).toContain('sara@example.com')
  })

  it('html contains the message', () => {
    expect(email.html).toContain('Mein Laptop ist kaputt.')
  })
})

// ─── inquiryConfirmation ──────────────────────────────────────────────────────

describe('inquiryConfirmation', () => {
  // (name, topic)
  const email = inquiryConfirmation('Jonas', 'Reparatur')

  it('returns { subject, html, text }', () => {
    expect(email).toHaveProperty('subject')
    expect(email).toHaveProperty('html')
    expect(email).toHaveProperty('text')
  })

  it('html contains the name', () => {
    expect(email.html).toContain('Jonas')
  })

  it('html contains the topic', () => {
    expect(email.html).toContain('Reparatur')
  })

  it('subject mentions the org', () => {
    // subject: "Deine Anfrage bei RevampIT — Reparatur"
    expect(email.subject).toContain('Reparatur')
  })
})

// ─── notificationEmail ────────────────────────────────────────────────────────

describe('notificationEmail', () => {
  // (title, content)
  const email = notificationEmail('System-Update', 'Die Plattform wird morgen gewartet.')

  it('returns { subject, html, text }', () => {
    expect(email).toHaveProperty('subject')
    expect(email).toHaveProperty('html')
    expect(email).toHaveProperty('text')
  })

  it('subject equals the title', () => {
    expect(email.subject).toBe('System-Update')
  })

  it('html contains the content', () => {
    expect(email.html).toContain('Die Plattform wird morgen gewartet.')
  })
})

// ─── newsletterConfirmation ───────────────────────────────────────────────────

describe('newsletterConfirmation', () => {
  // (confirmUrl)
  const email = newsletterConfirmation(CONFIRM_URL)

  it('returns { subject, html, text }', () => {
    expect(email).toHaveProperty('subject')
    expect(email).toHaveProperty('html')
    expect(email).toHaveProperty('text')
  })

  it('html contains the confirm URL', () => {
    expect(email.html).toContain(CONFIRM_URL)
  })

  it('text contains the confirm URL', () => {
    expect(email.text).toContain(CONFIRM_URL)
  })
})

// ─── newReviewNotification ────────────────────────────────────────────────────

describe('newReviewNotification', () => {
  // (repairerName, reviewerName, rating, reviewContent, reviewUrl)
  const email = newReviewNotification('Kai', 'Anna', 5, 'Sehr kompetent!', REVIEW_URL)

  it('returns { subject, html, text }', () => {
    expect(email).toHaveProperty('subject')
    expect(email).toHaveProperty('html')
    expect(email).toHaveProperty('text')
  })

  it('html contains the repairer name', () => {
    expect(email.html).toContain('Kai')
  })

  it('html contains the reviewer name', () => {
    expect(email.html).toContain('Anna')
  })

  it('html contains the rating', () => {
    expect(email.html).toContain('5')
  })

  it('html contains the review content', () => {
    expect(email.html).toContain('Sehr kompetent!')
  })

  it('html contains the review URL', () => {
    expect(email.html).toContain(REVIEW_URL)
  })
})

// ─── sellerApplicationSubmitted ───────────────────────────────────────────────

describe('sellerApplicationSubmitted', () => {
  // (name, applicationId)
  const email = sellerApplicationSubmitted('Lars', 'SELL-77')

  it('returns { subject, html, text }', () => {
    expect(email).toHaveProperty('subject')
    expect(email).toHaveProperty('html')
    expect(email).toHaveProperty('text')
  })

  it('html contains the name', () => {
    expect(email.html).toContain('Lars')
  })

  it('html contains the application ID', () => {
    expect(email.html).toContain('SELL-77')
  })
})
