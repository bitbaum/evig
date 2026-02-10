import { z } from 'zod';
import {
  DECISION_TYPES,
  VOTING_METHODS,
  DECISION_STATUSES,
  CONSENT_RESPONSES,
  SIMPLE_MAJORITY_RESPONSES,
  COMMENT_POSITIONS,
  SCORE_RANGE,
  METHODS_REQUIRING_OPTIONS,
  type DecisionType,
  type VotingMethod,
  type DecisionStatus,
} from '@/config/decisions';

// ─── Option Schema ────────────────────────────────────────────────────────

const optionSchema = z.object({
  id: z.string().optional(),
  label: z.string().min(1),
  description: z.string().optional(),
});

export type DecisionOption = z.infer<typeof optionSchema>;

// ─── Quorum Schema ────────────────────────────────────────────────────────

const quorumSchema = z.object({
  type: z.enum(['percentage', 'absolute']),
  value: z.number().positive(),
});

export type QuorumConfig = z.infer<typeof quorumSchema>;

// ─── Create Decision ──────────────────────────────────────────────────────

export const createDecisionSchema = z
  .object({
    title: z.string().min(1).max(200),
    description: z.string().min(1),
    decisionType: z.enum(DECISION_TYPES as unknown as [string, ...string[]]) as z.ZodType<DecisionType>,
    votingMethod: z.enum(VOTING_METHODS as unknown as [string, ...string[]]) as z.ZodType<VotingMethod>,
    options: z.array(optionSchema).optional().default([]),
    quorum: quorumSchema.optional(),
    blindVoting: z.boolean().optional().default(true),
    dotCount: z.number().int().min(1).max(20).optional().nullable(),
    invitedParticipants: z.array(z.string()).optional().default([]),
    discussionDeadline: z.string().datetime().optional().nullable(),
    votingDeadline: z.string().datetime().optional().nullable(),
    // Allow immediate transition on create
    initialStatus: z
      .enum(['draft', 'discussion', 'voting'] as const)
      .optional()
      .default('draft'),
  })
  .refine(
    (data) => {
      // Options required for approval/dot/score
      if (
        METHODS_REQUIRING_OPTIONS.includes(data.votingMethod) &&
        (!data.options || data.options.length < 2)
      ) {
        return false;
      }
      return true;
    },
    { message: 'Mindestens 2 Optionen erforderlich für diese Abstimmungsmethode' }
  )
  .refine(
    (data) => {
      // dotCount required for dot voting
      if (data.votingMethod === 'dot' && !data.dotCount) {
        return false;
      }
      return true;
    },
    { message: 'Punktanzahl ist für Punktabstimmung erforderlich' }
  );

export type CreateDecisionInput = z.infer<typeof createDecisionSchema>;

// ─── Update Decision ──────────────────────────────────────────────────────

export const updateDecisionSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().min(1).optional(),
  decisionType: z.enum(DECISION_TYPES as unknown as [string, ...string[]]).optional() as z.ZodType<DecisionType | undefined>,
  votingMethod: z.enum(VOTING_METHODS as unknown as [string, ...string[]]).optional() as z.ZodType<VotingMethod | undefined>,
  options: z.array(optionSchema).optional(),
  quorum: quorumSchema.optional(),
  blindVoting: z.boolean().optional(),
  dotCount: z.number().int().min(1).max(20).optional().nullable(),
  invitedParticipants: z.array(z.string()).optional(),
  discussionDeadline: z.string().datetime().optional().nullable(),
  votingDeadline: z.string().datetime().optional().nullable(),
  outcomeSummary: z.string().optional().nullable(),
});

export type UpdateDecisionInput = z.infer<typeof updateDecisionSchema>;

// ─── Transition ───────────────────────────────────────────────────────────

export const transitionDecisionSchema = z.object({
  status: z.enum(DECISION_STATUSES as unknown as [string, ...string[]]) as z.ZodType<DecisionStatus>,
  cancelReason: z.string().optional(),
  outcomeSummary: z.string().optional(),
});

export type TransitionDecisionInput = z.infer<typeof transitionDecisionSchema>;

// ─── Vote Schemas (per method) ────────────────────────────────────────────

export const consentVoteSchema = z
  .object({
    response: z.enum(CONSENT_RESPONSES as unknown as [string, ...string[]]),
    rationale: z.string().optional(),
  })
  .refine(
    (data) => {
      if (data.response === 'block' && (!data.rationale || data.rationale.trim() === '')) {
        return false;
      }
      return true;
    },
    { message: 'Bei einer Blockierung ist eine Begründung erforderlich' }
  );

export type ConsentVoteInput = z.infer<typeof consentVoteSchema>;

export const approvalVoteSchema = z.object({
  approved_options: z.array(z.string()).min(1, 'Mindestens eine Option auswählen'),
});

export type ApprovalVoteInput = z.infer<typeof approvalVoteSchema>;

export const dotVoteSchema = z.object({
  allocations: z.record(z.string(), z.number().int().min(0)),
});

export type DotVoteInput = z.infer<typeof dotVoteSchema>;

export const scoreVoteSchema = z.object({
  scores: z.record(
    z.string(),
    z.number().int().min(SCORE_RANGE.min).max(SCORE_RANGE.max)
  ),
});

export type ScoreVoteInput = z.infer<typeof scoreVoteSchema>;

export const simpleMajorityVoteSchema = z.object({
  response: z.enum(SIMPLE_MAJORITY_RESPONSES as unknown as [string, ...string[]]),
});

export type SimpleMajorityVoteInput = z.infer<typeof simpleMajorityVoteSchema>;

// Union type for all vote data
export type VoteData =
  | ConsentVoteInput
  | ApprovalVoteInput
  | DotVoteInput
  | ScoreVoteInput
  | SimpleMajorityVoteInput;

// ─── Comments ─────────────────────────────────────────────────────────────

export const createCommentSchema = z.object({
  content: z.string().min(1),
  position: z.enum(COMMENT_POSITIONS as unknown as [string, ...string[]]),
  optionId: z.string().optional().nullable(),
  parentCommentId: z.string().optional().nullable(),
});

export type CreateCommentInput = z.infer<typeof createCommentSchema>;

export const updateCommentSchema = z.object({
  content: z.string().min(1),
});

export type UpdateCommentInput = z.infer<typeof updateCommentSchema>;
