/**
 * IT-Hilfe full journey — dual-persona (admin requester + user techniker).
 *
 * Env: AUTH_TEST_USER_* (techniker) + AUTH_TEST_ADMIN_* (requester).
 * Run: npm run test:e2e:it-hilfe:journey
 */

import { test, expect } from '@playwright/test'
import {
  getRequesterCredentials,
  getTechnicianCredentials,
  hasDualPersonaCredentials,
  loginWithCredentials,
} from './helpers/auth'
import {
  acceptItHilfeOffer,
  completeItHilfeRequest,
  confirmItHilfeReview,
  createItHilfeRequest,
  fetchItHilfeRequest,
  submitItHilfeOffer,
} from './helpers/it-hilfe'
import { expectAdminRouteBlocked } from './helpers/route-smoke'

test.describe('IT-Hilfe dual-persona journey', () => {
  test.setTimeout(180000)

  test.skip(
    !hasDualPersonaCredentials(),
    'Set AUTH_TEST_USER_PASSWORD + AUTH_TEST_ADMIN_PASSWORD (different accounts)',
  )

  test('admin creates → user offers → admin accepts → user completes → admin reviews', async ({
    page,
  }) => {
    const requester = getRequesterCredentials()
    const techniker = getTechnicianCredentials()

    // 1. Admin (requester) creates request via API
    await loginWithCredentials(page, '/dashboard', requester.email, requester.password)
    const { requestId } = await createItHilfeRequest(page.request)

    await page.goto(`/it-hilfe/${requestId}`)
    await expect(page.getByRole('heading').first()).toBeVisible({ timeout: 15000 })

    // 2. User (techniker) submits offer
    await loginWithCredentials(
      page,
      `/it-hilfe/${requestId}`,
      techniker.email,
      techniker.password,
    )
    const { offerId } = await submitItHilfeOffer(page.request, requestId)
    await expect(
      page.getByRole('button', { name: 'Angebot abgeben' }).or(
        page.getByText(/Angebot abgegeben|bereits ein Angebot/i),
      ),
    ).toBeVisible({ timeout: 15000 })

    // 3. Admin accepts offer
    await loginWithCredentials(page, `/it-hilfe/${requestId}`, requester.email, requester.password)
    await acceptItHilfeOffer(page.request, requestId, offerId)
    let status = (await fetchItHilfeRequest(page.request, requestId)).status
    expect(status).toBe('matched')
    await page.reload()
    await expect(page.getByText(/vergeben|matched|Techniker/i).first()).toBeVisible({
      timeout: 15000,
    })

    // 4. User marks complete
    await loginWithCredentials(
      page,
      `/it-hilfe/${requestId}`,
      techniker.email,
      techniker.password,
    )
    await completeItHilfeRequest(page.request, requestId)
    status = (await fetchItHilfeRequest(page.request, requestId)).status
    expect(status).toBe('completed')

    // 5. Admin confirms review
    await loginWithCredentials(page, `/it-hilfe/${requestId}`, requester.email, requester.password)
    await confirmItHilfeReview(page.request, requestId)
    const final = await fetchItHilfeRequest(page.request, requestId)
    expect(final.status).toBe('completed')
    expect(final.reviewedAt).toBeTruthy()

    // 6. Admin can open staff IT-Hilfe moderation
    await loginWithCredentials(page, '/admin/it-hilfe', requester.email, requester.password)
    await expect(page).toHaveURL(/\/admin\/it-hilfe/)
    await expect(page.getByRole('heading').first()).toBeVisible({ timeout: 15000 })

    // 7. User must stay blocked from admin IT-Hilfe
    await loginWithCredentials(page, '/dashboard', techniker.email, techniker.password)
    await expectAdminRouteBlocked(page, '/admin/it-hilfe')
  })
})
