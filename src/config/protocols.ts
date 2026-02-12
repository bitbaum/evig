/**
 * Meeting Protocols Configuration
 *
 * Single Source of Truth for meeting types, statuses, visibility, and templates.
 * Following dev guide: docs/development/DEV_GUIDE.md
 *
 * Created: 2026-02-10
 */

// Meeting types
export const MEETING_TYPES = {
  TEAM_WEEKLY: 'team_weekly',
  PROJECT_REVIEW: 'project_review',
  RETRO: 'retro',
  BOARD: 'board',
  AD_HOC: 'ad_hoc',
} as const;

export const MEETING_TYPE_LABELS: Record<MeetingType, string> = {
  team_weekly: 'Teamsitzung',
  project_review: 'Projektsitzung',
  retro: 'Retrospektive',
  board: 'Vorstandssitzung',
  ad_hoc: 'Ad-hoc Besprechung',
};

export const MEETING_TYPE_COLORS: Record<MeetingType, string> = {
  team_weekly: 'bg-blue-100 text-blue-800',
  project_review: 'bg-purple-100 text-purple-800',
  retro: 'bg-green-100 text-green-800',
  board: 'bg-orange-100 text-orange-800',
  ad_hoc: 'bg-gray-100 text-gray-800',
};

export const MEETING_TYPE_ICONS: Record<MeetingType, string> = {
  team_weekly: 'Users',
  project_review: 'FolderKanban',
  retro: 'RefreshCw',
  board: 'Landmark',
  ad_hoc: 'MessageSquare',
};

// Templates with defaults per meeting type
export const MEETING_TYPE_TEMPLATES: Record<MeetingType, {
  default_attendees: string[]
  agenda_hints: string[]
  typical_duration: string
  default_visibility: ProtocolVisibility
}> = {
  team_weekly: {
    default_attendees: [],
    agenda_hints: ['Rückblick letzte Woche', 'Aktuelle Projekte', 'Hindernisse', 'Nächste Schritte'],
    typical_duration: '60 min',
    default_visibility: 'team',
  },
  project_review: {
    default_attendees: [],
    agenda_hints: ['Projektstatus', 'Meilensteine', 'Risiken', 'Nächste Schritte'],
    typical_duration: '45 min',
    default_visibility: 'team',
  },
  retro: {
    default_attendees: [],
    agenda_hints: ['Was lief gut', 'Was können wir verbessern', 'Massnahmen'],
    typical_duration: '60 min',
    default_visibility: 'team',
  },
  board: {
    default_attendees: [],
    agenda_hints: ['Finanzbericht', 'Strategische Entscheidungen', 'Anträge', 'Verschiedenes'],
    typical_duration: '90 min',
    default_visibility: 'attendees',
  },
  ad_hoc: {
    default_attendees: [],
    agenda_hints: [],
    typical_duration: '30 min',
    default_visibility: 'team',
  },
};

// Protocol statuses
export const PROTOCOL_STATUSES = {
  DRAFT: 'draft',
  PROCESSING: 'processing',
  REVIEW: 'review',
  FINALIZED: 'finalized',
} as const;

export const PROTOCOL_STATUS_LABELS: Record<ProtocolStatus, string> = {
  draft: 'Entwurf',
  processing: 'Wird verarbeitet',
  review: 'Zur Überprüfung',
  finalized: 'Abgeschlossen',
};

export const PROTOCOL_STATUS_COLORS: Record<ProtocolStatus, string> = {
  draft: 'bg-gray-100 text-gray-800',
  processing: 'bg-yellow-100 text-yellow-800',
  review: 'bg-blue-100 text-blue-800',
  finalized: 'bg-green-100 text-green-800',
};

// Visibility options
export const PROTOCOL_VISIBILITY = {
  TEAM: 'team',
  ATTENDEES: 'attendees',
} as const;

export const PROTOCOL_VISIBILITY_LABELS: Record<ProtocolVisibility, string> = {
  team: 'Ganzes Team',
  attendees: 'Nur Teilnehmer',
};

// Action item types
export const ACTION_ITEM_TYPES = {
  TASK: 'task',
  DECISION: 'decision',
  INFO: 'info',
} as const;

export const ACTION_ITEM_TYPE_LABELS: Record<ActionItemType, string> = {
  task: 'Aufgabe',
  decision: 'Entscheidung',
  info: 'Information',
};

