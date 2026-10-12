/**
 * Search for every list a person narrows by typing — the ⌘K palettes, the
 * people pickers, the blog, the open-source registry.
 *
 * Matching and ranking are @bitbaum/searchkit's (one slip per word forgiven
 * from four letters, a swap counts once, umlauts fold and are also found
 * spelled out: "mueller" finds "Müller"; a hit in the first field beats one in
 * a later field). This module only adds what German needs on top:
 *
 * searchkit matches the START of a word, so "reparatur" does not find
 * "Computerreparatur". The plain substring rule these lists used before did,
 * so it stays as a fallback: such items still come back, after every ranked
 * hit, in their list order — nothing that matched before stops matching.
 */
import { createSearch, fold, type Range, type SearchSpec } from '@bitbaum/searchkit';

export type { Range, SearchSpec } from '@bitbaum/searchkit';

export interface ListHit<T> {
  item: T;
  /** Matched ranges per field name, for <Highlight>. Empty for a substring-only match. */
  matches: Record<string, Range[]>;
}

type FieldValue = string | readonly string[] | null | undefined;

function fieldText<T>(spec: SearchSpec<T>, item: T): string {
  return fold(
    spec.fields
      .flatMap((field) => {
        const value: FieldValue = field.get(item);
        if (value == null) return [];
        return typeof value === 'string' ? [value] : [...value];
      })
      .join('\n'),
  );
}

/**
 * Index `items` once; returns the search to run per keystroke. An empty query
 * returns every item in list order (no filter).
 */
export function createListSearch<T>(
  items: readonly T[],
  spec: SearchSpec<T>,
): (query: string) => ListHit<T>[] {
  const searcher = createSearch(items, spec);
  const texts = items.map((item) => fieldText(spec, item));
  return (query) => {
    const typed = query.trim();
    if (!typed) return items.map((item) => ({ item, matches: {} }));
    const hits = searcher.search(typed);
    const placed = new Set(hits.map((hit) => hit.index));
    const needle = fold(typed);
    return [
      ...hits.map((hit) => ({ item: hit.item, matches: hit.matches })),
      ...items.flatMap((item, i) =>
        !placed.has(i) && texts[i]!.includes(needle) ? [{ item, matches: {} }] : [],
      ),
    ];
  };
}

/** One-off search of a list, best match first. */
export function searchList<T>(items: readonly T[], spec: SearchSpec<T>, query: string): T[] {
  return createListSearch(items, spec)(query).map((hit) => hit.item);
}

/**
 * The spec for a list of people: the name first, then whatever else tells
 * them apart (an e-mail address, a conversation title).
 */
export function peopleSpec<T>(
  name: (person: T) => string | null | undefined,
  ...more: Array<(person: T) => string | null | undefined>
): SearchSpec<T> {
  return {
    fields: [
      { name: 'name', get: name },
      ...more.map((get, i) => ({ name: `field${i + 1}`, get })),
    ],
  };
}

/**
 * Ranked results kept together by group, the group holding the best hit
 * first. For palettes that render groups while the arrow keys walk the flat
 * list — the two orders must agree.
 */
export function groupByRank<T>(ranked: readonly T[], groupOf: (item: T) => string): T[] {
  const groups = new Map<string, T[]>();
  for (const item of ranked) {
    const group = groupOf(item);
    groups.set(group, [...(groups.get(group) ?? []), item]);
  }
  return [...groups.values()].flat();
}
