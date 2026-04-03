/**
 * Generic Notification Email Template
 *
 * Used by the notification service to email users about in-app notifications.
 */

import { createEmailLayout, createTextFooter } from './base-styles'
import type { EmailContent } from '../types'
import { APP_URL } from '@/config/urls'

export function notificationEmail(title: string, content: string): EmailContent {
  const html = createEmailLayout(
    'Neue Benachrichtigung',
    'header-blue',
    `
      <h2>${title}</h2>
      <p>${content}</p>
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
