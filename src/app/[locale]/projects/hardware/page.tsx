import { getTranslations } from 'next-intl/server'
import { ProjectPage, ProjectCallToAction } from '@/components/projects'
import type { ProjectPageConfig } from '@/components/projects/types'

type RawCard = { title: string; description?: string; features?: string[] }
type RawAction = { title: string; description: string; cta: string }
type PageMessages = {
  meta: { title: string; description: string }
  hero: { title: string; description: string; cta1: string; cta2: string }
  overview: { title: string; description: string; cards: RawCard[] }
  projects: { title: string; cards: RawCard[] }
  scsi: { title: string; cards: RawCard[] }
  cta: { title: string; actions: RawAction[] }
}

export async function generateMetadata() {
  const t = await getTranslations('projects')
  const p = t.raw('hardware') as PageMessages
  return { title: p.meta.title, description: p.meta.description }
}

export default async function HardwarePage() {
  const t = await getTranslations('projects')
  const p = t.raw('hardware') as PageMessages

  const config: ProjectPageConfig = {
    hero: {
      title: p.hero.title,
      description: p.hero.description,
      ctas: [
        { text: p.hero.cta1, href: '/get-involved/volunteer', variant: 'primary' },
        { text: p.hero.cta2, href: '/contact', variant: 'outline' },
      ],
    },
    sections: [
      {
        title: p.overview.title,
        description: p.overview.description,
        backgroundColor: 'white',
        layout: 'grid-3',
        cards: p.overview.cards.map(c => ({ title: c.title, description: c.description ?? '' })),
      },
      {
        title: p.projects.title,
        backgroundColor: 'gray',
        layout: 'grid-2',
        cards: p.projects.cards.map(c => ({ title: c.title, description: c.description ?? '', features: c.features })),
      },
      {
        title: p.scsi.title,
        backgroundColor: 'white',
        layout: 'single',
        cards: p.scsi.cards.map(c => ({ title: c.title, description: c.description ?? '', features: c.features })),
      },
    ],
    metadata: { title: p.meta.title, description: p.meta.description },
  }

  return (
    <>
      <ProjectPage config={config} />
      <ProjectCallToAction
        title={p.cta.title}
        actions={[
          { title: p.cta.actions[0].title, description: p.cta.actions[0].description, href: '/get-involved/volunteer', ctaText: p.cta.actions[0].cta },
          { title: p.cta.actions[1].title, description: p.cta.actions[1].description, href: '/get-involved/donate', ctaText: p.cta.actions[1].cta },
          { title: p.cta.actions[2].title, description: p.cta.actions[2].description, href: '/contact', ctaText: p.cta.actions[2].cta },
        ]}
      />
    </>
  )
}
