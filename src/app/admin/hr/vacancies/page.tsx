import { Metadata } from 'next'
import HrVacanciesPageClient from './HrVacanciesPageClient'

export const metadata: Metadata = {
  title: 'Offene Stellen',
  description: 'HR-Stellenausschreibungen verwalten',
}

export default function HrVacanciesPage() {
  return <HrVacanciesPageClient />
}
