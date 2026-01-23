/**
 * Repairer Application Email Templates
 *
 * Templates for repairer application workflow - submission, approval, rejection, changes requested.
 */

import type { EmailContent } from '../types';
import { BASE_STYLES, COPYRIGHT_TEXT, AUTO_GENERATED_TEXT, createTextFooter } from './base-styles';

export const repairerApplicationSubmitted = (name: string, applicationId: string): EmailContent => ({
  subject: 'Reparateur-Bewerbung erhalten - RevampIT',
  html: `
    <!DOCTYPE html>
    <html lang="de">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Reparateur-Bewerbung erhalten</title>
      <style>${BASE_STYLES}</style>
    </head>
    <body>
      <div class="container">
        <div class="header header-green">
          <h1>Reparateur-Bewerbung erhalten</h1>
        </div>
        <div class="content">
          <h2>Hallo ${name},</h2>
          <p>Vielen Dank für Ihre Bewerbung als Reparateur bei RevampIT! Wir haben Ihre Unterlagen erhalten und werden diese zeitnah prüfen.</p>
          <p><strong>Bewerbungs-ID:</strong> ${applicationId}</p>
          <p>Der Prüfungsprozess umfasst:</p>
          <ul>
            <li>Verifizierung Ihrer Dokumente</li>
            <li>Überprüfung Ihrer Zertifizierungen</li>
            <li>Qualitätssicherung Ihrer Angaben</li>
          </ul>
          <p>Sie erhalten eine Benachrichtigung, sobald wir unsere Prüfung abgeschlossen haben. Dies kann bis zu 7 Werktage dauern.</p>
          <p>Bei Fragen können Sie uns jederzeit kontaktieren.</p>
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

Vielen Dank für Ihre Bewerbung als Reparateur bei RevampIT! Wir haben Ihre Unterlagen erhalten und werden diese zeitnah prüfen.

Bewerbungs-ID: ${applicationId}

Der Prüfungsprozess umfasst:
- Verifizierung Ihrer Dokumente
- Überprüfung Ihrer Zertifizierungen
- Qualitätssicherung Ihrer Angaben

Sie erhalten eine Benachrichtigung, sobald wir unsere Prüfung abgeschlossen haben. Dies kann bis zu 7 Werktage dauern.

Bei Fragen können Sie uns jederzeit kontaktieren.
${createTextFooter()}
  `.trim(),
});

export const repairerApplicationApproved = (name: string, dashboardUrl: string): EmailContent => ({
  subject: 'Reparateur-Bewerbung genehmigt - RevampIT',
  html: `
    <!DOCTYPE html>
    <html lang="de">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Reparateur-Bewerbung genehmigt</title>
      <style>${BASE_STYLES}</style>
    </head>
    <body>
      <div class="container">
        <div class="header header-green">
          <h1>🎉 Herzlichen Glückwunsch!</h1>
        </div>
        <div class="content">
          <h2>Hallo ${name},</h2>
          <p>Wir freuen uns, Ihnen mitteilen zu können, dass Ihre Bewerbung als Reparateur bei RevampIT <strong>genehmigt</strong> wurde!</p>
          <p>Sie haben jetzt Zugriff auf:</p>
          <ul>
            <li>Reparateur-Dashboard mit Service-Verwaltung</li>
            <li>Kundenanfragen und Terminplanung</li>
            <li>Bewertungs- und Reputationssystem</li>
            <li>Verkaufsplattform für Ihre Dienstleistungen</li>
          </ul>
          <a href="${dashboardUrl}" class="button button-green">Zum Reparateur-Dashboard</a>
          <p>Bitte aktualisieren Sie Ihre Verfügbarkeit und Dienstleistungen in Ihrem Profil, um sofort mit Kunden in Kontakt zu treten.</p>
          <p>Willkommen im RevampIT Reparateur-Netzwerk!</p>
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

Herzlichen Glückwunsch! Ihre Bewerbung als Reparateur bei RevampIT wurde genehmigt!

Sie haben jetzt Zugriff auf:
- Reparateur-Dashboard mit Service-Verwaltung
- Kundenanfragen und Terminplanung
- Bewertungs- und Reputationssystem
- Verkaufsplattform für Ihre Dienstleistungen

Bitte aktualisieren Sie Ihre Verfügbarkeit und Dienstleistungen in Ihrem Profil:
${dashboardUrl}

Willkommen im RevampIT Reparateur-Netzwerk!
${createTextFooter()}
  `.trim(),
});

export const repairerApplicationRejected = (
  name: string,
  rejectionReason: string,
  supportEmail: string
): EmailContent => ({
  subject: 'Reparateur-Bewerbung - RevampIT',
  html: `
    <!DOCTYPE html>
    <html lang="de">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Reparateur-Bewerbung</title>
      <style>${BASE_STYLES}</style>
    </head>
    <body>
      <div class="container">
        <div class="header header-red">
          <h1>Reparateur-Bewerbung</h1>
        </div>
        <div class="content">
          <h2>Hallo ${name},</h2>
          <p>Nach sorgfältiger Prüfung Ihrer Bewerbung als Reparateur bei RevampIT müssen wir Ihnen mitteilen, dass wir Ihre Bewerbung derzeit nicht genehmigen können.</p>
          <p><strong>Grund:</strong></p>
          <p>${rejectionReason}</p>
          <p>Sie können sich jederzeit erneut bewerben, nachdem Sie die genannten Punkte behoben haben. Bei Fragen stehen wir Ihnen gerne zur Verfügung.</p>
          <p>Kontaktieren Sie uns unter: <a href="mailto:${supportEmail}">${supportEmail}</a></p>
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

Nach sorgfältiger Prüfung Ihrer Bewerbung als Reparateur bei RevampIT müssen wir Ihnen mitteilen, dass wir Ihre Bewerbung derzeit nicht genehmigen können.

Grund:
${rejectionReason}

Sie können sich jederzeit erneut bewerben, nachdem Sie die genannten Punkte behoben haben. Bei Fragen stehen wir Ihnen gerne zur Verfügung.

Kontaktieren Sie uns unter: ${supportEmail}
${createTextFooter()}
  `.trim(),
});

export const repairerApplicationChangesRequested = (
  name: string,
  requestedChanges: string,
  dashboardUrl: string
): EmailContent => ({
  subject: 'Reparateur-Bewerbung - Änderungen erforderlich - RevampIT',
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
          <h2>Hallo ${name},</h2>
          <p>Wir haben Ihre Bewerbung als Reparateur bei RevampIT geprüft und benötigen einige zusätzliche Informationen oder Korrekturen.</p>
          <p><strong>Erforderliche Änderungen:</strong></p>
          <div class="highlight-box">
            ${requestedChanges.replace(/\n/g, '<br>')}
          </div>
          <p>Bitte nehmen Sie diese Änderungen in Ihrem Bewerbungsformular vor und reichen Sie Ihre Bewerbung erneut ein.</p>
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

Wir haben Ihre Bewerbung als Reparateur bei RevampIT geprüft und benötigen einige zusätzliche Informationen oder Korrekturen.

Erforderliche Änderungen:
${requestedChanges}

Bitte nehmen Sie diese Änderungen in Ihrem Bewerbungsformular vor und reichen Sie Ihre Bewerbung erneut ein.

Bewerbung bearbeiten: ${dashboardUrl}

Nach Einreichung der korrigierten Bewerbung werden wir diese zeitnah erneut prüfen.
${createTextFooter()}
  `.trim(),
});
