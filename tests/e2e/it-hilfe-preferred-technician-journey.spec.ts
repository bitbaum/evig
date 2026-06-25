/**
 * IT-Hilfe preferred technician journey — requester picks techniker from profile flow.
 *
 * Env: AUTH_TEST_USER_* (techniker) + AUTH_TEST_ADMIN_* (requester).
 * Run: npm run test:e2e:it-hilfe:preferred:journey
 */

import { test, expect } from '@playwright/test'
import {
  getRequesterCredentials,
  getTechnicianCredentials,
  hasDualPersonaCredentials,
  loginWithCredentials,
} from './helpers/auth'
import {
  createItHilfeRequest,
  fetchItHilfeMatches,
  fetchItHilfeRequest,
  getSessionUserId,
  resolveTechnicianProfileIdForUser,
} from './helpers/it-hilfe'

test.describe('IT-Hilfe preferred technician journey', () => {
  test.setTimeout(180000)

  test.skip(
    !hasDualPersonaCredentials(),
    'Set AUTH_TEST_USER_PASSWORD + AUTH_TEST_ADMIN_PASSWORD (different accounts)',
  )

  test('requester picks techniker → detail sidebar → matches list preferred first', async ({
    page,
  }) => {
    const requester = getRequesterCredentials()
    const techniker = getTechnicianCredentials()

    await loginWithCredentials(page, '/dashboard', techniker.email, techniker.password)
    const technikerUserId = await getSessionUserId(page.request)
    const profileId = await resolveTechnicianProfileIdForUser(page.request, technikerUserId)

    await loginWithCredentials(
      page,
      `/it-hilfe/create?technician=${profileId}`,
      requester.email,
      requester.password,
    )
    await expect(page).toHaveURL(new RegExp(`technician=${profileId}`))

    const { requestId } = await createItHilfeRequest(page.request, { preferredTechnicianId: profileId })

    await page.goto(`/it-hilfe/${requestId}`)
    await expect(page.getByRole('heading').first()).toBeVisible({ timeout: 15000 })

    const detail = await fetchItHilfeRequest(page.request, requestId)
    expect(detail.preferredTechnicianId).toBe(profileId)
    expect(detail.preferredTechnicianName).toBeTruthy()

    await expect(page.getByText(detail.preferredTechnicianName!).first()).toBeVisible({
      timeout: 15000,
    })

    const matches = await fetchItHilfeMatches(page.request, requestId)
    expect(matches.length).toBeGreaterThan(0)
    expect(matches[0]?.isPreferred).toBe(true)
    expect(matches[0]?.id).toBe(profileId)

    await loginWithCredentials(
      page,
      `/it-hilfe/techniker/${profileId}`,
      requester.email,
      requester.password,
    )
    await expect(page.getByRole('heading').first()).toBeVisible({ timeout: 15000 })
    await expect(page.getByRole('link', { name: /Anfrage stellen/i }).first()).toBeVisible()
  })
})
