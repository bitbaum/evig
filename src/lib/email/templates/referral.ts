import type { EmailContent } from '../types'
import { BASE_STYLES, COPYRIGHT_TEXT, AUTO_GENERATED_TEXT, createTextFooter } from './base-styles'
import { ORG } from '@/config/org'
import { escapeHtml } from '@/lib/utils/escape-html'

export const referralInvitation = (inviterName: string, referralUrl: string): EmailContent => {
  const name = escapeHtml(inviterName)
  return {
    subject: `${name} denkt, du passt zu ${ORG.name}`,
    html: `
      <!DOCTYPE html>
      <html lang="de">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Einladung zu ${ORG.name}</title>
        <style>
          ${BASE_STYLES}
          .invite-box { background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 20px; margin: 20px 0; text-align: center; }
          .invite-box p { margin: 0 0 12px; font-size: 14px; color: #555; }
          .url-box { background: #fff; border: 1px solid #d1fae5; border-radius: 6px; padding: 10px 16px; font-family: monospace; font-size: 13px; word-break: break-all; color: #166534; }
          .badge { display: inline-block; background: #22c55e; color: #fff; border-radius: 20px; padding: 4px 14px; font-size: 13px; font-weight: bold; margin-bottom: 8px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header header-green">
            <h1>Gebrauchte Technik. Neues Leben.</h1>
          </div>
          <div class="content">
            <p>${name} hat dich zu <strong>${ORG.name}</strong> eingeladen.</p>
            <p>${ORG.name} ist eine Schweizer Non-Profit-Organisation. Wir reparieren und verschenken gebrauchte Computer — damit funktionsfähige Technik nicht im Elektroschrott landet.</p>

            <div class="invite-box">
              <span class="badge">CHF 5 Willkommensrabatt</span>
              <p>Registriere dich über den Link von ${name} und erhalte <strong>CHF 5 Rabatt</strong> auf deinen ersten Einkauf im Shop.</p>
              <div class="url-box">${escapeHtml(referralUrl)}</div>
            </div>

            <p style="text-align:center;">
              <a href="${escapeHtml(referralUrl)}" class="button button-green">Jetzt mitmachen</a>
            </p>

            <p style="font-size:13px;color:#888;">Dieser Rabatt ist 6 Monate gültig und gilt für Einkäufe im ${ORG.name} Shop.</p>
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
${name} hat dich zu ${ORG.name} eingeladen.

${ORG.name} ist eine Schweizer Non-Profit-Organisation. Wir reparieren und verschenken gebrauchte Computer.

Als Willkommensgeschenk erhältst du CHF 5 Rabatt auf deinen ersten Einkauf:
${referralUrl}

Dieser Rabatt ist 6 Monate gültig.
${createTextFooter()}
    `.trim(),
  }
}

export const referralCouponReceived = (
  recipientName: string,
  couponCode: string,
  amountChf: number,
  type: 'welcome' | 'reward',
): EmailContent => {
  const name = escapeHtml(recipientName)
  const isWelcome = type === 'welcome'

  return {
    subject: isWelcome
      ? `Dein CHF ${amountChf} Willkommensrabatt bei ${ORG.name}`
      : `Danke fürs Einladen — CHF ${amountChf} Gutschein für dich`,
    html: `
      <!DOCTYPE html>
      <html lang="de">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Dein Gutschein</title>
        <style>
          ${BASE_STYLES}
          .coupon { background: #f0fdf4; border: 2px dashed #22c55e; border-radius: 10px; padding: 24px; margin: 20px 0; text-align: center; }
          .coupon-amount { font-size: 36px; font-weight: bold; color: #15803d; margin: 8px 0; }
          .coupon-code { font-family: monospace; font-size: 22px; font-weight: bold; letter-spacing: 4px; color: #166534; background: #fff; border: 1px solid #bbf7d0; border-radius: 6px; padding: 10px 20px; display: inline-block; margin: 12px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header header-green">
            <h1>${isWelcome ? 'Willkommen bei ' + ORG.name : 'Danke fürs Einladen!'}</h1>
          </div>
          <div class="content">
            <h2>Hallo ${name},</h2>
            <p>${isWelcome
              ? `Schön, dass du da bist! Als Dankeschön für deine Registrierung über eine persönliche Einladung erhältst du:`
              : `Deine Einladung hat funktioniert — jemand hat sich registriert. Als Dankeschön:`
            }</p>

            <div class="coupon">
              <div class="coupon-amount">CHF ${amountChf}</div>
              <p style="margin:4px 0 12px;color:#555;">${isWelcome ? 'Willkommensrabatt' : 'Einladungsbonus'} für den ${ORG.name} Shop</p>
              <div class="coupon-code">${escapeHtml(couponCode)}</div>
              <p style="font-size:13px;color:#888;margin:8px 0 0;">6 Monate gültig</p>
            </div>

            <p>Gib den Code beim Checkout im Shop ein, um deinen Rabatt einzulösen.</p>
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

${isWelcome ? `Willkommen bei ${ORG.name}! Dein Willkommensrabatt:` : 'Danke fürs Einladen! Dein Bonus:'}

Gutscheincode: ${couponCode}
Wert: CHF ${amountChf}
Gültig: 6 Monate

Gib den Code beim Checkout im Shop ein.
${createTextFooter()}
    `.trim(),
  }
}
