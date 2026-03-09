import { query } from '@/lib/auth/db'
import { getAuthSecret } from '@/lib/auth/config'
import { apiSuccess } from '@/lib/api/helpers'

type AuthHealth = {
  status: 'healthy' | 'unhealthy'
  checks: {
    authSecret: 'ok' | 'missing'
    database: 'ok' | 'failed'
  }
  timestamp: string
}

export async function GET() {
  const response: AuthHealth = {
    status: 'healthy',
    checks: {
      authSecret: 'ok',
      database: 'ok',
    },
    timestamp: new Date().toISOString(),
  }

  try {
    const secret = getAuthSecret()
    if (!secret || secret.length < 16) {
      response.status = 'unhealthy'
      response.checks.authSecret = 'missing'
    }
  } catch {
    response.status = 'unhealthy'
    response.checks.authSecret = 'missing'
  }

  try {
    await query('SELECT 1')
  } catch {
    response.status = 'unhealthy'
    response.checks.database = 'failed'
  }

  return apiSuccess(response, response.status === 'healthy' ? 200 : 503)
}
