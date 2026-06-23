/**
 * @deprecated Removed — use GET /api/it-hilfe/my-offers
 */
import type { NextRequest } from 'next/server'
import { deprecatedApiEndpoint } from '@/lib/api/deprecated-endpoint'

export async function GET(_request: NextRequest) {
  return deprecatedApiEndpoint(
    '/api/it-hilfe/helper/my-offers',
    '/api/it-hilfe/my-offers',
  )
}
