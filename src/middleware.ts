import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import createIntlMiddleware from 'next-intl/middleware'
import { getToken } from 'next-auth/jwt'
import { routing } from '@/i18n/routing'
import { csrfMiddleware, generateCsrfToken, createCsrfCookie, getCsrfFromCookies } from '@/lib/auth/csrf'

// next-intl handles locale detection and URL rewriting for public pages
const intlMiddleware = createIntlMiddleware(routing)

// Routes that bypass intl routing and are handled directly
const BYPASS_INTL = ['/api/', '/admin', '/auth', '/dashboard', '/profil', '/vote', '/_next', '/_vercel']

function requiresAuth(pathname: string): boolean {
  return pathname.startsWith('/admin') || pathname.startsWith('/dashboard')
}

function isAuthBypassed(pathname: string): boolean {
  return pathname === '/admin/login' || pathname.startsWith('/auth')
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

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const method = request.method

  if (pathname.startsWith('/api/auth/')) {
    return NextResponse.next()
  }

  const requestHeaders = new Headers(request.headers)
  requestHeaders.set('x-current-path', pathname + request.nextUrl.search)

  // CSRF protection for state-changing API requests
  if (
    pathname.startsWith('/api/') &&
    !pathname.startsWith('/api/webhooks/') &&
    !pathname.startsWith('/api/public/') &&
    !pathname.startsWith('/api/auth/') &&
    !pathname.startsWith('/api/health')
  ) {
    const csrfResult = csrfMiddleware(request)
    if (csrfResult) return csrfResult
  }

  // Auth protection for admin/dashboard (CSRF already handled above for API)
  if (requiresAuth(pathname) && !isAuthBypassed(pathname)) {
    if (!(await hasValidSession(request))) {
      const loginUrl = new URL('/auth/login', request.url)
      loginUrl.searchParams.set('callbackUrl', pathname + request.nextUrl.search)
      return NextResponse.redirect(loginUrl)
    }
  }

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

  return response
}

export const config = {
  // Match all paths except static files and Next.js internals
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|apple-icon|icon|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|woff|woff2)).*)',
  ],
}
