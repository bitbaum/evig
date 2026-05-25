import { NextRequest, NextResponse } from 'next/server'
import { logger } from '@/lib/logger'
import { db } from '@/db'
import { newsletterSubscriptions } from '@/db/schema'
import { eq, and, sql } from 'drizzle-orm'
import { ORG } from '@/config/org'
import { APP_URL } from '@/config/urls'

type Outcome = 'missing' | 'invalid' | 'success' | 'error'

function htmlResponse(outcome: Outcome): NextResponse {
  const isSuccess = outcome === 'success'
  const status = outcome === 'success' ? 200 : outcome === 'error' ? 500 : 400

  const title = isSuccess
    ? 'Anmeldung bestätigt'
    : 'Bestätigung fehlgeschlagen'

  const heading = isSuccess
    ? 'Newsletter-Anmeldung bestätigt!'
    : 'Bestätigung fehlgeschlagen'

  const body = outcome === 'success'
    ? 'Du erhältst ab sofort unsere Neuigkeiten zu nachhaltiger IT, Workshops und Events.'
    : outcome === 'missing'
    ? 'Der Bestätigungstoken fehlt in der URL. Bitte verwende den vollständigen Link aus deiner E-Mail.'
    : outcome === 'invalid'
    ? 'Dieser Bestätigungslink ist ungültig oder wurde bereits verwendet. Falls du dich neu anmelden möchtest, registriere dich bitte erneut.'
    : 'Bei der Bestätigung ist ein Fehler aufgetreten. Bitte versuche es später erneut.'

  const headerClass = isSuccess ? '#22c55e' : '#dc2626'

  const html = `<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title} - ${ORG.name}</title>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; background-color: #fafafa; margin: 0; padding: 40px 20px; }
    .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 1px 4px rgba(0,0,0,0.08); }
    .header { padding: 24px 20px; text-align: center; color: white; background-color: ${headerClass}; }
    .header h1 { margin: 0; font-size: 24px; }
    .content { padding: 32px 24px; }
    .content p { margin: 0 0 16px; font-size: 16px; }
    .button { display: inline-block; padding: 12px 24px; color: white; text-decoration: none; border-radius: 6px; background-color: #22c55e; margin-top: 16px; }
    .footer { padding: 20px; text-align: center; color: #666; font-size: 12px; border-top: 1px solid #e5e5e5; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>${heading}</h1>
    </div>
    <div class="content">
      <p>${body}</p>
      <p><a href="${APP_URL}" class="button">Zurück zur Startseite</a></p>
    </div>
    <div class="footer">
      <p>© ${new Date().getFullYear()} ${ORG.name}</p>
    </div>
  </div>
</body>
</html>`

  return new NextResponse(html, {
    status,
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  })
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const token = searchParams.get('token')

    if (!token) {
      return htmlResponse('missing')
    }

    const [confirmed] = await db
      .update(newsletterSubscriptions)
      .set({
        isActive: true,
        confirmedAt: sql`NOW()`,
        confirmToken: null,
      })
      .where(and(
        eq(newsletterSubscriptions.confirmToken, token),
        eq(newsletterSubscriptions.isActive, false),
      ))
      .returning({ email: newsletterSubscriptions.email })

    if (!confirmed) {
      return htmlResponse('invalid')
    }

    logger.info('Newsletter subscription confirmed', { email: confirmed.email })
    return htmlResponse('success')
  } catch (error) {
    logger.error('Newsletter confirmation error', { error })
    return htmlResponse('error')
  }
}
