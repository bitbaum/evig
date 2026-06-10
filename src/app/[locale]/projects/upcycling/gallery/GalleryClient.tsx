'use client'

import { useMemo, useState } from 'react'
import { useTranslations } from 'next-intl'
import Image from 'next/image'
import { ArrowRight } from 'lucide-react'
import {
  MonitorLampPlaceholder,
  type MonitorLampPlaceholderVariant,
} from '../MonitorLampPlaceholder'
import { cn } from '@/lib/utils'

/**
 * Gallery — every finished piece in one bento-style mosaic, filterable
 * across the functional ↔ art spectrum.
 *
 * The piece registry below is structural metadata (model + tier + lamp
 * variant) — not i18n, because none of it is text. The only translated
 * surface is tier labels (reused from the gallery message namespace).
 *
 * Until real photography lands, every item renders as a
 * <MonitorLampPlaceholder> with a deterministic seed so each card stays
 * visually distinct across SSR / hydration.
 *
 * Layout: a featured spotlight at the top, then a 6-column bento grid
 * where occasional cards span 2 cols × 2 rows for rhythm. The grid
 * collapses gracefully on small viewports.
 */

type Tier = 'functional' | 'decor' | 'art'
type Filter = Tier | 'all'

type Piece = {
  id: string
  model: string
  tier: Tier
  variant: MonitorLampPlaceholderVariant
  seed: number
  /** When real photography is dropped into public/projects/upcycling/gallery/,
   *  set this to the filename and the card renders the JPG instead of the
   *  generative SVG placeholder. See PROMPTS.md in that folder. */
  image?: string
}

type GalleryMessages = {
  eyebrow: string
  title: string
  intro: string
  filterLabel: string
  filters: { all: string; functional: string; decor: string; art: string }
  empty: string
  placeholderNote: string
}

const PIECES: Piece[] = [
  { id: 'lenovo-l2251pwd-04', model: 'Lenovo L2251pwd', tier: 'art',        variant: 'art',        seed: 301, image: 'spotlight-lenovo-l2251pwd-art.jpg' },
  { id: 'lenovo-l2251pwd-01', model: 'Lenovo L2251pwd', tier: 'functional', variant: 'functional', seed: 101, image: 'lenovo-l2251pwd-functional-1.jpg' },
  { id: 'lenovo-l2251pwd-02', model: 'Lenovo L2251pwd', tier: 'functional', variant: 'functional', seed: 102, image: 'lenovo-l2251pwd-functional-2.jpg' },
  { id: 'lenovo-l2251pwd-03', model: 'Lenovo L2251pwd', tier: 'decor',      variant: 'warm',       seed: 201, image: 'lenovo-l2251pwd-decor-warm.jpg' },
  { id: 'dell-u2412m-01',     model: 'Dell U2412M',     tier: 'functional', variant: 'cool',       seed: 103, image: 'dell-u2412m-functional.jpg' },
  { id: 'hp-l2245wg-01',      model: 'HP L2245wg',      tier: 'decor',      variant: 'warm',       seed: 202, image: 'hp-l2245wg-decor.jpg' },
  { id: 'samsung-s24-01',     model: 'Samsung S24',     tier: 'decor',      variant: 'warm',       seed: 203, image: 'samsung-s24-decor.jpg' },
  { id: 'asus-mx259h-01',     model: 'Asus MX259H',     tier: 'art',        variant: 'art',        seed: 302, image: 'asus-mx259h-art.jpg' },
  { id: 'eizo-flexscan-01',   model: 'Eizo FlexScan',   tier: 'art',        variant: 'cool',       seed: 303, image: 'eizo-flexscan-art.jpg' },
]

const FILTERS: Filter[] = ['all', 'functional', 'decor', 'art']

/**
 * Bento sizing pattern by visible index. The grid is 2-col on sm and 4-col
 * on lg; defaults span 1 column. Two accents per period — a 2×2 feature at
 * slot 2 and a wide row at slot 5 — pull the eye without leaving holes.
 *
 * The container sets `grid-auto-flow: dense` so any residual gap is filled
 * by a later smaller item rather than left empty.
 */
