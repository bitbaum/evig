import { Highlight } from '@bitbaum/searchkit/react';
import type { Range } from '@/lib/search/list-search';

/**
 * A search result's text with what matched picked out — typo matches too
 * ("mcbook" marks "MacBook"). The one mark style for every search surface;
 * it inherits the row's colour so it reads on an active (action-tinted) row.
 */
export function SearchHighlight({ text, ranges }: { text: string; ranges?: readonly Range[] }) {
  return (
    <Highlight
      text={text}
      ranges={ranges ?? []}
      markClassName="bg-transparent font-semibold text-inherit underline decoration-action underline-offset-2"
    />
  );
}
