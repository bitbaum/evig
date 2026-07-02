'use client'

import { useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'
import Image from 'next/image'
import { Link } from '@/i18n/navigation'
import { ArrowRight } from 'lucide-react'
import { UPCYCLING_GALLERY_ASSET_BASE, UPCYCLING_ROUTES } from '@/config/upcycling-routes'
import {
  splitUpcyclingGalleryPieces,
  type UpcyclingGalleryPiece,
} from '@/data/upcycling-gallery'
import { UPCYCLING_INSTALLATIONS } from '@/data/upcycling-installations'
import type { ApplicationsMessages } from '../applications/ApplicationsExperience'
import { MonitorLampPlaceholder } from '../MonitorLampPlaceholder'

type GalleryMessages = {
  eyebrow: string
  title: string
  intro: string
  statsLine: string
  installsCta: string
  documented: { title: string; cta: string }
  queued: { title: string; intro: string }
  help: { eyebrow: string; title: string; body: string; cta: string }
  empty: string
  placeholderNote: string
}

function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false)
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    const update = () => setReduced(mq.matches)
    update()
    mq.addEventListener('change', update)
    return () => mq.removeEventListener('change', update)
  }, [])
  return reduced
}

export function GalleryClient() {
  const t = useTranslations('projects')
  const m = t.raw('upcycling.gallery') as GalleryMessages
  // Install captions are owned by the Applications page (i18n SSOT) — reuse,
  // don't duplicate. Structure comes from UPCYCLING_INSTALLATIONS (data SSOT).
  const installs = t.raw('upcycling.applications.installs') as ApplicationsMessages['installs']
  const { documented, queued } = splitUpcyclingGalleryPieces()

  return (
    <article className="bg-canvas">
      <header className="border-b border-subtle bg-surface-base">
        <div className="mx-auto max-w-5xl px-4 pb-10 pt-12 sm:px-6 sm:pb-14 sm:pt-16 lg:px-8">
          <div className="ui-public-eyebrow">{m.eyebrow}</div>
          <h1 className="ui-public-display-lg mt-3">{m.title}</h1>
          <p className="ui-public-section-lede mt-4">{m.intro}</p>
          <p className="mt-3 font-mono text-xs uppercase tracking-[0.18em] text-text-tertiary">
            {t('upcycling.gallery.statsLine', {
              documented: documented.length,
              queued: queued.length,
            })}
          </p>
        </div>
      </header>

      <InstallationsStrip installs={installs} ctaLabel={m.installsCta} />

      {documented.length > 0 && (
        <section aria-labelledby="gallery-documented-title" className="border-b border-subtle">
          <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
            <h2 id="gallery-documented-title" className="ui-public-eyebrow">
              {m.documented.title}
            </h2>
            <div className="mt-6 grid gap-8 sm:gap-10 lg:grid-cols-2">
              {documented.map((piece) => (
                <DocumentedPiece key={piece.id} piece={piece} ctaLabel={m.documented.cta} />
              ))}
            </div>
          </div>
        </section>
      )}

      {queued.length > 0 && (
        <section aria-labelledby="gallery-queued-title" className="border-b border-subtle bg-surface-raised">
          <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
            <h2 id="gallery-queued-title" className="ui-public-eyebrow">
              {m.queued.title}
            </h2>
            <p className="ui-public-section-lede mt-3 max-w-3xl">{m.queued.intro}</p>
            <ul className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 sm:gap-5 lg:grid-cols-4">
              {queued.map((piece) => (
                <QueuedCard key={piece.id} piece={piece} />
              ))}
            </ul>
          </div>
        </section>
      )}

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

/* Real-world installations (Juli-2026 shoot) — photographed installs as
 * cards linking to the Applications page, which owns the full field stories.
 * Sits above the model gallery: hung-and-in-use beats studio shots. */
function InstallationsStrip({
  installs,
  ctaLabel,
}: {
  installs: ApplicationsMessages['installs']
  ctaLabel: string
}) {
  const photographed = UPCYCLING_INSTALLATIONS.filter((i) => !!i.image)
  if (!photographed.length) return null

  return (
    <section aria-labelledby="gallery-installs-title" className="border-b border-subtle">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
        <h2 id="gallery-installs-title" className="ui-public-eyebrow">
          {installs.eyebrow}
        </h2>
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {photographed.map((install) => {
            const msg = installs.items[install.id]
            if (!msg) return null
            return (
              <Link
                key={install.id}
                href={UPCYCLING_ROUTES.applications}
                className="group overflow-hidden rounded-xl border border-subtle bg-surface-base transition-colors hover:border-default"
              >
                <div className="relative aspect-[16/10] bg-surface-raised">
                  <Image
                    src={install.image!}
                    alt={`${msg.title} — ${msg.location}`}
                    fill
                    sizes="(min-width: 640px) 45vw, 100vw"
                    className="object-cover"
                  />
                </div>
                <div className="flex items-baseline justify-between gap-3 p-4">
                  <div className="min-w-0">
                    <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-text-muted">
                      {msg.location}
                    </p>
                    <h3 className="mt-1 text-base font-semibold text-text-primary">{msg.title}</h3>
                  </div>
                  <span className="inline-flex shrink-0 items-center gap-1.5 text-sm font-medium text-action group-hover:gap-2 transition-all">
                    {ctaLabel}
                    <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                  </span>
                </div>
              </Link>
            )
          })}
        </div>
      </div>
    </section>
  )
}

function DocumentedPiece({ piece, ctaLabel }: { piece: UpcyclingGalleryPiece; ctaLabel: string }) {
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

function QueuedCard({ piece }: { piece: UpcyclingGalleryPiece }) {
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

function PieceVisual({ piece, sizes }: { piece: UpcyclingGalleryPiece; sizes: string }) {
  const [failed, setFailed] = useState(false)
  const prefersReducedMotion = usePrefersReducedMotion()

  if (!piece.image || failed) {
    return (
      <MonitorLampPlaceholder
        variant={piece.variant}
        seed={piece.seed}
        className="h-full w-full"
      />
    )
  }

  const assetBase = UPCYCLING_GALLERY_ASSET_BASE
  const showVideo = piece.video && !prefersReducedMotion

  if (showVideo) {
    return (
      <video
        src={`${assetBase}/${piece.video}`}
        poster={`${assetBase}/${piece.image}`}
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
      src={`${assetBase}/${piece.image}`}
      alt={piece.model}
      fill
      sizes={sizes}
      className="object-cover"
      onError={() => setFailed(true)}
    />
  )
}
