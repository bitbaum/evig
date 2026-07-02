import { Metadata } from 'next'
import VacancyDetailPageClient from './VacancyDetailPageClient'
import { requireSection } from '@/lib/admin/guards'

export const metadata: Metadata = {
  title: 'Stelle bearbeiten',
}

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function VacancyDetailPage({ params }: PageProps) {
  await requireSection('team')
  const { id } = await params
  return <VacancyDetailPageClient id={id} />
}
