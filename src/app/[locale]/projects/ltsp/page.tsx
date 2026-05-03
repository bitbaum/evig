import { getTranslations } from 'next-intl/server'
import { ProjectPage } from '@/components/projects'
import type { ProjectPageConfig } from '@/components/projects/types'

type RawCard = { title: string; description?: string; features?: string[] }
type PageMessages = {
  meta: { title: string; description: string }
  hero: { title: string; description: string }
  intro: { cards: RawCard[] }
  details: { cards: RawCard[] }
  start: { cards: RawCard[] }
}

export async function generateMetadata() {
  const t = await getTranslations('projects')
  const p = t.raw('ltsp') as PageMessages
  const title = p.meta.title
  const description = p.meta.description
  return { title, description, openGraph: { title, description, type: 'website' } }
}

export default async function LTSPPage() {
  const t = await getTranslations('projects')
  const p = t.raw('ltsp') as PageMessages

  const config: ProjectPageConfig = {
    hero: {
      title: p.hero.title,
      description: p.hero.description,
      backgroundColor: 'bg-gradient-to-r from-primary-600 to-info-700',
    },
    sections: [
      {
        title: '',
        backgroundColor: 'gray',
        layout: 'grid-2',
        cards: p.intro.cards.map(c => ({ title: c.title, description: c.description ?? '', features: c.features })),
      },
      {
        title: '',
        backgroundColor: 'gray',
        layout: 'grid-3',
        cards: p.details.cards.map(c => ({ title: c.title, description: c.description ?? '', features: c.features })),
      },
      {
        title: '',
        backgroundColor: 'gray',
        layout: 'grid-2',
        cards: p.start.cards.map(c => ({ title: c.title, description: c.description ?? '', features: c.features })),
      },
    ],
    metadata: { title: p.meta.title, description: p.meta.description },
  }

  return <ProjectPage config={config} />
}
