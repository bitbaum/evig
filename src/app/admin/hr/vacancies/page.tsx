import { Suspense } from 'react'
import { Metadata } from 'next'
import { getHrFunnelStats } from '@/lib/services/hr-analytics'
import HrVacanciesPageClient from './HrVacanciesPageClient'

export const metadata: Metadata = {
  title: 'Offene Stellen',
  description: 'HR-Stellenausschreibungen verwalten',
}

export default async function HrVacanciesPage() {
  const stats = await getHrFunnelStats()
  return <HrVacanciesPageClient stats={stats} />
}
