/**
 * Generic Notification Email Template
 *
 * Used by the notification service to email users about in-app notifications.
 */

import { createEmailLayout, createTextFooter } from './base-styles'
import type { EmailContent } from '../types'

export function notificationEmail(title: string, content: string): EmailContent {
  const html = createEmailLayout(
    'Neue Benachrichtigung',
    'header-blue',
    `
      <h2>${title}</h2>
      <p>${content}</p>
      <p style="margin-top: 20px;">
        <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://revamp-it.ch'}/dashboard" class="button button-blue">
          Im Dashboard ansehen
        </a>
      </p>
    `
  )

  const text = `${title}\n\n${content}\n\nIm Dashboard ansehen: ${process.env.NEXT_PUBLIC_APP_URL || 'https://revamp-it.ch'}/dashboard\n${createTextFooter()}`

  return {
    subject: title,
    html,
    text,
  }
}
