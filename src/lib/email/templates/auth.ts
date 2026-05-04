/**
 * Authentication Email Templates
 *
 * Templates for verification codes, email verification, welcome, and password reset.
 */

import type { EmailContent } from '../types';
import { createEmailLayout, createTextFooter, BASE_STYLES, COPYRIGHT_TEXT, AUTO_GENERATED_TEXT } from './base-styles';
import { CONTACT, ORG } from '@/config/org';
import { escapeHtml } from '@/lib/utils/escape-html';

// `name` is the user-supplied display name from registration. Verification
// codes (6-digit numerics) and reset URLs (server-generated tokens) don't
// need escaping but the name does — escape before HTML interpolation.

export const verificationCode = (name: string, code: string): EmailContent => ({
  subject: 'Dein Bestätigungscode - ${ORG.name}',
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
          <h2>Hallo ${escapeHtml(name || 'Benutzer')},</h2>
          <p>Vielen Dank für deine Registrierung bei ${ORG.name}! Gib den folgenden Code ein, um deine E-Mail-Adresse zu bestätigen:</p>
          <div class="code">${code}</div>
          <p><strong>Sicherheitshinweis:</strong> Dieser Code ist 15 Minuten gültig. Teile diesen Code mit niemandem.</p>
          <p>Wenn du diese E-Mail nicht angefordert hast, ignoriere sie bitte.</p>
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

Vielen Dank für deine Registrierung bei ${ORG.name}!

Dein Bestätigungscode lautet: ${code}

Dieser Code ist 15 Minuten gültig.

Falls du diese E-Mail nicht angefordert hast, ignoriere sie bitte.
${createTextFooter()}
  `.trim(),
});

export const emailVerification = (name: string, verificationUrl: string): EmailContent => ({
  subject: 'E-Mail-Adresse bestätigen - ${ORG.name}',
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
          <h1>Willkommen bei ${ORG.name}!</h1>
        </div>
        <div class="content">
          <h2>Hallo ${escapeHtml(name)},</h2>
          <p>Vielen Dank für deine Registrierung bei ${ORG.name}! Um dein Konto zu aktivieren, bestätige bitte deine E-Mail-Adresse.</p>
          <p>Klicke auf den folgenden Button, um deine E-Mail-Adresse zu bestätigen:</p>
          <a href="${verificationUrl}" class="button button-green">E-Mail-Adresse bestätigen</a>
          <p><strong>Sicherheitshinweis:</strong> Dieser Link ist 24 Stunden gültig. Wenn du diese E-Mail nicht angefordert hast, ignoriere sie bitte.</p>
          <p>Falls der Button nicht funktioniert, kopiere diesen Link in deinen Browser:</p>
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

Vielen Dank für deine Registrierung bei ${ORG.name}!

Um dein Konto zu aktivieren, bestätige bitte deine E-Mail-Adresse, indem du auf diesen Link klickst:

${verificationUrl}

Dieser Link ist 24 Stunden gültig.

Falls du diese E-Mail nicht angefordert hast, ignoriere sie bitte.
${createTextFooter()}
  `.trim(),
});

export const welcome = (name: string): EmailContent => ({
  subject: 'Willkommen bei ${ORG.name}!',
  html: `
    <!DOCTYPE html>
    <html lang="de">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Willkommen bei ${ORG.name}</title>
      <style>${BASE_STYLES}</style>
    </head>
    <body>
      <div class="container">
        <div class="header header-green">
          <h1>Willkommen bei ${ORG.name}!</h1>
        </div>
        <div class="content">
          <h2>Hallo ${escapeHtml(name)},</h2>
          <p>Herzlich willkommen bei ${ORG.name}! Dein Konto wurde erfolgreich aktiviert.</p>
          <p>Du kannst jetzt:</p>
          <ul>
            <li>Workshops und Kurse buchen</li>
            <li>Service-Termine vereinbaren</li>
            <li>Unseren Shop durchsuchen</li>
            <li>deine Bestellungen und Termine verwalten</li>
          </ul>
          <p>Wir freuen uns auf die Zusammenarbeit!</p>
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

Herzlich willkommen bei ${ORG.name}! Dein Konto wurde erfolgreich aktiviert.

Du kannst jetzt Workshops und Kurse buchen, Service-Termine vereinbaren, unseren Shop durchsuchen und deine Bestellungen und Termine verwalten.

Wir freuen uns auf die Zusammenarbeit!
${createTextFooter()}
  `.trim(),
});

