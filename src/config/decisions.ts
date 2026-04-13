// ─── Decisions & Voting Config (SSOT) ─────────────────────────────────────
// All constants, labels, colors, and defaults for the decisions system.
// German (Swiss: ss not ß, proper umlauts).

// ─── Statuses ─────────────────────────────────────────────────────────────

export const DECISION_STATUS = {
  DRAFT: 'draft',
  DISCUSSION: 'discussion',
  VOTING: 'voting',
  CLOSED: 'closed',
  CANCELLED: 'cancelled',
} as const;

export const DECISION_STATUSES = Object.values(DECISION_STATUS);

export type DecisionStatus = typeof DECISION_STATUS[keyof typeof DECISION_STATUS];

export const DECISION_STATUS_CONFIG: Record<
  DecisionStatus,
  { label: string; color: string }
> = {
  draft: { label: 'Entwurf', color: 'bg-gray-100 text-gray-700' },
  discussion: { label: 'Diskussion', color: 'bg-blue-100 text-blue-700' },
  voting: { label: 'Abstimmung', color: 'bg-amber-100 text-amber-700' },
  closed: { label: 'Abgeschlossen', color: 'bg-green-100 text-green-700' },
  cancelled: { label: 'Abgebrochen', color: 'bg-red-100 text-red-700' },
};

// Valid status transitions
export const VALID_TRANSITIONS: Record<DecisionStatus, DecisionStatus[]> = {
  draft: ['discussion', 'voting', 'cancelled'],
  discussion: ['voting', 'cancelled'],
  voting: ['closed', 'cancelled'],
  closed: [],
  cancelled: [],
};

// ─── Decision Types ───────────────────────────────────────────────────────

export const DECISION_TYPES = [
  'sense_check',
  'prioritize',
  'choose',
  'approve',
] as const;

export type DecisionType = (typeof DECISION_TYPES)[number];

export const DECISION_TYPE_CONFIG: Record<
  DecisionType,
  { label: string; description: string }
> = {
  sense_check: {
    label: 'Stimmungsabfrage',
    description: 'Schnelle Abfrage zur Stimmung im Team',
  },
  prioritize: {
    label: 'Priorisierung',
    description: 'Optionen nach Wichtigkeit ordnen',
  },
  choose: {
    label: 'Auswahl',
    description: 'Zwischen mehreren Optionen entscheiden',
  },
  approve: {
    label: 'Genehmigung',
    description: 'Vorschlag genehmigen oder ablehnen',
  },
};

// ─── Voting Methods ───────────────────────────────────────────────────────

export const VOTING_METHODS = [
  'consent',
  'approval',
  'dot',
  'score',
  'simple_majority',
] as const;

export type VotingMethod = (typeof VOTING_METHODS)[number];

export const VOTING_METHOD_CONFIG: Record<
  VotingMethod,
  { label: string; description: string }
> = {
  consent: {
    label: 'Konsent',
    description:
      'Zustimmung, Enthaltung, Ablehnung oder Blockierung. Kein Block = angenommen.',
  },
  approval: {
    label: 'Zustimmungswahl',
    description: 'Mehrere Optionen auswählen. Meiste Stimmen gewinnt.',
  },
  dot: {
    label: 'Punktabstimmung',
    description: 'Punkte auf Optionen verteilen. Meiste Punkte gewinnt.',
  },
  score: {
    label: 'Bewertung',
    description: 'Jede Option von 1–5 bewerten. Höchster Durchschnitt gewinnt.',
  },
  simple_majority: {
    label: 'Einfache Mehrheit',
    description: 'Ja, Nein oder Enthaltung. Mehr Ja als Nein = angenommen.',
  },
};

// Methods that require options
export const METHODS_REQUIRING_OPTIONS: VotingMethod[] = [
  'approval',
  'dot',
  'score',
];

// ─── Per-Type Defaults ────────────────────────────────────────────────────

export const DECISION_TYPE_DEFAULTS: Record<
  DecisionType,
  {
    votingMethod: VotingMethod;
    quorum: { type: 'percentage' | 'absolute'; value: number };
    durationHours: number;
    blindVoting: boolean;
  }
> = {
  sense_check: {
    votingMethod: 'simple_majority',
    quorum: { type: 'percentage', value: 50 },
    durationHours: 48,
    blindVoting: true,
  },
  prioritize: {
    votingMethod: 'dot',
    quorum: { type: 'percentage', value: 66 },
    durationHours: 72,
    blindVoting: true,
  },
  choose: {
    votingMethod: 'approval',
    quorum: { type: 'percentage', value: 66 },
    durationHours: 120,
    blindVoting: true,
  },
  approve: {
    votingMethod: 'consent',
    quorum: { type: 'percentage', value: 75 },
    durationHours: 120,
    blindVoting: true,
  },
};

