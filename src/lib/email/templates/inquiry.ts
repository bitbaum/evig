/**
 * Inquiry Email Templates
 *
 * Used when someone submits an interest/inquiry form from a Mitmachen page.
 */

import type { EmailContent } from '../types'
import { createEmailLayout, createTextFooter } from './base-styles'
import { ORG } from '@/config/org'

/**
 * Notification to admin — someone submitted an inquiry.
 */
export const inquiryNotification = (
  name: string,
  email: string,
  topic: string,
  message: string
): EmailContent => ({
  subject: `Neue Anfrage: ${topic} — ${name}`,
  html: createEmailLayout(
    `Neue Anfrage: ${topic}`,
    'header-green',
    `
      <p>Eine neue Anfrage wurde über das Mitmachen-Formular eingereicht:</p>
      <table style="width:100%; border-collapse:collapse; margin:20px 0;">
        <tr><td style="padding:8px; font-weight:bold; width:120px;">Thema</td><td style="padding:8px;">${topic}</td></tr>
        <tr style="background:#f3f4f6;"><td style="padding:8px; font-weight:bold;">Name</td><td style="padding:8px;">${name}</td></tr>
        <tr><td style="padding:8px; font-weight:bold;">E-Mail</td><td style="padding:8px;"><a href="mailto:${email}">${email}</a></td></tr>
      </table>
      <p><strong>Nachricht:</strong></p>
      <div style="background:#f9fafb; border-left:4px solid #22c55e; padding:16px; margin:12px 0; border-radius:4px;">
        ${message.replace(/\n/g, '<br>')}
      </div>
      <p style="margin-top:24px;">
        <a href="mailto:${email}" class="button button-green">Direkt antworten</a>
      </p>
    `
  ),
  text: `Neue Anfrage: ${topic}\n\nName: ${name}\nE-Mail: ${email}\n\nNachricht:\n${message}\n\n${createTextFooter()}`,
})

/**
 * Confirmation to the person who submitted the inquiry.
 */
export const inquiryConfirmation = (
  name: string,
  topic: string
): EmailContent => ({
  subject: `Deine Anfrage bei ${ORG.name} — ${topic}`,
  html: createEmailLayout(
    'Wir haben deine Anfrage erhalten',
    'header-green',
    `
      <p>Hallo ${name},</p>
      <p>vielen Dank für dein Interesse an <strong>${topic}</strong> bei ${ORG.name}!</p>
      <p>Wir haben deine Nachricht erhalten und melden uns in der Regel innerhalb weniger Werktage bei dir.</p>
      <div class="highlight-box">
        <strong>Was als Nächstes passiert:</strong>
        <ul style="margin:8px 0; padding-left:20px;">
          <li>Wir lesen deine Nachricht und leiten sie an die richtige Person weiter.</li>
          <li>Du erhältst eine persönliche Antwort auf diese E-Mail-Adresse.</li>
          <li>Falls wir mehr Informationen brauchen, melden wir uns direkt bei dir.</li>
        </ul>
      </div>
      <p>In der Zwischenzeit kannst du mehr über uns erfahren auf <a href="${ORG.website}">${ORG.emailDomain}</a>.</p>
      <p>Bis bald!<br>Das Revamp-IT Team</p>
    `
  ),
  text: `Hallo ${name},\n\nvielen Dank für dein Interesse an ${topic} bei ${ORG.name}!\n\nWir haben deine Nachricht erhalten und melden uns in Kürze bei dir.\n\n${createTextFooter()}`,
})