/**
 * Staff verification code template for @revamp-it.ch emails
 * Uses a warmer, team-focused tone
 */
export const staffVerificationCode = (name: string, code: string): EmailContent => ({
  subject: 'Willkommen im ${ORG.name} Team - Dein Bestätigungscode',
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
          <h2>Hallo ${escapeHtml(name || 'Teammitglied')},</h2>
          <p>Schön, dass du dabei bist! Als Mitglied des ${ORG.name} Teams erhältst du Zugang zum Admin-Dashboard und kannst aktiv an unserer Mission mitwirken.</p>
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

Schön, dass du dabei bist! Als Mitglied des ${ORG.name} Teams erhältst du Zugang zum Admin-Dashboard.

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
  subject: 'Willkommen im ${ORG.name} Team!',
  html: `
    <!DOCTYPE html>
    <html lang="de">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Willkommen im ${ORG.name} Team</title>
      <style>${BASE_STYLES}</style>
    </head>
    <body>
      <div class="container">
        <div class="header header-green">
          <h1>Willkommen im ${ORG.name} Team!</h1>
        </div>
        <div class="content">
          <h2>Hallo ${escapeHtml(name)},</h2>
          <p>Dein Konto wurde erfolgreich aktiviert. Du bist jetzt offiziell Teil des ${ORG.name} Teams!</p>
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

Dein Konto wurde erfolgreich aktiviert. Du bist jetzt offiziell Teil des ${ORG.name} Teams!

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
  subject: 'Passwort zurücksetzen - ${ORG.name}',
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
          <h2>Hallo ${escapeHtml(name)},</h2>
          <p>Du hast eine Anfrage zum Zurücksetzen deines Passworts erhalten.</p>
          <p>Klicke auf den folgenden Button, um dein Passwort zurückzusetzen:</p>
          <a href="${resetUrl}" class="button button-green">Passwort zurücksetzen</a>
          <p><strong>Sicherheitshinweis:</strong> Dieser Link ist 1 Stunde gültig. Wenn du diese Anfrage nicht gestellt hast, ignoriere diese E-Mail.</p>
          <p>Falls der Button nicht funktioniert, kopiere diesen Link in deinen Browser:</p>
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

Du hast eine Anfrage zum Zurücksetzen deines Passworts erhalten.

Klicke auf diesen Link, um dein Passwort zurückzusetzen:

${resetUrl}

Dieser Link ist 1 Stunde gültig.

Falls du diese Anfrage nicht gestellt hast, ignoriere diese E-Mail.
${createTextFooter()}
  `.trim(),
});

/**
 * Password change confirmation email
 * Sent after a user successfully resets their password
 */
export const passwordChangeConfirmation = (name: string): EmailContent => ({
  subject: 'Passwort erfolgreich geändert - ${ORG.name}',
  html: `
    <!DOCTYPE html>
    <html lang="de">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Passwort geändert</title>
      <style>${BASE_STYLES}</style>
    </head>
    <body>
      <div class="container">
        <div class="header header-green">
          <h1>Passwort geändert</h1>
        </div>
        <div class="content">
          <h2>Hallo ${escapeHtml(name)},</h2>
          <p>Dein Passwort wurde erfolgreich geändert.</p>
          <p><strong>Sicherheitshinweis:</strong> Falls du diese Änderung nicht vorgenommen hast, kontaktiere uns bitte umgehend unter ${CONTACT.email}.</p>
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

Dein Passwort wurde erfolgreich geändert.

Sicherheitshinweis: Falls du diese Änderung nicht vorgenommen hast, kontaktiere uns bitte umgehend unter ${CONTACT.email}.
${createTextFooter()}
  `.trim(),
});
