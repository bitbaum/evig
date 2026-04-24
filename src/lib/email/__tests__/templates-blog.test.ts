/**
 * Tests for blog email templates.
 *
 * Pure HTML/text generators for the blog submission lifecycle.
 */

import {
  blogSubmissionReceived,
  blogSubmissionApproved,
  blogSubmissionRejected,
  blogSubmissionPublished,
  blogSubmissionChangesRequested,
} from '../templates/blog'

const ARTICLE_URL = 'https://revamp-it.ch/blog/open-source-guide'

// ─── blogSubmissionReceived ───────────────────────────────────────────────────

describe('blogSubmissionReceived', () => {
  // (name, articleTitle, submissionId)
  const email = blogSubmissionReceived('Anna', 'Open Source Guide', 'BLOG-42')

  it('returns { subject, html, text }', () => {
    expect(email).toHaveProperty('subject')
    expect(email).toHaveProperty('html')
    expect(email).toHaveProperty('text')
  })

  it('html contains the author name', () => {
    expect(email.html).toContain('Anna')
  })

  it('html contains the article title', () => {
    expect(email.html).toContain('Open Source Guide')
  })

  it('html contains the submission ID', () => {
    expect(email.html).toContain('BLOG-42')
  })
})

// ─── blogSubmissionApproved ───────────────────────────────────────────────────

describe('blogSubmissionApproved', () => {
  // (name, articleTitle)
  const email = blogSubmissionApproved('Max', 'Linux für Einsteiger')

  it('returns { subject, html, text }', () => {
    expect(email).toHaveProperty('subject')
    expect(email).toHaveProperty('html')
    expect(email).toHaveProperty('text')
  })

  it('html contains the author name', () => {
    expect(email.html).toContain('Max')
  })

  it('html contains the article title', () => {
    expect(email.html).toContain('Linux für Einsteiger')
  })

  it('subject indicates approval', () => {
    expect(email.subject.toLowerCase()).toMatch(/angenom|genehmigt|approved|freigegeben/)
  })
})

// ─── blogSubmissionRejected ───────────────────────────────────────────────────

describe('blogSubmissionRejected', () => {
  // (name, articleTitle, reason)
  const email = blogSubmissionRejected('Sara', 'My Article', 'Kein Bezug zum Thema')

  it('returns { subject, html, text }', () => {
    expect(email).toHaveProperty('subject')
    expect(email).toHaveProperty('html')
    expect(email).toHaveProperty('text')
  })

  it('html contains the author name', () => {
    expect(email.html).toContain('Sara')
  })

  it('html contains the rejection reason', () => {
    expect(email.html).toContain('Kein Bezug zum Thema')
  })

  it('subject indicates rejection', () => {
    expect(email.subject.toLowerCase()).toMatch(/abgelehnt|rejected/)
  })
})

// ─── blogSubmissionPublished ──────────────────────────────────────────────────

describe('blogSubmissionPublished', () => {
  // (name, articleTitle, articleUrl)
  const email = blogSubmissionPublished('Jonas', 'Open Source Guide', ARTICLE_URL)

  it('returns { subject, html, text }', () => {
    expect(email).toHaveProperty('subject')
    expect(email).toHaveProperty('html')
    expect(email).toHaveProperty('text')
  })

  it('html contains the author name', () => {
    expect(email.html).toContain('Jonas')
  })

  it('html contains the article URL', () => {
    expect(email.html).toContain(ARTICLE_URL)
  })
})

// ─── blogSubmissionChangesRequested ──────────────────────────────────────────

describe('blogSubmissionChangesRequested', () => {
  // (name, articleTitle, notes)
  const email = blogSubmissionChangesRequested('Lena', 'Mein Artikel', 'Bitte Beispiele ergänzen')

  it('returns { subject, html, text }', () => {
    expect(email).toHaveProperty('subject')
    expect(email).toHaveProperty('html')
    expect(email).toHaveProperty('text')
  })

  it('html contains the notes', () => {
    expect(email.html).toContain('Bitte Beispiele ergänzen')
  })

  it('html contains the author name', () => {
    expect(email.html).toContain('Lena')
  })
})
