import { NextRequest } from 'next/server'
import { z } from 'zod'
import { withAdmin, type ValidSession } from '@/lib/api/middleware'
import { apiBadRequest, apiError, apiSuccess } from '@/lib/api/helpers'
import { logger } from '@/lib/logger'
import { getEmailProvider, EMAIL_CONFIG, LISTMONK_CONFIG } from '@/config/email'
import {
  testEmailConfig,
  testListmonkConnection,
  sendCustomEmail,
} from '@/lib/email'
import { ORG } from '@/config/org'

/**
 * Admin email diagnostics — determine WHY mail may not be arriving without
 * exposing secrets. Reports the active provider, which config is present
 * (booleans, never the passwords), and a live connection test. POST sends a
 * real test email so an admin can confirm end-to-end delivery.
 * Super-admin gated via withAdmin('settings').
 */
export const GET = withAdmin('settings', async () => {
  try {
    const provider = getEmailProvider()
    const connectionTest =
      provider === 'listmonk' ? await testListmonkConnection() : await testEmailConfig()

    return apiSuccess({
      provider,
      connectionTest,
      smtp: {
        host: EMAIL_CONFIG.HOST,
        port: EMAIL_CONFIG.PORT,
        secure: EMAIL_CONFIG.SECURE,
        from: EMAIL_CONFIG.FROM,
        userSet: Boolean(EMAIL_CONFIG.USER),
        passSet: Boolean(EMAIL_CONFIG.PASS),
      },
      listmonk: {
        enabled: LISTMONK_CONFIG.ENABLED,
        url: LISTMONK_CONFIG.URL,
        fromEmail: LISTMONK_CONFIG.FROM_EMAIL,
        userSet: Boolean(LISTMONK_CONFIG.USERNAME),
        passSet: Boolean(LISTMONK_CONFIG.PASSWORD),
      },
    })
  } catch (error) {
    logger.error('Email diagnostics failed', { error })
    return apiError(error, 'Diagnose fehlgeschlagen')
  }
})

const TestSchema = z.object({ to: z.string().email('Ungültige E-Mail-Adresse') })

export const POST = withAdmin('settings', async (request: NextRequest, session: ValidSession) => {
  try {
    const parsed = TestSchema.safeParse(await request.json())
    if (!parsed.success) {
      return apiBadRequest('Ungültige Eingabe', parsed.error.flatten().fieldErrors)
    }
    const { to } = parsed.data
    const result = await sendCustomEmail(to, {
      subject: `${ORG.name} — E-Mail-Test`,
      html: `<p>Dies ist eine Test-E-Mail von ${ORG.name}. Wenn du sie erhältst, funktioniert der E-Mail-Versand.</p>`,
      text: `Dies ist eine Test-E-Mail von ${ORG.name}. Wenn du sie erhältst, funktioniert der E-Mail-Versand.`,
    })
    logger.info('Email test send', { to, by: session.user.id, success: result.success })
    // result.success === true means the provider ACCEPTED the message — it does
    // not guarantee inbox delivery (SPF/DKIM/reputation can still drop it).
    return apiSuccess({ accepted: result.success, error: result.error ?? null, provider: getEmailProvider() })
  } catch (error) {
    logger.error('Email test send failed', { error })
    return apiError(error, 'Test-E-Mail fehlgeschlagen')
  }
})
