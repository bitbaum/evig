/**
 * Donation drop-off email templates
 *
 * Public donate page (/get-involved/donate) lets visitors announce a
 * device drop-off via a structured form instead of the legacy mailto
 * link. The route sends both emails fire-and-forget — neither failure
 * blocks the form submission, but staff need the notification to act.
 *
 * Persistence model: we intentionally do NOT insert into the donations
 * table here. A drop-off announcement is an *intent* — the donation
 * itself gets recorded by staff in /admin/donations once the device
 * physically arrives. Mirroring the inquiry route's "emails-only"
 * shape keeps both paths reviewable as one pattern.
 */

import type { EmailContent } from '../types'
import { createEmailLayout, createTextFooter } from './base-styles'
import { ORG, LOCATIONS, OPENING_HOURS } from '@/config/org'
import { escapeHtml } from '@/lib/utils/escape-html'

interface DropoffFields {
  name: string
  email: string
  phone?: string
  preferredDate?: string
  devices: string
  notes?: string
}

/**
 * Notification to staff — someone announced a device drop-off.
 */
export const donationDropoffNotification = (fields: DropoffFields): EmailContent => {
  // Every interpolated field is attacker-controlled — escape before HTML.
  const eName = escapeHtml(fields.name)
  const eEmail = escapeHtml(fields.email)
  const ePhone = fields.phone ? escapeHtml(fields.phone) : ''
  const eDate = fields.preferredDate ? escapeHtml(fields.preferredDate) : ''
  const eDevicesHtml = escapeHtml(fields.devices).replace(/\n/g, '<br>')
  const eNotesHtml = fields.notes ? escapeHtml(fields.notes).replace(/\n/g, '<br>') : ''

  const optionalRow = (label: string, value: string) =>
    value
      ? `<tr><td style="padding:8px; font-weight:bold; width:140px;">${label}</td><td style="padding:8px;">${value}</td></tr>`
      : ''

  return {
    subject: `Geräte-Abgabe angemeldet — ${fields.name}`,
    html: createEmailLayout(
      'Neue Geräte-Abgabe',
      'header-green',
      `
      <p>Jemand möchte Geräte spenden:</p>
      <table style="width:100%; border-collapse:collapse; margin:20px 0;">
        <tr><td style="padding:8px; font-weight:bold; width:140px;">Name</td><td style="padding:8px;">${eName}</td></tr>
        <tr style="background:#f3f4f6;"><td style="padding:8px; font-weight:bold;">E-Mail</td><td style="padding:8px;"><a href="mailto:${eEmail}">${eEmail}</a></td></tr>
        ${optionalRow('Telefon', ePhone)}
        ${optionalRow('Bevorzugter Termin', eDate)}
      </table>
      <p><strong>Geräte:</strong></p>
      <div style="background:#f9fafb; border-left:4px solid #22c55e; padding:16px; margin:12px 0; border-radius:4px;">
        ${eDevicesHtml}
      </div>
      ${eNotesHtml ? `<p><strong>Anmerkungen:</strong></p><div style="background:#f9fafb; border-left:4px solid #22c55e; padding:16px; margin:12px 0; border-radius:4px;">${eNotesHtml}</div>` : ''}
      <p style="margin-top:24px;">
        <a href="mailto:${eEmail}" class="button button-green">Direkt antworten</a>
      </p>
    `,
    ),
    text: `Neue Geräte-Abgabe\n\nName: ${fields.name}\nE-Mail: ${fields.email}\n${fields.phone ? `Telefon: ${fields.phone}\n` : ''}${fields.preferredDate ? `Bevorzugter Termin: ${fields.preferredDate}\n` : ''}\nGeräte:\n${fields.devices}\n${fields.notes ? `\nAnmerkungen:\n${fields.notes}\n` : ''}\n${createTextFooter()}`,
  }
}

/**
 * Confirmation to the donor — we received their announcement.
 */
export const donationDropoffConfirmation = (fields: DropoffFields): EmailContent => {
  const eName = escapeHtml(fields.name)
  const eDevicesHtml = escapeHtml(fields.devices).replace(/\n/g, '<br>')
  const dateLine = fields.preferredDate
    ? `<p>Bevorzugter Termin: <strong>${escapeHtml(fields.preferredDate)}</strong>.</p>`
    : ''

  return {
    subject: `Vielen Dank für deine Geräte-Spende-Anmeldung bei ${ORG.name}`,
    html: createEmailLayout(
      'Wir haben deine Anmeldung erhalten',
      'header-green',
      `
      <p>Hallo ${eName},</p>
      <p>vielen Dank, dass du ${ORG.name} Geräte spenden möchtest! Wir haben deine Anmeldung erhalten.</p>
      ${dateLine}
      <p><strong>Du hast angegeben:</strong></p>
      <div style="background:#f9fafb; border-left:4px solid #22c55e; padding:16px; margin:12px 0; border-radius:4px;">
        ${eDevicesHtml}
      </div>
      <div class="highlight-box">
        <strong>So geht es weiter:</strong>
        <ul style="margin:8px 0; padding-left:20px;">
          <li>Wir prüfen deine Anmeldung und melden uns in der Regel innerhalb weniger Werktage.</li>
          <li>Falls dein Wunschtermin nicht passt oder wir Rückfragen haben, kontaktieren wir dich direkt.</li>
          <li>Anschliessend kannst du die Geräte zu unseren Öffnungszeiten vorbeibringen.</li>
        </ul>
      </div>
      <p><strong>Abgabeort:</strong><br>
      ${ORG.name} ${LOCATIONS.store.name}<br>
      ${LOCATIONS.store.full}<br>
      ${OPENING_HOURS.compact}</p>
      <p>Bis bald!<br>Das ${ORG.name} Team</p>
    `,
    ),
    text: `Hallo ${fields.name},\n\nvielen Dank für deine Geräte-Spende-Anmeldung bei ${ORG.name}!\n\n${fields.preferredDate ? `Bevorzugter Termin: ${fields.preferredDate}\n\n` : ''}Du hast angegeben:\n${fields.devices}\n\nWir melden uns in Kürze bei dir.\n\nAbgabeort: ${LOCATIONS.store.full} (${OPENING_HOURS.compact})\n\n${createTextFooter()}`,
  }
}
