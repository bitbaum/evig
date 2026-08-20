/**
 * @jest-environment node
 */
import { requireCronAuth } from '@/lib/api/cron-auth'

jest.mock('@/lib/logger', () => ({ logger: { error: jest.fn(), warn: jest.fn(), info: jest.fn() } }))

const req = (authorization?: string) =>
  new Request('http://localhost/api/cron/thing', {
    headers: authorization ? { authorization } : {},
  })

const ORIGINAL = process.env.CRON_SECRET
afterEach(() => {
  if (ORIGINAL === undefined) delete process.env.CRON_SECRET
  else process.env.CRON_SECRET = ORIGINAL
})

describe('an unset secret denies everything', () => {
  // The bug this file exists for. Five of six cron routes used a variant that
  // failed open when CRON_SECRET was unset — including release-escrow, which
  // captures payment transactions and releases escrowed funds.
  it('denies when CRON_SECRET is missing, whatever is sent', () => {
    delete process.env.CRON_SECRET
    expect(requireCronAuth(req('Bearer anything')).ok).toBe(false)
    expect(requireCronAuth(req('Bearer undefined')).ok).toBe(false)
    expect(requireCronAuth(req()).ok).toBe(false)
  })

  it('denies when CRON_SECRET is empty or whitespace', () => {
    process.env.CRON_SECRET = ''
    expect(requireCronAuth(req('Bearer ')).ok).toBe(false)
    process.env.CRON_SECRET = '   '
    expect(requireCronAuth(req('Bearer    ')).ok).toBe(false)
  })
})

describe('with a secret configured', () => {
  const SECRET = 'a-real-cron-secret-value'
  beforeEach(() => {
    process.env.CRON_SECRET = SECRET
  })

  it('accepts the matching bearer token', () => {
    expect(requireCronAuth(req(`Bearer ${SECRET}`)).ok).toBe(true)
  })

  it('rejects a wrong token', () => {
    expect(requireCronAuth(req('Bearer wrong')).ok).toBe(false)
  })

  it('rejects a token that merely starts or ends correctly', () => {
    expect(requireCronAuth(req(`Bearer ${SECRET.slice(0, -1)}`)).ok).toBe(false)
    expect(requireCronAuth(req(`Bearer ${SECRET}x`)).ok).toBe(false)
  })

  it('rejects a missing header', () => {
    expect(requireCronAuth(req()).ok).toBe(false)
  })

  it('rejects the raw secret without the Bearer scheme', () => {
    expect(requireCronAuth(req(SECRET)).ok).toBe(false)
  })

  it('rejects another scheme carrying the right secret', () => {
    expect(requireCronAuth(req(`Basic ${SECRET}`)).ok).toBe(false)
  })

  it('is case-sensitive', () => {
    expect(requireCronAuth(req(`Bearer ${SECRET.toUpperCase()}`)).ok).toBe(false)
  })

  it('answers 401 without explaining why', async () => {
    const result = requireCronAuth(req('Bearer wrong'))
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.response.status).toBe(401)
      await expect(result.response.json()).resolves.toEqual({ error: 'Unauthorized' })
    }
  })
})
