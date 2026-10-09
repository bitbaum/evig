/**
 * Suggested replies — evig's seam onto @bitbaum/chatkit.
 *
 * Behaviors locked:
 *   - the instruction is appended to (never replaces) a conversational prompt
 *   - a finished `quick_replies` block is removed from the text and parsed
 *   - an answer without a block passes through untouched
 *   - an action envelope and a replies block can coexist (admin Hirn)
 */

import { REPLIES_INSTRUCTION } from '@bitbaum/chatkit';
import { withSuggestedReplies, splitSuggestedReplies } from '../replies';

const BLOCK = '```quick_replies\n["Ja, bitte", "Zeig mir zuerst die Zahlen", "Später"]\n```';

describe('withSuggestedReplies', () => {
  it('appends the chatkit instruction after the prompt', () => {
    const prompt = withSuggestedReplies('Du bist Hirn.');
    expect(prompt.startsWith('Du bist Hirn.')).toBe(true);
    expect(prompt.endsWith(REPLIES_INSTRUCTION)).toBe(true);
  });
});

describe('splitSuggestedReplies', () => {
  it('removes the block from the text and returns the replies', () => {
    const { text, replies } = splitSuggestedReplies(`Soll ich das anlegen?\n\n${BLOCK}`);
    expect(text).toBe('Soll ich das anlegen?');
    expect(replies).toEqual(['Ja, bitte', 'Zeig mir zuerst die Zahlen', 'Später']);
  });

  it('leaves an answer without a block unchanged', () => {
    expect(splitSuggestedReplies('Erledigt.')).toEqual({ text: 'Erledigt.', replies: [] });
  });

  it('never shows a half-written block', () => {
    const { text } = splitSuggestedReplies('Soll ich?\n```quick_replies\n["Ja", "Ne');
    expect(text).toBe('Soll ich?');
  });

  it('keeps an ordinary code block', () => {
    const answer = 'So:\n```ts\nconst a = 1;\n```';
    expect(splitSuggestedReplies(answer).text).toBe(answer);
  });
});
