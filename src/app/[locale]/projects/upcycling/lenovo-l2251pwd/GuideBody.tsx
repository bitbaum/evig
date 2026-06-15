'use client'

import { useEffect, useId, useRef, useState } from 'react'
import Image from 'next/image'
import {
  AlertTriangle,
  Wrench,
  ArrowLeft,
  MessageSquare,
  Play,
  Pause,
  X as CloseIcon,
  ChevronRight,
  ChevronDown,
} from 'lucide-react'
import { Link } from '@/i18n/navigation'
import { UPCYCLING_ROUTES } from '@/config/upcycling-routes'

/**
 * Mobile-first guide renderer.
 *
 * Phone-on-bench scenario drives every interaction:
 *  - photos zoom to fullscreen on tap (workbench detail unreadable otherwise)
 *  - sticky progress chip with jump-to-step menu (4 screens of content)
 *  - hero video is tap-to-play on small viewports (saves data)
 *  - tap targets ≥44px everywhere
 *  - multi-photo steps swipe horizontally on mobile (scroll-snap)
 *
 * Server passes the i18n blob as `data`; rendering here is fully client-
 * side so IntersectionObserver / lightbox state work.
 */

type StepImage = { src: string; alt: string }
type Step = { n: number; title: string; body: string; images: StepImage[] }
type Stage = { key: string; stageNumber: string; title: string; intro: string }

export type GuideData = {
  back: string
  eyebrow: string
  title: string
  subtitle: string
  metaLine: string
  credit: string
  safety: { title: string; body: string }
  tools: { title: string; items: string[] }
  stages: Stage[]
  steps: Step[]
  schematic: {
    title: string
    body: string
    labels: { v5: string; signal: string; gnd: string; resistor: string }
  }
  done: { title: string; body: string }
  feedback: { title: string; body: string; cta: string }
  ui: {
    openPhoto: string
    closePhoto: string
    playVideo: string
    pauseVideo: string
    stepProgressLabel: string
    stepProgressOf: string
    jumpToStep: string
    photoCountLabel: string
    photoCountOf: string
  }
}

const STEPS_BY_STAGE: Record<string, number[]> = {
  disassemble: [1, 2, 3],
  lcd: [4],
  bridge: [5],
}

