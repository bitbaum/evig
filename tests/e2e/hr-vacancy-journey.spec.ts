/**
 * HR vacancy staff journey — publish → apply → hire → team profile.
 *
 * Env: AUTH_TEST_ADMIN_PASSWORD (and optional AUTH_TEST_ADMIN_EMAIL)
 * Run: npm run test:e2e:hr:journey
 * Prod: PLAYWRIGHT_BASE_URL=https://revampit.orangecat.ch npm run test:e2e:hr:journey
 */

import { test, expect } from '@playwright/test'
import {
  applyToVacancy,
  buildE2EVacancyTitle,
  createVacancyDraft,
  hireApplication,
  listApplicationsForPosting,
  publishVacancy,
} from './helpers/hr-vacancies'
import { ADMIN_TEST_EMAIL, ADMIN_TEST_PASSWORD, loginWithCredentials } from './helpers/auth'
import { ROUTES } from '@/config/routes'

test.describe('HR vacancy journey', () => {
  test.setTimeout(120000)

  test.skip(!ADMIN_TEST_PASSWORD, 'Set AUTH_TEST_ADMIN_PASSWORD')

  test('admin publish → guest apply → admin hire → team profile', async ({ page, browser }) => {
    const title = buildE2EVacancyTitle()
    const applicantEmail = `e2e-hr-${Date.now()}@example.test`
    const applicantName = 'E2E Bewerber'

    await loginWithCredentials(page, ROUTES.admin.hrVacancies, ADMIN_TEST_EMAIL, ADMIN_TEST_PASSWORD)

    const draft = await createVacancyDraft(page.request, title)
    expect(draft.id).toBeTruthy()

    const published = await publishVacancy(page.request, draft.id)
    expect(published.status).toBe('published')
    expect(published.slug).toBeTruthy()

    const baseURL = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3001'
    const guestContext = await browser.newContext({ baseURL })
    try {
      const guestPage = await guestContext.newPage()
      await guestPage.goto(ROUTES.public.careers)
      const application = await applyToVacancy(
        guestPage.request,
        published.slug,
        applicantEmail,
        applicantName,
      )
      expect(application.id).toBeTruthy()
    } finally {
      await guestContext.close()
    }

    const apps = await listApplicationsForPosting(page.request, draft.id)
    const match = apps.find((a) => a.applicant_email === applicantEmail.toLowerCase())
    expect(match?.id).toBeTruthy()

    const hireResult = await hireApplication(page.request, match!.id)
    expect(hireResult.team_profile_id).toBeTruthy()

    await page.goto(ROUTES.admin.team + `/${hireResult.team_profile_id}`)
    await expect(page.getByText(title, { exact: false }).first()).toBeVisible({ timeout: 15000 })
  })

  test('public careers page lists published vacancy', async ({ page }) => {
    const title = buildE2EVacancyTitle()

    await loginWithCredentials(page, ROUTES.admin.hrVacancies, ADMIN_TEST_EMAIL, ADMIN_TEST_PASSWORD)

    const draft = await createVacancyDraft(page.request, title)
    const published = await publishVacancy(page.request, draft.id)

    await page.goto(ROUTES.public.careers)
    await expect(page.getByText(title)).toBeVisible({ timeout: 15000 })

    await page.goto(ROUTES.public.careerPosting(published.slug))
    await expect(page.getByRole('heading', { name: title })).toBeVisible({ timeout: 15000 })
  })
})
