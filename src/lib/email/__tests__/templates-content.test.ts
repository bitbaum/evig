/**
 * Tests for content-submission lifecycle emails (approved + rejected).
 */

import { contentSubmissionApproved, contentSubmissionRejected } from '../templates/content'

describe('contentSubmissionApproved', () => {
  const email = contentSubmissionApproved('Anna', 'Mein Linux-Setup', 'Blogbeitrag')

  it('returns { subject, html, text }', () => {
    expect(email).toHaveProperty('subject')
    expect(email).toHaveProperty('html')
    expect(email).toHaveProperty('text')
  })

  it('html contains name, title, and content type', () => {
    expect(email.html).toContain('Anna')
    expect(email.html).toContain('Mein Linux-Setup')
    expect(email.html).toContain('Blogbeitrag')
  })

  it('text contains the same fields', () => {
    expect(email.text).toContain('Anna')
    expect(email.text).toContain('Mein Linux-Setup')
    expect(email.text).toContain('Blogbeitrag')
  })

  it('escapes HTML in every user-controlled field', () => {
    const xss = contentSubmissionApproved(
      '<script>name</script>',
      '<script>title</script>',
      '<script>type</script>',
    )
    expect(xss.html).not.toContain('<script>name</script>')
    expect(xss.html).not.toContain('<script>title</script>')
    expect(xss.html).not.toContain('<script>type</script>')
    expect(xss.html).toContain('&lt;script&gt;')
  })
})

describe('contentSubmissionRejected', () => {
  const email = contentSubmissionRejected('Bo', 'Eingereichter Titel', 'Workshop')

  it('returns { subject, html, text }', () => {
    expect(email).toHaveProperty('subject')
    expect(email).toHaveProperty('html')
    expect(email).toHaveProperty('text')
  })

  it('html contains name, title, and content type', () => {
    expect(email.html).toContain('Bo')
    expect(email.html).toContain('Eingereichter Titel')
    expect(email.html).toContain('Workshop')
  })

  it('escapes HTML in every user-controlled field', () => {
    const xss = contentSubmissionRejected(
      '<img src=x>',
      '<svg/onload=1>',
      '<b onclick="x()">',
    )
    expect(xss.html).not.toMatch(/<img src=x>/)
    expect(xss.html).not.toMatch(/<svg\/onload/)
    expect(xss.html).not.toMatch(/<b onclick=/)
    expect(xss.html).toContain('&lt;')
  })

  it('uses the red header (visual cue for rejection)', () => {
    expect(email.html).toContain('header-red')
  })
})
