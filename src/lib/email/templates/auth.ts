/**
 * Authentication Email Templates
 *
 * Templates for verification codes, email verification, welcome, and password reset.
 */

import type { EmailContent } from '../types';
import { createEmailLayout, createTextFooter, BASE_STYLES, COPYRIGHT_TEXT, AUTO_GENERATED_TEXT } from './base-styles';
import { CONTACT, ORG } from '@/config/org';

export const verificationCode = (name: string, code: string): EmailContent => ({
  subject: 'Ihr Bestätigungscode - RevampIT',
  html: `
    <!DOCTYPE html>
    <html lang="de">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Bestätigungscode</title>
      <style>${BASE_STYLES}</style>
    </head>
    <body>
      <div class="container">
        <div class="header header-green">
          <h1>Bestätigungscode</h1>
        </div>
        <div class="content">
          <h2>Hallo ${name || 'Benutzer'},</h2>
          <p>Vielen Dank für Ihre Registrierung bei RevampIT! Geben Sie den folgenden Code ein, um Ihre E-Mail-Adresse zu bestätigen:</p>
          <div class="code">${code}</div>
          <p><strong>Sicherheitshinweis:</strong> Dieser Code ist 15 Minuten gültig. Teilen Sie diesen Code mit niemandem.</p>
          <p>Wenn Sie diese E-Mail nicht angefordert haben, ignorieren Sie sie bitte.</p>
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
Hallo ${name || 'Benutzer'},

Vielen Dank für Ihre Registrierung bei RevampIT!

Ihr Bestätigungscode lautet: ${code}

Dieser Code ist 15 Minuten gültig.

Falls Sie diese E-Mail nicht angefordert haben, ignorieren Sie sie bitte.
${createTextFooter()}
  `.trim(),
});

export const emailVerification = (name: string, verificationUrl: string): EmailContent => ({
  subject: 'E-Mail-Adresse bestätigen - RevampIT',
  html: `
    <!DOCTYPE html>
    <html lang="de">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>E-Mail-Adresse bestätigen</title>
      <style>${BASE_STYLES}</style>
    </head>
    <body>
      <div class="container">
        <div class="header header-green">
          <h1>Willkommen bei RevampIT!</h1>
        </div>
        <div class="content">
          <h2>Hallo ${name},</h2>
          <p>Vielen Dank für Ihre Registrierung bei RevampIT! Um Ihr Konto zu aktivieren, bestätigen Sie bitte Ihre E-Mail-Adresse.</p>
          <p>Klicken Sie auf den folgenden Button, um Ihre E-Mail-Adresse zu bestätigen:</p>
          <a href="${verificationUrl}" class="button button-green">E-Mail-Adresse bestätigen</a>
          <p><strong>Sicherheitshinweis:</strong> Dieser Link ist 24 Stunden gültig. Wenn Sie diese E-Mail nicht angefordert haben, ignorieren Sie sie bitte.</p>
          <p>Falls der Button nicht funktioniert, kopieren Sie diesen Link in Ihren Browser:</p>
          <p><a href="${verificationUrl}">${verificationUrl}</a></p>
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

Vielen Dank für Ihre Registrierung bei RevampIT!

Um Ihr Konto zu aktivieren, bestätigen Sie bitte Ihre E-Mail-Adresse, indem Sie auf diesen Link klicken:

${verificationUrl}

Dieser Link ist 24 Stunden gültig.

Falls Sie diese E-Mail nicht angefordert haben, ignorieren Sie sie bitte.
${createTextFooter()}
  `.trim(),
});

export const welcome = (name: string): EmailContent => ({
  subject: 'Willkommen bei RevampIT!',
  html: `
    <!DOCTYPE html>
    <html lang="de">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Willkommen bei RevampIT</title>
      <style>${BASE_STYLES}</style>
    </head>
    <body>
      <div class="container">
        <div class="header header-green">
          <h1>Willkommen bei RevampIT!</h1>
        </div>
        <div class="content">
          <h2>Hallo ${name},</h2>
          <p>Herzlich willkommen bei RevampIT! Ihr Konto wurde erfolgreich aktiviert.</p>
          <p>Sie können jetzt:</p>
          <ul>
            <li>Workshops und Kurse buchen</li>
            <li>Service-Termine vereinbaren</li>
            <li>Unseren Shop durchsuchen</li>
            <li>Ihre Bestellungen und Termine verwalten</li>
          </ul>
          <p>Wir freuen uns auf Ihre Zusammenarbeit!</p>
        </div>
        <div class="footer">
          <p>${COPYRIGHT_TEXT}</p>
        </div>
      </div>
    </body>
    </html>
  `,
  text: `
Hallo ${name},

Herzlich willkommen bei RevampIT! Ihr Konto wurde erfolgreich aktiviert.

Sie können jetzt Workshops und Kurse buchen, Service-Termine vereinbaren, unseren Shop durchsuchen und Ihre Bestellungen und Termine verwalten.

Wir freuen uns auf Ihre Zusammenarbeit!
${createTextFooter()}
  `.trim(),
});

/**
 * Staff verification code template for @revamp-it.ch emails
 * Uses a warmer, team-focused tone
 */
