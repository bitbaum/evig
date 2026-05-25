/**
 * IT-Hilfe Email Templates
 *
 * Templates for IT-Hilfe request confirmation and admin notifications.
 */

import type { EmailContent } from '../types'
import { BASE_STYLES, COPYRIGHT_TEXT } from './base-styles'
import { ORG, LOCATIONS } from '@/config/org'
import { escapeHtml } from '@/lib/utils/escape-html'

// Every `${data}` interpolated into an html: body that comes from a user
// (userName/helperName/requesterName/requestTitle/aiDiagnosis/offerMessage/
// reviewText/requesterEmail) gets escaped. Subject + text bodies stay raw.

/**
 * Confirmation email sent to the user after creating an IT-Hilfe request
 */
export const itHilfeRequestConfirmation = (
  userName: string,
  requestTitle: string,
  requestId: string,
  categoryName: string,
  aiDiagnosis: string | null,
  requestUrl: string
): EmailContent => ({
  subject: `Deine IT-Hilfe Anfrage wurde erstellt - ${ORG.name}`,
  html: `
    <!DOCTYPE html>
    <html lang="de">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Deine IT-Hilfe Anfrage</title>
      <style>${BASE_STYLES}</style>
    </head>
    <body>
      <div class="container">
        <div class="header header-green">
          <h1>Deine IT-Hilfe Anfrage</h1>
        </div>
        <div class="content">
          <p>Hallo ${escapeHtml(userName)},</p>
          <p>Deine IT-Hilfe Anfrage wurde erfolgreich erstellt!</p>

          <p><strong>Titel:</strong> ${escapeHtml(requestTitle)}</p>
          <p><strong>Kategorie:</strong> ${escapeHtml(categoryName)}</p>

          ${aiDiagnosis ? `
          <div class="highlight-box">
            <p><strong>Unsere KI-Ersteinschätzung:</strong></p>
            <p>${escapeHtml(aiDiagnosis)}</p>
            <p style="font-size: 12px; color: #666; margin-top: 10px;">
              Dies ist eine automatische Ersteinschätzung und ersetzt keine professionelle Diagnose.
            </p>
          </div>
          ` : ''}

          <div style="background-color: #f0fdf4; padding: 15px; border-radius: 5px; margin: 15px 0;">
            <p><strong>Über ${ORG.name}</strong></p>
            <p>Wir sind ein Schweizer Non-Profit-Verein für nachhaltige IT. Reparieren statt Wegwerfen ist unser Motto.</p>
            <p>Du kannst dein Gerät auch direkt in unsere Werkstatt bringen:</p>
            <p><strong>${ORG.name} Werkstatt</strong><br>
            ${LOCATIONS.store.full}</p>
          </div>

          <p><strong>Was passiert als Nächstes?</strong></p>
          <ul>
            <li>Techniker aus der Community werden deine Anfrage sehen</li>
            <li>Du wirst benachrichtigt, wenn jemand ein Angebot macht</li>
            <li>Du entscheidest, welches Angebot du annimmst</li>
          </ul>

          <a href="${requestUrl}" class="button button-green">Anfrage ansehen</a>
        </div>
        <div class="footer">
          <p>Diese E-Mail wurde automatisch generiert.</p>
          <p>${COPYRIGHT_TEXT}</p>
        </div>
      </div>
    </body>
    </html>
  `,
  text: `
Hallo ${userName},

Deine IT-Hilfe Anfrage wurde erfolgreich erstellt!

Titel: ${requestTitle}
Kategorie: ${categoryName}
${aiDiagnosis ? `
KI-Ersteinschätzung:
${aiDiagnosis}

(Dies ist eine automatische Ersteinschätzung und ersetzt keine professionelle Diagnose.)
` : ''}
Du kannst dein Gerät auch direkt vorbeibringen:
${ORG.name} Werkstatt - ${LOCATIONS.store.full}

Was passiert als Nächstes?
- Techniker aus der Community werden deine Anfrage sehen
- Du wirst benachrichtigt, wenn jemand ein Angebot macht
- Du entscheidest, welches Angebot du annimmst

Anfrage ansehen: ${requestUrl}

Mit freundlichen Grüssen,
Das ${ORG.name} Team
  `.trim(),
})