export function GuideBody({ data }: { data: GuideData }) {
  const stepsById = new Map(data.steps.map((s) => [s.n, s]))
  const totalSteps = data.steps.length

  // Lightbox state shared across all photos
  const [lightbox, setLightbox] = useState<{
    images: StepImage[]
    activeIdx: number
  } | null>(null)

  // Plain functions — React Compiler handles memoization, and explicit
  // useCallback here triggered "compilation skipped" lints. The deps
  // ([]) were already empty so identity is stable per render group.
  const openLightbox = (images: StepImage[], idx: number) => {
    setLightbox({ images, activeIdx: idx })
  }
  const closeLightbox = () => setLightbox(null)

  // Sticky-progress active-step tracker via IntersectionObserver. Each
  // step `<li>` registers its ref; the one closest to the top-third of
  // the viewport wins.
  const stepRefs = useRef(new Map<number, HTMLElement>())
  const registerStep = (n: number, el: HTMLElement | null) => {
    if (el) stepRefs.current.set(n, el)
    else stepRefs.current.delete(n)
  }
  const [activeStep, setActiveStep] = useState<number>(0)
  const [progressVisible, setProgressVisible] = useState(false)
  const heroRef = useRef<HTMLElement>(null)
  const doneRef = useRef<HTMLElement>(null)

  // Show the sticky chip only between hero and "Done!". A plain
  // scroll listener is more reliable than IntersectionObserver here
  // because we want a continuous visibility decision based on where the
  // hero's bottom edge and the "Done!" section's top edge sit relative
  // to a fixed offset from the viewport top, not just threshold crossings.
  useEffect(() => {
    const update = () => {
      const heroEl = heroRef.current
      const doneEl = doneRef.current
      if (!heroEl || !doneEl) return
      const heroBottom = heroEl.getBoundingClientRect().bottom
      const doneTop = doneEl.getBoundingClientRect().top
      // visible when hero has scrolled off-screen AND "Done!" hasn't entered the upper portion
      setProgressVisible(heroBottom < 60 && doneTop > 120)
    }
    update()
    window.addEventListener('scroll', update, { passive: true })
    window.addEventListener('resize', update, { passive: true })
    return () => {
      window.removeEventListener('scroll', update)
      window.removeEventListener('resize', update)
    }
  }, [])

  // Track which step is the "current" one based on scroll position.
  // The observer is created ONCE on mount and observes every step
  // registered via the ref callback. Without []-deps the observer would
  // re-create on every re-render and the async callback would lose
  // races against its own cleanup, silently never updating activeStep.
  useEffect(() => {
    const obs = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)
        if (visible.length > 0) {
          const n = Number(visible[0].target.getAttribute('data-step'))
          if (!Number.isNaN(n)) setActiveStep(n)
        }
      },
      { rootMargin: '-30% 0px -50% 0px' },
    )
    stepRefs.current.forEach((el) => obs.observe(el))
    return () => obs.disconnect()
  }, [])

  return (
    <article className="bg-canvas min-h-screen">
      {/* Sticky compact progress chip — only between hero and "Done!" */}
      <StepProgress
        visible={progressVisible}
        activeStep={activeStep}
        totalSteps={totalSteps}
        steps={data.steps}
        labels={data.ui}
      />

      {/* Hero — video FIRST on mobile (the wow element), text on top on desktop */}
      <header ref={heroRef} className="border-b border-subtle">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 pt-4 sm:pt-10 pb-10 sm:pb-16">
          {/* Back link with 44px tap target on phone */}
          <Link
            href={UPCYCLING_ROUTES.landing}
            className="inline-flex items-center gap-2 -ml-2 px-2 min-h-[44px] sm:min-h-[36px] py-2 text-xs font-mono uppercase tracking-[0.18em] text-text-tertiary hover:text-text-primary"
          >
            <ArrowLeft className="w-4 h-4" aria-hidden="true" />
            {data.back}
          </Link>

          {/* Mobile: video first, text below. Desktop: side-by-side, text left. */}
          <div className="mt-4 sm:mt-6 grid gap-6 sm:gap-8 md:grid-cols-[1.1fr_1fr] md:items-center">
            <HeroVideo title={data.title} labels={data.ui} className="md:order-2" />
            <div className="md:order-1">
              <div className="ui-public-eyebrow">{data.eyebrow}</div>
              <h1 className="ui-public-display-md mt-3">{data.title}</h1>
              <p className="ui-public-section-lede mt-3">{data.subtitle}</p>
              <p className="ui-public-meta mt-4 font-mono tabular-nums">{data.metaLine}</p>
            </div>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-10 sm:py-16">
        {/* Safety callout */}
        <aside
          role="note"
          className="rounded-lg border border-warning-300 bg-warning-50 dark:bg-warning-950/40 p-5 flex gap-4"
        >
          <AlertTriangle
            className="w-5 h-5 shrink-0 text-warning-700 dark:text-warning-300 mt-0.5"
            aria-hidden="true"
          />
          <div>
            <h2 className="text-sm font-semibold text-warning-900 dark:text-warning-100">
              {data.safety.title}
            </h2>
            <p className="text-sm text-warning-800 dark:text-warning-200 mt-1">
              {data.safety.body}
            </p>
          </div>
        </aside>

        {/* Tools */}
        <section className="mt-10">
          <h2 className="ui-public-eyebrow">
            <Wrench className="w-3.5 h-3.5 inline-block mr-2" aria-hidden="true" />
            {data.tools.title}
          </h2>
          <ul className="mt-3 grid sm:grid-cols-2 gap-y-1.5 gap-x-6 text-sm text-text-secondary">
            {data.tools.items.map((tool, i) => (
              <li key={i} className="flex gap-2">
                <span className="font-mono text-text-tertiary">·</span>
                {tool}
              </li>
            ))}
          </ul>
        </section>

        {/* Stages → steps */}
        {data.stages.map((stage) => {
          const stepNums = STEPS_BY_STAGE[stage.key] ?? []
          return (
            <section key={stage.key} className="mt-14">
              <header className="border-b border-subtle pb-4">
                <div className="font-mono text-xs uppercase tracking-[0.18em] text-action">
                  {stage.stageNumber}
                </div>
                <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-text-primary mt-2">
                  {stage.title}
                </h2>
                <p className="ui-public-section-lede mt-2">{stage.intro}</p>
              </header>

              <ol className="mt-8 space-y-12">
                {stepNums.map((n) => {
                  const step = stepsById.get(n)
                  if (!step) return null
                  return (
                    <li
                      key={step.n}
                      id={`step-${step.n}`}
                      data-step={step.n}
                      ref={(el) => registerStep(step.n, el)}
                      // min-w-0 + the inner min-w-0 below are REQUIRED so the
                      // step's right column (which contains the photo carousel
                      // with `w-[85vw]` items) can shrink. Without it, the
                      // carousel's flex children force the grid wider than the
                      // viewport on mobile.
                      className="grid min-w-0 sm:grid-cols-[auto_1fr] gap-3 sm:gap-6 scroll-mt-20"
                    >
                      <span
                        className="font-mono text-3xl sm:text-4xl font-light tabular-nums text-text-tertiary leading-none pt-0.5"
                        aria-hidden="true"
                      >
                        {String(step.n).padStart(2, '0')}
                      </span>
                      <div className="min-w-0">
                        <h3 className="text-lg sm:text-xl font-semibold text-text-primary">
                          {step.title}
                        </h3>
                        <p className="text-sm sm:text-base text-text-secondary mt-2 leading-relaxed">
                          {step.body}
                        </p>

                        {step.images.length > 0 && (
                          <StepPhotoGroup
                            images={step.images}
                            onOpen={openLightbox}
                            labels={data.ui}
                          />
                        )}

                        {step.n === 5 && (
                          <div className="mt-6 rounded-lg border border-subtle bg-surface-raised p-5">
                            <h4 className="text-sm font-semibold text-text-primary">
                              {data.schematic.title}
                            </h4>
                            <p className="text-sm text-text-secondary mt-2">
                              {data.schematic.body}
                            </p>
                            <CircuitDiagram labels={data.schematic.labels} />
                          </div>
                        )}
                      </div>
                    </li>
                  )
                })}
              </ol>
            </section>
          )
        })}

        {/* Done */}
        <section ref={doneRef} className="mt-16 border-t border-subtle pt-10">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-text-primary">
            {data.done.title}
          </h2>
          <p className="text-sm sm:text-base text-text-secondary mt-3 max-w-prose">
            {data.done.body}
          </p>
        </section>

        {/* Feedback */}
        <section className="mt-12 rounded-lg border border-subtle p-6">
          <div className="flex items-start gap-4">
            <MessageSquare
              className="w-5 h-5 shrink-0 text-action mt-0.5"
              aria-hidden="true"
            />
            <div className="flex-1">
              <h2 className="text-sm font-semibold text-text-primary">
                {data.feedback.title}
              </h2>
              <p className="text-sm text-text-secondary mt-1">{data.feedback.body}</p>
              <Link
                href="/contact"
                className="mt-4 inline-flex items-center justify-center gap-2 h-11 px-5 rounded-lg border border-default text-sm font-medium hover:bg-surface-raised transition-colors"
              >
                {data.feedback.cta}
                <ChevronRight className="w-4 h-4" aria-hidden="true" />
              </Link>
            </div>
          </div>
        </section>

        <p className="mt-10 text-xs font-mono text-text-tertiary">{data.credit}</p>
      </div>

      {/* Fullscreen lightbox overlay */}
      {lightbox && (
        <Lightbox
          images={lightbox.images}
          activeIdx={lightbox.activeIdx}
          onClose={closeLightbox}
          onChangeIdx={(i) => setLightbox({ ...lightbox, activeIdx: i })}
          labels={data.ui}
        />
      )}
    </article>
  )
}

