import { Metadata } from 'next'
import ImpactPageContent from './content'

export const metadata: Metadata = {
  title: 'Unsere Wirkung - RevampIT',
  description: 'Entdecke die messbare Wirkung von RevampIT auf Umwelt und Gesellschaft. Unterstütze unsere Mission für nachhaltige IT.',
}

export default function ImpactPage() {
  return <ImpactPageContent />
}