/**
 * Sent to a logged-out visitor who just submitted an IT-Hilfe request
 * via the anonymous-post flow. We provisioned them a new (unclaimed)
 * user account; this email links them to the existing reset-password
 * page where they set their password and gain access to the request
 * they just submitted.
 *
 * `claimUrl` is the URL of /auth/reset-password?token=... — the
 * existing forgot-password infrastructure handles password set + login.
 * Link is valid for 7 days (caller passes an explicit TTL to
 * createPasswordResetToken since the 1-hour default is too short for
 * an email a recipient may not read for a day or two).
 *
 * Used only when `wasCreated: true` from findOrCreateAnonymousUser.
 * Existing-account anonymous submissions get a different message
 * (we attached this to your account, log in normally).
 */
export const itHilfeAnonymousRequestClaim = (
  requestTitle: string,
  claimUrl: string
): EmailContent => ({
  subject: `Deine IT-Hilfe Anfrage ist eingereicht — Konto aktivieren - ${ORG.name}`,
  html: `
    <!DOCTYPE html>
    <html lang="de">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Konto aktivieren</title>
      <style>${BASE_STYLES}</style>
    </head>
    <body>
      <div class="container">
        <div class="header header-green">
          <h1>Deine Anfrage ist eingereicht!</h1>
        </div>
        <div class="content">
          <p>Hallo,</p>
          <p>Deine IT-Hilfe Anfrage <strong>"${escapeHtml(requestTitle)}"</strong> wurde erfolgreich gespeichert.</p>

          <p>Wir haben für dich ein Konto erstellt, damit du:</p>
          <ul>
            <li>Angebote von Technikern sehen und annehmen kannst</li>
            <li>Mit deinem gewählten Techniker kommunizieren kannst</li>
            <li>Den Status deiner Anfrage verfolgen kannst</li>
          </ul>

          <p><strong>Klick auf den Button unten, um ein Passwort festzulegen und auf deine Anfrage zuzugreifen:</strong></p>

          <a href="${claimUrl}" class="button button-green">Konto aktivieren</a>

          <p style="font-size: 12px; color: #666; margin-top: 16px;">
            Dieser Link ist 7 Tage gültig. Falls er abgelaufen ist, kannst du auf der Anmeldeseite "Passwort vergessen" wählen und einen neuen Link anfordern.
          </p>

          <div style="background-color: #f0fdf4; padding: 15px; border-radius: 5px; margin: 15px 0;">
            <p style="margin: 0;"><strong>Was passiert als Nächstes?</strong></p>
            <p style="margin: 8px 0 0 0;">Sobald dein Konto aktiviert ist, siehst du eingehende Angebote von Technikern aus der Community. Du entscheidest, welches Angebot du annimmst.</p>
          </div>
        </div>
        <div class="footer">
          <p>Diese E-Mail wurde automatisch generiert.</p>
          <p>${COPYRIGHT_TEXT}</p>
        </div>
      </div>
    </body>
    </html>
  `,
  text: `
Hallo,

Deine IT-Hilfe Anfrage "${requestTitle}" wurde erfolgreich gespeichert.

Wir haben für dich ein Konto erstellt, damit du Angebote sehen und annehmen kannst.

Klick auf diesen Link, um ein Passwort festzulegen und auf deine Anfrage zuzugreifen:
${claimUrl}

Dieser Link ist 7 Tage gültig.

Mit freundlichen Grüssen,
Das ${ORG.name} Team
  `.trim(),
})

/**
 * Notification email sent to matching helpers when a new IT-Hilfe request is created
 */
