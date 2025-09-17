import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { AuthToken } from '../models/User';

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';

if (!JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is required');
}

/**
 * Hash a password using bcrypt
 */
export async function hashPassword(password: string): Promise<string> {
  const saltRounds = 12;
  return bcrypt.hash(password, saltRounds);
}

/**
 * Compare a plain text password with a hashed password
 */
export async function comparePassword(password: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword);
}

/**
 * Generate a JWT token for a user
 */
export function generateToken(user: AuthToken): string {
  const secret = JWT_SECRET;
  const expiresIn = 24 * 60 * 60; // 24 hours in seconds

  const payload = {
    id: user.id,
    email: user.email,
    first_name: user.first_name,
    last_name: user.last_name,
    role: user.role,
  };
  const options = {
    expiresIn,
    algorithm: 'HS256' as const,
  };

  return jwt.sign(payload, secret, options);
}

/**
 * Verify and decode a JWT token
 */
export function verifyToken(token: string): AuthToken | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as AuthToken;
    return decoded;
  } catch (error) {
    console.error('Token verification failed:', error);
    return null;
  }
}

/**
 * Extract token from Authorization header
 */
export function extractTokenFromHeader(authHeader: string | undefined): string | null {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  return authHeader.substring(7); // Remove 'Bearer ' prefix
}

/**
 * Check if user has required role
 */
export function hasRole(userRole: string, requiredRole: string): boolean {
  const roleHierarchy = {
    viewer: 1,
    editor: 2,
    admin: 3,
  };

  return roleHierarchy[userRole as keyof typeof roleHierarchy] >=
         roleHierarchy[requiredRole as keyof typeof roleHierarchy];
}

/**
 * Middleware to authenticate requests
 */
export function authenticateToken(req: any, res: any, next: any): void {
  const token = extractTokenFromHeader(req.headers.authorization);

  if (!token) {
    res.status(401).json({
      success: false,
      error: 'Access token required',
    });
    return;
  }

  const user = verifyToken(token);
  if (!user) {
    res.status(401).json({
      success: false,
      error: 'Invalid or expired token',
    });
    return;
  }

  req.user = user;
  next();
}

/**
 * Middleware to authorize requests based on role
 */
export function authorizeRole(requiredRole: string) {
  return (req: any, res: any, next: any): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'Authentication required',
      });
      return;
    }

    if (!hasRole(req.user.role, requiredRole)) {
      res.status(403).json({
        success: false,
        error: 'Insufficient permissions',
      });
      return;
    }

    next();
  };
}
