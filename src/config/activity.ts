/**
 * Activity Stream Configuration
 *
 * Single Source of Truth for activity types, help request statuses, urgency levels
 * Following dev guide: docs/development/DEV_GUIDE.md
 *
 * Created: 2026-02-05
 */

// Activity update types
export const ACTIVITY_UPDATE_TYPES = {
  ACCOMPLISHMENT: 'accomplishment',
  MILESTONE: 'milestone',
  NOTE: 'note',
  ANNOUNCEMENT: 'announcement',
} as const;

export const ACTIVITY_UPDATE_TYPE_LABELS: Record<ActivityUpdateType, string> = {
  accomplishment: 'Errungenschaft',
  milestone: 'Meilenstein',
  note: 'Notiz',
  announcement: 'Ankündigung',
};

export const ACTIVITY_UPDATE_TYPE_COLORS: Record<ActivityUpdateType, string> = {
  accomplishment: 'bg-primary-100 text-primary-800',
  milestone: 'bg-purple-100 text-purple-800',
  note: 'bg-neutral-100 text-neutral-800',
  announcement: 'bg-blue-100 text-blue-800',
};

export const ACTIVITY_UPDATE_TYPE_ICONS: Record<ActivityUpdateType, string> = {
  accomplishment: 'CheckCircle',
  milestone: 'Flag',
  note: 'FileText',
  announcement: 'Megaphone',
};

// Visibility levels
export const VISIBILITY_LEVELS = {
  TEAM: 'team',
  DEPARTMENT: 'department',
  PUBLIC: 'public',
} as const;

export const VISIBILITY_LABELS: Record<VisibilityLevel, string> = {
  team: 'Team',
  department: 'Abteilung',
  public: 'Öffentlich',
};

// Help request urgency
export const HELP_REQUEST_URGENCY = {
  LOW: 'low',
  NORMAL: 'normal',
  HIGH: 'high',
  URGENT: 'urgent',
} as const;

export const HELP_REQUEST_URGENCY_LABELS: Record<HelpRequestUrgency, string> = {
  low: 'Niedrig',
  normal: 'Normal',
  high: 'Hoch',
  urgent: 'Dringend',
};

export const HELP_REQUEST_URGENCY_COLORS: Record<HelpRequestUrgency, string> = {
  low: 'bg-neutral-100 text-neutral-800',
  normal: 'bg-blue-100 text-blue-800',
  high: 'bg-orange-100 text-orange-800',
  urgent: 'bg-red-100 text-red-800',
};

// Help request statuses
export const HELP_REQUEST_STATUSES = {
  OPEN: 'open',
  IN_PROGRESS: 'in_progress',
  RESOLVED: 'resolved',
  CANCELLED: 'cancelled',
} as const;

export const HELP_REQUEST_STATUS_LABELS: Record<HelpRequestStatus, string> = {
  open: 'Offen',
  in_progress: 'In Bearbeitung',
  resolved: 'Gelöst',
  cancelled: 'Abgebrochen',
};

export const HELP_REQUEST_STATUS_COLORS: Record<HelpRequestStatus, string> = {
  open: 'bg-yellow-100 text-yellow-800',
  in_progress: 'bg-blue-100 text-blue-800',
  resolved: 'bg-primary-100 text-primary-800',
  cancelled: 'bg-neutral-100 text-neutral-800',
};

// Activity stream source types (for unified feed)
export const ACTIVITY_SOURCE_TYPES = {
  TASK_COMPLETION: 'task_completion',
  ACTIVITY_UPDATE: 'activity_update',
  HELP_REQUEST: 'help_request',
  FOCUS_UPDATE: 'focus_update',
  PROTOCOL_FINALIZED: 'protocol_finalized',
} as const;

export const ACTIVITY_SOURCE_LABELS: Record<ActivitySourceType, string> = {
  task_completion: 'Aufgabe erledigt',
  activity_update: 'Aktivität',
  help_request: 'Hilfsanfrage',
  focus_update: 'Fokus aktualisiert',
  protocol_finalized: 'Protokoll abgeschlossen',
};

