import crypto from 'crypto';
import { executeQuery, executeQuerySingle } from './database';

export interface SessionData {
  id: string;
  user_id: string;
  session_token: string;
  expires_at: Date;
  created_at: Date;
}

/**
 * Generate a secure session token
 */
export function generateSessionToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Create a new session for a user
 */
export async function createSession(userId: string): Promise<SessionData> {
  const sessionToken = generateSessionToken();
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

  const session = await executeQuerySingle<SessionData>(
    `INSERT INTO user_sessions (user_id, session_token, expires_at)
     VALUES ($1, $2, $3)
     RETURNING id, user_id, session_token, expires_at, created_at`,
    [userId, sessionToken, expiresAt]
  );

  if (!session) {
    throw new Error('Failed to create session');
  }

  return session;
}

/**
 * Validate and get session by token
 */
export async function validateSession(sessionToken: string): Promise<SessionData | null> {
  const session = await executeQuerySingle<SessionData>(
    'SELECT * FROM user_sessions WHERE session_token = $1 AND expires_at > CURRENT_TIMESTAMP',
    [sessionToken]
  );

  return session;
}

/**
 * Extend session expiry
 */
export async function extendSession(sessionId: string): Promise<void> {
  const newExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days from now

  await executeQuery(
    'UPDATE user_sessions SET expires_at = $1 WHERE id = $2',
    [newExpiry, sessionId]
  );
}

/**
 * Delete a specific session
 */
export async function deleteSession(sessionId: string): Promise<void> {
  await executeQuery('DELETE FROM user_sessions WHERE id = $1', [sessionId]);
}

/**
 * Delete all sessions for a user (logout from all devices)
 */
export async function deleteAllUserSessions(userId: string): Promise<void> {
  await executeQuery('DELETE FROM user_sessions WHERE user_id = $1', [userId]);
}

/**
 * Clean up expired sessions (should be run periodically)
 */
export async function cleanupExpiredSessions(): Promise<number> {
  const result = await executeQuery(
    'DELETE FROM user_sessions WHERE expires_at < CURRENT_TIMESTAMP'
  );

  return result.length;
}

/**
 * Get all active sessions for a user
 */
export async function getUserSessions(userId: string): Promise<SessionData[]> {
  return executeQuery<SessionData>(
    'SELECT * FROM user_sessions WHERE user_id = $1 AND expires_at > CURRENT_TIMESTAMP ORDER BY created_at DESC',
    [userId]
  );
}