export const helperNewMatchingRequest = (
  helperName: string,
  requestTitle: string,
  categoryName: string,
  urgencyName: string,
  canton: string,
  serviceTypeName: string,
  matchingSkillNames: string[],
  requestUrl: string
): EmailContent => ({
  subject: `Neue passende Anfrage für dich - ${ORG.name} IT-Hilfe`,
  html: `
    <!DOCTYPE html>
    <html lang="de">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Neue passende Anfrage</title>
      <style>${BASE_STYLES}</style>
    </head>
    <body>
      <div class="container">
        <div class="header header-green">
          <h1>Neue passende Anfrage</h1>
        </div>
        <div class="content">
          <p>Hallo ${escapeHtml(helperName)},</p>
          <p>Es gibt eine neue IT-Hilfe Anfrage, die zu deinen Fähigkeiten passt!</p>

          <table style="width: 100%; border-collapse: collapse; margin: 15px 0;">
            <tr>
              <td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold;">Titel</td>
              <td style="padding: 8px; border-bottom: 1px solid #eee;">${escapeHtml(requestTitle)}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold;">Kategorie</td>
              <td style="padding: 8px; border-bottom: 1px solid #eee;">${escapeHtml(categoryName)}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold;">Dringlichkeit</td>
              <td style="padding: 8px; border-bottom: 1px solid #eee;">${escapeHtml(urgencyName)}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold;">Kanton</td>
              <td style="padding: 8px; border-bottom: 1px solid #eee;">${escapeHtml(canton)}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold;">Service-Art</td>
              <td style="padding: 8px; border-bottom: 1px solid #eee;">${escapeHtml(serviceTypeName)}</td>
            </tr>
          </table>

          <p><strong>Deine passenden Fähigkeiten:</strong></p>
          <div style="margin: 10px 0;">
            ${matchingSkillNames.map(skill => `<span style="display: inline-block; background-color: #dcfce7; color: #166534; padding: 4px 12px; border-radius: 12px; font-size: 13px; margin: 3px 2px;">${escapeHtml(skill)}</span>`).join('')}
          </div>

          <a href="${requestUrl}" class="button button-green">Anfrage ansehen &amp; Angebot machen</a>
        </div>
        <div class="footer">
          <p>Du erhältst diese E-Mail, weil deine Fähigkeiten zu dieser Anfrage passen.</p>
          <p>${COPYRIGHT_TEXT}</p>
        </div>
      </div>
    </body>
    </html>
  `,
  text: `
Hallo ${helperName},

Es gibt eine neue IT-Hilfe Anfrage, die zu deinen Fähigkeiten passt!

Titel: ${requestTitle}
Kategorie: ${categoryName}
Dringlichkeit: ${urgencyName}
Kanton: ${canton}
Service-Art: ${serviceTypeName}

Deine passenden Fähigkeiten: ${matchingSkillNames.join(', ')}

Anfrage ansehen & Angebot machen: ${requestUrl}

Du erhältst diese E-Mail, weil deine Fähigkeiten zu dieser Anfrage passen.

Mit freundlichen Grüssen,
Das ${ORG.name} Team
  `.trim(),
})

/**
 * Admin notification email when a new IT-Hilfe request is created
 */
