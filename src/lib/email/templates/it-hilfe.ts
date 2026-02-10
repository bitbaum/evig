/**
 * IT-Hilfe Email Templates
 *
 * Templates for IT-Hilfe request confirmation and admin notifications.
 */

import type { EmailContent } from '../types'
import { BASE_STYLES, COPYRIGHT_TEXT } from './base-styles'

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
  subject: 'Deine IT-Hilfe Anfrage wurde erstellt - RevampIT',
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
          <p>Hallo ${userName},</p>
          <p>Deine IT-Hilfe Anfrage wurde erfolgreich erstellt!</p>

          <p><strong>Titel:</strong> ${requestTitle}</p>
          <p><strong>Kategorie:</strong> ${categoryName}</p>

          ${aiDiagnosis ? `
          <div class="highlight-box">
            <p><strong>Unsere KI-Ersteinschätzung:</strong></p>
            <p>${aiDiagnosis}</p>
            <p style="font-size: 12px; color: #666; margin-top: 10px;">
              Dies ist eine automatische Ersteinschätzung und ersetzt keine professionelle Diagnose.
            </p>
          </div>
          ` : ''}

          <div style="background-color: #f0fdf4; padding: 15px; border-radius: 5px; margin: 15px 0;">
            <p><strong>Über RevampIT</strong></p>
            <p>Wir sind ein Schweizer Non-Profit-Verein für nachhaltige IT. Reparieren statt Wegwerfen ist unser Motto.</p>
            <p>Du kannst dein Gerät auch direkt in unsere Werkstatt bringen:</p>
            <p><strong>RevampIT Werkstatt</strong><br>
            Birmensdorferstr. 379, 8055 Zürich</p>
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
RevampIT Werkstatt - Birmensdorferstr. 379, 8055 Zürich

Was passiert als Nächstes?
- Techniker aus der Community werden deine Anfrage sehen
- Du wirst benachrichtigt, wenn jemand ein Angebot macht
- Du entscheidest, welches Angebot du annimmst

Anfrage ansehen: ${requestUrl}

Mit freundlichen Grüssen,
Das RevampIT Team
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
  subject: 'Neue passende Anfrage für dich - RevampIT IT-Hilfe',
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
          <p>Hallo ${helperName},</p>
          <p>Es gibt eine neue IT-Hilfe Anfrage, die zu deinen Fähigkeiten passt!</p>

          <table style="width: 100%; border-collapse: collapse; margin: 15px 0;">
            <tr>
              <td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold;">Titel</td>
              <td style="padding: 8px; border-bottom: 1px solid #eee;">${requestTitle}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold;">Kategorie</td>
              <td style="padding: 8px; border-bottom: 1px solid #eee;">${categoryName}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold;">Dringlichkeit</td>
              <td style="padding: 8px; border-bottom: 1px solid #eee;">${urgencyName}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold;">Kanton</td>
              <td style="padding: 8px; border-bottom: 1px solid #eee;">${canton}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold;">Service-Art</td>
              <td style="padding: 8px; border-bottom: 1px solid #eee;">${serviceTypeName}</td>
            </tr>
          </table>

          <p><strong>Deine passenden Fähigkeiten:</strong></p>
          <div style="margin: 10px 0;">
            ${matchingSkillNames.map(skill => `<span style="display: inline-block; background-color: #dcfce7; color: #166534; padding: 4px 12px; border-radius: 12px; font-size: 13px; margin: 3px 2px;">${skill}</span>`).join('')}
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
Das RevampIT Team
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
  subject: 'Neue IT-Hilfe Anfrage - RevampIT',
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
              <td style="padding: 8px; border-bottom: 1px solid #eee;">${requesterName}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold;">E-Mail</td>
              <td style="padding: 8px; border-bottom: 1px solid #eee;">${requesterEmail}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold;">Titel</td>
              <td style="padding: 8px; border-bottom: 1px solid #eee;">${requestTitle}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold;">Kategorie</td>
              <td style="padding: 8px; border-bottom: 1px solid #eee;">${categoryName}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold;">Dringlichkeit</td>
              <td style="padding: 8px; border-bottom: 1px solid #eee;">${urgencyName}</td>
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
RevampIT System
  `.trim(),
})
