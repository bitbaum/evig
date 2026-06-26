import { Metadata } from 'next'
import NewVacancyPageClient from './NewVacancyPageClient'

export const metadata: Metadata = {
  title: 'Neue Stelle',
}

export default function NewVacancyPage() {
  return <NewVacancyPageClient />
}
