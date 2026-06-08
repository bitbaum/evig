import { getTranslations } from 'next-intl/server'
import { Lightbulb, ArrowRight } from 'lucide-react'
import { Link } from '@/i18n/navigation'
import {
  ProjectHero,
  ProjectSection,
  ProjectCallToAction,
  ProjectNeedsSection,
  type NeedsSectionLabels,
} from '@/components/projects'
import type { ProjectPageConfig, RawCard, RawAction } from '@/components/projects'

type GuideItem = {
  slug: string
  model: string
  href: string
  summary: string
  author: string
  publishedAt: string
}

type PageMessages = {
  meta: { title: string; description: string }
  hero: { title: string; description: string; cta1: string; cta2: string }
  about: { title: string; description: string }
  approach: { title: string; cards: RawCard[] }
  nextsteps: { title: string; description: string }
  cta: { title: string; actions: RawAction[] }
  open_questions: { title: string; questions: string[] }
  source: { title: string; description: string }
  ai_brainstorm: { title: string; intro: string; prompts: Array<{ title: string; prompt: string }> }
  guides: { eyebrow: string; title: string; intro: string; openCta: string; items: GuideItem[] }
  needs: NeedsSectionLabels
}

export async function generateMetadata() {
  const t = await getTranslations('projects')
  const p = t.raw('upcycling') as PageMessages
  return {
    title: p.meta.title,
    description: p.meta.description,
    openGraph: { title: p.meta.title, description: p.meta.description, type: 'website' },
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
        { text: p.hero.cta1, href: '/contact', variant: 'primary' },
        { text: p.hero.cta2, href: '/get-involved', variant: 'outline' },
      ],
    },
    sections: [
      { title: p.about.title, description: p.about.description, backgroundColor: 'white', layout: 'single' },
      {
        title: p.approach.title,
        backgroundColor: 'gray',
        layout: 'grid-3',
        cards: p.approach.cards.map(c => ({ title: c.title, description: c.description ?? '', features: c.features })),
      },
      { title: p.nextsteps.title, description: p.nextsteps.description, backgroundColor: 'white', layout: 'single' },
      {
        title: p.open_questions.title,
        backgroundColor: 'gray',
        layout: 'single',
        cards: p.open_questions.questions.map((q: string) => ({ title: q, description: '' })),
      },
      { title: p.source.title, description: p.source.description, backgroundColor: 'white', layout: 'single' },
      {
        title: p.ai_brainstorm.title,
        description: p.ai_brainstorm.intro,
        backgroundColor: 'gray',
        layout: 'grid-2',
        cards: p.ai_brainstorm.prompts.map((pr: { title: string; prompt: string }) => ({ title: pr.title, description: pr.prompt })),
      },
    ],
    cta: {
      title: p.cta.title,
      actions: [
        { title: p.cta.actions[0].title, description: p.cta.actions[0].description, href: '/contact',             ctaText: p.cta.actions[0].cta },
        { title: p.cta.actions[1].title, description: p.cta.actions[1].description, href: '/get-involved/donate', ctaText: p.cta.actions[1].cta },
        { title: p.cta.actions[2].title, description: p.cta.actions[2].description, href: '/contact',             ctaText: p.cta.actions[2].cta },
      ],
    },
    metadata: { title: p.meta.title, description: p.meta.description },
  }

  return (
    <div className="min-h-screen">
      <ProjectHero hero={config.hero} />
      {config.sections.map((section, i) => (
        <ProjectSection key={i} section={section} />
      ))}
      <GuidesSection guides={p.guides} />
      <ProjectNeedsSection slug="upcycling" labels={p.needs} />
      {config.cta && <ProjectCallToAction cta={config.cta} />}
    </div>
  )
}

function GuidesSection({ guides }: { guides: PageMessages['guides'] }) {
  if (!guides?.items?.length) return null
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
        </div>
      </div>
    </section>
  )
}
