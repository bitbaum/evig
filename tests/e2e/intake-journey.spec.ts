/**
 * Staff intake pipeline journey — create → checklist gate → publish.
 *
 * Env: AUTH_TEST_ADMIN_* (intake admin section) + AUTH_TEST_SECOND_ADMIN_*
 * (final QA must be signed off by a second person — Vier-Augen-Prinzip).
 * Optional dual-persona: AUTH_TEST_USER_* to verify non-admin blocked from /admin/intake.
 * Run: npm run test:e2e:intake:journey
 */

import { test, expect } from '@playwright/test'
import {
  ADMIN_TEST_EMAIL,
  ADMIN_TEST_PASSWORD,
  SECOND_ADMIN_TEST_EMAIL,
  SECOND_ADMIN_TEST_PASSWORD,
  USER_TEST_EMAIL,
  USER_TEST_PASSWORD,
  hasDualPersonaCredentials,
  loginWithCredentials,
} from './helpers/auth'
import { expectAdminRouteBlocked } from './helpers/route-smoke'
import {
  buildE2EIntakeProductName,
  completeRequiredIntakeChecklist,
  createIntakeItem,
  fetchIntakeDetail,
  publishIntakeItem,
  tryPublishIntakeItem,
  trySetIntakeChecklistVerdict,
} from './helpers/intake'
import { INTAKE_TIERS } from '@/config/intake-checklist'
import { INTAKE_STATUS } from '@/config/intake-status'

test.describe('Intake pipeline staff journey', () => {
  test.setTimeout(120000)

  test.skip(!ADMIN_TEST_PASSWORD, 'Set AUTH_TEST_ADMIN_PASSWORD')
  test.skip(!SECOND_ADMIN_TEST_PASSWORD, 'Set AUTH_TEST_SECOND_ADMIN_PASSWORD (Vier-Augen final QA)')

  test('admin creates refurbish device → completes checklist → publishes (API + UI)', async ({
    page,
    browser,
  }) => {
    const productName = buildE2EIntakeProductName()

    await loginWithCredentials(page, '/admin/intake', ADMIN_TEST_EMAIL, ADMIN_TEST_PASSWORD)
    await expect(page.getByRole('heading', { name: 'Geräte-Eingang' })).toBeVisible({
      timeout: 15000,
    })

    const created = await createIntakeItem(page.request, {
      hersteller: 'RevampIT',
      produktname: productName,
      kurzbeschreibung: 'Automatisierter E2E-Test (Refurbish-Stufe)',
      zustand: 'good',
      intake_tier: INTAKE_TIERS.REFURBISH,
    })

    let detail = await fetchIntakeDetail(page.request, created.inventory_id)
    expect(detail.checklist_complete).toBe(false)
    expect(detail.marketplace_status).not.toBe(INTAKE_STATUS.PUBLISHED)

    const blocked = await tryPublishIntakeItem(page.request, created.inventory_id)
    expect(blocked.ok).toBe(false)
    expect(blocked.status).toBe(400)

    // Vier-Augen-Prinzip: the sole worker cannot sign off final QA —
    // neither before any work is done nor after doing everything alone.
    const soloQa = await trySetIntakeChecklistVerdict(
      page.request,
      created.inventory_id,
      'final_qa',
    )
    expect(soloQa.ok).toBe(false)
    expect(soloQa.status).toBe(400)

    // Second staff account signs off the second-person items (final QA).
    const secondContext = await browser.newContext()
    try {
      const secondPage = await secondContext.newPage()
      await loginWithCredentials(
        secondPage,
        '/admin/intake',
        SECOND_ADMIN_TEST_EMAIL,
        SECOND_ADMIN_TEST_PASSWORD,
      )

      await completeRequiredIntakeChecklist(
        page.request,
        created.inventory_id,
        INTAKE_TIERS.REFURBISH,
        undefined,
        secondPage.request,
      )
    } finally {
      await secondContext.close()
    }

    detail = await fetchIntakeDetail(page.request, created.inventory_id)
    expect(detail.checklist_complete).toBe(true)

    await page.goto(`/admin/intake?detail=${created.inventory_id}`)
    await expect(page.getByRole('heading', { name: new RegExp(productName) })).toBeVisible({
      timeout: 15000,
    })
    await expect(page.getByText(/Fortschritt:/)).toBeVisible({ timeout: 15000 })
    await expect(page.getByRole('heading', { name: 'Im Shop veröffentlichen' })).toBeVisible({
      timeout: 15000,
    })

    await publishIntakeItem(page.request, created.inventory_id, {
      price_chf: 1,
      title: productName,
      description: 'E2E intake journey — safe to archive',
    })

    detail = await fetchIntakeDetail(page.request, created.inventory_id)
    expect(detail.marketplace_status).toBe(INTAKE_STATUS.PUBLISHED)

    await page.goto(`/admin/intake?detail=${created.inventory_id}`)
    await expect(page.getByText('Dieses Gerät ist im Shop veröffentlicht')).toBeVisible({
      timeout: 15000,
    })

    if (hasDualPersonaCredentials()) {
      await loginWithCredentials(page, '/dashboard', USER_TEST_EMAIL, USER_TEST_PASSWORD)
      await expectAdminRouteBlocked(page, '/admin/intake')
    }
  })
})
