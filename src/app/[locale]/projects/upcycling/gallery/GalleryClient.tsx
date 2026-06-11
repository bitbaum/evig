'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import Image from 'next/image'
import { Link } from '@/i18n/navigation'
import { ArrowRight } from 'lucide-react'
import {
  MonitorLampPlaceholder,
  type MonitorLampPlaceholderVariant,
} from '../MonitorLampPlaceholder'

/**
 * Gallery — honest split between documented retrofits and queued models.
 *
 * Previously this was a 13-piece bento mixing 1 real photo (Lenovo
 * L2251pwd) with 12 procedural SVG placeholders, filterable as
 * "functional / decor". The June 2026 audit flagged this as overstating
 * visual progress — businessplan status says "12 erfolgreich umgebaute
 * Modelle" but only one has photo evidence. The filter was also
 * meaningless: with no real photos, "functional vs decor" classified
 * nothing observable.
 *
 * Now: a single Spotlight for the one documented piece (with a CTA to its
 * guide), followed by a clearly-labeled "queued" section of placeholder
 * cards, ending with a "help us photograph" call to action. As soon as a
 * second model gets real photos + a guide, it moves from queued to
 * documented and the spotlight pattern handles N>1 too.
 */

type Tier = 'functional' | 'decor'

type Piece = {
  id: string
  model: string
  tier: Tier
  variant: MonitorLampPlaceholderVariant
  seed: number
  /** When real photography is dropped into public/projects/upcycling/gallery/,
   *  set this to the filename and the card renders the JPG instead of the
   *  generative SVG placeholder. See REAL_PHOTOS.md in that folder. */
  image?: string
  /** Optional looping video (mp4) that plays in place of the still image.
   *  When set, `image` is used as the video poster so something is on screen
   *  before the video buffers. */
  video?: string
  /** Locale-prefixed href to the model-specific guide. Present only when
   *  `image` is also set — a placeholder card has nowhere to link to. */
  guideHref?: string
}

type GalleryMessages = {
  eyebrow: string
  title: string
  intro: string
  documented: { title: string; cta: string }
  queued: { title: string; intro: string }
  help: { eyebrow: string; title: string; body: string; cta: string }
  empty: string
  placeholderNote: string
}

/**
 * The 12 monitor models that have been successfully retrofitted to lamps,
 * sourced from `Recreazzz_Anleitungen_zu_Umbau/! Infos zu umgebautenModellen.md`
 * (revamp-it / ReCreaZZZ, 2025-02-26). Only the Lenovo L2251pwd has real
 * production photos (May 2026); the rest fall back to the SVG placeholder
 * until photography lands. Tier is intentionally heuristic — until real
 * photography exists, all entries use the `functional` cool-neutral
 * placeholder palette.
 */
const PIECES: Piece[] = [
  { id: 'lenovo-l2251pwd',        model: 'Lenovo L2251pwd',        tier: 'functional', variant: 'functional', seed: 101, image: 'lenovo-l2251pwd-finished-poster.jpg', video: 'lenovo-l2251pwd-finished.mp4', guideHref: '/projects/upcycling/lenovo-l2251pwd' },
  { id: 'nec-multisync-e233-wmi', model: 'NEC Multisync E233 WMi', tier: 'functional', variant: 'functional', seed: 102 },
  { id: 'lenovo-t2254a',          model: 'Lenovo T2254A',          tier: 'functional', variant: 'functional', seed: 103 },
  { id: 'lenovo-24',              model: 'Lenovo 24"',             tier: 'functional', variant: 'functional', seed: 104 },
  { id: 'dell-u2312hmt',          model: 'DELL U2312HMt',          tier: 'functional', variant: 'cool',       seed: 105 },
  { id: 'dell-u2412m',            model: 'DELL U2412M',            tier: 'functional', variant: 'cool',       seed: 106 },
  { id: 'dell-u2713hb',           model: 'DELL U2713Hb',           tier: 'functional', variant: 'cool',       seed: 107 },
  { id: 'dell-p2418d',            model: 'DELL P2418D',            tier: 'functional', variant: 'cool',       seed: 108 },
  { id: 'hp-elite-display-e242',  model: 'HP EliteDisplay E242',   tier: 'functional', variant: 'warm',       seed: 109 },
  { id: 'hp-e24i-g4',             model: 'HP E24i G4',             tier: 'functional', variant: 'warm',       seed: 110 },
  { id: 'hp-e243m',               model: 'HP E243m',               tier: 'functional', variant: 'warm',       seed: 111 },
  { id: 'asus-v247',              model: 'ASUS V247',              tier: 'decor',      variant: 'warm',       seed: 112 },
  { id: 'eizo-ev2315w',           model: 'EIZO EV2315W',           tier: 'decor',      variant: 'cool',       seed: 113 },
]