/* ─── HeroVideo ──────────────────────────────────────────────────────
 * On mobile (matchMedia max-width 768px) we show the poster + a big
 * play button. Real users tap once to start; we don't burn cellular
 * data on autoplay. On desktop, autoplay-muted-loop fires after mount.
 * Always renders the poster server-side so first paint matches.
 */
function HeroVideo({
  title,
  labels,
  className = '',
}: {
  title: string
  labels: GuideData['ui']
  className?: string
}) {
  const ref = useRef<HTMLVideoElement>(null)
  const [playing, setPlaying] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  // Tracks whether the user has ever started this video. Used to decide
  // whether the giant play-overlay shows again after a pause: yes on
  // mobile (poster-first), no on desktop once it's played at least once.
  const [hasPlayed, setHasPlayed] = useState(false)

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 768px)')
    setIsMobile(mq.matches)
    const v = ref.current
    if (!v) return
    if (!mq.matches) {
      // Desktop: kick off autoplay after mount
      v.muted = true
      v.loop = true
      v.play()
        .then(() => {
          setPlaying(true)
          setHasPlayed(true)
        })
        .catch(() => setPlaying(false))
    }
  }, [])

  const toggle = () => {
    const v = ref.current
    if (!v) return
    if (v.paused) {
      v.play()
        .then(() => {
          setPlaying(true)
          setHasPlayed(true)
        })
        .catch(() => {})
    } else {
      v.pause()
      setPlaying(false)
    }
  }

  const showOverlay = !playing && (isMobile || !hasPlayed)

  return (
    <div
      className={`relative aspect-[4/3] w-full overflow-hidden rounded-lg border border-subtle bg-surface-raised ${className}`}
    >
      <video
        ref={ref}
        className="absolute inset-0 h-full w-full object-cover"
        poster="/projects/upcycling/lenovo-l2251pwd/hero-poster.jpg"
        src="/projects/upcycling/lenovo-l2251pwd/hero.mp4"
        playsInline
        muted
        loop
        preload="none"
        aria-label={title}
      />
      {showOverlay && (
        <button
          type="button"
          onClick={toggle}
          className="absolute inset-0 flex items-center justify-center bg-black/20 backdrop-blur-[1px] transition-colors hover:bg-black/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
          aria-label={labels.playVideo}
        >
          <span className="flex items-center justify-center w-16 h-16 rounded-full bg-white/90 text-text-primary shadow-lg">
            <Play className="w-7 h-7 ml-0.5 fill-current" aria-hidden="true" />
          </span>
        </button>
      )}
      {playing && (
        <button
          type="button"
          onClick={toggle}
          className="absolute bottom-2 right-2 flex items-center justify-center w-11 h-11 rounded-full bg-black/40 text-white opacity-0 hover:opacity-100 focus:opacity-100 transition-opacity"
          aria-label={labels.pauseVideo}
        >
          <Pause className="w-4 h-4 fill-current" aria-hidden="true" />
        </button>
      )}
    </div>
  )
}

