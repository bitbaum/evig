/**
 * Staff timecard journey — submit (staff) → approve (admin queue).
 *
 * Env: AUTH_TEST_ADMIN_* (staff with timecard access).
 * Run: npm run test:e2e:timecards:journey
 */

import { test, expect } from '@playwright/test'
import { ADMIN_TEST_EMAIL, ADMIN_TEST_PASSWORD, loginWithCredentials } from './helpers/auth'
import {
  approveTimecardAsAdmin,
  fetchCurrentTimecard,
  resetTimecardForE2E,
  submitTimecardForReview,
} from './helpers/timecards'

test.describe('Timecard staff journey', () => {
  test.setTimeout(120000)

  test.skip(!ADMIN_TEST_PASSWORD, 'Set AUTH_TEST_ADMIN_PASSWORD')

  test('staff fills month → submits → admin approves (API round-trip)', async ({ page }) => {
    await loginWithCredentials(page, '/admin/zeiterfassung', ADMIN_TEST_EMAIL, ADMIN_TEST_PASSWORD)

    const resetState = await resetTimecardForE2E(page.request)
    await page.reload()

    if (resetState === 'already_approved') {
      const approved = await fetchCurrentTimecard(page.request)
      expect(approved.status).toBe('approved')
      for (const entry of approved.entries) {
        if (entry.start_time) expect(entry.start_time).toMatch(/^\d{2}:\d{2}$/)
        if (entry.end_time) expect(entry.end_time).toMatch(/^\d{2}:\d{2}$/)
      }
      return
    }

    await expect(page.getByRole('heading', { name: 'Zeiterfassung' })).toBeVisible({
      timeout: 15000,
    })

    // The submit control renders twice on purpose — once in the header and once
    // in the sticky action bar (reachability while scrolling) — so the role+name
    // locator matches two elements. Either submits; target the first (header).
    const submitButton = page
      .getByRole('button', { name: /Zur Prüfung einreichen|Erneut einreichen/ })
      .first()
    await expect(submitButton).toBeVisible({ timeout: 15000 })

    if (!(await submitButton.isEnabled())) {
      await page.getByRole('button', { name: 'Monat aus Plan füllen' }).click()
      await expect(submitButton).toBeEnabled({ timeout: 15000 })
    }

    await submitButton.click()
    await expect(page.getByText(/Freigabe-Team wird benachrichtigt|Zur Prüfung gesendet/i)).toBeVisible({
      timeout: 20000,
    })

    const submitted = await fetchCurrentTimecard(page.request)
    expect(submitted.status).toBe('submitted')
    expect(submitted.entries.length).toBeGreaterThan(0)
    for (const entry of submitted.entries) {
      if (entry.start_time) expect(entry.start_time).toMatch(/^\d{2}:\d{2}$/)
      if (entry.end_time) expect(entry.end_time).toMatch(/^\d{2}:\d{2}$/)
    }

    // Resubmit path: load → POST again must accept HH:MM from API (not HH:MM:SS)
    const resubmitted = await submitTimecardForReview(page.request)
    expect(resubmitted.status).toBe('submitted')

    await loginWithCredentials(page, '/admin/zeiterfassung', ADMIN_TEST_EMAIL, ADMIN_TEST_PASSWORD)
    await expect(page.getByRole('heading', { name: 'Zeitkarten' })).toBeVisible({ timeout: 15000 })

    await approveTimecardAsAdmin(page.request, submitted.id)
    const afterApprove = await fetchCurrentTimecard(page.request)
    expect(afterApprove.status).toBe('approved')
  })
})
