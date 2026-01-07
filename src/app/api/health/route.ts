import { NextResponse } from 'next/server'
import { getPool } from '@/lib/auth/db'
import { logger } from '@/lib/logger'

export async function GET() {
  try {
    // Check database connection
    const pool = getPool()
    await pool.query('SELECT 1')

    // Return health status
    return NextResponse.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      services: {
        database: 'connected',
        application: 'running'
      }
    })
  } catch (error) {
    logger.error('Health check failed', { error })
    return NextResponse.json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: 'Database connection failed'
    }, { status: 503 })
  }
}