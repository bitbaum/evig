import { Metadata } from 'next'
import NewVacancyPageClient from './NewVacancyPageClient'
import { requireSection } from '@/lib/admin/guards'

export const metadata: Metadata = {
  title: 'Neue Stelle',
}

export default async function NewVacancyPage() {
  await requireSection('team')
  return <NewVacancyPageClient />
}