export const ACTION_ITEM_TYPE_COLORS: Record<ActionItemType, string> = {
  task: 'bg-blue-100 text-blue-800',
  decision: 'bg-purple-100 text-purple-800',
  info: 'bg-gray-100 text-gray-800',
};

export const ACTION_ITEM_BORDER_COLORS: Record<ActionItemType, string> = {
  task: 'border-l-4 border-l-blue-400',
  decision: 'border-l-4 border-l-purple-400',
  info: 'border-l-4 border-l-gray-300',
};

export const FOLLOW_UP_STATUS_COLORS: Record<string, string> = {
  erledigt: 'bg-green-100 text-green-800',
  'in Arbeit': 'bg-blue-100 text-blue-800',
  offen: 'bg-yellow-100 text-yellow-800',
};

export function getFollowUpStatusColor(status: string | null | undefined): string {
  if (!status) return FOLLOW_UP_STATUS_COLORS['offen'];
  return FOLLOW_UP_STATUS_COLORS[status] || FOLLOW_UP_STATUS_COLORS['offen'];
}

// Input methods (pipeline entry points)
export const INPUT_METHODS = {
  AUDIO: 'audio',
  TRANSCRIPT: 'transcript',
  NOTES: 'notes',
  TASKS: 'tasks',
} as const;

export const INPUT_METHOD_LABELS: Record<InputMethod, string> = {
  audio: 'Audio-Aufnahme',
  transcript: 'Transkript',
  notes: 'Strukturierte Notizen',
  tasks: 'Aufgabenliste',
};

export const INPUT_METHOD_DESCRIPTIONS: Record<InputMethod, string> = {
  audio: 'Demnächst verfügbar',
  transcript: 'Rohtext einfügen oder .txt hochladen',
  notes: 'JSON oder Freitext hochladen',
  tasks: 'Aufgaben direkt importieren',
};

export const INPUT_METHOD_ICONS: Record<InputMethod, string> = {
  audio: 'Mic',
  transcript: 'FileText',
  notes: 'ListTree',
  tasks: 'ListChecks',
};

// Priority hints
export const PRIORITY_HINT_LABELS: Record<string, string> = {
  low: 'Niedrig',
  normal: 'Normal',
  high: 'Hoch',
};

// Decision voting
export const DECISION_VOTE_TYPES = {
  UP: 'up',
  DOWN: 'down',
} as const;

export const DECISION_RESULTS = {
  APPROVED: 'approved',
  REJECTED: 'rejected',
  PENDING: 'pending',
} as const;

export const DECISION_RESULT_LABELS: Record<DecisionResult, string> = {
  approved: 'Angenommen',
  rejected: 'Abgelehnt',
  pending: 'Offen',
};

export const DECISION_RESULT_COLORS: Record<DecisionResult, string> = {
  approved: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
  pending: 'bg-yellow-100 text-yellow-800',
};

// Types derived from constants
export type MeetingType = (typeof MEETING_TYPES)[keyof typeof MEETING_TYPES];
export type ProtocolStatus = (typeof PROTOCOL_STATUSES)[keyof typeof PROTOCOL_STATUSES];
export type ProtocolVisibility = (typeof PROTOCOL_VISIBILITY)[keyof typeof PROTOCOL_VISIBILITY];
export type ActionItemType = (typeof ACTION_ITEM_TYPES)[keyof typeof ACTION_ITEM_TYPES];
export type InputMethod = (typeof INPUT_METHODS)[keyof typeof INPUT_METHODS];
export type DecisionVoteType = (typeof DECISION_VOTE_TYPES)[keyof typeof DECISION_VOTE_TYPES];
export type DecisionResult = (typeof DECISION_RESULTS)[keyof typeof DECISION_RESULTS];

// Options arrays for forms (derived from constants)
export const MEETING_TYPE_OPTIONS = Object.values(MEETING_TYPES) as [string, ...string[]];
export const PROTOCOL_STATUS_OPTIONS = Object.values(PROTOCOL_STATUSES) as [string, ...string[]];
export const PROTOCOL_VISIBILITY_OPTIONS = Object.values(PROTOCOL_VISIBILITY) as [string, ...string[]];
export const INPUT_METHOD_OPTIONS = Object.values(INPUT_METHODS) as [string, ...string[]];

