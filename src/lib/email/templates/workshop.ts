/**
 * Workshop Email Templates
 *
 * Templates for workshop registration, reminders, cancellations, proposals, and feedback.
 */

import { ORG } from '@\/config\/org';
import type { EmailContent } from '../types';
import { BASE_STYLES, COPYRIGHT_TEXT, AUTO_GENERATED_TEXT, createTextFooter } from './base-styles';
import { escapeHtml } from '@/lib/utils/escape-html';
import { WORKSHOP_REGISTRATION_STATUS } from '@/config/workshop-registration-status';

// Every `${X}` interpolated into an html: body that comes from a user
// (name/workshopTitle/workshopDate/workshopLocation/instructor/reason/
// notes/refundInfo) gets escaped. Subject + text bodies stay raw.

export const workshopRegistrationConfirmation = (
  name: string,
  workshopTitle: string,
  workshopDate: string,
  workshopLocation: string,
  priceCents: number,
  workshopUrl: string
): EmailContent => ({
  subject: `Workshop-Anmeldung bestätigt - ${ORG.name}`,
  html: `
    <!DOCTYPE html>
    <html lang="de">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Workshop-Anmeldung bestätigt</title>
      <style>${BASE_STYLES}
        .details { background-color: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header header-green">
          <h1>🎓 Workshop-Anmeldung bestätigt</h1>
        </div>
        <div class="content">
          <h2>Hallo ${escapeHtml(name)},</h2>
          <p>Vielen Dank für deine Anmeldung! Du bist nun für den folgenden Workshop angemeldet:</p>
          <div class="details">
            <p><strong>Workshop:</strong> ${escapeHtml(workshopTitle)}</p>
            <p><strong>Datum:</strong> ${escapeHtml(workshopDate)}</p>
            <p><strong>Ort:</strong> ${escapeHtml(workshopLocation)}</p>
            ${priceCents > 0 ? `<p><strong>Preis:</strong> CHF ${(priceCents / 100).toFixed(2)}</p>` : '<p><strong>Preis:</strong> Kostenlos</p>'}
          </div>
          <p>Bitte merk dir den Termin vor. Du erhältst rechtzeitig vor dem Workshop eine Erinnerung mit weiteren Details.</p>
          <a href="${workshopUrl}" class="button button-green">Workshop-Details anzeigen</a>
          <p><strong>Wichtig:</strong> Falls du nicht teilnehmen kannst, bitten wir dich, dich rechtzeitig abzumelden, damit andere Interessierte deinen Platz einnehmen können.</p>
        </div>
        <div class="footer">
          <p>${AUTO_GENERATED_TEXT}</p>
          <p>${COPYRIGHT_TEXT}</p>
        </div>
      </div>
    </body>
    </html>
  `,
  text: `
Hallo ${name},

Vielen Dank für deine Anmeldung! Du bist nun für den folgenden Workshop angemeldet:

Workshop: ${workshopTitle}
Datum: ${workshopDate}
Ort: ${workshopLocation}
${priceCents > 0 ? `Preis: CHF ${(priceCents / 100).toFixed(2)}` : 'Preis: Kostenlos'}

Bitte merk dir den Termin vor. Du erhältst rechtzeitig vor dem Workshop eine Erinnerung mit weiteren Details.

Workshop-Details: ${workshopUrl}

Wichtig: Falls du nicht teilnehmen kannst, bitten wir dich, dich rechtzeitig abzumelden.
${createTextFooter()}
  `.trim(),
});

