/**
 * Repairer Application Email Templates
 *
 * Templates for repairer application workflow - submission, approval, rejection, changes requested.
 */

import type { EmailContent } from '../types';
import { BASE_STYLES, COPYRIGHT_TEXT, AUTO_GENERATED_TEXT, createTextFooter } from './base-styles';
import { escapeHtml } from '@/lib/utils/escape-html';

// Applicant `name`, `rejectionReason`, and `requestedChanges` are
// user/admin-entered free text — escape before HTML interpolation.

export const repairerApplicationSubmitted = (name: string, applicationId: string): EmailContent => ({
  subject: 'Techniker-Bewerbung erhalten - RevampIT',
  html: `
    <!DOCTYPE html>
    <html lang="de">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Techniker-Bewerbung erhalten</title>
      <style>${BASE_STYLES}</style>
    </head>
    <body>
      <div class="container">
        <div class="header header-green">
          <h1>Techniker-Bewerbung erhalten</h1>
        </div>
        <div class="content">
          <h2>Hallo ${escapeHtml(name)},</h2>
          <p>Vielen Dank für deine Bewerbung als Techniker bei RevampIT! Wir haben deine Unterlagen erhalten und werden diese zeitnah prüfen.</p>
          <p><strong>Bewerbungs-ID:</strong> ${escapeHtml(applicationId)}</p>
          <p>Der Prüfungsprozess umfasst:</p>
          <ul>
            <li>Verifizierung deiner Dokumente</li>
            <li>Überprüfung deiner Zertifizierungen</li>
            <li>Qualitätssicherung deiner Angaben</li>
          </ul>
          <p>Du erhältst eine Benachrichtigung, sobald wir unsere Prüfung abgeschlossen haben. Dies kann bis zu 7 Werktage dauern.</p>
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

Vielen Dank für deine Bewerbung als Techniker bei RevampIT! Wir haben deine Unterlagen erhalten und werden diese zeitnah prüfen.

Bewerbungs-ID: ${applicationId}

Der Prüfungsprozess umfasst:
- Verifizierung deiner Dokumente
- Überprüfung deiner Zertifizierungen
- Qualitätssicherung deiner Angaben

Du erhältst eine Benachrichtigung, sobald wir unsere Prüfung abgeschlossen haben. Dies kann bis zu 7 Werktage dauern.

Bei Fragen kannst du uns jederzeit kontaktieren.
${createTextFooter()}
  `.trim(),
});

export const repairerApplicationApproved = (name: string, dashboardUrl: string): EmailContent => ({
  subject: 'Techniker-Bewerbung genehmigt - RevampIT',
  html: `
    <!DOCTYPE html>
    <html lang="de">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Techniker-Bewerbung genehmigt</title>
      <style>${BASE_STYLES}</style>
    </head>
    <body>
      <div class="container">
        <div class="header header-green">
          <h1>🎉 Herzlichen Glückwunsch!</h1>
        </div>
        <div class="content">
          <h2>Hallo ${escapeHtml(name)},</h2>
          <p>Wir freuen uns, dir mitteilen zu können, dass deine Bewerbung als Techniker bei RevampIT <strong>genehmigt</strong> wurde!</p>
          <p>Du hast jetzt Zugriff auf:</p>
          <ul>
            <li>Techniker-Dashboard mit Service-Verwaltung</li>
            <li>Kundenanfragen und Terminplanung</li>
            <li>Bewertungs- und Reputationssystem</li>
            <li>Verkaufsplattform für deine Dienstleistungen</li>
          </ul>
          <a href="${dashboardUrl}" class="button button-green">Zum Techniker-Dashboard</a>
          <p>Bitte aktualisiere deine Verfügbarkeit und Dienstleistungen in deinem Profil, um sofort mit Kunden in Kontakt zu treten.</p>
          <p>Willkommen im RevampIT Techniker-Netzwerk!</p>
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

Herzlichen Glückwunsch! Deine Bewerbung als Techniker bei RevampIT wurde genehmigt!

Du hast jetzt Zugriff auf:
- Techniker-Dashboard mit Service-Verwaltung
- Kundenanfragen und Terminplanung
- Bewertungs- und Reputationssystem
- Verkaufsplattform für deine Dienstleistungen

Bitte aktualisiere deine Verfügbarkeit und Dienstleistungen in deinem Profil:
${dashboardUrl}

Willkommen im RevampIT Techniker-Netzwerk!
${createTextFooter()}
  `.trim(),
});

