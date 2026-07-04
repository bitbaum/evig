/**
 * Workshop registration journey — user registers (free), admin sees staff surface.
 *
 * Paid workshops: verifies Payrexx-not-ready message when checkout unavailable.
 *
 * Run: npm run test:e2e:workshops:journey
 */

import { test, expect } from '@playwright/test'
import {
  getRequesterCredentials,
  getTechnicianCredentials,
  hasDualPersonaCredentials,
  loginWithCredentials,
} from './helpers/auth'
import { PAYREXX_SETUP_MESSAGE } from '@/config/payrexx'
import {
  cancelWorkshopRegistration,
  getRegistrationForInstance,
  listWorkshopsWithInstances,
  pickFreeWorkshopWithCapacity,
  pickPaidWorkshopWithCapacity,
} from './helpers/workshops'

test.describe('Workshops dual-persona journey', () => {
  test.setTimeout(180000)

  test.skip(
    !hasDualPersonaCredentials(),
    'Set AUTH_TEST_USER_PASSWORD + AUTH_TEST_ADMIN_PASSWORD (different accounts)',
  )

  test('user free register → dashboard → admin instances; paid shows Payrexx readiness', async ({
    page,
  }) => {
    const user = getTechnicianCredentials()
    const admin = getRequesterCredentials()

    let registrationId = ''

    try {
      await loginWithCredentials(page, '/workshops', user.email, user.password)
      const workshops = await listWorkshopsWithInstances(page.request)
      const freeWorkshop = pickFreeWorkshopWithCapacity(workshops)

      if (freeWorkshop) {
        const instance = freeWorkshop.instances.find(
          inst => inst.status === 'scheduled' && inst.current_participants < inst.max_participants,
        )!

        const existing = await getRegistrationForInstance(page.request, instance.id)
        if (existing.registered && existing.registration?.id) {
          await cancelWorkshopRegistration(page.request, existing.registration.id)
        }

        await page.goto(`/workshops/${freeWorkshop.slug}`)
        await expect(page.locator('#register')).toBeVisible({ timeout: 15_000 })

        const openRegister = page.getByRole('button', { name: 'Für Workshop anmelden' }).first()
        await expect(openRegister).toBeVisible({ timeout: 15_000 })
        await openRegister.click()

        const submitRegister = page.getByRole('button', { name: 'Anmelden', exact: true })
        await expect(submitRegister).toBeVisible({ timeout: 15_000 })
        await submitRegister.click()

        await expect(page.getByText(/Erfolgreich angemeldet|angemeldet|Bestätigung/i).first()).toBeVisible({
          timeout: 30_000,
        })

        const afterRegister = await getRegistrationForInstance(page.request, instance.id)
        if (!afterRegister.registration?.id) {
          throw new Error('Registration not found after UI flow')
        }
        registrationId = afterRegister.registration.id

        await loginWithCredentials(page, '/dashboard/workshops', user.email, user.password)
        await expect(page.getByText(freeWorkshop.title).first()).toBeVisible({ timeout: 15_000 })
      } else {
        test.info().annotations.push({
          type: 'note',
          description: 'No free workshop with open capacity on prod — skipping free register UI',
        })
      }

      await loginWithCredentials(page, '/admin/workshops/instances', admin.email, admin.password)
      await expect(page).toHaveURL(/\/admin\/workshops\/instances/)
      await expect(page.getByRole('heading').first()).toBeVisible({ timeout: 15_000 })

      const paidWorkshop = pickPaidWorkshopWithCapacity(workshops)
      if (paidWorkshop) {
        await loginWithCredentials(
          page,
          `/workshops/${paidWorkshop.slug}#register`,
          user.email,
          user.password,
        )
        const paidButton = page.getByRole('button', { name: /Anmelden & bezahlen/i })
        await expect(paidButton).toBeVisible({ timeout: 15_000 })
        await paidButton.click()
        await expect(page.getByText(PAYREXX_SETUP_MESSAGE.slice(0, 40)).first()).toBeVisible({
          timeout: 15_000,
        })
      } else {
        test.info().annotations.push({
          type: 'note',
          description: 'No paid workshop with open capacity — Payrexx readiness UI skipped',
        })
      }
    } finally {
      if (registrationId) {
        try {
          await loginWithCredentials(page, '/dashboard', user.email, user.password)
          await cancelWorkshopRegistration(page.request, registrationId)
        } catch {
          /* best-effort */
        }
      }
    }
  })
})
