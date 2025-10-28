import { Metadata } from 'next'
import ImpactPageContent from './content'

export const metadata: Metadata = {
  title: 'Unsere Wirkung - RevampIT',
  description: 'Entdecken Sie die messbare Wirkung von RevampIT auf Umwelt und Gesellschaft. Unterstützen Sie unsere Mission für nachhaltige IT.',
}

export default function ImpactPage() {
  return <ImpactPageContent />
}

