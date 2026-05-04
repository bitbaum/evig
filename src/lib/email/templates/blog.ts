import { ORG } from '@\/config\/org';
import type { EmailContent } from '../types';
import { BASE_STYLES, COPYRIGHT_TEXT, AUTO_GENERATED_TEXT, createTextFooter } from './base-styles';
import { escapeHtml } from '@/lib/utils/escape-html';

// `name`, `articleTitle`, `reason`, `notes` are all user/admin-entered
// strings interpolated into HTML below — escape before reaching the body.

export const blogSubmissionReceived = (
  name: string,
  articleTitle: string,
  submissionId: string
): EmailContent => {
  const eName = escapeHtml(name);
  const eTitle = escapeHtml(articleTitle);
  const eId = escapeHtml(submissionId);
  return {
    subject: 'Blog-Beitrag eingereicht - ${ORG.name}',
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
          <h2>Hallo ${eName},</h2>
          <p>Vielen Dank für deinen Blog-Beitrag bei ${ORG.name}! Wir haben deine Einreichung erhalten.</p>
          <p><strong>Titel:</strong> ${eTitle}</p>
          <p><strong>Einreichungs-ID:</strong> ${eId}</p>
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

Vielen Dank für deinen Blog-Beitrag bei ${ORG.name}! Wir haben deine Einreichung erhalten.

Titel: ${articleTitle}
Einreichungs-ID: ${submissionId}

Unser Redaktionsteam wird deinen Beitrag prüfen. Der Prozess umfasst:
- Inhaltliche Überprüfung
- Redaktionelle Bearbeitung falls erforderlich
- Einplanung in unseren Veröffentlichungskalender

Du erhältst eine Benachrichtigung über den Status deiner Einreichung.
${createTextFooter()}
  `.trim(),
  };
};

export const blogSubmissionApproved = (
  name: string,
  articleTitle: string
): EmailContent => {
  const eName = escapeHtml(name);
  const eTitle = escapeHtml(articleTitle);
  return {
    subject: 'Blog-Beitrag genehmigt - ${ORG.name}',
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
          <h2>Hallo ${eName},</h2>
          <p>Gute Nachrichten! Dein Blog-Beitrag wurde genehmigt.</p>
          <p><strong>Titel:</strong> ${eTitle}</p>
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
  };
};

export const blogSubmissionRejected = (
  name: string,
  articleTitle: string,
  reason: string
): EmailContent => {
  const eName = escapeHtml(name);
  const eTitle = escapeHtml(articleTitle);
  const eReason = escapeHtml(reason);
  return {
    subject: 'Blog-Beitrag abgelehnt - ${ORG.name}',
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
          <h2>Hallo ${eName},</h2>
          <p>Leider können wir deinen Blog-Beitrag nicht veröffentlichen.</p>
          <p><strong>Titel:</strong> ${eTitle}</p>
          <p><strong>Grund:</strong> ${eReason}</p>
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
  };
};

export const blogSubmissionPublished = (
  name: string,
  articleTitle: string,
  articleUrl: string
): EmailContent => {
  const eName = escapeHtml(name);
  const eTitle = escapeHtml(articleTitle);
  return {
    subject: 'Ihr Blog-Beitrag ist live! - ${ORG.name}',
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
          <h2>Hallo ${eName},</h2>
          <p>Herzlichen Glückwunsch! Dein Blog-Beitrag wurde veröffentlicht.</p>
          <p><strong>Titel:</strong> ${eTitle}</p>
          <a href="${articleUrl}" class="button button-green">Beitrag ansehen</a>
          <p>Vielen Dank für deinen wertvollen Beitrag zur ${ORG.name} Community!</p>
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

Vielen Dank für deinen wertvollen Beitrag zur ${ORG.name} Community!
${createTextFooter()}
  `.trim(),
  };
};

export const blogSubmissionChangesRequested = (
  name: string,
  articleTitle: string,
  notes: string
): EmailContent => {
  const eName = escapeHtml(name);
  const eTitle = escapeHtml(articleTitle);
  const eNotesHtml = escapeHtml(notes).replace(/\n/g, '<br>');
  return {
    subject: 'Änderungen für Blog-Beitrag angefragt - ${ORG.name}',
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
          <h2>Hallo ${eName},</h2>
          <p>Unser Redaktionsteam hat deinen Blog-Beitrag überprüft und einige Änderungsvorschläge.</p>
          <p><strong>Titel:</strong> ${eTitle}</p>
          <p><strong>Anmerkungen:</strong></p>
          <div style="background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 15px 0;">
            ${eNotesHtml}
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
  };
};
