/**
 * Meeting Protocols Zod Schemas
 *
 * Validation schemas derived from config (SSOT)
 * Following dev guide: docs/development/DEV_GUIDE.md
 *
 * Created: 2026-02-10
 */

import { z } from 'zod';
import {
  MEETING_TYPES,
  PROTOCOL_VISIBILITY,
  INPUT_METHODS,
  DECISION_VOTE_TYPES,
} from '@/config/protocols';
import type {
  MeetingType,
  ProtocolStatus,
  ProtocolVisibility,
  InputMethod,
  DecisionResult,
} from '@/config/protocols';

// Derive enums from config
const meetingTypes = Object.values(MEETING_TYPES) as [string, ...string[]];
const visibilityOptions = Object.values(PROTOCOL_VISIBILITY) as [string, ...string[]];
const inputMethods = Object.values(INPUT_METHODS) as [string, ...string[]];

// ============================================================
// Structured Notes (AI output) — defined first, used by update schema
// ============================================================

/** Structured notes Zod schema (AI output validation) */
export const structuredNotesSchema = z.object({
  summary: z.string().default(''),
  detected_attendees: z.array(z.string()).default([]),
  topics: z.array(z.object({
    id: z.string(),
    title: z.string(),
    discussion: z.string(),
    outcome: z.string().nullable().default(null),
  })).default([]),
  action_items: z.array(z.object({
    id: z.string(),
    description: z.string(),
    assigned_to_name: z.string().nullable().default(null),
    assigned_to_id: z.string().nullable().default(null),
    due_hint: z.string().nullable().default(null),
    item_type: z.enum(['task', 'decision', 'info']).default('info'),
    topic_id: z.string().nullable().default(null),
    priority_hint: z.enum(['low', 'normal', 'high']).nullable().default(null),
  })).default([]),
  follow_ups: z.array(z.object({
    description: z.string(),
    status: z.string().nullable().default(null),
  })).default([]),
});

export type StructuredNotes = z.infer<typeof structuredNotesSchema>;

// ============================================================
// Request Schemas
// ============================================================

/**
 * Protocol creation schema
 */
export const createProtocolSchema = z.object({
  title: z
    .string()
    .min(1, 'Titel erforderlich')
    .max(200, 'Titel zu lang (max 200 Zeichen)'),
  meeting_date: z
    .string()
    .min(1, 'Datum erforderlich'),
  meeting_type: z.enum(meetingTypes),
  visibility: z.enum(visibilityOptions),
  attendees: z
    .array(z.string().uuid())
    .optional()
    .default([]),
  input_method: z.enum(inputMethods).optional().default('transcript'),
});

/**
 * Protocol update schema (partial, for review edits)
 */
export const updateProtocolSchema = createProtocolSchema.partial().extend({
  structured_notes: structuredNotesSchema.optional(),
});

/**
 * Process transcript request schema
 */
export const processTranscriptSchema = z.object({
  raw_transcript: z
    .string()
    .min(50, 'Transkript zu kurz (min 50 Zeichen)')
    .max(100000, 'Transkript zu lang (max 100\'000 Zeichen)'),
});

/**
 * Process notes request schema (Step 3: notes → structured)
 */
export const processNotesSchema = z.object({
  content: z.string().min(20, 'Notizen zu kurz').max(100000),
});

/**
 * Import tasks request schema (Step 4: task list → tasks)
 */
export const importTasksSchema = z.object({
  content: z.string().min(10, 'Aufgabenliste zu kurz').max(50000),
});

/**
 * Parsed task item schema (AI output for task parsing)
 */
export const parsedTaskItemSchema = z.object({
  description: z.string().min(1),
  assigned_to_name: z.string().nullable().default(null),
  priority: z.enum(['low', 'normal', 'high']).default('normal'),
  due_hint: z.string().nullable().default(null),
});

export const parsedTaskListSchema = z.array(parsedTaskItemSchema);

export type ParsedTaskItem = z.infer<typeof parsedTaskItemSchema>;
export type ProcessNotesInput = z.infer<typeof processNotesSchema>;
export type ImportTasksInput = z.infer<typeof importTasksSchema>;

/**
 * Link action item schema
 */
