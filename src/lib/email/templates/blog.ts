import type { EmailContent } from '../types';
import { BASE_STYLES, COPYRIGHT_TEXT, AUTO_GENERATED_TEXT, createTextFooter } from './base-styles';

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