export const workshopRegistrationStatusUpdate = (
  name: string,
  workshopTitle: string,
  workshopDate: string,
  newStatus: typeof WORKSHOP_REGISTRATION_STATUS.CONFIRMED | typeof WORKSHOP_REGISTRATION_STATUS.CANCELLED | typeof WORKSHOP_REGISTRATION_STATUS.WAITLIST,
  reason?: string
): EmailContent => ({
  subject: `Workshop-Anmeldung ${newStatus === WORKSHOP_REGISTRATION_STATUS.CONFIRMED ? 'bestätigt' : newStatus === WORKSHOP_REGISTRATION_STATUS.CANCELLED ? 'storniert' : 'Warteliste'} - ${ORG.name}`,
  html: `
    <!DOCTYPE html>
    <html lang="de">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Workshop-Anmeldung Status</title>
      <style>${BASE_STYLES}</style>
    </head>
    <body>
      <div class="container">
        <div class="header ${newStatus === WORKSHOP_REGISTRATION_STATUS.CONFIRMED ? 'header-green' : newStatus === WORKSHOP_REGISTRATION_STATUS.CANCELLED ? 'header-red' : 'header-orange'}">
          <h1>${newStatus === WORKSHOP_REGISTRATION_STATUS.CONFIRMED ? '✅ Anmeldung bestätigt' : newStatus === WORKSHOP_REGISTRATION_STATUS.CANCELLED ? '❌ Anmeldung storniert' : '⏳ Warteliste'}</h1>
        </div>
        <div class="content">
          <h2>Hallo ${escapeHtml(name)},</h2>
          <p>Der Status deiner Workshop-Anmeldung wurde aktualisiert.</p>
          <p><strong>Workshop:</strong> ${escapeHtml(workshopTitle)}</p>
          <p><strong>Datum:</strong> ${escapeHtml(workshopDate)}</p>
          <p><strong>Status:</strong> ${newStatus === WORKSHOP_REGISTRATION_STATUS.CONFIRMED ? 'Bestätigt' : newStatus === WORKSHOP_REGISTRATION_STATUS.CANCELLED ? 'Storniert' : 'Auf der Warteliste'}</p>
          ${reason ? `<p><strong>Hinweis:</strong> ${escapeHtml(reason)}</p>` : ''}
          ${newStatus === WORKSHOP_REGISTRATION_STATUS.CONFIRMED ? '<p>Wir freuen uns auf deine Teilnahme! Du erhältst rechtzeitig vor dem Workshop eine Erinnerung.</p>' : ''}
          ${newStatus === WORKSHOP_REGISTRATION_STATUS.WAITLIST ? '<p>Du wirst automatisch benachrichtigt, sobald ein Platz frei wird.</p>' : ''}
          ${newStatus === WORKSHOP_REGISTRATION_STATUS.CANCELLED ? '<p>Falls du Fragen hast, kannst du uns jederzeit kontaktieren.</p>' : ''}
        </div>
        <div class="footer">
          <p>${AUTO_GENERATED_TEXT}</p>
          <p>${COPYRIGHT_TEXT}</p>
        </div>
      </div>
    </body>
    </html>
  `,
  text: `
Hallo ${name},

Der Status deiner Workshop-Anmeldung wurde aktualisiert.

Workshop: ${workshopTitle}
Datum: ${workshopDate}
Status: ${newStatus === WORKSHOP_REGISTRATION_STATUS.CONFIRMED ? 'Bestätigt' : newStatus === WORKSHOP_REGISTRATION_STATUS.CANCELLED ? 'Storniert' : 'Auf der Warteliste'}
${reason ? `Hinweis: ${reason}` : ''}

${newStatus === WORKSHOP_REGISTRATION_STATUS.CONFIRMED ? 'Wir freuen uns auf deine Teilnahme!' : ''}
${newStatus === WORKSHOP_REGISTRATION_STATUS.WAITLIST ? 'Du wirst automatisch benachrichtigt, sobald ein Platz frei wird.' : ''}
${newStatus === WORKSHOP_REGISTRATION_STATUS.CANCELLED ? 'Falls du Fragen hast, kannst du uns jederzeit kontaktieren.' : ''}
${createTextFooter()}
  `.trim(),
});