export const linkActionSchema = z.object({
  action_item_id: z.string().min(1, 'Action Item ID erforderlich'),
  link_type: z.enum(['task', 'decision']),
  task_data: z.object({
    title: z.string().min(1).max(200),
    description: z.string().max(2000).optional().nullable(),
    task_type: z.string().default('one_time'),
    category: z.string().default('admin'),
    priority: z.string().default('normal'),
  }).optional(),
  decision_data: z.object({
    title: z.string().min(1).max(200),
    description: z.string().min(1).max(2000),
    decisionType: z.string().default('sense_check'),
    votingMethod: z.string().default('simple_majority'),
    initialStatus: z.string().default('draft'),
  }).optional(),
});

// Derived types from schemas
export type CreateProtocolInput = z.infer<typeof createProtocolSchema>;
export type UpdateProtocolInput = z.infer<typeof updateProtocolSchema>;
export type ProcessTranscriptInput = z.infer<typeof processTranscriptSchema>;
export type LinkActionInput = z.infer<typeof linkActionSchema>;

// ============================================================
// Database row types (SSOT for protocol data shapes across pages)
// ============================================================

/** Protocol row for list pages */
export interface ProtocolListItem {
  id: string;
  title: string;
  meeting_date: string;
  meeting_type: MeetingType;
  visibility: ProtocolVisibility;
  attendees: string[];
  input_method: InputMethod;
  status: ProtocolStatus;
  created_by_name: string | null;
  created_at: string;
  action_item_count: number;
  unlinked_action_item_count: number;
  has_structured_notes: boolean;
}

/** Protocol row for detail page */
export interface ProtocolDetail {
  id: string;
  title: string;
  meeting_date: string;
  meeting_type: MeetingType;
  visibility: ProtocolVisibility;
  attendees: string[];
  input_method: InputMethod;
  raw_transcript: string | null;
  structured_notes: StructuredNotes | null;
  processing_model: string | null;
  status: ProtocolStatus;
  created_by: string;
  created_by_name: string | null;
  created_by_email: string | null;
  created_at: string;
  updated_at: string;
}

/** Action link record */
export interface ActionLinkRecord {
  id: string;
  protocol_id: string;
  action_item_id: string;
  link_type: 'task' | 'decision';
  linked_task_id: string | null;
  linked_task_title: string | null;
  linked_task_status: string | null;
  linked_decision_id: string | null;
  linked_decision_title: string | null;
  linked_decision_status: string | null;
  created_at: string;
}

// ============================================================
// Decision Voting Schemas
// ============================================================

const decisionVoteTypes = Object.values(DECISION_VOTE_TYPES) as [string, ...string[]];

/** Vote on a decision action item */
export const decisionVoteSchema = z.object({
  action_item_id: z.string().min(1, 'Action Item ID erforderlich'),
  vote_type: z.enum(decisionVoteTypes),
});

/** Close a decision manually */
export const closeDecisionSchema = z.object({
  action_item_id: z.string().min(1, 'Action Item ID erforderlich'),
});

/** AI-proposed task from an approved decision */
export const proposedTaskSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(2000).nullable().optional(),
  priority: z.enum(['low', 'normal', 'high']).default('normal'),
  assigned_to_name: z.string().nullable().optional(),
  estimated_minutes: z.number().nullable().optional(),
});

export const proposedTaskListSchema = z.array(proposedTaskSchema);

export type DecisionVoteInput = z.infer<typeof decisionVoteSchema>;
export type CloseDecisionInput = z.infer<typeof closeDecisionSchema>;
export type ProposedTask = z.infer<typeof proposedTaskSchema>;

/** Decision vote database record */
export interface DecisionVoteRecord {
  id: string;
  protocol_id: string;
  action_item_id: string;
  voter_id: string;
  vote_type: 'up' | 'down';
  created_at: string;
}

/** Decision outcome database record */
export interface DecisionOutcomeRecord {
  id: string;
  protocol_id: string;
  action_item_id: string;
  is_closed: boolean;
  closed_by: string | null;
  closed_at: string | null;
  result: DecisionResult;
  votes_up: number;
  votes_down: number;
  proposed_tasks: ProposedTask[] | null;
  proposal_model: string | null;
  tasks_created: boolean;
}
