/**
 * Team Invitation Email Templates
 *
 * - teamClaimInvite: a person takes over their (placeholder) account via a
 *   single-use claim link — used both for pre-seeded placeholder staff and
 *   for brand-new people invited into a team by email.
 * - teamMemberAdded: notification to an already-registered staff member that
 *   they were added to a team.
 */

import type { EmailContent } from '../types'
import { createEmailLayout, createTextFooter } from './base-styles'
import { ORG } from '@/config/org'
import { escapeHtml } from '@/lib/utils/escape-html'

export const teamClaimInvite = (
  inviterName: string,
  teamNames: string[],
  claimUrl: string,
): EmailContent => {
  const inviter = escapeHtml(inviterName)
  const url = escapeHtml(claimUrl)
  const teamListHtml = teamNames.length
    ? `<p><strong>Deine Teams:</strong> ${teamNames.map(escapeHtml).join(', ')}</p>`
    : ''
  const teamListText = teamNames.length ? `Deine Teams: ${teamNames.join(', ')}\n` : ''

  const html = createEmailLayout(
    `Einladung zu ${ORG.name}`,
    'header-green',
    `
      <h2>Du bist eingeladen</h2>
      <p>${inviter} hat dich zum internen Bereich von <strong>${ORG.name}</strong> eingeladen.</p>
      ${teamListHtml}
      <p>Über den folgenden Link übernimmst du dein Konto: Name prüfen, E-Mail bestätigen und ein Passwort setzen — danach kannst du dich jederzeit anmelden.</p>
      <p style="margin-top: 20px;">
        <a href="${url}" class="button button-green">Konto übernehmen</a>
      </p>
      <p style="font-size:13px;color:#888;">Der Link ist 14 Tage gültig und kann nur einmal verwendet werden. Falls du diese Einladung nicht erwartet hast, kannst du sie ignorieren.</p>
    `,
  )

  const text = `Du bist eingeladen\n\n${inviterName} hat dich zum internen Bereich von ${ORG.name} eingeladen.\n${teamListText}\nKonto übernehmen: ${claimUrl}\n\nDer Link ist 14 Tage gültig und kann nur einmal verwendet werden.\n${createTextFooter()}`

  return { subject: `${inviterName} lädt dich zu ${ORG.name} ein`, html, text }
}

export const teamMemberAdded = (
  teamName: string,
  teamUrl: string,
  addedByName: string,
): EmailContent => {
  const team = escapeHtml(teamName)
  const addedBy = escapeHtml(addedByName)
  const url = escapeHtml(teamUrl)

  const html = createEmailLayout(
    'Neue Team-Mitgliedschaft',
    'header-green',
    `
      <h2>Willkommen im Team</h2>
      <p>${addedBy} hat dich zum Team <strong>«${team}»</strong> hinzugefügt.</p>
      <p style="margin-top: 20px;">
        <a href="${url}" class="button button-green">Zum Team</a>
      </p>
    `,
  )

  const text = `Willkommen im Team\n\n${addedByName} hat dich zum Team «${teamName}» hinzugefügt.\n\nZum Team: ${teamUrl}\n${createTextFooter()}`

  return { subject: `Du wurdest zum Team «${teamName}» hinzugefügt`, html, text }
}
