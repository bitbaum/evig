/**
 * Tests for the new-review notification template.
 *
 * Reviewer name + review content come from end users; both must be
 * HTML-escaped.
 */

import { newReviewNotification } from '../templates/reviews'

const REVIEW_URL = 'https://revamp-it.ch/reviews/abc123'

describe('newReviewNotification', () => {
  const email = newReviewNotification('Anna', 'Bo', 4, 'Gute Arbeit, alles wie versprochen.', REVIEW_URL)

  it('returns { subject, html, text }', () => {
    expect(email).toHaveProperty('subject')
    expect(email).toHaveProperty('html')
    expect(email).toHaveProperty('text')
  })

  it('html contains both names', () => {
    expect(email.html).toContain('Anna') // repairer
    expect(email.html).toContain('Bo')   // reviewer
  })

  it('html contains the review content', () => {
    expect(email.html).toContain('Gute Arbeit')
  })

  it('html renders the rating with star characters', () => {
    expect(email.html).toContain('★')
    expect(email.html).toContain('☆')
    expect(email.html).toContain('(4/5)')
  })

  it('html links to the review URL', () => {
    expect(email.html).toContain(REVIEW_URL)
  })

  it('text contains the same fields', () => {
    expect(email.text).toContain('Anna')
    expect(email.text).toContain('Bo')
    expect(email.text).toContain('Gute Arbeit')
    expect(email.text).toContain(REVIEW_URL)
    expect(email.text).toContain('(4/5)')
  })

  it('escapes HTML in reviewer name and review content', () => {
    const xss = newReviewNotification(
      '<img src=x>',
      '<script>alert(1)</script>',
      5,
      '<svg onload=alert(2)>',
      REVIEW_URL,
    )
    expect(xss.html).not.toContain('<script>alert(1)</script>')
    expect(xss.html).not.toContain('<svg onload=alert(2)>')
    expect(xss.html).toContain('&lt;script&gt;')
    expect(xss.html).toContain('&lt;svg')
  })

  it('preserves review-content line breaks as <br> in HTML', () => {
    const multiline = newReviewNotification('Anna', 'Bo', 5, 'first\nsecond', REVIEW_URL)
    expect(multiline.html).toContain('first<br>second')
  })

  it('handles fractional ratings by flooring the star count', () => {
    const half = newReviewNotification('A', 'B', 3.5, 'ok', REVIEW_URL)
    // Math.floor(3.5) = 3 filled stars, 2 empty
    expect(half.html.match(/★/g)).toHaveLength(3)
    expect(half.html.match(/☆/g)).toHaveLength(2)
    expect(half.html).toContain('(3.5/5)')
  })
})
