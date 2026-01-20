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

  // Workshop Proposal Templates
  workshopProposalSubmitted: (name: string, workshopTitle: string, proposalId: string) => ({
    subject: 'Workshop-Vorschlag eingereicht - RevampIT',
    html: `
      <!DOCTYPE html>
      <html lang="de">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Workshop-Vorschlag eingereicht</title>
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
            <h1>Workshop-Vorschlag eingereicht</h1>
          </div>
          <div class="content">
            <h2>Hallo ${name},</h2>
            <p>Vielen Dank für Ihren Workshop-Vorschlag bei RevampIT! Wir haben Ihre Einreichung erhalten.</p>
            <p><strong>Workshop-Titel:</strong> ${workshopTitle}</p>
            <p><strong>Vorschlags-ID:</strong> ${proposalId}</p>
            <p>Unser Team wird Ihren Vorschlag zeitnah prüfen. Der Prüfungsprozess umfasst:</p>
            <ul>
              <li>Überprüfung der Workshop-Inhalte</li>
              <li>Bewertung der Zielgruppe und des Formats</li>
              <li>Abstimmung mit unserem Workshop-Kalender</li>
            </ul>
            <p>Sie erhalten eine Benachrichtigung, sobald wir unsere Prüfung abgeschlossen haben. Dies kann bis zu 5 Werktage dauern.</p>
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

      Vielen Dank für Ihren Workshop-Vorschlag bei RevampIT! Wir haben Ihre Einreichung erhalten.

      Workshop-Titel: ${workshopTitle}
      Vorschlags-ID: ${proposalId}

      Unser Team wird Ihren Vorschlag zeitnah prüfen. Der Prüfungsprozess umfasst:
      - Überprüfung der Workshop-Inhalte
      - Bewertung der Zielgruppe und des Formats
      - Abstimmung mit unserem Workshop-Kalender

      Sie erhalten eine Benachrichtigung, sobald wir unsere Prüfung abgeschlossen haben.

      Mit freundlichen Grüssen,
      Das RevampIT Team
    `,
  }),

  adminNewWorkshopProposal: (proposerName: string, proposerEmail: string, workshopTitle: string, adminDashboardUrl: string) => ({
    subject: 'Neuer Workshop-Vorschlag wartet auf Prüfung - RevampIT',
    html: `
      <!DOCTYPE html>
      <html lang="de">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Neuer Workshop-Vorschlag</title>
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
            <h1>Neuer Workshop-Vorschlag</h1>
          </div>
          <div class="content">
            <p>Ein neuer Workshop-Vorschlag wurde eingereicht und wartet auf Ihre Prüfung.</p>
            <p><strong>Eingereicht von:</strong> ${proposerName}</p>
            <p><strong>E-Mail:</strong> ${proposerEmail}</p>
            <p><strong>Workshop-Titel:</strong> ${workshopTitle}</p>
            <p>Bitte prüfen Sie den Vorschlag zeitnah, um eine schnelle Bearbeitung zu gewährleisten.</p>
            <a href="${adminDashboardUrl}" class="button">Vorschlag prüfen</a>
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
      Ein neuer Workshop-Vorschlag wurde eingereicht und wartet auf Ihre Prüfung.

      Eingereicht von: ${proposerName}
      E-Mail: ${proposerEmail}
      Workshop-Titel: ${workshopTitle}

      Bitte prüfen Sie den Vorschlag zeitnah:
      ${adminDashboardUrl}

      Mit freundlichen Grüssen,
      RevampIT System
    `,
  }),

  // Newsletter Templates
  newsletterConfirmation: (confirmUrl: string) => ({
    subject: 'Newsletter-Anmeldung bestätigen - RevampIT',
    html: `
      <!DOCTYPE html>
      <html lang="de">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Newsletter-Anmeldung bestätigen</title>
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
            <h1>Newsletter-Anmeldung bestätigen</h1>
          </div>
          <div class="content">
            <p>Vielen Dank für Ihr Interesse am RevampIT Newsletter!</p>
            <p>Um Ihre Anmeldung abzuschliessen, klicken Sie bitte auf den folgenden Button:</p>
            <a href="${confirmUrl}" class="button">Anmeldung bestätigen</a>
            <p>Was Sie erwartet:</p>
            <ul>
              <li>Neuigkeiten zu nachhaltiger IT und Open Source</li>
              <li>Informationen zu kommenden Workshops und Events</li>
              <li>Tipps zur Verlängerung der Lebensdauer Ihrer Geräte</li>
              <li>Angebote aus unserem Shop</li>
            </ul>
            <p>Falls Sie diese E-Mail nicht angefordert haben, können Sie sie ignorieren.</p>
            <p>Falls der Button nicht funktioniert, kopieren Sie diesen Link in Ihren Browser:</p>
            <p><a href="${confirmUrl}">${confirmUrl}</a></p>
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
      Vielen Dank für Ihr Interesse am RevampIT Newsletter!

      Um Ihre Anmeldung abzuschliessen, öffnen Sie bitte folgenden Link:
      ${confirmUrl}

      Was Sie erwartet:
      - Neuigkeiten zu nachhaltiger IT und Open Source
      - Informationen zu kommenden Workshops und Events
      - Tipps zur Verlängerung der Lebensdauer Ihrer Geräte
      - Angebote aus unserem Shop

      Falls Sie diese E-Mail nicht angefordert haben, können Sie sie ignorieren.

      Mit freundlichen Grüssen,
      Das RevampIT Team
    `,
  }),

  // Blog Submission Templates
  blogSubmissionReceived: (name: string, articleTitle: string, submissionId: string) => ({
    subject: 'Blog-Beitrag eingereicht - RevampIT',
    html: `
      <!DOCTYPE html>
      <html lang="de">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Blog-Beitrag eingereicht</title>
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
            <h1>Blog-Beitrag eingereicht</h1>
          </div>
          <div class="content">
            <h2>Hallo ${name},</h2>
            <p>Vielen Dank für Ihren Blog-Beitrag bei RevampIT! Wir haben Ihre Einreichung erhalten.</p>
            <p><strong>Titel:</strong> ${articleTitle}</p>
            <p><strong>Einreichungs-ID:</strong> ${submissionId}</p>
            <p>Unser Redaktionsteam wird Ihren Beitrag prüfen. Der Prozess umfasst:</p>
            <ul>
              <li>Inhaltliche Überprüfung</li>
              <li>Redaktionelle Bearbeitung falls erforderlich</li>
              <li>Einplanung in unseren Veröffentlichungskalender</li>
            </ul>
            <p>Sie erhalten eine Benachrichtigung über den Status Ihrer Einreichung. Die Prüfung kann bis zu 7 Werktage dauern.</p>
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

      Vielen Dank für Ihren Blog-Beitrag bei RevampIT! Wir haben Ihre Einreichung erhalten.

      Titel: ${articleTitle}
      Einreichungs-ID: ${submissionId}

      Unser Redaktionsteam wird Ihren Beitrag prüfen. Der Prozess umfasst:
      - Inhaltliche Überprüfung
      - Redaktionelle Bearbeitung falls erforderlich
      - Einplanung in unseren Veröffentlichungskalender

      Sie erhalten eine Benachrichtigung über den Status Ihrer Einreichung.

      Mit freundlichen Grüssen,
      Das RevampIT Team
    `,
  }),

  adminNewBlogSubmission: (submitterName: string, submitterEmail: string, articleTitle: string, adminDashboardUrl: string) => ({
    subject: 'Neuer Blog-Beitrag wartet auf Prüfung - RevampIT',
    html: `
      <!DOCTYPE html>
      <html lang="de">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Neuer Blog-Beitrag</title>
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
            <h1>Neuer Blog-Beitrag</h1>
          </div>
          <div class="content">
            <p>Ein neuer Blog-Beitrag wurde eingereicht und wartet auf Ihre Prüfung.</p>
            <p><strong>Eingereicht von:</strong> ${submitterName}</p>
            <p><strong>E-Mail:</strong> ${submitterEmail}</p>
            <p><strong>Titel:</strong> ${articleTitle}</p>
            <p>Bitte prüfen Sie den Beitrag und entscheiden Sie über die Veröffentlichung.</p>
            <a href="${adminDashboardUrl}" class="button">Beitrag prüfen</a>
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
      Ein neuer Blog-Beitrag wurde eingereicht und wartet auf Ihre Prüfung.

      Eingereicht von: ${submitterName}
      E-Mail: ${submitterEmail}
      Titel: ${articleTitle}

      Bitte prüfen Sie den Beitrag:
      ${adminDashboardUrl}

      Mit freundlichen Grüssen,
      RevampIT System
    `,
  }),

  // Seller Application Templates
  sellerApplicationSubmitted: (name: string, applicationId: string) => ({
    subject: 'Verkäufer-Bewerbung eingereicht - RevampIT',
    html: `
      <!DOCTYPE html>
      <html lang="de">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Verkäufer-Bewerbung eingereicht</title>
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
            <h1>Verkäufer-Bewerbung eingereicht</h1>
          </div>
          <div class="content">
            <h2>Hallo ${name},</h2>
            <p>Vielen Dank für Ihre Bewerbung als Verkäufer auf dem RevampIT Marktplatz! Wir haben Ihre Unterlagen erhalten.</p>
            <p><strong>Bewerbungs-ID:</strong> ${applicationId}</p>
            <p>Der Prüfungsprozess umfasst:</p>
            <ul>
              <li>Verifizierung Ihrer Angaben</li>
              <li>Prüfung der Produktkategorien</li>
              <li>Qualitätssicherung</li>
            </ul>
            <p>Sie erhalten eine Benachrichtigung, sobald wir unsere Prüfung abgeschlossen haben. Dies kann bis zu 5 Werktage dauern.</p>
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

      Vielen Dank für Ihre Bewerbung als Verkäufer auf dem RevampIT Marktplatz! Wir haben Ihre Unterlagen erhalten.

      Bewerbungs-ID: ${applicationId}

      Der Prüfungsprozess umfasst:
      - Verifizierung Ihrer Angaben
      - Prüfung der Produktkategorien
      - Qualitätssicherung

      Sie erhalten eine Benachrichtigung, sobald wir unsere Prüfung abgeschlossen haben.

      Mit freundlichen Grüssen,
      Das RevampIT Team
    `,
  }),

  adminNewSellerApplication: (applicantName: string, applicantEmail: string, adminDashboardUrl: string) => ({
    subject: 'Neue Verkäufer-Bewerbung wartet auf Prüfung - RevampIT',
    html: `
      <!DOCTYPE html>
      <html lang="de">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Neue Verkäufer-Bewerbung</title>
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
            <h1>Neue Verkäufer-Bewerbung</h1>
          </div>
          <div class="content">
            <p>Eine neue Verkäufer-Bewerbung wurde eingereicht und wartet auf Ihre Prüfung.</p>
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
      Eine neue Verkäufer-Bewerbung wurde eingereicht und wartet auf Ihre Prüfung.

      Bewerber: ${applicantName}
      E-Mail: ${applicantEmail}

      Bitte prüfen Sie die Bewerbung zeitnah:
      ${adminDashboardUrl}

      Mit freundlichen Grüssen,
      RevampIT System
    `,
  }),

  // Workshop Registration Templates
  workshopRegistrationConfirmation: (
    name: string,
    workshopTitle: string,
    workshopDate: string,
    workshopLocation: string,
    priceCents: number,
    workshopUrl: string
  ) => ({
    subject: 'Workshop-Anmeldung bestätigt - RevampIT',
    html: `
      <!DOCTYPE html>
      <html lang="de">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Workshop-Anmeldung bestätigt</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #22c55e; color: white; padding: 20px; text-align: center; }
          .content { padding: 30px 20px; background-color: #f9f9f9; }
          .details { background-color: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
          .button { display: inline-block; padding: 12px 24px; background-color: #22c55e; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { padding: 20px; text-align: center; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎓 Workshop-Anmeldung bestätigt</h1>
          </div>
          <div class="content">
            <h2>Hallo ${name},</h2>
            <p>Vielen Dank für Ihre Anmeldung! Sie sind nun für den folgenden Workshop angemeldet:</p>
            <div class="details">
              <p><strong>Workshop:</strong> ${workshopTitle}</p>
              <p><strong>Datum:</strong> ${workshopDate}</p>
              <p><strong>Ort:</strong> ${workshopLocation}</p>
              ${priceCents > 0 ? `<p><strong>Preis:</strong> CHF ${(priceCents / 100).toFixed(2)}</p>` : '<p><strong>Preis:</strong> Kostenlos</p>'}
            </div>
            <p>Bitte merken Sie sich den Termin vor. Sie erhalten rechtzeitig vor dem Workshop eine Erinnerung mit weiteren Details.</p>
            <a href="${workshopUrl}" class="button">Workshop-Details anzeigen</a>
            <p><strong>Wichtig:</strong> Falls Sie nicht teilnehmen können, bitten wir Sie, sich rechtzeitig abzumelden, damit andere Interessierte Ihren Platz einnehmen können.</p>
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

      Vielen Dank für Ihre Anmeldung! Sie sind nun für den folgenden Workshop angemeldet:

      Workshop: ${workshopTitle}
      Datum: ${workshopDate}
      Ort: ${workshopLocation}
      ${priceCents > 0 ? `Preis: CHF ${(priceCents / 100).toFixed(2)}` : 'Preis: Kostenlos'}

      Bitte merken Sie sich den Termin vor. Sie erhalten rechtzeitig vor dem Workshop eine Erinnerung mit weiteren Details.

      Workshop-Details: ${workshopUrl}

      Wichtig: Falls Sie nicht teilnehmen können, bitten wir Sie, sich rechtzeitig abzumelden.

      Mit freundlichen Grüssen,
      Das RevampIT Team
    `,
  }),

  workshopRegistrationStatusUpdate: (
    name: string,
    workshopTitle: string,
    workshopDate: string,
    newStatus: 'confirmed' | 'cancelled' | 'waitlist',
    reason?: string
  ) => ({
    subject: `Workshop-Anmeldung ${newStatus === 'confirmed' ? 'bestätigt' : newStatus === 'cancelled' ? 'storniert' : 'Warteliste'} - RevampIT`,
    html: `
      <!DOCTYPE html>
      <html lang="de">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Workshop-Anmeldung Status</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: ${newStatus === 'confirmed' ? '#22c55e' : newStatus === 'cancelled' ? '#dc2626' : '#f59e0b'}; color: white; padding: 20px; text-align: center; }
          .content { padding: 30px 20px; background-color: #f9f9f9; }
          .footer { padding: 20px; text-align: center; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>${newStatus === 'confirmed' ? '✅ Anmeldung bestätigt' : newStatus === 'cancelled' ? '❌ Anmeldung storniert' : '⏳ Warteliste'}</h1>
          </div>
          <div class="content">
            <h2>Hallo ${name},</h2>
            <p>Der Status Ihrer Workshop-Anmeldung wurde aktualisiert.</p>
            <p><strong>Workshop:</strong> ${workshopTitle}</p>
            <p><strong>Datum:</strong> ${workshopDate}</p>
            <p><strong>Status:</strong> ${newStatus === 'confirmed' ? 'Bestätigt' : newStatus === 'cancelled' ? 'Storniert' : 'Auf der Warteliste'}</p>
            ${reason ? `<p><strong>Hinweis:</strong> ${reason}</p>` : ''}
            ${newStatus === 'confirmed' ? '<p>Wir freuen uns auf Ihre Teilnahme! Sie erhalten rechtzeitig vor dem Workshop eine Erinnerung.</p>' : ''}
            ${newStatus === 'waitlist' ? '<p>Sie werden automatisch benachrichtigt, sobald ein Platz frei wird.</p>' : ''}
            ${newStatus === 'cancelled' ? '<p>Falls Sie Fragen haben, können Sie uns jederzeit kontaktieren.</p>' : ''}
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

      Der Status Ihrer Workshop-Anmeldung wurde aktualisiert.

      Workshop: ${workshopTitle}
      Datum: ${workshopDate}
      Status: ${newStatus === 'confirmed' ? 'Bestätigt' : newStatus === 'cancelled' ? 'Storniert' : 'Auf der Warteliste'}
      ${reason ? `Hinweis: ${reason}` : ''}

      ${newStatus === 'confirmed' ? 'Wir freuen uns auf Ihre Teilnahme!' : ''}
      ${newStatus === 'waitlist' ? 'Sie werden automatisch benachrichtigt, sobald ein Platz frei wird.' : ''}
      ${newStatus === 'cancelled' ? 'Falls Sie Fragen haben, können Sie uns jederzeit kontaktieren.' : ''}

      Mit freundlichen Grüssen,
      Das RevampIT Team
    `,
  }),

  workshopReminder: (
    name: string,
    workshopTitle: string,
    workshopDate: string,
    workshopTime: string,
    workshopLocation: string,
    instructor: string | null,
    workshopUrl: string
  ) => ({
    subject: `Erinnerung: Workshop morgen - ${workshopTitle} - RevampIT`,
    html: `
      <!DOCTYPE html>
      <html lang="de">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Workshop-Erinnerung</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #3b82f6; color: white; padding: 20px; text-align: center; }
          .content { padding: 30px 20px; background-color: #f9f9f9; }
          .details { background-color: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #3b82f6; }
          .button { display: inline-block; padding: 12px 24px; background-color: #3b82f6; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { padding: 20px; text-align: center; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>📅 Workshop-Erinnerung</h1>
          </div>
          <div class="content">
            <h2>Hallo ${name},</h2>
            <p>Wir möchten Sie an Ihren bevorstehenden Workshop erinnern:</p>
            <div class="details">
              <p><strong>📚 Workshop:</strong> ${workshopTitle}</p>
              <p><strong>📅 Datum:</strong> ${workshopDate}</p>
              <p><strong>🕐 Uhrzeit:</strong> ${workshopTime}</p>
              <p><strong>📍 Ort:</strong> ${workshopLocation}</p>
              ${instructor ? `<p><strong>👨‍🏫 Instruktor:</strong> ${instructor}</p>` : ''}
            </div>
            <p><strong>Tipps für Ihre Vorbereitung:</strong></p>
            <ul>
              <li>Bringen Sie Ihren eigenen Laptop mit (falls zutreffend)</li>
              <li>Erscheinen Sie bitte 10 Minuten vor Beginn</li>
              <li>Notieren Sie eventuelle Fragen, die Sie stellen möchten</li>
            </ul>
            <a href="${workshopUrl}" class="button">Workshop-Details</a>
            <p>Falls Sie nicht teilnehmen können, bitten wir Sie, sich rechtzeitig abzumelden, damit andere Interessierte Ihren Platz einnehmen können.</p>
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

      Wir möchten Sie an Ihren bevorstehenden Workshop erinnern:

      Workshop: ${workshopTitle}
      Datum: ${workshopDate}
      Uhrzeit: ${workshopTime}
      Ort: ${workshopLocation}
      ${instructor ? `Instruktor: ${instructor}` : ''}

      Tipps für Ihre Vorbereitung:
      - Bringen Sie Ihren eigenen Laptop mit (falls zutreffend)
      - Erscheinen Sie bitte 10 Minuten vor Beginn
      - Notieren Sie eventuelle Fragen, die Sie stellen möchten

      Workshop-Details: ${workshopUrl}

      Falls Sie nicht teilnehmen können, bitten wir Sie, sich rechtzeitig abzumelden.

      Mit freundlichen Grüssen,
      Das RevampIT Team
    `,
  }),

  workshopCancellation: (
    name: string,
    workshopTitle: string,
    workshopDate: string,
    reason: string | null,
    refundInfo: string | null
  ) => ({
    subject: `Workshop abgesagt: ${workshopTitle} - RevampIT`,
    html: `
      <!DOCTYPE html>
      <html lang="de">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Workshop abgesagt</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #dc2626; color: white; padding: 20px; text-align: center; }
          .content { padding: 30px 20px; background-color: #f9f9f9; }
          .notice { background-color: #fef2f2; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #dc2626; }
          .footer { padding: 20px; text-align: center; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Workshop abgesagt</h1>
          </div>
          <div class="content">
            <h2>Hallo ${name},</h2>
            <p>Leider müssen wir Ihnen mitteilen, dass der folgende Workshop abgesagt wurde:</p>
            <div class="notice">
              <p><strong>Workshop:</strong> ${workshopTitle}</p>
              <p><strong>Geplantes Datum:</strong> ${workshopDate}</p>
              ${reason ? `<p><strong>Grund:</strong> ${reason}</p>` : ''}
            </div>
            <p>Wir bedauern die Unannehmlichkeiten und hoffen, Sie bei einem zukünftigen Workshop begrüssen zu dürfen.</p>
            ${refundInfo ? `
              <p><strong>Rückerstattung:</strong></p>
              <p>${refundInfo}</p>
            ` : ''}
            <p>Bei Fragen stehen wir Ihnen gerne zur Verfügung.</p>
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

      Leider müssen wir Ihnen mitteilen, dass der folgende Workshop abgesagt wurde:

      Workshop: ${workshopTitle}
      Geplantes Datum: ${workshopDate}
      ${reason ? `Grund: ${reason}` : ''}

      Wir bedauern die Unannehmlichkeiten und hoffen, Sie bei einem zukünftigen Workshop begrüssen zu dürfen.

      ${refundInfo ? `Rückerstattung: ${refundInfo}` : ''}

      Bei Fragen stehen wir Ihnen gerne zur Verfügung.

      Mit freundlichen Grüssen,
      Das RevampIT Team
    `,
  }),

  workshopFeedbackRequest: (
    name: string,
    workshopTitle: string,
    workshopDate: string,
    feedbackUrl: string
  ) => ({
    subject: `Wie war der Workshop? Ihr Feedback zählt! - RevampIT`,
    html: `
      <!DOCTYPE html>
      <html lang="de">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Workshop-Feedback</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #8b5cf6; color: white; padding: 20px; text-align: center; }
          .content { padding: 30px 20px; background-color: #f9f9f9; }
          .button { display: inline-block; padding: 12px 24px; background-color: #8b5cf6; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { padding: 20px; text-align: center; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>⭐ Ihr Feedback ist gefragt!</h1>
          </div>
          <div class="content">
            <h2>Hallo ${name},</h2>
            <p>Wir hoffen, Sie hatten eine gute Erfahrung beim Workshop:</p>
            <p><strong>${workshopTitle}</strong> am ${workshopDate}</p>
            <p>Ihre Meinung ist uns wichtig! Mit Ihrem Feedback helfen Sie uns, unsere Workshops kontinuierlich zu verbessern und anderen Teilnehmern bei ihrer Entscheidung.</p>
            <p>Es dauert nur 2 Minuten:</p>
            <a href="${feedbackUrl}" class="button">Jetzt Feedback geben</a>
            <p>Vielen Dank für Ihre Unterstützung!</p>
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

      Wir hoffen, Sie hatten eine gute Erfahrung beim Workshop:
      ${workshopTitle} am ${workshopDate}

      Ihre Meinung ist uns wichtig! Mit Ihrem Feedback helfen Sie uns, unsere Workshops kontinuierlich zu verbessern.

      Feedback geben: ${feedbackUrl}

      Vielen Dank für Ihre Unterstützung!

      Mit freundlichen Grüssen,
      Das RevampIT Team
    `,
  }),

  // Location Approval Notification
  locationApprovalNotification: (name: string, locationName: string, action: string, reviewNotes: string | null) => ({
    subject: `Ort ${action === 'approve' ? 'genehmigt' : action === 'reject' ? 'abgelehnt' : action === 'suspend' ? 'suspendiert' : 'wiederhergestellt'} - RevampIT`,
    html: `
      <!DOCTYPE html>
      <html lang="de">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Ort-Status aktualisiert</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: ${action === 'approve' || action === 'reinstate' ? '#22c55e' : action === 'reject' ? '#dc2626' : '#f59e0b'}; color: white; padding: 20px; text-align: center; }
          .content { padding: 30px 20px; background-color: #f9f9f9; }
          .footer { padding: 20px; text-align: center; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Ort-Status aktualisiert</h1>
          </div>
          <div class="content">
            <h2>Hallo ${name},</h2>
            <p>Der Status Ihres eingereichten Ortes wurde aktualisiert.</p>
            <p><strong>Ort:</strong> ${locationName}</p>
            <p><strong>Status:</strong> ${action === 'approve' ? 'Genehmigt' : action === 'reject' ? 'Abgelehnt' : action === 'suspend' ? 'Suspendiert' : 'Wiederhergestellt'}</p>
            ${reviewNotes ? `<p><strong>Anmerkungen:</strong> ${reviewNotes}</p>` : ''}
            ${action === 'approve' || action === 'reinstate' ? '<p>Ihr Ort ist nun für andere Benutzer sichtbar und kann für Workshops und Veranstaltungen gebucht werden.</p>' : ''}
            ${action === 'reject' ? '<p>Bei Fragen zur Ablehnung können Sie uns gerne kontaktieren.</p>' : ''}
            ${action === 'suspend' ? '<p>Der Ort ist vorübergehend nicht verfügbar. Bitte kontaktieren Sie uns für weitere Informationen.</p>' : ''}
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

      Der Status Ihres eingereichten Ortes wurde aktualisiert.

      Ort: ${locationName}
      Status: ${action === 'approve' ? 'Genehmigt' : action === 'reject' ? 'Abgelehnt' : action === 'suspend' ? 'Suspendiert' : 'Wiederhergestellt'}
      ${reviewNotes ? `Anmerkungen: ${reviewNotes}` : ''}

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
