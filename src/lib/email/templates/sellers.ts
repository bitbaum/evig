import type { EmailContent } from '../types';
import { BASE_STYLES, COPYRIGHT_TEXT, AUTO_GENERATED_TEXT, createTextFooter } from './base-styles';

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
