import { test, expect, type Page } from '@playwright/test'
import { loginWithCredentials } from './helpers/auth'

test.setTimeout(60_000)

const USER_EMAIL = process.env.AUTH_TEST_USER_EMAIL || 'butaeff@gmail.com'
const USER_PASSWORD = process.env.AUTH_TEST_USER_PASSWORD || process.env.AUTH_TEST_PASSWORD || ''
const ADMIN_EMAIL = process.env.AUTH_TEST_ADMIN_EMAIL || 'georgy.butaev@revamp-it.ch'
const ADMIN_PASSWORD = process.env.AUTH_TEST_ADMIN_PASSWORD || process.env.TEST_ADMIN_PASSWORD || ''

async function expectNotLoginPage(page: Page) {
  await expect(page).not.toHaveURL(/\/auth\/login/)
}

function describeAuthenticatedFlows(
  title: string,
  email: string,
  password: string,
  envHint: string,
  runTests: (getPage: () => Page) => void,
) {
  test.describe(title, () => {
    let sharedPage: Page

    test.beforeAll(async ({ browser }) => {
      test.skip(!password, envHint)
      const context = await browser.newContext()
      sharedPage = await context.newPage()
      await loginWithCredentials(sharedPage, '/dashboard', email, password)
    })

    test.afterAll(async () => {
      await sharedPage?.context().close()
    })

    runTests(() => sharedPage)
  })
}

describeAuthenticatedFlows(
  'Non-admin user flows',
  USER_EMAIL,
  USER_PASSWORD,
  'Set AUTH_TEST_USER_PASSWORD or AUTH_TEST_PASSWORD',
  getPage => {
    test('dashboard loads', async () => {
      const page = getPage()
      await page.goto('/dashboard')
      await page.waitForLoadState('domcontentloaded')
      await expectNotLoginPage(page)
      await expect(page.locator('body')).toBeVisible()
    })

    test('appointments list loads', async () => {
      const page = getPage()
      await page.goto('/dashboard/appointments')
      await page.waitForLoadState('domcontentloaded')
      await expectNotLoginPage(page)
      expect(page.url()).toMatch(/appointments/)
    })

    test('messages page loads', async () => {
      const page = getPage()
      await page.goto('/dashboard/messages')
      await page.waitForLoadState('domcontentloaded')
      await expectNotLoginPage(page)
    })

    test('profile page loads', async () => {
      const page = getPage()
      await page.goto('/dashboard/profile')
      await page.waitForLoadState('domcontentloaded')
      await expectNotLoginPage(page)
    })

    test('technician profile editor loads', async () => {
      const page = getPage()
      await page.goto('/de/profil/techniker')
      await page.waitForLoadState('domcontentloaded')
      await expectNotLoginPage(page)
      expect(page.url()).toMatch(/techniker|profil/)
    })

    test('IT-Hilfe hub and browse load', async () => {
      const page = getPage()
      await page.goto('/de/it-hilfe')
      await page.waitForLoadState('domcontentloaded')
      await expect(page.locator('body')).toBeVisible()

      await page.goto('/de/it-hilfe/anfragen')
      await page.waitForLoadState('domcontentloaded')
      await expectNotLoginPage(page)
    })

    test('IT-Hilfe create form loads when authenticated', async () => {
      const page = getPage()
      await page.goto('/de/it-hilfe/create')
      await page.waitForLoadState('domcontentloaded')
      await expectNotLoginPage(page)
      expect(page.url()).toMatch(/create|anfragen|login/)
    })

    test('marketplace browse loads', async () => {
      const page = getPage()
      await page.goto('/de/marketplace')
      await page.waitForLoadState('domcontentloaded')
      await expect(page.locator('body')).toBeVisible()
    })

    test('admin area is blocked', async () => {
      const page = getPage()
      await page.goto('/admin')
      await page.waitForLoadState('domcontentloaded')
      const url = page.url()
      const blocked =
        url.includes('/auth/login') ||
        url.includes('/dashboard') ||
        url.includes('/403') ||
        url.includes('/unauthorized')
      expect(blocked || !url.includes('/admin')).toBeTruthy()
    })
  },
)

describeAuthenticatedFlows(
  'Admin user flows',
  ADMIN_EMAIL,
  ADMIN_PASSWORD,
  'Set AUTH_TEST_ADMIN_PASSWORD or TEST_ADMIN_PASSWORD',
  getPage => {
    test('admin dashboard loads', async () => {
      const page = getPage()
      await page.goto('/admin')
      await page.waitForLoadState('domcontentloaded')
      await expectNotLoginPage(page)
      expect(page.url()).toMatch(/\/admin/)
    })

    test('admin appointments queue loads', async () => {
      const page = getPage()
      await page.goto('/admin/appointments')
      await page.waitForLoadState('domcontentloaded')
      await expectNotLoginPage(page)
      expect(page.url()).toMatch(/\/admin\/appointments/)
    })

    test('admin IT-Hilfe loads', async () => {
      const page = getPage()
      await page.goto('/admin/it-hilfe')
      await page.waitForLoadState('domcontentloaded')
      await expectNotLoginPage(page)
      expect(page.url()).toMatch(/\/admin\/it-hilfe/)
    })

    test('admin zeiterfassung loads', async () => {
      const page = getPage()
      await page.goto('/admin/zeiterfassung')
      await page.waitForLoadState('domcontentloaded')
      await expectNotLoginPage(page)
      expect(page.url()).toMatch(/\/admin\/zeiterfassung/)
    })

    test('admin users list loads', async () => {
      const page = getPage()
      await page.goto('/admin/users')
      await page.waitForLoadState('domcontentloaded')
      await expectNotLoginPage(page)
      expect(page.url()).toMatch(/\/admin\/users/)
    })

    test('staff dashboard timecards loads', async () => {
      const page = getPage()
      await page.goto('/dashboard/timecards')
      await page.waitForLoadState('domcontentloaded')
      await expectNotLoginPage(page)
    })

    test('technician profile editor loads', async () => {
      const page = getPage()
      await page.goto('/de/profil/techniker')
      await page.waitForLoadState('domcontentloaded')
      await expectNotLoginPage(page)
    })
  },
)
