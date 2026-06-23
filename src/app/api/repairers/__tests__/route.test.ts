/**
 * @jest-environment node
 *
 * GET /api/repairers — removed; returns 410 Gone with successor link.
 */

import { NextRequest } from 'next/server'
import { GET } from '../route'

describe('GET /api/repairers — deprecated', () => {
  it('returns 410 Gone with replacement URL', async () => {
    const res = await GET(new NextRequest('http://localhost/api/repairers'))
    const body = await res.json()

    expect(res.status).toBe(410)
    expect(body.success).toBe(false)
    expect(body.replacement).toBe('/api/technicians?tier=professional')
    expect(res.headers.get('Deprecation')).toBe('true')
    expect(res.headers.get('Link')).toContain('/api/technicians?tier=professional')
  })
})
