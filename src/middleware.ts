import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import createIntlMiddleware from 'next-intl/middleware'
import { routing } from '@/i18n/routing'
import { csrfMiddleware, generateCsrfToken, createCsrfCookie, getCsrfFromCookies } from '@/lib/auth/csrf'

// next-intl handles locale detection and URL rewriting for public pages
const intlMiddleware = createIntlMiddleware(routing)

// Routes that bypass intl routing and are handled directly
const BYPASS_INTL = ['/api/', '/admin', '/auth', '/dashboard', '/profil', '/_next', '/_vercel']

function requiresAuth(pathname: string): boolean {
  return pathname.startsWith('/admin') || pathname.startsWith('/dashboard')
}

function isAuthBypassed(pathname: string): boolean {
  return pathname === '/admin/login' || pathname.startsWith('/auth')
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const method = request.method

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
    const sessionToken =
      request.cookies.get('authjs.session-token')?.value ||
      request.cookies.get('__Secure-authjs.session-token')?.value

    if (!sessionToken) {
      const loginUrl = new URL('/auth/login', request.url)
      loginUrl.searchParams.set('callbackUrl', pathname + request.nextUrl.search)
      return NextResponse.redirect(loginUrl)
    }
  }

  // Skip intl routing for non-public paths
  const skipIntl = BYPASS_INTL.some(prefix => pathname.startsWith(prefix))
  if (skipIntl) {
    const response = NextResponse.next()
    if (method === 'GET' && !getCsrfFromCookies(request.headers.get('cookie'))) {
      const token = generateCsrfToken()
      response.headers.set('Set-Cookie', createCsrfCookie(token))
    }
    return response
  }

  // Apply next-intl locale routing for public pages
  const response = intlMiddleware(request)

  // Attach CSRF cookie on GET requests
  if (method === 'GET' && !getCsrfFromCookies(request.headers.get('cookie'))) {
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
