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
  draft: { label: 'Entwurf', color: 'bg-neutral-100 text-neutral-700' },
  discussion: { label: 'Diskussion', color: 'bg-blue-100 text-blue-700' },
  voting: { label: 'Abstimmung', color: 'bg-amber-100 text-amber-700' },
  closed: { label: 'Abgeschlossen', color: 'bg-primary-100 text-primary-700' },
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
  'election',
] as const;

export type DecisionType = (typeof DECISION_TYPES)[number];

export const DECISION_TYPE_CONFIG: Record<
  DecisionType,
  { label: string; description: string; mechanic: string; icon: string }
> = {
  sense_check: {
    label: 'Ja / Nein',
    description: 'Klare Frage, bindende Antwort',
    mechanic: 'Ja · Nein · Enthaltung — einfache Mehrheit entscheidet',
    icon: '✓',
  },
  prioritize: {
    label: 'Priorisierung',
    description: 'Mehrere Optionen gewichten',
    mechanic: 'Punkte auf Optionen verteilen — meiste Punkte gewinnt',
    icon: '⬡',
  },
  choose: {
    label: 'Auswahl',
    description: 'Eine oder mehrere Optionen wählen',
    mechanic: 'Optionen ankreuzen — meiste Stimmen gewinnt',
    icon: '◎',
  },
  approve: {
    label: 'Genehmigung',
    description: 'Formelle Annahme per Konsent',
    mechanic: 'Zustimmung · Enthaltung · Einwand · Blockierung — kein Block = angenommen',
    icon: '◈',
  },
  election: {
    label: 'Wahl',
    description: 'Personen in Ämter wählen',
    mechanic: 'Kandidaten in Rangfolge reihen — Borda-Zählung bestimmt Gewinner',
    icon: '★',
  },
};

// ─── Voting Methods ───────────────────────────────────────────────────────

export const VOTING_METHODS = [
  'consent',
  'approval',
  'dot',
  'score',
  'simple_majority',
  'ranked_choice',
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
  ranked_choice: {
    label: 'Rangwahl',
    description: 'Kandidaten in Rangfolge ordnen. Borda-Zählmethode bestimmt den Gewinner.',
  },
};

// Methods that require options (candidates/choices must be defined)
export const METHODS_REQUIRING_OPTIONS: VotingMethod[] = [
  'approval',
  'dot',
  'score',
  'ranked_choice',
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
  election: {
    votingMethod: 'ranked_choice',
    quorum: { type: 'percentage', value: 50 },
    durationHours: 168,
    blindVoting: true,
  },
};

// ─── Participant Scopes ───────────────────────────────────────────────────

export const PARTICIPANT_SCOPE = {
  ALL_STAFF: 'all_staff',
  BOARD_ONLY: 'board_only',
  ALL_MEMBERS: 'all_members',
  INVITED: 'invited',
} as const;

export const PARTICIPANT_SCOPE_DEFAULT = PARTICIPANT_SCOPE.ALL_STAFF;

export const PARTICIPANT_SCOPES = [
  PARTICIPANT_SCOPE.ALL_STAFF,
  PARTICIPANT_SCOPE.BOARD_ONLY,
  PARTICIPANT_SCOPE.ALL_MEMBERS,
  PARTICIPANT_SCOPE.INVITED,
] as const;

export type ParticipantScope = (typeof PARTICIPANT_SCOPES)[number];

export const PARTICIPANT_SCOPE_CONFIG: Record<
  ParticipantScope,
  { label: string; description: string }
> = {
  [PARTICIPANT_SCOPE.ALL_STAFF]: {
    label: 'Alle Mitarbeitenden',
    description: 'Alle aktiven Mitarbeitenden können abstimmen',
  },
  [PARTICIPANT_SCOPE.BOARD_ONLY]: {
    label: 'Nur Vorstand',
    description: 'Nur Vorstandsmitglieder (Berechtigung: vorstand)',
  },
  [PARTICIPANT_SCOPE.ALL_MEMBERS]: {
    label: 'Alle Vereinsmitglieder',
    description: 'Alle eingetragenen Vereinsmitglieder',
  },
  [PARTICIPANT_SCOPE.INVITED]: {
    label: 'Eingeladene Personen',
    description: 'Nur explizit eingeladene Personen',
  },
};

// Advisory scope defaults per category (used by AI recommender and templates)
export const CATEGORY_SCOPE_DEFAULTS: Record<DecisionCategory, ParticipantScope> = {
  vorstandsbeschluss: PARTICIPANT_SCOPE.BOARD_ONLY,
  mitgliederbeschluss: PARTICIPANT_SCOPE.ALL_MEMBERS,
  ratifizierung: PARTICIPANT_SCOPE.BOARD_ONLY,
  statutenaenderung: PARTICIPANT_SCOPE.ALL_MEMBERS,
  budget: PARTICIPANT_SCOPE.BOARD_ONLY,
  operativ: PARTICIPANT_SCOPE.ALL_STAFF,
};

