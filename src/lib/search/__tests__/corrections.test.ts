/**
 * @vitest-environment node
 *
 * Behaviors locked:
 *   createCorrector — typo tolerance handed to Postgres (marketplace FTS,
 *   technician directory, admin ⌘K)
 *   - a typed word the collection lacks is widened with the words it could mean
 *   - a word the collection has is not widened (ipad ≠ ipod), only sent along
 *     as stored when its spelling differs (zurich → zürich, for ILIKE)
 *   - the vocabulary is loaded once and refreshed after the TTL
 *   - a failed load degrades to searching as typed
 *   - every one-slip misspelling of a realistic title list is corrected back
 *   containsPattern — LIKE wildcards in typed text are escaped
 */
import { evaluate, typoCases } from '@bitbaum/searchkit';
import { allCorrections, containsPattern, createCorrector, typedWords } from '../corrections';

vi.mock('@/lib/logger', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}));

const TITLES = [
  'Lenovo ThinkPad T480 Notebook',
  'Apple MacBook Air 13 Zoll',
  'Dell Latitude 7490 Laptop',
  'HP EliteBook 840 G5',
  'Samsung Galaxy Tablet',
  'Logitech Tastatur kabellos',
  'Fujitsu Monitor 24 Zoll',
  'Brother Laserdrucker',
  'Apple iPad 9. Generation',
  'Apple iPod Classic',
  'Velo-Computer Zürich',
];

const corrector = (load = async () => TITLES) => createCorrector(load);

describe('createCorrector', () => {
  it('widens a mistyped word with the words it could mean', async () => {
    const words = await corrector().correct('Thinkpda T480');
    expect(words).toEqual([
      { word: 'thinkpda', corrections: ['thinkpad'] },
      { word: 't480', corrections: [] },
    ]);
  });

  it('leaves a word the collection has alone', async () => {
    expect(allCorrections(await corrector().correct('ipad'))).toEqual([]);
    expect(allCorrections(await corrector().correct('latitude'))).toEqual([]);
  });

  it('sends a known word as stored when accents differ, and spelled-out umlauts back', async () => {
    expect(allCorrections(await corrector().correct('zurich'))).toEqual(['zürich']);
    expect(allCorrections(await corrector().correct('zuerich'))).toEqual(['zürich']);
  });

  it('loads the vocabulary once, then refreshes it after the TTL', async () => {
    vi.useFakeTimers();
    try {
      const load = vi.fn(async () => TITLES);
      const c = createCorrector(load, { ttlMs: 1000 });
      await Promise.all([c.correct('macbok'), c.correct('tastatru')]);
      expect(load).toHaveBeenCalledTimes(1);
      vi.advanceTimersByTime(1001);
      await c.correct('macbok');
      expect(load).toHaveBeenCalledTimes(2);
    } finally {
      vi.useRealTimers();
    }
  });

  it('searches as typed when the vocabulary cannot be loaded', async () => {
    const c = createCorrector(async () => {
      throw new Error('db down');
    });
    expect(await c.correct('Thinkpda')).toEqual([{ word: 'thinkpda', corrections: [] }]);
  });

  it('corrects every one-slip misspelling of a title word back', async () => {
    const c = corrector();
    // The words people type, as the database splits them ("ThinkPad", "T480").
    const names = TITLES.flatMap((title) => typedWords(title)).map((w) => ({ id: w, name: w }));
    const cases = typoCases(names);
    const report = await evaluate(cases, async (query) => {
      const [word] = await c.correct(query);
      return word!.corrections.length > 0 ? word!.corrections : [word!.word];
    });
    expect(cases.length).toBeGreaterThan(1000);
    // Every correction is sent to the database (OR), so what counts is that
    // the meant word is among them: recall, not first place.
    expect(report.misses).toEqual([]);
    expect(report.successAt3).toBe(1);
  });
});

describe('typedWords', () => {
  it('splits like the database does, lower-cased, without repeats', () => {
    expect(typedWords('ThinkPad T480, thinkpad')).toEqual(['thinkpad', 't480']);
  });
});

describe('containsPattern', () => {
  it('escapes LIKE wildcards', () => {
    expect(containsPattern('100%_a\\b')).toBe('%100\\%\\_a\\\\b%');
  });
});
