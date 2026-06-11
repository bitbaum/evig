import { getTranslations } from 'next-intl/server'
import {
  Lightbulb,
  ArrowRight,
  Layers,
  Image as ImageIcon,
  Wrench,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { Link } from '@/i18n/navigation'
import {
  ProjectHero,
  ProjectNeedsSection,
  type NeedsSectionLabels,
} from '@/components/projects'
import type { ProjectPageConfig } from '@/components/projects'
import { UpcyclingInterestCTA } from './UpcyclingInterestCTA'
import { ogFor } from './og-images'

type GuideItem = {
  slug: string
  model: string
  href: string
  summary: string
  author: string
  publishedAt: string
}

type ExploreCard = {
  key: 'applications' | 'gallery' | 'buildYourOwn'
  title: string
  description: string
  cta: string
}

type PageMessages = {
  meta: { title: string; description: string }
  hero: { title: string; description: string; cta1: string; cta2: string }
  interestCta: { eyebrow: string; heading: string; body: string }
  briefLink: { eyebrow: string; title: string; body: string; cta: string }
  guides: {
    eyebrow: string
    title: string
    intro: string
    openCta: string
    items: GuideItem[]
    /** Rendered as a subdued companion card when only one guide exists yet —
     *  signals progress without inventing a fake guide. */
    moreComing: { title: string; body: string; cta: string }
  }
  explore: { eyebrow: string; title: string; intro: string; cards: ExploreCard[] }
  needs: NeedsSectionLabels
}

export async function generateMetadata() {
  const t = await getTranslations('projects')
  const p = t.raw('upcycling') as PageMessages
  return {
    title: p.meta.title,
    description: p.meta.description,
    ...ogFor('landing', p.meta),
  }
}

export default async function UpcyclingPage() {
  const t = await getTranslations('projects')
  const p = t.raw('upcycling') as PageMessages

  const config: ProjectPageConfig = {
    hero: {
      title: p.hero.title,
      description: p.hero.description,
      icon: Lightbulb,
      ctas: [
        // Primary CTA leads INTO the mini-site (applications is the most
        // visual sub-page). Users were missing the sub-experience entirely
        // when both hero CTAs sent them off the project page.
        { text: p.hero.cta1, href: '/projects/upcycling/applications', variant: 'primary' },
        { text: p.hero.cta2, href: '/get-involved', variant: 'outline' },
      ],
    },
    sections: [],
    metadata: { title: p.meta.title, description: p.meta.description },
  }

  // Page order: Hero → Explore (where to go) → Guides (what we've published) →
  // Needs (how to help) → Interest (stay informed) → Status link (the
  // funder-grade proof). Removed: IdeasSection (duplicated /wirkung),
  // AiBrainstormSection (read as scaffolding, cited fabricated partners),
  // generic 3-action CallToAction at the bottom (duplicated Needs).
  return (
    <div className="min-h-screen">
      {config.hero && <ProjectHero hero={config.hero} />}
      <ExploreSection explore={p.explore} />
      <GuidesSection guides={p.guides} />
      <ProjectNeedsSection slug="upcycling" labels={p.needs} />
      <InterestSection interestCta={p.interestCta} />
      <BriefLink brief={p.briefLink} />
    </div>
  )
}

function BriefLink({ brief }: { brief: PageMessages['briefLink'] }) {
  return (
    <section className="border-t border-subtle bg-canvas py-12 sm:py-14">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <Link
          href="/projects/upcycling/status"
          className="group flex flex-col gap-3 rounded-lg border border-subtle bg-surface-base p-6 transition-colors hover:border-default sm:flex-row sm:items-center sm:gap-6"
        >
          <div className="flex-1">
            <div className="ui-public-eyebrow">{brief.eyebrow}</div>
            <p className="mt-2 text-lg font-semibold text-text-primary">{brief.title}</p>
            <p className="mt-1 text-sm text-text-secondary">{brief.body}</p>
          </div>
          <span className="inline-flex items-center gap-1.5 text-sm font-medium text-action group-hover:gap-2 transition-all shrink-0">
            {brief.cta}
            <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
          </span>
        </Link>
      </div>
    </section>
  )
}

function InterestSection({ interestCta }: { interestCta: PageMessages['interestCta'] }) {
  return (
    <section className="border-t border-subtle bg-canvas py-14 sm:py-16">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 text-center">
        <div className="ui-public-eyebrow">{interestCta.eyebrow}</div>
        <p className="mt-4 text-xl sm:text-2xl font-medium leading-snug text-text-primary">
          {interestCta.heading}
        </p>
        <p className="mt-3 text-sm text-text-secondary">{interestCta.body}</p>
        <UpcyclingInterestCTA className="mt-8 max-w-md mx-auto" />
      </div>
    </section>
  )
}

const EXPLORE_META: Record<
  ExploreCard['key'],
  { href: string; icon: LucideIcon }
> = {
  applications: { href: '/projects/upcycling/applications',   icon: Layers },
  gallery:      { href: '/projects/upcycling/gallery',        icon: ImageIcon },
  buildYourOwn: { href: '/projects/upcycling/build-your-own', icon: Wrench },
}

function ExploreSection({ explore }: { explore: PageMessages['explore'] }) {
  if (!explore?.cards?.length) return null
  return (
    <section className="bg-surface-base border-t border-subtle py-14 sm:py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <div className="ui-public-eyebrow">{explore.eyebrow}</div>
          <h2 className="ui-public-display-md mt-3">{explore.title}</h2>
          <p className="ui-public-section-lede mx-auto mt-3">{explore.intro}</p>
        </div>

        <div className="mt-10 grid gap-4 sm:grid-cols-3">
          {explore.cards.map((card) => {
            const meta = EXPLORE_META[card.key]
            if (!meta) return null
            const Icon = meta.icon
            return (
              <Link
                key={card.key}
                href={meta.href}
                className="group flex flex-col rounded-lg border border-subtle bg-surface-raised p-6 transition-colors hover:border-default"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-action-muted/15">
                  <Icon className="h-5 w-5 text-action" aria-hidden="true" />
                </div>
                <h3 className="mt-4 text-lg font-semibold text-text-primary">{card.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-text-secondary">{card.description}</p>
                <span className="mt-auto pt-6 inline-flex items-center gap-1.5 text-sm font-medium text-action group-hover:gap-2 transition-all">
                  {card.cta}
                  <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                </span>
              </Link>
            )
          })}
        </div>
      </div>
    </section>
  )
}

function GuidesSection({ guides }: { guides: PageMessages['guides'] }) {
  if (!guides?.items?.length) return null
  // Single-guide state: pair the real guide with a "more coming" companion
  // card so visitors see momentum (not "only one thing exists") — honest
  // about what's published, transparent about what's queued.
  const isSingle = guides.items.length === 1
  return (
    <section className="bg-canvas border-t border-subtle py-16 sm:py-20">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <div className="ui-public-eyebrow">{guides.eyebrow}</div>
        <h2 className="ui-public-display-md mt-3">{guides.title}</h2>
        <p className="ui-public-section-lede mt-3">{guides.intro}</p>

        <div className="mt-10 grid gap-4 sm:grid-cols-2">
          {guides.items.map((guide) => (
            <Link
              key={guide.slug}
              href={guide.href}
              className="group flex flex-col rounded-lg border border-subtle bg-surface-base p-6 transition-colors hover:border-default"
            >
              <div className="font-mono text-xs uppercase tracking-[0.18em] text-text-tertiary">
                {guide.publishedAt}
              </div>
              <h3 className="mt-3 text-lg font-semibold text-text-primary">{guide.model}</h3>
              <p className="mt-2 text-sm text-text-secondary">{guide.summary}</p>
              <span className="mt-auto pt-6 inline-flex items-center gap-1.5 text-sm font-medium text-action group-hover:gap-2 transition-all">
                {guides.openCta}
                <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
              </span>
            </Link>
          ))}
          {isSingle && guides.moreComing && (
            <div className="flex flex-col rounded-lg border border-dashed border-subtle bg-canvas p-6">
              <div className="font-mono text-xs uppercase tracking-[0.18em] text-text-tertiary">
                {guides.moreComing.title}
              </div>
              <p className="mt-3 text-sm text-text-secondary">{guides.moreComing.body}</p>
              <Link
                href="/projects/upcycling/build-your-own"
                className="mt-auto pt-6 inline-flex items-center gap-1.5 text-sm font-medium text-action hover:gap-2 transition-all"
              >
                {guides.moreComing.cta}
                <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
              </Link>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
