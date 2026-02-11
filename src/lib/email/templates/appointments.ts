/**
 * Appointment Email Templates
 *
 * Templates for the repair booking system: new bookings, quotes, status updates, admin alerts.
 */

import type { EmailContent } from '../types'
import { BASE_STYLES, COPYRIGHT_TEXT } from './base-styles'

/**
 * Email to repairer when a new booking is created
 */
export const appointmentNewBooking = (
  repairerName: string,
  customerName: string,
  serviceName: string,
  description: string,
  appointmentUrl: string
): EmailContent => ({
  subject: 'Neuer Reparaturauftrag - RevampIT',
  html: `
    <!DOCTYPE html>
    <html lang="de">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Neuer Reparaturauftrag</title>
      <style>${BASE_STYLES}</style>
    </head>
    <body>
      <div class="container">
        <div class="header header-green">
          <h1>Neuer Reparaturauftrag</h1>
        </div>
        <div class="content">
          <p>Hallo ${repairerName},</p>
          <p>Sie haben einen neuen Reparaturauftrag erhalten!</p>

          <table style="width: 100%; border-collapse: collapse; margin: 15px 0;">
            <tr>
              <td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold;">Kunde</td>
              <td style="padding: 8px; border-bottom: 1px solid #eee;">${customerName}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold;">Service</td>
              <td style="padding: 8px; border-bottom: 1px solid #eee;">${serviceName}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold;">Beschreibung</td>
              <td style="padding: 8px; border-bottom: 1px solid #eee;">${description}</td>
            </tr>
          </table>

          <p>Bitte bestätigen oder lehnen Sie den Auftrag innerhalb von 24 Stunden ab.</p>

          <a href="${appointmentUrl}" class="button button-green">Auftrag ansehen</a>
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
Hallo ${repairerName},

Sie haben einen neuen Reparaturauftrag erhalten!

Kunde: ${customerName}
Service: ${serviceName}
Beschreibung: ${description}

Bitte bestätigen oder lehnen Sie den Auftrag innerhalb von 24 Stunden ab.

Auftrag ansehen: ${appointmentUrl}

Mit freundlichen Grüssen,
Das RevampIT Team
  `.trim(),
})

/**
 * Email to customer when repairer sends a quote
 */
export const appointmentQuoteReceived = (
  customerName: string,
  repairerName: string,
  priceCHF: number,
  diagnosisNotes: string | null,
  appointmentUrl: string
): EmailContent => ({
  subject: 'Neues Angebot für Ihre Reparatur - RevampIT',
  html: `
    <!DOCTYPE html>
    <html lang="de">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Angebot erhalten</title>
      <style>${BASE_STYLES}</style>
    </head>
    <body>
      <div class="container">
        <div class="header header-purple">
          <h1>Angebot erhalten</h1>
        </div>
        <div class="content">
          <p>Hallo ${customerName},</p>
          <p>${repairerName} hat Ihnen ein Angebot für Ihre Reparatur geschickt.</p>

          <div style="background-color: #f5f3ff; padding: 20px; border-radius: 8px; margin: 15px 0; text-align: center;">
            <p style="font-size: 14px; color: #6b21a8; margin: 0;">Preis</p>
            <p style="font-size: 32px; font-weight: bold; color: #581c87; margin: 5px 0;">CHF ${priceCHF}</p>
          </div>

          ${diagnosisNotes ? `
          <div class="highlight-box">
            <p><strong>Diagnose:</strong></p>
            <p>${diagnosisNotes}</p>
          </div>
          ` : ''}

          <p>Bitte bestätigen oder lehnen Sie das Angebot ab.</p>

          <a href="${appointmentUrl}" class="button button-purple">Angebot ansehen</a>
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
Hallo ${customerName},

${repairerName} hat Ihnen ein Angebot für Ihre Reparatur geschickt.

Preis: CHF ${priceCHF}
${diagnosisNotes ? `Diagnose: ${diagnosisNotes}\n` : ''}
Bitte bestätigen oder lehnen Sie das Angebot ab.

Angebot ansehen: ${appointmentUrl}

Mit freundlichen Grüssen,
Das RevampIT Team
  `.trim(),
})

