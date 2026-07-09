/**
 * Tests for admin notification email templates.
 *
 * Pure HTML/text generators — notified admins about new applications/submissions.
 */

import {
  adminNewWorkshopProposal,
  adminNewBlogSubmission,
  adminNewSellerApplication,
} from '../templates/admin'

const ADMIN_URL = 'https://revamp-it.ch/admin/dashboard'

// ─── adminNewWorkshopProposal ──────────────────────────────────────────────────

describe('adminNewWorkshopProposal', () => {
  // (proposerName, proposerEmail, workshopTitle, adminDashboardUrl)
  const email = adminNewWorkshopProposal('Max Berger', 'max@example.com', 'Linux Intro', ADMIN_URL)

  it('returns { subject, html, text }', () => {
    expect(email).toHaveProperty('subject')
    expect(email).toHaveProperty('html')
    expect(email).toHaveProperty('text')
  })

  it('html contains the workshop title', () => {
    expect(email.html).toContain('Linux Intro')
  })

  it('html contains the proposer name', () => {
    expect(email.html).toContain('Max Berger')
  })

  it('html contains the admin URL', () => {
    expect(email.html).toContain(ADMIN_URL)
  })
})

// ─── adminNewBlogSubmission ───────────────────────────────────────────────────

describe('adminNewBlogSubmission', () => {
  // (submitterName, submitterEmail, articleTitle, adminDashboardUrl)
  const email = adminNewBlogSubmission('Sara Koch', 'sara@example.com', 'Open Source Guide', ADMIN_URL)

  it('returns { subject, html, text }', () => {
    expect(email).toHaveProperty('subject')
    expect(email).toHaveProperty('html')
    expect(email).toHaveProperty('text')
  })

  it('html contains the article title', () => {
    expect(email.html).toContain('Open Source Guide')
  })

  it('html contains the submitter name', () => {
    expect(email.html).toContain('Sara Koch')
  })

  it('html contains the admin URL', () => {
    expect(email.html).toContain(ADMIN_URL)
  })
})

// ─── adminNewSellerApplication ────────────────────────────────────────────────

describe('adminNewSellerApplication', () => {
  // (applicantName, applicantEmail, adminDashboardUrl)
  const email = adminNewSellerApplication('Tom Schmid', 'tom@example.com', ADMIN_URL)

  it('returns { subject, html, text }', () => {
    expect(email).toHaveProperty('subject')
    expect(email).toHaveProperty('html')
    expect(email).toHaveProperty('text')
  })

  it('html contains the applicant name', () => {
    expect(email.html).toContain('Tom Schmid')
  })

  it('html contains the admin URL', () => {
    expect(email.html).toContain(ADMIN_URL)
  })
})
