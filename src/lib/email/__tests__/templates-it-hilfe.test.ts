/**
 * Tests for IT-Hilfe email templates.
 *
 * These emails are central to the IT help request matching flow.
 * Users, helpers, and admins all receive these emails during the
 * request lifecycle.
 */

import {
  itHilfeRequestConfirmation,
  helperNewMatchingRequest,
  adminNewITHilfeRequest,
  itHilfeOfferAccepted,
  itHilfeNewOfferReceived,
  itHilfeCompleted,
  itHilfeReviewReceived,
  itHilfeOfferRejected,
} from '../templates/it-hilfe'

const REQUEST_URL = 'https://revamp-it.ch/it-hilfe/requests/42'
const OFFER_URL = 'https://revamp-it.ch/it-hilfe/requests/42/offers'
const ADMIN_URL = 'https://revamp-it.ch/admin/it-hilfe/42'

// ─── itHilfeRequestConfirmation ───────────────────────────────────────────────

describe('itHilfeRequestConfirmation', () => {
  const email = itHilfeRequestConfirmation(
    'Anna',
    'Laptop startet nicht',
    'REQ-42',
    'Hardware-Diagnose',
    null,
    REQUEST_URL
  )

  it('returns { subject, html, text }', () => {
    expect(email).toHaveProperty('subject')
    expect(email).toHaveProperty('html')
    expect(email).toHaveProperty('text')
  })

  it('subject mentions "IT-Hilfe" or "Anfrage"', () => {
    expect(email.subject).toMatch(/IT-Hilfe|Anfrage/)
  })

  it('html contains the user name', () => {
    expect(email.html).toContain('Anna')
  })

  it('html contains the request title', () => {
    expect(email.html).toContain('Laptop startet nicht')
  })

  it('html contains the category', () => {
    expect(email.html).toContain('Hardware-Diagnose')
  })

  it('html contains the request URL', () => {
    expect(email.html).toContain(REQUEST_URL)
  })

  it('with AI diagnosis → html contains the diagnosis', () => {
    const withDiagnosis = itHilfeRequestConfirmation(
      'Anna', 'Laptop', 'REQ-42', 'Hardware', 'Wahrscheinlich RAM-Fehler', REQUEST_URL
    )
    expect(withDiagnosis.html).toContain('Wahrscheinlich RAM-Fehler')
  })

  it('without AI diagnosis → html does not show diagnosis block', () => {
    // null diagnosis should not render the diagnosis section
    expect(email.html).not.toContain('KI-Ersteinschätzung')
  })

  it('text has no HTML tags', () => {
    expect(email.text).not.toContain('<div')
  })
})

// ─── helperNewMatchingRequest ─────────────────────────────────────────────────

describe('helperNewMatchingRequest', () => {
  const email = helperNewMatchingRequest(
    'Max',
    'Laptop startet nicht',
    'Hardware-Diagnose',
    'Normal',
    'Zürich',
    'Remote',
    ['Linux', 'Hardware-Diagnose'],
    REQUEST_URL
  )

  it('returns { subject, html, text }', () => {
    expect(email).toHaveProperty('subject')
    expect(email).toHaveProperty('html')
    expect(email).toHaveProperty('text')
  })

  it('html contains the helper name', () => {
    expect(email.html).toContain('Max')
  })

  it('html contains the request title', () => {
    expect(email.html).toContain('Laptop startet nicht')
  })

  it('html contains the skill', () => {
    expect(email.html).toContain('Linux')
  })

  it('html contains the request URL', () => {
    expect(email.html).toContain(REQUEST_URL)
  })
})

// ─── adminNewITHilfeRequest ───────────────────────────────────────────────────

describe('adminNewITHilfeRequest', () => {
  const email = adminNewITHilfeRequest(
    'Netzwerk Problem',
    'REQ-99',
    'Netzwerk',
    'dringend',
    'Kein Internet',
    ADMIN_URL
  )

  it('returns { subject, html, text }', () => {
    expect(email).toHaveProperty('subject')
    expect(email).toHaveProperty('html')
    expect(email).toHaveProperty('text')
  })

  it('html contains the request title', () => {
    expect(email.html).toContain('Netzwerk Problem')
  })

  it('html contains the admin URL', () => {
    expect(email.html).toContain(ADMIN_URL)
  })

  it('html contains urgency level', () => {
    expect(email.html).toContain('dringend')
  })
})

// ─── itHilfeOfferAccepted ─────────────────────────────────────────────────────

