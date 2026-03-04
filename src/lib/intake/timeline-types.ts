/**
 * Intake Timeline Types & Display Constants
 *
 * Client-safe module — no database imports.
 * Used by IntakeClient.tsx for rendering timeline events.
 */

// =============================================================================
// TYPES
// =============================================================================

export type IntakeEventType =
  | 'created'
  | 'checklist_toggled'
  | 'tier_changed'
  | 'field_updated'
  | 'published'
  | 'note_added'

export interface IntakeEvent {
  type: IntakeEventType
  description: string
  userId: string
  userEmail: string
  timestamp?: string
  metadata?: Record<string, unknown>
}

export interface StoredIntakeEvent extends IntakeEvent {
  timestamp: string
}

// =============================================================================
// DISPLAY LABELS (Swiss German)
// =============================================================================

export const EVENT_TYPE_LABELS: Record<IntakeEventType, string> = {
  created: 'Erstellt',
  checklist_toggled: 'Checkliste',
  tier_changed: 'Stufe geändert',
  field_updated: 'Aktualisiert',
  published: 'Publiziert',
  note_added: 'Notiz',
}

export const EVENT_TYPE_ICONS: Record<IntakeEventType, string> = {
  created: '📦',
  checklist_toggled: '☑️',
  tier_changed: '🔄',
  field_updated: '✏️',
  published: '🚀',
  note_added: '📝',
}
