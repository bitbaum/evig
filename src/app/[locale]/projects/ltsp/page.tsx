import { getTranslations } from 'next-intl/server'
import { Server } from 'lucide-react'
import { ProjectPage } from '@/components/projects'
import type { ProjectPageConfig, RawCard, RawAction } from '@/components/projects'

type PageMessages = {
  meta: { title: string; description: string }
  hero: { title: string; description: string }
  intro: { cards: RawCard[] }
  details: { cards: RawCard[] }
  start: { cards: RawCard[] }
  cta: { title: string; actions: RawAction[] }
}

export async function generateMetadata() {
  const t = await getTranslations('projects')
  const p = t.raw('ltsp') as PageMessages
  return {
    title: p.meta.title,
    description: p.meta.description,
    openGraph: { title: p.meta.title, description: p.meta.description, type: 'website' },
  }
}

export default async function LTSPPage() {
  const t = await getTranslations('projects')
  const p = t.raw('ltsp') as PageMessages

  const config: ProjectPageConfig = {
    hero: {
      title: p.hero.title,
      description: p.hero.description,
      icon: Server,
    },
    sections: [
      {
        backgroundColor: 'white',
        layout: 'grid-2',
        cards: p.intro.cards.map(c => ({ title: c.title, description: c.description ?? '', features: c.features })),
      },
      {
        backgroundColor: 'gray',
        layout: 'grid-3',
        cards: p.details.cards.map(c => ({ title: c.title, description: c.description ?? '', features: c.features })),
      },
      {
        backgroundColor: 'white',
        layout: 'grid-2',
        cards: p.start.cards.map(c => ({ title: c.title, description: c.description ?? '', features: c.features })),
      },
    ],
    cta: {
      title: p.cta.title,
      actions: [
        { title: p.cta.actions[0].title, description: p.cta.actions[0].description, href: '/get-involved/volunteer', ctaText: p.cta.actions[0].cta },
        { title: p.cta.actions[1].title, description: p.cta.actions[1].description, href: 'https://ltsp.org', ctaText: p.cta.actions[1].cta },
        { title: p.cta.actions[2].title, description: p.cta.actions[2].description, href: '/contact', ctaText: p.cta.actions[2].cta },
      ],
    },
    metadata: { title: p.meta.title, description: p.meta.description },
  }

  return <ProjectPage config={config} />
}
