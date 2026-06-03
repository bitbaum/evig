/**
 * Project Contribution Email Templates
 *
 * Sent when a visitor offers help on a public project (e.g. a need
 * listed on /projects/upcycling). Mirrors the inquiry templates but
 * carries the project + need context staff need to triage.
 */

import type { EmailContent } from '../types'
import { createEmailLayout, createTextFooter } from './base-styles'
import { ORG } from '@/config/org'
import { escapeHtml } from '@/lib/utils/escape-html'

/**
 * Notification to staff — someone offered to help with a project need.
 */
export const projectContributionNotification = (
  projectTitle: string,
  needTitle: string | null,
  name: string,
  email: string,
  phone: string | null,
  organization: string | null,
  message: string
): EmailContent => {
  const eProject = escapeHtml(projectTitle)
  const eNeed = needTitle ? escapeHtml(needTitle) : 'Allgemeines Interesse'
  const eName = escapeHtml(name)
  const eEmail = escapeHtml(email)
  const ePhone = phone ? escapeHtml(phone) : '—'
  const eOrg = organization ? escapeHtml(organization) : '—'
  const eMessageHtml = escapeHtml(message).replace(/\n/g, '<br>')

  return {
    subject: `Neuer Projekt-Beitrag: ${projectTitle} — ${needTitle ?? 'Interesse'}`,
    html: createEmailLayout(
      `Neuer Beitrag zu ${eProject}`,
      'header-green',
      `
      <p>Eine Person hat über die Projekt-Seite Hilfe angeboten:</p>
      <table style="width:100%; border-collapse:collapse; margin:20px 0;">
        <tr><td style="padding:8px; font-weight:bold; width:140px;">Projekt</td><td style="padding:8px;">${eProject}</td></tr>
        <tr style="background:#f3f4f6;"><td style="padding:8px; font-weight:bold;">Bedarf</td><td style="padding:8px;">${eNeed}</td></tr>
        <tr><td style="padding:8px; font-weight:bold;">Name</td><td style="padding:8px;">${eName}</td></tr>
        <tr style="background:#f3f4f6;"><td style="padding:8px; font-weight:bold;">E-Mail</td><td style="padding:8px;"><a href="mailto:${eEmail}">${eEmail}</a></td></tr>
        <tr><td style="padding:8px; font-weight:bold;">Telefon</td><td style="padding:8px;">${ePhone}</td></tr>
        <tr style="background:#f3f4f6;"><td style="padding:8px; font-weight:bold;">Organisation</td><td style="padding:8px;">${eOrg}</td></tr>
      </table>
      <p><strong>Nachricht:</strong></p>
      <div style="background:#f9fafb; border-left:4px solid #22c55e; padding:16px; margin:12px 0; border-radius:4px;">
        ${eMessageHtml}
      </div>
      <p style="margin-top:24px;">
        <a href="mailto:${eEmail}" class="button button-green">Direkt antworten</a>
      </p>
    `
    ),
    text: `Neuer Projekt-Beitrag\n\nProjekt: ${projectTitle}\nBedarf: ${needTitle ?? 'Allgemein'}\nName: ${name}\nE-Mail: ${email}\nTelefon: ${phone ?? '—'}\nOrganisation: ${organization ?? '—'}\n\nNachricht:\n${message}\n\n${createTextFooter()}`,
  }
}

/**
 * Confirmation to the visitor who offered help.
 */
export const projectContributionConfirmation = (
  name: string,
  projectTitle: string
): EmailContent => {
  const eName = escapeHtml(name)
  const eProject = escapeHtml(projectTitle)

  return {
    subject: `Dein Beitrag zu ${projectTitle} bei ${ORG.name}`,
    html: createEmailLayout(
      'Wir haben dein Angebot erhalten',
      'header-green',
      `
      <p>Hallo ${eName},</p>
      <p>vielen Dank, dass du das Projekt <strong>${eProject}</strong> bei ${ORG.name} unterstützen willst!</p>
      <p>Wir haben dein Angebot erhalten und melden uns in der Regel innerhalb weniger Werktage bei dir, sobald wir es intern besprochen haben.</p>
      <div class="highlight-box">
        <strong>Was als Nächstes passiert:</strong>
        <ul style="margin:8px 0; padding-left:20px;">
          <li>Die zuständige Person liest dein Angebot.</li>
          <li>Falls es passt, melden wir uns direkt bei dir mit konkreten nächsten Schritten.</li>
          <li>Falls nicht, sagen wir auch das ehrlich.</li>
        </ul>
      </div>
      <p>Falls du in der Zwischenzeit weitere Details ergänzen willst, antworte einfach auf diese E-Mail.</p>
      <p>Bis bald!<br>Das Revamp-IT Team</p>
    `
    ),
    text: `Hallo ${name},\n\nvielen Dank, dass du das Projekt ${projectTitle} bei ${ORG.name} unterstützen willst!\n\nWir haben dein Angebot erhalten und melden uns in Kürze bei dir.\n\n${createTextFooter()}`,
  }
}
