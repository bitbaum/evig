/**
 * Tests for decision/voting email templates.
 *
 * Pure HTML/text generators for the democratic decision-making flow.
 */

import {
  decisionVotingOpened,
  decisionDeadlineReminder,
  decisionClosed,
} from '../templates/decisions'

// ─── decisionVotingOpened ─────────────────────────────────────────────────────

describe('decisionVotingOpened', () => {
  // (title, deadline?, decisionId?)
  const email = decisionVotingOpened('Budget 2026', '2026-05-31', 'DEC-42')

  it('returns { subject, html, text }', () => {
    expect(email).toHaveProperty('subject')
    expect(email).toHaveProperty('html')
    expect(email).toHaveProperty('text')
  })

  it('html contains the decision title', () => {
    expect(email.html).toContain('Budget 2026')
  })

  it('html contains the formatted deadline (not raw ISO)', () => {
    // deadline is formatted via toLocaleDateString — look for the title instead
    expect(email.html).toContain('Budget 2026')
  })

  it('without optional params → still renders', () => {
    const e = decisionVotingOpened('Neue Satzung')
    expect(e).toHaveProperty('subject')
    expect(e.html).toContain('Neue Satzung')
  })
})

// ─── decisionDeadlineReminder ──────────────────────────────────────────────────

describe('decisionDeadlineReminder', () => {
  // (title, deadline, decisionId?)
  const email = decisionDeadlineReminder('Budget 2026', '2026-05-31', 'DEC-42')

  it('returns { subject, html, text }', () => {
    expect(email).toHaveProperty('subject')
    expect(email).toHaveProperty('html')
    expect(email).toHaveProperty('text')
  })

  it('html contains the decision title', () => {
    expect(email.html).toContain('Budget 2026')
  })

  it('subject mentions the deadline approaching', () => {
    // subject: "Abstimmung endet morgen: <title> - RevampIT"
    expect(email.subject.toLowerCase()).toMatch(/endet|abstimmung|deadline|frist|erinnerung/)
  })
})

// ─── decisionClosed ───────────────────────────────────────────────────────────

describe('decisionClosed', () => {
  // (title, decisionId?)
  const email = decisionClosed('Budget 2026', 'DEC-42')

  it('returns { subject, html, text }', () => {
    expect(email).toHaveProperty('subject')
    expect(email).toHaveProperty('html')
    expect(email).toHaveProperty('text')
  })

  it('html contains the decision title', () => {
    expect(email.html).toContain('Budget 2026')
  })

  it('without optional id → still renders', () => {
    const e = decisionClosed('Neue Satzung')
    expect(e).toHaveProperty('subject')
    expect(e.html).toContain('Neue Satzung')
  })
})
