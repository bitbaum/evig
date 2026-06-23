/**
 * Standard 410 Gone response for removed legacy API routes.
 * SSOT for deprecation messaging — points callers to /api/technicians.
 */

import { NextResponse } from 'next/server'

export function deprecatedApiEndpoint(legacyPath: string, replacement: string) {
  return NextResponse.json(
    {
      success: false,
      error: `Endpoint ${legacyPath} was removed. Use ${replacement} instead.`,
      replacement,
    },
    {
      status: 410,
      headers: {
        Deprecation: 'true',
        Link: `<${replacement}>; rel="successor-version"`,
      },
    },
  )
}
