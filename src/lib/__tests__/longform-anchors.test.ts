/**
 * Anchor stability for published posts.
 *
 * Heading ids ARE the site's `#anchor` URLs. Every one of them is linked from
 * somewhere we do not control — other posts, bookmarks, shared links — so a
 * changed id is a broken inbound link that nothing 404s on: the reader just
 * lands at the top of the page.
 *
 * evig deliberately does NOT use bip-kit's default (ASCII, `Kanäle` →
 * `kanaele`); it passes `unicodeSlugify` so `ä`, 日本語, кириллица and 한국어
 * headings keep their own script. These pins are the contract. If one fails,
 * the slug policy moved and every anchor on the blog moved with it — that is
 * a URL migration, not a refactor.
 */
import { describe, it, expect } from 'vitest';
import { parseLongform } from '@/lib/longform/parse';

describe('published anchor ids', () => {
  it('keeps German umlauts rather than transliterating them', () => {
    const { toc, blocks } = parseLongform('## Ein Eingang, vier Kanäle\n\ntext');
    // The live anchor on the de post. NOT `ein-eingang-vier-kanaele`.
    expect(toc[0].id).toBe('ein-eingang-vier-kanäle');
    expect(blocks[0]).toMatchObject({ type: 'h2', id: 'ein-eingang-vier-kanäle' });
    expect(parseLongform('## Geräte').toc[0].id).toBe('geräte');
  });

  it('keeps non-Latin scripts instead of collapsing them to section-N', () => {
    // Under bip-kit's ASCII default every one of these is `section`,
    // `section-2`, … — which is why the policy is passed explicitly.
    expect(parseLongform('## 日本語のはなし').toc[0].id).toBe('日本語のはなし');
    expect(parseLongform('## Один вход').toc[0].id).toBe('один-вход');
    expect(parseLongform('## 하나의 입구').toc[0].id).toBe('하나의-입구');
  });

  it('gives the heading block and its TOC entry the SAME id', () => {
    // One policy drives both (bip-kit's slug seam). This used to be two
    // passes over the same blocks, which is how the two could disagree.
    const { blocks, toc } = parseLongform(
      '## Kanäle\n\ntext\n\n### Geräte\n\n#### 日本語\n\n## Kanäle',
    );
    const blockIds = blocks
      .filter((b) => b.type === 'h2' || b.type === 'h3' || b.type === 'h4')
      .map((b) => b.id);
    expect(toc.map((e) => e.id)).toEqual(blockIds);
  });

  it('de-duplicates repeated headings the way published anchors already are', () => {
    const { toc } = parseLongform('## Kanäle\n\n## Kanäle\n\n## Kanäle');
    expect(toc.map((e) => e.id)).toEqual(['kanäle', 'kanäle-2', 'kanäle-3']);
  });

  it('still yields a usable id for a heading that strips to nothing', () => {
    expect(parseLongform('## !!!\n\n## ???').toc.map((e) => e.id)).toEqual([
      'section',
      'section-2',
    ]);
  });

  it('exposes h2/h3 only in the TOC rail, with markers stripped', () => {
    const { tocHeadings } = parseLongform('## `Kanäle`\n\n### *Geräte*\n\n#### Tief');
    expect(tocHeadings).toEqual([
      { id: 'kanäle', text: 'Kanäle', level: 2 },
      { id: 'geräte', text: 'Geräte', level: 3 },
    ]);
  });
});
