/**
 * Workshop Email Templates
 *
 * Templates for workshop registration, reminders, cancellations, proposals, and feedback.
 */

import type { EmailContent } from '../types';
import { BASE_STYLES, COPYRIGHT_TEXT, AUTO_GENERATED_TEXT, createTextFooter } from './base-styles';

export const workshopRegistrationConfirmation = (
  name: string,
  workshopTitle: string,
  workshopDate: string,
  workshopLocation: string,
  priceCents: number,
  workshopUrl: string
): EmailContent => ({
  subject: 'Workshop-Anmeldung bestätigt - RevampIT',
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
          <h2>Hallo ${name},</h2>
          <p>Vielen Dank für Ihre Anmeldung! Sie sind nun für den folgenden Workshop angemeldet:</p>
          <div class="details">
            <p><strong>Workshop:</strong> ${workshopTitle}</p>
            <p><strong>Datum:</strong> ${workshopDate}</p>
            <p><strong>Ort:</strong> ${workshopLocation}</p>
            ${priceCents > 0 ? `<p><strong>Preis:</strong> CHF ${(priceCents / 100).toFixed(2)}</p>` : '<p><strong>Preis:</strong> Kostenlos</p>'}
          </div>
          <p>Bitte merken Sie sich den Termin vor. Sie erhalten rechtzeitig vor dem Workshop eine Erinnerung mit weiteren Details.</p>
          <a href="${workshopUrl}" class="button button-green">Workshop-Details anzeigen</a>
          <p><strong>Wichtig:</strong> Falls Sie nicht teilnehmen können, bitten wir Sie, sich rechtzeitig abzumelden, damit andere Interessierte Ihren Platz einnehmen können.</p>
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

Vielen Dank für Ihre Anmeldung! Sie sind nun für den folgenden Workshop angemeldet:

Workshop: ${workshopTitle}
Datum: ${workshopDate}
Ort: ${workshopLocation}
${priceCents > 0 ? `Preis: CHF ${(priceCents / 100).toFixed(2)}` : 'Preis: Kostenlos'}

Bitte merken Sie sich den Termin vor. Sie erhalten rechtzeitig vor dem Workshop eine Erinnerung mit weiteren Details.

Workshop-Details: ${workshopUrl}

Wichtig: Falls Sie nicht teilnehmen können, bitten wir Sie, sich rechtzeitig abzumelden.
${createTextFooter()}
  `.trim(),
});

export const workshopRegistrationStatusUpdate = (
  name: string,
  workshopTitle: string,
  workshopDate: string,
  newStatus: 'confirmed' | 'cancelled' | 'waitlist',
  reason?: string
): EmailContent => ({
  subject: `Workshop-Anmeldung ${newStatus === 'confirmed' ? 'bestätigt' : newStatus === 'cancelled' ? 'storniert' : 'Warteliste'} - RevampIT`,
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
        <div class="header ${newStatus === 'confirmed' ? 'header-green' : newStatus === 'cancelled' ? 'header-red' : 'header-orange'}">
          <h1>${newStatus === 'confirmed' ? '✅ Anmeldung bestätigt' : newStatus === 'cancelled' ? '❌ Anmeldung storniert' : '⏳ Warteliste'}</h1>
        </div>
        <div class="content">
          <h2>Hallo ${name},</h2>
          <p>Der Status Ihrer Workshop-Anmeldung wurde aktualisiert.</p>
          <p><strong>Workshop:</strong> ${workshopTitle}</p>
          <p><strong>Datum:</strong> ${workshopDate}</p>
          <p><strong>Status:</strong> ${newStatus === 'confirmed' ? 'Bestätigt' : newStatus === 'cancelled' ? 'Storniert' : 'Auf der Warteliste'}</p>
          ${reason ? `<p><strong>Hinweis:</strong> ${reason}</p>` : ''}
          ${newStatus === 'confirmed' ? '<p>Wir freuen uns auf Ihre Teilnahme! Sie erhalten rechtzeitig vor dem Workshop eine Erinnerung.</p>' : ''}
          ${newStatus === 'waitlist' ? '<p>Sie werden automatisch benachrichtigt, sobald ein Platz frei wird.</p>' : ''}
          ${newStatus === 'cancelled' ? '<p>Falls Sie Fragen haben, können Sie uns jederzeit kontaktieren.</p>' : ''}
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

Der Status Ihrer Workshop-Anmeldung wurde aktualisiert.

Workshop: ${workshopTitle}
Datum: ${workshopDate}
Status: ${newStatus === 'confirmed' ? 'Bestätigt' : newStatus === 'cancelled' ? 'Storniert' : 'Auf der Warteliste'}
${reason ? `Hinweis: ${reason}` : ''}

${newStatus === 'confirmed' ? 'Wir freuen uns auf Ihre Teilnahme!' : ''}
${newStatus === 'waitlist' ? 'Sie werden automatisch benachrichtigt, sobald ein Platz frei wird.' : ''}
${newStatus === 'cancelled' ? 'Falls Sie Fragen haben, können Sie uns jederzeit kontaktieren.' : ''}
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
  subject: `Erinnerung: Workshop morgen - ${workshopTitle} - RevampIT`,
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
          <h2>Hallo ${name},</h2>
          <p>Wir möchten Sie an Ihren bevorstehenden Workshop erinnern:</p>
          <div class="details">
            <p><strong>📚 Workshop:</strong> ${workshopTitle}</p>
            <p><strong>📅 Datum:</strong> ${workshopDate}</p>
            <p><strong>🕐 Uhrzeit:</strong> ${workshopTime}</p>
            <p><strong>📍 Ort:</strong> ${workshopLocation}</p>
            ${instructor ? `<p><strong>👨‍🏫 Instruktor:</strong> ${instructor}</p>` : ''}
          </div>
          <p><strong>Tipps für Ihre Vorbereitung:</strong></p>
          <ul>
            <li>Bringen Sie Ihren eigenen Laptop mit (falls zutreffend)</li>
            <li>Erscheinen Sie bitte 10 Minuten vor Beginn</li>
            <li>Notieren Sie eventuelle Fragen, die Sie stellen möchten</li>
          </ul>
          <a href="${workshopUrl}" class="button button-blue">Workshop-Details</a>
          <p>Falls Sie nicht teilnehmen können, bitten wir Sie, sich rechtzeitig abzumelden.</p>
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

Wir möchten Sie an Ihren bevorstehenden Workshop erinnern:

Workshop: ${workshopTitle}
Datum: ${workshopDate}
Uhrzeit: ${workshopTime}
Ort: ${workshopLocation}
${instructor ? `Instruktor: ${instructor}` : ''}

Tipps für Ihre Vorbereitung:
- Bringen Sie Ihren eigenen Laptop mit (falls zutreffend)
- Erscheinen Sie bitte 10 Minuten vor Beginn
- Notieren Sie eventuelle Fragen, die Sie stellen möchten

Workshop-Details: ${workshopUrl}

Falls Sie nicht teilnehmen können, bitten wir Sie, sich rechtzeitig abzumelden.
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
  subject: `Workshop abgesagt: ${workshopTitle} - RevampIT`,
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
          <h2>Hallo ${name},</h2>
          <p>Leider müssen wir Ihnen mitteilen, dass der folgende Workshop abgesagt wurde:</p>
          <div class="notice">
            <p><strong>Workshop:</strong> ${workshopTitle}</p>
            <p><strong>Geplantes Datum:</strong> ${workshopDate}</p>
            ${reason ? `<p><strong>Grund:</strong> ${reason}</p>` : ''}
          </div>
          <p>Wir bedauern die Unannehmlichkeiten und hoffen, Sie bei einem zukünftigen Workshop begrüssen zu dürfen.</p>
          ${refundInfo ? `<p><strong>Rückerstattung:</strong> ${refundInfo}</p>` : ''}
          <p>Bei Fragen stehen wir Ihnen gerne zur Verfügung.</p>
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

Leider müssen wir Ihnen mitteilen, dass der folgende Workshop abgesagt wurde:

Workshop: ${workshopTitle}
Geplantes Datum: ${workshopDate}
${reason ? `Grund: ${reason}` : ''}

Wir bedauern die Unannehmlichkeiten und hoffen, Sie bei einem zukünftigen Workshop begrüssen zu dürfen.

${refundInfo ? `Rückerstattung: ${refundInfo}` : ''}

Bei Fragen stehen wir Ihnen gerne zur Verfügung.
${createTextFooter()}
  `.trim(),
});

