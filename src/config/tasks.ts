/**
 * Task Management Configuration
 *
 * Single Source of Truth for task types, statuses, categories, and priorities
 * Following dev guide: docs/development/DEV_GUIDE.md
 *
 * Created: 2026-02-05
 */

// Task types
export const TASK_TYPES = {
  ONE_TIME: 'one_time',
  RECURRING_SCHEDULED: 'recurring_scheduled',
  RECURRING_AS_NEEDED: 'recurring_as_needed',
} as const;

export const TASK_TYPE_LABELS: Record<TaskType, string> = {
  one_time: 'Einmalig',
  recurring_scheduled: 'Wiederkehrend (geplant)',
  recurring_as_needed: 'Wiederkehrend (bei Bedarf)',
};

// Task statuses
export const TASK_STATUSES = {
  IDLE: 'idle',
  NEEDS_ATTENTION: 'needs_attention',
  REQUESTED: 'requested',
  IN_PROGRESS: 'in_progress',
} as const;

export const TASK_STATUS_LABELS: Record<TaskStatus, string> = {
  idle: 'Bereit',
  needs_attention: 'Braucht Aufmerksamkeit',
  requested: 'Angefragt',
  in_progress: 'In Bearbeitung',
};

// Task categories
export const TASK_CATEGORIES = {
  CLEANING: 'cleaning',
  MAINTENANCE: 'maintenance',
  ADMIN: 'admin',
  INVENTORY: 'inventory',
  IT: 'it',
  KITCHEN: 'kitchen',
  WORKSHOP: 'workshop',
  LOGISTICS: 'logistics',
  OTHER: 'other',
} as const;

export const TASK_CATEGORY_LABELS: Record<TaskCategory, string> = {
  cleaning: 'Reinigung',
  maintenance: 'Instandhaltung',
  admin: 'Verwaltung',
  inventory: 'Inventar',
  it: 'IT',
  kitchen: 'Küche',
  workshop: 'Werkstatt',
  logistics: 'Logistik',
  other: 'Sonstiges',
};

// Priorities
export const TASK_PRIORITIES = {
  LOW: 'low',
  NORMAL: 'normal',
  HIGH: 'high',
  URGENT: 'urgent',
} as const;

export const TASK_PRIORITY_LABELS: Record<TaskPriority, string> = {
  low: 'Niedrig',
  normal: 'Normal',
  high: 'Hoch',
  urgent: 'Dringend',
};

// Project statuses
export const PROJECT_STATUSES = {
  PLANNING: 'planning',
  ACTIVE: 'active',
  ON_HOLD: 'on_hold',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
} as const;

export const PROJECT_STATUS_LABELS: Record<ProjectStatus, string> = {
  planning: 'Planung',
  active: 'Aktiv',
  on_hold: 'Pausiert',
  completed: 'Abgeschlossen',
  cancelled: 'Abgebrochen',
};

// Request statuses
export const REQUEST_STATUSES = {
  PENDING: 'pending',
  ACCEPTED: 'accepted',
  DECLINED: 'declined',
  COMPLETED: 'completed',
} as const;

export const REQUEST_STATUS_LABELS: Record<RequestStatus, string> = {
  pending: 'Ausstehend',
  accepted: 'Angenommen',
  declined: 'Abgelehnt',
  completed: 'Erledigt',
};

// Types derived from constants
export type TaskType = (typeof TASK_TYPES)[keyof typeof TASK_TYPES];
export type TaskStatus = (typeof TASK_STATUSES)[keyof typeof TASK_STATUSES];
export type TaskCategory = (typeof TASK_CATEGORIES)[keyof typeof TASK_CATEGORIES];
export type TaskPriority = (typeof TASK_PRIORITIES)[keyof typeof TASK_PRIORITIES];
export type ProjectStatus = (typeof PROJECT_STATUSES)[keyof typeof PROJECT_STATUSES];
export type RequestStatus = (typeof REQUEST_STATUSES)[keyof typeof REQUEST_STATUSES];

// Color maps for UI badges (SSOT for status/priority colors)
export const TASK_STATUS_COLORS: Record<TaskStatus, string> = {
  idle: 'bg-green-100 text-green-800',
  needs_attention: 'bg-red-100 text-red-800',
  requested: 'bg-yellow-100 text-yellow-800',
  in_progress: 'bg-blue-100 text-blue-800',
};

export const TASK_PRIORITY_COLORS: Record<TaskPriority, string> = {
  low: 'bg-gray-100 text-gray-800',
  normal: 'bg-blue-100 text-blue-800',
  high: 'bg-orange-100 text-orange-800',
  urgent: 'bg-red-100 text-red-800',
};

/**
 * NOTE: Adding a new task type, category, status, or priority requires
 * a corresponding database migration to update CHECK constraints.
 * See: scripts/db/migrations/021_task_management.sql
 */
