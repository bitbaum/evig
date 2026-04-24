/**
 * @jest-environment node
 *
 * Unit tests for decisions-voting pure functions:
 *  - validateVoteData  (vote input validation for all 6 methods)
 *  - computeTallies    (tally aggregation for all 6 methods)
 *
 * No DB calls — these functions contain only business logic.
 */

import { validateVoteData, computeTallies } from '@/lib/services/decisions-voting';
import type { DecisionOption } from '@/lib/schemas/decisions';

// ─── Fixtures ────────────────────────────────────────────────────────────────

const OPT_A: DecisionOption = { id: 'opt-a', label: 'Option A', imageUrl: undefined };
const OPT_B: DecisionOption = { id: 'opt-b', label: 'Option B', imageUrl: undefined };
const OPT_C: DecisionOption = { id: 'opt-c', label: 'Option C', imageUrl: undefined };
const THREE_OPTIONS = [OPT_A, OPT_B, OPT_C];

const decision3opts = {
  options: THREE_OPTIONS,
  dot_count: 5,
};

// ─── validateVoteData ─────────────────────────────────────────────────────────

describe('validateVoteData', () => {

  // ── consent ────────────────────────────────────────────────────────────────

  describe('consent', () => {
    const dec = { options: [], dot_count: null };

    it('accepts agree', () => {
      const r = validateVoteData('consent', { response: 'agree' }, dec);
      expect(r.success).toBe(true);
    });

    it('accepts abstain', () => {
      const r = validateVoteData('consent', { response: 'abstain' }, dec);
      expect(r.success).toBe(true);
    });

    it('accepts disagree', () => {
      const r = validateVoteData('consent', { response: 'disagree' }, dec);
      expect(r.success).toBe(true);
    });

    it('accepts block with rationale', () => {
      const r = validateVoteData('consent', { response: 'block', rationale: 'This violates our values' }, dec);
      expect(r.success).toBe(true);
    });

    it('rejects block without rationale', () => {
      const r = validateVoteData('consent', { response: 'block' }, dec);
      expect(r.success).toBe(false);
      expect(r).toHaveProperty('error');
    });

    it('rejects block with empty rationale', () => {
      const r = validateVoteData('consent', { response: 'block', rationale: '   ' }, dec);
      expect(r.success).toBe(false);
    });

    it('rejects unknown response', () => {
      const r = validateVoteData('consent', { response: 'maybe' }, dec);
      expect(r.success).toBe(false);
    });

    it('rejects missing response field', () => {
      const r = validateVoteData('consent', {}, dec);
      expect(r.success).toBe(false);
    });
  });

  // ── approval ───────────────────────────────────────────────────────────────

  describe('approval', () => {
    const dec = { options: THREE_OPTIONS, dot_count: null };

    it('accepts valid option IDs', () => {
      const r = validateVoteData('approval', { approved_options: ['opt-a', 'opt-b'] }, dec);
      expect(r.success).toBe(true);
    });

    it('accepts single option', () => {
      const r = validateVoteData('approval', { approved_options: ['opt-c'] }, dec);
      expect(r.success).toBe(true);
    });

    it('rejects empty approved_options array', () => {
      const r = validateVoteData('approval', { approved_options: [] }, dec);
      expect(r.success).toBe(false);
    });

    it('rejects invalid option IDs', () => {
      const r = validateVoteData('approval', { approved_options: ['opt-x'] }, dec);
      expect(r.success).toBe(false);
      if (!r.success) expect(r.error).toMatch(/option/i);
    });

    it('rejects mix of valid and invalid option IDs', () => {
      const r = validateVoteData('approval', { approved_options: ['opt-a', 'bogus'] }, dec);
      expect(r.success).toBe(false);
    });

    it('rejects missing approved_options field', () => {
      const r = validateVoteData('approval', {}, dec);
      expect(r.success).toBe(false);
    });
  });

  // ── dot ────────────────────────────────────────────────────────────────────

  describe('dot', () => {
    const dec = { options: THREE_OPTIONS, dot_count: 5 };

    it('accepts allocations within limit', () => {
      const r = validateVoteData('dot', { allocations: { 'opt-a': 3, 'opt-b': 2 } }, dec);
      expect(r.success).toBe(true);
    });

    it('accepts zero dots on an option', () => {
      const r = validateVoteData('dot', { allocations: { 'opt-a': 5, 'opt-b': 0 } }, dec);
      expect(r.success).toBe(true);
    });

    it('accepts all dots on one option at the limit', () => {
      const r = validateVoteData('dot', { allocations: { 'opt-a': 5 } }, dec);
      expect(r.success).toBe(true);
    });

    it('rejects allocations exceeding dot_count', () => {
      const r = validateVoteData('dot', { allocations: { 'opt-a': 3, 'opt-b': 3 } }, dec);
      expect(r.success).toBe(false);
      if (!r.success) expect(r.error).toContain('5'); // max dots in message
    });

    it('uses default of 5 dots when dot_count is null', () => {
      const dec2 = { options: THREE_OPTIONS, dot_count: null };
      const r = validateVoteData('dot', { allocations: { 'opt-a': 6 } }, dec2);
      expect(r.success).toBe(false);
    });

    it('rejects negative dot allocation', () => {
      const r = validateVoteData('dot', { allocations: { 'opt-a': -1 } }, dec);
      expect(r.success).toBe(false);
    });

    it('rejects missing allocations field', () => {
      const r = validateVoteData('dot', {}, dec);
      expect(r.success).toBe(false);
    });
  });

  // ── score ──────────────────────────────────────────────────────────────────

  describe('score', () => {
    const dec = { options: THREE_OPTIONS, dot_count: null };

    it('accepts scores in range 1-5', () => {
      const r = validateVoteData('score', { scores: { 'opt-a': 5, 'opt-b': 3, 'opt-c': 1 } }, dec);
      expect(r.success).toBe(true);
    });

    it('accepts minimum score of 1', () => {
      const r = validateVoteData('score', { scores: { 'opt-a': 1 } }, dec);
      expect(r.success).toBe(true);
    });

    it('accepts maximum score of 5', () => {
      const r = validateVoteData('score', { scores: { 'opt-a': 5 } }, dec);
      expect(r.success).toBe(true);
    });

    it('rejects score below 1', () => {
      const r = validateVoteData('score', { scores: { 'opt-a': 0 } }, dec);
      expect(r.success).toBe(false);
    });

    it('rejects score above 5', () => {
      const r = validateVoteData('score', { scores: { 'opt-a': 6 } }, dec);
      expect(r.success).toBe(false);
    });

    it('rejects non-integer score', () => {
      const r = validateVoteData('score', { scores: { 'opt-a': 3.5 } }, dec);
      expect(r.success).toBe(false);
    });

    it('rejects missing scores field', () => {
      const r = validateVoteData('score', {}, dec);
      expect(r.success).toBe(false);
    });
  });

  // ── simple_majority ────────────────────────────────────────────────────────

  describe('simple_majority', () => {
    const dec = { options: [], dot_count: null };

    it('accepts yes', () => {
      const r = validateVoteData('simple_majority', { response: 'yes' }, dec);
      expect(r.success).toBe(true);
    });

    it('accepts no', () => {
      const r = validateVoteData('simple_majority', { response: 'no' }, dec);
      expect(r.success).toBe(true);
    });

    it('accepts abstain', () => {
      const r = validateVoteData('simple_majority', { response: 'abstain' }, dec);
      expect(r.success).toBe(true);
    });

    it('rejects unknown response', () => {
      const r = validateVoteData('simple_majority', { response: 'maybe' }, dec);
      expect(r.success).toBe(false);
    });

    it('rejects missing response', () => {
      const r = validateVoteData('simple_majority', {}, dec);
      expect(r.success).toBe(false);
    });
  });

  // ── ranked_choice ──────────────────────────────────────────────────────────

  describe('ranked_choice', () => {
    const dec = { options: THREE_OPTIONS, dot_count: null };

    it('accepts ranking of valid option IDs', () => {
      const r = validateVoteData('ranked_choice', { ranking: ['opt-a', 'opt-b', 'opt-c'] }, dec);
      expect(r.success).toBe(true);
    });

    it('accepts partial ranking (2 of 3 options)', () => {
      const r = validateVoteData('ranked_choice', { ranking: ['opt-b', 'opt-a'] }, dec);
      expect(r.success).toBe(true);
    });

    it('rejects ranking with invalid option ID', () => {
      const r = validateVoteData('ranked_choice', { ranking: ['opt-a', 'bogus'] }, dec);
      expect(r.success).toBe(false);
      if (!r.success) expect(r.error).toMatch(/kandidaten/i);
    });

    it('rejects ranking with fewer than 2 entries', () => {
      const r = validateVoteData('ranked_choice', { ranking: ['opt-a'] }, dec);
      expect(r.success).toBe(false);
    });

    it('rejects empty ranking', () => {
      const r = validateVoteData('ranked_choice', { ranking: [] }, dec);
      expect(r.success).toBe(false);
    });

    it('rejects missing ranking field', () => {
      const r = validateVoteData('ranked_choice', {}, dec);
      expect(r.success).toBe(false);
    });
  });

  // ── unknown method ─────────────────────────────────────────────────────────

  it('returns error for unknown voting method', () => {
    const dec = { options: [], dot_count: null };
    // @ts-expect-error — testing invalid method
    const r = validateVoteData('freeform', { response: 'whatever' }, dec);
    expect(r.success).toBe(false);
    if (!r.success) expect(r.error).toMatch(/unbekannte/i);
  });
});