export const adminNewITHilfeRequest = (
  requesterName: string,
  requesterEmail: string,
  requestTitle: string,
  categoryName: string,
  urgencyName: string,
  requestUrl: string
): EmailContent => ({
  subject: `Neue IT-Hilfe Anfrage - ${ORG.name}`,
  html: `
    <!DOCTYPE html>
    <html lang="de">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Neue IT-Hilfe Anfrage</title>
      <style>${BASE_STYLES}</style>
    </head>
    <body>
      <div class="container">
        <div class="header header-blue">
          <h1>Neue IT-Hilfe Anfrage</h1>
        </div>
        <div class="content">
          <p>Eine neue IT-Hilfe Anfrage wurde erstellt.</p>

          <table style="width: 100%; border-collapse: collapse; margin: 15px 0;">
            <tr>
              <td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold;">Anfragender</td>
              <td style="padding: 8px; border-bottom: 1px solid #eee;">${escapeHtml(requesterName)}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold;">E-Mail</td>
              <td style="padding: 8px; border-bottom: 1px solid #eee;">${escapeHtml(requesterEmail)}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold;">Titel</td>
              <td style="padding: 8px; border-bottom: 1px solid #eee;">${escapeHtml(requestTitle)}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold;">Kategorie</td>
              <td style="padding: 8px; border-bottom: 1px solid #eee;">${escapeHtml(categoryName)}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold;">Dringlichkeit</td>
              <td style="padding: 8px; border-bottom: 1px solid #eee;">${escapeHtml(urgencyName)}</td>
            </tr>
          </table>

          <a href="${requestUrl}" class="button button-blue">Anfrage ansehen</a>
        </div>
        <div class="footer">
          <p>Diese E-Mail wurde automatisch generiert.</p>
          <p>${COPYRIGHT_TEXT}</p>
        </div>
      </div>
    </body>
    </html>
  `,
  text: `
Neue IT-Hilfe Anfrage

Anfragender: ${requesterName}
E-Mail: ${requesterEmail}
Titel: ${requestTitle}
Kategorie: ${categoryName}
Dringlichkeit: ${urgencyName}

Anfrage ansehen: ${requestUrl}

Mit freundlichen Grüssen,
${ORG.name} System
  `.trim(),
})

/**
 * Notification email sent to the technician when their offer is accepted
 */
export const itHilfeOfferAccepted = (
  helperName: string,
  requestTitle: string,
  requesterName: string,
  requestUrl: string
): EmailContent => ({
  subject: `Dein Angebot wurde angenommen! - ${ORG.name} IT-Hilfe`,
  html: `
    <!DOCTYPE html>
    <html lang="de">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Angebot angenommen</title>
      <style>${BASE_STYLES}</style>
    </head>
    <body>
      <div class="container">
        <div class="header header-green">
          <h1>Dein Angebot wurde angenommen!</h1>
        </div>
        <div class="content">
          <p>Hallo ${escapeHtml(helperName)},</p>
          <p>Gute Nachrichten! <strong>${escapeHtml(requesterName)}</strong> hat dein Angebot für die folgende Anfrage angenommen:</p>

          <div class="highlight-box">
            <p><strong>${escapeHtml(requestTitle)}</strong></p>
          </div>

          <p><strong>Nächste Schritte:</strong></p>
          <ul>
            <li>Eine Unterhaltung wurde automatisch erstellt</li>
            <li>Klicke auf das Nachrichten-Symbol, um Kontakt aufzunehmen</li>
            <li>Vereinbart einen Termin und die Details</li>
          </ul>

          <a href="${requestUrl}" class="button button-green">Anfrage ansehen</a>
        </div>
        <div class="footer">
          <p>Vielen Dank, dass du der Community hilfst!</p>
          <p>${COPYRIGHT_TEXT}</p>
        </div>
      </div>
    </body>
    </html>
  `,
  text: `
Hallo ${helperName},

Gute Nachrichten! ${requesterName} hat dein Angebot für die folgende Anfrage angenommen:

"${requestTitle}"

Nächste Schritte:
- Eine Unterhaltung wurde automatisch erstellt
- Klicke auf das Nachrichten-Symbol, um Kontakt aufzunehmen
- Vereinbart einen Termin und die Details

Anfrage ansehen: ${requestUrl}

Vielen Dank, dass du der Community hilfst!

Mit freundlichen Grüssen,
Das ${ORG.name} Team
  `.trim(),
})

/**
 * Notification email sent to technicians whose offers were rejected
 * (auto-rejected when another offer is accepted)
 */
/**
 * Notification email sent to the requester when a new offer is received.
 *
 * `acceptUrl` is optional: when present, the email renders a primary
 * "Angebot direkt annehmen" CTA backed by a signed one-use token, so
 * the requester can accept without logging in. The "Angebot ansehen"
 * link is preserved as the secondary action.
 */
