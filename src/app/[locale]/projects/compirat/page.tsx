import { getTranslations } from 'next-intl/server'
import { Users } from 'lucide-react'
import { ProjectPage } from '@/components/projects'
import type { ProjectPageConfig, RawCard, RawAction } from '@/components/projects'

type PageMessages = {
  meta: { title: string; description: string }
  hero: { title: string; description: string; cta1: string; cta2: string }
  about: { title: string; description: string; cards: RawCard[] }
  program: { title: string; cards: RawCard[] }
  cta: { title: string; actions: RawAction[] }
}

export async function generateMetadata() {
  const t = await getTranslations('projects')
  const p = t.raw('compirat') as PageMessages
  return {
    title: p.meta.title,
    description: p.meta.description,
    openGraph: { title: p.meta.title, description: p.meta.description, type: 'website' },
  }
}

export default async function CompiratPage() {
  const t = await getTranslations('projects')
  const p = t.raw('compirat') as PageMessages

  const config: ProjectPageConfig = {
    hero: {
      title: p.hero.title,
      description: p.hero.description,
      icon: Users,
      ctas: [
        { text: p.hero.cta1, href: '/get-involved/volunteer', variant: 'primary' },
        { text: p.hero.cta2, href: '/contact', variant: 'outline' },
      ],
    },
    sections: [
      {
        title: p.about.title,
        description: p.about.description,
        backgroundColor: 'white',
        layout: 'grid-3',
        cards: p.about.cards.map(c => ({ title: c.title, description: c.description ?? '' })),
      },
      {
        title: p.program.title,
        backgroundColor: 'gray',
        layout: 'grid-2',
        cards: p.program.cards.map(c => ({ title: c.title, description: c.description ?? '', features: c.features })),
      },
    ],
    cta: {
      title: p.cta.title,
      actions: [
        { title: p.cta.actions[0].title, description: p.cta.actions[0].description, href: '/get-involved/volunteer', ctaText: p.cta.actions[0].cta },
        { title: p.cta.actions[1].title, description: p.cta.actions[1].description, href: 'https://www.compirat.ch', ctaText: p.cta.actions[1].cta },
        { title: p.cta.actions[2].title, description: p.cta.actions[2].description, href: '/contact', ctaText: p.cta.actions[2].cta },
      ],
    },
    metadata: { title: p.meta.title, description: p.meta.description },
  }

  return <ProjectPage config={config} />
}
