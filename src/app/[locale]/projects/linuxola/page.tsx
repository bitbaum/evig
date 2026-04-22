import { getTranslations } from 'next-intl/server'
import { ProjectPage, ProjectCallToAction } from '@/components/projects'
import type { ProjectPageConfig } from '@/components/projects/types'

type RawCard = { title: string; description?: string; features?: string[] }
type RawAction = { title: string; description: string; cta: string }
type PageMessages = {
  meta: { title: string; description: string }
  hero: { title: string; description: string; cta1: string; cta2: string }
  about: { title: string; description: string }
  impact: { cards: RawCard[] }
  equipment: { title: string; cards: RawCard[] }
  cta: { title: string; actions: RawAction[] }
}

export async function generateMetadata() {
  const t = await getTranslations('projects')
  const p = t.raw('linuxola') as PageMessages
  return { title: p.meta.title, description: p.meta.description }
}

export default async function LinuxolaPage() {
  const t = await getTranslations('projects')
  const p = t.raw('linuxola') as PageMessages

  const config: ProjectPageConfig = {
    hero: {
      title: p.hero.title,
      description: p.hero.description,
      ctas: [
        { text: p.hero.cta1, href: '/get-involved/donate', variant: 'primary' },
        { text: p.hero.cta2, href: '/get-involved/volunteer', variant: 'outline' },
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
        title: '',
        backgroundColor: 'gray',
        layout: 'grid-2',
        cards: p.impact.cards.map(c => ({ title: c.title, description: c.description ?? '', features: c.features })),
      },
      {
        title: p.equipment.title,
        backgroundColor: 'white',
        layout: 'grid-3',
        cards: p.equipment.cards.map(c => ({ title: c.title, description: c.description ?? '', features: c.features })),
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
          { title: p.cta.actions[0].title, description: p.cta.actions[0].description, href: '/get-involved/donate', ctaText: p.cta.actions[0].cta },
          { title: p.cta.actions[1].title, description: p.cta.actions[1].description, href: '/get-involved/volunteer', ctaText: p.cta.actions[1].cta },
          { title: p.cta.actions[2].title, description: p.cta.actions[2].description, href: '/contact', ctaText: p.cta.actions[2].cta },
        ]}
      />
    </>
  )
}
