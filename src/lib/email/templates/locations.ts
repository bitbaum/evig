import { ORG } from '@\/config\/org';
import type { EmailContent } from '../types';
import { BASE_STYLES, COPYRIGHT_TEXT, AUTO_GENERATED_TEXT, createTextFooter } from './base-styles';
import { escapeHtml } from '@/lib/utils/escape-html';

// `name`, `locationName`, `city`, `reviewNotes` are user-controlled
// (locationName/city from submitter, reviewNotes from admin); escape
// before HTML interpolation. action / statusText / headerColor are
// internal enums and stay raw.

export const locationApprovalNotification = (
  name: string,
  locationName: string,
  action: 'approve' | 'reject' | 'suspend' | 'reinstate',
  reviewNotes: string | null
): EmailContent => {
  const headerColor = action === 'approve' || action === 'reinstate' ? 'header-green' : action === 'reject' ? 'header-red' : 'header-orange';
  const statusText = action === 'approve' ? 'Genehmigt' : action === 'reject' ? 'Abgelehnt' : action === 'suspend' ? 'Suspendiert' : 'Wiederhergestellt';
  const eName = escapeHtml(name);
  const eLocationName = escapeHtml(locationName);
  const eReviewNotes = reviewNotes ? escapeHtml(reviewNotes) : null;

  return {
    subject: `Ort ${statusText.toLowerCase()} - ${ORG.name}`,
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
            <h2>Hallo ${eName},</h2>
            <p>Der Status deines eingereichten Ortes wurde aktualisiert.</p>
            <p><strong>Ort:</strong> ${eLocationName}</p>
            <p><strong>Status:</strong> ${statusText}</p>
            ${eReviewNotes ? `<p><strong>Anmerkungen:</strong> ${eReviewNotes}</p>` : ''}
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

export const locationSubmissionConfirmation = (
  name: string,
  locationName: string,
  city: string
): EmailContent => {
  const eName = escapeHtml(name);
  const eLocationName = escapeHtml(locationName);
  const eCity = escapeHtml(city);
  return {
    subject: `Ort eingereicht - ${ORG.name}`,
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
          <h2>Hallo ${eName},</h2>
          <p>Vielen Dank! Dein Ort wurde erfolgreich eingereicht und wird nun geprüft.</p>
          <table style="width: 100%; border-collapse: collapse; margin: 15px 0;">
            <tr>
              <td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold;">Ort</td>
              <td style="padding: 8px; border-bottom: 1px solid #eee;">${eLocationName}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold;">Stadt</td>
              <td style="padding: 8px; border-bottom: 1px solid #eee;">${eCity}</td>
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
  };
};