function bentoSpan(i: number): string {
  const slot = i % 8
  if (slot === 2) return 'col-span-2 row-span-2'   // feature: 2×2
  if (slot === 5) return 'col-span-2'              // wide row
  return ''                                         // default: 1×1
}

export function GalleryClient() {
  const t = useTranslations('projects')
  const m = t.raw('upcycling.gallery') as GalleryMessages
  const [filter, setFilter] = useState<Filter>('all')

  const visible = useMemo(
    () => (filter === 'all' ? PIECES : PIECES.filter((p) => p.tier === filter)),
    [filter],
  )

  // When "all" is selected we promote the first piece as the featured
  // spotlight above the grid. Under a tier filter the spotlight would
  // feel arbitrary — every card stays the same size.
  const [spotlight, rest] = filter === 'all' && visible.length > 0
    ? [visible[0], visible.slice(1)]
    : [null, visible]

  return (
    <article className="bg-canvas">
      <header className="border-b border-subtle bg-surface-base">
        <div className="mx-auto max-w-5xl px-4 pb-10 pt-12 sm:px-6 sm:pb-14 sm:pt-16 lg:px-8">
          <div className="ui-public-eyebrow">{m.eyebrow}</div>
          <h1 className="ui-public-display-lg mt-3">{m.title}</h1>
          <p className="ui-public-section-lede mt-4">{m.intro}</p>
        </div>
      </header>

      {/* Segmented filter pill — single rounded chrome, segments inside it. */}
      <div className="sticky top-12 z-20 border-b border-subtle bg-surface-base/90 backdrop-blur supports-[backdrop-filter]:bg-surface-base/75 sm:top-14">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-3 px-4 py-3 sm:px-6 lg:px-8">
          <span className="ui-public-eyebrow mr-1">{m.filterLabel}</span>
          <div role="radiogroup" aria-label={m.filterLabel} className="inline-flex rounded-full border border-default bg-surface-raised p-0.5">
            {FILTERS.map((f) => {
              const active = filter === f
              return (
                // eslint-disable-next-line no-restricted-syntax -- segmented-pill chip; the shared <Button> primitive enforces a different button shape that breaks the inline radiogroup layout. Follow-up: extract a <SegmentedControl> primitive.
                <button
                  key={f}
                  type="button"
                  role="radio"
                  onClick={() => setFilter(f)}
                  className={cn(
                    'inline-flex min-h-[36px] items-center rounded-full px-3.5 text-xs font-medium transition-colors sm:text-sm',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-action',
                    active
                      ? 'bg-action text-white'
                      : 'text-text-tertiary hover:text-text-primary',
                  )}
                  aria-checked={active}
                >
                  {m.filters[f]}
                </button>
              )
            })}
          </div>
          <span className="ml-auto font-mono text-xs tabular-nums text-text-tertiary">
            {visible.length} / {PIECES.length}
          </span>
        </div>
      </div>

      <section>
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
          {spotlight && <Spotlight piece={spotlight} tierLabel={m.filters[spotlight.tier]} />}

          {rest.length > 0 && (
            <div className="mt-10 grid grid-cols-2 gap-4 [grid-auto-flow:dense] sm:gap-5 lg:grid-cols-4">
              {rest.map((piece, i) => (
                <PieceCard
                  key={piece.id}
                  piece={piece}
                  tierLabel={m.filters[piece.tier]}
                  spanClass={bentoSpan(i)}
                />
              ))}
            </div>
          )}

          {visible.length === 0 && (
            <p className="py-16 text-center text-sm text-text-tertiary">{m.empty}</p>
          )}
        </div>
      </section>

      <section className="border-t border-subtle bg-surface-raised">
        <div className="mx-auto max-w-3xl px-4 py-12 text-center sm:px-6 lg:px-8">
          <p className="text-sm text-text-tertiary">{m.placeholderNote}</p>
        </div>
      </section>
    </article>
  )
}