export const workshopFeedbackRequest = (
  name: string,
  workshopTitle: string,
  workshopDate: string,
  feedbackUrl: string
): EmailContent => ({
  subject: 'Wie war der Workshop? Ihr Feedback zählt! - RevampIT',
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
          <h1>⭐ Ihr Feedback ist gefragt!</h1>
        </div>
        <div class="content">
          <h2>Hallo ${name},</h2>
          <p>Wir hoffen, Sie hatten eine gute Erfahrung beim Workshop:</p>
          <p><strong>${workshopTitle}</strong> am ${workshopDate}</p>
          <p>Ihre Meinung ist uns wichtig! Mit Ihrem Feedback helfen Sie uns, unsere Workshops kontinuierlich zu verbessern und anderen Teilnehmern bei ihrer Entscheidung.</p>
          <p>Es dauert nur 2 Minuten:</p>
          <a href="${feedbackUrl}" class="button button-purple">Jetzt Feedback geben</a>
          <p>Vielen Dank für Ihre Unterstützung!</p>
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

Wir hoffen, Sie hatten eine gute Erfahrung beim Workshop:
${workshopTitle} am ${workshopDate}

Ihre Meinung ist uns wichtig! Mit Ihrem Feedback helfen Sie uns, unsere Workshops kontinuierlich zu verbessern.

Feedback geben: ${feedbackUrl}

Vielen Dank für Ihre Unterstützung!
${createTextFooter()}
  `.trim(),
});

export const workshopProposalSubmitted = (
  name: string,
  workshopTitle: string,
  proposalId: string
): EmailContent => ({
  subject: 'Workshop-Vorschlag eingereicht - RevampIT',
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
          <h2>Hallo ${name},</h2>
          <p>Vielen Dank für Ihren Workshop-Vorschlag bei RevampIT! Wir haben Ihre Einreichung erhalten.</p>
          <p><strong>Workshop-Titel:</strong> ${workshopTitle}</p>
          <p><strong>Vorschlags-ID:</strong> ${proposalId}</p>
          <p>Unser Team wird Ihren Vorschlag zeitnah prüfen. Der Prüfungsprozess umfasst:</p>
          <ul>
            <li>Überprüfung der Workshop-Inhalte</li>
            <li>Bewertung der Zielgruppe und des Formats</li>
            <li>Abstimmung mit unserem Workshop-Kalender</li>
          </ul>
          <p>Sie erhalten eine Benachrichtigung, sobald wir unsere Prüfung abgeschlossen haben. Dies kann bis zu 5 Werktage dauern.</p>
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

Vielen Dank für Ihren Workshop-Vorschlag bei RevampIT! Wir haben Ihre Einreichung erhalten.

Workshop-Titel: ${workshopTitle}
Vorschlags-ID: ${proposalId}

Unser Team wird Ihren Vorschlag zeitnah prüfen. Der Prüfungsprozess umfasst:
- Überprüfung der Workshop-Inhalte
- Bewertung der Zielgruppe und des Formats
- Abstimmung mit unserem Workshop-Kalender

Sie erhalten eine Benachrichtigung, sobald wir unsere Prüfung abgeschlossen haben.
${createTextFooter()}
  `.trim(),
});