export const workshopReminder = (
  name: string,
  workshopTitle: string,
  workshopDate: string,
  workshopTime: string,
  workshopLocation: string,
  instructor: string | null,
  workshopUrl: string
): EmailContent => ({
  subject: `Erinnerung: Workshop morgen - ${workshopTitle} - ${ORG.name}`,
  html: `
    <!DOCTYPE html>
    <html lang="de">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Workshop-Erinnerung</title>
      <style>${BASE_STYLES}
        .details { background-color: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #3b82f6; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header header-blue">
          <h1>📅 Workshop-Erinnerung</h1>
        </div>
        <div class="content">
          <h2>Hallo ${escapeHtml(name)},</h2>
          <p>Wir möchten dich an deinen bevorstehenden Workshop erinnern:</p>
          <div class="details">
            <p><strong>📚 Workshop:</strong> ${escapeHtml(workshopTitle)}</p>
            <p><strong>📅 Datum:</strong> ${escapeHtml(workshopDate)}</p>
            <p><strong>🕐 Uhrzeit:</strong> ${escapeHtml(workshopTime)}</p>
            <p><strong>📍 Ort:</strong> ${escapeHtml(workshopLocation)}</p>
            ${instructor ? `<p><strong>👨‍🏫 Instruktor:</strong> ${escapeHtml(instructor)}</p>` : ''}
          </div>
          <p><strong>Tipps für deine Vorbereitung:</strong></p>
          <ul>
            <li>Bring deinen eigenen Laptop mit (falls zutreffend)</li>
            <li>Erscheine bitte 10 Minuten vor Beginn</li>
            <li>Notiere eventuelle Fragen, die du stellen möchtest</li>
          </ul>
          <a href="${workshopUrl}" class="button button-blue">Workshop-Details</a>
          <p>Falls du nicht teilnehmen kannst, bitten wir dich, dich rechtzeitig abzumelden.</p>
        </div>
        <div class="footer">
          <p>${AUTO_GENERATED_TEXT}</p>
          <p>${COPYRIGHT_TEXT}</p>
        </div>
      </div>
    </body>
    </html>
  `,
  text: `
Hallo ${name},

Wir möchten dich an deinen bevorstehenden Workshop erinnern:

Workshop: ${workshopTitle}
Datum: ${workshopDate}
Uhrzeit: ${workshopTime}
Ort: ${workshopLocation}
${instructor ? `Instruktor: ${instructor}` : ''}

Tipps für deine Vorbereitung:
- Bring deinen eigenen Laptop mit (falls zutreffend)
- Erscheine bitte 10 Minuten vor Beginn
- Notiere eventuelle Fragen, die du stellen möchtest

Workshop-Details: ${workshopUrl}

Falls du nicht teilnehmen kannst, bitten wir dich, dich rechtzeitig abzumelden.
${createTextFooter()}
  `.trim(),
});

export const workshopCancellation = (
  name: string,
  workshopTitle: string,
  workshopDate: string,
  reason: string | null,
  refundInfo: string | null
): EmailContent => ({
  subject: `Workshop abgesagt: ${workshopTitle} - ${ORG.name}`,
  html: `
    <!DOCTYPE html>
    <html lang="de">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Workshop abgesagt</title>
      <style>${BASE_STYLES}
        .notice { background-color: #fef2f2; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #dc2626; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header header-red">
          <h1>Workshop abgesagt</h1>
        </div>
        <div class="content">
          <h2>Hallo ${escapeHtml(name)},</h2>
          <p>Leider müssen wir dir mitteilen, dass der folgende Workshop abgesagt wurde:</p>
          <div class="notice">
            <p><strong>Workshop:</strong> ${escapeHtml(workshopTitle)}</p>
            <p><strong>Geplantes Datum:</strong> ${escapeHtml(workshopDate)}</p>
            ${reason ? `<p><strong>Grund:</strong> ${escapeHtml(reason)}</p>` : ''}
          </div>
          <p>Wir bedauern die Unannehmlichkeiten und hoffen, dich bei einem zukünftigen Workshop begrüssen zu dürfen.</p>
          ${refundInfo ? `<p><strong>Rückerstattung:</strong> ${escapeHtml(refundInfo)}</p>` : ''}
          <p>Bei Fragen stehen wir dir gerne zur Verfügung.</p>
        </div>
        <div class="footer">
          <p>${AUTO_GENERATED_TEXT}</p>
          <p>${COPYRIGHT_TEXT}</p>
        </div>
      </div>
    </body>
    </html>
  `,
  text: `
Hallo ${name},

Leider müssen wir dir mitteilen, dass der folgende Workshop abgesagt wurde:

Workshop: ${workshopTitle}
Geplantes Datum: ${workshopDate}
${reason ? `Grund: ${reason}` : ''}

Wir bedauern die Unannehmlichkeiten und hoffen, dich bei einem zukünftigen Workshop begrüssen zu dürfen.

${refundInfo ? `Rückerstattung: ${refundInfo}` : ''}

Bei Fragen stehen wir dir gerne zur Verfügung.
${createTextFooter()}
  `.trim(),
});

