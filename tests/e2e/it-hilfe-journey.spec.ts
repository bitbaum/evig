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
  completeItHilfeRequest,
  confirmItHilfeReview,
  createItHilfeRequest,
  fetchItHilfeOffers,
  fetchItHilfeRequest,
  submitItHilfeOffer,
  updateItHilfeRequest,
  withdrawItHilfeOffer,
} from './helpers/it-hilfe'
import { expectAdminRouteBlocked } from './helpers/route-smoke'

test.describe('IT-Hilfe dual-persona journey', () => {
  test.use({ storageState: { cookies: [], origins: [] } })
  test.setTimeout(180000)

  test.beforeAll(async ({ request }) => {
    // Webpack dev lazily compiles nested API routes; prime accept handler.
    await request.post(
      '/api/it-hilfe/requests/00000000-0000-0000-0000-000000000000/offers/00000000-0000-0000-0000-000000000001/accept',
      { headers: { 'x-csrf-token': 'warmup' }, failOnStatusCode: false },
    )
  })

  test.skip(
    !hasDualPersonaCredentials(),
    'Set AUTH_TEST_USER_PASSWORD + AUTH_TEST_ADMIN_PASSWORD (different accounts)',
  )

  test('owner edits open request and techniker withdraws pending offer', async ({ page }) => {
    const requester = getRequesterCredentials()
    const techniker = getTechnicianCredentials()
    const editedTitle = `E2E bearbeitet ${Date.now()}`

    await loginWithCredentials(page, '/dashboard', requester.email, requester.password)
    const { requestId } = await createItHilfeRequest(page.request)

    await updateItHilfeRequest(page.request, requestId, { title: editedTitle })
    expect((await fetchItHilfeRequest(page.request, requestId)).title).toBe(editedTitle)

    await loginWithCredentials(
      page,
      `/it-hilfe/${requestId}/edit`,
      requester.email,
      requester.password,
    )
    await expect(page.locator(`input[value="${editedTitle}"]`)).toBeVisible({ timeout: 60000 })

    await loginWithCredentials(
      page,
      `/it-hilfe/${requestId}`,
      techniker.email,
      techniker.password,
    )
    const { offerId } = await submitItHilfeOffer(page.request, requestId)
    await withdrawItHilfeOffer(page.request, requestId, offerId)

    await loginWithCredentials(page, `/it-hilfe/${requestId}`, requester.email, requester.password)
    const offersAfterWithdraw = await fetchItHilfeOffers(page.request, requestId)
    expect(offersAfterWithdraw.some(o => o.id === offerId && o.status === 'pending')).toBe(false)

    await loginWithCredentials(page, `/it-hilfe/${requestId}`, techniker.email, techniker.password)
    const { offerId: offerId2 } = await submitItHilfeOffer(
      page.request,
      requestId,
      'E2E-Angebot nach Rückzug: Ich kann weiterhin helfen und schaue es mir gerne an.',
    )
    await loginWithCredentials(page, `/it-hilfe/${requestId}`, requester.email, requester.password)
    const offersAfterResubmit = await fetchItHilfeOffers(page.request, requestId)
    expect(offersAfterResubmit.some(o => o.id === offerId2 && o.status === 'pending')).toBe(true)
  })

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
    await page.reload()
    await expect(
      page.getByRole('button', { name: /Angebot zurückziehen|Withdraw offer/i }),
    ).toBeVisible({ timeout: 15000 })

    // 3. Admin accepts offer (UI — avoids webpack dev 404 on nested accept API route)
    await loginWithCredentials(page, `/it-hilfe/${requestId}`, requester.email, requester.password)
    await page.reload()
    await page.getByRole('button', { name: /Akzeptieren|Accept/i }).first().click()
    await page.getByRole('button', { name: /Bestätigen|Confirm/i }).click()
    await expect.poll(
      async () => (await fetchItHilfeRequest(page.request, requestId)).status,
      { timeout: 30000 },
    ).toBe('matched')
    let status = 'matched'
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
