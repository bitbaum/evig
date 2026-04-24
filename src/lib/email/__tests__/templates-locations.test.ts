/**
 * Tests for location email templates.
 *
 * Pure HTML/text generators for the location approval flow.
 */

import {
  locationApprovalNotification,
  locationSubmissionConfirmation,
} from '../templates/locations'

// ─── locationApprovalNotification ────────────────────────────────────────────

describe('locationApprovalNotification', () => {
  // (name, locationName, reviewNotes)
  it('returns { subject, html, text }', () => {
    const email = locationApprovalNotification('Anna', 'Bern Altstadt', 'approve', null)
    expect(email).toHaveProperty('subject')
    expect(email).toHaveProperty('html')
    expect(email).toHaveProperty('text')
  })

  it('html contains the submitter name', () => {
    expect(locationApprovalNotification('Anna', 'Bern Altstadt', 'approve', null).html).toContain('Anna')
  })

  it('html contains the location name', () => {
    expect(locationApprovalNotification('Anna', 'Bern Altstadt', 'approve', null).html).toContain('Bern Altstadt')
  })

  it('with review notes → html contains them', () => {
    const email = locationApprovalNotification('Anna', 'Bern', 'reject', 'Bitte Adresse vervollständigen')
    expect(email.html).toContain('Bitte Adresse vervollständigen')
  })
})

// ─── locationSubmissionConfirmation ──────────────────────────────────────────

describe('locationSubmissionConfirmation', () => {
  // (name, locationName, city)
  it('returns { subject, html, text }', () => {
    const email = locationSubmissionConfirmation('Max', 'Hauptbahnhof', 'Zürich')
    expect(email).toHaveProperty('subject')
    expect(email).toHaveProperty('html')
    expect(email).toHaveProperty('text')
  })

  it('html contains the name', () => {
    expect(locationSubmissionConfirmation('Max', 'Hauptbahnhof', 'Zürich').html).toContain('Max')
  })

  it('html contains the location name', () => {
    expect(locationSubmissionConfirmation('Max', 'Hauptbahnhof', 'Zürich').html).toContain('Hauptbahnhof')
  })

  it('html contains the city', () => {
    expect(locationSubmissionConfirmation('Max', 'Hauptbahnhof', 'Zürich').html).toContain('Zürich')
  })
})
