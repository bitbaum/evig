import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'
import { randomBytes } from 'crypto'
import { requireAdminAuth } from '@/lib/admin-auth'
import { apiError, apiSuccess, apiBadRequest } from '@/lib/api/helpers'
import { logger } from '@/lib/logger'
import { checkRateLimit, getClientIp } from '@/lib/auth/rate-limiter'
import { sendEmail } from '@/lib/email'
import { APP_URL } from '@/config/urls'
import { NewsletterSubscribeSchema, formatZodErrors } from '@/lib/schemas'

const subscribersDir = path.join(process.cwd(), 'content/newsletter')

// Ensure directory exists
if (!fs.existsSync(subscribersDir)) {
  fs.mkdirSync(subscribersDir, { recursive: true })
}

// Type definitions
interface Subscriber {
  email: string
  subscribedAt: string
  status: 'active' | 'pending'
  confirmToken?: string
}

export async function POST(request: NextRequest) {
  try {
    // Rate limiting - prevent subscription abuse
    const clientIp = getClientIp(request.headers)
    const rateLimitResult = checkRateLimit(clientIp, 'newsletter')

    if (!rateLimitResult.allowed) {
      logger.warn('Newsletter subscription rate limit exceeded', { ip: clientIp })
      return NextResponse.json(
        {
          success: false,
          error: 'Zu viele Anfragen. Bitte versuchen Sie es später erneut.',
          retryAfter: rateLimitResult.retryAfter,
        },
        {
          status: 429,
          headers: {
            'Retry-After': String(rateLimitResult.retryAfter || 60),
            'X-RateLimit-Remaining': String(rateLimitResult.remaining),
            'X-RateLimit-Reset': String(rateLimitResult.resetAt),
          },
        }
      )
    }

    const body = await request.json()

    // Validate input with Zod schema
    const validationResult = NewsletterSubscribeSchema.safeParse(body)
    if (!validationResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Validierung fehlgeschlagen',
          errors: formatZodErrors(validationResult.error),
        },
        { status: 400 }
      )
    }

    // Email is already normalized by the schema
    const normalizedEmail = validationResult.data.email
    const subscribersFile = path.join(subscribersDir, 'subscribers.json')

    let subscribers: Subscriber[] = []

    if (fs.existsSync(subscribersFile)) {
      try {
        const content = fs.readFileSync(subscribersFile, 'utf-8')
        subscribers = JSON.parse(content)

        // Validate parsed data
        if (!Array.isArray(subscribers)) {
          throw new Error('Invalid subscribers data format')
        }
      } catch (parseError) {
        logger.error('Error parsing subscribers file', { error: parseError })
        // Start fresh if file is corrupted
        subscribers = []
      }
    }

    // Check for duplicate
    const existing = subscribers.find(
      (sub) => sub.email.toLowerCase() === normalizedEmail
    )

    if (existing && existing.status === 'active') {
      return apiBadRequest('Diese E-Mail-Adresse ist bereits registriert')
    }

    // Add new subscriber
    const newSubscriber: Subscriber = {
      email: normalizedEmail,
      subscribedAt: new Date().toISOString(),
      status: 'pending' as const, // Will be 'active' after email confirmation
      confirmToken: generateToken(),
    }

    subscribers.push(newSubscriber)

    // Save to file
    fs.writeFileSync(
      subscribersFile,
      JSON.stringify(subscribers, null, 2),
      'utf-8'
    )

    // Send confirmation email
    try {
      const confirmUrl = `${APP_URL}/api/newsletter/confirm?token=${newSubscriber.confirmToken}`
      await sendEmail(
        normalizedEmail,
        'newsletterConfirmation',
        confirmUrl
      )
      logger.info('Newsletter confirmation email sent', { email: normalizedEmail })
    } catch (emailError) {
      logger.warn('Failed to send newsletter confirmation email', {
        email: normalizedEmail,
        error: emailError
      })
    }

    // Sync to Listmonk if enabled
    if (process.env.LISTMONK_ENABLED === 'true') {
      const listmonkUrl = process.env.LISTMONK_URL || 'http://localhost:9090'
      const listmonkUser = process.env.LISTMONK_USERNAME || 'admin'
      const listmonkPassword = process.env.LISTMONK_PASSWORD || ''
      const credentials = Buffer.from(`${listmonkUser}:${listmonkPassword}`).toString('base64')

      try {
        const lmResponse = await fetch(`${listmonkUrl}/api/subscribers`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Basic ${credentials}`,
          },
          body: JSON.stringify({
            email: normalizedEmail,
            name: normalizedEmail.split('@')[0],
            lists: [1],
            status: 'enabled',
            preconfirm_subscriptions: false,
            attribs: { source: body.source || 'website' },
          }),
        })

        if (!lmResponse.ok && lmResponse.status !== 409) {
          logger.warn('Listmonk sync failed', { status: lmResponse.status, email: normalizedEmail })
        } else {
          logger.info('Listmonk subscriber synced', { email: normalizedEmail })
        }
      } catch (lmError) {
        logger.warn('Listmonk sync error', { error: lmError, email: normalizedEmail })
      }
    }

    return apiSuccess({
      message: 'Bestätigungs-E-Mail gesendet',
    })
  } catch (error) {
    return apiError(error, 'Serverfehler. Bitte versuchen Sie es später erneut.')
  }
}

// Protected admin endpoint to view subscribers
export const GET = requireAdminAuth(async (request: NextRequest) => {
  try {
    const subscribersFile = path.join(subscribersDir, 'subscribers.json')

    if (!fs.existsSync(subscribersFile)) {
      return apiSuccess({
        total: 0,
        active: 0,
        pending: 0,
        subscribers: []
      })
    }

    try {
      const content = fs.readFileSync(subscribersFile, 'utf-8')
      const subscribers: Subscriber[] = JSON.parse(content)

      // Validate parsed data
      if (!Array.isArray(subscribers)) {
        throw new Error('Invalid subscribers data format')
      }

      return apiSuccess({
        total: subscribers.length,
        active: subscribers.filter((s) => s.status === 'active').length,
        pending: subscribers.filter((s) => s.status === 'pending').length,
        subscribers: subscribers,
      })
    } catch (parseError) {
      logger.error('Error parsing subscribers file', { error: parseError })
      return apiError(
        parseError instanceof Error ? parseError : new Error('Parse error'),
        'Invalid subscribers data format'
      )
    }
  } catch (error) {
    return apiError(error, 'Failed to fetch subscribers')
  }
})

// Generate cryptographically secure token
function generateToken(): string {
  return randomBytes(32).toString('hex')
}
