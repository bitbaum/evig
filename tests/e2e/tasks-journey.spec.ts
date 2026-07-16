/**
 * Staff tasks journey — create → complete (API + UI).
 *
 * Env: AUTH_TEST_ADMIN_*
 * Optional dual-persona: AUTH_TEST_USER_* blocks /admin/tasks
 * Run: npm run test:e2e:tasks:journey
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
  buildE2ETaskTitle,
  completeAdminTask,
  createAdminTask,
  fetchAdminTaskDetail,
} from './helpers/tasks'

test.describe('Admin tasks staff journey', () => {
  test.setTimeout(120000)

  test.skip(!ADMIN_TEST_PASSWORD, 'Set AUTH_TEST_ADMIN_PASSWORD')

  test('admin creates one-time task → completes → history visible (API + UI)', async ({
    page,
  }) => {
    const title = buildE2ETaskTitle()

    await loginWithCredentials(page, '/admin/tasks', ADMIN_TEST_EMAIL, ADMIN_TEST_PASSWORD)
    await expect(page.getByRole('heading', { name: 'Aufgaben', level: 1 })).toBeVisible({
      timeout: 15000,
    })

    const created = await createAdminTask(page.request, { title })

    let detail = await fetchAdminTaskDetail(page.request, created.id)
    expect(detail.task.is_completed).toBe(false)
    expect(detail.completions).toHaveLength(0)

    await page.goto(`/admin/tasks/${created.id}`)
    await expect(page.getByRole('heading', { name: title, level: 1 })).toBeVisible({
      timeout: 15000,
    })
    await expect(page.getByRole('button', { name: 'Als erledigt markieren' })).toBeVisible({
      timeout: 15000,
    })
    // .first(): the empty state can render in two panes (list + detail).
    await expect(page.getByText('Noch keine Erledigungen').first()).toBeVisible()

    await completeAdminTask(page.request, created.id)

    detail = await fetchAdminTaskDetail(page.request, created.id)
    expect(detail.completions.length).toBeGreaterThan(0)
    expect(detail.completions[0]?.notes).toBe('E2E erledigt')
    expect(detail.task.is_completed).toBe(true)

    await page.goto(`/admin/tasks/${created.id}`)
    await expect(page.getByRole('heading', { name: 'Erledigungen (1)' })).toBeVisible({
      timeout: 15000,
    })
    await expect(page.getByText('E2E erledigt')).toBeVisible()

    if (hasDualPersonaCredentials()) {
      await loginWithCredentials(page, '/dashboard', USER_TEST_EMAIL, USER_TEST_PASSWORD)
      await expectAdminRouteBlocked(page, '/admin/tasks')
    }
  })
})
