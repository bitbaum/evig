import { getTranslations } from 'next-intl/server'
import { ArrowRight, ExternalLink } from 'lucide-react'
import { Link } from '@/i18n/navigation'

/**
 * /projects/upcycling/businessplan — the funder/partner deep-evidence
 * surface for the Monitor-Upcycling project.
 *
 * Purpose: a single URL that links to everything needed to make a
 * funding, partnership, or sponsorship decision. Holds three blocks:
 *
 *   1. Pillars — what is already documented (links to /status#economics,
 *      /status, /transparenz/co2)
 *   2. Research — what is in progress (LCA, willingness-to-pay, CE)
 *   3. Downloads — empty state for now; reports get linked here as they
 *      land. The note explicitly invites early-draft requests.
 *
 * SoC: every string in messages/<locale>.json under
 * projects.upcycling.businessPlan; every link target is a stable URL on
 * this same domain. No client interactivity → server component.
 *
 * This page intentionally does NOT duplicate the economics breakdown
 * from /status#economics — it links to it. Single source of truth.
 */

type PillarItem = {
  title: string
  description: string
  href: string
  cta: string
}

type ResearchItem = {
  title: string
  status: string
  description: string
}

type BusinessPlanCopy = {
  meta: { title: string; description: string }
  eyebrow: string
  title: string
  intro: string
  pillars: { title: string; items: PillarItem[] }
  research: { title: string; intro: string; items: ResearchItem[] }
  downloads: { title: string; note: string; cta: string }
}

export async function generateMetadata() {
  const t = await getTranslations('projects')
  const m = t.raw('upcycling.businessPlan') as BusinessPlanCopy
  return {
    title: m.meta.title,
    description: m.meta.description,
    openGraph: { title: m.meta.title, description: m.meta.description, type: 'website' },
  }
}

export default async function UpcyclingBusinessPlanPage() {
  const t = await getTranslations('projects')
  const m = t.raw('upcycling.businessPlan') as BusinessPlanCopy

  return (
    <article className="bg-canvas">
      {/* Header — sets expectations: this is the evidence surface */}
      <header className="border-b border-subtle bg-surface-base">
        <div className="mx-auto max-w-5xl px-4 pb-10 pt-12 sm:px-6 sm:pb-14 sm:pt-16 lg:px-8">
          <div className="ui-public-eyebrow">{m.eyebrow}</div>
          <h1 className="ui-public-display-lg mt-3">{m.title}</h1>
          <p className="ui-public-section-lede mt-4 max-w-3xl">{m.intro}</p>
        </div>
      </header>

      {/* Pillars — links into existing material. Each card carries its
          own CTA pointing to the canonical source of that information. */}
      <section className="border-b border-subtle bg-canvas" aria-labelledby="pillars-title">
        <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
          <h2 id="pillars-title" className="ui-public-display-md">
            {m.pillars.title}
          </h2>

          <div className="mt-10 grid gap-4 sm:gap-5 md:grid-cols-2">
            {m.pillars.items.map((item, i) => (
              <Link
                key={i}
                href={item.href}
                className="group flex min-w-0 flex-col rounded-xl border border-subtle bg-surface-base p-6 transition-colors hover:border-default"
              >
                <h3 className="text-lg font-semibold text-text-primary">{item.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-text-secondary">
                  {item.description}
                </p>
                <span className="mt-auto inline-flex items-center gap-1.5 pt-6 text-sm font-medium text-action transition-all group-hover:gap-2">
                  {item.cta}
                  <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Research — in-progress studies. Status pill makes "not done yet"
          explicit rather than hiding it. Honesty over polish. */}
      <section
        className="border-b border-subtle bg-surface-raised"
        aria-labelledby="research-title"
      >
        <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
          <h2 id="research-title" className="ui-public-display-md">
            {m.research.title}
          </h2>
          <p className="ui-public-section-lede mt-4 max-w-3xl">{m.research.intro}</p>

          <ol className="mt-10 grid gap-4 sm:gap-5 md:grid-cols-3">
            {m.research.items.map((item, i) => (
              <li
                key={i}
                className="flex min-w-0 flex-col gap-3 rounded-xl border border-subtle bg-surface-base p-6"
              >
                <span className="font-mono text-xs uppercase tracking-[0.18em] text-action">
                  {item.status}
                </span>
                <h3 className="text-base font-semibold text-text-primary">{item.title}</h3>
                <p className="text-sm leading-relaxed text-text-secondary">
                  {item.description}
                </p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Downloads — explicit empty state. Better than fabricated
          placeholders; the contact CTA turns "nothing to download yet"
          into a productive next action for funders who need material now. */}
      <section className="bg-canvas" aria-labelledby="downloads-title">
        <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
          <h2 id="downloads-title" className="ui-public-display-md">
            {m.downloads.title}
          </h2>
          <div className="mt-6 rounded-xl border border-dashed border-subtle bg-surface-base p-6 sm:p-8">
            <p className="text-sm leading-relaxed text-text-secondary">
              {m.downloads.note}
            </p>
            <a
              href={`mailto:${m.downloads.cta}`}
              className="mt-5 inline-flex items-center gap-2 text-sm font-medium text-action hover:underline underline-offset-2"
            >
              {m.downloads.cta}
              <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
            </a>
          </div>
        </div>
      </section>
    </article>
  )
}
