/**
 * Health Check API
 *
 * GET /api/health
 * Returns the health status of all services
 */

import { NextResponse } from 'next/server'
import { query } from '@/lib/auth/db'
import { MEDUSA_CONFIG } from '@/config/medusa'
import { logger } from '@/lib/logger'

interface ServiceStatus {
  status: 'healthy' | 'unhealthy' | 'degraded'
  latency?: number
  message?: string
}

interface HealthResponse {
  status: 'healthy' | 'unhealthy' | 'degraded'
  timestamp: string
  services: {
    database: ServiceStatus
    medusa: ServiceStatus
    meilisearch: ServiceStatus
  }
}

async function checkDatabase(): Promise<ServiceStatus> {
  const start = Date.now()
  try {
    await query<{ now: Date }>('SELECT NOW() as now')
    return {
      status: 'healthy',
      latency: Date.now() - start,
    }
  } catch (error) {
    logger.error('Database health check failed', { error })
    return {
      status: 'unhealthy',
      message: 'Cannot connect to database',
    }
  }
}

async function checkMedusa(): Promise<ServiceStatus> {
  const start = Date.now()
  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 5000)

    const response = await fetch(`${MEDUSA_CONFIG.BACKEND_URL}/health`, {
      signal: controller.signal,
    })
    clearTimeout(timeoutId)

    if (response.ok) {
      return {
        status: 'healthy',
        latency: Date.now() - start,
      }
    }
    return {
      status: 'unhealthy',
      message: `HTTP ${response.status}`,
    }
  } catch (error) {
    const isConnectionRefused = error instanceof Error &&
      (error.cause as { code?: string })?.code === 'ECONNREFUSED'

    return {
      status: 'unhealthy',
      message: isConnectionRefused
        ? 'Service not running (start with: npm run medusa:dev)'
        : 'Connection failed',
    }
  }
}

async function checkMeilisearch(): Promise<ServiceStatus> {
  const start = Date.now()
  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 5000)

    const response = await fetch(`${process.env.MEILISEARCH_HOST || 'http://localhost:7700'}/health`, {
      signal: controller.signal,
    })
    clearTimeout(timeoutId)

    if (response.ok) {
      return {
        status: 'healthy',
        latency: Date.now() - start,
      }
    }
    return {
      status: 'unhealthy',
      message: `HTTP ${response.status}`,
    }
  } catch {
    return {
      status: 'unhealthy',
      message: 'Service not running',
    }
  }
}

export async function GET() {
  const [database, medusa, meilisearch] = await Promise.all([
    checkDatabase(),
    checkMedusa(),
    checkMeilisearch(),
  ])

  const services = { database, medusa, meilisearch }

  // Determine overall status
  const statuses = Object.values(services).map(s => s.status)
  let overallStatus: 'healthy' | 'unhealthy' | 'degraded' = 'healthy'

  if (statuses.includes('unhealthy')) {
    // If database is down, system is unhealthy
    // If optional services are down, system is degraded
    if (database.status === 'unhealthy') {
      overallStatus = 'unhealthy'
    } else {
      overallStatus = 'degraded'
    }
  }

  const response: HealthResponse = {
    status: overallStatus,
    timestamp: new Date().toISOString(),
    services,
  }

  return NextResponse.json(response, {
    status: overallStatus === 'unhealthy' ? 503 : 200,
  })
}