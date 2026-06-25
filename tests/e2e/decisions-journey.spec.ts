/**
 * Staff decisions journey — create → vote → close.
 *
 * Uses sense_check + simple_majority with absolute quorum 1 (deterministic on prod).
 * Env: AUTH_TEST_ADMIN_*
 * Run: npm run test:e2e:decisions:journey
 */

import { test, expect } from '@playwright/test'
import {
  ADMIN_TEST_EMAIL,
  ADMIN_TEST_PASSWORD,
  USER_TEST_EMAIL,
  USER_TEST_PASSWORD,
  hasDualPersonaCredentials,
  loginWithCredentials,
} from './helpers/auth'
import { expectAdminRouteBlocked } from './helpers/route-smoke'
import {
  DECISION_STATUS,
  buildE2EDecisionDescription,
  buildE2EDecisionTitle,
  closeDecision,
  createDecision,
  fetchDecision,
  submitSimpleMajorityVote,
  tryCloseDecision,
} from './helpers/decisions'

test.describe('Admin decisions staff journey', () => {
  test.setTimeout(120000)

  test.skip(!ADMIN_TEST_PASSWORD, 'Set AUTH_TEST_ADMIN_PASSWORD')

  test('admin creates decision → votes → closes (API + UI)', async ({ page }) => {
    const title = buildE2EDecisionTitle()
    const description = buildE2EDecisionDescription()
    const outcomeSummary = 'E2E: Ja-Stimme angenommen, Abstimmung abgeschlossen.'

    await loginWithCredentials(page, '/admin/decisions', ADMIN_TEST_EMAIL, ADMIN_TEST_PASSWORD)
    await expect(page.getByRole('heading', { name: 'Entscheidungen', level: 1 })).toBeVisible({
      timeout: 15000,
    })

    const created = await createDecision(page.request, title, description)
    expect(created.status).toBe(DECISION_STATUS.VOTING)

    let detail = await fetchDecision(page.request, created.id)
    expect(detail.status).toBe(DECISION_STATUS.VOTING)
    expect(detail.votingMethod).toBe('simple_majority')
    expect(detail.hasUserVoted).toBe(false)

    const blockedClose = await tryCloseDecision(page.request, created.id, outcomeSummary)
    expect(blockedClose.ok).toBe(false)

    await submitSimpleMajorityVote(page.request, created.id, 'yes')

    detail = await fetchDecision(page.request, created.id)
    expect(detail.hasUserVoted).toBe(true)
    expect(detail.voteCount).toBeGreaterThanOrEqual(1)

    await page.goto(`/admin/decisions/${created.id}`)
    await expect(page.getByRole('heading', { name: title, level: 1 })).toBeVisible({
      timeout: 15000,
    })
    await expect(page.getByText('Abstimmung').first()).toBeVisible()
    await expect(page.getByText(description)).toBeVisible()
    await expect(page.getByText('Deine Stimme wurde abgegeben')).toBeVisible()

    await closeDecision(page.request, created.id, outcomeSummary)

    detail = await fetchDecision(page.request, created.id)
    expect(detail.status).toBe(DECISION_STATUS.CLOSED)
    expect(detail.outcomeSummary).toBe(outcomeSummary)

    await page.goto(`/admin/decisions/${created.id}`)
    await expect(page.getByRole('main').getByText('Abgeschlossen').first()).toBeVisible({
      timeout: 15000,
    })
    await expect(page.getByRole('button', { name: 'Abstimmung schliessen' })).toHaveCount(0)
    await expect(page.getByText(outcomeSummary)).toBeVisible()

    if (hasDualPersonaCredentials()) {
      await loginWithCredentials(page, '/dashboard', USER_TEST_EMAIL, USER_TEST_PASSWORD)
      await expectAdminRouteBlocked(page, '/admin/decisions')
    }
  })
})