// ─── Consent Responses ────────────────────────────────────────────────────

export const CONSENT_RESPONSES = [
  'agree',
  'abstain',
  'disagree',
  'block',
] as const;

export type ConsentResponse = (typeof CONSENT_RESPONSES)[number];

export const CONSENT_RESPONSE_CONFIG: Record<
  ConsentResponse,
  { label: string; color: string }
> = {
  agree: { label: 'Zustimmen', color: 'bg-green-100 text-green-700' },
  abstain: { label: 'Enthalten', color: 'bg-gray-100 text-gray-700' },
  disagree: { label: 'Ablehnen', color: 'bg-orange-100 text-orange-700' },
  block: { label: 'Blockieren', color: 'bg-red-100 text-red-700' },
};

// ─── Simple Majority Responses ────────────────────────────────────────────

export const SIMPLE_MAJORITY_RESPONSES = ['yes', 'no', 'abstain'] as const;

export type SimpleMajorityResponse =
  (typeof SIMPLE_MAJORITY_RESPONSES)[number];

export const SIMPLE_MAJORITY_RESPONSE_CONFIG: Record<
  SimpleMajorityResponse,
  { label: string }
> = {
  yes: { label: 'Ja' },
  no: { label: 'Nein' },
  abstain: { label: 'Enthaltung' },
};

// ─── Comment Positions ────────────────────────────────────────────────────

export const COMMENT_POSITIONS = [
  'for',
  'against',
  'question',
  'info',
] as const;

export type CommentPosition = (typeof COMMENT_POSITIONS)[number];

export const COMMENT_POSITION_CONFIG: Record<
  CommentPosition,
  { label: string; color: string }
> = {
  for: { label: 'Dafür', color: 'bg-green-100 text-green-700' },
  against: { label: 'Dagegen', color: 'bg-red-100 text-red-700' },
  question: { label: 'Frage', color: 'bg-blue-100 text-blue-700' },
  info: { label: 'Information', color: 'bg-purple-100 text-purple-700' },
};

// ─── Dot Voting ───────────────────────────────────────────────────────────

export const DOT_VOTING_DEFAULTS: {
  min: number;
  max: number;
  default: number;
} = {
  min: 3,
  max: 10,
  default: 5,
};

// ─── Score Range ──────────────────────────────────────────────────────────

export const SCORE_RANGE = { min: 1, max: 5 } as const;

// ─── Lifecycle Helpers ───────────────────────────────────────────────────

export const EDITABLE_STATUSES: readonly DecisionStatus[] = ['draft', 'discussion'];
export const COMMENTABLE_STATUSES: readonly DecisionStatus[] = ['discussion', 'voting', 'closed'];
export const PARTICIPATABLE_STATUSES: readonly DecisionStatus[] = ['discussion', 'voting', 'closed'];
export const READ_ONLY_STATUSES: readonly DecisionStatus[] = ['closed', 'cancelled'];

export function isStatusEditable(status: DecisionStatus): boolean {
  return (EDITABLE_STATUSES as readonly string[]).includes(status);
}

export function isStatusCommentable(status: DecisionStatus): boolean {
  return (COMMENTABLE_STATUSES as readonly string[]).includes(status);
}

// ─── Decision Categories (Verein) ────────────────────────────────────────

export const DECISION_CATEGORIES = {
  VORSTANDSBESCHLUSS: 'vorstandsbeschluss',
  MITGLIEDERBESCHLUSS: 'mitgliederbeschluss',
  RATIFIZIERUNG: 'ratifizierung',
  STATUTENAENDERUNG: 'statutenaenderung',
  BUDGET: 'budget',
  OPERATIV: 'operativ',
} as const;

export type DecisionCategory = typeof DECISION_CATEGORIES[keyof typeof DECISION_CATEGORIES];

export const DECISION_CATEGORY_LABELS: Record<DecisionCategory, string> = {
  vorstandsbeschluss: 'Vorstandsbeschluss',
  mitgliederbeschluss: 'Mitgliederbeschluss',
  ratifizierung: 'Ratifizierung',
  statutenaenderung: 'Statutenänderung',
  budget: 'Budget-Genehmigung',
  operativ: 'Operative Entscheidung',
};
