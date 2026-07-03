import { ORG } from '@\/config\/org';
import type { EmailContent } from '../types';
import { BASE_STYLES, COPYRIGHT_TEXT, AUTO_GENERATED_TEXT, createTextFooter } from './base-styles';
import { escapeHtml } from '@/lib/utils/escape-html';

export const contentSubmissionApproved = (
  name: string,
  title: string,
  contentType: string
): EmailContent => ({
  subject: `Einreichung genehmigt - ${ORG.name}`,
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
          <h2>Hallo ${escapeHtml(name)},</h2>
          <p>Gute Nachrichten! Deine Einreichung wurde genehmigt.</p>
          <p><strong>Titel:</strong> ${escapeHtml(title)}</p>
          <p><strong>Typ:</strong> ${escapeHtml(contentType)}</p>
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

Gute Nachrichten! Deine Einreichung wurde genehmigt.

Titel: ${title}
Typ: ${contentType}

Vielen Dank für deinen Beitrag zur ${ORG.name} Community!
${createTextFooter()}
  `.trim(),
});

export const contentSubmissionRejected = (
  name: string,
  title: string,
  contentType: string,
  reason?: string
): EmailContent => ({
  subject: `Einreichung abgelehnt - ${ORG.name}`,
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
          <h2>Hallo ${escapeHtml(name)},</h2>
          <p>Leider wurde deine Einreichung abgelehnt.</p>
          <p><strong>Titel:</strong> ${escapeHtml(title)}</p>
          <p><strong>Typ:</strong> ${escapeHtml(contentType)}</p>
          ${reason ? `<p><strong>Begründung:</strong> ${escapeHtml(reason)}</p>` : ''}
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
Typ: ${contentType}${reason ? `\nBegründung: ${reason}` : ''}

Bei Fragen kannst du uns jederzeit kontaktieren.
${createTextFooter()}
  `.trim(),
});
