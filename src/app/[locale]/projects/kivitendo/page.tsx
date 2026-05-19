import { getTranslations } from 'next-intl/server'
import { Database } from 'lucide-react'
import { ProjectPage } from '@/components/projects'
import type { ProjectPageConfig, RawCard, RawAction } from '@/components/projects'

type PageMessages = {
  meta: { title: string; description: string }
  hero: { title: string; description: string }
  why: { title: string; description: string; cards: RawCard[] }
  features: { title: string; description: string; cards: RawCard[] }
  partnership: { title: string; description: string; cards: RawCard[] }
  cta: { title: string; actions: RawAction[] }
}

export async function generateMetadata() {
  const t = await getTranslations('projects')
  const p = t.raw('kivitendo') as PageMessages
  return {
    title: p.meta.title,
    description: p.meta.description,
    openGraph: { title: p.meta.title, description: p.meta.description, type: 'website' },
  }
}

export default async function KivitendoPage() {
  const t = await getTranslations('projects')
  const p = t.raw('kivitendo') as PageMessages

  const config: ProjectPageConfig = {
    hero: {
      title: p.hero.title,
      description: p.hero.description,
      icon: Database,
    },
    sections: [
      {
        title: p.why.title,
        description: p.why.description,
        backgroundColor: 'white',
        layout: 'grid-3',
        cards: p.why.cards.map(c => ({ title: c.title, description: c.description ?? '', features: c.features })),
      },
      {
        title: p.features.title,
        description: p.features.description,
        backgroundColor: 'gray',
        layout: 'grid-2',
        cards: p.features.cards.map(c => ({ title: c.title, description: c.description ?? '', features: c.features })),
      },
      {
        title: p.partnership.title,
        description: p.partnership.description,
        backgroundColor: 'white',
        layout: 'single',
        cards: p.partnership.cards.map(c => ({ title: c.title, description: c.description ?? '', features: c.features })),
      },
    ],
    cta: {
      title: p.cta.title,
      actions: [
        { title: p.cta.actions[0].title, description: p.cta.actions[0].description, href: 'https://www.kivitendo.ch', ctaText: p.cta.actions[0].cta },
        { title: p.cta.actions[1].title, description: p.cta.actions[1].description, href: 'https://forum.kivitendo.de/', ctaText: p.cta.actions[1].cta },
        { title: p.cta.actions[2].title, description: p.cta.actions[2].description, href: '/contact', ctaText: p.cta.actions[2].cta },
      ],
    },
    metadata: { title: p.meta.title, description: p.meta.description },
  }

  return <ProjectPage config={config} />
}
