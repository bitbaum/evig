'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import { ChevronDown } from 'lucide-react'
import { UPCYCLING_ASSETS } from '@/config/upcycling-assets'
import { UPCYCLING_INSTALLATIONS } from '@/data/upcycling-installations'
import { cn } from '@/lib/utils'

/**
 * Cinematic Applications — the showcase surface of the Monitor-Upcycling
 * mini-site. Two acts: Functional → Decor. The page itself is the argument:
 * the same physical object can land in two completely different rooms.
 *
 * The third "Art" act was removed in June 2026 — it presented gallery-object
 * speculation as roadmap with no real evidence. Etappe-2 pilots target
 * stairwells, offices and schools (functional) plus living spaces (decor).
 *
 * SSOT discipline:
 *  - Chrome (text, surface, border) flows through CSS-var semantic tokens.
 *  - Scene visuals use local workshop photography where available.
 *  - Typography flows through ui-public-* primitives where they fit.
 *
 * Client component because the sticky scene index needs IntersectionObserver
 * to know which act the visitor is currently inside.
 */

export type RawApplication = {
  title: string
  description: string
  examples: string[]
  imageCaption: string
}

export type InstallItemMessages = {
  title: string
  location: string
  story: string
}

export type ApplicationsMessages = {
  meta: { title: string; description: string }
  eyebrow: string
  title: string
  intro: string
  installs: {
    eyebrow: string
    title: string
    intro: string
    photoBadge: string
    noPhotoBadge: string
    items: Record<string, InstallItemMessages>
  }
  szenarien: {
    eyebrow: string
    title: string
    intro: string
    badge: string
    items: Record<string, string>
  }
  spectrum: { label: string; functional: string; decor: string }
  tiers: {
    functional: RawApplication
    decor: RawApplication
  }
  cta: { title: string; body: string; primary: string; secondary: string }
}

type Act = {
  key: 'functional' | 'decor'
  variant: 'functional' | 'warm'
  /** Visual seeds reserved for future multi-photo rows. */
  seeds: [number, number, number]
  /** Right-tilt scenes alternate with left-tilt scenes for rhythm. */
  reverse: boolean
}

const ACTS: Act[] = [
  { key: 'functional', variant: 'functional', seeds: [11, 12, 13], reverse: false },
  { key: 'decor', variant: 'warm', seeds: [21, 22, 23], reverse: true },
]

const ACT_PHOTOS: Record<Act['key'], { src: string; alt: string }> = {
  functional: {
    // Real installation: the curved monitor light over the zuerich.repair
    // workbench (Juli 2026 shoot) — the functional tier in daily use.
    src: UPCYCLING_ASSETS.installs.werkbankCurved1,
    alt: 'Curved-Upcycling-Leuchte über der Werkbank im RepairHub von zuerich.repair',
  },
  decor: {
    src: UPCYCLING_ASSETS.gallery.lenovoPoster,
    alt: 'Finished monitor lamp (Lenovo L2251pwd) in warm ambient light',
  },
}

/** Zero-padded 2-digit label for a 0-based index — "01", "02", "03", … */
const actLabel = (idx: number) => String(idx + 1).padStart(2, '0')

/** Total formatted the same way — derived from ACTS so adding a 4th
 *  scene cascades everywhere it's displayed. */
const TOTAL_ACTS_LABEL = String(ACTS.length).padStart(2, '0')

export function ApplicationsExperience({ messages: m }: { messages: ApplicationsMessages }) {
  return (
    <article className="bg-canvas">
      <CinematicHero
        eyebrow={m.eyebrow}
        title={m.title}
        intro={m.intro}
        spectrum={m.spectrum}
        tierLabels={{
          functional: m.tiers.functional.title,
          decor: m.tiers.decor.title,
        }}
      />

      <SceneIndex
        labels={{
          functional: m.tiers.functional.title,
          decor: m.tiers.decor.title,
        }}
      />

      {ACTS.map((act, idx) => (
        <Scene key={act.key} idx={idx} act={act} tier={m.tiers[act.key]} />
      ))}

      <InstallationsSection installs={m.installs} />

      <SzenarienSection szenarien={m.szenarien} />
    </article>
  )
}

/* ─── SzenarienSection ───────────────────────────────────────────────
 * "So könnte es aussehen" — Szenarien-Kompositionen. These are
 * VISUALISIERUNGEN, not photographs; every card carries an explicit
 * "Visualisierung" badge and the intro says so, keeping the honest
 * photographed-vs-imagined split the installs section established.
 * Structure (scene ids + order) lives here; captions come from messages
 * keyed by scene id (i18n SSOT: messages = strings only).
 */
