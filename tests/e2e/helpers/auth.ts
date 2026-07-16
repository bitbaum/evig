import type { Page } from '@playwright/test'
import { dismissCookieBanner } from './ui'

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

/**
 * Second staff persona — needed by the intake journey since the
 * Vier-Augen-Prinzip forbids the sole worker from signing off final QA.
 * Seeded locally by scripts/e2e-seed.ts.
 */
export const SECOND_ADMIN_TEST_EMAIL =
  process.env.AUTH_TEST_SECOND_ADMIN_EMAIL || 'e2e-admin2@revampit.test'
export const SECOND_ADMIN_TEST_PASSWORD = process.env.AUTH_TEST_SECOND_ADMIN_PASSWORD || ''

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

/** Log in via Auth.js credentials API (reliable; shares cookies with page context). */
export async function loginWithCredentials(
  page: Page,
  callbackUrl: string,
  email = DEFAULT_EMAIL,
  password = DEFAULT_PASSWORD,
) {
  await page.context().clearCookies()

  const baseURL =
    process.env.PLAYWRIGHT_BASE_URL ||
    (page.url().startsWith('http') ? new URL(page.url()).origin : 'http://localhost:3001')

  const csrfRes = await page.request.get('/api/auth/csrf')
  if (!csrfRes.ok()) {
    throw new Error(`CSRF fetch failed: ${csrfRes.status()}`)
  }
  const { csrfToken } = (await csrfRes.json()) as { csrfToken: string }

  const loginRes = await page.request.post('/api/auth/callback/credentials', {
    form: {
      csrfToken,
      email,
      password,
      callbackUrl: callbackUrl.startsWith('http') ? callbackUrl : `${baseURL}${callbackUrl}`,
      json: 'true',
    },
  })

  if (![200, 302].includes(loginRes.status())) {
    throw new Error(`Login failed for ${email}: ${loginRes.status()}`)
  }

  let sessionEmail: string | undefined
  for (let attempt = 0; attempt < 5; attempt++) {
    const sessionRes = await page.request.get('/api/auth/session')
    const session = await sessionRes.json()
    sessionEmail = session?.user?.email
    if (sessionEmail?.toLowerCase() === email.toLowerCase()) break
    await new Promise(resolve => setTimeout(resolve, 400))
  }
  if (sessionEmail?.toLowerCase() !== email.toLowerCase()) {
    throw new Error(`Login succeeded but session email mismatch for ${email}`)
  }

  await page.goto(callbackUrl)
  await page.waitForURL(
    url => pathMatchesCallback(url.pathname, url.search, callbackUrl),
    { timeout: 60_000 },
  )
  try {
    await dismissCookieBanner(page)
  } catch {
    /* navigation can interrupt evaluate — non-fatal for API-driven flows */
  }
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
