/**
 * Suggested replies for Hirn's conversational answers — the two to four
 * things the person is likely to say next, shown as buttons under the answer.
 *
 * The format (the instruction that asks the model for a `quick_replies`
 * block, and the parser that takes it back out) is SSOT in @bitbaum/chatkit;
 * this file only decides WHERE it applies in evig. Only conversational
 * prompts get the instruction: a one-shot generator (summaries, drafts)
 * has no "next message" to suggest.
 *
 * Extraction runs server-side, so the raw block never reaches a client —
 * not in a fresh answer, not in reloaded history, not in a copy.
 */

import { REPLIES_INSTRUCTION, extractReplies } from '@bitbaum/chatkit';

export interface AnswerWithReplies {
  /** The answer as the person should read it — block removed. */
  text: string;
  /** Ready-to-send replies; empty when the model offered none. */
  replies: string[];
}

/** Append the suggested-replies instruction to a conversational system prompt. */
export function withSuggestedReplies(systemPrompt: string): string {
  return `${systemPrompt}\n\n${REPLIES_INSTRUCTION}`;
}

/** Split a model answer into readable text and its suggested replies. */
export function splitSuggestedReplies(answer: string): AnswerWithReplies {
  return extractReplies(answer);
}