export const staffVerificationCode = (name: string, code: string): EmailContent => ({
  subject: 'Willkommen im RevampIT Team - Dein Bestätigungscode',
  html: `
    <!DOCTYPE html>
    <html lang="de">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Willkommen im Team</title>
      <style>${BASE_STYLES}</style>
    </head>
    <body>
      <div class="container">
        <div class="header header-green">
          <h1>Willkommen im Team!</h1>
        </div>
        <div class="content">
          <h2>Hallo ${name || 'Teammitglied'},</h2>
          <p>Schön, dass du dabei bist! Als Mitglied des RevampIT Teams erhältst du Zugang zum Admin-Dashboard und kannst aktiv an unserer Mission mitwirken.</p>
          <p>Dein Bestätigungscode:</p>
          <div class="code">${code}</div>
          <p><strong>Was dich erwartet:</strong></p>
          <ul>
            <li>Zugang zum Admin-Dashboard</li>
            <li>Verwaltung von Workshops, Services und Produkten</li>
            <li>Bearbeitung von Kundenanfragen</li>
            <li>Teilnahme an internen Projekten</li>
          </ul>
          <p><strong>Sicherheitshinweis:</strong> Dieser Code ist 15 Minuten gültig. Teile diesen Code mit niemandem.</p>
          <p>Bei Fragen wende dich an das bestehende Team oder schreibe an ${CONTACT.email}.</p>
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
Hallo ${name || 'Teammitglied'},

Schön, dass du dabei bist! Als Mitglied des RevampIT Teams erhältst du Zugang zum Admin-Dashboard.

Dein Bestätigungscode: ${code}

Was dich erwartet:
- Zugang zum Admin-Dashboard
- Verwaltung von Workshops, Services und Produkten
- Bearbeitung von Kundenanfragen
- Teilnahme an internen Projekten

Dieser Code ist 15 Minuten gültig.

Bei Fragen wende dich an das bestehende Team oder schreibe an ${CONTACT.email}.
${createTextFooter()}
  `.trim(),
});

/**
 * Staff welcome email after verification
 * Provides onboarding info for new team members
 */
export const staffWelcome = (name: string): EmailContent => ({
  subject: 'Willkommen im RevampIT Team!',
  html: `
    <!DOCTYPE html>
    <html lang="de">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Willkommen im RevampIT Team</title>
      <style>${BASE_STYLES}</style>
    </head>
    <body>
      <div class="container">
        <div class="header header-green">
          <h1>Willkommen im RevampIT Team!</h1>
        </div>
        <div class="content">
          <h2>Hallo ${name},</h2>
          <p>Dein Konto wurde erfolgreich aktiviert. Du bist jetzt offiziell Teil des RevampIT Teams!</p>
          <h3>Deine ersten Schritte:</h3>
          <ol>
            <li><strong>Admin-Dashboard erkunden:</strong> Unter <a href="https://revampit.vercel.app/admin">/admin</a> findest du alle Verwaltungsfunktionen.</li>
            <li><strong>Team kennenlernen:</strong> Besuche die Team-Seite im Dashboard, um deine Kolleginnen und Kollegen zu sehen.</li>
            <li><strong>Profil vervollständigen:</strong> Füge ein Foto und deine Kontaktdaten hinzu.</li>
          </ol>
          <h3>Wichtige Links:</h3>
          <ul>
            <li><a href="https://revampit.vercel.app/admin">Admin-Dashboard</a></li>
            <li><a href="https://revampit.vercel.app/admin/team">Team-Übersicht</a></li>
            <li><a href="${ORG.website}">Öffentliche Website</a></li>
          </ul>
          <p>Wir freuen uns auf die Zusammenarbeit!</p>
          <p>Bei Fragen erreichst du uns unter ${CONTACT.email}.</p>
        </div>
        <div class="footer">
          <p>${COPYRIGHT_TEXT}</p>
        </div>
      </div>
    </body>
    </html>
  `,
  text: `
Hallo ${name},

Dein Konto wurde erfolgreich aktiviert. Du bist jetzt offiziell Teil des RevampIT Teams!

Deine ersten Schritte:
1. Admin-Dashboard erkunden: Unter /admin findest du alle Verwaltungsfunktionen
2. Team kennenlernen: Besuche die Team-Seite im Dashboard
3. Profil vervollständigen: Füge ein Foto und deine Kontaktdaten hinzu

Wichtige Links:
- Admin-Dashboard: https://revampit.vercel.app/admin
- Team-Übersicht: https://revampit.vercel.app/admin/team
- Öffentliche Website: ${ORG.website}

Wir freuen uns auf die Zusammenarbeit!

Bei Fragen erreichst du uns unter ${CONTACT.email}.
${createTextFooter()}
  `.trim(),
});

export const passwordReset = (name: string, resetUrl: string): EmailContent => ({
  subject: 'Passwort zurücksetzen - RevampIT',
  html: `
    <!DOCTYPE html>
    <html lang="de">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Passwort zurücksetzen</title>
      <style>${BASE_STYLES}</style>
    </head>
    <body>
      <div class="container">
        <div class="header header-green">
          <h1>Passwort zurücksetzen</h1>
        </div>
        <div class="content">
          <h2>Hallo ${name},</h2>
          <p>Sie haben eine Anfrage zum Zurücksetzen Ihres Passworts erhalten.</p>
          <p>Klicken Sie auf den folgenden Button, um Ihr Passwort zurückzusetzen:</p>
          <a href="${resetUrl}" class="button button-green">Passwort zurücksetzen</a>
          <p><strong>Sicherheitshinweis:</strong> Dieser Link ist 1 Stunde gültig. Wenn Sie diese Anfrage nicht gestellt haben, ignorieren Sie diese E-Mail.</p>
          <p>Falls der Button nicht funktioniert, kopieren Sie diesen Link in Ihren Browser:</p>
          <p><a href="${resetUrl}">${resetUrl}</a></p>
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

Sie haben eine Anfrage zum Zurücksetzen Ihres Passworts erhalten.

Klicken Sie auf diesen Link, um Ihr Passwort zurückzusetzen:

${resetUrl}

Dieser Link ist 1 Stunde gültig.

Falls Sie diese Anfrage nicht gestellt haben, ignorieren Sie diese E-Mail.
${createTextFooter()}
  `.trim(),
});
