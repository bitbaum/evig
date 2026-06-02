import { getTranslations } from 'next-intl/server'
import { Lightbulb } from 'lucide-react'
import { ProjectPage } from '@/components/projects'
import type { ProjectPageConfig, RawCard, RawAction } from '@/components/projects'

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
      {
        title: p.about.title,
        description: p.about.description,
        backgroundColor: 'white',
        layout: 'single',
      },
      {
        title: p.approach.title,
        backgroundColor: 'gray',
        layout: 'grid-3',
        cards: p.approach.cards.map(c => ({ title: c.title, description: c.description ?? '', features: c.features })),
      },
      {
        title: p.nextsteps.title,
        description: p.nextsteps.description,
        backgroundColor: 'white',
        layout: 'single',
      },
      // New sections for public info completeness + excellent AI brainstorming utility (open questions, replication source + platform source code, ready-to-use prompts)
      {
        title: p.open_questions.title,
        backgroundColor: 'gray',
        layout: 'single',
        cards: p.open_questions.questions.map((q: string) => ({ title: q, description: '' })),
      },
      {
        title: p.source.title,
        description: p.source.description,
        backgroundColor: 'white',
        layout: 'single',
      },
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
        { title: p.cta.actions[0].title, description: p.cta.actions[0].description, href: '/contact', ctaText: p.cta.actions[0].cta },
        { title: p.cta.actions[1].title, description: p.cta.actions[1].description, href: '/get-involved/donate', ctaText: p.cta.actions[1].cta },
        { title: p.cta.actions[2].title, description: p.cta.actions[2].description, href: '/contact', ctaText: p.cta.actions[2].cta },
      ],
    },
    metadata: { title: p.meta.title, description: p.meta.description },
  }

  return <ProjectPage config={config} />
}
