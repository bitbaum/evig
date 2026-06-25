/**
 * Service repair booking journey — dual-persona (user customer + admin assign + user techniker).
 *
 * Env: AUTH_TEST_USER_* + AUTH_TEST_ADMIN_*
 * Run: npm run test:e2e:service:journey
 */

import { test, expect } from '@playwright/test'
import {
  getRequesterCredentials,
  getTechnicianCredentials,
  hasDualPersonaCredentials,
  loginWithCredentials,
} from './helpers/auth'
import {
  assignServiceAppointment,
  cancelServiceAppointment,
  createServiceAppointment,
  fetchServiceAppointment,
  getSessionUserId,
} from './helpers/service-appointments'

test.describe('Service appointment dual-persona journey', () => {
  test.setTimeout(180000)

  test.skip(
    !hasDualPersonaCredentials(),
    'Set AUTH_TEST_USER_PASSWORD + AUTH_TEST_ADMIN_PASSWORD (different accounts)',
  )

  test('admin customer books → assigns user techniker → both see appointment → cancel', async ({
    page,
  }) => {
    const techniker = getTechnicianCredentials()
    const admin = getRequesterCredentials()

    let appointmentId = ''
    let technikerUserId = ''

    try {
      await loginWithCredentials(page, '/services', admin.email, admin.password)
      ;({ appointmentId } = await createServiceAppointment(page.request))

      await page.goto(`/dashboard/appointments/${appointmentId}`)
      await expect(page.getByRole('heading').first()).toBeVisible({ timeout: 15_000 })
      await expect(page.getByText(/Angefragt|Service-Termin/i).first()).toBeVisible({
        timeout: 15_000,
      })

      await loginWithCredentials(page, '/profil/techniker', techniker.email, techniker.password)
      technikerUserId = await getSessionUserId(page.request)

      await loginWithCredentials(page, '/admin/appointments', admin.email, admin.password)
      await assignServiceAppointment(page.request, appointmentId, technikerUserId)

      await loginWithCredentials(
        page,
        `/dashboard/appointments/${appointmentId}`,
        admin.email,
        admin.password,
      )
      await expect(page.getByText(/Angenommen|Angefragt/i).first()).toBeVisible({
        timeout: 15_000,
      })

      await loginWithCredentials(
        page,
        '/dashboard/appointments?role=repairer',
        techniker.email,
        techniker.password,
      )
      await expect(page.getByText(/Angenommen|Angefragt|Service-Termin/i).first()).toBeVisible({
        timeout: 15_000,
      })

      await loginWithCredentials(
        page,
        '/admin/appointments',
        admin.email,
        admin.password,
      )
      await page.goto(`/admin/appointments/${appointmentId}`)
      await expect(page.getByRole('heading').first()).toBeVisible({ timeout: 15_000 })
    } finally {
      if (appointmentId) {
        try {
          await loginWithCredentials(page, '/dashboard', admin.email, admin.password)
          const current = await fetchServiceAppointment(page.request, appointmentId).catch(() => null)
          if (current && current.status !== 'cancelled') {
            await cancelServiceAppointment(page.request, appointmentId)
          }
        } catch {
          /* best-effort */
        }
      }
    }
  })
})
