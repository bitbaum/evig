import { NextRequest } from 'next/server'
import fs from 'fs'
import path from 'path'
import { apiError, apiSuccess, apiBadRequest } from '@/lib/api/helpers'
import { logger } from '@/lib/logger'

const subscribersDir = path.join(process.cwd(), 'content/newsletter')

interface Subscriber {
  email: string
  subscribedAt: string
  status: 'active' | 'pending'
  confirmToken?: string
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const token = searchParams.get('token')

    if (!token) {
      return apiBadRequest('Bestätigungstoken fehlt')
    }

    const subscribersFile = path.join(subscribersDir, 'subscribers.json')

    if (!fs.existsSync(subscribersFile)) {
      return apiBadRequest('Ungültiger Bestätigungslink')
    }

    let subscribers: Subscriber[] = []

    try {
      const content = fs.readFileSync(subscribersFile, 'utf-8')
      subscribers = JSON.parse(content)

      if (!Array.isArray(subscribers)) {
        throw new Error('Invalid subscribers data format')
      }
    } catch (parseError) {
      logger.error('Error parsing subscribers file', { error: parseError })
      return apiError(parseError, 'Fehler beim Verarbeiten der Anfrage')
    }

    // Find subscriber with matching token
    const subscriberIndex = subscribers.findIndex(
      (sub) => sub.confirmToken === token && sub.status === 'pending'
    )

    if (subscriberIndex === -1) {
      return apiBadRequest('Ungültiger oder bereits verwendeter Bestätigungslink')
    }

    // Update subscriber status to active
    subscribers[subscriberIndex].status = 'active'
    delete subscribers[subscriberIndex].confirmToken

    // Save updated subscribers
    fs.writeFileSync(
      subscribersFile,
      JSON.stringify(subscribers, null, 2),
      'utf-8'
    )

    logger.info('Newsletter subscription confirmed', {
      email: subscribers[subscriberIndex].email
    })

    return apiSuccess({
      message: 'Newsletter-Anmeldung erfolgreich bestätigt! Sie erhalten ab sofort unsere Neuigkeiten.',
    })
  } catch (error) {
    return apiError(error, 'Fehler bei der Bestätigung')
  }
}
