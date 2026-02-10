/**
 * Centralized German Labels Configuration
 *
 * SSOT for all German status/action labels used across the app.
 * Import from here instead of hardcoding strings in components.
 */

export const STATUS_LABELS = {
  // General statuses
  ACTIVE: 'Aktiv',
  INACTIVE: 'Inaktiv',
  PENDING: 'Ausstehend',
  APPROVED: 'Genehmigt',
  REJECTED: 'Abgelehnt',
  DRAFT: 'Entwurf',
  PUBLISHED: 'Veröffentlicht',
  ARCHIVED: 'Archiviert',
  COMPLETED: 'Abgeschlossen',
  CANCELLED: 'Abgebrochen',

  // Content statuses
  PENDING_REVIEW: 'Überprüfung ausstehend',
  IN_REVIEW: 'In Überprüfung',
  CHANGES_REQUESTED: 'Änderungen angefordert',

  // Payment/Order statuses
  PAID: 'Bezahlt',
  UNPAID: 'Unbezahlt',
  REFUNDED: 'Erstattet',
  PARTIALLY_REFUNDED: 'Teilweise erstattet',

  // Workshop/Service statuses
  SCHEDULED: 'Geplant',
  ONGOING: 'Laufend',
  FULL: 'Ausgebucht',
  OPEN: 'Offen',
  CLOSED: 'Geschlossen',

  // IT-Hilfe statuses
  IN_DISCUSSION: 'In Besprechung',
  MATCHED: 'Zugewiesen',
  ACCEPTED: 'Akzeptiert',
  WITHDRAWN: 'Zurückgezogen',
} as const;

export type StatusLabel = typeof STATUS_LABELS[keyof typeof STATUS_LABELS];

export const ACTION_LABELS = {
  SAVE: 'Speichern',
  SAVE_FAILED: 'Speichern fehlgeschlagen',
  DELETE: 'Löschen',
  EDIT: 'Bearbeiten',
  CREATE: 'Erstellen',
  CANCEL: 'Abbrechen',
  CONFIRM: 'Bestätigen',
  SUBMIT: 'Absenden',
  APPROVE: 'Genehmigen',
  REJECT: 'Ablehnen',
  PUBLISH: 'Veröffentlichen',
  ARCHIVE: 'Archivieren',
  LOADING: 'Laden...',
  SAVING: 'Wird gespeichert...',
  DELETING: 'Wird gelöscht...',
  SEARCH: 'Suchen',
  FILTER: 'Filtern',
  RESET: 'Zurücksetzen',
  BACK: 'Zurück',
  NEXT: 'Weiter',
  CLOSE: 'Schliessen',
} as const;

export type ActionLabel = typeof ACTION_LABELS[keyof typeof ACTION_LABELS];

export const ERROR_LABELS = {
  GENERIC: 'Ein Fehler ist aufgetreten',
  LOAD_FAILED: 'Laden fehlgeschlagen',
  SAVE_FAILED: 'Speichern fehlgeschlagen',
  DELETE_FAILED: 'Löschen fehlgeschlagen',
  NOT_FOUND: 'Nicht gefunden',
  UNAUTHORIZED: 'Nicht autorisiert',
  FORBIDDEN: 'Zugriff verweigert',
  VALIDATION_FAILED: 'Validierung fehlgeschlagen',
  NETWORK_ERROR: 'Netzwerkfehler',
  TRY_AGAIN: 'Bitte versuchen Sie es erneut',
  SOMETHING_WENT_WRONG: 'Etwas ist schiefgelaufen',
} as const;

export type ErrorLabel = typeof ERROR_LABELS[keyof typeof ERROR_LABELS];

/**
 * Status badge color mapping
 * Maps status keys to Tailwind CSS classes
 */
export const STATUS_BADGE_COLORS: Record<string, string> = {
  ACTIVE: 'bg-green-100 text-green-800',
  INACTIVE: 'bg-gray-100 text-gray-800',
  PENDING: 'bg-yellow-100 text-yellow-800',
  APPROVED: 'bg-green-100 text-green-800',
  REJECTED: 'bg-red-100 text-red-800',
  DRAFT: 'bg-gray-100 text-gray-600',
  PUBLISHED: 'bg-blue-100 text-blue-800',
  COMPLETED: 'bg-green-100 text-green-800',
  CANCELLED: 'bg-red-100 text-red-800',
  SCHEDULED: 'bg-blue-100 text-blue-800',
  ONGOING: 'bg-purple-100 text-purple-800',
  OPEN: 'bg-green-100 text-green-800',
  CLOSED: 'bg-gray-100 text-gray-800',
};

/**
 * Get a status label by key, with fallback
 */
export function getStatusLabel(key: string): string {
  const upperKey = key.toUpperCase().replace(/-/g, '_');
  return (STATUS_LABELS as Record<string, string>)[upperKey] ?? key;
}

/**
 * Get badge color classes for a status
 */
export function getStatusBadgeColor(key: string): string {
  const upperKey = key.toUpperCase().replace(/-/g, '_');
  return STATUS_BADGE_COLORS[upperKey] ?? 'bg-gray-100 text-gray-800';
}
