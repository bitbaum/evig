import { ORG } from '@\/config\/org';
import type { EmailContent } from '../types';
import { BASE_STYLES, COPYRIGHT_TEXT, AUTO_GENERATED_TEXT, createTextFooter } from './base-styles';

export const newsletterConfirmation = (confirmUrl: string): EmailContent => ({
  subject: `Newsletter-Anmeldung bestätigen - ${ORG.name}`,
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
          <p>Vielen Dank für dein Interesse am ${ORG.name} Newsletter!</p>
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
Vielen Dank für dein Interesse am ${ORG.name} Newsletter!

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