/**
 * Generic status update email to either customer or repairer
 */
export const appointmentStatusUpdate = (
  recipientName: string,
  otherPartyName: string,
  newStatusLabel: string,
  serviceName: string,
  appointmentUrl: string
): EmailContent => ({
  subject: `Reparaturstatus: ${newStatusLabel} - RevampIT`,
  html: `
    <!DOCTYPE html>
    <html lang="de">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Statusänderung</title>
      <style>${BASE_STYLES}</style>
    </head>
    <body>
      <div class="container">
        <div class="header header-blue">
          <h1>Statusänderung</h1>
        </div>
        <div class="content">
          <p>Hallo ${recipientName},</p>
          <p>Der Status Ihres Reparaturauftrags wurde aktualisiert.</p>

          <table style="width: 100%; border-collapse: collapse; margin: 15px 0;">
            <tr>
              <td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold;">Service</td>
              <td style="padding: 8px; border-bottom: 1px solid #eee;">${serviceName}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold;">Neuer Status</td>
              <td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>${newStatusLabel}</strong></td>
            </tr>
            <tr>
              <td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold;">Andere Partei</td>
              <td style="padding: 8px; border-bottom: 1px solid #eee;">${otherPartyName}</td>
            </tr>
          </table>

          <a href="${appointmentUrl}" class="button button-blue">Details ansehen</a>
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
Hallo ${recipientName},

Der Status Ihres Reparaturauftrags wurde aktualisiert.

Service: ${serviceName}
Neuer Status: ${newStatusLabel}
Andere Partei: ${otherPartyName}

Details ansehen: ${appointmentUrl}

Mit freundlichen Grüssen,
Das RevampIT Team
  `.trim(),
})

/**
 * Admin alert when a booking has no assigned repairer
 */
export const appointmentUnassignedAlert = (
  adminName: string,
  customerName: string,
  serviceName: string,
  description: string,
  urgency: string,
  adminUrl: string
): EmailContent => ({
  subject: 'Unzugewiesener Reparaturauftrag - RevampIT',
  html: `
    <!DOCTYPE html>
    <html lang="de">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Unzugewiesener Auftrag</title>
      <style>${BASE_STYLES}</style>
    </head>
    <body>
      <div class="container">
        <div class="header header-orange">
          <h1>Unzugewiesener Auftrag</h1>
        </div>
        <div class="content">
          <p>Hallo ${adminName},</p>
          <p>Ein neuer Reparaturauftrag wurde ohne Reparateur erstellt und benötigt manuelle Zuweisung.</p>

          <table style="width: 100%; border-collapse: collapse; margin: 15px 0;">
            <tr>
              <td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold;">Kunde</td>
              <td style="padding: 8px; border-bottom: 1px solid #eee;">${customerName}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold;">Service</td>
              <td style="padding: 8px; border-bottom: 1px solid #eee;">${serviceName}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold;">Beschreibung</td>
              <td style="padding: 8px; border-bottom: 1px solid #eee;">${description}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold;">Dringlichkeit</td>
              <td style="padding: 8px; border-bottom: 1px solid #eee;">${urgency}</td>
            </tr>
          </table>

          <a href="${adminUrl}" class="button button-orange">Auftrag zuweisen</a>
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
Hallo ${adminName},

Ein neuer Reparaturauftrag wurde ohne Reparateur erstellt und benötigt manuelle Zuweisung.

Kunde: ${customerName}
Service: ${serviceName}
Beschreibung: ${description}
Dringlichkeit: ${urgency}

Auftrag zuweisen: ${adminUrl}

Mit freundlichen Grüssen,
RevampIT System
  `.trim(),
})
