import { NextResponse } from 'next/server'
import { query } from '@/lib/auth/db'
import { getAuthSecret } from '@/lib/auth/config'

type AuthHealth = {
  status: 'healthy' | 'unhealthy'
  checks: {
    authSecret: 'ok' | 'missing'
    database: 'ok' | 'failed'
  }
  message?: string
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
      response.message = 'AUTH_SECRET is missing or too short'
    }
  } catch {
    response.status = 'unhealthy'
    response.checks.authSecret = 'missing'
    response.message = 'AUTH_SECRET is missing'
  }

  try {
    await query('SELECT 1')
  } catch {
    response.status = 'unhealthy'
    response.checks.database = 'failed'
    response.message = response.message ?? 'Auth database check failed'
  }

  return NextResponse.json(response, {
    status: response.status === 'healthy' ? 200 : 503,
  })
}
