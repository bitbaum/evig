/**
 * Generic Notification Email Template
 *
 * Used by the notification service to email users about in-app notifications.
 */

import { createEmailLayout, createTextFooter } from './base-styles'
import type { EmailContent } from '../types'
import { APP_URL } from '@/config/urls'
import { escapeHtml } from '@/lib/utils/escape-html'

export function notificationEmail(title: string, content: string): EmailContent {
  // Generic notification — the triggering caller may pass user-supplied
  // strings (e.g. a marketplace message preview) so escape both fields.
  const html = createEmailLayout(
    'Neue Benachrichtigung',
    'header-blue',
    `
      <h2>${escapeHtml(title)}</h2>
      <p>${escapeHtml(content)}</p>
      <p style="margin-top: 20px;">
        <a href="${APP_URL}/dashboard" class="button button-blue">
          Im Dashboard ansehen
        </a>
      </p>
    `
  )

  const text = `${title}\n\n${content}\n\nIm Dashboard ansehen: ${APP_URL}/dashboard\n${createTextFooter()}`

  return {
    subject: title,
    html,
    text,
  }
}
