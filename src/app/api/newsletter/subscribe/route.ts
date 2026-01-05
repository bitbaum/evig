import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'
import { randomBytes } from 'crypto'
import { requireAdminAuth } from '@/lib/admin-auth'
import { apiError, apiSuccess, apiBadRequest } from '@/lib/api/helpers'
import { logger } from '@/lib/logger'

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

// RFC 5322 compliant email validation
function isValidEmail(email: string): boolean {
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/
  return emailRegex.test(email)
}

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()

    // Validate email
    if (!email || typeof email !== 'string' || !isValidEmail(email)) {
      return apiBadRequest('Bitte geben Sie eine gültige E-Mail-Adresse ein')
    }

    // Check if already subscribed
    const normalizedEmail = email.toLowerCase().trim()
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

    // TODO: Send confirmation email
    // For now, we'll just return success
    // In production, you'd send an email with confirmToken

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
