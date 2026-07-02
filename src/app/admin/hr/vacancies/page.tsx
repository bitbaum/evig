import { Suspense } from 'react'
import { Metadata } from 'next'
import { getHrFunnelStats } from '@/lib/services/hr-analytics'
import { requireSection } from '@/lib/admin/guards'
import HrVacanciesPageClient from './HrVacanciesPageClient'

export const metadata: Metadata = {
  title: 'Offene Stellen',
  description: 'HR-Stellenausschreibungen verwalten',
}

export default async function HrVacanciesPage() {
  await requireSection('team')
  const stats = await getHrFunnelStats()
  return <HrVacanciesPageClient stats={stats} />
}
