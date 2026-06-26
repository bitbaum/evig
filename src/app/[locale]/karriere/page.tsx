export const dynamic = 'force-dynamic'

import { Metadata } from 'next'
import { Briefcase } from 'lucide-react'
import { ORG } from '@/config/org'
import { PageHero } from '@/components/layout/PageHero'
import { listPublicVacancies } from '@/lib/services/hr-vacancies'
import type { RoleTrack } from '@/config/hr-vacancies'
import CareersListClient from './CareersListClient'

interface PageProps {
  params: Promise<{ locale: string }>
  searchParams: Promise<{ track?: string }>
}

export async function generateMetadata(): Promise<Metadata> {
  const title = `Karriere | ${ORG.name}`
  const description = 'Offene Stellen bei RevampIT — Freiwilligenarbeit, Praktika und Anstellungen.'
  return {
    title: { absolute: title },
    description,
    openGraph: { title, description, type: 'website' },
  }
}

export default async function CareersPage({ searchParams }: PageProps) {
  const { track } = await searchParams
  const postings = await listPublicVacancies({
    role_track: track as RoleTrack | undefined,
  })

  return (
    <main className="min-h-screen">
      <PageHero
        theme="getInvolved"
        icon={Briefcase}
        title="Karriere bei RevampIT"
        subtitle="Mach mit — ob Freiwilligenarbeit, Praktikum, Wiedereinstieg oder Festanstellung."
      />

      <section className="py-16 sm:py-20">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <CareersListClient
            postings={postings}
            activeTrack={track ?? null}
          />
        </div>
      </section>
    </main>
  )
}
