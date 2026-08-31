/**
 * Same state machine as ../../hirn/health.ts, on a SEPARATE tracker — see
 * the module docstring for why the two AI stacks are not merged into one
 * health signal.
 */
import { getAIToolsHealth, recordAIToolsFailure, recordAIToolsSuccess, resetAIToolsHealth } from '../health'

describe('ai tools health tracker', () => {
  beforeEach(() => resetAIToolsHealth())

  it('starts unknown, before anything has been observed', () => {
    expect(getAIToolsHealth().status).toBe('unknown')
  })

  it('is ok after a success', () => {
    recordAIToolsSuccess()
    expect(getAIToolsHealth().status).toBe('ok')
  })

  it('is down once failures are consistent, carrying the built failure message', () => {
    for (let i = 0; i < 3; i += 1) recordAIToolsFailure('KI-Service: API-Schlüssel ungültig oder abgelaufen.')
    const health = getAIToolsHealth()
    expect(health.status).toBe('down')
    expect(health.lastError).toContain('API-Schlüssel')
  })

  it('reset returns to unknown, clearing every field', () => {
    recordAIToolsFailure('boom')
    resetAIToolsHealth()
    const health = getAIToolsHealth()
    expect(health.status).toBe('unknown')
    expect(health.consecutiveFailures).toBe(0)
    expect(health.lastError).toBeNull()
  })
})
