/**
 * @jest-environment node
 *
 * GET /api/it-hilfe/helper/my-offers — removed; returns 410 Gone with successor link.
 */

import { NextRequest } from 'next/server'
import { GET } from '../route'

describe('GET /api/it-hilfe/helper/my-offers — deprecated', () => {
  it('returns 410 Gone with replacement URL', async () => {
    const res = await GET(new NextRequest('http://localhost/api/it-hilfe/helper/my-offers'))
    const body = await res.json()

    expect(res.status).toBe(410)
    expect(body.success).toBe(false)
    expect(body.replacement).toBe('/api/it-hilfe/my-offers')
    expect(res.headers.get('Deprecation')).toBe('true')
    expect(res.headers.get('Link')).toContain('/api/it-hilfe/my-offers')
  })
})
