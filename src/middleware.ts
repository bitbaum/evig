import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { csrfMiddleware, generateCsrfToken, createCsrfCookie, getCsrfFromCookies } from '@/lib/auth/csrf'

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const method = request.method

  // CSRF Protection for state-changing requests
  // Apply to API routes that aren't webhooks, public, or auth (Auth.js has its own CSRF)
  if (pathname.startsWith('/api/') &&
      !pathname.startsWith('/api/webhooks/') &&
      !pathname.startsWith('/api/public/') &&
      !pathname.startsWith('/api/auth/') &&
      !pathname.startsWith('/api/health')) {
    const csrfResult = csrfMiddleware(request)
    if (csrfResult) {
      return csrfResult // CSRF validation failed
    }
  }

  // Protect admin routes - use Auth.js session
  if (pathname.startsWith('/admin')) {
    // Skip login page
    if (pathname === '/admin/login') {
      return NextResponse.next()
    }

    // Check for Auth.js session token
    const sessionToken = request.cookies.get('authjs.session-token')?.value
      || request.cookies.get('__Secure-authjs.session-token')?.value

    if (!sessionToken) {
      const loginUrl = new URL('/auth/login', request.url)
      loginUrl.searchParams.set('callbackUrl', pathname)
      return NextResponse.redirect(loginUrl)
    }
  }

  // Protect dashboard routes
  if (pathname.startsWith('/dashboard')) {
    // Check for Auth.js session token
    const sessionToken = request.cookies.get('authjs.session-token')?.value
      || request.cookies.get('__Secure-authjs.session-token')?.value

    if (!sessionToken) {
      const loginUrl = new URL('/auth/login', request.url)
      loginUrl.searchParams.set('callbackUrl', pathname)
      return NextResponse.redirect(loginUrl)
    }
  }

  // Set CSRF cookie on GET requests to establish token for forms
  const response = NextResponse.next()

  if (method === 'GET' && !getCsrfFromCookies(request.headers.get('cookie'))) {
    const token = generateCsrfToken()
    response.headers.set('Set-Cookie', createCsrfCookie(token))
  }

  return response
}

export const config = {
  matcher: ['/admin/:path*', '/dashboard/:path*', '/api/:path*'],
}