/* ─── StepPhotoGroup ─────────────────────────────────────────────────
 * Multi-photo steps: horizontal scroll-snap carousel on mobile (one
 * photo at a time, 85vw wide so a sliver of the next photo peeks in),
 * grid on ≥sm. Each photo is a button that opens the lightbox.
 */
function StepPhotoGroup({
  images,
  onOpen,
  labels,
}: {
  images: StepImage[]
  onOpen: (imgs: StepImage[], idx: number) => void
  labels: GuideData['ui']
}) {
  const single = images.length === 1
  const isMulti = images.length > 1

  return (
    <div className="mt-5">
      <div
        className={
          isMulti
            ? // Mobile: snap-x scrollable. ≥sm: regular grid.
              `-mx-4 px-4 flex gap-3 overflow-x-auto snap-x snap-mandatory pb-2 ` +
              `sm:mx-0 sm:px-0 sm:overflow-visible sm:snap-none sm:grid sm:gap-3 ` +
              (images.length === 2 ? 'sm:grid-cols-2' : 'sm:grid-cols-2 lg:grid-cols-3')
            : 'grid grid-cols-1'
        }
      >
        {images.map((img, i) => (
          <button
            type="button"
            key={img.src}
            onClick={() => onOpen(images, i)}
            aria-label={
              isMulti
                ? `${labels.openPhoto} — ${labels.photoCountLabel} ${i + 1} ${labels.photoCountOf} ${images.length}`
                : labels.openPhoto
            }
            className={
              // Mobile snap carousel: each child 85vw, snap to start.
              // ≥sm: behaves as grid cell, full width.
              (isMulti ? 'shrink-0 w-[85vw] snap-start sm:w-auto sm:shrink ' : '') +
              'relative aspect-[16/10] overflow-hidden rounded-md border border-subtle bg-surface-raised hover:border-default focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-action transition-colors'
            }
          >
            <Image
              src={img.src}
              alt={img.alt}
              fill
              sizes={
                single
                  ? '(min-width: 768px) 720px, 100vw'
                  : '(min-width: 1024px) 240px, (min-width: 640px) 33vw, 85vw'
              }
              className="object-cover"
            />
          </button>
        ))}
      </div>
      {isMulti && (
        <p className="sm:hidden mt-2 text-xs font-mono text-text-tertiary text-center">
          {images.length} {labels.photoCountOf === 'von' ? 'Fotos' : 'photos'} · ← →
        </p>
      )}
    </div>
  )
}

