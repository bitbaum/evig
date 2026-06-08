import { getTranslations } from 'next-intl/server'
import Image from 'next/image'
import { AlertTriangle, Wrench, ArrowLeft, MessageSquare } from 'lucide-react'
import { Link } from '@/i18n/navigation'

/**
 * Lenovo L2251pwd — disassembly + lamp-conversion guide.
 *
 * Photo-essay layout. Kept off the Monitor-Upcycling overview page on
 * purpose: the overview pitches the project to partners/donors; this
 * page is for technicians actually doing the work. Information
 * hierarchy is what keeps the overview clean.
 */

type StepImage = { src: string; alt: string }
type Step = { n: number; title: string; body: string; images: StepImage[] }
type Stage = { key: string; stageNumber: string; title: string; intro: string }

type GuideMessages = {
  meta: { title: string; description: string }
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
}

// Steps belong to stages based on the original wiki structure. Encoded
// here (not in i18n) because translators shouldn't need to remember the
// mapping; it's a property of the physical disassembly, not the language.
const STEPS_BY_STAGE: Record<string, number[]> = {
  disassemble: [1, 2, 3],
  lcd: [4],
  bridge: [5],
}

export async function generateMetadata() {
  const t = await getTranslations('projects')
  const m = t.raw('upcycling.lenovo_l2251pwd') as GuideMessages
  return {
    title: m.meta.title,
    description: m.meta.description,
    openGraph: { title: m.meta.title, description: m.meta.description, type: 'article' },
  }
}

