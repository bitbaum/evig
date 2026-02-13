/**
 * Edit History Utilities
 *
 * Functions for creating and managing edit snapshots when admins modify
 * workshop proposals or blog submissions before approval.
 *
 * Following Ground Truth #6: Correctness beats speed - full audit trail.
 */

import { logger } from '@/lib/logger';

/**
 * Edit history entry structure
 *
 * Stored as JSONB array in database edit_history column.
 */
export interface EditHistoryEntry {
  /** ISO 8601 timestamp */
  timestamp: string;
  /** UUID of the editor */
  editor_id: string;
  /** Display name of the editor */
  editor_name: string;
  /** List of fields that were changed */
  fields_changed: string[];
  /** Previous values of changed fields (before this edit) */
  snapshot: Record<string, any>;
}

/**
 * Creates an edit history snapshot before updating a record
 *
 * Captures the current values of fields that are about to be changed,
 * allowing full reconstruction of edit history.
 *
 * @param currentRecord - Current database record
 * @param updatedFields - Fields being updated with new values
 * @param editorId - UUID of user making the edit
 * @param editorName - Display name of editor
 * @returns Edit history entry to append to history array
 */
export function createEditSnapshot(
  currentRecord: Record<string, any>,
  updatedFields: Record<string, any>,
  editorId: string,
  editorName: string
): EditHistoryEntry {
  const snapshot: Record<string, any> = {};

  // Capture previous values only for fields that are actually changing
  for (const field of Object.keys(updatedFields)) {
    const currentValue = currentRecord[field];
    const newValue = updatedFields[field];

    // Compare values (handle arrays, nulls, etc.)
    if (!valuesAreEqual(currentValue, newValue)) {
      snapshot[field] = currentValue;
    }
  }

  const entry: EditHistoryEntry = {
    timestamp: new Date().toISOString(),
    editor_id: editorId,
    editor_name: editorName,
    fields_changed: Object.keys(snapshot),
    snapshot,
  };

  logger.info('Edit snapshot created', {
    editorId,
    fieldsChanged: entry.fields_changed.length,
  });

  return entry;
}

/**
 * Appends an edit entry to the history array
 *
 * Handles null/undefined existing history (new records).
 *
 * @param existingHistory - Current edit history (from database)
 * @param newEntry - New edit entry to append
 * @returns Updated history array
 */
export function appendEditHistory(
  existingHistory: EditHistoryEntry[] | null | undefined,
  newEntry: EditHistoryEntry
): EditHistoryEntry[] {
  const history = Array.isArray(existingHistory) ? existingHistory : [];
  return [...history, newEntry];
}

/**
 * Deep equality comparison for values
 *
 * Handles arrays, objects, null, undefined, primitives.
 */
function valuesAreEqual(a: any, b: any): boolean {
  // Exact same reference or both null/undefined
  if (a === b) return true;
  if (a == null || b == null) return false;

  // Arrays
  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false;
    return a.every((val, index) => valuesAreEqual(val, b[index]));
  }

  // Objects
  if (typeof a === 'object' && typeof b === 'object') {
    const keysA = Object.keys(a);
    const keysB = Object.keys(b);
    if (keysA.length !== keysB.length) return false;
    return keysA.every(key => valuesAreEqual(a[key], b[key]));
  }

  // Primitives (already checked === above)
  return false;
}

/**
 * Format edit history for display
 *
 * Returns human-readable summary of changes.
 */
export function formatEditHistory(
  history: EditHistoryEntry[],
  fieldLabels: Record<string, string>
): string[] {
  return history.map(entry => {
    const fields = entry.fields_changed
      .map(f => fieldLabels[f] || f)
      .join(', ');
    const date = new Date(entry.timestamp).toLocaleString('de-CH');
    return `${date} - ${entry.editor_name}: ${fields}`;
  });
}

/**
 * Get the most recent editor from history
 */
export function getLastEditor(
  history: EditHistoryEntry[] | null | undefined
): { name: string; timestamp: string } | null {
  if (!Array.isArray(history) || history.length === 0) {
    return null;
  }

  const lastEntry = history[history.length - 1];
  return {
    name: lastEntry.editor_name,
    timestamp: lastEntry.timestamp,
  };
}
