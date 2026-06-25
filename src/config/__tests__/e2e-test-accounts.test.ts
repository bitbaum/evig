import { isE2ETestAccountEmail, E2E_TEST_ACCOUNT_EMAILS } from '@/config/e2e-test-accounts'

describe('e2e-test-accounts', () => {
  it('matches configured prod E2E emails case-insensitively', () => {
    expect(isE2ETestAccountEmail('georgy.butaev@revamp-it.ch')).toBe(true)
    expect(isE2ETestAccountEmail('Georgy.Butaev@Revamp-IT.ch')).toBe(true)
    expect(isE2ETestAccountEmail('butaeff@gmail.com')).toBe(true)
    expect(isE2ETestAccountEmail('random@example.com')).toBe(false)
    expect(isE2ETestAccountEmail(null)).toBe(false)
  })

  it('exports at least two accounts for dual-persona', () => {
    expect(E2E_TEST_ACCOUNT_EMAILS.length).toBeGreaterThanOrEqual(2)
  })
})
