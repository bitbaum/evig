import { ORG } from '@\/config\/org';
import type { EmailContent } from '../types';
import { BASE_STYLES, COPYRIGHT_TEXT, AUTO_GENERATED_TEXT, createTextFooter } from './base-styles';
import { escapeHtml } from '@/lib/utils/escape-html';

export const newReviewNotification = (
  repairerName: string,
  reviewerName: string,
  rating: number,
  reviewContent: string,
  reviewUrl: string
): EmailContent => ({
  subject: `Neue Bewertung erhalten - ${ORG.name}`,
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
          <p>Hallo ${escapeHtml(repairerName)},</p>
          <p>Du hast eine neue Bewertung erhalten!</p>
          <p><strong>Bewerter:</strong> ${escapeHtml(reviewerName)}</p>
          <p><strong>Bewertung:</strong> <span class="rating">${'★'.repeat(Math.floor(rating))}${'☆'.repeat(5 - Math.floor(rating))} (${rating}/5)</span></p>
          <p><strong>Bewertungstext:</strong></p>
          <div class="review-box">
            ${escapeHtml(reviewContent).replace(/\n/g, '<br>')}
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