export function GalleryClient() {
  const t = useTranslations('projects')
  const m = t.raw('upcycling.gallery') as GalleryMessages

  // Split by evidence — pieces with real photography go to the spotlight strip
  // ("documented"); the rest stay as honest placeholders in the queued grid.
  // No filter UI: with one real photo, faceting by tier was meaningless.
  const documented = PIECES.filter((p) => !!p.image)
  const queued = PIECES.filter((p) => !p.image)

  return (
    <article className="bg-canvas">
      <header className="border-b border-subtle bg-surface-base">
        <div className="mx-auto max-w-5xl px-4 pb-10 pt-12 sm:px-6 sm:pb-14 sm:pt-16 lg:px-8">
          <div className="ui-public-eyebrow">{m.eyebrow}</div>
          <h1 className="ui-public-display-lg mt-3">{m.title}</h1>
          <p className="ui-public-section-lede mt-4">{m.intro}</p>
          <p className="mt-3 font-mono text-xs uppercase tracking-[0.18em] text-text-tertiary">
            {documented.length} · {queued.length}
          </p>
        </div>
      </header>

      {/* Documented — pieces with real photo/video + a model-specific guide. */}
      {documented.length > 0 && (
        <section aria-labelledby="gallery-documented-title" className="border-b border-subtle">
          <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
            <div className="ui-public-eyebrow">{m.documented.title}</div>
            <div className="mt-6 grid gap-8 sm:gap-10 lg:grid-cols-2">
              {documented.map((piece) => (
                <DocumentedPiece key={piece.id} piece={piece} ctaLabel={m.documented.cta} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Queued — honest about visual evidence: placeholder, model name only. */}
      {queued.length > 0 && (
        <section aria-labelledby="gallery-queued-title" className="border-b border-subtle bg-surface-raised">
          <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
            <div className="ui-public-eyebrow">{m.queued.title}</div>
            <p className="ui-public-section-lede mt-3 max-w-3xl">{m.queued.intro}</p>
            <ul className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 sm:gap-5 lg:grid-cols-4">
              {queued.map((piece) => (
                <QueuedCard key={piece.id} piece={piece} />
              ))}
            </ul>
          </div>
        </section>
      )}

      {/* Help-photograph CTA — the actionable exit. */}
      <section aria-labelledby="gallery-help-title" className="bg-canvas">
        <div className="mx-auto max-w-3xl px-4 py-14 text-center sm:px-6 sm:py-20 lg:px-8">
          <div className="ui-public-eyebrow">{m.help.eyebrow}</div>
          <h2 id="gallery-help-title" className="ui-public-display-md mt-3">{m.help.title}</h2>
          <p className="ui-public-section-lede mx-auto mt-4">{m.help.body}</p>
          <Link href="/get-involved" className="ui-public-cta mt-10 inline-flex items-center gap-2">
            {m.help.cta}
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>
      </section>
    </article>
  )
}

/* ─── DocumentedPiece ────────────────────────────────────────────────
 * Spotlight-sized card for a piece with real photo/video AND a guide.
 * The whole card is a link to the guide.
 */
function DocumentedPiece({ piece, ctaLabel }: { piece: Piece; ctaLabel: string }) {
  const body = (
    <>
      <figure className="relative aspect-[16/10] overflow-hidden rounded-2xl border border-subtle bg-surface-base">
        <PieceVisual piece={piece} sizes="(min-width: 1024px) 45vw, 100vw" />
      </figure>
      <div className="mt-5 flex items-baseline justify-between gap-3">
        <h3 className="text-xl font-semibold text-text-primary">{piece.model}</h3>
        <span className="inline-flex items-center gap-1.5 text-sm font-medium text-action group-hover:gap-2 transition-all">
          {ctaLabel}
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </span>
      </div>
    </>
  )
  if (piece.guideHref) {
    return (
      <Link href={piece.guideHref} className="group block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-action focus-visible:rounded-2xl">
        {body}
      </Link>
    )
  }
  return <div>{body}</div>
}

/* ─── QueuedCard ─────────────────────────────────────────────────────
 * Placeholder card for a model without real photography yet. Smaller
 * than DocumentedPiece, no hover affordance, no fake CTA. Honest by
 * design: it's a name + a generative SVG, that's it.
 */
function QueuedCard({ piece }: { piece: Piece }) {
  return (
    <li className="overflow-hidden rounded-xl border border-subtle bg-surface-base">
      <div className="relative aspect-[4/3]">
        <MonitorLampPlaceholder
          variant={piece.variant}
          seed={piece.seed}
          className="absolute inset-0 h-full w-full"
        />
      </div>
      <div className="px-3 py-2 text-xs font-medium text-text-secondary">{piece.model}</div>
    </li>
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
  // Looping demo (mp4) takes priority over the still image when both are set —
  // the still acts as the video poster so something paints before the video
  // buffers. Previously this was a 2.8MB GIF served as a still <Image>;
  // mp4+poster cuts that to ~120KB and renders correctly on iOS.
  if (piece.video) {
    return (
      <video
        src={`/projects/upcycling/gallery/${piece.video}`}
        poster={`/projects/upcycling/gallery/${piece.image}`}
        autoPlay
        muted
        loop
        playsInline
        aria-label={piece.model}
        className="absolute inset-0 h-full w-full object-cover"
        onError={() => setFailed(true)}
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

