import type { Page } from '@playwright/test'

const DEFAULT_EMAIL = process.env.AUTH_TEST_EMAIL || 'admin@revampit.ch'
const DEFAULT_PASSWORD = process.env.AUTH_TEST_PASSWORD || 'Admin123!'

/** Non-admin persona — default prod E2E user (requester or techniker). */
export const USER_TEST_EMAIL = process.env.AUTH_TEST_USER_EMAIL || 'butaeff@gmail.com'
export const USER_TEST_PASSWORD =
  process.env.AUTH_TEST_USER_PASSWORD || process.env.AUTH_TEST_PASSWORD || ''

/** Staff persona — default prod E2E admin. */
export const ADMIN_TEST_EMAIL =
  process.env.AUTH_TEST_ADMIN_EMAIL || 'georgy.butaev@revamp-it.ch'
export const ADMIN_TEST_PASSWORD =
  process.env.AUTH_TEST_ADMIN_PASSWORD || process.env.TEST_ADMIN_PASSWORD || ''

/** Legacy second account for IT-Hilfe when dual-persona env vars are not set. */
export const TECHNICIAN_TEST_EMAIL = process.env.AUTH_TEST_TECHNICIAN_EMAIL || ''
export const TECHNICIAN_TEST_PASSWORD = process.env.AUTH_TEST_TECHNICIAN_PASSWORD || ''

export function hasDualPersonaCredentials(): boolean {
  return Boolean(
    USER_TEST_PASSWORD &&
      ADMIN_TEST_PASSWORD &&
      USER_TEST_EMAIL.toLowerCase() !== ADMIN_TEST_EMAIL.toLowerCase(),
  )
}

export function hasTechnicianTestCredentials(): boolean {
  if (hasDualPersonaCredentials()) return true
  return Boolean(
    TECHNICIAN_TEST_EMAIL &&
      TECHNICIAN_TEST_PASSWORD &&
      TECHNICIAN_TEST_EMAIL.toLowerCase() !== DEFAULT_EMAIL.toLowerCase(),
  )
}

/** Request owner in IT-Hilfe journey — admin when dual-persona is configured. */
export function getRequesterCredentials(): { email: string; password: string } {
  if (hasDualPersonaCredentials()) {
    return { email: ADMIN_TEST_EMAIL, password: ADMIN_TEST_PASSWORD }
  }
  return { email: DEFAULT_EMAIL, password: DEFAULT_PASSWORD }
}

/** Techniker in IT-Hilfe journey — non-admin user when dual-persona is configured. */
export function getTechnicianCredentials(): { email: string; password: string } {
  if (hasDualPersonaCredentials()) {
    return { email: USER_TEST_EMAIL, password: USER_TEST_PASSWORD }
  }
  return { email: TECHNICIAN_TEST_EMAIL, password: TECHNICIAN_TEST_PASSWORD }
}

/** Session file from `npx playwright codegen --save-storage=tests/e2e/.auth/user.json` */
export const SAVED_SESSION_PATH = 'tests/e2e/.auth/user.json'

const LOGIN_SUBMIT = /sign in|anmelden|se connecter|accedi|iniciar sesión/i

function stripLocalePrefix(pathname: string): string {
  return pathname.replace(/^\/[a-z]{2}(?=\/|$)/, '') || '/'
}

function pathMatchesCallback(pathname: string, search: string, callbackUrl: string): boolean {
  const parsed = callbackUrl.startsWith('http')
    ? new URL(callbackUrl)
    : null
  const targetPath = parsed ? parsed.pathname : callbackUrl.split('?')[0]
  const targetSearch = parsed ? parsed.search : callbackUrl.includes('?')
    ? callbackUrl.slice(callbackUrl.indexOf('?'))
    : ''

  if (pathname === targetPath || pathname.endsWith(targetPath)) {
    if (!targetSearch || search === targetSearch) return true
  }
  return stripLocalePrefix(pathname) === stripLocalePrefix(targetPath) &&
    (!targetSearch || search === targetSearch)
}

/** Log in via the credentials form (same flow as auth-smoke / timecards e2e). */
export async function loginWithCredentials(
  page: Page,
  callbackUrl: string,
  email = DEFAULT_EMAIL,
  password = DEFAULT_PASSWORD,
) {
  await page.context().clearCookies()
  const localePrefix = callbackUrl.match(/^\/([a-z]{2})\//)?.[1] || 'de'
  await page.goto(
    `/${localePrefix}/auth/login?callbackUrl=${encodeURIComponent(callbackUrl)}`,
  )
  await page.waitForLoadState('domcontentloaded')
  await page.locator('#email').fill(email)
  await page.locator('#password').fill(password)
  await page.getByRole('button', { name: LOGIN_SUBMIT }).click()
  await page.waitForURL(
    url => pathMatchesCallback(url.pathname, url.search, callbackUrl),
    { timeout: 60_000 },
  )
}

/**
 * Open a protected route; log in only when redirected to /auth/login.
 * Skips cookie clear so a saved storageState or prior context login is reused.
 */
export async function ensureAuthenticated(
  page: Page,
  callbackUrl: string,
  email = DEFAULT_EMAIL,
  password = DEFAULT_PASSWORD,
) {
  await page.goto(callbackUrl)
  await page.waitForLoadState('domcontentloaded')
  if (page.url().includes('/auth/login')) {
    await page.locator('#email').fill(email)
    await page.locator('#password').fill(password)
    await page.getByRole('button', { name: LOGIN_SUBMIT }).click()
    await page.waitForURL(
      url => pathMatchesCallback(url.pathname, url.search, callbackUrl),
      { timeout: 60_000 },
    )
  }
}
