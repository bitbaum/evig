/**
 * Email utilities for RevampIT
 * Handles sending emails using nodemailer
 */

// Email configuration
const emailConfig = {
  host: process.env.EMAIL_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.EMAIL_PORT || '587'),
  secure: process.env.EMAIL_SECURE === 'true',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
}

// Create transporter
let transporter: any = null

export async function getTransporter(): Promise<any> {
  if (!transporter) {
    const nodemailer = await import('nodemailer')
    transporter = nodemailer.createTransport(emailConfig)
  }
  return transporter
}

// Email templates
export const emailTemplates = {
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
}

// Send email function
export async function sendEmail(to: string, template: keyof typeof emailTemplates, ...args: any[]) {
  try {
    const transporter = await getTransporter()
    const emailTemplate = emailTemplates[template](...args)

    const mailOptions = {
      from: process.env.EMAIL_FROM || emailConfig.auth.user,
      to,
      subject: emailTemplate.subject,
      html: emailTemplate.html,
      text: emailTemplate.text,
    }

    const info = await transporter.sendMail(mailOptions)
    console.log('Email sent:', info.messageId)
    return { success: true, messageId: info.messageId }
  } catch (error) {
    console.error('Email send error:', error)
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
