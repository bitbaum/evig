/**
 * Shared Task API Helpers
 *
 * DRY: Extracted from duplicated code across task API routes.
 * - getDbUserId: Resolves Auth.js session email → database user ID
 * - getActiveTask: Verifies task exists and is not archived
 * - getErrorMessage: Extracts error message from unknown error
 *
 * Created: 2026-02-09
 */

import { NextResponse } from 'next/server';
import { ValidSession } from '@/lib/api/middleware';
import { apiBadRequest, apiNotFound } from '@/lib/api/helpers';
import { query } from '@/lib/auth/db';
import { TABLE_NAMES } from '@/config/database';

/**
 * Resolve the database user ID from the Auth.js session email.
 * Auth.js session ID may not match the database user ID.
 *
 * @returns The database user ID, or an error response
 */
export async function getDbUserId(
  session: ValidSession
): Promise<{ dbUserId: string } | { error: NextResponse }> {
  const userResult = await query<{ id: string }>(
    `SELECT id FROM ${TABLE_NAMES.USERS} WHERE email = $1`,
    [session.user.email]
  );

  if (userResult.rows.length === 0) {
    return { error: apiBadRequest('Benutzer nicht gefunden') };
  }

  return { dbUserId: userResult.rows[0].id };
}

/**
 * Verify a task exists and is not archived.
 *
 * @returns The active task row, or an error response
 */
export async function getActiveTask(
  taskId: string
): Promise<{ task: { id: string; title: string; created_by: string; is_archived: boolean } } | { error: NextResponse }> {
  const taskResult = await query<{ id: string; title: string; created_by: string; is_archived: boolean }>(
    `SELECT id, title, created_by, is_archived FROM ${TABLE_NAMES.TASKS} WHERE id = $1`,
    [taskId]
  );

  if (taskResult.rows.length === 0) {
    return { error: apiNotFound('Aufgabe') };
  }

  const task = taskResult.rows[0];

  if (task.is_archived) {
    return { error: apiBadRequest('Archivierte Aufgaben können nicht bearbeitet werden') };
  }

  return { task };
}

// Re-export client-safe utility for convenience in server code
export { getErrorMessage } from '@/lib/utils/error';
