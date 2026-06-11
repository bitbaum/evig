'use client'

import { useEffect, useRef, useState } from 'react'
import { ArrowRight, ChevronDown } from 'lucide-react'
import { Link } from '@/i18n/navigation'
import {
  MonitorLampPlaceholder,
  type MonitorLampPlaceholderVariant,
} from '../MonitorLampPlaceholder'
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
 *  - The chromatic identity per act lives inside <MonitorLampPlaceholder>
 *    (its own contained palette SSOT), NOT in arbitrary Tailwind classes.
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

export type ApplicationsMessages = {
  meta: { title: string; description: string }
  eyebrow: string
  title: string
  intro: string
  spectrum: { label: string; functional: string; decor: string }
  tiers: {
    functional: RawApplication
    decor: RawApplication
  }
  cta: { title: string; body: string; primary: string; secondary: string }
}

type Act = {
  key: 'functional' | 'decor'
  variant: MonitorLampPlaceholderVariant
  /** Visual seeds so each lamp in the row varies even at the same variant. */
  seeds: [number, number, number]
  /** Right-tilt scenes alternate with left-tilt scenes for rhythm. */
  reverse: boolean
}

const ACTS: Act[] = [
  { key: 'functional', variant: 'functional', seeds: [11, 12, 13], reverse: false },
  { key: 'decor',      variant: 'warm',       seeds: [21, 22, 23], reverse: true  },
]

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

      <FinalCTA cta={m.cta} />
    </article>
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

/* Two-lamp staggered composition mirroring the two acts. */
function SpectrumComposition({
  tierLabels,
}: {
  tierLabels: { functional: string; decor: string }
}) {
  return (
    <div className="relative aspect-[5/4] w-full">
      <LampFrame
        variant="functional"
        seed={1}
        label={tierLabels.functional}
        className="absolute left-[2%] top-[18%] w-[56%]"
      />
      <LampFrame
        variant="warm"
        seed={2}
        label={tierLabels.decor}
        className="absolute right-0 bottom-[8%] w-[56%]"
      />
    </div>
  )
}

function LampFrame({
  variant,
  seed,
  label,
  className,
}: {
  variant: MonitorLampPlaceholderVariant
  seed: number
  label: string
  className?: string
}) {
  return (
    <figure className={cn('aspect-[4/3] overflow-hidden rounded-2xl border border-subtle bg-surface-base', className)}>
      <MonitorLampPlaceholder variant={variant} seed={seed} className="h-full w-full" />
      <figcaption className="sr-only">{label}</figcaption>
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
            <SceneLampRow variant={act.variant} seeds={act.seeds} caption={tier.imageCaption} />
          </div>
        </div>
      </div>
    </section>
  )
}

/* A scene's lamp row — three variant-matched lamps in a soft mosaic.
 * On mobile: horizontal snap-scroll so it doesn't dominate the fold.
 * On ≥sm: irregular grid (one tall hero + two stacked) for visual
 * interest without the lamp count exploding. */
function SceneLampRow({
  variant,
  seeds,
  caption,
}: {
  variant: MonitorLampPlaceholderVariant
  seeds: [number, number, number]
  caption: string
}) {
  return (
    <div>
      <div className="-mx-4 flex gap-3 overflow-x-auto px-4 pb-2 snap-x snap-mandatory sm:mx-0 sm:grid sm:grid-cols-3 sm:gap-3 sm:overflow-visible sm:px-0 sm:pb-0">
        {seeds.map((seed, i) => (
          <figure
            key={seed}
            className={cn(
              'shrink-0 snap-start overflow-hidden rounded-xl border border-subtle bg-surface-base',
              // Mobile: each card 80vw. ≥sm: irregular — first card spans
              // 2 cols + 2 rows, the next two stack on the right.
              'w-[80vw] aspect-[4/3] sm:w-auto sm:shrink',
              i === 0 && 'sm:col-span-2 sm:row-span-2 sm:aspect-[16/10]',
              i !== 0 && 'sm:aspect-[4/3]',
            )}
          >
            <MonitorLampPlaceholder variant={variant} seed={seed} className="h-full w-full" />
          </figure>
        ))}
      </div>
      <p className="mt-3 font-mono text-[10px] uppercase tracking-[0.22em] text-text-tertiary">
        {caption}
      </p>
    </div>
  )
}

function FinalCTA({ cta }: { cta: ApplicationsMessages['cta'] }) {
  return (
    <section className="border-t border-subtle bg-surface-base">
      <div className="mx-auto max-w-3xl px-4 py-20 text-center sm:px-6 sm:py-28 lg:px-8">
        <h2 className="ui-public-display-md">{cta.title}</h2>
        <p className="ui-public-section-lede mx-auto mt-4">{cta.body}</p>
        <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
          <Link href="/contact" className="ui-public-cta">
            {cta.primary}
          </Link>
          <Link
            href="/projects/upcycling/build-your-own"
            className="ui-public-cta-ghost inline-flex items-center gap-2"
          >
            {cta.secondary}
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>
      </div>
    </section>
  )
}