export const workshopProposalApproved = (
  name: string,
  workshopTitle: string
): EmailContent => ({
  subject: 'Workshop-Vorschlag genehmigt - RevampIT',
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
          <h2>Hallo ${name},</h2>
          <p>Gute Nachrichten! Ihr Workshop-Vorschlag wurde genehmigt.</p>
          <p><strong>Workshop:</strong> ${workshopTitle}</p>
          <p>Unser Team wird Ihren Workshop nun für die Planung vorbereiten. Sie erhalten weitere Informationen zu Terminen und Details.</p>
          <p>Vielen Dank für Ihren Beitrag zur RevampIT Community!</p>
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

Gute Nachrichten! Ihr Workshop-Vorschlag wurde genehmigt.

Workshop: ${workshopTitle}

Unser Team wird Ihren Workshop nun für die Planung vorbereiten. Sie erhalten weitere Informationen zu Terminen und Details.

Vielen Dank für Ihren Beitrag zur RevampIT Community!
${createTextFooter()}
  `.trim(),
});

export const workshopProposalRejected = (
  name: string,
  workshopTitle: string,
  reason: string
): EmailContent => ({
  subject: 'Workshop-Vorschlag abgelehnt - RevampIT',
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
          <h2>Hallo ${name},</h2>
          <p>Leider können wir Ihren Workshop-Vorschlag derzeit nicht annehmen.</p>
          <p><strong>Workshop:</strong> ${workshopTitle}</p>
          <p><strong>Grund:</strong> ${reason}</p>
          <p>Wir schätzen Ihr Engagement und ermutigen Sie, weitere Vorschläge einzureichen.</p>
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

Leider können wir Ihren Workshop-Vorschlag derzeit nicht annehmen.

Workshop: ${workshopTitle}
Grund: ${reason}

Wir schätzen Ihr Engagement und ermutigen Sie, weitere Vorschläge einzureichen.
${createTextFooter()}
  `.trim(),
});

export const workshopProposalChangesRequested = (
  name: string,
  workshopTitle: string,
  notes: string
): EmailContent => ({
  subject: 'Änderungen für Workshop-Vorschlag angefragt - RevampIT',
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
          <h2>Hallo ${name},</h2>
          <p>Unser Team hat Ihren Workshop-Vorschlag überprüft und einige Änderungsvorschläge.</p>
          <p><strong>Workshop:</strong> ${workshopTitle}</p>
          <p><strong>Anmerkungen:</strong></p>
          <div style="background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 15px 0;">
            ${notes.replace(/\n/g, '<br>')}
          </div>
          <p>Bitte überarbeiten Sie Ihren Vorschlag entsprechend und reichen Sie ihn erneut ein.</p>
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

Unser Team hat Ihren Workshop-Vorschlag überprüft und einige Änderungsvorschläge.

Workshop: ${workshopTitle}

Anmerkungen:
${notes}

Bitte überarbeiten Sie Ihren Vorschlag entsprechend und reichen Sie ihn erneut ein.
${createTextFooter()}
  `.trim(),
});
