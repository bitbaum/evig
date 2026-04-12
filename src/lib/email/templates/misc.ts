/**
 * Miscellaneous Email Templates
 *
 * Templates for newsletter, blog, reviews, locations, and seller applications.
 */

import type { EmailContent } from '../types';
import { BASE_STYLES, COPYRIGHT_TEXT, AUTO_GENERATED_TEXT, createTextFooter } from './base-styles';

export const newsletterConfirmation = (confirmUrl: string): EmailContent => ({
  subject: 'Newsletter-Anmeldung bestätigen - RevampIT',
  html: `
    <!DOCTYPE html>
    <html lang="de">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Newsletter-Anmeldung bestätigen</title>
      <style>${BASE_STYLES}</style>
    </head>
    <body>
      <div class="container">
        <div class="header header-green">
          <h1>Newsletter-Anmeldung bestätigen</h1>
        </div>
        <div class="content">
          <p>Vielen Dank für dein Interesse am RevampIT Newsletter!</p>
          <p>Um deine Anmeldung abzuschliessen, klicke bitte auf den folgenden Button:</p>
          <a href="${confirmUrl}" class="button button-green">Anmeldung bestätigen</a>
          <p>Was dich erwartet:</p>
          <ul>
            <li>Neuigkeiten zu nachhaltiger IT und Open Source</li>
            <li>Informationen zu kommenden Workshops und Events</li>
            <li>Tipps zur Verlängerung der Lebensdauer deiner Geräte</li>
            <li>Angebote aus unserem Shop</li>
          </ul>
          <p>Falls du diese E-Mail nicht angefordert hast, kannst du sie ignorieren.</p>
          <p>Falls der Button nicht funktioniert, kopiere diesen Link in deinen Browser:</p>
          <p><a href="${confirmUrl}">${confirmUrl}</a></p>
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
Vielen Dank für dein Interesse am RevampIT Newsletter!

Um deine Anmeldung abzuschliessen, öffne bitte folgenden Link:
${confirmUrl}

Was dich erwartet:
- Neuigkeiten zu nachhaltiger IT und Open Source
- Informationen zu kommenden Workshops und Events
- Tipps zur Verlängerung der Lebensdauer deiner Geräte
- Angebote aus unserem Shop

Falls du diese E-Mail nicht angefordert hast, kannst du sie ignorieren.
${createTextFooter()}
  `.trim(),
});

export const blogSubmissionReceived = (
  name: string,
  articleTitle: string,
  submissionId: string
): EmailContent => ({
  subject: 'Blog-Beitrag eingereicht - RevampIT',
  html: `
    <!DOCTYPE html>
    <html lang="de">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Blog-Beitrag eingereicht</title>
      <style>${BASE_STYLES}</style>
    </head>
    <body>
      <div class="container">
        <div class="header header-green">
          <h1>Blog-Beitrag eingereicht</h1>
        </div>
        <div class="content">
          <h2>Hallo ${name},</h2>
          <p>Vielen Dank für deinen Blog-Beitrag bei RevampIT! Wir haben deine Einreichung erhalten.</p>
          <p><strong>Titel:</strong> ${articleTitle}</p>
          <p><strong>Einreichungs-ID:</strong> ${submissionId}</p>
          <p>Unser Redaktionsteam wird deinen Beitrag prüfen. Der Prozess umfasst:</p>
          <ul>
            <li>Inhaltliche Überprüfung</li>
            <li>Redaktionelle Bearbeitung falls erforderlich</li>
            <li>Einplanung in unseren Veröffentlichungskalender</li>
          </ul>
          <p>Du erhältst eine Benachrichtigung über den Status deiner Einreichung. Die Prüfung kann bis zu 7 Werktage dauern.</p>
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

Vielen Dank für deinen Blog-Beitrag bei RevampIT! Wir haben deine Einreichung erhalten.

Titel: ${articleTitle}
Einreichungs-ID: ${submissionId}

Unser Redaktionsteam wird deinen Beitrag prüfen. Der Prozess umfasst:
- Inhaltliche Überprüfung
- Redaktionelle Bearbeitung falls erforderlich
- Einplanung in unseren Veröffentlichungskalender

Du erhältst eine Benachrichtigung über den Status deiner Einreichung.
${createTextFooter()}
  `.trim(),
});