/* ─── Lightbox ───────────────────────────────────────────────────────
 * Fullscreen overlay with the original image at native resolution.
 * Closes on ESC, tap outside, or close button. Arrow keys / swipe
 * change photos when the source step had multiple.
 */
function Lightbox({
  images,
  activeIdx,
  onClose,
  onChangeIdx,
  labels,
}: {
  images: StepImage[]
  activeIdx: number
  onClose: () => void
  onChangeIdx: (i: number) => void
  labels: GuideData['ui']
}) {
  const current = images[activeIdx]
  const hasMany = images.length > 1
  const dialogRef = useRef<HTMLDivElement>(null)
  const labelId = useId()

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      else if (hasMany && e.key === 'ArrowRight')
        onChangeIdx((activeIdx + 1) % images.length)
      else if (hasMany && e.key === 'ArrowLeft')
        onChangeIdx((activeIdx - 1 + images.length) % images.length)
    }
    document.addEventListener('keydown', onKey)
    // Lock body scroll while open
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prevOverflow
    }
  }, [activeIdx, hasMany, images.length, onChangeIdx, onClose])

  // Swipe-to-change on touch devices
  const touchStartX = useRef<number | null>(null)
  const onTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX
  }
  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null || !hasMany) return
    const dx = e.changedTouches[0].clientX - touchStartX.current
    if (Math.abs(dx) > 50) {
      if (dx < 0) onChangeIdx((activeIdx + 1) % images.length)
      else onChangeIdx((activeIdx - 1 + images.length) % images.length)
    }
    touchStartX.current = null
  }

  return (
    <div
      ref={dialogRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby={labelId}
      className="fixed inset-0 z-50 bg-black/95 flex flex-col"
      onClick={(e) => {
        if (e.target === dialogRef.current) onClose()
      }}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      <header className="flex items-center justify-between px-4 py-3 text-white">
        <span id={labelId} className="text-sm font-medium">
          {hasMany ? `${labels.photoCountLabel} ${activeIdx + 1} ${labels.photoCountOf} ${images.length}` : ''}
        </span>
        <button
          type="button"
          onClick={onClose}
          aria-label={labels.closePhoto}
          className="flex items-center justify-center w-11 h-11 rounded-full bg-white/10 hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
        >
          <CloseIcon className="w-5 h-5" aria-hidden="true" />
        </button>
      </header>

      <div className="flex-1 flex items-center justify-center p-4 sm:p-8">
        <div className="relative w-full h-full max-w-5xl">
          {/* Use a plain <img> here — we want the full source resolution,
              not the Next/Image optimizer's downscale. */}
          { }
          <img
            src={current.src}
            alt={current.alt}
            className="absolute inset-0 m-auto max-w-full max-h-full object-contain"
          />
        </div>
      </div>

      {/* Dot indicator for multi-photo */}
      {hasMany && (
        <div className="flex items-center justify-center gap-2 py-4">
          {images.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => onChangeIdx(i)}
              className={`w-2 h-2 rounded-full transition-all ${
                i === activeIdx ? 'w-6 bg-white' : 'bg-white/40'
              }`}
              aria-label={`${labels.photoCountLabel} ${i + 1}`}
            />
          ))}
        </div>
      )}

      {/* Alt text caption */}
      <p className="px-6 pb-6 text-center text-xs sm:text-sm text-white/70 max-w-2xl mx-auto">
        {current.alt}
      </p>
    </div>
  )
}