const SZENARIEN_SCENES = [
  { id: 'schaufenster', src: UPCYCLING_ASSETS.szenarien.schaufenster },
  { id: 'garage', src: UPCYCLING_ASSETS.szenarien.garage },
  { id: 'party', src: UPCYCLING_ASSETS.szenarien.party },
  { id: 'treppenhaus', src: UPCYCLING_ASSETS.szenarien.treppenhaus },
  { id: 'vorlesung', src: UPCYCLING_ASSETS.szenarien.vorlesung },
  { id: 'buero', src: UPCYCLING_ASSETS.szenarien.buero },
] as const

function SzenarienSection({ szenarien }: { szenarien: ApplicationsMessages['szenarien'] }) {
  return (
    <section className="border-t border-subtle bg-canvas py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <p className="ui-public-eyebrow">{szenarien.eyebrow}</p>
        <h2 className="ui-public-display-md mt-3">{szenarien.title}</h2>
        <p className="ui-public-section-lede mt-4 max-w-3xl">{szenarien.intro}</p>

        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {SZENARIEN_SCENES.map((scene) => {
            const caption = szenarien.items[scene.id]
            if (!caption) return null
            return (
              <figure
                key={scene.id}
                className="overflow-hidden rounded-xl border border-subtle bg-surface-base"
              >
                <div className="relative aspect-[4/3] bg-surface-raised">
                  <Image
                    src={scene.src}
                    alt={`${szenarien.badge} — ${caption}`}
                    fill
                    sizes="(min-width: 1024px) 30vw, (min-width: 640px) 45vw, 100vw"
                    className="object-cover"
                  />
                  <span className="absolute left-3 top-3 rounded-md bg-black/60 px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.16em] text-white">
                    {szenarien.badge}
                  </span>
                </div>
                <figcaption className="px-4 py-3 font-mono text-[10px] uppercase tracking-[0.16em] text-text-muted">
                  {caption}
                </figcaption>
              </figure>
            )
          })}
        </div>
      </div>
    </section>
  )
}

/* ─── InstallationsSection ───────────────────────────────────────────
 * Real-world proof: photographed installations with their field stories
 * (Swico Abschlussbericht). Structure from UPCYCLING_INSTALLATIONS (data
 * SSOT); all strings from messages keyed by install id. Entries without
 * photography render honestly as text cards ("Foto folgt") — same
 * discipline as the gallery's documented-vs-queued split.
 */
