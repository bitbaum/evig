/**
 * Health Check API
 *
 * GET /api/health
 * Returns the health status of all services
 */

import { NextResponse } from 'next/server'
import { query } from '@/lib/auth/db'
import { MEILISEARCH_URL } from '@/config/urls'
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

async function checkMeilisearch(): Promise<ServiceStatus> {
  const start = Date.now()
  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 5000)

    const response = await fetch(`${MEILISEARCH_URL}/health`, {
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
  const [database, meilisearch] = await Promise.all([
    checkDatabase(),
    checkMeilisearch(),
  ])

  const services = { database, meilisearch }

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