// ─── Decision Templates ───────────────────────────────────────────────────

export interface DecisionTemplate {
  id: string;
  label: string;
  description: string;
  category: DecisionCategory;
  decisionType: DecisionType;
  votingMethod: VotingMethod;
  participantScope: ParticipantScope;
  quorum: { type: 'percentage' | 'absolute'; value: number };
  blindVoting: boolean;
  durationHours: number;
  sampleOptions?: Array<{ label: string; description: string }>;
}

export const DECISION_TEMPLATES: DecisionTemplate[] = [
  {
    id: 'logo_vote',
    label: 'Logowahl',
    description: 'Abstimmung über ein neues Logo oder visuelles Design aus mehreren Optionen',
    category: 'operativ',
    decisionType: 'choose',
    votingMethod: 'approval',
    participantScope: PARTICIPANT_SCOPE.ALL_STAFF,
    quorum: { type: 'percentage', value: 66 },
    blindVoting: true,
    durationHours: 120,
    sampleOptions: [
      { label: 'Logo A', description: 'Variante A' },
      { label: 'Logo B', description: 'Variante B' },
      { label: 'Logo C', description: 'Variante C' },
    ],
  },
  {
    id: 'budget_approval',
    label: 'Budget-Genehmigung',
    description: 'Genehmigung eines Budget-Antrags durch den Vorstand',
    category: 'budget',
    decisionType: 'approve',
    votingMethod: 'simple_majority',
    participantScope: PARTICIPANT_SCOPE.BOARD_ONLY,
    quorum: { type: 'percentage', value: 75 },
    blindVoting: false,
    durationHours: 72,
  },
  {
    id: 'workshop_priority',
    label: 'Workshop-Priorisierung',
    description: 'Welche Workshops sollen im nächsten Quartal Priorität haben?',
    category: 'operativ',
    decisionType: 'prioritize',
    votingMethod: 'dot',
    participantScope: PARTICIPANT_SCOPE.ALL_STAFF,
    quorum: { type: 'percentage', value: 50 },
    blindVoting: true,
    durationHours: 72,
    sampleOptions: [
      { label: 'Linux-Einführung', description: 'Grundlagen für Einsteiger' },
      { label: 'Repair-Café', description: 'Geräte reparieren und weitergeben' },
      { label: 'Hardware-Kurs', description: 'PC-Aufbau und Komponenten' },
    ],
  },
  {
    id: 'statute_change',
    label: 'Statutenänderung',
    description: 'Abstimmung über eine Änderung der Vereinsstatuten — erfordert Mitgliedermehrheit',
    category: 'statutenaenderung',
    decisionType: 'approve',
    votingMethod: 'simple_majority',
    participantScope: PARTICIPANT_SCOPE.ALL_MEMBERS,
    quorum: { type: 'percentage', value: 66 },
    blindVoting: false,
    durationHours: 168,
  },
  {
    id: 'board_election',
    label: 'Vorstandswahl',
    description: 'Wahl von Vorstandsmitgliedern durch alle Vereinsmitglieder (Rangwahl)',
    category: 'vorstandsbeschluss',
    decisionType: 'election',
    votingMethod: 'ranked_choice',
    participantScope: PARTICIPANT_SCOPE.ALL_MEMBERS,
    quorum: { type: 'percentage', value: 50 },
    blindVoting: true,
    durationHours: 168,
    sampleOptions: [
      { label: 'Kandidat/in 1', description: 'Funktion / Motivation' },
      { label: 'Kandidat/in 2', description: 'Funktion / Motivation' },
    ],
  },
  {
    id: 'partnership_approval',
    label: 'Partnerschaft-Genehmigung',
    description: 'Konsent-Entscheid über eine neue Partnerschaft oder Kooperation',
    category: 'vorstandsbeschluss',
    decisionType: 'approve',
    votingMethod: 'consent',
    participantScope: PARTICIPANT_SCOPE.BOARD_ONLY,
    quorum: { type: 'percentage', value: 75 },
    blindVoting: false,
    durationHours: 120,
  },
];

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
  agree: { label: 'Zustimmen', color: 'bg-primary-100 text-primary-700' },
  abstain: { label: 'Enthalten', color: 'bg-neutral-100 text-neutral-700' },
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
  for: { label: 'Dafür', color: 'bg-primary-100 text-primary-700' },
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