function InstallationsSection({ installs }: { installs: ApplicationsMessages['installs'] }) {
  const photographed = UPCYCLING_INSTALLATIONS.filter((i) => !!i.image)
  const textOnly = UPCYCLING_INSTALLATIONS.filter((i) => !i.image)

  return (
    <section className="border-t border-subtle bg-surface-raised py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <p className="ui-public-eyebrow">{installs.eyebrow}</p>
        <h2 className="ui-public-display-md mt-3">{installs.title}</h2>
        <p className="ui-public-section-lede mt-4 max-w-3xl">{installs.intro}</p>

        {/* Photographed installs — big photo cards */}
        <div className="mt-12 grid gap-6 md:grid-cols-2">
          {photographed.map((install) => {
            const msg = installs.items[install.id]
            if (!msg) return null
            return (
              <figure
                key={install.id}
                className="overflow-hidden rounded-xl border border-subtle bg-surface-base"
              >
                <div className="relative aspect-[4/3] bg-surface-raised">
                  <Image
                    src={install.image!}
                    alt={`${msg.title} — ${msg.location}`}
                    fill
                    sizes="(min-width: 768px) 45vw, 100vw"
                    className="object-cover"
                  />
                  <span className="absolute left-3 top-3 rounded-md bg-black/60 px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.16em] text-white">
                    {installs.photoBadge}
                  </span>
                </div>
                {/* Secondary shots, small strip */}
                {install.extraImages && install.extraImages.length > 0 && (
                  <div className="flex gap-1 border-t border-subtle">
                    {install.extraImages.map((src) => (
                      <div key={src} className="relative aspect-[4/3] min-w-0 flex-1">
                        <Image
                          src={src}
                          alt={msg.title}
                          fill
                          sizes="25vw"
                          className="object-cover"
                        />
                      </div>
                    ))}
                  </div>
                )}
                <figcaption className="p-5">
                  <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-text-muted">
                    {msg.location}
                  </p>
                  <h3 className="mt-1 text-lg font-semibold text-text-primary">{msg.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-text-secondary">{msg.story}</p>
                </figcaption>
              </figure>
            )
          })}
        </div>

        {/* Verified installs awaiting photography — honest text cards */}
        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          {textOnly.map((install) => {
            const msg = installs.items[install.id]
            if (!msg) return null
            return (
              <div
                key={install.id}
                className="rounded-xl border border-subtle bg-surface-base p-5"
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-text-muted">
                    {msg.location}
                  </p>
                  <span className="rounded-md border border-subtle px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-[0.14em] text-text-muted">
                    {installs.noPhotoBadge}
                  </span>
                </div>
                <h3 className="mt-1 text-base font-semibold text-text-primary">{msg.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-text-secondary">{msg.story}</p>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

/* ─── CinematicHero ──────────────────────────────────────────────────
 * Full-fold entrance: eyebrow → display title → lede → spectrum bar →
 * scroll hint. Behind it, a 3-lamp staggered composition (one per act)
 * blooms from the upper-right; an ambient action-muted halo anchors
 * the eye. All visuals derive from contained SSOTs (MonitorLamp palette
 * + semantic tokens).
 */
function CinematicHero({
  eyebrow,
  title,
  intro,
  spectrum,
  tierLabels,
}: {
  eyebrow: string
  title: string
  intro: string
  spectrum: ApplicationsMessages['spectrum']
  tierLabels: { functional: string; decor: string }
}) {
  return (
    <section
      aria-label={title}
      className="relative isolate overflow-hidden border-b border-subtle bg-canvas"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          background:
            'radial-gradient(60% 60% at 78% 22%, var(--accent-action-muted) 0%, transparent 64%)',
        }}
      />

      <div className="mx-auto max-w-7xl px-4 pb-16 pt-10 sm:px-6 sm:pb-24 sm:pt-16 lg:flex lg:min-h-[calc(100svh-3.5rem)] lg:flex-col lg:px-8 lg:pb-28 lg:pt-20">
        <div className="flex flex-col gap-10 sm:gap-12 lg:grid lg:flex-1 lg:grid-cols-[1.05fr_1fr] lg:items-center lg:gap-16">
          <div className="min-w-0">
            <div className="ui-public-eyebrow">{eyebrow}</div>
            <h1 className="ui-public-hero-title mt-4 text-left sm:mt-6">{title}</h1>
            <p className="ui-public-hero-lede mx-0 mt-6 max-w-2xl text-left sm:mt-8">{intro}</p>

            <div className="mt-8 flex items-center gap-3 font-mono text-xs uppercase tracking-[0.18em] text-text-tertiary sm:mt-10">
              <span>{spectrum.functional}</span>
              <span aria-hidden="true" className="h-px flex-1 bg-border-default" />
              <span>{spectrum.decor}</span>
            </div>
          </div>

          <SpectrumComposition tierLabels={tierLabels} />
        </div>

        <div className="hidden justify-center pt-12 text-text-tertiary lg:flex">
          <span className="inline-flex items-center gap-2 font-mono text-xs uppercase tracking-[0.18em]">
            {spectrum.label}
            <ChevronDown className="h-4 w-4" aria-hidden="true" />
          </span>
        </div>
      </div>
    </section>
  )
}

/* Hero composition — real workshop photo (documented retrofit). */
function SpectrumComposition({
  tierLabels,
}: {
  tierLabels: { functional: string; decor: string }
}) {
  return (
    <figure className="relative aspect-[5/4] w-full overflow-hidden rounded-2xl border border-subtle bg-surface-base">
      <Image
        src={UPCYCLING_ASSETS.businessplan.heroPoster}
        alt=""
        fill
        sizes="(min-width: 1024px) 45vw, 50vw"
        className="object-cover"
      />
      <figcaption className="sr-only">
        {tierLabels.functional}, {tierLabels.decor}
      </figcaption>
    </figure>
  )
}

/* ─── SceneIndex (sticky scene chip) ─────────────────────────────────
 * Compact floating progress chip while scrolling through the three acts.
 * Mirrors the StepProgress pattern from the Lenovo guide — same idiom,
 * shared visual vocabulary within the mini-site.
 */
function SceneIndex({
  labels,
}: {
  labels: { functional: string; decor: string }
}) {
  // -1 = above the first scene (hide the chip); 0..n = inside scene n.
  const [activeIdx, setActiveIdx] = useState<number>(-1)

  useEffect(() => {
    const targets = ACTS.map((a) => document.getElementById(`act-${a.key}`)).filter(
      (el): el is HTMLElement => !!el,
    )
    if (!targets.length) return

    const obs = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)
        if (visible.length > 0) {
          const idx = ACTS.findIndex((a) => `act-${a.key}` === visible[0].target.id)
          if (idx >= 0) setActiveIdx(idx)
        } else if (window.scrollY < window.innerHeight / 2) {
          setActiveIdx(-1)
        }
      },
      { rootMargin: '-30% 0px -50% 0px' },
    )
    targets.forEach((t) => obs.observe(t))
    return () => obs.disconnect()
  }, [])

  if (activeIdx < 0) return null

  const act = ACTS[activeIdx]
  if (!act) return null

  return (
    <div className="fixed left-1/2 top-3 z-40 -translate-x-1/2 sm:top-4">
      <div className="flex h-11 items-center gap-3 rounded-full border border-default bg-surface-base/95 px-4 text-sm font-medium text-text-primary backdrop-blur">
        <span className="font-mono tabular-nums text-xs text-text-tertiary">
          {actLabel(activeIdx)} / {TOTAL_ACTS_LABEL}
        </span>
        <span aria-hidden="true" className="h-3 w-px bg-border-default" />
        <span>{labels[act.key]}</span>
      </div>
    </div>
  )
}

/* ─── Scene ──────────────────────────────────────────────────────────
 * A single act. Large mono numeral anchors the eye; tier title in display
 * type; description as lede; examples in two-column rhythm; a row of three
 * variant-matched lamps. Scenes alternate text-left / text-right for visual
 * rhythm across the page.
 */
function Scene({ act, idx, tier }: { act: Act; idx: number; tier: RawApplication }) {
  return (
    <section
      id={`act-${act.key}`}
      className={cn(
        'border-b border-subtle',
        // Subtle alternating tint creates rhythm without breaking the token
        // discipline — both bg-canvas and bg-surface-raised are role-based.
        act.reverse ? 'bg-surface-raised' : 'bg-canvas',
      )}
    >
      <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 sm:py-28 lg:px-8 lg:py-32">
        {/* min-w-0 on grid children is REQUIRED so the lamp-row column
            (which contains a flex carousel with `w-[80vw]` figures) can
            shrink. Without it, the carousel pushes the grid wider than
            the viewport on mobile. */}
        <div
          className={cn(
            'grid gap-10 lg:grid-cols-2 lg:items-center lg:gap-16',
            act.reverse && 'lg:grid-flow-dense',
          )}
        >
          {/* Text column */}
          <div className={cn('min-w-0', act.reverse && 'lg:col-start-2')}>
            <div className="flex items-baseline gap-4">
              <span
                aria-hidden="true"
                className="font-mono text-7xl font-light leading-none tabular-nums text-text-tertiary sm:text-8xl"
              >
                {actLabel(idx)}
              </span>
              <span className="font-mono text-xs uppercase tracking-[0.22em] text-text-tertiary">
                / {TOTAL_ACTS_LABEL}
              </span>
            </div>

            <h2 className="ui-public-display-md mt-6">{tier.title}</h2>
            <p className="ui-public-section-lede mt-4 max-w-xl">{tier.description}</p>

            <ul className="mt-8 grid gap-y-2 gap-x-8 text-sm text-text-secondary sm:grid-cols-2">
              {tier.examples.map((ex, i) => (
                <li key={i} className="flex gap-2">
                  <span className="font-mono text-text-tertiary">·</span>
                  {ex}
                </li>
              ))}
            </ul>
          </div>

          {/* Lamp visual column */}
          <div className={cn('relative min-w-0', act.reverse && 'lg:col-start-1 lg:row-start-1')}>
            <ScenePhoto actKey={act.key} caption={tier.imageCaption} />
          </div>
        </div>
      </div>
    </section>
  )
}

function ScenePhoto({ actKey, caption }: { actKey: Act['key']; caption: string }) {
  const photo = ACT_PHOTOS[actKey]
  return (
    <figure className="overflow-hidden rounded-2xl border border-subtle bg-surface-base">
      <div className="relative aspect-[4/3]">
        <Image src={photo.src} alt={photo.alt} fill sizes="(min-width: 1024px) 45vw, 100vw" className="object-cover" />
      </div>
      <figcaption className="px-4 py-3 font-mono text-[10px] uppercase tracking-[0.22em] text-text-tertiary">
        {caption}
      </figcaption>
    </figure>
  )
}

