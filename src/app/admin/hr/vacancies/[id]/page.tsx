import { Metadata } from 'next'
import VacancyDetailPageClient from './VacancyDetailPageClient'

export const metadata: Metadata = {
  title: 'Stelle bearbeiten',
}

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function VacancyDetailPage({ params }: PageProps) {
  const { id } = await params
  return <VacancyDetailPageClient id={id} />
}