// Common categories for activity updates and help requests
export const ACTIVITY_CATEGORIES = {
  IT: 'it',
  WORKSHOP: 'workshop',
  ADMIN: 'admin',
  SALES: 'sales',
  MARKETING: 'marketing',
  LOGISTICS: 'logistics',
  FINANCE: 'finance',
  OTHER: 'other',
} as const;

export const ACTIVITY_CATEGORY_LABELS: Record<ActivityCategory, string> = {
  it: 'IT',
  workshop: 'Werkstatt',
  admin: 'Verwaltung',
  sales: 'Verkauf',
  marketing: 'Marketing',
  logistics: 'Logistik',
  finance: 'Finanzen',
  other: 'Sonstiges',
};

// Types derived from constants
export type ActivityUpdateType = (typeof ACTIVITY_UPDATE_TYPES)[keyof typeof ACTIVITY_UPDATE_TYPES];
export type VisibilityLevel = (typeof VISIBILITY_LEVELS)[keyof typeof VISIBILITY_LEVELS];
export type HelpRequestUrgency = (typeof HELP_REQUEST_URGENCY)[keyof typeof HELP_REQUEST_URGENCY];
export type HelpRequestStatus = (typeof HELP_REQUEST_STATUSES)[keyof typeof HELP_REQUEST_STATUSES];
export type ActivitySourceType = (typeof ACTIVITY_SOURCE_TYPES)[keyof typeof ACTIVITY_SOURCE_TYPES];
export type ActivityCategory = (typeof ACTIVITY_CATEGORIES)[keyof typeof ACTIVITY_CATEGORIES];

// Options arrays for forms (derived from constants)
export const ACTIVITY_UPDATE_TYPE_OPTIONS = Object.values(ACTIVITY_UPDATE_TYPES) as [string, ...string[]];
export const VISIBILITY_OPTIONS = Object.values(VISIBILITY_LEVELS) as [string, ...string[]];
export const HELP_REQUEST_URGENCY_OPTIONS = Object.values(HELP_REQUEST_URGENCY) as [string, ...string[]];
export const HELP_REQUEST_STATUS_OPTIONS = Object.values(HELP_REQUEST_STATUSES) as [string, ...string[]];
export const ACTIVITY_CATEGORY_OPTIONS = Object.values(ACTIVITY_CATEGORIES) as [string, ...string[]];

// Helper functions
export function getActivityUpdateTypeLabel(type: string | null): string {
  if (!type) return 'Unbekannt';
  return ACTIVITY_UPDATE_TYPE_LABELS[type as ActivityUpdateType] || type;
}

export function getActivityUpdateTypeColor(type: string | null): string {
  if (!type) return 'bg-neutral-100 text-neutral-800';
  return ACTIVITY_UPDATE_TYPE_COLORS[type as ActivityUpdateType] || 'bg-neutral-100 text-neutral-800';
}

export function getVisibilityLabel(visibility: string | null): string {
  if (!visibility) return 'Team';
  return VISIBILITY_LABELS[visibility as VisibilityLevel] || visibility;
}

export function getHelpRequestUrgencyLabel(urgency: string | null): string {
  if (!urgency) return 'Normal';
  return HELP_REQUEST_URGENCY_LABELS[urgency as HelpRequestUrgency] || urgency;
}

export function getHelpRequestUrgencyColor(urgency: string | null): string {
  if (!urgency) return 'bg-blue-100 text-blue-800';
  return HELP_REQUEST_URGENCY_COLORS[urgency as HelpRequestUrgency] || 'bg-blue-100 text-blue-800';
}

export function getHelpRequestStatusLabel(status: string | null): string {
  if (!status) return 'Offen';
  return HELP_REQUEST_STATUS_LABELS[status as HelpRequestStatus] || status;
}

export function getHelpRequestStatusColor(status: string | null): string {
  if (!status) return 'bg-yellow-100 text-yellow-800';
  return HELP_REQUEST_STATUS_COLORS[status as HelpRequestStatus] || 'bg-yellow-100 text-yellow-800';
}

export function getActivityCategoryLabel(category: string | null): string {
  if (!category) return 'Sonstiges';
  return ACTIVITY_CATEGORY_LABELS[category as ActivityCategory] || category;
}