export default async function LenovoL2251pwdGuidePage() {
  const t = await getTranslations('projects')
  const m = t.raw('upcycling.lenovo_l2251pwd') as GuideMessages

  const stepsById = new Map(m.steps.map((s) => [s.n, s]))

  return (
    <article className="bg-canvas min-h-screen">
      {/* Hero: looping video of the finished lamp */}
      <header className="border-b border-subtle">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 pt-8 pb-12 sm:pt-10 sm:pb-16">
          <Link
            href="/projects/upcycling"
            className="inline-flex items-center gap-1.5 text-xs font-mono uppercase tracking-[0.18em] text-text-tertiary hover:text-text-primary"
          >
            <ArrowLeft className="w-3.5 h-3.5" aria-hidden="true" />
            {m.back}
          </Link>

          <div className="mt-6 grid gap-8 md:grid-cols-[1.1fr_1fr] md:items-center">
            <div>
              <div className="ui-public-eyebrow">{m.eyebrow}</div>
              <h1 className="ui-public-display-md mt-3">{m.title}</h1>
              <p className="ui-public-section-lede mt-3">{m.subtitle}</p>
              <p className="ui-public-meta mt-4 font-mono tabular-nums">{m.metaLine}</p>
            </div>

            <div className="relative aspect-[4/3] w-full overflow-hidden rounded-lg border border-subtle bg-surface-raised">
              <video
                className="absolute inset-0 h-full w-full object-cover"
                poster="/projects/upcycling/lenovo-l2251pwd/hero-poster.jpg"
                src="/projects/upcycling/lenovo-l2251pwd/hero.mp4"
                autoPlay
                loop
                muted
                playsInline
                preload="metadata"
                aria-label={m.title}
              />
            </div>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        {/* Safety callout — load-bearing. Anyone skimming should see this. */}
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
              {m.safety.title}
            </h2>
            <p className="text-sm text-warning-800 dark:text-warning-200 mt-1">{m.safety.body}</p>
          </div>
        </aside>

        {/* Tools */}
        <section className="mt-10">
          <h2 className="ui-public-eyebrow">
            <Wrench className="w-3.5 h-3.5 inline-block mr-2" aria-hidden="true" />
            {m.tools.title}
          </h2>
          <ul className="mt-3 grid sm:grid-cols-2 gap-y-1.5 gap-x-6 text-sm text-text-secondary">
            {m.tools.items.map((tool, i) => (
              <li key={i} className="flex gap-2">
                <span className="font-mono text-text-tertiary">·</span>
                {tool}
              </li>
            ))}
          </ul>
        </section>

        {/* Stages → steps */}
        {m.stages.map((stage) => {
          const stepNums = STEPS_BY_STAGE[stage.key] ?? []
          return (
            <section key={stage.key} className="mt-14">
              <header className="border-b border-subtle pb-4">
                <div className="font-mono text-xs uppercase tracking-[0.18em] text-action">
                  {stage.stageNumber}
                </div>
                <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-text-primary mt-2">{stage.title}</h2>
                <p className="ui-public-section-lede mt-2">{stage.intro}</p>
              </header>

              <ol className="mt-8 space-y-12">
                {stepNums.map((n) => {
                  const step = stepsById.get(n)
                  if (!step) return null
                  return (
                    <li key={step.n} className="grid sm:grid-cols-[auto_1fr] gap-4 sm:gap-6">
                      <span
                        className="font-mono text-3xl font-light tabular-nums text-text-tertiary leading-none pt-1"
                        aria-hidden="true"
                      >
                        {String(step.n).padStart(2, '0')}
                      </span>
                      <div>
                        <h3 className="text-lg font-semibold text-text-primary">{step.title}</h3>
                        <p className="text-sm text-text-secondary mt-2 leading-relaxed">
                          {step.body}
                        </p>

                        {step.images.length > 0 && (
                          <div
                            className={`mt-5 grid gap-3 ${
                              step.images.length === 1
                                ? 'grid-cols-1'
                                : step.images.length === 2
                                  ? 'grid-cols-1 sm:grid-cols-2'
                                  : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'
                            }`}
                          >
                            {step.images.map((img) => (
                              <figure
                                key={img.src}
                                className="relative aspect-[16/10] overflow-hidden rounded-md border border-subtle bg-surface-raised"
                              >
                                <Image
                                  src={img.src}
                                  alt={img.alt}
                                  fill
                                  sizes="(min-width: 1024px) 240px, (min-width: 640px) 33vw, 100vw"
                                  className="object-cover"
                                />
                              </figure>
                            ))}
                          </div>
                        )}

                        {/* Schematic appears under step 5 — it's a circuit
                            description, conceptually part of the bridge step. */}
                        {step.n === 5 && (
                          <div className="mt-6 rounded-lg border border-subtle bg-surface-raised p-5">
                            <h4 className="text-sm font-semibold text-text-primary">
                              {m.schematic.title}
                            </h4>
                            <p className="text-sm text-text-secondary mt-2">{m.schematic.body}</p>
                            <CircuitDiagram labels={m.schematic.labels} />
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
        <section className="mt-16 border-t border-subtle pt-10">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-text-primary">{m.done.title}</h2>
          <p className="text-sm text-text-secondary mt-3 max-w-prose">{m.done.body}</p>
        </section>

        {/* Feedback */}
        <section className="mt-12 rounded-lg border border-subtle p-6">
          <div className="flex items-start gap-4">
            <MessageSquare
              className="w-5 h-5 shrink-0 text-action mt-0.5"
              aria-hidden="true"
            />
            <div>
              <h2 className="text-sm font-semibold text-text-primary">{m.feedback.title}</h2>
              <p className="text-sm text-text-secondary mt-1">{m.feedback.body}</p>
              <Link
                href="/contact"
                className="ui-public-cta-ghost mt-4 inline-flex items-center gap-1.5 text-sm"
              >
                {m.feedback.cta}
              </Link>
            </div>
          </div>
        </section>

        {/* Credit */}
        <p className="mt-10 text-xs font-mono text-text-tertiary">{m.credit}</p>
      </div>
    </article>
  )
}

/**
 * Clean schematic of the voltage-divider bridge that converts the
 * monitor's backlight-control input into a permanently-on signal.
 *
 *   5V ──── 1 kΩ ──── BACKLIGHT-SIGNAL ──── 1 kΩ ──── GND
 *
 * Drawn as inline SVG so it inherits the page's color scheme via
 * `currentColor` and stays readable in dark mode without a separate
 * asset.
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
        {/* 5V (red) horizontal */}
        <line x1="10" y1="35" x2="100" y2="35" className="text-error-600" stroke="currentColor" strokeWidth="2.5" />
        {/* Resistor 1 zigzag */}
        <polyline
          points="100,35 108,25 120,45 132,25 144,45 156,25 168,35"
          stroke="currentColor"
        />
        {/* Down to signal node */}
        <line x1="168" y1="35" x2="168" y2="70" />
        {/* Signal (yellow) */}
        <line x1="168" y1="70" x2="240" y2="70" className="text-warning-600" stroke="currentColor" strokeWidth="2.5" />
        {/* Up from signal to resistor 2 */}
        <line x1="168" y1="70" x2="168" y2="105" />
        {/* Resistor 2 */}
        <polyline
          points="168,105 156,115 144,95 132,115 120,95 108,115 100,105"
          stroke="currentColor"
        />
        {/* GND (black) */}
        <line x1="10" y1="105" x2="100" y2="105" stroke="currentColor" strokeWidth="2.5" />
      </g>
      {/* Labels */}
      <g fontFamily="ui-monospace, monospace" fontSize="11" fill="currentColor">
        <text x="10" y="25">{labels.v5}</text>
        <text x="245" y="74">{labels.signal}</text>
        <text x="10" y="125">{labels.gnd}</text>
        <text x="100" y="22" fontSize="10">{labels.resistor}</text>
        <text x="100" y="125" fontSize="10">{labels.resistor}</text>
      </g>
      {/* Junction dots */}
      <g fill="currentColor">
        <circle cx="168" cy="35" r="3" />
        <circle cx="168" cy="105" r="3" />
        <circle cx="168" cy="70" r="3" />
      </g>
    </svg>
  )
}
