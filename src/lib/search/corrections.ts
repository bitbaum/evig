/**
 * Typo tolerance for a search that runs in Postgres (full-text or ILIKE).
 *
 * Neither forgives a slip: "Thinkpda" finds no ThinkPad, "Mülller" no Müller.
 * The forgiving part does not have to live in the database. Keep the words
 * the collection actually contains (cached, refreshed every few minutes), and
 * for each typed word it does NOT contain, send along the words within
 * @bitbaum/searchkit's typo budget (none under 4 letters, one from 4, two
 * from 8; a swap counts once) and the words it is the start of. The query
 * itself stays as it was, so recall only grows.
 *
 * A typed word the collection already has is taken as meant: "ipad" must not
 * also fetch every "iPod". It is only sent along as stored, umlauts and all,
 * because ILIKE does not fold accents ("zurich" must find "Zürich").
 */
import { candidates, createVocabulary, fold, type Vocabulary } from '@bitbaum/searchkit';
import { sql, type SQL } from 'drizzle-orm';
import { logger } from '@/lib/logger';

/** A word as the database sees it: a run of letters and digits ("ThinkPad", "T480"). */
const WORD = /[\p{L}\p{N}]+/gu;

export interface CorrectedWord {
  /** The word as typed, lower-cased. */
  word: string;
  /** Words of the collection it could mean, spelled as stored (umlauts kept). */
  corrections: string[];
}

interface Loaded {
  at: number;
  vocab: Vocabulary;
  /** Folded word → its spellings in the collection, lower-cased ("muller" → "müller"). */
  spellings: Map<string, Set<string>>;
}

export interface CorrectorOptions {
  /** Refresh the vocabulary after this long. Default 5 minutes. */
  ttlMs?: number;
  /** At most this many corrections per typed word. Default 3. */
  perWord?: number;
  /** Name for the log line when loading fails. */
  name?: string;
}

/** Below this many letters a typed word is not completed ("ap" would be half the catalogue). */
const MIN_COMPLETION_LENGTH = 3;

/**
 * The collection's words a typed word it lacks could mean: within the typo
 * budget, or — while still being typed — the words it starts ("macb" →
 * "macbook"), since a database matches whole words only. Best first.
 */
function meant(vocab: Vocabulary, typed: string, limit: number): string[] {
  const completing = Array.from(typed).length >= MIN_COMPLETION_LENGTH;
  return candidates(vocab, typed, { prefix: completing, limit: limit + 1 })
    .filter((c) => c.term !== typed)
    .slice(0, limit)
    .map((c) => c.term);
}

/** The typed words, lower-cased, in order, without repeats. */
export function typedWords(query: string): string[] {
  return [...new Set(query.toLowerCase().match(WORD) ?? [])];
}

function build(texts: Iterable<string | null | undefined>): Omit<Loaded, 'at'> {
  const counts = new Map<string, number>();
  const spellings = new Map<string, Set<string>>();
  for (const text of texts) {
    for (const word of text?.toLowerCase().match(WORD) ?? []) {
      const key = fold(word);
      counts.set(key, (counts.get(key) ?? 0) + 1);
      const seen = spellings.get(key) ?? new Set<string>();
      seen.add(word);
      spellings.set(key, seen);
    }
  }
  return { vocab: createVocabulary(counts), spellings };
}

/**
 * A corrector over the texts `load` returns (titles, names — the words people
 * search FOR, not long descriptions, whose every word would be a candidate).
 * When loading fails the search runs exactly as typed.
 */
export function createCorrector(
  load: () => Promise<Iterable<string | null | undefined>>,
  { ttlMs = 5 * 60_000, perWord = 3, name = 'search' }: CorrectorOptions = {},
) {
  let loaded: Loaded | null = null;
  let pending: Promise<Loaded> | null = null;

  async function current(): Promise<Loaded> {
    if (loaded && Date.now() - loaded.at < ttlMs) return loaded;
    pending ??= load()
      .then((texts) => (loaded = { at: Date.now(), ...build(texts) }))
      .finally(() => {
        pending = null;
      });
    return pending;
  }

  return {
    async correct(query: string): Promise<CorrectedWord[]> {
      const words = typedWords(query);
      if (words.length === 0) return [];
      let state: Loaded;
      try {
        state = await current();
      } catch (error) {
        logger.warn('search vocabulary failed to load; searching as typed', { name, error });
        return words.map((word) => ({ word, corrections: [] }));
      }
      const spelt = (term: string) => [...(state.spellings.get(term) ?? [term])];
      return words.map((word) => {
        const key = fold(word);
        // Known word: only its stored spellings, for a backend that does not
        // fold accents ("zurich" → "zürich" for an ILIKE).
        const terms = state.vocab.counts.has(key) ? [key] : meant(state.vocab, key, perWord);
        return { word, corrections: terms.flatMap(spelt).filter((t) => t !== word) };
      });
    },
  };
}

/** Every correction of every word, once. */
export function allCorrections(words: readonly CorrectedWord[]): string[] {
  return [...new Set(words.flatMap((w) => w.corrections))];
}

/** `%term%` for ILIKE, with the wildcard characters of `term` escaped. */
export function containsPattern(term: string): string {
  return `%${term.replace(/[%_\\]/g, (c) => `\\${c}`)}%`;
}

/** `column ILIKE ANY(patterns)` — what was typed, or any of its corrections. */
export function ilikeAny(column: SQL, patterns: readonly string[]): SQL {
  return sql`${column} ILIKE ANY(ARRAY[${sql.join(
    patterns.map((p) => sql`${p}`),
    sql`, `,
  )}]::text[])`;
}