export const workshopFeedbackRequest = (
  name: string,
  workshopTitle: string,
  workshopDate: string,
  feedbackUrl: string
): EmailContent => ({
  subject: `Wie war der Workshop? Ihr Feedback zählt! - ${ORG.name}`,
  html: `
    <!DOCTYPE html>
    <html lang="de">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Workshop-Feedback</title>
      <style>${BASE_STYLES}</style>
    </head>
    <body>
      <div class="container">
        <div class="header header-purple">
          <h1>⭐ Dein Feedback ist gefragt!</h1>
        </div>
        <div class="content">
          <h2>Hallo ${escapeHtml(name)},</h2>
          <p>Wir hoffen, du hattest eine gute Erfahrung beim Workshop:</p>
          <p><strong>${escapeHtml(workshopTitle)}</strong> am ${escapeHtml(workshopDate)}</p>
          <p>Deine Meinung ist uns wichtig! Mit deinem Feedback hilfst du uns, unsere Workshops kontinuierlich zu verbessern und anderen Teilnehmern bei ihrer Entscheidung.</p>
          <p>Es dauert nur 2 Minuten:</p>
          <a href="${feedbackUrl}" class="button button-purple">Jetzt Feedback geben</a>
          <p>Vielen Dank für Deine Unterstützung!</p>
        </div>
        <div class="footer">
          <p>${AUTO_GENERATED_TEXT}</p>
          <p>${COPYRIGHT_TEXT}</p>
        </div>
      </div>
    </body>
    </html>
  `,
  text: `
Hallo ${name},

Wir hoffen, du hattest eine gute Erfahrung beim Workshop:
${workshopTitle} am ${workshopDate}

Deine Meinung ist uns wichtig! Mit deinem Feedback hilfst du uns, unsere Workshops kontinuierlich zu verbessern.

Feedback geben: ${feedbackUrl}

Vielen Dank für Deine Unterstützung!
${createTextFooter()}
  `.trim(),
});

export const workshopProposalSubmitted = (
  name: string,
  workshopTitle: string,
  proposalId: string
): EmailContent => ({
  subject: `Workshop-Vorschlag eingereicht - ${ORG.name}`,
  html: `
    <!DOCTYPE html>
    <html lang="de">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Workshop-Vorschlag eingereicht</title>
      <style>${BASE_STYLES}</style>
    </head>
    <body>
      <div class="container">
        <div class="header header-green">
          <h1>Workshop-Vorschlag eingereicht</h1>
        </div>
        <div class="content">
          <h2>Hallo ${escapeHtml(name)},</h2>
          <p>Vielen Dank für deinen Workshop-Vorschlag bei ${ORG.name}! Wir haben deine Einreichung erhalten.</p>
          <p><strong>Workshop-Titel:</strong> ${escapeHtml(workshopTitle)}</p>
          <p><strong>Vorschlags-ID:</strong> ${escapeHtml(proposalId)}</p>
          <p>Unser Team wird deinen Vorschlag zeitnah prüfen. Der Prüfungsprozess umfasst:</p>
          <ul>
            <li>Überprüfung der Workshop-Inhalte</li>
            <li>Bewertung der Zielgruppe und des Formats</li>
            <li>Abstimmung mit unserem Workshop-Kalender</li>
          </ul>
          <p>Du erhältst eine Benachrichtigung, sobald wir unsere Prüfung abgeschlossen haben. Dies kann bis zu 5 Werktage dauern.</p>
        </div>
        <div class="footer">
          <p>${AUTO_GENERATED_TEXT}</p>
          <p>${COPYRIGHT_TEXT}</p>
        </div>
      </div>
    </body>
    </html>
  `,
  text: `
Hallo ${name},

Vielen Dank für deinen Workshop-Vorschlag bei ${ORG.name}! Wir haben deine Einreichung erhalten.

Workshop-Titel: ${workshopTitle}
Vorschlags-ID: ${proposalId}

Unser Team wird deinen Vorschlag zeitnah prüfen. Der Prüfungsprozess umfasst:
- Überprüfung der Workshop-Inhalte
- Bewertung der Zielgruppe und des Formats
- Abstimmung mit unserem Workshop-Kalender

Du erhältst eine Benachrichtigung, sobald wir unsere Prüfung abgeschlossen haben.
${createTextFooter()}
  `.trim(),
});

