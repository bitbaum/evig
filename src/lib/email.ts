/**
 * Email utilities for RevampIT
 * Handles sending emails using nodemailer
 */

import { logger } from '@/lib/logger'
import { EMAIL_CONFIG } from '@/config/email'
import type { Transporter } from 'nodemailer'

// Email configuration
const emailConfig = {
  host: EMAIL_CONFIG.HOST,
  port: EMAIL_CONFIG.PORT,
  secure: EMAIL_CONFIG.SECURE,
  auth: {
    user: EMAIL_CONFIG.USER,
    pass: EMAIL_CONFIG.PASS,
  },
}

// Create transporter
let transporter: Transporter | null = null

export async function getTransporter(): Promise<Transporter> {
  if (!transporter) {
    const nodemailer = await import('nodemailer')
    transporter = nodemailer.createTransport(emailConfig)
  }
  return transporter
}

// Email templates
export const emailTemplates = {
  verificationCode: (name: string, code: string) => ({
    subject: 'Ihr Bestätigungscode - RevampIT',
    html: `
      <!DOCTYPE html>
      <html lang="de">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Bestätigungscode</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #22c55e; color: white; padding: 20px; text-align: center; }
          .content { padding: 30px 20px; background-color: #f9f9f9; }
          .code { font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #22c55e; background-color: #f0fdf4; padding: 20px; text-align: center; border-radius: 8px; margin: 20px 0; }
          .footer { padding: 20px; text-align: center; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
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
            <p>Diese E-Mail wurde automatisch generiert. Bitte antworten Sie nicht darauf.</p>
            <p>© 2025 RevampIT - Die Zukunft der IT durch nachhaltige Aufarbeitung</p>
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

      Mit freundlichen Grüssen,
      Das RevampIT Team
    `,
  }),

  emailVerification: (name: string, verificationUrl: string) => ({
    subject: 'E-Mail-Adresse bestätigen - RevampIT',
    html: `
      <!DOCTYPE html>
      <html lang="de">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>E-Mail-Adresse bestätigen</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #22c55e; color: white; padding: 20px; text-align: center; }
          .content { padding: 30px 20px; background-color: #f9f9f9; }
          .button { display: inline-block; padding: 12px 24px; background-color: #22c55e; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { padding: 20px; text-align: center; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Willkommen bei RevampIT!</h1>
          </div>
          <div class="content">
            <h2>Hallo ${name},</h2>
            <p>Vielen Dank für Ihre Registrierung bei RevampIT! Um Ihr Konto zu aktivieren, bestätigen Sie bitte Ihre E-Mail-Adresse.</p>
            <p>Klicken Sie auf den folgenden Button, um Ihre E-Mail-Adresse zu bestätigen:</p>
            <a href="${verificationUrl}" class="button">E-Mail-Adresse bestätigen</a>
            <p><strong>Sicherheitshinweis:</strong> Dieser Link ist 24 Stunden gültig. Wenn Sie diese E-Mail nicht angefordert haben, ignorieren Sie sie bitte.</p>
            <p>Falls der Button nicht funktioniert, kopieren Sie diesen Link in Ihren Browser:</p>
            <p><a href="${verificationUrl}">${verificationUrl}</a></p>
          </div>
          <div class="footer">
            <p>Diese E-Mail wurde automatisch generiert. Bitte antworten Sie nicht darauf.</p>
            <p>© 2025 RevampIT - Die Zukunft der IT durch nachhaltige Aufarbeitung</p>
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

      Mit freundlichen Grüssen,
      Das RevampIT Team
    `,
  }),

  welcome: (name: string) => ({
    subject: 'Willkommen bei RevampIT!',
    html: `
      <!DOCTYPE html>
      <html lang="de">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Willkommen bei RevampIT</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #22c55e; color: white; padding: 20px; text-align: center; }
          .content { padding: 30px 20px; background-color: #f9f9f9; }
          .footer { padding: 20px; text-align: center; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
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
            <p>© 2025 RevampIT - Die Zukunft der IT durch nachhaltige Aufarbeitung</p>
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

      Mit freundlichen Grüssen,
      Das RevampIT Team
    `,
  }),

  passwordReset: (name: string, resetUrl: string) => ({
    subject: 'Passwort zurücksetzen - RevampIT',
    html: `
      <!DOCTYPE html>
      <html lang="de">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Passwort zurücksetzen</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #22c55e; color: white; padding: 20px; text-align: center; }
          .content { padding: 30px 20px; background-color: #f9f9f9; }
          .button { display: inline-block; padding: 12px 24px; background-color: #22c55e; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { padding: 20px; text-align: center; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Passwort zurücksetzen</h1>
          </div>
          <div class="content">
            <h2>Hallo ${name},</h2>
            <p>Sie haben eine Anfrage zum Zurücksetzen Ihres Passworts erhalten.</p>
            <p>Klicken Sie auf den folgenden Button, um Ihr Passwort zurückzusetzen:</p>
            <a href="${resetUrl}" class="button">Passwort zurücksetzen</a>
            <p><strong>Sicherheitshinweis:</strong> Dieser Link ist 1 Stunde gültig. Wenn Sie diese Anfrage nicht gestellt haben, ignorieren Sie diese E-Mail.</p>
            <p>Falls der Button nicht funktioniert, kopieren Sie diesen Link in Ihren Browser:</p>
            <p><a href="${resetUrl}">${resetUrl}</a></p>
          </div>
          <div class="footer">
            <p>Diese E-Mail wurde automatisch generiert. Bitte antworten Sie nicht darauf.</p>
            <p>© 2025 RevampIT - Die Zukunft der IT durch nachhaltige Aufarbeitung</p>
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

      Mit freundlichen Grüssen,
      Das RevampIT Team
    `,
  }),

  repairerApplicationSubmitted: (name: string, applicationId: string) => ({
    subject: 'Reparateur-Bewerbung erhalten - RevampIT',
    html: `
      <!DOCTYPE html>
      <html lang="de">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Reparateur-Bewerbung erhalten</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #22c55e; color: white; padding: 20px; text-align: center; }
          .content { padding: 30px 20px; background-color: #f9f9f9; }
          .footer { padding: 20px; text-align: center; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
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
            <p>Diese E-Mail wurde automatisch generiert. Bitte antworten Sie nicht darauf.</p>
            <p>© 2025 RevampIT - Die Zukunft der IT durch nachhaltige Aufarbeitung</p>
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

      Mit freundlichen Grüssen,
      Das RevampIT Team
    `,
  }),

  repairerApplicationApproved: (name: string, dashboardUrl: string) => ({
    subject: 'Reparateur-Bewerbung genehmigt - RevampIT',
    html: `
      <!DOCTYPE html>
      <html lang="de">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Reparateur-Bewerbung genehmigt</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #22c55e; color: white; padding: 20px; text-align: center; }
          .content { padding: 30px 20px; background-color: #f9f9f9; }
          .button { display: inline-block; padding: 12px 24px; background-color: #22c55e; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { padding: 20px; text-align: center; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
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
            <a href="${dashboardUrl}" class="button">Zum Reparateur-Dashboard</a>
            <p>Bitte aktualisieren Sie Ihre Verfügbarkeit und Dienstleistungen in Ihrem Profil, um sofort mit Kunden in Kontakt zu treten.</p>
            <p>Willkommen im RevampIT Reparateur-Netzwerk!</p>
          </div>
          <div class="footer">
            <p>Diese E-Mail wurde automatisch generiert. Bitte antworten Sie nicht darauf.</p>
            <p>© 2025 RevampIT - Die Zukunft der IT durch nachhaltige Aufarbeitung</p>
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

      Mit freundlichen Grüssen,
      Das RevampIT Team
    `,
  }),

  repairerApplicationRejected: (name: string, rejectionReason: string, supportEmail: string) => ({
    subject: 'Reparateur-Bewerbung - RevampIT',
    html: `
      <!DOCTYPE html>
      <html lang="de">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Reparateur-Bewerbung</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #dc2626; color: white; padding: 20px; text-align: center; }
          .content { padding: 30px 20px; background-color: #f9f9f9; }
          .footer { padding: 20px; text-align: center; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
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
            <p>Diese E-Mail wurde automatisch generiert. Bitte antworten Sie nicht darauf.</p>
            <p>© 2025 RevampIT - Die Zukunft der IT durch nachhaltige Aufarbeitung</p>
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

      Mit freundlichen Grüssen,
      Das RevampIT Team
    `,
  }),

  repairerApplicationChangesRequested: (name: string, requestedChanges: string, dashboardUrl: string) => ({
    subject: 'Reparateur-Bewerbung - Änderungen erforderlich - RevampIT',
    html: `
      <!DOCTYPE html>
      <html lang="de">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Änderungen erforderlich</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #f59e0b; color: white; padding: 20px; text-align: center; }
          .content { padding: 30px 20px; background-color: #f9f9f9; }
          .button { display: inline-block; padding: 12px 24px; background-color: #f59e0b; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { padding: 20px; text-align: center; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Änderungen erforderlich</h1>
          </div>
          <div class="content">
            <h2>Hallo ${name},</h2>
            <p>Wir haben Ihre Bewerbung als Reparateur bei RevampIT geprüft und benötigen einige zusätzliche Informationen oder Korrekturen.</p>
            <p><strong>Erforderliche Änderungen:</strong></p>
            <div style="background-color: #fef3c7; padding: 15px; border-radius: 5px; margin: 15px 0;">
              ${requestedChanges.replace(/\n/g, '<br>')}
            </div>
            <p>Bitte nehmen Sie diese Änderungen in Ihrem Bewerbungsformular vor und reichen Sie Ihre Bewerbung erneut ein.</p>
            <a href="${dashboardUrl}" class="button">Bewerbung bearbeiten</a>
            <p>Nach Einreichung der korrigierten Bewerbung werden wir diese zeitnah erneut prüfen.</p>
          </div>
          <div class="footer">
            <p>Diese E-Mail wurde automatisch generiert. Bitte antworten Sie nicht darauf.</p>
            <p>© 2025 RevampIT - Die Zukunft der IT durch nachhaltige Aufarbeitung</p>
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

      Mit freundlichen Grüssen,
      Das RevampIT Team
    `,
  }),

  adminNewRepairerApplication: (applicantName: string, applicantEmail: string, adminDashboardUrl: string) => ({
    subject: 'Neue Reparateur-Bewerbung wartet auf Prüfung - RevampIT',
    html: `
      <!DOCTYPE html>
      <html lang="de">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Neue Reparateur-Bewerbung</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #22c55e; color: white; padding: 20px; text-align: center; }
          .content { padding: 30px 20px; background-color: #f9f9f9; }
          .button { display: inline-block; padding: 12px 24px; background-color: #22c55e; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { padding: 20px; text-align: center; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Neue Reparateur-Bewerbung</h1>
          </div>
          <div class="content">
            <p>Eine neue Reparateur-Bewerbung wurde eingereicht und wartet auf Ihre Prüfung.</p>
            <p><strong>Bewerber:</strong> ${applicantName}</p>
            <p><strong>E-Mail:</strong> ${applicantEmail}</p>
            <p>Bitte prüfen Sie die Bewerbung zeitnah, um eine schnelle Bearbeitung zu gewährleisten.</p>
            <a href="${adminDashboardUrl}" class="button">Bewerbung prüfen</a>
          </div>
          <div class="footer">
            <p>Diese E-Mail wurde automatisch generiert.</p>
            <p>© 2025 RevampIT - Die Zukunft der IT durch nachhaltige Aufarbeitung</p>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `
      Eine neue Reparateur-Bewerbung wurde eingereicht und wartet auf Ihre Prüfung.

      Bewerber: ${applicantName}
      E-Mail: ${applicantEmail}

      Bitte prüfen Sie die Bewerbung zeitnah:
      ${adminDashboardUrl}

      Mit freundlichen Grüssen,
      RevampIT System
    `,
  }),

  newReviewNotification: (repairerName: string, reviewerName: string, rating: number, reviewContent: string, reviewUrl: string) => ({
    subject: 'Neue Bewertung erhalten - RevampIT',
    html: `
      <!DOCTYPE html>
      <html lang="de">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Neue Bewertung</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #22c55e; color: white; padding: 20px; text-align: center; }
          .content { padding: 30px 20px; background-color: #f9f9f9; }
          .rating { color: #f59e0b; font-size: 18px; font-weight: bold; }
          .button { display: inline-block; padding: 12px 24px; background-color: #22c55e; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { padding: 20px; text-align: center; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Neue Bewertung erhalten</h1>
          </div>
          <div class="content">
            <p>Hallo ${repairerName},</p>
            <p>Sie haben eine neue Bewertung erhalten!</p>
            <p><strong>Bewerter:</strong> ${reviewerName}</p>
            <p><strong>Bewertung:</strong> <span class="rating">${'★'.repeat(Math.floor(rating))}${'☆'.repeat(5 - Math.floor(rating))} (${rating}/5)</span></p>
            <p><strong>Bewertungstext:</strong></p>
            <div style="background-color: white; padding: 15px; border-radius: 5px; margin: 15px 0;">
              ${reviewContent.replace(/\n/g, '<br>')}
            </div>
            <p>Diese Bewertung hilft anderen Kunden, fundierte Entscheidungen zu treffen. Sie können auf diese Bewertung antworten, um Ihr Engagement zu zeigen.</p>
            <a href="${reviewUrl}" class="button">Bewertung anzeigen & antworten</a>
          </div>
          <div class="footer">
            <p>Diese E-Mail wurde automatisch generiert. Bitte antworten Sie nicht darauf.</p>
            <p>© 2025 RevampIT - Die Zukunft der IT durch nachhaltige Aufarbeitung</p>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `
      Hallo ${repairerName},

      Sie haben eine neue Bewertung erhalten!

      Bewerter: ${reviewerName}
      Bewertung: ${'★'.repeat(Math.floor(rating))}${'☆'.repeat(5 - Math.floor(rating))} (${rating}/5)

      Bewertungstext:
      ${reviewContent}

      Diese Bewertung hilft anderen Kunden, fundierte Entscheidungen zu treffen. Sie können auf diese Bewertung antworten, um Ihr Engagement zu zeigen.

      Bewertung anzeigen: ${reviewUrl}

      Mit freundlichen Grüssen,
      Das RevampIT Team
    `,
  }),
}

// Email template function type
type EmailTemplateFn = (...args: unknown[]) => {
  subject: string
  html: string
  text: string
}

// Send email function
export async function sendEmail(to: string, template: keyof typeof emailTemplates, ...args: unknown[]) {
  try {
    const transporter = await getTransporter()
    const templateFn = emailTemplates[template] as EmailTemplateFn
    const emailTemplate = templateFn(...args)

    const mailOptions = {
      from: EMAIL_CONFIG.FROM || emailConfig.auth.user,
      to,
      subject: emailTemplate.subject,
      html: emailTemplate.html,
      text: emailTemplate.text,
    }

    const info = await transporter.sendMail(mailOptions)
    logger.info('Email sent', { messageId: info.messageId, to })
    return { success: true, messageId: info.messageId }
  } catch (error) {
    logger.error('Email send error', { error, to })
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

// Test email configuration
export async function testEmailConfig() {
  try {
    const transporter = await getTransporter()
    await transporter.verify()
    return { success: true }
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}