export const itHilfeNewOfferReceived = (
  requesterName: string,
  requestTitle: string,
  helperName: string,
  offerMessage: string,
  requestUrl: string,
  acceptUrl?: string
): EmailContent => ({
  subject: `Neues Angebot für deine Anfrage - ${ORG.name} IT-Hilfe`,
  html: `
    <!DOCTYPE html>
    <html lang="de">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Neues Angebot erhalten</title>
      <style>${BASE_STYLES}</style>
    </head>
    <body>
      <div class="container">
        <div class="header header-green">
          <h1>Neues Angebot erhalten!</h1>
        </div>
        <div class="content">
          <p>Hallo ${escapeHtml(requesterName)},</p>
          <p><strong>${escapeHtml(helperName)}</strong> hat ein Angebot für deine Anfrage abgegeben:</p>

          <div class="highlight-box">
            <p><strong>${escapeHtml(requestTitle)}</strong></p>
          </div>

          <p><strong>Nachricht des Technikers:</strong></p>
          <p style="background-color: #f9fafb; padding: 12px; border-radius: 6px; border-left: 3px solid #10b981;">
            ${escapeHtml(offerMessage.length > 300 ? offerMessage.slice(0, 300) + '...' : offerMessage)}
          </p>

          ${acceptUrl ? `
          <a href="${acceptUrl}" class="button button-green">Angebot direkt annehmen</a>
          <p style="margin-top: 16px;">
            <a href="${requestUrl}" style="color: #525252;">Oder zuerst alle Angebote vergleichen →</a>
          </p>
          ` : `
          <a href="${requestUrl}" class="button button-green">Angebot ansehen</a>
          `}
        </div>
        <div class="footer">
          <p>Du erhältst diese E-Mail, weil jemand ein Angebot für deine Anfrage abgegeben hat.</p>
          <p>${COPYRIGHT_TEXT}</p>
        </div>
      </div>
    </body>
    </html>
  `,
  text: `
Hallo ${requesterName},

${helperName} hat ein Angebot für deine Anfrage abgegeben:

"${requestTitle}"

Nachricht des Technikers:
${offerMessage.length > 300 ? offerMessage.slice(0, 300) + '...' : offerMessage}

${acceptUrl ? `Angebot direkt annehmen: ${acceptUrl}

Alle Angebote ansehen: ${requestUrl}` : `Angebot ansehen: ${requestUrl}`}

Mit freundlichen Grüssen,
Das ${ORG.name} Team
  `.trim(),
})

/**
 * Notification email sent to the requester when the helper marks the repair
 * as completed. Prompts them to confirm and leave a review.
 */
export const itHilfeCompleted = (
  requesterName: string,
  requestTitle: string,
  requestUrl: string
): EmailContent => ({
  subject: `Hilfe abgeschlossen - bitte bestätigen und bewerten - ${ORG.name}`,
  html: `
    <!DOCTYPE html>
    <html lang="de">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Hilfe abgeschlossen</title>
      <style>${BASE_STYLES}</style>
    </head>
    <body>
      <div class="container">
        <div class="header header-green">
          <h1>Die Hilfe wurde abgeschlossen</h1>
        </div>
        <div class="content">
          <p>Hallo ${escapeHtml(requesterName)},</p>
          <p>Der Techniker hat deine Anfrage als abgeschlossen markiert:</p>

          <div class="highlight-box">
            <p><strong>${escapeHtml(requestTitle)}</strong></p>
          </div>

          <p>Bitte bestätige, dass die Hilfe erfolgreich war, und gib eine kurze Bewertung ab. Dein Feedback hilft der Community, gute Techniker zu finden.</p>

          <a href="${requestUrl}" class="button button-green">Bestätigen &amp; bewerten</a>
        </div>
        <div class="footer">
          <p>Vielen Dank, dass du Teil der ${ORG.name}-Community bist!</p>
          <p>${COPYRIGHT_TEXT}</p>
        </div>
      </div>
    </body>
    </html>
  `,
  text: `
Hallo ${requesterName},

Der Techniker hat deine Anfrage als abgeschlossen markiert:

"${requestTitle}"

Bitte bestätige, dass die Hilfe erfolgreich war, und gib eine kurze Bewertung ab.
Dein Feedback hilft der Community, gute Techniker zu finden.

Bestätigen & bewerten: ${requestUrl}

Mit freundlichen Grüssen,
Das ${ORG.name} Team
  `.trim(),
})

