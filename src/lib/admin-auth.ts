import { serialize, parse } from 'cookie'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production'
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123'

export interface AdminUser {
  id: string
  email: string
  role: 'admin'
  loginTime: number
}

export function verifyAdminPassword(password: string): boolean {
  return password === ADMIN_PASSWORD
}

export function createAdminToken(email: string = 'admin@revampit.ch'): string {
  const payload: AdminUser = {
    id: 'admin-1',
    email,
    role: 'admin',
    loginTime: Date.now()
  }
  
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' })
}

export function verifyAdminToken(token: string): AdminUser | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as AdminUser
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

// Middleware function for API routes
export function requireAdminAuth(handler: Function) {
  return async (req: any, res: any) => {
    const token = getTokenFromCookies(req.headers.cookie)
    
    if (!token) {
      return res.status(401).json({ error: 'No authentication token' })
    }

    const adminUser = verifyAdminToken(token)
    
    if (!adminUser) {
      return res.status(401).json({ error: 'Invalid authentication token' })
    }

    // Add admin user to request
    req.adminUser = adminUser
    
    return handler(req, res)
  }
}