describe('itHilfeOfferAccepted', () => {
  // itHilfeOfferAccepted(helperName, requestTitle, requesterName, requestUrl)
  const email = itHilfeOfferAccepted(
    'Sara',
    'Laptop Problem',
    'Lukas',
    REQUEST_URL
  )

  it('returns { subject, html, text }', () => {
    expect(email).toHaveProperty('subject')
    expect(email).toHaveProperty('html')
    expect(email).toHaveProperty('text')
  })

  it('subject contains "angenommen" or "accepted"', () => {
    expect(email.subject.toLowerCase()).toMatch(/angenommen|accepted/)
  })

  it('html contains the helper name (Sara)', () => {
    expect(email.html).toContain('Sara')
  })

  it('html contains the requester name (Lukas)', () => {
    expect(email.html).toContain('Lukas')
  })

  it('html contains the request URL', () => {
    expect(email.html).toContain(REQUEST_URL)
  })
})

// ─── itHilfeNewOfferReceived ──────────────────────────────────────────────────

describe('itHilfeNewOfferReceived', () => {
  // itHilfeNewOfferReceived(requesterName, requestTitle, helperName, offerMessage, requestUrl)
  const email = itHilfeNewOfferReceived(
    'Mia',
    'Laptop Problem',
    'Kai',
    'Ich kann helfen!',
    OFFER_URL
  )

  it('returns { subject, html, text }', () => {
    expect(email).toHaveProperty('subject')
    expect(email).toHaveProperty('html')
    expect(email).toHaveProperty('text')
  })

  it('html contains the helper name', () => {
    expect(email.html).toContain('Kai')
  })

  it('html contains the offer message', () => {
    expect(email.html).toContain('Ich kann helfen!')
  })

  it('html contains the offer URL', () => {
    expect(email.html).toContain(OFFER_URL)
  })
})

// ─── itHilfeCompleted ────────────────────────────────────────────────────────

describe('itHilfeCompleted', () => {
  const REVIEW_URL = 'https://revamp-it.ch/it-hilfe/requests/42/review'

  it('returns { subject, html, text }', () => {
    const email = itHilfeCompleted('Eva', 'Laptop Problem', REVIEW_URL)
    expect(email).toHaveProperty('subject')
    expect(email).toHaveProperty('html')
    expect(email).toHaveProperty('text')
  })

  it('html contains review URL', () => {
    const email = itHilfeCompleted('Eva', 'Laptop Problem', REVIEW_URL)
    expect(email.html).toContain(REVIEW_URL)
  })

  it('html contains the requester name', () => {
    expect(itHilfeCompleted('Eva', 'X', REVIEW_URL).html).toContain('Eva')
  })
})

// ─── itHilfeReviewReceived ────────────────────────────────────────────────────

describe('itHilfeReviewReceived', () => {
  // itHilfeReviewReceived(helperName, requestTitle, rating, reviewText, requestUrl)
  it('returns { subject, html, text }', () => {
    const email = itHilfeReviewReceived('Tom', 'Laptop Problem', 5, 'Top Hilfe!', REQUEST_URL)
    expect(email).toHaveProperty('subject')
    expect(email).toHaveProperty('html')
    expect(email).toHaveProperty('text')
  })

  it('html contains the rating', () => {
    const email = itHilfeReviewReceived('Tom', 'X', 5, 'Super', REQUEST_URL)
    expect(email.html).toContain('5')
  })

  it('html contains the review comment', () => {
    const email = itHilfeReviewReceived('Tom', 'X', 4, 'Top Hilfe!', REQUEST_URL)
    expect(email.html).toContain('Top Hilfe!')
  })
})

// ─── itHilfeOfferRejected ─────────────────────────────────────────────────────

describe('itHilfeOfferRejected', () => {
  // itHilfeOfferRejected(helperName, requestTitle, requestUrl) — subject: "Anfrage vergeben"
  it('returns { subject, html, text }', () => {
    const email = itHilfeOfferRejected('Lars', 'Laptop Problem', REQUEST_URL)
    expect(email).toHaveProperty('subject')
    expect(email).toHaveProperty('html')
    expect(email).toHaveProperty('text')
  })

  it('html contains the helper name', () => {
    expect(itHilfeOfferRejected('Lars', 'X', REQUEST_URL).html).toContain('Lars')
  })

  it('subject indicates the request was given to someone else', () => {
    const email = itHilfeOfferRejected('Lars', 'X', REQUEST_URL)
    expect(email.subject.toLowerCase()).toMatch(/vergeben|abgelehnt|rejected/)
  })
})
