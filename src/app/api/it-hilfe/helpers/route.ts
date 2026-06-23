/**
 * @deprecated Removed — use GET /api/technicians?tier=community
 */
import type { NextRequest } from 'next/server'
import { deprecatedApiEndpoint } from '@/lib/api/deprecated-endpoint'

export async function GET(_request: NextRequest) {
  return deprecatedApiEndpoint(
    '/api/it-hilfe/helpers',
    '/api/technicians?tier=community',
  )
}