export const blogSubmissionApproved = (
  name: string,
  articleTitle: string
): EmailContent => ({
  subject: 'Blog-Beitrag genehmigt - RevampIT',
  html: `
    <!DOCTYPE html>
    <html lang="de">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Blog-Beitrag genehmigt</title>
      <style>${BASE_STYLES}</style>
    </head>
    <body>
      <div class="container">
        <div class="header header-green">
          <h1>Blog-Beitrag genehmigt</h1>
        </div>
        <div class="content">
          <h2>Hallo ${name},</h2>
          <p>Gute Nachrichten! Dein Blog-Beitrag wurde genehmigt.</p>
          <p><strong>Titel:</strong> ${articleTitle}</p>
          <p>Unser Redaktionsteam wird deinen Beitrag nun für die Veröffentlichung vorbereiten. Du erhältst eine weitere Benachrichtigung, sobald er live ist.</p>
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

Gute Nachrichten! Dein Blog-Beitrag wurde genehmigt.

Titel: ${articleTitle}

Unser Redaktionsteam wird deinen Beitrag nun für die Veröffentlichung vorbereiten.
${createTextFooter()}
  `.trim(),
});

export const blogSubmissionRejected = (
  name: string,
  articleTitle: string,
  reason: string
): EmailContent => ({
  subject: 'Blog-Beitrag abgelehnt - RevampIT',
  html: `
    <!DOCTYPE html>
    <html lang="de">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Blog-Beitrag abgelehnt</title>
      <style>${BASE_STYLES}</style>
    </head>
    <body>
      <div class="container">
        <div class="header header-red">
          <h1>Blog-Beitrag abgelehnt</h1>
        </div>
        <div class="content">
          <h2>Hallo ${name},</h2>
          <p>Leider können wir deinen Blog-Beitrag nicht veröffentlichen.</p>
          <p><strong>Titel:</strong> ${articleTitle}</p>
          <p><strong>Grund:</strong> ${reason}</p>
          <p>Wir schätzen deinen Beitrag zur Community und ermutigen dich, weitere Themen einzureichen.</p>
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

Leider können wir deinen Blog-Beitrag nicht veröffentlichen.

Titel: ${articleTitle}
Grund: ${reason}

Wir schätzen deinen Beitrag zur Community und ermutigen dich, weitere Themen einzureichen.
${createTextFooter()}
  `.trim(),
});

export const blogSubmissionPublished = (
  name: string,
  articleTitle: string,
  articleUrl: string
): EmailContent => ({
  subject: 'Ihr Blog-Beitrag ist live! - RevampIT',
  html: `
    <!DOCTYPE html>
    <html lang="de">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Blog-Beitrag veröffentlicht</title>
      <style>${BASE_STYLES}</style>
    </head>
    <body>
      <div class="container">
        <div class="header header-green">
          <h1>Dein Beitrag ist live!</h1>
        </div>
        <div class="content">
          <h2>Hallo ${name},</h2>
          <p>Herzlichen Glückwunsch! Dein Blog-Beitrag wurde veröffentlicht.</p>
          <p><strong>Titel:</strong> ${articleTitle}</p>
          <a href="${articleUrl}" class="button button-green">Beitrag ansehen</a>
          <p>Vielen Dank für deinen wertvollen Beitrag zur RevampIT Community!</p>
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

Herzlichen Glückwunsch! Dein Blog-Beitrag wurde veröffentlicht.

Titel: ${articleTitle}
Link: ${articleUrl}

Vielen Dank für deinen wertvollen Beitrag zur RevampIT Community!
${createTextFooter()}
  `.trim(),
});