export const repairerApplicationRejected = (
  name: string,
  rejectionReason: string,
  supportEmail: string
): EmailContent => ({
  subject: 'Techniker-Bewerbung - RevampIT',
  html: `
    <!DOCTYPE html>
    <html lang="de">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Techniker-Bewerbung</title>
      <style>${BASE_STYLES}</style>
    </head>
    <body>
      <div class="container">
        <div class="header header-red">
          <h1>Techniker-Bewerbung</h1>
        </div>
        <div class="content">
          <h2>Hallo ${escapeHtml(name)},</h2>
          <p>Nach sorgfältiger Prüfung deiner Bewerbung als Techniker bei RevampIT müssen wir dir mitteilen, dass wir deine Bewerbung derzeit nicht genehmigen können.</p>
          <p><strong>Grund:</strong></p>
          <p>${escapeHtml(rejectionReason)}</p>
          <p>Du kannst dich jederzeit erneut bewerben, nachdem du die genannten Punkte behoben hast. Bei Fragen stehen wir dir gerne zur Verfügung.</p>
          <p>Kontaktiere uns unter: <a href="mailto:${escapeHtml(supportEmail)}">${escapeHtml(supportEmail)}</a></p>
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

Nach sorgfältiger Prüfung deiner Bewerbung als Techniker bei RevampIT müssen wir dir mitteilen, dass wir deine Bewerbung derzeit nicht genehmigen können.

Grund:
${rejectionReason}

Du kannst dich jederzeit erneut bewerben, nachdem du die genannten Punkte behoben hast. Bei Fragen stehen wir dir gerne zur Verfügung.

Kontaktiere uns unter: ${supportEmail}
${createTextFooter()}
  `.trim(),
});

export const repairerApplicationChangesRequested = (
  name: string,
  requestedChanges: string,
  dashboardUrl: string
): EmailContent => ({
  subject: 'Techniker-Bewerbung - Änderungen erforderlich - RevampIT',
  html: `
    <!DOCTYPE html>
    <html lang="de">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Änderungen erforderlich</title>
      <style>${BASE_STYLES}</style>
    </head>
    <body>
      <div class="container">
        <div class="header header-orange">
          <h1>Änderungen erforderlich</h1>
        </div>
        <div class="content">
          <h2>Hallo ${escapeHtml(name)},</h2>
          <p>Wir haben deine Bewerbung als Techniker bei RevampIT geprüft und benötigen einige zusätzliche Informationen oder Korrekturen.</p>
          <p><strong>Erforderliche Änderungen:</strong></p>
          <div class="highlight-box">
            ${escapeHtml(requestedChanges).replace(/\n/g, '<br>')}
          </div>
          <p>Bitte nimm diese Änderungen in deinem Bewerbungsformular vor und reiche deine Bewerbung erneut ein.</p>
          <a href="${dashboardUrl}" class="button button-orange">Bewerbung bearbeiten</a>
          <p>Nach Einreichung der korrigierten Bewerbung werden wir diese zeitnah erneut prüfen.</p>
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

Wir haben deine Bewerbung als Techniker bei RevampIT geprüft und benötigen einige zusätzliche Informationen oder Korrekturen.

Erforderliche Änderungen:
${requestedChanges}

Bitte nimm diese Änderungen in deinem Bewerbungsformular vor und reiche deine Bewerbung erneut ein.

Bewerbung bearbeiten: ${dashboardUrl}

Nach Einreichung der korrigierten Bewerbung werden wir diese zeitnah erneut prüfen.
${createTextFooter()}
  `.trim(),
});