/* ─── StepProgress (sticky chip) ─────────────────────────────────────
 * Small floating chip "Step N of M" while inside the steps zone. Tap
 * to open a jump menu listing all steps with anchors.
 */
function StepProgress({
  visible,
  activeStep,
  totalSteps,
  steps,
  labels,
}: {
  visible: boolean
  activeStep: number
  totalSteps: number
  steps: Step[]
  labels: GuideData['ui']
}) {
  const [open, setOpen] = useState(false)
  // Close menu when active step changes (user scrolled past it)
  useEffect(() => {
    setOpen(false)
  }, [activeStep])

  if (!visible || activeStep === 0) return null

  return (
    <div className="fixed top-3 left-1/2 -translate-x-1/2 z-40 sm:top-4">
      <div className="relative">
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="flex items-center gap-2 h-11 px-4 rounded-full bg-surface-base border border-default shadow-md text-sm font-medium text-text-primary backdrop-blur-sm hover:border-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-action"
          aria-expanded={open}
          aria-label={labels.jumpToStep}
        >
          <span className="font-mono tabular-nums text-text-tertiary text-xs">
            {labels.stepProgressLabel} {activeStep} {labels.stepProgressOf} {totalSteps}
          </span>
          <ChevronDown
            className={`w-4 h-4 text-text-tertiary transition-transform ${open ? 'rotate-180' : ''}`}
            aria-hidden="true"
          />
        </button>

        {open && (
          <div
            className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-72 rounded-lg bg-surface-base border border-default shadow-xl py-2"
            role="menu"
          >
            {steps.map((s) => (
              <a
                key={s.n}
                href={`#step-${s.n}`}
                onClick={() => setOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 text-sm hover:bg-surface-raised ${
                  s.n === activeStep ? 'text-action font-medium' : 'text-text-primary'
                }`}
              >
                <span className="font-mono tabular-nums text-text-tertiary text-xs w-6">
                  {String(s.n).padStart(2, '0')}
                </span>
                <span className="truncate">{s.title}</span>
              </a>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

/* ─── CircuitDiagram ─────────────────────────────────────────────────
 * Voltage divider: 5V → 1kΩ → Backlight → 1kΩ → GND. Inline SVG so it
 * inherits the page color scheme and works in dark mode for free.
 */
function CircuitDiagram({
  labels,
}: {
  labels: { v5: string; signal: string; gnd: string; resistor: string }
}) {
  return (
    <svg
      viewBox="0 0 320 140"
      className="mt-4 w-full max-w-md text-text-primary"
      role="img"
      aria-label={`${labels.v5} → ${labels.resistor} → ${labels.signal} → ${labels.resistor} → ${labels.gnd}`}
    >
      <g fill="none" stroke="currentColor" strokeWidth="1.5">
        <line
          x1="10" y1="35" x2="100" y2="35"
          className="text-error-600" stroke="currentColor" strokeWidth="2.5"
        />
        <polyline points="100,35 108,25 120,45 132,25 144,45 156,25 168,35" stroke="currentColor" />
        <line x1="168" y1="35" x2="168" y2="70" />
        <line
          x1="168" y1="70" x2="240" y2="70"
          className="text-warning-600" stroke="currentColor" strokeWidth="2.5"
        />
        <line x1="168" y1="70" x2="168" y2="105" />
        <polyline points="168,105 156,115 144,95 132,115 120,95 108,115 100,105" stroke="currentColor" />
        <line x1="10" y1="105" x2="100" y2="105" stroke="currentColor" strokeWidth="2.5" />
      </g>
      <g fontFamily="ui-monospace, monospace" fontSize="11" fill="currentColor">
        <text x="10" y="25">{labels.v5}</text>
        <text x="245" y="74">{labels.signal}</text>
        <text x="10" y="125">{labels.gnd}</text>
        <text x="100" y="22" fontSize="10">{labels.resistor}</text>
        <text x="100" y="125" fontSize="10">{labels.resistor}</text>
      </g>
      <g fill="currentColor">
        <circle cx="168" cy="35" r="3" />
        <circle cx="168" cy="105" r="3" />
        <circle cx="168" cy="70" r="3" />
      </g>
    </svg>
  )
}
