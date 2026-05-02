/**
 * @jest-environment node
 *
 * Tests for POST /api/admin/hirn/init
 *
 * Behaviors locked:
 *   POST /api/admin/hirn/init
 *   - returns 401 when not authenticated
 *   - returns 200 with success message when initialized
 *   - returns 500 when db.execute throws
 */

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const mockAuth = jest.fn()

jest.mock('@/auth', () => ({
  auth: (...args: unknown[]) => mockAuth.apply(null, args),
}))

jest.mock('@/lib/api/middleware', () => ({
  withAdmin: (sectionOrHandler: unknown, maybeHandler?: unknown) => {
    const handler = typeof sectionOrHandler === 'function' ? sectionOrHandler : maybeHandler
    return (req: Request) =>
      mockAuth().then((session: unknown) => {
        if (!session || !(session as { user?: { id?: string } }).user?.id) {
          const { NextResponse } = jest.requireActual('next/server')
          return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
        }
        return (handler as (r: Request, s: unknown) => unknown)(req, session)
      })
  },
}))

const mockExecute = jest.fn()
const mockOnConflictDoNothing = jest.fn()
const mockValues = jest.fn()
const mockInsert = jest.fn()

jest.mock('@/db', () => ({
  db: {
    execute: (...args: unknown[]) => mockExecute.apply(null, args),
    insert: (...args: unknown[]) => { mockInsert(...args); return { values: mockValues } },
  },
}))

jest.mock('drizzle-orm', () => ({
  sql: Object.assign(
    (_strings: TemplateStringsArray, ..._values: unknown[]) => ({ __sql: true }),
    { raw: (str: string) => ({ __raw: str }) }
  ),
}))

jest.mock('@/db/schema/hirn', () => ({
  hirnProviderSettings: { id: 'hps_id', provider: 'hps_provider' },
}))

jest.mock('@/config/urls', () => ({
  OLLAMA_URL: 'http://localhost:11434',
}))

jest.mock('@/config/database', () => ({
  TABLE_NAMES: { USERS: 'users' },
}))

jest.mock('@/lib/api/helpers', () => {
  const { NextResponse } = jest.requireActual('next/server')
  return {
    apiSuccess: (data: unknown) => NextResponse.json({ success: true, data }),
    apiError: (err: unknown, msg: string, status = 500) =>
      NextResponse.json({ success: false, error: msg }, { status }),
  }
})

jest.mock('@/lib/logger', () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() },
}))

// ---------------------------------------------------------------------------
// Imports (after mocks)
// ---------------------------------------------------------------------------

import { NextRequest } from 'next/server'
import { POST } from '../route'

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const MOCK_SESSION = {
  user: { id: 'admin-1', email: 'admin@revamp-it.ch', name: 'Admin', isStaff: true, staffPermissions: ['*'] as string[], isSuperAdmin: true },
  expires: '2027-01-01',
}

function makeRequest() {
  return new NextRequest('http://localhost/api/admin/hirn/init', { method: 'POST' })
}

beforeEach(() => {
  jest.resetAllMocks()
  mockAuth.mockResolvedValue(MOCK_SESSION)
  mockExecute.mockResolvedValue(undefined)
  mockValues.mockReturnValue({ onConflictDoNothing: mockOnConflictDoNothing })
  mockOnConflictDoNothing.mockResolvedValue(undefined)
})

// ============================================================================
// POST /api/admin/hirn/init
// ============================================================================

describe('POST /api/admin/hirn/init — unauthenticated', () => {
  it('returns 401 when session is null', async () => {
    mockAuth.mockResolvedValueOnce(null)
    const response = await POST(makeRequest())
    expect(response.status).toBe(401)
  })
})

describe('POST /api/admin/hirn/init — success', () => {
  it('returns 200 with success message', async () => {
    const response = await POST(makeRequest())
    expect(response.status).toBe(200)
    const body = await response.json()
    expect(body.data.message).toMatch(/initialisiert/i)
  })

  it('calls db.execute 3 times for DDL and db.insert 3 times for seed data', async () => {
    await POST(makeRequest())
    expect(mockExecute).toHaveBeenCalledTimes(3)
    expect(mockInsert).toHaveBeenCalledTimes(3)
  })
})

describe('POST /api/admin/hirn/init — errors', () => {
  it('returns 500 when db.execute throws', async () => {
    mockExecute.mockRejectedValueOnce(new Error('DB error'))
    const response = await POST(makeRequest())
    expect(response.status).toBe(500)
  })
})