/**
 * Notification email sent to the helper when the requester submits a review.
 */
export const itHilfeReviewReceived = (
  helperName: string,
  requestTitle: string,
  rating: number,
  reviewText: string,
  requestUrl: string
): EmailContent => ({
  subject: `Du hast eine neue Bewertung erhalten - ${ORG.name} IT-Hilfe`,
  html: `
    <!DOCTYPE html>
    <html lang="de">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Neue Bewertung erhalten</title>
      <style>${BASE_STYLES}</style>
    </head>
    <body>
      <div class="container">
        <div class="header header-green">
          <h1>Du hast eine Bewertung erhalten</h1>
        </div>
        <div class="content">
          <p>Hallo ${escapeHtml(helperName)},</p>
          <p>Vielen Dank für deine Hilfe! Der Anfragende hat deinen Einsatz bewertet:</p>

          <div class="highlight-box">
            <p><strong>${escapeHtml(requestTitle)}</strong></p>
            <p style="font-size: 22px; color: #f59e0b; margin: 8px 0;">
              ${'★'.repeat(rating)}${'☆'.repeat(5 - rating)}
              <span style="color: #374151; font-size: 16px;">(${rating}/5)</span>
            </p>
            ${reviewText ? `<p style="font-style: italic; color: #4b5563;">&ldquo;${escapeHtml(reviewText)}&rdquo;</p>` : ''}
          </div>

          <p>Dank dir wird Technik wieder nutzbar gemacht - herzlichen Dank für dein Engagement!</p>

          <a href="${requestUrl}" class="button button-green">Bewertung ansehen</a>
        </div>
        <div class="footer">
          <p>Vielen Dank, dass du der Community hilfst!</p>
          <p>${COPYRIGHT_TEXT}</p>
        </div>
      </div>
    </body>
    </html>
  `,
  text: `
Hallo ${helperName},

Vielen Dank für deine Hilfe! Der Anfragende hat deinen Einsatz bewertet:

"${requestTitle}"
Bewertung: ${rating}/5 Sterne
${reviewText ? `\n"${reviewText}"\n` : ''}
Dank dir wird Technik wieder nutzbar gemacht - herzlichen Dank für dein Engagement!

Bewertung ansehen: ${requestUrl}

Mit freundlichen Grüssen,
Das ${ORG.name} Team
  `.trim(),
})

export const itHilfeOfferRejected = (
  helperName: string,
  requestTitle: string,
  requestUrl: string
): EmailContent => ({
  subject: `Anfrage vergeben - ${ORG.name} IT-Hilfe`,
  html: `
    <!DOCTYPE html>
    <html lang="de">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Anfrage vergeben</title>
      <style>${BASE_STYLES}</style>
    </head>
    <body>
      <div class="container">
        <div class="header header-green">
          <h1>Anfrage vergeben</h1>
        </div>
        <div class="content">
          <p>Hallo ${escapeHtml(helperName)},</p>
          <p>Die folgende Anfrage wurde an einen anderen Techniker vergeben:</p>

          <div class="highlight-box">
            <p><strong>${escapeHtml(requestTitle)}</strong></p>
          </div>

          <p>Vielen Dank für dein Angebot! Es gibt bestimmt bald wieder passende Anfragen für dich.</p>

          <a href="/it-hilfe" class="button button-green">Weitere Anfragen ansehen</a>
        </div>
        <div class="footer">
          <p>Vielen Dank für dein Engagement in der Community!</p>
          <p>${COPYRIGHT_TEXT}</p>
        </div>
      </div>
    </body>
    </html>
  `,
  text: `
Hallo ${helperName},

Die folgende Anfrage wurde an einen anderen Techniker vergeben:

"${requestTitle}"

Vielen Dank für dein Angebot! Es gibt bestimmt bald wieder passende Anfragen für dich.

Mit freundlichen Grüssen,
Das ${ORG.name} Team
  `.trim(),
})
