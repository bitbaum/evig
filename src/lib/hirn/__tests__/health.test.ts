/**
 * evig's /api/health checked only the database and Meilisearch until now —
 * an AI outage was invisible to it. This pins the state machine that check
 * now depends on.
 */
import { getLLMHealth, recordLLMFailure, recordLLMSuccess, resetLLMHealth } from '../health'

describe('hirn llm health tracker', () => {
  beforeEach(() => resetLLMHealth())

  it('starts unknown, before anything has been observed', () => {
    expect(getLLMHealth().status).toBe('unknown')
  })

  it('is ok after a success', () => {
    recordLLMSuccess()
    expect(getLLMHealth().status).toBe('ok')
  })

  it('is degraded on the first failures, not down', () => {
    recordLLMFailure(new Error('Kein KI-Anbieter verfügbar'))
    expect(getLLMHealth().status).toBe('degraded')
  })

  it('is down once failures are consistent', () => {
    for (let i = 0; i < 3; i += 1) recordLLMFailure(new Error('boom'))
    const health = getLLMHealth()
    expect(health.status).toBe('down')
    expect(health.consecutiveFailures).toBe(3)
    expect(health.lastError).toBe('boom')
  })

  it('recovers to ok on the next success', () => {
    for (let i = 0; i < 5; i += 1) recordLLMFailure(new Error('boom'))
    expect(getLLMHealth().status).toBe('down')
    recordLLMSuccess()
    const health = getLLMHealth()
    expect(health.status).toBe('ok')
    expect(health.consecutiveFailures).toBe(0)
    expect(health.lastError).toBeNull()
  })
})