export const workshopProposalApproved = (
  name: string,
  workshopTitle: string
): EmailContent => ({
  subject: `Workshop-Vorschlag genehmigt - ${ORG.name}`,
  html: `
    <!DOCTYPE html>
    <html lang="de">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Workshop-Vorschlag genehmigt</title>
      <style>${BASE_STYLES}</style>
    </head>
    <body>
      <div class="container">
        <div class="header header-green">
          <h1>Workshop-Vorschlag genehmigt</h1>
        </div>
        <div class="content">
          <h2>Hallo ${escapeHtml(name)},</h2>
          <p>Gute Nachrichten! Dein Workshop-Vorschlag wurde genehmigt.</p>
          <p><strong>Workshop:</strong> ${escapeHtml(workshopTitle)}</p>
          <p>Unser Team wird deinen Workshop nun für die Planung vorbereiten. Du erhältst weitere Informationen zu Terminen und Details.</p>
          <p>Vielen Dank für deinen Beitrag zur ${ORG.name} Community!</p>
        </div>
        <div class="footer">
          <p>${AUTO_GENERATED_TEXT}</p>
          <p>${COPYRIGHT_TEXT}</p>
        </div>
      </div>
    </body>
    </html>
  `,
  text: `
Hallo ${name},

Gute Nachrichten! Dein Workshop-Vorschlag wurde genehmigt.

Workshop: ${workshopTitle}

Unser Team wird deinen Workshop nun für die Planung vorbereiten. Du erhältst weitere Informationen zu Terminen und Details.

Vielen Dank für deinen Beitrag zur ${ORG.name} Community!
${createTextFooter()}
  `.trim(),
});

export const workshopProposalRejected = (
  name: string,
  workshopTitle: string,
  reason: string
): EmailContent => ({
  subject: `Workshop-Vorschlag abgelehnt - ${ORG.name}`,
  html: `
    <!DOCTYPE html>
    <html lang="de">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Workshop-Vorschlag abgelehnt</title>
      <style>${BASE_STYLES}</style>
    </head>
    <body>
      <div class="container">
        <div class="header header-red">
          <h1>Workshop-Vorschlag abgelehnt</h1>
        </div>
        <div class="content">
          <h2>Hallo ${escapeHtml(name)},</h2>
          <p>Leider können wir deinen Workshop-Vorschlag derzeit nicht annehmen.</p>
          <p><strong>Workshop:</strong> ${escapeHtml(workshopTitle)}</p>
          <p><strong>Grund:</strong> ${escapeHtml(reason)}</p>
          <p>Wir schätzen dein Engagement und ermutigen dich, weitere Vorschläge einzureichen.</p>
        </div>
        <div class="footer">
          <p>${AUTO_GENERATED_TEXT}</p>
          <p>${COPYRIGHT_TEXT}</p>
        </div>
      </div>
    </body>
    </html>
  `,
  text: `
Hallo ${name},

Leider können wir deinen Workshop-Vorschlag derzeit nicht annehmen.

Workshop: ${workshopTitle}
Grund: ${reason}

Wir schätzen dein Engagement und ermutigen dich, weitere Vorschläge einzureichen.
${createTextFooter()}
  `.trim(),
});

export const workshopProposalChangesRequested = (
  name: string,
  workshopTitle: string,
  notes: string
): EmailContent => ({
  subject: `Änderungen für Workshop-Vorschlag angefragt - ${ORG.name}`,
  html: `
    <!DOCTYPE html>
    <html lang="de">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Änderungen angefragt</title>
      <style>${BASE_STYLES}</style>
    </head>
    <body>
      <div class="container">
        <div class="header header-orange">
          <h1>Änderungen angefragt</h1>
        </div>
        <div class="content">
          <h2>Hallo ${escapeHtml(name)},</h2>
          <p>Unser Team hat deinen Workshop-Vorschlag überprüft und einige Änderungsvorschläge.</p>
          <p><strong>Workshop:</strong> ${escapeHtml(workshopTitle)}</p>
          <p><strong>Anmerkungen:</strong></p>
          <div style="background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 15px 0;">
            ${escapeHtml(notes).replace(/\n/g, '<br>')}
          </div>
          <p>Bitte überarbeite deinen Vorschlag entsprechend und reiche ihn erneut ein.</p>
        </div>
        <div class="footer">
          <p>${AUTO_GENERATED_TEXT}</p>
          <p>${COPYRIGHT_TEXT}</p>
        </div>
      </div>
    </body>
    </html>
  `,
  text: `
Hallo ${name},

Unser Team hat deinen Workshop-Vorschlag überprüft und einige Änderungsvorschläge.

Workshop: ${workshopTitle}

Anmerkungen:
${notes}

Bitte überarbeite deinen Vorschlag entsprechend und reiche ihn erneut ein.
${createTextFooter()}
  `.trim(),
});
