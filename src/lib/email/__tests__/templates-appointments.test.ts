/**
 * Tests for appointment email templates.
 *
 * Pure HTML/text generators for the repair appointment flow.
 */

import {
  appointmentNewBooking,
  appointmentQuoteReceived,
  appointmentStatusUpdate,
  appointmentUnassignedAlert,
} from '../templates/appointments'

const APPOINTMENT_URL = 'https://revamp-it.ch/appointments/99'
const ADMIN_URL = 'https://revamp-it.ch/admin/appointments/99'

// ─── appointmentNewBooking ─────────────────────────────────────────────────────

describe('appointmentNewBooking', () => {
  // (repairerName, customerName, serviceName, description, appointmentUrl)
  const email = appointmentNewBooking('Kai', 'Anna', 'Laptop Reparatur', 'Gerät startet nicht', APPOINTMENT_URL)

  it('returns { subject, html, text }', () => {
    expect(email).toHaveProperty('subject')
    expect(email).toHaveProperty('html')
    expect(email).toHaveProperty('text')
  })

  it('html contains the repairer name', () => {
    expect(email.html).toContain('Kai')
  })

  it('html contains the customer name', () => {
    expect(email.html).toContain('Anna')
  })

  it('html contains the service name', () => {
    expect(email.html).toContain('Laptop Reparatur')
  })

  it('html contains the appointment URL', () => {
    expect(email.html).toContain(APPOINTMENT_URL)
  })
})

// ─── appointmentQuoteReceived ──────────────────────────────────────────────────

describe('appointmentQuoteReceived', () => {
  // (customerName, repairerName, priceCHF, diagnosisNotes, appointmentUrl)
  const email = appointmentQuoteReceived('Anna', 'Kai', 120, 'Festplatte defekt', APPOINTMENT_URL)

  it('returns { subject, html, text }', () => {
    expect(email).toHaveProperty('subject')
    expect(email).toHaveProperty('html')
    expect(email).toHaveProperty('text')
  })

  it('html contains the price', () => {
    expect(email.html).toContain('120')
  })

  it('html contains the customer name', () => {
    expect(email.html).toContain('Anna')
  })

  it('html contains diagnosis notes', () => {
    expect(email.html).toContain('Festplatte defekt')
  })

  it('with null diagnosis → html still renders', () => {
    const e = appointmentQuoteReceived('Anna', 'Kai', 80, null, APPOINTMENT_URL)
    expect(e.html).toContain('Anna')
    expect(e.html).toContain('80')
  })
})

// ─── appointmentStatusUpdate ───────────────────────────────────────────────────

describe('appointmentStatusUpdate', () => {
  // (recipientName, otherPartyName, newStatusLabel, serviceName, appointmentUrl)
  const email = appointmentStatusUpdate('Anna', 'Kai', 'Abgeschlossen', 'Laptop Reparatur', APPOINTMENT_URL)

  it('returns { subject, html, text }', () => {
    expect(email).toHaveProperty('subject')
    expect(email).toHaveProperty('html')
    expect(email).toHaveProperty('text')
  })

  it('subject or html contains the new status label', () => {
    const combined = email.subject + email.html
    expect(combined).toContain('Abgeschlossen')
  })

  it('html contains the recipient name', () => {
    expect(email.html).toContain('Anna')
  })
})

// ─── appointmentUnassignedAlert ────────────────────────────────────────────────

describe('appointmentUnassignedAlert', () => {
  // (adminName, customerName, serviceName, description, urgency, adminUrl)
  const email = appointmentUnassignedAlert('Admin', 'Max', 'Netzwerk-Setup', 'Kein Internet', 'hoch', ADMIN_URL)

  it('returns { subject, html, text }', () => {
    expect(email).toHaveProperty('subject')
    expect(email).toHaveProperty('html')
    expect(email).toHaveProperty('text')
  })

  it('html contains the customer name', () => {
    expect(email.html).toContain('Max')
  })

  it('html contains the service name', () => {
    expect(email.html).toContain('Netzwerk-Setup')
  })

  it('html contains the admin URL', () => {
    expect(email.html).toContain(ADMIN_URL)
  })
})
