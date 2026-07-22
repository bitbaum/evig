import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import createIntlMiddleware from 'next-intl/middleware'
import { getToken } from 'next-auth/jwt'
import { routing, locales } from '@/i18n/routing'
import { csrfMiddleware, generateCsrfToken, createCsrfCookie, getCsrfFromCookies } from '@/lib/auth/csrf'

// next-intl handles locale detection and URL rewriting for public pages
const intlMiddleware = createIntlMiddleware(routing)

// Routes that bypass intl routing and are handled directly
const BYPASS_INTL = ['/api/', '/admin', '/auth', '/dashboard', '/profil', '/vote', '/d/', '/r/', '/einladung', '/_next']

// Non-default locales appear as a URL prefix (e.g. /fr/dashboard). Strip
// it before running protected-route checks — otherwise `/fr/dashboard` would
// not match `requiresAuth("/dashboard")` and a logged-out non-German user
// would reach the dashboard shell before any page-level auth ran.
const LOCALE_PREFIX_REGEX = new RegExp(`^/(${locales.join('|')})(?=/|$)`)

function stripLocalePrefix(pathname: string): string {
  return pathname.replace(LOCALE_PREFIX_REGEX, '') || '/'
}

function requiresAuth(pathname: string): boolean {
  const p = stripLocalePrefix(pathname)
  return p.startsWith('/admin') || p.startsWith('/dashboard')
}

function isAuthBypassed(pathname: string): boolean {
  const p = stripLocalePrefix(pathname)
  return p === '/admin/login' || p.startsWith('/auth')
}

function shouldIssueCsrfCookie(pathname: string, method: string): boolean {
  return method === 'GET' && !pathname.startsWith('/api/auth/')
}

async function hasValidSession(request: NextRequest): Promise<boolean> {
  const secret = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET
  if (!secret) return false

  const token =
    await getToken({ req: request, secret, secureCookie: false }) ||
    await getToken({ req: request, secret, secureCookie: true })

  return Boolean(token)
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  const method = request.method

  if (pathname.startsWith('/api/auth/')) {
    return NextResponse.next()
  }

  const requestHeaders = new Headers(request.headers)
  requestHeaders.set('x-current-path', pathname + request.nextUrl.search)

  // CSRF protection for state-changing API requests. Exempt endpoints that
  // authenticate with a Bearer token rather than the session cookie — CSRF is a
  // cookie/session attack vector, so token-authed routes (webhooks, the
  // Bearer-CRON_SECRET migration endpoint) don't need it and can't supply the
  // double-submit token when driven server-side without a browser.
  if (
    pathname.startsWith('/api/') &&
    !pathname.startsWith('/api/webhooks/') &&
    !pathname.startsWith('/api/public/') &&
    !pathname.startsWith('/api/auth/') &&
    !pathname.startsWith('/api/admin/migrate/') &&
    !pathname.startsWith('/api/health')
  ) {
    const csrfResult = csrfMiddleware(request)
    if (csrfResult) return csrfResult
  }

  // Non-localized (BYPASS_INTL) routes must never carry a locale prefix.
  // A locale-aware <Link href="/admin"> on e.g. an /ru page renders /ru/admin,
  // which matches no route under [locale] and 404s for logged-in users (the
  // auth check passes because it strips the prefix, but intl routing then has
  // no /ru/admin page). Redirect to the canonical unprefixed path, preserving
  // the user's locale via NEXT_LOCALE so the bypassed shell still renders in it.
  const bypassPrefixMatch = pathname.match(LOCALE_PREFIX_REGEX)
  if (bypassPrefixMatch) {
    const stripped = stripLocalePrefix(pathname)
    if (BYPASS_INTL.some(prefix => stripped.startsWith(prefix))) {
      const target = new URL(stripped + request.nextUrl.search, request.url)
      const redirect = NextResponse.redirect(target)
      redirect.cookies.set('NEXT_LOCALE', bypassPrefixMatch[1], {
        path: '/',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 365,
      })
      return redirect
    }
  }

  // Auth protection for admin/dashboard (CSRF already handled above for API)
  if (requiresAuth(pathname) && !isAuthBypassed(pathname)) {
    if (!(await hasValidSession(request))) {
      const loginUrl = new URL('/auth/login', request.url)
      loginUrl.searchParams.set('callbackUrl', pathname + request.nextUrl.search)
      const redirectResponse = NextResponse.redirect(loginUrl)
      // Preserve the user's locale across the redirect into the
      // non-locale-prefixed /auth shell. Without this, a user on
      // /en/admin lands on a German login page (BYPASS_INTL means
      // /auth routes never see requestLocale, so request.ts falls
      // back to defaultLocale unless NEXT_LOCALE tells it otherwise).
      const localeMatch = pathname.match(LOCALE_PREFIX_REGEX)
      if (localeMatch) {
        redirectResponse.cookies.set('NEXT_LOCALE', localeMatch[1], {
          path: '/',
          sameSite: 'lax',
          maxAge: 60 * 60 * 24 * 365,
        })
      }
      return redirectResponse
    }
  }

  // For every locale-prefixed request, write the NEXT_LOCALE cookie so
  // any subsequent BYPASS_INTL navigation (e.g. /auth/register from an
  // /en/* page) renders in the right language. No-op if the cookie is
  // already correct.
  const visitedLocaleMatch = pathname.match(LOCALE_PREFIX_REGEX)
  const writeLocaleCookie =
    visitedLocaleMatch &&
    visitedLocaleMatch[1] !== request.cookies.get('NEXT_LOCALE')?.value

  // Skip intl routing for non-public paths
  const skipIntl = BYPASS_INTL.some(prefix => pathname.startsWith(prefix))
  if (skipIntl) {
    const response = NextResponse.next({ request: { headers: requestHeaders } })
    if (shouldIssueCsrfCookie(pathname, method) && !getCsrfFromCookies(request.headers.get('cookie'))) {
      const token = generateCsrfToken()
      response.headers.set('Set-Cookie', createCsrfCookie(token))
    }
    return response
  }

  // Apply next-intl locale routing for public pages
  const response = intlMiddleware(request)

  // Attach CSRF cookie on GET requests
  if (shouldIssueCsrfCookie(pathname, method) && !getCsrfFromCookies(request.headers.get('cookie'))) {
    const token = generateCsrfToken()
    response.headers.set('Set-Cookie', createCsrfCookie(token))
  }

  // Persist the URL-derived locale so BYPASS_INTL routes can recover it.
  if (writeLocaleCookie && visitedLocaleMatch) {
    response.cookies.set('NEXT_LOCALE', visitedLocaleMatch[1], {
      path: '/',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 365,
    })
  }

  return response
}

export const config = {
  // Match all paths except static files and Next.js internals.
  // Add new extensions here when /public/ starts serving them — without
  // this, middleware intercepts the request and the file 404s through
  // the next-intl router (it tries to route the extension as a page).
  matcher: [
    // `presentations` is excluded so the pretty URL /presentations/<slug>
    // reaches the next.config rewrite (→ index.html) instead of being
    // routed — and 404'd — by the next-intl router. This is why shared
    // presentation links had silently broken.
    '/((?!_next/static|_next/image|presentations|saldo|favicon.ico|apple-icon|icon|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|woff|woff2|mp4|webm|mp3|m4a|m4v|pdf|txt|xml|json|webmanifest|html|md|map)).*)',
  ],
}
