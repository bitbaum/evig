import { getTranslations } from 'next-intl/server'
import Image from 'next/image'
import {
  ArrowRight,
  Layers,
  Image as ImageIcon,
  Wrench,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { Link } from '@/i18n/navigation'
import { UPCYCLING_ASSETS } from '@/config/upcycling-assets'
import {
  UPCYCLING_EXPLORE_ROUTE_KEYS,
  UPCYCLING_ROUTES,
} from '@/config/upcycling-routes'
import { orderPublishedGuides, UPCYCLING_GUIDE_ROUTES } from '@/data/upcycling-guides'
import {
  ProjectNeedsSection,
  type NeedsSectionLabels,
} from '@/components/projects'
import { UpcyclingInterestCTA } from './UpcyclingInterestCTA'
import { UpcyclingLandingHero } from './UpcyclingLandingHero'
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

type EvidenceCardCopy = { title: string; body: string; cta: string }

type PageMessages = {
  meta: { title: string; description: string }
  hero: {
    title: string
    description: string
    cta1: string
    cta2: string
    photoAlt: string
  }
  interestCta: { eyebrow: string; heading: string; body: string }
  evidence: {
    eyebrow: string
    status: EvidenceCardCopy
    businessplan: EvidenceCardCopy
  }
  guides: {
    eyebrow: string
    title: string
    intro: string
    openCta: string
    items: GuideItem[]
    moreComing: { title: string; body: string; cta: string }
  }
  explore: { eyebrow: string; title: string; intro: string; cards: ExploreCard[] }
  needs: NeedsSectionLabels
}

const EXPLORE_ICONS: Record<ExploreCard['key'], LucideIcon> = {
  applications: Layers,
  gallery: ImageIcon,
  buildYourOwn: Wrench,
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

  return (
    <div className="min-h-screen">
      <UpcyclingLandingHero
        title={p.hero.title}
        description={p.hero.description}
        cta1={p.hero.cta1}
        cta2={p.hero.cta2}
        photoAlt={p.hero.photoAlt}
      />
      <ExploreSection explore={p.explore} />
      <GuidesSection guides={p.guides} />
      <ProjectNeedsSection slug="upcycling" labels={p.needs} />
      <InterestSection interestCta={p.interestCta} />
      <EvidenceSection evidence={p.evidence} />
    </div>
  )
}

function EvidenceSection({ evidence }: { evidence: PageMessages['evidence'] }) {
  return (
    <section className="border-t border-subtle bg-surface-raised py-12 sm:py-14">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <div className="ui-public-eyebrow">{evidence.eyebrow}</div>
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <EvidenceCard
            href={UPCYCLING_ROUTES.status}
            copy={evidence.status}
          />
          <EvidenceCard
            href={UPCYCLING_ROUTES.businessplan}
            copy={evidence.businessplan}
          />
        </div>
      </div>
    </section>
  )
}

function EvidenceCard({ href, copy }: { href: string; copy: EvidenceCardCopy }) {
  return (
    <Link
      href={href}
      className="group flex flex-col gap-2 rounded-lg border border-subtle bg-surface-base p-5 transition-colors hover:border-default"
    >
      <p className="text-base font-semibold text-text-primary">{copy.title}</p>
      <p className="text-sm text-text-secondary">{copy.body}</p>
      <span className="mt-2 inline-flex items-center gap-1.5 text-sm font-medium text-action group-hover:gap-2 transition-all">
        {copy.cta}
        <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
      </span>
    </Link>
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
            if (!UPCYCLING_EXPLORE_ROUTE_KEYS.includes(card.key)) return null
            const Icon = EXPLORE_ICONS[card.key]
            const href = UPCYCLING_ROUTES[card.key]
            const imageSrc = UPCYCLING_ASSETS.explore[card.key]
            return (
              <Link
                key={card.key}
                href={href}
                className="group flex flex-col overflow-hidden rounded-lg border border-subtle bg-surface-raised transition-colors hover:border-default"
              >
                <div className="relative aspect-[16/10] border-b border-subtle bg-surface-base">
                  <Image
                    src={imageSrc}
                    alt=""
                    fill
                    sizes="(min-width: 640px) 30vw, 100vw"
                    className="object-cover"
                  />
                </div>
                <div className="flex flex-1 flex-col p-6">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-action-muted/15">
                    <Icon className="h-5 w-5 text-action" aria-hidden="true" />
                  </div>
                  <h3 className="mt-4 text-lg font-semibold text-text-primary">{card.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-text-secondary">{card.description}</p>
                  <span className="mt-auto pt-6 inline-flex items-center gap-1.5 text-sm font-medium text-action group-hover:gap-2 transition-all">
                    {card.cta}
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

function GuidesSection({ guides }: { guides: PageMessages['guides'] }) {
  const items = orderPublishedGuides(guides?.items ?? [])
  if (!items.length) return null
  const isSingle = items.length === 1
  return (
    <section className="bg-canvas border-t border-subtle py-16 sm:py-20">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <div className="ui-public-eyebrow">{guides.eyebrow}</div>
        <h2 className="ui-public-display-md mt-3">{guides.title}</h2>
        <p className="ui-public-section-lede mt-3">{guides.intro}</p>

        <div className="mt-10 grid gap-4 sm:grid-cols-2">
          {items.map((guide) => {
            const href = UPCYCLING_GUIDE_ROUTES[guide.slug as keyof typeof UPCYCLING_GUIDE_ROUTES] ?? guide.href
            const showPhoto = guide.slug === 'lenovo-l2251pwd'
            return (
              <Link
                key={guide.slug}
                href={href}
                className="group flex flex-col overflow-hidden rounded-lg border border-subtle bg-surface-base transition-colors hover:border-default"
              >
                {showPhoto && (
                  <div className="relative aspect-[16/10] border-b border-subtle">
                    <Image
                      src={UPCYCLING_ASSETS.gallery.lenovoPoster}
                      alt=""
                      fill
                      sizes="(min-width: 640px) 45vw, 100vw"
                      className="object-cover"
                    />
                  </div>
                )}
                <div className="flex flex-1 flex-col p-6">
                  <div className="font-mono text-xs uppercase tracking-[0.18em] text-text-tertiary">
                    {guide.publishedAt}
                  </div>
                  <h3 className="mt-3 text-lg font-semibold text-text-primary">{guide.model}</h3>
                  <p className="mt-2 text-sm text-text-secondary">{guide.summary}</p>
                  <span className="mt-auto pt-6 inline-flex items-center gap-1.5 text-sm font-medium text-action group-hover:gap-2 transition-all">
                    {guides.openCta}
                    <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
                  </span>
                </div>
              </Link>
            )
          })}
          {isSingle && guides.moreComing && (
            <div className="flex flex-col rounded-lg border border-dashed border-subtle bg-canvas p-6">
              <div className="font-mono text-xs uppercase tracking-[0.18em] text-text-tertiary">
                {guides.moreComing.title}
              </div>
              <p className="mt-3 text-sm text-text-secondary">{guides.moreComing.body}</p>
              <Link
                href={UPCYCLING_ROUTES.buildYourOwn}
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
