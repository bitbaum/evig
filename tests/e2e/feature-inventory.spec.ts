/**
 * Dual-persona feature inventory smoke — SSOT for "check everything as user + admin".
 *
 * Env (production or local):
 *   AUTH_TEST_USER_EMAIL / AUTH_TEST_USER_PASSWORD  — non-admin (butaeff@gmail.com)
 *   AUTH_TEST_ADMIN_EMAIL / AUTH_TEST_ADMIN_PASSWORD — staff (georgy.butaev@revamp-it.ch)
 *
 * Run: npm run test:e2e:inventory
 */

import { test } from '@playwright/test'
import { loginWithCredentials } from './helpers/auth'
import {
  ADMIN_BLOCK_CHECK_ROUTES,
  ADMIN_ROUTES,
  PUBLIC_ROUTES,
  USER_DASHBOARD_ROUTES,
  dynamicAdminRoutes,
  dynamicUserRoutes,
  emptyStateFallbackRoutes,
} from './helpers/inventory-routes'
import {
  discoverDynamicIds,
  expectAdminRouteBlocked,
  smokeAuthenticatedRoute,
  smokePublicRoute,
  type DynamicSmokeIds,
} from './helpers/route-smoke'
import type { Page } from '@playwright/test'

test.setTimeout(90_000)

const USER_EMAIL = process.env.AUTH_TEST_USER_EMAIL || 'butaeff@gmail.com'
const USER_PASSWORD = process.env.AUTH_TEST_USER_PASSWORD || process.env.AUTH_TEST_PASSWORD || ''
const ADMIN_EMAIL = process.env.AUTH_TEST_ADMIN_EMAIL || 'georgy.butaev@revamp-it.ch'
const ADMIN_PASSWORD = process.env.AUTH_TEST_ADMIN_PASSWORD || process.env.TEST_ADMIN_PASSWORD || ''

function describePersona(
  title: string,
  email: string,
  password: string,
  envHint: string,
  run: (ctx: { getPage: () => Page; getIds: () => DynamicSmokeIds }) => void,
) {
  test.describe(title, () => {
    let sharedPage: Page
    let dynamicIds: DynamicSmokeIds = {}

    test.beforeAll(async ({ browser }) => {
      test.skip(!password, envHint)
      const context = await browser.newContext()
      sharedPage = await context.newPage()
      await loginWithCredentials(sharedPage, '/dashboard', email, password)
      dynamicIds = await discoverDynamicIds(sharedPage)
    })

    test.afterAll(async () => {
      await sharedPage?.context().close()
    })

    run({
      getPage: () => sharedPage,
      getIds: () => dynamicIds,
    })
  })
}

describePersona(
  'User persona (non-admin)',
  USER_EMAIL,
  USER_PASSWORD,
  'Set AUTH_TEST_USER_PASSWORD',
  ({ getPage, getIds }) => {
    for (const route of USER_DASHBOARD_ROUTES) {
      test(`#${route.id} user — ${route.label}`, async () => {
        await smokeAuthenticatedRoute(getPage(), route.path, route.urlPattern)
      })
    }

    for (const route of PUBLIC_ROUTES) {
      test(`#${route.id} user public — ${route.label}`, async () => {
        await smokeAuthenticatedRoute(getPage(), route.path, route.urlPattern)
      })
    }

    test('#12 user — admin area blocked (dashboard)', async () => {
      await expectAdminRouteBlocked(getPage(), '/admin')
    })

    for (const path of ADMIN_BLOCK_CHECK_ROUTES) {
      test(`#12 user — blocked from ${path}`, async () => {
        await expectAdminRouteBlocked(getPage(), path)
      })
    }

    test('#dynamic user — discovered IDs', async () => {
      const routes = dynamicUserRoutes(getIds())
      const fallbacks = emptyStateFallbackRoutes(getIds())
      if (routes.length === 0 && fallbacks.length === 0) {
        test.skip(true, 'No dynamic or fallback routes')
        return
      }
      for (const route of routes) {
        await test.step(`#${route.id} ${route.label}`, async () => {
          await smokeAuthenticatedRoute(getPage(), route.path, route.urlPattern)
        })
      }
      for (const route of fallbacks) {
        await test.step(`#${route.id} fallback ${route.label}`, async () => {
          await smokeAuthenticatedRoute(getPage(), route.path, route.urlPattern)
        })
      }
    })
  },
)

describePersona(
  'Admin persona (staff)',
  ADMIN_EMAIL,
  ADMIN_PASSWORD,
  'Set AUTH_TEST_ADMIN_PASSWORD',
  ({ getPage, getIds }) => {
    for (const route of ADMIN_ROUTES) {
      test(`#${route.id} admin — ${route.label}`, async () => {
        await smokeAuthenticatedRoute(getPage(), route.path, route.urlPattern)
      })
    }

    for (const route of USER_DASHBOARD_ROUTES) {
      test(`#${route.id} admin as user — ${route.label}`, async () => {
        await smokeAuthenticatedRoute(getPage(), route.path, route.urlPattern)
      })
    }

    for (const route of PUBLIC_ROUTES) {
      test(`#${route.id} admin public — ${route.label}`, async () => {
        await smokeAuthenticatedRoute(getPage(), route.path, route.urlPattern)
      })
    }

    test('#dynamic admin — discovered IDs', async () => {
      const userRoutes = dynamicUserRoutes(getIds())
      for (const route of userRoutes) {
        await test.step(`#${route.id} user ${route.label}`, async () => {
          await smokeAuthenticatedRoute(getPage(), route.path, route.urlPattern)
        })
      }
      const adminRoutes = dynamicAdminRoutes(getIds())
      for (const route of adminRoutes) {
        await test.step(`#${route.id} ${route.label}`, async () => {
          await smokeAuthenticatedRoute(getPage(), route.path, route.urlPattern)
        })
      }
      const fallbacks = emptyStateFallbackRoutes(getIds())
      for (const route of fallbacks) {
        await test.step(`#${route.id} fallback ${route.label}`, async () => {
          await smokeAuthenticatedRoute(getPage(), route.path, route.urlPattern)
        })
      }
    })
  },
)

test.describe('Public (unauthenticated) smoke', () => {
  test('core public pages load without login', async ({ page }) => {
    for (const route of PUBLIC_ROUTES.slice(0, 8)) {
      await smokePublicRoute(page, route.path)
    }
  })
})
