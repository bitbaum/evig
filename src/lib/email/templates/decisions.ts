/**
 * Decision & Voting Email Templates
 *
 * Templates for voting opened, deadline reminders, etc.
 */

import type { EmailContent } from '../types'
import { createEmailLayout, createTextFooter } from './base-styles'
import { APP_URL } from '@/config/urls'

export const decisionVotingOpened = (title: string, deadline?: string): EmailContent => {
  const deadlineText = deadline
    ? `<p><strong>Frist:</strong> ${new Date(deadline).toLocaleDateString('de-CH', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>`
    : ''
  const deadlinePlain = deadline
    ? `Frist: ${new Date(deadline).toLocaleDateString('de-CH', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}\n`
    : ''

  const html = createEmailLayout(
    'Abstimmung geöffnet',
    'header-blue',
    `
      <h2>Abstimmung geöffnet</h2>
      <p>Eine neue Abstimmung wartet auf deine Stimme:</p>
      <p><strong>${title}</strong></p>
      ${deadlineText}
      <p style="margin-top: 20px;">
        <a href="${APP_URL}/admin/decisions" class="button button-blue">
          Zur Abstimmung
        </a>
      </p>
    `
  )

  const text = `Abstimmung geöffnet\n\nEine neue Abstimmung wartet auf deine Stimme:\n${title}\n${deadlinePlain}\nZur Abstimmung: ${APP_URL}/admin/decisions\n${createTextFooter()}`

  return {
    subject: `Abstimmung geöffnet: ${title} - RevampIT`,
    html,
    text,
  }
}

export const decisionDeadlineReminder = (title: string, deadline: string): EmailContent => {
  const deadlineFormatted = new Date(deadline).toLocaleDateString('de-CH', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })

  const html = createEmailLayout(
    'Abstimmung endet morgen',
    'header-orange',
    `
      <h2>Erinnerung: Abstimmung endet morgen</h2>
      <p>Die folgende Abstimmung endet morgen:</p>
      <p><strong>${title}</strong></p>
      <p><strong>Frist:</strong> ${deadlineFormatted}</p>
      <p>Falls du noch nicht abgestimmt hast, gib bitte noch deine Stimme ab.</p>
      <p style="margin-top: 20px;">
        <a href="${APP_URL}/admin/decisions" class="button button-orange">
          Jetzt abstimmen
        </a>
      </p>
    `
  )

  const text = `Erinnerung: Abstimmung endet morgen\n\nDie folgende Abstimmung endet morgen:\n${title}\nFrist: ${deadlineFormatted}\n\nFalls du noch nicht abgestimmt hast, gib bitte noch deine Stimme ab.\n\nJetzt abstimmen: ${APP_URL}/admin/decisions\n${createTextFooter()}`

  return {
    subject: `Abstimmung endet morgen: ${title} - RevampIT`,
    html,
    text,
  }
}