// ─── computeTallies ───────────────────────────────────────────────────────────

describe('computeTallies', () => {

  // ── consent ────────────────────────────────────────────────────────────────

  describe('consent', () => {
    it('counts responses correctly', () => {
      const votes = [
        { response: 'agree' },
        { response: 'agree' },
        { response: 'disagree' },
        { response: 'abstain' },
      ];
      const result = computeTallies('consent', votes as never, []);
      expect(result.method).toBe('consent');
      expect(result.totalVotes).toBe(4);
      expect(result.counts).toEqual({ agree: 2, abstain: 1, disagree: 1, block: 0 });
      expect(result.passed).toBe(true);
    });

    it('fails when there is a block', () => {
      const votes = [
        { response: 'agree' },
        { response: 'block', rationale: 'Safety concern' },
      ];
      const result = computeTallies('consent', votes as never, []);
      expect(result.passed).toBe(false);
      // @ts-expect-error
      expect(result.counts.block).toBe(1);
      expect(result.blocks).toHaveLength(1);
      // @ts-expect-error
      expect(result.blocks[0].rationale).toBe('Safety concern');
    });

    it('passes with zero votes', () => {
      const result = computeTallies('consent', [], []);
      expect(result.passed).toBe(true);
      expect(result.totalVotes).toBe(0);
    });

    it('collects block rationales', () => {
      const votes = [
        { response: 'block', rationale: 'First concern' },
        { response: 'block', rationale: 'Second concern' },
      ];
      const result = computeTallies('consent', votes as never, []);
      expect(result.blocks).toHaveLength(2);
    });
  });

  // ── approval ───────────────────────────────────────────────────────────────

  describe('approval', () => {
    it('counts votes per option correctly', () => {
      const votes = [
        { approved_options: ['opt-a', 'opt-b'] },
        { approved_options: ['opt-a'] },
        { approved_options: ['opt-b', 'opt-c'] },
      ];
      const result = computeTallies('approval', votes as never, THREE_OPTIONS);
      expect(result.method).toBe('approval');
      expect(result.totalVotes).toBe(3);
      // @ts-expect-error
      expect(result.optionCounts['opt-a']).toBe(2);
      // @ts-expect-error
      expect(result.optionCounts['opt-b']).toBe(2);
      // @ts-expect-error
      expect(result.optionCounts['opt-c']).toBe(1);
    });

    it('ranks options by vote count', () => {
      const votes = [
        { approved_options: ['opt-c'] },
        { approved_options: ['opt-c'] },
        { approved_options: ['opt-a'] },
      ];
      const result = computeTallies('approval', votes as never, THREE_OPTIONS);
      // @ts-expect-error
      expect(result.ranked[0].id).toBe('opt-c');
      // @ts-expect-error
      expect(result.winner.id).toBe('opt-c');
    });

    it('returns zero counts for unvoted options', () => {
      const votes = [{ approved_options: ['opt-a'] }];
      const result = computeTallies('approval', votes as never, THREE_OPTIONS);
      // @ts-expect-error
      expect(result.optionCounts['opt-b']).toBe(0);
      // @ts-expect-error
      expect(result.optionCounts['opt-c']).toBe(0);
    });

    it('handles zero votes', () => {
      const result = computeTallies('approval', [], THREE_OPTIONS);
      expect(result.winner).toBeDefined();
      expect(result.totalVotes).toBe(0);
    });
  });

  // ── dot ────────────────────────────────────────────────────────────────────

  describe('dot', () => {
    it('sums dot allocations across voters', () => {
      const votes = [
        { allocations: { 'opt-a': 3, 'opt-b': 2 } },
        { allocations: { 'opt-a': 2, 'opt-c': 3 } },
      ];
      const result = computeTallies('dot', votes as never, THREE_OPTIONS);
      expect(result.method).toBe('dot');
      // @ts-expect-error
      expect(result.optionDots['opt-a']).toBe(5);
      // @ts-expect-error
      expect(result.optionDots['opt-b']).toBe(2);
      // @ts-expect-error
      expect(result.optionDots['opt-c']).toBe(3);
    });

    it('ranks by total dots descending', () => {
      const votes = [
        { allocations: { 'opt-a': 1, 'opt-b': 4 } },
      ];
      const result = computeTallies('dot', votes as never, THREE_OPTIONS);
      // @ts-expect-error
      expect(result.ranked[0].id).toBe('opt-b');
      // @ts-expect-error
      expect(result.winner.id).toBe('opt-b');
    });

    it('handles zero votes', () => {
      const result = computeTallies('dot', [], THREE_OPTIONS);
      // @ts-expect-error
      expect(result.optionDots['opt-a']).toBe(0);
      expect(result.totalVotes).toBe(0);
    });
  });

  // ── score ──────────────────────────────────────────────────────────────────

  describe('score', () => {
    it('averages scores correctly', () => {
      const votes = [
        { scores: { 'opt-a': 4, 'opt-b': 2 } },
        { scores: { 'opt-a': 2, 'opt-b': 4 } },
      ];
      const result = computeTallies('score', votes as never, [OPT_A, OPT_B]);
      // @ts-expect-error
      const optA = result.ranked.find((r: { id?: string }) => r.id === 'opt-a') as { averageScore: number } | undefined;
      // @ts-expect-error
      const optB = result.ranked.find((r: { id?: string }) => r.id === 'opt-b') as { averageScore: number } | undefined;
      expect(optA?.averageScore).toBe(3);
      expect(optB?.averageScore).toBe(3);
    });

    it('rounds averages to 2 decimal places', () => {
      const votes = [
        { scores: { 'opt-a': 1 } },
        { scores: { 'opt-a': 2 } },
        { scores: { 'opt-a': 3 } },
      ];
      const result = computeTallies('score', votes as never, [OPT_A]);
      // @ts-expect-error
      expect(result.ranked[0].averageScore).toBe(2); // (1+2+3)/3 = 2.00
    });

    it('ranks by average score descending', () => {
      const votes = [
        { scores: { 'opt-a': 1, 'opt-b': 5 } },
        { scores: { 'opt-a': 1, 'opt-b': 5 } },
      ];
      const result = computeTallies('score', votes as never, [OPT_A, OPT_B]);
      // @ts-expect-error
      expect(result.ranked[0].id).toBe('opt-b');
      // @ts-expect-error
      expect(result.winner.id).toBe('opt-b');
    });

    it('gives 0 average to options with no scores', () => {
      const votes = [{ scores: { 'opt-a': 5 } }];
      const result = computeTallies('score', votes as never, [OPT_A, OPT_B]);
      // @ts-expect-error
      const optB = result.ranked.find((r: { id?: string }) => r.id === 'opt-b') as { averageScore: number } | undefined;
      expect(optB?.averageScore).toBe(0);
    });
  });

  // ── simple_majority ────────────────────────────────────────────────────────

  describe('simple_majority', () => {
    it('passes when yes > no', () => {
      const votes = [
        { response: 'yes' },
        { response: 'yes' },
        { response: 'no' },
      ];
      const result = computeTallies('simple_majority', votes as never, []);
      expect(result.counts).toEqual({ yes: 2, no: 1, abstain: 0 });
      expect(result.passed).toBe(true);
    });

    it('fails when no >= yes', () => {
      const votes = [
        { response: 'yes' },
        { response: 'no' },
      ];
      const result = computeTallies('simple_majority', votes as never, []);
      expect(result.passed).toBe(false);
    });

    it('fails on tie (yes === no)', () => {
      const votes = [
        { response: 'yes' },
        { response: 'no' },
        { response: 'abstain' },
      ];
      const result = computeTallies('simple_majority', votes as never, []);
      expect(result.passed).toBe(false);
    });

    it('handles all abstain votes', () => {
      const votes = [
        { response: 'abstain' },
        { response: 'abstain' },
      ];
      const result = computeTallies('simple_majority', votes as never, []);
      // @ts-expect-error
      expect(result.counts.abstain).toBe(2);
      expect(result.passed).toBe(false);
    });

    it('handles zero votes', () => {
      const result = computeTallies('simple_majority', [], []);
      expect(result.passed).toBe(false);
      expect(result.totalVotes).toBe(0);
    });
  });

  // ── ranked_choice (Borda count) ────────────────────────────────────────────

  describe('ranked_choice', () => {
    it('awards N-1 points for 1st place with N options', () => {
      // With 3 options: 1st gets 2 pts, 2nd gets 1 pt, 3rd gets 0 pts
      const votes = [{ ranking: ['opt-a', 'opt-b', 'opt-c'] }];
      const result = computeTallies('ranked_choice', votes as never, THREE_OPTIONS);
      expect(result.method).toBe('ranked_choice');
      // @ts-expect-error
      expect(result.bordaPoints['opt-a']).toBe(2);
      // @ts-expect-error
      expect(result.bordaPoints['opt-b']).toBe(1);
      // @ts-expect-error
      expect(result.bordaPoints['opt-c']).toBe(0);
    });

    it('aggregates Borda points across multiple voters', () => {
      const votes = [
        { ranking: ['opt-a', 'opt-b', 'opt-c'] }, // opt-a: 2, opt-b: 1, opt-c: 0
        { ranking: ['opt-b', 'opt-a', 'opt-c'] }, // opt-a: 1, opt-b: 2, opt-c: 0
        { ranking: ['opt-c', 'opt-a', 'opt-b'] }, // opt-a: 1, opt-b: 0, opt-c: 2
      ];
      const result = computeTallies('ranked_choice', votes as never, THREE_OPTIONS);
      // opt-a: 2+1+1=4, opt-b: 1+2+0=3, opt-c: 0+0+2=2
      // @ts-expect-error
      expect(result.bordaPoints['opt-a']).toBe(4);
      // @ts-expect-error
      expect(result.bordaPoints['opt-b']).toBe(3);
      // @ts-expect-error
      expect(result.bordaPoints['opt-c']).toBe(2);
      // @ts-expect-error
      expect(result.winner.id).toBe('opt-a');
    });

    it('ranks options by Borda score descending', () => {
      const votes = [
        { ranking: ['opt-c', 'opt-b', 'opt-a'] },
        { ranking: ['opt-c', 'opt-a', 'opt-b'] },
      ];
      const result = computeTallies('ranked_choice', votes as never, THREE_OPTIONS);
      // @ts-expect-error
      expect(result.ranked[0].id).toBe('opt-c');
      // @ts-expect-error
      expect(result.winner.id).toBe('opt-c');
    });

    it('computes maxPossiblePoints = voters × (N-1)', () => {
      const votes = [
        { ranking: ['opt-a', 'opt-b'] },
        { ranking: ['opt-a', 'opt-b'] },
      ];
      const result = computeTallies('ranked_choice', votes as never, [OPT_A, OPT_B]);
      // With 2 options and 2 voters: max = 2 voters × (2-1) = 2
      expect(result.maxPossiblePoints).toBe(2);
    });

    it('handles zero votes', () => {
      const result = computeTallies('ranked_choice', [], THREE_OPTIONS);
      expect(result.totalVotes).toBe(0);
      // @ts-expect-error
      expect(result.bordaPoints['opt-a']).toBe(0);
      expect(result.maxPossiblePoints).toBe(0);
    });

    it('ignores positions beyond the declared options', () => {
      // Voter ranks only 2 of 3 options
      const votes = [{ ranking: ['opt-a', 'opt-b'] }];
      const result = computeTallies('ranked_choice', votes as never, THREE_OPTIONS);
      // opt-c should get 0 points (not ranked)
      // @ts-expect-error
      expect(result.bordaPoints['opt-c']).toBe(0);
    });
  });
});