/* ─── PieceVisual ────────────────────────────────────────────────────
 * Either renders the real JPG (when present in
 * public/projects/upcycling/gallery/) or falls back to the generative
 * SVG placeholder. Each card decides independently — so the gallery
 * can light up image-by-image as photography arrives, no all-or-nothing.
 *
 * Why client-side fallback: the JPG might be missing in dev or on
 * branches where photography hasn't shipped yet. next/image will
 * trigger onError; we swap to the SVG so we never show a broken icon.
 */
function PieceVisual({ piece, sizes }: { piece: Piece; sizes: string }) {
  const [failed, setFailed] = useState(false)
  if (!piece.image || failed) {
    return (
      <MonitorLampPlaceholder
        variant={piece.variant}
        seed={piece.seed}
        className="h-full w-full"
      />
    )
  }
  return (
    <Image
      src={`/projects/upcycling/gallery/${piece.image}`}
      alt={piece.model}
      fill
      sizes={sizes}
      className="object-cover"
      onError={() => setFailed(true)}
    />
  )
}

/* ─── Spotlight ──────────────────────────────────────────────────────
 * The opening piece. Larger frame, wider aspect, paired with the model
 * name and tier label. No per-piece prose: we don't have translated
 * copy per gallery item, and the placement + scale already signal
 * "featured" — no English "Spotlight" tag needed.
 */
function Spotlight({ piece, tierLabel }: { piece: Piece; tierLabel: string }) {
  return (
    <section
      aria-label={piece.model}
      className="grid gap-6 sm:gap-8 lg:grid-cols-[1.6fr_1fr] lg:items-center"
    >
      <figure className="relative aspect-[16/10] overflow-hidden rounded-2xl border border-subtle bg-surface-base">
        <PieceVisual piece={piece} sizes="(min-width: 1024px) 60vw, 100vw" />
      </figure>
      <div className="flex items-baseline gap-3 lg:flex-col lg:items-start lg:gap-4">
        <span aria-hidden="true" className="h-px w-8 bg-action lg:w-12" />
        <div>
          <div className="font-mono text-xs uppercase tracking-[0.22em] text-text-tertiary">
            {tierLabel}
          </div>
          <h2 className="ui-public-display-md mt-2 lg:mt-4">{piece.model}</h2>
        </div>
      </div>
    </section>
  )
}

/* ─── PieceCard ──────────────────────────────────────────────────────
 * A single grid item. The bento sizing class is supplied by the caller
 * (so the grid pattern is one piece of logic, not duplicated per card).
 */
function PieceCard({
  piece,
  tierLabel,
  spanClass,
}: {
  piece: Piece
  tierLabel: string
  spanClass: string
}) {
  return (
    <figure
      className={cn(
        'group relative overflow-hidden rounded-xl border border-subtle bg-surface-base transition-all duration-300',
        'hover:-translate-y-0.5 hover:border-default',
        spanClass,
      )}
    >
      <div className="relative aspect-[4/3] sm:h-full sm:aspect-auto">
        <PieceVisual piece={piece} sizes="(min-width: 1024px) 25vw, 50vw" />
      </div>

      {/* Floating caption — sits on the lamp surface bottom-left,
          revealed/intensified on hover. Discipline: only neutral chrome
          (black/white with alpha — no off-palette colour). */}
      <figcaption className="pointer-events-none absolute inset-x-0 bottom-0 flex items-end justify-between gap-3 bg-gradient-to-t from-black/55 to-transparent p-4">
        <div>
          <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-white/70">
            {tierLabel}
          </div>
          <div className="mt-0.5 text-sm font-medium text-white">{piece.model}</div>
        </div>
        <ArrowRight
          className="h-4 w-4 translate-x-0 text-white/60 opacity-0 transition-all group-hover:translate-x-0.5 group-hover:opacity-100"
          aria-hidden="true"
        />
      </figcaption>
    </figure>
  )
}
