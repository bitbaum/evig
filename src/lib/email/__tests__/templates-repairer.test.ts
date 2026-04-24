/**
 * Tests for repairer application email templates.
 *
 * Pure HTML/text generators for the repairer onboarding flow.
 */

import {
  repairerApplicationSubmitted,
  repairerApplicationApproved,
  repairerApplicationRejected,
  repairerApplicationChangesRequested,
} from '../templates/repairer'

const DASHBOARD_URL = 'https://revamp-it.ch/repairer/dashboard'

// ─── repairerApplicationSubmitted ────────────────────────────────────────────

describe('repairerApplicationSubmitted', () => {
  // (name, applicationId)
  const email = repairerApplicationSubmitted('Lars', 'APP-99')

  it('returns { subject, html, text }', () => {
    expect(email).toHaveProperty('subject')
    expect(email).toHaveProperty('html')
    expect(email).toHaveProperty('text')
  })

  it('html contains the name', () => {
    expect(email.html).toContain('Lars')
  })

  it('html contains the application ID', () => {
    expect(email.html).toContain('APP-99')
  })
})

// ─── repairerApplicationApproved ─────────────────────────────────────────────

describe('repairerApplicationApproved', () => {
  // (name, dashboardUrl)
  const email = repairerApplicationApproved('Lars', DASHBOARD_URL)

  it('returns { subject, html, text }', () => {
    expect(email).toHaveProperty('subject')
    expect(email).toHaveProperty('html')
    expect(email).toHaveProperty('text')
  })

  it('html contains the name', () => {
    expect(email.html).toContain('Lars')
  })

  it('html contains the dashboard URL', () => {
    expect(email.html).toContain(DASHBOARD_URL)
  })

  it('subject indicates approval', () => {
    expect(email.subject.toLowerCase()).toMatch(/angenom|genehmigt|approved|bestätigt/)
  })
})

// ─── repairerApplicationRejected ──────────────────────────────────────────────

describe('repairerApplicationRejected', () => {
  // (name, rejectionReason, supportEmail)
  const email = repairerApplicationRejected('Lars', 'Unvollständige Unterlagen', 'support@revamp-it.ch')

  it('returns { subject, html, text }', () => {
    expect(email).toHaveProperty('subject')
    expect(email).toHaveProperty('html')
    expect(email).toHaveProperty('text')
  })

  it('html contains the name', () => {
    expect(email.html).toContain('Lars')
  })

  it('html contains the rejection reason', () => {
    expect(email.html).toContain('Unvollständige Unterlagen')
  })

  it('html contains the support email', () => {
    expect(email.html).toContain('support@revamp-it.ch')
  })

  it('subject is non-empty string', () => {
    // subject: "Techniker-Bewerbung - RevampIT" (no explicit rejection word)
    expect(email.subject.length).toBeGreaterThan(0)
  })
})

// ─── repairerApplicationChangesRequested ──────────────────────────────────────

describe('repairerApplicationChangesRequested', () => {
  // (name, requestedChanges, dashboardUrl)
  const email = repairerApplicationChangesRequested('Lars', 'Bitte Zertifikate hochladen', DASHBOARD_URL)

  it('returns { subject, html, text }', () => {
    expect(email).toHaveProperty('subject')
    expect(email).toHaveProperty('html')
    expect(email).toHaveProperty('text')
  })

  it('html contains the name', () => {
    expect(email.html).toContain('Lars')
  })

  it('html contains the requested changes', () => {
    expect(email.html).toContain('Bitte Zertifikate hochladen')
  })

  it('html contains the dashboard URL', () => {
    expect(email.html).toContain(DASHBOARD_URL)
  })
})
