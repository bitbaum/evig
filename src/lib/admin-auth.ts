import { serialize, parse } from 'cookie'
import jwt from 'jsonwebtoken'
import { NextRequest, NextResponse } from 'next/server'

// Lazy getters for environment variables to avoid build-time errors
export function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET
  if (!secret) {
    throw new Error('JWT_SECRET environment variable is required')
  }
  return secret
}

export function getAdminPassword(): string {
  const password = process.env.ADMIN_PASSWORD
  if (!password) {
    throw new Error('ADMIN_PASSWORD environment variable is required')
  }
  return password
}

export interface AdminUser {
  id: string
  email: string
  role: 'admin'
  loginTime: number
}

export function verifyAdminPassword(password: string): boolean {
  return password === getAdminPassword()
}

export function createAdminToken(email: string = 'admin@revampit.ch'): string {
  const payload: AdminUser = {
    id: 'admin-1',
    email,
    role: 'admin',
    loginTime: Date.now()
  }

  return jwt.sign(payload, getJwtSecret(), { expiresIn: '7d' })
}

export function verifyAdminToken(token: string): AdminUser | null {
  try {
    const decoded = jwt.verify(token, getJwtSecret()) as AdminUser
    return decoded
  } catch (error) {
    return null
  }
}

export function createAuthCookie(token: string): string {
  return serialize('admin-token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: '/admin'
  })
}

export function getTokenFromCookies(cookieHeader?: string): string | null {
  if (!cookieHeader) return null
  
  const cookies = parse(cookieHeader)
  return cookies['admin-token'] || null
}

export function clearAuthCookie(): string {
  return serialize('admin-token', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 0,
    path: '/admin'
  })
}

// Extended NextRequest interface
export interface AuthenticatedNextRequest extends NextRequest {
  adminUser: AdminUser
}

// Middleware function for App Router API routes
export function requireAdminAuth(handler: (request: AuthenticatedNextRequest) => Promise<NextResponse>) {
  return async (request: NextRequest) => {
    const token = getTokenFromCookies(request.headers.get('cookie') || undefined)

    if (!token) {
      return NextResponse.json({ error: 'No authentication token' }, { status: 401 })
    }

    const adminUser = verifyAdminToken(token)

    if (!adminUser) {
      return NextResponse.json({ error: 'Invalid authentication token' }, { status: 401 })
    }

    // Add admin user to request
    const authenticatedRequest = request as AuthenticatedNextRequest
    authenticatedRequest.adminUser = adminUser

    return handler(authenticatedRequest)
  }
}