export const blogSubmissionChangesRequested = (
  name: string,
  articleTitle: string,
  notes: string
): EmailContent => ({
  subject: 'Änderungen für Blog-Beitrag angefragt - RevampIT',
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
          <p>Unser Redaktionsteam hat deinen Blog-Beitrag überprüft und einige Änderungsvorschläge.</p>
          <p><strong>Titel:</strong> ${articleTitle}</p>
          <p><strong>Anmerkungen:</strong></p>
          <div style="background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 15px 0;">
            ${notes.replace(/\n/g, '<br>')}
          </div>
          <p>Bitte überarbeite deinen Beitrag entsprechend und reiche ihn erneut ein.</p>
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

Unser Redaktionsteam hat deinen Blog-Beitrag überprüft und einige Änderungsvorschläge.

Titel: ${articleTitle}

Anmerkungen:
${notes}

Bitte überarbeite deinen Beitrag entsprechend und reiche ihn erneut ein.
${createTextFooter()}
  `.trim(),
});

export const newReviewNotification = (
  repairerName: string,
  reviewerName: string,
  rating: number,
  reviewContent: string,
  reviewUrl: string
): EmailContent => ({
  subject: 'Neue Bewertung erhalten - RevampIT',
  html: `
    <!DOCTYPE html>
    <html lang="de">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Neue Bewertung</title>
      <style>${BASE_STYLES}
        .rating { color: #f59e0b; font-size: 18px; font-weight: bold; }
        .review-box { background-color: white; padding: 15px; border-radius: 5px; margin: 15px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header header-green">
          <h1>Neue Bewertung erhalten</h1>
        </div>
        <div class="content">
          <p>Hallo ${repairerName},</p>
          <p>Du hast eine neue Bewertung erhalten!</p>
          <p><strong>Bewerter:</strong> ${reviewerName}</p>
          <p><strong>Bewertung:</strong> <span class="rating">${'★'.repeat(Math.floor(rating))}${'☆'.repeat(5 - Math.floor(rating))} (${rating}/5)</span></p>
          <p><strong>Bewertungstext:</strong></p>
          <div class="review-box">
            ${reviewContent.replace(/\n/g, '<br>')}
          </div>
          <p>Diese Bewertung hilft anderen Kunden, fundierte Entscheidungen zu treffen. Du kannst auf diese Bewertung antworten, um dein Engagement zu zeigen.</p>
          <a href="${reviewUrl}" class="button button-green">Bewertung anzeigen & antworten</a>
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
Hallo ${repairerName},

Du hast eine neue Bewertung erhalten!

Bewerter: ${reviewerName}
Bewertung: ${'★'.repeat(Math.floor(rating))}${'☆'.repeat(5 - Math.floor(rating))} (${rating}/5)

Bewertungstext:
${reviewContent}

Diese Bewertung hilft anderen Kunden, fundierte Entscheidungen zu treffen. Du kannst auf diese Bewertung antworten, um dein Engagement zu zeigen.

Bewertung anzeigen: ${reviewUrl}
${createTextFooter()}
  `.trim(),
});

export const sellerApplicationSubmitted = (
  name: string,
  applicationId: string
): EmailContent => ({
  subject: 'Verkäufer-Bewerbung eingereicht - RevampIT',
  html: `
    <!DOCTYPE html>
    <html lang="de">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Verkäufer-Bewerbung eingereicht</title>
      <style>${BASE_STYLES}</style>
    </head>
    <body>
      <div class="container">
        <div class="header header-green">
          <h1>Verkäufer-Bewerbung eingereicht</h1>
        </div>
        <div class="content">
          <h2>Hallo ${name},</h2>
          <p>Vielen Dank für deine Bewerbung als Verkäufer auf dem RevampIT Marktplatz! Wir haben deine Unterlagen erhalten.</p>
          <p><strong>Bewerbungs-ID:</strong> ${applicationId}</p>
          <p>Der Prüfungsprozess umfasst:</p>
          <ul>
            <li>Verifizierung deiner Angaben</li>
            <li>Prüfung der Produktkategorien</li>
            <li>Qualitätssicherung</li>
          </ul>
          <p>Du erhältst eine Benachrichtigung, sobald wir unsere Prüfung abgeschlossen haben. Dies kann bis zu 5 Werktage dauern.</p>
          <p>Bei Fragen kannst du uns jederzeit kontaktieren.</p>
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

Vielen Dank für deine Bewerbung als Verkäufer auf dem RevampIT Marktplatz! Wir haben deine Unterlagen erhalten.

Bewerbungs-ID: ${applicationId}

Der Prüfungsprozess umfasst:
- Verifizierung deiner Angaben
- Prüfung der Produktkategorien
- Qualitätssicherung

Du erhältst eine Benachrichtigung, sobald wir unsere Prüfung abgeschlossen haben.
${createTextFooter()}
  `.trim(),
});

export const contentSubmissionApproved = (
  name: string,
  title: string,
  contentType: string
): EmailContent => ({
  subject: 'Einreichung genehmigt - RevampIT',
  html: `
    <!DOCTYPE html>
    <html lang="de">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Einreichung genehmigt</title>
      <style>${BASE_STYLES}</style>
    </head>
    <body>
      <div class="container">
        <div class="header header-green">
          <h1>Einreichung genehmigt</h1>
        </div>
        <div class="content">
          <h2>Hallo ${name},</h2>
          <p>Gute Nachrichten! Deine Einreichung wurde genehmigt.</p>
          <p><strong>Titel:</strong> ${title}</p>
          <p><strong>Typ:</strong> ${contentType}</p>
          <p>Vielen Dank für deinen Beitrag zur RevampIT Community!</p>
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

Gute Nachrichten! Deine Einreichung wurde genehmigt.

Titel: ${title}
Typ: ${contentType}

Vielen Dank für deinen Beitrag zur RevampIT Community!
${createTextFooter()}
  `.trim(),
});

export const contentSubmissionRejected = (
  name: string,
  title: string,
  contentType: string
): EmailContent => ({
  subject: 'Einreichung abgelehnt - RevampIT',
  html: `
    <!DOCTYPE html>
    <html lang="de">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Einreichung abgelehnt</title>
      <style>${BASE_STYLES}</style>
    </head>
    <body>
      <div class="container">
        <div class="header header-red">
          <h1>Einreichung abgelehnt</h1>
        </div>
        <div class="content">
          <h2>Hallo ${name},</h2>
          <p>Leider wurde deine Einreichung abgelehnt.</p>
          <p><strong>Titel:</strong> ${title}</p>
          <p><strong>Typ:</strong> ${contentType}</p>
          <p>Bei Fragen kannst du uns jederzeit kontaktieren.</p>
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

Leider wurde deine Einreichung abgelehnt.

Titel: ${title}
Typ: ${contentType}

Bei Fragen kannst du uns jederzeit kontaktieren.
${createTextFooter()}
  `.trim(),
});

export const locationApprovalNotification = (
  name: string,
  locationName: string,
  action: 'approve' | 'reject' | 'suspend' | 'reinstate',
  reviewNotes: string | null
): EmailContent => {
  const headerColor = action === 'approve' || action === 'reinstate' ? 'header-green' : action === 'reject' ? 'header-red' : 'header-orange';
  const statusText = action === 'approve' ? 'Genehmigt' : action === 'reject' ? 'Abgelehnt' : action === 'suspend' ? 'Suspendiert' : 'Wiederhergestellt';

  return {
    subject: `Ort ${statusText.toLowerCase()} - RevampIT`,
    html: `
      <!DOCTYPE html>
      <html lang="de">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Ort-Status aktualisiert</title>
        <style>${BASE_STYLES}</style>
      </head>
      <body>
        <div class="container">
          <div class="header ${headerColor}">
            <h1>Ort-Status aktualisiert</h1>
          </div>
          <div class="content">
            <h2>Hallo ${name},</h2>
            <p>Der Status deines eingereichten Ortes wurde aktualisiert.</p>
            <p><strong>Ort:</strong> ${locationName}</p>
            <p><strong>Status:</strong> ${statusText}</p>
            ${reviewNotes ? `<p><strong>Anmerkungen:</strong> ${reviewNotes}</p>` : ''}
            ${action === 'approve' || action === 'reinstate' ? '<p>Dein Ort ist nun für andere Benutzer sichtbar und kann für Workshops und Veranstaltungen gebucht werden.</p>' : ''}
            ${action === 'reject' ? '<p>Bei Fragen zur Ablehnung kannst du uns gerne kontaktieren.</p>' : ''}
            ${action === 'suspend' ? '<p>Der Ort ist vorübergehend nicht verfügbar. Bitte kontaktiere uns für weitere Informationen.</p>' : ''}
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

Der Status deines eingereichten Ortes wurde aktualisiert.

Ort: ${locationName}
Status: ${statusText}
${reviewNotes ? `Anmerkungen: ${reviewNotes}` : ''}
${createTextFooter()}
    `.trim(),
  };
};

/**
 * Location submission confirmation email
 * Sent to the user after they submit a new location
 */
export const locationSubmissionConfirmation = (
  name: string,
  locationName: string,
  city: string
): EmailContent => ({
  subject: 'Ort eingereicht - RevampIT',
  html: `
    <!DOCTYPE html>
    <html lang="de">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Ort eingereicht</title>
      <style>${BASE_STYLES}</style>
    </head>
    <body>
      <div class="container">
        <div class="header header-green">
          <h1>Ort eingereicht</h1>
        </div>
        <div class="content">
          <h2>Hallo ${name},</h2>
          <p>Vielen Dank! Dein Ort wurde erfolgreich eingereicht und wird nun geprüft.</p>
          <table style="width: 100%; border-collapse: collapse; margin: 15px 0;">
            <tr>
              <td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold;">Ort</td>
              <td style="padding: 8px; border-bottom: 1px solid #eee;">${locationName}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold;">Stadt</td>
              <td style="padding: 8px; border-bottom: 1px solid #eee;">${city}</td>
            </tr>
          </table>
          <p>Du wirst per E-Mail benachrichtigt, sobald dein Ort genehmigt wurde.</p>
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

Vielen Dank! Dein Ort wurde erfolgreich eingereicht und wird nun geprüft.

Ort: ${locationName}
Stadt: ${city}

Du wirst per E-Mail benachrichtigt, sobald dein Ort genehmigt wurde.
${createTextFooter()}
  `.trim(),
});
