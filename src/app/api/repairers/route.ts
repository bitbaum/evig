/**
 * @deprecated Removed — use GET /api/technicians?tier=professional
 */
import type { NextRequest } from 'next/server'
import { deprecatedApiEndpoint } from '@/lib/api/deprecated-endpoint'

export async function GET(_request: NextRequest) {
  return deprecatedApiEndpoint(
    '/api/repairers',
    '/api/technicians?tier=professional',
  )
}
