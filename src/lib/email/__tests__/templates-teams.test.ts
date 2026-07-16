/**
 * Tests for team invitation email templates.
 *
 * Pure HTML/text generators for team onboarding: the claim-link invite
 * (placeholder → real account) and the added-to-team notification.
 */

import { teamClaimInvite, teamMemberAdded } from '../templates/teams'

// ─── teamClaimInvite ──────────────────────────────────────────────────────────

describe('teamClaimInvite', () => {
  const email = teamClaimInvite(
    'Georgy',
    ['Forschung & Entwicklung', 'IT-Admin'],
    'https://revamp-it.ch/einladung/tok123?email=neu%40revamp-it.ch',
  )

  it('returns { subject, html, text }', () => {
    expect(email).toHaveProperty('subject')
    expect(email).toHaveProperty('html')
    expect(email).toHaveProperty('text')
  })

  it('subject names the inviter', () => {
    expect(email.subject).toContain('Georgy')
  })

  it('html contains the claim link and team names (escaped)', () => {
    expect(email.html).toContain('/einladung/tok123')
    expect(email.html).toContain('Forschung &amp; Entwicklung')
    expect(email.html).toContain('IT-Admin')
  })

  it('text contains the raw (unescaped) claim link', () => {
    expect(email.text).toContain('https://revamp-it.ch/einladung/tok123')
  })

  it('escapes HTML in the inviter name', () => {
    const evil = teamClaimInvite('<script>x</script>', [], 'https://revamp-it.ch/einladung/t')
    expect(evil.html).not.toContain('<script>')
    expect(evil.html).toContain('&lt;script&gt;')
  })

  it('renders without teams (no membership list yet)', () => {
    const e = teamClaimInvite('Georgy', [], 'https://revamp-it.ch/einladung/t')
    expect(e.html).not.toContain('Deine Teams')
    expect(e.text).not.toContain('Deine Teams')
  })
})

// ─── teamMemberAdded ──────────────────────────────────────────────────────────

describe('teamMemberAdded', () => {
  const email = teamMemberAdded(
    'Forschung & Entwicklung',
    'https://revamp-it.ch/admin/teams/forschung-entwicklung',
    'Georgy',
  )

  it('returns { subject, html, text }', () => {
    expect(email).toHaveProperty('subject')
    expect(email).toHaveProperty('html')
    expect(email).toHaveProperty('text')
  })

  it('subject names the team', () => {
    expect(email.subject).toContain('Forschung & Entwicklung')
  })

  it('html links to the team page and names who added them', () => {
    expect(email.html).toContain('/admin/teams/forschung-entwicklung')
    expect(email.html).toContain('Georgy')
  })

  it('escapes HTML in the team name', () => {
    const evil = teamMemberAdded('<img src=x>', 'https://revamp-it.ch/admin/teams/x', 'G')
    expect(evil.html).not.toContain('<img src=x>')
  })
})
