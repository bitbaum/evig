/**
 * Decision & Voting Email Templates
 *
 * Templates for voting opened, deadline reminders, outcome notifications, etc.
 */

import { ORG } from '@\/config\/org';
import type { EmailContent } from '../types'
import { createEmailLayout, createTextFooter } from './base-styles'
import { APP_URL } from '@/config/urls'
import { escapeHtml } from '@/lib/utils/escape-html'

// `title` is the decision title — staff-entered text that flows into the
// HTML body. Date interpolation comes from `new Date().toLocaleDateString`
// which is internally generated, no escape needed.

/** Resolve a deep link for a specific decision.
 *  - isPublic=true  → /vote/:id (no login required)
 *  - isAdmin=true   → /admin/decisions/:id
 *  - default        → /dashboard/decisions/:id (staff login required)
 */
function decisionUrl(decisionId?: string, isAdmin = false, isPublic = false): string {
  if (!decisionId) return `${APP_URL}/admin/decisions`
  if (isPublic) return `${APP_URL}/vote/${decisionId}`
  const base = isAdmin ? '/admin/decisions' : '/dashboard/decisions'
  return `${APP_URL}${base}/${decisionId}`
}

export const decisionVotingOpened = (
  title: string,
  deadline?: string,
  decisionId?: string,
  allowPublicVoting = false,
): EmailContent => {
  const deadlineText = deadline
    ? `<p><strong>Frist:</strong> ${new Date(deadline).toLocaleDateString('de-CH', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>`
    : ''
  const deadlinePlain = deadline
    ? `Frist: ${new Date(deadline).toLocaleDateString('de-CH', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}\n`
    : ''

  const link = decisionUrl(decisionId, false, allowPublicVoting)

  const html = createEmailLayout(
    'Abstimmung geöffnet',
    'header-blue',
    `
      <h2>Abstimmung geöffnet</h2>
      <p>Eine neue Abstimmung wartet auf deine Stimme:</p>
      <p><strong>${escapeHtml(title)}</strong></p>
      ${deadlineText}
      <p style="margin-top: 20px;">
        <a href="${link}" class="button button-blue">
          Zur Abstimmung
        </a>
      </p>
    `
  )

  const text = `Abstimmung geöffnet\n\nEine neue Abstimmung wartet auf deine Stimme:\n${title}\n${deadlinePlain}\nZur Abstimmung: ${link}\n${createTextFooter()}`

  return {
    subject: `Abstimmung geöffnet: ${title} - ${ORG.name}`,
    html,
    text,
  }
}

export const decisionDeadlineReminder = (
  title: string,
  deadline: string,
  decisionId?: string,
): EmailContent => {
  const deadlineFormatted = new Date(deadline).toLocaleDateString('de-CH', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })

  const link = decisionUrl(decisionId)

  const html = createEmailLayout(
    'Abstimmung endet bald',
    'header-orange',
    `
      <h2>Erinnerung: Abstimmung endet bald</h2>
      <p>Die folgende Abstimmung endet morgen:</p>
      <p><strong>${escapeHtml(title)}</strong></p>
      <p><strong>Frist:</strong> ${deadlineFormatted}</p>
      <p>Falls du noch nicht abgestimmt hast, gib bitte noch deine Stimme ab.</p>
      <p style="margin-top: 20px;">
        <a href="${link}" class="button button-orange">
          Jetzt abstimmen
        </a>
      </p>
    `
  )

  const text = `Erinnerung: Abstimmung endet bald\n\nDie folgende Abstimmung endet morgen:\n${title}\nFrist: ${deadlineFormatted}\n\nFalls du noch nicht abgestimmt hast, gib bitte noch deine Stimme ab.\n\nJetzt abstimmen: ${link}\n${createTextFooter()}`

  return {
    subject: `Abstimmung endet morgen: ${title} - ${ORG.name}`,
    html,
    text,
  }
}

export const decisionClosed = (
  title: string,
  decisionId?: string,
): EmailContent => {
  const link = decisionUrl(decisionId)

  const html = createEmailLayout(
    'Abstimmung abgeschlossen',
    'header-blue',
    `
      <h2>Abstimmung abgeschlossen</h2>
      <p>Die folgende Abstimmung wurde abgeschlossen:</p>
      <p><strong>${escapeHtml(title)}</strong></p>
      <p>Das Ergebnis steht jetzt fest. Du kannst die Beschlussfassung einsehen.</p>
      <p style="margin-top: 20px;">
        <a href="${link}" class="button button-blue">
          Ergebnis ansehen
        </a>
      </p>
    `
  )

  const text = `Abstimmung abgeschlossen\n\nDie folgende Abstimmung wurde abgeschlossen:\n${title}\n\nDas Ergebnis steht jetzt fest.\n\nErgebnis ansehen: ${link}\n${createTextFooter()}`

  return {
    subject: `Abstimmung abgeschlossen: ${title} - ${ORG.name}`,
    html,
    text,
  }
}
